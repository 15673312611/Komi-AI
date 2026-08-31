/*
Copyright 2024-2026 ChatterMate

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { ref } from 'vue'
import { io, Socket } from 'socket.io-client'
import type { HumanAgent, SocketError } from '../types/widget'
import { getErrorMessage } from '../types/widget'
import { widgetEnv } from '../webclient/widget-env'
import type { Message } from '@/types/chat'

type ConnectionStatus = 'connected' | 'connecting' | 'failed'

export function useWidgetSocket() {
    const messages = ref<Message[]>([])
    const loading = ref(false)
    const errorMessage = ref('')
    const showError = ref(false)
    const loadingHistory = ref(false)
    const hasStartedChat = ref(false)
    const connectionStatus = ref<ConnectionStatus>('connecting')
    const retryCount = ref(0)
    const MAX_RETRIES = 5
    const humanAgent = ref<HumanAgent>({})
    const currentForm = ref<any>(null)
    const currentSessionId = ref<string>('')
    const processedResponseKeys = new Set<string>()
    let errorHideTimer: ReturnType<typeof setTimeout> | null = null
    let historyTimeout: ReturnType<typeof setTimeout> | null = null
    let endingChat = false

    // The typing indicator is driven solely by the server's `bot_typing`
    // event. The widget never guesses: a reply it optimistically waited for is
    // exactly how the dots ended up spinning forever whenever nothing was
    // going to answer (AI switched off, a human handling it, a queued chat).
    let botTypingTimeout: ReturnType<typeof setTimeout> | null = null

    /** Last resort: a backend that dies mid-reply must not strand the dots. */
    const BOT_TYPING_TIMEOUT_MS = 60_000

    const stopBotTyping = () => {
        loading.value = false
        if (botTypingTimeout) {
            clearTimeout(botTypingTimeout)
            botTypingTimeout = null
        }
    }

    const startBotTyping = () => {
        loading.value = true
        if (botTypingTimeout) clearTimeout(botTypingTimeout)
        botTypingTimeout = setTimeout(stopBotTyping, BOT_TYPING_TIMEOUT_MS)
    }

    const safeIsoTimestamp = (value: unknown): string => {
        const date = new Date(typeof value === 'string' || typeof value === 'number' ? value : NaN)
        return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
    }

    const safeMessageText = (value: unknown): string => typeof value === 'string' ? value : ''

    const responseKey = (data: any): string => String(
        data.message_id ||
        data.client_message_id ||
        data.attributes?.client_message_id ||
        `${data.session_id || ''}-${data.created_at || ''}-${data.type || data.message_type || ''}-${safeMessageText(data.message)}`
    )

    const rememberResponse = (key: string): boolean => {
        if (processedResponseKeys.has(key)) return false
        processedResponseKeys.add(key)
        if (processedResponseKeys.size > 1000) {
            const first = processedResponseKeys.values().next().value
            if (first) processedResponseKeys.delete(first)
        }
        return true
    }

    const createImagePreviewUrl = (content: unknown, contentType: string): string => {
        if (typeof content !== 'string' || !content || !contentType.startsWith('image/')) return ''
        try {
            const encoded = content.includes(',') ? content.slice(content.indexOf(',') + 1) : content
            const byteCharacters = atob(encoded)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            return URL.createObjectURL(new Blob([new Uint8Array(byteNumbers)], { type: contentType }))
        } catch (error) {
            console.warn('Unable to create attachment preview:', error)
            return ''
        }
    }

    let socket: Socket | null = null
    let onTakeoverCallback: ((data: { session_id: string, user_name: string }) => void) | null = null
    let onWorkflowStateCallback: ((data: any) => void) | null = null
    let onWorkflowProceededCallback: ((data: any) => void) | null = null
    let widgetToken: string | undefined = undefined
    let widgetIdAuth: string | undefined = undefined

    // Store token for socket authentication
    const setToken = (token: string | undefined) => {
        widgetToken = token
        if (token) {
            try {
                localStorage.setItem('ctid', token)
            } catch {
                // Storage can be unavailable in privacy-restricted iframes.
            }
        }
    }

    // Store widget ID for socket authentication (for anonymous access)
    const setWidgetId = (widgetId: string | undefined) => {
        widgetIdAuth = widgetId
    }

    const getStoredToken = (): string | null => {
        try {
            return localStorage.getItem('ctid')
        } catch {
            return null
        }
    }

    const initializeSocket = (sessionId: string) => {
        // Use passed token first, then stored token, then localStorage
        const token = widgetToken || getStoredToken()
        
        // Build auth object with token and widget_id
        const auth: any = {}
        if (token) {
            auth.conversation_token = token
        }
        if (widgetIdAuth) {
            auth.widget_id = widgetIdAuth
        }
        // Host page embedding the widget, recorded server-side on lead capture
        // (lead_source.page_url). The widget runs in a srcdoc iframe, so the parent
        // page is same-origin when embedded via chattermate.js; fall back to referrer.
        try {
            auth.page_url = (window.parent !== window && window.parent.location?.href)
                ? window.parent.location.href
                : (document.referrer || window.location.href)
        } catch {
            auth.page_url = document.referrer || ''
        }
        
        const wsUrl = (widgetEnv.WS_URL || '').replace(/^ws(s)?:/i, 'http$1:')
        const nextSocket = io(`${wsUrl}/widget`, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: MAX_RETRIES,
            reconnectionDelay: 1000,
            timeout: 8000,
            auth: Object.keys(auth).length > 0 ? auth : undefined
        })
        socket = nextSocket

        // Set up event listeners
        socket.on('connect', () => {
            connectionStatus.value = 'connected'
            
            retryCount.value = 0
        })

        // A reply is actually being produced now.
        socket.on('bot_typing', () => {
            startBotTyping()
        })

        socket.on('disconnect', () => {
            // Nothing can arrive to clear it while we are disconnected.
            stopBotTyping()

            if (connectionStatus.value === 'connected') {
                console.log('Socket disconnected, setting connection status to connecting')
                connectionStatus.value = 'connecting'
            }
        })

        socket.on('connect_error', () => {
            retryCount.value++
            console.error('Socket connection failed, attempt:', retryCount.value, 'connection status:', connectionStatus.value)
            if (retryCount.value >= MAX_RETRIES) {
               
                connectionStatus.value = 'failed'
            }
        })

        nextSocket.on('chat_response', (data) => {
            if (!data || typeof data !== 'object') {
                stopBotTyping()
                return
            }
            if (!rememberResponse(responseKey(data))) return
            stopBotTyping() // the reply we were waiting for has arrived
            const sessionId = typeof data.session_id === 'string' ? data.session_id : ''
            const createdAt = new Date().toISOString()
            
            // Capture session_id from response for file attachments
            if (sessionId) {
                console.log('Captured session_id from chat_response:', sessionId)
                currentSessionId.value = sessionId
            } else {
                console.warn('No session_id in chat_response data:', data)
            }

            if (data.type === 'agent_message') {
                // Handle human agent messages
                const agentMessage: any = {
                    message: safeMessageText(data.message),
                    message_type: 'agent',
                    created_at: createdAt,
                    session_id: sessionId,
                    agent_name: typeof data.agent_name === 'string' ? data.agent_name : undefined,
                    stream: true, // live reply → client-side typewriter reveal
                    attributes: {
                        client_message_id: data.client_message_id,
                        end_chat: data.end_chat,
                        end_chat_reason: data.end_chat_reason,
                        end_chat_description: data.end_chat_description,
                        request_rating: data.request_rating
                    }
                }
                
                // Add attachments if present
                if (Array.isArray(data.attachments)) {
                    const messageId = typeof data.message_id === 'number' ? data.message_id : Date.now()
                    agentMessage.id = typeof data.message_id === 'number' ? data.message_id : undefined
                    agentMessage.attachments = data.attachments
                        .filter((att: any) => att && typeof att === 'object')
                        .map((att: any, idx: number) => ({
                            id: messageId * 1000 + idx,
                            filename: typeof att.filename === 'string' ? att.filename : 'attachment',
                            file_url: typeof att.file_url === 'string' ? att.file_url : '',
                            content_type: typeof att.content_type === 'string' ? att.content_type : 'application/octet-stream',
                            file_size: typeof att.file_size === 'number' ? att.file_size : 0
                        }))
                }
                
                messages.value.push(agentMessage)
            // UPDATED CHECK: Look for the shopify_output object and products array
            } else if (data.shopify_output && typeof data.shopify_output === 'object' && Array.isArray(data.shopify_output.products)) {
                // Handle structured Shopify product data
                messages.value.push({
                    message: safeMessageText(data.message), // Keep the accompanying text message
                    message_type: 'product', // Use 'product' type for rendering
                    created_at: createdAt,
                    session_id: sessionId,
                    agent_name: typeof data.agent_name === 'string' ? data.agent_name : undefined,
                    // Assign the whole structured object
                    shopify_output: data.shopify_output, 
                    // Remove the old flattened fields (product_id, product_title, etc.)
                    attributes: { // Keep other attributes if needed
                         client_message_id: data.client_message_id,
                         end_chat: data.end_chat,
                         request_rating: data.request_rating
                    }
                })
            } else {
                // Handle regular bot messages (without Shopify data)
                messages.value.push({
                    message: safeMessageText(data.message),
                    message_type: 'bot',
                    created_at: createdAt,
                    session_id: sessionId,
                    agent_name: typeof data.agent_name === 'string' ? data.agent_name : undefined,
                    stream: true, // live reply → client-side typewriter reveal
                    // Knowledge-base citations (display gated by show_citations in the widget)
                    sources: Array.isArray(data.sources) && data.sources.length ? data.sources : undefined,
                    attributes: {
                        client_message_id: data.client_message_id,
                        end_chat: data.end_chat,
                        end_chat_reason: data.end_chat_reason,
                        end_chat_description: data.end_chat_description,
                        request_rating: data.request_rating
                    }
                })
            }
            // loading.value = false // Moved to the top
        })

        socket.on('handle_taken_over', (data: { session_id: string, user_name: string, profile_picture?: string }) => {
            if (!data || typeof data.session_id !== 'string' || !data.session_id) return
            const userName = typeof data.user_name === 'string' && data.user_name.trim()
                ? data.user_name.trim()
                : 'Human agent'
            // Add system message for takeover
            messages.value.push({
                message: `${userName} joined the conversation`,
                message_type: 'system',
                created_at: new Date().toISOString(),
                session_id: data.session_id
            })

            
            humanAgent.value = {
                ...humanAgent.value,
                human_agent_name: userName,
                human_agent_profile_pic: typeof data.profile_picture === 'string' ? data.profile_picture : undefined
            }

            // Whatever we were waiting on, it is not coming: the bot is out of
            // this conversation now. Without this the typing dots spin forever
            // above the "joined the conversation" line.
            stopBotTyping()

            // Call the callback if registered
            if (onTakeoverCallback) {
                onTakeoverCallback(data)
            }
        })

        socket.on('session_initialized', (data) => {
            // Capture session_id immediately upon connection
            if (data && typeof data.session_id === 'string' && data.session_id) {
                console.log('Initialized session_id from session_initialized:', data.session_id)
                currentSessionId.value = data.session_id
            }
        })

        socket.on('error', handleError)
        socket.on('chat_history', handleChatHistory)
        socket.on('rating_submitted', handleRatingSubmitted)
        socket.on('display_form', handleDisplayForm)
        socket.on('form_submitted', handleFormSubmitted)
        socket.on('workflow_state', handleWorkflowState)
        socket.on('workflow_proceeded', handleWorkflowProceeded)

        return socket
    }

    const connect = async (): Promise<boolean> => {
        try {
            connectionStatus.value = 'connecting'
            retryCount.value = 0

            // Cleanup existing socket if any
            stopBotTyping()
            if (socket) {
                socket.removeAllListeners()
                socket.disconnect()
                socket = null
            }

            socket = initializeSocket('')

            return new Promise((resolve) => {
                let resolved = false

                const timer = setTimeout(() => {
                    if (!resolved) {
                        resolved = true
                        const isConn = socket?.connected ?? false
                        connectionStatus.value = isConn ? 'connected' : 'failed'
                        resolve(isConn)
                    }
                }, 5000)

                socket?.once('connect', () => {
                    if (!resolved) {
                        resolved = true
                        clearTimeout(timer)
                        connectionStatus.value = 'connected'
                        resolve(true)
                    }
                })

                socket?.on('connect_error', (err: any) => {
                    console.warn('Socket connect error:', err)
                    if (retryCount.value >= 2 && !resolved) {
                        resolved = true
                        clearTimeout(timer)
                        connectionStatus.value = 'failed'
                        resolve(false)
                    }
                })

                socket?.on('error', (err: any) => {
                    console.warn('Socket error from server:', err)
                    if (err?.type === 'ai_config_missing' || err?.type === 'auth_error') {
                        errorMessage.value = err?.error || 'AI 配置缺失或认证失败'
                        if (!resolved) {
                            resolved = true
                            clearTimeout(timer)
                            connectionStatus.value = 'failed'
                            resolve(false)
                        }
                    }
                })
            })
        } catch (error) {
            console.error('Socket initialization failed:', error)
            connectionStatus.value = 'failed'
            return false
        }
    }

    // Manual reconnect function
    const reconnect = () => {
        if (socket) {
            socket.disconnect()
        }
        return connect()
    }

    // Register takeover callback
    const onTakeover = (callback: (data: { session_id: string, user_name: string }) => void) => {
        onTakeoverCallback = callback
    }

    // Register workflow state callback
    const onWorkflowState = (callback: (data: any) => void) => {
        onWorkflowStateCallback = callback
    }

    // Register workflow proceeded callback
    const onWorkflowProceeded = (callback: (data: any) => void) => {
        onWorkflowProceededCallback = callback
    }

    // Socket event handlers
    const handleError = (error: any) => {
        stopBotTyping()
        const errorType = error?.type === 'connection_error' || error?.type === 'auth_error' ||
            error?.type === 'chat_error' || error?.type === 'ai_config_missing'
            ? error.type
            : 'chat_error'
        errorMessage.value = getErrorMessage({
            type: errorType,
            error: typeof error?.error === 'string' ? error.error : undefined
        } as SocketError)
        showError.value = true
        
        // Hide error after 5 seconds
        if (errorHideTimer) clearTimeout(errorHideTimer)
        errorHideTimer = setTimeout(() => {
            showError.value = false
            errorMessage.value = ''
            errorHideTimer = null
        }, 5000)
    }

    const handleChatHistory = (data: {
        type: string;
        messages: Message[];
    }) => {
        if (data?.type === 'chat_history' && Array.isArray(data.messages)) {
            if (historyTimeout) clearTimeout(historyTimeout)
            historyTimeout = null
            loadingHistory.value = false
            const historyMessages = data.messages
                .filter((msg): msg is Message => !!msg && typeof msg === 'object')
                .map((msg: Message) => {
                // Base message structure
                const messageObj = {
                    message: safeMessageText(msg.message),
                    message_type: typeof msg.message_type === 'string' ? msg.message_type : 'bot',
                    created_at: safeIsoTimestamp(msg.created_at),
                    session_id: typeof msg.session_id === 'string' ? msg.session_id : '',
                    agent_name: typeof msg.agent_name === 'string' ? msg.agent_name : '',
                    user_name: typeof msg.user_name === 'string' ? msg.user_name : '',
                    attributes: msg.attributes && typeof msg.attributes === 'object' ? msg.attributes : {},
                    attachments: Array.isArray(msg.attachments) ? msg.attachments : [] // Include attachments
                }

                // Restore knowledge-base citations persisted in attributes
                if (Array.isArray(msg.attributes?.sources) && msg.attributes.sources.length) {
                    ;(messageObj as Message).sources = msg.attributes.sources
                }

                // Check if message has Shopify data in attributes
                if (msg.attributes?.shopify_output && typeof msg.attributes.shopify_output === 'object' && Array.isArray(msg.attributes.shopify_output.products)) {
                    return {
                        ...messageObj,
                        message_type: 'product',
                        shopify_output: msg.attributes.shopify_output
                    }
                }

                return messageObj
                })

            messages.value = [
                ...historyMessages.filter(newMsg => 
                    !messages.value.some(existingMsg => 
                        existingMsg.message === newMsg.message && 
                        existingMsg.created_at === newMsg.created_at
                    )
                ),
                ...messages.value
            ]
        }
    }

    // Add rating submission handler
    const handleRatingSubmitted = (data: { success: boolean, message: string }) => {
        if (data?.success) {
            messages.value.push({
            message: 'Thank you for your feedback!',
            message_type: 'system',
            created_at: new Date().toISOString(),
            session_id: currentSessionId.value
            })
        }
    }


    // Form display handler
    const handleDisplayForm = (data: { form_data: any, session_id: string }) => {
        if (!data || !data.form_data || typeof data.form_data !== 'object') return
        console.log('Form display handler in composable:', data)
        stopBotTyping()
        currentForm.value = data.form_data
        console.log('Set currentForm in handleDisplayForm:', currentForm.value)
        
        // Check if this is a full screen form
        if (data.form_data?.form_full_screen === true) {
            console.log('Full screen form detected, triggering workflow state callback')
            // Trigger workflow state callback for full screen forms
            if (onWorkflowStateCallback) {
                onWorkflowStateCallback({
                    type: 'form',
                    form_data: data.form_data,
                    session_id: data.session_id
                })
            }
        } else {
            // Add form message to chat for regular forms
            messages.value.push({
                message: '',
                message_type: 'form',
                created_at: new Date().toISOString(),
                session_id: data.session_id,
                attributes: {
                    form_data: data.form_data
                }
            })
        }
    }

    // Form submission confirmation handler
    const handleFormSubmitted = (data: { success: boolean, message: string }) => {
        console.log('Form submitted confirmation received, clearing currentForm')
        currentForm.value = null
        if (data?.success) {
            // Success message will come through regular chat_response
            console.log('Form submitted successfully')
        }
    }

    // Workflow state handler
    const handleWorkflowState = (data: any) => {
        if (!data || typeof data !== 'object') return
        console.log('Workflow state received in composable:', data)
        
        // Set currentForm for form states to ensure submission works
        if (data.type === 'form' || data.type === 'display_form') {
            console.log('Setting currentForm from workflow state:', data.form_data)
            currentForm.value = data.form_data
        }
        
        if (onWorkflowStateCallback) {
            onWorkflowStateCallback(data)
        }
    }

    // Workflow proceeded handler
    const handleWorkflowProceeded = (data: { success: boolean }) => {
        if (!data || typeof data !== 'object') return
        console.log('Workflow proceeded in composable:', data)
        if (onWorkflowProceededCallback) {
            onWorkflowProceededCallback(data)
        }
    }

    // Add rating submission function
    const submitRating = async (rating: number, feedback?: string): Promise<boolean> => {
        if (!socket?.connected || !Number.isFinite(rating) || rating < 1 || rating > 5) return false
        
        socket.emit('submit_rating', {
            rating,
            feedback
        })
        return true
    }

    // Form submission function
    const submitForm = async (formData: Record<string, any>): Promise<boolean> => {
        console.log('Submitting form in socket:', formData)
        console.log('Current form in socket:', currentForm.value)
        console.log('Socket in socket:', socket)
        
        if (!socket?.connected) {
            console.error('No socket available for form submission')
            return false
        }
        
        // Allow submission even if currentForm.value is null, as long as we have form data
        if (!formData || Object.keys(formData).length === 0) {
            console.error('No form data to submit')
            return false
        }
        
        // Handoff contact-capture forms go to a dedicated handler (updates the customer
        // record) instead of the workflow form pipeline.
        const isContactForm = currentForm.value?.form_type === 'contact'
        const event = isContactForm ? 'submit_contact_info' : 'submit_form'
        console.log(`Emitting ${event} event with data:`, formData)
        socket.emit(event, {
            form_data: formData
        })

        // Clear current form after submission
        currentForm.value = null
        return true
    }

    // Get workflow state function
    const getWorkflowState = async () => {
        if (!socket?.connected) return
        console.log('Getting workflow state 12')
        socket.emit('get_workflow_state')
    }

    // Proceed workflow function
    const proceedWorkflow = async (): Promise<boolean> => {
        if (!socket?.connected) return false
        
        socket.emit('proceed_workflow', {})
        return true
    }

    // Send message function
    const sendMessage = async (newMessage: string, email: string, files: Array<{content: string, filename: string, content_type?: string, size: number}> = []): Promise<boolean> => {
        if (!socket?.connected || typeof newMessage !== 'string') return false
        const safeFiles = Array.isArray(files) ? files.filter(file => file && typeof file === 'object') : []
        if (!newMessage.trim() && safeFiles.length === 0) return false
        
        // Add user message to display with temporary blob URLs for images
        const userMessage: any = {
            message: newMessage,
            message_type: 'user',
            created_at: new Date().toISOString(),
            session_id: currentSessionId.value
        }
        
        // Add temporary attachments for immediate display (will be replaced with real URLs from backend)
        if (safeFiles.length > 0) {
            userMessage.attachments = safeFiles.map((file, idx) => {
                // Create temporary blob URL for images
                const contentType = typeof file.content_type === 'string' && file.content_type
                    ? file.content_type
                    : 'application/octet-stream'
                const tempUrl = createImagePreviewUrl(file.content, contentType)
                
                return {
                    id: Date.now() * 1000 + idx, // Temporary ID
                    filename: typeof file.filename === 'string' ? file.filename : 'attachment',
                    file_url: tempUrl, // Temporary blob URL, will be replaced
                    content_type: contentType,
                    file_size: typeof file.size === 'number' ? file.size : 0,
                    _isTemporary: true // Flag to identify temporary attachments
                }
            })
        }
        
        messages.value.push(userMessage)

        // Emit to socket WITH files (files will be uploaded on backend)
        socket.emit('chat', {
            message: newMessage,
            email: email,
            files: safeFiles.map(file => ({
                content: typeof file.content === 'string' ? file.content : '',
                filename: typeof file.filename === 'string' ? file.filename : 'attachment',
                content_type: typeof file.content_type === 'string' ? file.content_type : 'application/octet-stream',
                size: typeof file.size === 'number' ? file.size : 0,
            }))
        })

        hasStartedChat.value = true
        return true
    }
    

    /**
     * Close the current session server-side and reset local conversation state.
     *
     * History is scoped to the ACTIVE session (see get_chat_history), so closing it
     * is what makes the next conversation genuinely new rather than a reload of the
     * old one. Resolves when the server confirms, or after a short grace period so a
     * dropped confirmation can't leave the visitor staring at a dead button.
     */
    const resetConversationState = () => {
        messages.value.forEach(message => {
            message.attachments?.forEach(attachment => {
                if (typeof attachment.file_url === 'string' && attachment.file_url.startsWith('blob:')) {
                    URL.revokeObjectURL(attachment.file_url)
                }
            })
        })
        messages.value = []
        hasStartedChat.value = false
        currentSessionId.value = ''
        // A reply in flight never lands once the session closes, so the typing
        // indicator would spin forever over an empty chat.
        stopBotTyping()
        currentForm.value = null
    }

    // Must be a member of EndChatReasonType (backend/app/models/session_to_agent.py):
    // the column is an enum, and an unknown value makes close_session roll back and
    // silently leave the session open.
    const endChat = (reason = 'CUSTOMER_REQUEST'): Promise<void> => {
        return new Promise((resolve) => {
            if (endingChat) {
                resolve()
                return
            }
            endingChat = true
            const activeSocket = socket
            if (!activeSocket || !activeSocket.connected) {
                // Nothing to close server-side from here; still clear locally so the
                // control does something visible rather than appearing broken.
                resetConversationState()
                endingChat = false
                resolve()
                return
            }
            let settled = false
            const finish = () => {
                if (settled) return
                settled = true
                clearTimeout(timer)
                activeSocket.off('chat_ended', finish)
                resetConversationState()
                endingChat = false
                resolve()
            }
            const timer = setTimeout(finish, 3000)
            activeSocket.on('chat_ended', finish)
            activeSocket.emit('end_chat', { reason })
        })
    }

    // Chat history functions
    const loadChatHistory = async () => {
        if (!socket?.connected) return

        try {
            loadingHistory.value = true
            if (historyTimeout) clearTimeout(historyTimeout)
            historyTimeout = setTimeout(() => {
                loadingHistory.value = false
                historyTimeout = null
            }, 8000)
            socket.emit('get_chat_history')
        } catch (error) {
            console.error('Failed to load chat history:', error)
            loadingHistory.value = false
            if (historyTimeout) clearTimeout(historyTimeout)
            historyTimeout = null
        }
    }

    const cleanup = () => {
        // Before removeAllListeners, or the disconnect handler that would have
        // done it never fires and the timer outlives the widget.
        stopBotTyping()
        if (errorHideTimer) clearTimeout(errorHideTimer)
        if (historyTimeout) clearTimeout(historyTimeout)
        errorHideTimer = null
        historyTimeout = null
        endingChat = false
        if (socket) {
            socket.removeAllListeners()
            socket.disconnect()
            socket = null
        }
        onTakeoverCallback = null
        onWorkflowStateCallback = null
        onWorkflowProceededCallback = null
    }

    return {
        messages,
        loading,
        errorMessage,
        showError,
        loadingHistory,
        hasStartedChat,
        connectionStatus,
        sendMessage,
        endChat,
        loadChatHistory,
        connect,
        reconnect,
        cleanup,
        humanAgent,
        onTakeover,
        submitRating,
        currentForm,
        submitForm,
        getWorkflowState,
        proceedWorkflow,
        onWorkflowState,
        onWorkflowProceeded,
        currentSessionId,
        setToken,
        setWidgetId
    }
}
