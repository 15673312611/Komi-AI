<!--
Copyright 2024-2026 Komi AI

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

<script setup lang="ts">
import { ref, watch, onMounted, computed, onUnmounted, nextTick } from 'vue'
import type { AgentWithCustomization, AgentCustomization, ChatStyle } from '@/types/agent'
import { agentService } from '@/services/agent'
import WebFont from 'webfontloader'
import { useSubscriptionStorage } from '@/utils/storage'
import { useEnterpriseFeatures } from '@/composables/useEnterpriseFeatures'
import { getGoogleFontsApiKey } from '@/config/api'
import { AI_DISCLAIMER_TEXT } from '@/utils/aiDisclaimer'

const props = defineProps<{
    agent: AgentWithCustomization
}>()

const emit = defineEmits<{
    (e: 'cancel'): void
    (e: 'preview', customization: AgentCustomization & { showBubblePreview?: boolean; showInitiationPreview?: boolean }): void
    (e: 'chat-style-changed', oldStyle: ChatStyle, newStyle: ChatStyle): void
}>()

// Predefined chat initiation messages
const DEFAULT_CHAT_INITIATIONS = [
    "👋 您好！有什么可以帮您的？随时向我提问！",
    "💬 遇到任何疑问？我随时在线为您解答！",
    "🤝 欢迎光临！今天有什么需要我协助的吗？",
    "✨ 了解更多详情？点击开始聊聊吧！",
    "👨‍💼 需要客服支持？点击立即与我沟通！"
]

// Predefined quick-action buttons (clicking sends the label as a message)
const DEFAULT_QUICK_ACTIONS = [
    "📦 查询我的订单物流",
    "🔄 申请退换货",
    "👤 转接人工客服"
]

// Subscription and feature checking
const subscriptionStorage = useSubscriptionStorage()
const { hasEnterpriseModule } = useEnterpriseFeatures()
const currentSubscription = computed(() => subscriptionStorage.getCurrentSubscription())
const isSubscriptionActive = computed(() => subscriptionStorage.isSubscriptionActive())

// Check if chat initiations feature is locked (only if enterprise module exists)
const isChatInitiationsLocked = computed(() => {
    // Only lock if enterprise module exists
    if (!hasEnterpriseModule) {
        return false
    }
    
    if (!currentSubscription.value || !isSubscriptionActive.value) {
        return true
    }
    
    // Check if chat_initiation feature exists in subscription
    const hasChatInitiationFeature = subscriptionStorage.hasFeature('chat_initiation')
    if (!hasChatInitiationFeature) {
        return true // Lock chat initiations if feature doesn't exist
    }
    
    return false
})

// Upgrade handler
const handleUpgrade = () => {
    // Only redirect to subscription page if enterprise module exists
    if (hasEnterpriseModule) {
        window.location.href = '/settings/subscription'
    }
}

const customization = ref<AgentCustomization>({
    id: props.agent.customization?.id ?? 0,
    agent_id: props.agent.id,
    chat_background_color: props.agent.customization?.chat_background_color ?? '#F8F9FA',
    chat_text_color: props.agent.customization?.chat_text_color ?? '#212529',
    chat_bubble_color: props.agent.customization?.chat_bubble_color ?? '#E9ECEF',
    icon_color: props.agent.customization?.icon_color ?? '#6C757D',
    accent_color: props.agent.customization?.accent_color ?? '#C9F24E',
    font_family: props.agent.customization?.font_family ?? 'Inter, system-ui, sans-serif',
    photo_url: props.agent.customization?.photo_url,
    custom_css: props.agent.customization?.custom_css,
    customization_metadata: props.agent.customization?.customization_metadata ?? {},
    chat_style: props.agent.customization?.chat_style ?? 'CHATBOT',
    welcome_title: props.agent.customization?.welcome_title ?? '',
    welcome_subtitle: props.agent.customization?.welcome_subtitle ?? '',
    welcome_message: props.agent.customization?.welcome_message ?? '',
    chat_initiation_messages: props.agent.customization?.chat_initiation_messages ?? [],
    quick_actions: props.agent.customization?.quick_actions ?? [],
    show_citations: props.agent.customization?.show_citations ?? false,
    collect_email: props.agent.customization?.collect_email ?? false,
    show_ai_disclaimer: props.agent.customization?.show_ai_disclaimer ?? true,
    allow_new_chat: props.agent.customization?.allow_new_chat ?? false,
})

// Chat style options grouped into Legacy (existing looks) and New (premium presets)
const chatStyleOptions = [
    {
        value: 'CHATBOT' as ChatStyle,
        label: '经典客服 (Classic)',
        description: '经典浅色外观 — 简洁、中性、标准的网页客服形态。',
        group: 'legacy' as const,
    },
    {
        value: 'ASK_ANYTHING' as ChatStyle,
        label: '全知问答 (Ask Anything)',
        description: '现代 AI 智能助手交互风格，适合知识库问答。',
        group: 'legacy' as const,
    },
    {
        value: 'GLASS' as ChatStyle,
        label: '暗夜毛玻璃 (Glass)',
        description: '磨砂深色玻璃质感，柔和微光与圆润气泡。',
        group: 'new' as const,
    },
    {
        value: 'TERMINAL' as ChatStyle,
        label: '极客终端 (Terminal)',
        description: '等宽字符与硬朗边角，极客极简代码风格。',
        group: 'new' as const,
    },
    {
        value: 'PLAYFUL' as ChatStyle,
        label: '活力元气 (Playful)',
        description: '明亮友好的高圆角气泡与温馨暖色点缀。',
        group: 'new' as const,
    },
    {
        value: 'CALM_MINT' as ChatStyle,
        label: '薄荷静谧 (Calm Mint)',
        description: '清爽深青色调，搭配细腻精致边框。',
        group: 'new' as const,
    },
    {
        value: 'AURORA' as ChatStyle,
        label: '极光幻境 (Aurora)',
        description: '新一代智能问答界面 — 深色背景与流光微粒头像。',
        group: 'new' as const,
    },
    {
        value: 'SUNRISE' as ChatStyle,
        label: '朝阳暖阳 (Sunrise)',
        description: '通透明亮的大气浅色主题，点缀柔和珊瑚橙。',
        group: 'new' as const,
    },
]

const legacyStyleOptions = computed(() => chatStyleOptions.filter(o => o.group === 'legacy'))
const newStyleOptions = computed(() => chatStyleOptions.filter(o => o.group === 'new'))

// Default palette per design. Selecting a design seeds these color fields so the look
// matches the marketing presets; the user can still recolor afterwards.
// Per-theme text colours copied from the design comp (Terminal greenish, Glass lavender, …).
const THEME_PRESETS: Record<string, { chat_background_color: string; chat_text_color: string; chat_bubble_color: string; accent_color: string; font_family: string }> = {
    CHATBOT: { chat_background_color: '#FFFFFF', chat_text_color: '#212529', chat_bubble_color: '#C9F24E', accent_color: '#C9F24E', font_family: 'Inter, system-ui, sans-serif' },
    ASK_ANYTHING: { chat_background_color: '#F8F9FA', chat_text_color: '#2A2A33', chat_bubble_color: '#E9ECEF', accent_color: '#C9F24E', font_family: 'Inter, system-ui, sans-serif' },
    GLASS: { chat_background_color: '#17151F', chat_text_color: '#ECEAFA', chat_bubble_color: '#9D8CFF', accent_color: '#9D8CFF', font_family: 'Instrument Sans, sans-serif' },
    TERMINAL: { chat_background_color: '#070907', chat_text_color: '#D7F7C8', chat_bubble_color: '#C9F24E', accent_color: '#C9F24E', font_family: 'JetBrains Mono, monospace' },
    PLAYFUL: { chat_background_color: '#FFFFFF', chat_text_color: '#2A2730', chat_bubble_color: '#FF7A6B', accent_color: '#FF7A6B', font_family: 'Instrument Sans, sans-serif' },
    CALM_MINT: { chat_background_color: '#0E1A1A', chat_text_color: '#DDF7F3', chat_bubble_color: '#5FE3D6', accent_color: '#5FE3D6', font_family: 'Instrument Sans, sans-serif' },
    AURORA: { chat_background_color: '#14111C', chat_text_color: '#F2F3F8', chat_bubble_color: '#9D8CFF', accent_color: '#9D8CFF', font_family: 'Instrument Sans, sans-serif' },
    SUNRISE: { chat_background_color: '#FFFFFF', chat_text_color: '#2A2A33', chat_bubble_color: '#FF8A73', accent_color: '#FF8A73', font_family: 'Instrument Sans, sans-serif' },
}

const themePreset = (value: string) => THEME_PRESETS[value] || THEME_PRESETS.CHATBOT

// Select a design and seed its preset palette into the editable color fields
const selectChatStyle = (value: ChatStyle) => {
    customization.value.chat_style = value
    const preset = THEME_PRESETS[value]
    if (preset) {
        customization.value.chat_background_color = preset.chat_background_color
        customization.value.chat_text_color = preset.chat_text_color
        customization.value.chat_bubble_color = preset.chat_bubble_color
        customization.value.accent_color = preset.accent_color
        customization.value.font_family = preset.font_family
    }
    emit('preview', { ...customization.value })
}

// ---- Widget placement (stored in customization_metadata.widget_display) ----
// The embed loader reads these as site-wide defaults; options set in the install
// snippet (window.chattermateConfig / Komi AI.init) override them per page.
const displayModeOptions = [
    { value: 'floating', label: '悬浮气泡按钮', description: '网页右下角经典悬浮按钮，点击弹出独立聊天窗口。' },
    { value: 'sidebar-right', label: '右侧滑出抽屉', description: '从网页右侧边缘展开的全高交互侧边栏。' },
    { value: 'sidebar-left', label: '左侧滑出抽屉', description: '从网页左侧边缘展开的全高交互侧边栏。' },
    { value: 'search-bar', label: '嵌入式搜索栏', description: '类似“全知搜索栏”的输入框，点击展开 AI 问答面板。', askAiOnly: true },
]

// The search bar opens the Ask AI answer panel, which is what the Ask Anything and
// Aurora designs are; offering it with a chat-bubble design would promise a surface
// that design doesn't have.
const ASK_AI_CHAT_STYLES = ['ASK_ANYTHING', 'AURORA']
const isAskAiTheme = computed(() => ASK_AI_CHAT_STYLES.includes(customization.value.chat_style as string))
const isModeAvailable = (option: { askAiOnly?: boolean }) => !option.askAiOnly || isAskAiTheme.value

// Numeric bounds per field — must mirror WidgetDisplayConfig (backend schema),
// which rejects values outside these ranges.
const PLACEMENT_BOUNDS: Record<string, [number, number]> = {
    width: [280, 800],
    height: [400, 900],
    sidebar_width: [320, 640],
    offset_bottom: [0, 200],
    offset_side: [0, 200],
}

const widgetDisplay = computed<Record<string, any>>(() =>
    (customization.value.customization_metadata as Record<string, any> | undefined)?.widget_display ?? {})

const activeDisplayMode = computed(() => widgetDisplay.value.mode ?? 'floating')
const isSidebarMode = computed(() =>
    activeDisplayMode.value === 'sidebar-left' || activeDisplayMode.value === 'sidebar-right')

// Reassigns metadata wholesale (never mutates in place) so the deep watcher and
// save round-trip always see a fresh object; unset values are removed entirely,
// letting the loader fall back to its defaults.
const setDisplay = (key: string, value: unknown) => {
    const meta = { ...((customization.value.customization_metadata as Record<string, any>) ?? {}) }
    const display = { ...(meta.widget_display ?? {}) }
    if (value === null || value === undefined || value === '') {
        delete display[key]
    } else {
        display[key] = value
    }
    meta.widget_display = display
    customization.value.customization_metadata = meta
}

// Switching to a chat-bubble design leaves the search bar pointing at an Ask AI panel
// that design doesn't have, so fall back to the floating launcher.
watch(isAskAiTheme, (askAi) => {
    if (!askAi && widgetDisplay.value.mode === 'search-bar') {
        setDisplay('mode', null)
    }
})

// Clamp on change (not on input — clamping mid-typing fights the user).
const setDisplayNumber = (key: string, event: Event) => {
    const [min, max] = PLACEMENT_BOUNDS[key]
    const input = event.target as HTMLInputElement
    const parsed = Number(input.value)
    if (!input.value || Number.isNaN(parsed)) {
        setDisplay(key, null)
        return
    }
    const clamped = Math.min(max, Math.max(min, Math.round(parsed)))
    setDisplay(key, clamped)
    input.value = String(clamped)
}

// Brand color swatch presets (design grid)
const accentSwatchColors = ['#C9F24E', '#9D8CFF', '#5FE3D6', '#FF8A73', '#6EA8FF', '#F34611']

// Font picker chip presets (design typography picker)
const fontPresets = [
    { value: 'Instrument Sans, sans-serif', label: 'Instrument Sans' },
    { value: 'Space Grotesk, sans-serif', label: 'Space Grotesk' },
    { value: 'JetBrains Mono, monospace', label: 'JetBrains Mono' },
    { value: 'system-ui, sans-serif', label: '系统默认字体' },
]

// Save state management
const isSaving = ref(false)
const saveMessage = ref<{ type: 'success' | 'error', text: string } | null>(null)

const handleSave = async () => {
    isSaving.value = true
    saveMessage.value = null
    
    try {
        const updatedCustomization = await agentService.updateCustomization(
            props.agent.id,
            customization.value,
        )
        
        // Update local customization with the response
        customization.value = updatedCustomization
        
        // Emit preview to update the preview panel
        emit('preview', updatedCustomization)
        
        // Show success message
        saveMessage.value = { type: 'success', text: '外观配置保存成功！' }
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
            saveMessage.value = null
        }, 3000)
    } catch (error) {
        console.error('Failed to update customization:', error)
        saveMessage.value = { 
            type: 'error', 
            text: error instanceof Error ? error.message : '保存外观配置失败，请重试。' 
        }
    } finally {
        isSaving.value = false
    }
}

// Watch for changes and emit preview event
const isInternalUpdate = ref(false)

watch(customization, (newValue) => {
    if (isInternalUpdate.value) {
        return // Skip if this is an internal update to prevent loops
    }
    console.log('AgentCustomizationView - Customization changed, emitting preview:', newValue)
    emit('preview', newValue)
}, { deep: true })

// Watch for prop changes to update local customization
watch(() => props.agent.customization, (newCustomization) => {
    if (newCustomization) {
        isInternalUpdate.value = true
        customization.value = {
            id: newCustomization.id ?? 0,
            agent_id: props.agent.id,
            chat_background_color: newCustomization.chat_background_color ?? '#F8F9FA',
            chat_text_color: newCustomization.chat_text_color ?? '#212529',
            chat_bubble_color: newCustomization.chat_bubble_color ?? '#E9ECEF',
            icon_color: newCustomization.icon_color ?? '#6C757D',
            accent_color: newCustomization.accent_color ?? '#C9F24E',
            font_family: newCustomization.font_family ?? 'Inter, system-ui, sans-serif',
            photo_url: newCustomization.photo_url,
            custom_css: newCustomization.custom_css,
            customization_metadata: newCustomization.customization_metadata ?? {},
            chat_style: newCustomization.chat_style ?? 'CHATBOT',
            welcome_title: newCustomization.welcome_title ?? '',
            welcome_subtitle: newCustomization.welcome_subtitle ?? '',
            welcome_message: newCustomization.welcome_message ?? '',
            chat_initiation_messages: newCustomization.chat_initiation_messages ?? [],
            quick_actions: newCustomization.quick_actions ?? [],
            show_citations: newCustomization.show_citations ?? false,
            collect_email: newCustomization.collect_email ?? false,
            show_ai_disclaimer: newCustomization.show_ai_disclaimer ?? true,
            allow_new_chat: newCustomization.allow_new_chat ?? false,
        }
        nextTick(() => {
            isInternalUpdate.value = false
        })
    }
}, { deep: true })

// Shown when no Google Fonts API key is configured (self-hosted deployments
// usually have none). Without it the font picker would just be empty.
const FALLBACK_FONTS = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
    'Source Sans 3', 'Nunito', 'Raleway', 'Work Sans', 'DM Sans', 'Merriweather'
].map(family => ({ family, variants: ['regular'] }))

// Add state for Google Fonts
const googleFonts = ref<Array<{ family: string, variants: string[] }>>([])
const isLoadingFonts = ref(true)

// Watch for chat style changes specifically
const previousChatStyle = ref(customization.value.chat_style)
watch(() => customization.value.chat_style, (newStyle, oldStyle) => {
    if (newStyle !== oldStyle && !isInternalUpdate.value) {
        console.log('Chat style changed:', oldStyle, '->', newStyle)
        emit('chat-style-changed', oldStyle || 'CHATBOT', newStyle || 'CHATBOT')
        previousChatStyle.value = newStyle
    }
})

// Load Google Fonts
onMounted(async () => {
    // No key configured (the common self-host case) — skip the request rather
    // than firing one that can only 400, and offer the built-in list instead.
    const fontsApiKey = getGoogleFontsApiKey()
    if (!fontsApiKey) {
        googleFonts.value = FALLBACK_FONTS
        isLoadingFonts.value = false
    } else {
        try {
            const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${fontsApiKey}&sort=popularity`)
            const data = await response.json()
            googleFonts.value = data.items
        } catch (error) {
            console.error('Failed to load Google Fonts:', error)
        } finally {
            isLoadingFonts.value = false
        }
    }
    
    // Emit initial preview to ensure preview panel gets the customization data
    console.log('AgentCustomizationView - Emitting initial preview:', customization.value)
    emit('preview', customization.value)
})

// Update font preview when selection changes
watch(() => customization.value.font_family, (newFont) => {
    if (!newFont) return

    // Create a style element for this specific font
    const styleId = 'preview-font-style'
    let styleEl = document.getElementById(styleId)

    if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = styleId
        document.head.appendChild(styleEl)
    }

    // Load font but scope it to the chat panel
    WebFont.load({
        google: {
            families: [newFont]
        },
        active: () => {
            if (styleEl) {
                styleEl.textContent = `
                    .chat-panel {
                        font-family: "${newFont}", system-ui, sans-serif;
                    }
                `
            }
        }
    })
})

// Clean up the style element when component is unmounted
onUnmounted(() => {
    const styleEl = document.getElementById('preview-font-style')
    if (styleEl) {
        styleEl.remove()
    }
})

const fontSearch = ref('')
const filteredFonts = computed(() => {
    if (!fontSearch.value) return googleFonts.value
    return googleFonts.value.filter(font =>
        font.family.toLowerCase().includes(fontSearch.value.toLowerCase())
    )
})

const showFontDropdown = ref(false)

const handleFontSelect = (font: string) => {
    customization.value.font_family = font
    showFontDropdown.value = false
}

// Chat initiation messages management
const newInitiationMessage = ref('')
const editingInitiationIndex = ref<number | null>(null)
const editingInitiationMessage = ref('')

const addInitiationMessage = () => {
    if (!newInitiationMessage.value.trim()) return
    
    if (!customization.value.chat_initiation_messages) {
        customization.value.chat_initiation_messages = []
    }
    
    customization.value.chat_initiation_messages.push(newInitiationMessage.value.trim())
    newInitiationMessage.value = ''
}

const removeInitiationMessage = (index: number) => {
    if (customization.value.chat_initiation_messages) {
        customization.value.chat_initiation_messages.splice(index, 1)
    }
}

const startEditInitiationMessage = (index: number) => {
    editingInitiationIndex.value = index
    editingInitiationMessage.value = customization.value.chat_initiation_messages?.[index] || ''
}

const saveEditInitiationMessage = () => {
    if (editingInitiationIndex.value !== null && customization.value.chat_initiation_messages && editingInitiationMessage.value.trim()) {
        customization.value.chat_initiation_messages[editingInitiationIndex.value] = editingInitiationMessage.value.trim()
        editingInitiationIndex.value = null
        editingInitiationMessage.value = ''
    }
}

const cancelEditInitiationMessage = () => {
    editingInitiationIndex.value = null
    editingInitiationMessage.value = ''
}

const loadDefaultInitiations = () => {
    customization.value.chat_initiation_messages = [...DEFAULT_CHAT_INITIATIONS]
}

// Quick actions management (mirrors chat initiation messages)
const newQuickAction = ref('')
const editingQuickActionIndex = ref<number | null>(null)
const editingQuickAction = ref('')

const addQuickAction = () => {
    if (!newQuickAction.value.trim()) return
    if (!customization.value.quick_actions) {
        customization.value.quick_actions = []
    }
    customization.value.quick_actions.push(newQuickAction.value.trim())
    newQuickAction.value = ''
}

const removeQuickAction = (index: number) => {
    if (customization.value.quick_actions) {
        customization.value.quick_actions.splice(index, 1)
    }
}

const startEditQuickAction = (index: number) => {
    editingQuickActionIndex.value = index
    editingQuickAction.value = customization.value.quick_actions?.[index] || ''
}

const saveEditQuickAction = () => {
    if (editingQuickActionIndex.value !== null && customization.value.quick_actions && editingQuickAction.value.trim()) {
        customization.value.quick_actions[editingQuickActionIndex.value] = editingQuickAction.value.trim()
        editingQuickActionIndex.value = null
        editingQuickAction.value = ''
    }
}

const cancelEditQuickAction = () => {
    editingQuickActionIndex.value = null
    editingQuickAction.value = ''
}

const loadDefaultQuickActions = () => {
    customization.value.quick_actions = [...DEFAULT_QUICK_ACTIONS]
}

// Initiation message preview handlers
const showInitiationPreview = () => {
    emit('preview', { 
        ...customization.value, 
        showBubblePreview: false,
        showInitiationPreview: true 
    })
}

const hideInitiationPreview = () => {
    emit('preview', { 
        ...customization.value, 
        showBubblePreview: false,
        showInitiationPreview: false 
    })
}

// Collapsible sections state
const expandedSections = ref<Set<string>>(new Set(['chat-style', 'colors']))

const toggleSection = (sectionId: string) => {
    if (expandedSections.value.has(sectionId)) {
        expandedSections.value.delete(sectionId)
    } else {
        expandedSections.value.add(sectionId)
    }
}

const isSectionExpanded = (sectionId: string) => {
    return expandedSections.value.has(sectionId)
}


</script>

<template>
    <div class="customization-form">
        <div class="form-content">
            <!-- Chat design Section -->
            <div class="form-section">
                <h3 class="section-heading">聊天界面风格 (Chat Theme)</h3>
                <p class="section-subtext">多款精美设计风格 — 挑选最契合您品牌调性的界面外观。</p>

                <div class="chat-style-group-label">经典风格</div>
                <div class="chat-style-grid">
                    <button
                        v-for="option in legacyStyleOptions"
                        :key="option.value"
                        type="button"
                        class="chat-style-card"
                        :class="{ 'active': customization.chat_style === option.value }"
                        @click="selectChatStyle(option.value)"
                    >
                        <div class="chat-style-thumb" :style="{ background: themePreset(option.value).chat_background_color }">
                            <span class="thumb-bubble agent"></span>
                            <span class="thumb-bubble user" :style="{ background: themePreset(option.value).accent_color }"></span>
                        </div>
                        <div class="chat-style-title">
                            <span>{{ option.label }}</span>
                            <span v-if="customization.chat_style === option.value" class="chat-style-check">✓</span>
                        </div>
                        <div class="chat-style-desc">{{ option.description }}</div>
                    </button>
                </div>

                <div class="chat-style-group-label">全新高级风格 <span class="chat-style-group-badge">高颜值</span></div>
                <div class="chat-style-grid">
                    <button
                        v-for="option in newStyleOptions"
                        :key="option.value"
                        type="button"
                        class="chat-style-card"
                        :class="{ 'active': customization.chat_style === option.value }"
                        @click="selectChatStyle(option.value)"
                    >
                        <div class="chat-style-thumb" :style="{ background: themePreset(option.value).chat_background_color }">
                            <span class="thumb-bubble agent"></span>
                            <span class="thumb-bubble user" :style="{ background: themePreset(option.value).accent_color }"></span>
                        </div>
                        <div class="chat-style-title">
                            <span>{{ option.label }}</span>
                            <span v-if="customization.chat_style === option.value" class="chat-style-check">✓</span>
                        </div>
                        <div class="chat-style-desc">{{ option.description }}</div>
                    </button>
                </div>

                <label class="citations-toggle">
                    <input type="checkbox" v-model="customization.show_citations">
                    <span class="citations-toggle-track"><span class="citations-toggle-thumb"></span></span>
                    <span class="citations-toggle-text">
                        <span class="citations-toggle-title">显示知识库参考引用来源 (Citations)</span>
                        <span class="citations-toggle-desc">在智能体回答底部以标签形式展示命中并引用的知识库文档来源。</span>
                    </span>
                </label>

                <label class="citations-toggle">
                    <input type="checkbox" v-model="customization.collect_email">
                    <span class="citations-toggle-track"><span class="citations-toggle-thumb"></span></span>
                    <span class="citations-toggle-text">
                        <span class="citations-toggle-title">开启对话前强制收集邮箱</span>
                        <span class="citations-toggle-desc">要求访客在开始与客服聊天前必须先输入电子邮箱。默认关闭。</span>
                    </span>
                </label>

                <label class="citations-toggle">
                    <input type="checkbox" v-model="customization.show_ai_disclaimer">
                    <span class="citations-toggle-track"><span class="citations-toggle-thumb"></span></span>
                    <span class="citations-toggle-text">
                        <span class="citations-toggle-title">显示 AI 智能生成免责声明</span>
                        <span class="citations-toggle-desc">在聊天窗口底部显示“{{ AI_DISCLAIMER_TEXT }}”。转接人工客服后将自动隐藏。</span>
                    </span>
                </label>

                <label class="citations-toggle">
                    <input type="checkbox" v-model="customization.allow_new_chat">
                    <span class="citations-toggle-track"><span class="citations-toggle-thumb"></span></span>
                    <span class="citations-toggle-text">
                        <span class="citations-toggle-title">允许访客随时开启新会话</span>
                        <span class="citations-toggle-desc">在顶部添加「新对话」按钮，点击结束当前会话并开启全新聊天。人工接待中自动隐藏。</span>
                    </span>
                </label>
            </div>

            <!-- Widget placement Section -->
            <div class="form-section">
                <h3 class="section-heading">挂件呈现形态与屏幕位置</h3>
                <p class="section-subtext">配置挂件在您网站上的展示形态与边距位置。嵌入代码中的个性化参数可覆盖此默认配置。</p>

                <div class="chat-style-grid">
                    <button
                        v-for="option in displayModeOptions"
                        :key="option.value"
                        type="button"
                        class="chat-style-card"
                        :class="{ 'active': activeDisplayMode === option.value, 'locked': !isModeAvailable(option) }"
                        :disabled="!isModeAvailable(option)"
                        :title="isModeAvailable(option) ? undefined : '仅在全知问答或极光幻境主题下可用'"
                        @click="setDisplay('mode', option.value)"
                    >
                        <div class="chat-style-thumb placement-thumb">
                            <span class="placement-shape" :class="`placement-shape-${option.value}`"></span>
                        </div>
                        <div class="chat-style-title">
                            <span>{{ option.label }}</span>
                            <span v-if="activeDisplayMode === option.value" class="chat-style-check">✓</span>
                        </div>
                        <div class="chat-style-desc">
                            {{ option.description }}
                            <template v-if="!isModeAvailable(option)"><br>需配合全知问答或极光幻境主题。</template>
                        </div>
                    </button>
                </div>

                <div v-if="!isSidebarMode" class="placement-side-row">
                    <span class="placement-label">停靠侧边</span>
                    <div class="placement-side-chips">
                        <button type="button" class="font-chip" :class="{ 'active': (widgetDisplay.side ?? 'right') === 'left' }"
                            @click="setDisplay('side', 'left')">左下角</button>
                        <button type="button" class="font-chip" :class="{ 'active': (widgetDisplay.side ?? 'right') === 'right' }"
                            @click="setDisplay('side', 'right')">右下角</button>
                    </div>
                </div>

                <div class="placement-fields">
                    <label v-if="activeDisplayMode === 'floating'" class="placement-field">
                        <span>窗口宽度 (px)</span>
                        <input type="number" class="text-input" :value="widgetDisplay.width" placeholder="400"
                            :min="PLACEMENT_BOUNDS.width[0]" :max="PLACEMENT_BOUNDS.width[1]"
                            @change="setDisplayNumber('width', $event)">
                    </label>
                    <label v-if="activeDisplayMode === 'floating'" class="placement-field">
                        <span>窗口高度 (px)</span>
                        <input type="number" class="text-input" :value="widgetDisplay.height" placeholder="560"
                            :min="PLACEMENT_BOUNDS.height[0]" :max="PLACEMENT_BOUNDS.height[1]"
                            @change="setDisplayNumber('height', $event)">
                    </label>
                    <label v-if="isSidebarMode" class="placement-field">
                        <span>抽屉展开宽度 (px)</span>
                        <input type="number" class="text-input" :value="widgetDisplay.sidebar_width" placeholder="420"
                            :min="PLACEMENT_BOUNDS.sidebar_width[0]" :max="PLACEMENT_BOUNDS.sidebar_width[1]"
                            @change="setDisplayNumber('sidebar_width', $event)">
                    </label>
                    <label v-if="activeDisplayMode === 'search-bar'" class="placement-field placement-field-wide">
                        <span>搜索栏占位文字</span>
                        <input type="text" class="text-input" maxlength="80" :value="widgetDisplay.search_placeholder"
                            placeholder="输入您想了解的问题..."
                            @change="setDisplay('search_placeholder', ($event.target as HTMLInputElement).value)">
                    </label>
                    <label class="placement-field">
                        <span>底部安全边距 (px)</span>
                        <input type="number" class="text-input" :value="widgetDisplay.offset_bottom" placeholder="20"
                            :min="PLACEMENT_BOUNDS.offset_bottom[0]" :max="PLACEMENT_BOUNDS.offset_bottom[1]"
                            @change="setDisplayNumber('offset_bottom', $event)">
                    </label>
                    <label class="placement-field">
                        <span>侧边安全边距 (px)</span>
                        <input type="number" class="text-input" :value="widgetDisplay.offset_side" placeholder="20"
                            :min="PLACEMENT_BOUNDS.offset_side[0]" :max="PLACEMENT_BOUNDS.offset_side[1]"
                            @change="setDisplayNumber('offset_side', $event)">
                    </label>
                </div>

                <label class="citations-toggle">
                    <input type="checkbox" :checked="widgetDisplay.launcher === false"
                        @change="setDisplay('launcher', ($event.target as HTMLInputElement).checked ? false : null)">
                    <span class="citations-toggle-track"><span class="citations-toggle-thumb"></span></span>
                    <span class="citations-toggle-text">
                        <span class="citations-toggle-title">隐藏默认悬浮气泡 — 使用网站自定义按钮唤起</span>
                        <span class="citations-toggle-desc">给网页任意元素添加 <code>data-komi-open</code> 属性，或通过 JS 调用 <code>Komi AI.open()</code> 唤起。</span>
                    </span>
                </label>
            </div>

            <!-- Brand color + Typography Section -->
            <div class="form-section">
                <h3 class="section-heading">品牌主色调 (Brand Color)</h3>
                <div class="accent-row">
                    <button
                        v-for="swatch in accentSwatchColors"
                        :key="swatch"
                        type="button"
                        class="accent-swatch"
                        :class="{ 'active': customization.accent_color?.toUpperCase() === swatch }"
                        :title="swatch"
                        :style="{ background: swatch, boxShadow: customization.accent_color?.toUpperCase() === swatch ? '0 0 0 2px ' + swatch : 'none' }"
                        @click="customization.accent_color = swatch"
                    ></button>
                    <label class="accent-custom" title="自定义颜色">
                        <input type="color" v-model="customization.accent_color">
                        <span class="accent-custom-icon">+</span>
                    </label>
                    <span class="accent-hex">{{ customization.accent_color }}</span>
                </div>

                <div class="aux-color-row">
                    <label class="aux-color">
                        <span class="aux-color-label">聊天背景色</span>
                        <span class="aux-color-input">
                            <input type="color" v-model="customization.chat_background_color">
                            <span class="aux-color-value">{{ customization.chat_background_color }}</span>
                        </span>
                    </label>
                    <label class="aux-color">
                        <span class="aux-color-label">文本文字颜色</span>
                        <span class="aux-color-input">
                            <input type="color" v-model="customization.chat_text_color">
                            <span class="aux-color-value">{{ customization.chat_text_color }}</span>
                        </span>
                    </label>
                    <label class="aux-color">
                        <span class="aux-color-label">消息气泡颜色</span>
                        <span class="aux-color-input">
                            <input type="color" v-model="customization.chat_bubble_color"
                                @input="emit('preview', { ...customization, showBubblePreview: true })"
                                @focus="emit('preview', { ...customization, showBubblePreview: true })"
                                @blur="emit('preview', { ...customization, showBubblePreview: false })">
                            <span class="aux-color-value">{{ customization.chat_bubble_color }}</span>
                        </span>
                    </label>
                </div>

                <h3 class="section-heading section-heading-gap">字体设置 (Typography)</h3>
                <div class="font-picker">
                    <div class="font-dropdown" :class="{ 'active': showFontDropdown }">
                        <input type="text" :value="showFontDropdown ? fontSearch : customization.font_family"
                            @input="e => fontSearch = (e.target as HTMLInputElement).value"
                            placeholder="搜索字体..." class="font-search"
                            :style="!showFontDropdown ? { fontFamily: customization.font_family } : {}"
                            :disabled="isLoadingFonts" @focus="showFontDropdown = true">
                        <div v-if="showFontDropdown" class="font-options">
                            <div v-for="font in filteredFonts" :key="font.family" class="font-option"
                                :style="{ fontFamily: font.family }" @click="handleFontSelect(font.family)">
                                {{ font.family }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="font-chips">
                    <button
                        v-for="preset in fontPresets"
                        :key="preset.value"
                        type="button"
                        class="font-chip"
                        :class="{ 'active': customization.font_family === preset.value }"
                        :style="{ fontFamily: preset.value }"
                        @click="handleFontSelect(preset.value)"
                    >{{ preset.label }}</button>
                </div>
            </div>

            <!-- Welcome Message Section (only for ASK_ANYTHING style) -->
            <div v-if="customization.chat_style === 'ASK_ANYTHING'" class="form-section">
                <h3 class="section-heading">问答页欢迎标题与副标题</h3>
                <p class="section-subtext">
                    配置访客首次展开全屏问答面板时呈现的欢迎标语与介绍。
                </p>

                <div class="form-group">
                    <label for="welcome-title">欢迎标题</label>
                    <input
                        id="welcome-title"
                        type="text"
                        v-model="customization.welcome_title"
                        placeholder="例如：欢迎咨询 AI 智能助手"
                        class="text-input"
                        maxlength="100"
                    >
                    <small class="input-hint">
                        留空将默认使用：“欢迎咨询 {{ props.agent.display_name || props.agent.name }}”
                    </small>
                </div>

                <div class="form-group">
                    <label for="welcome-subtitle">欢迎副标题说明</label>
                    <textarea
                        id="welcome-subtitle"
                        v-model="customization.welcome_subtitle"
                        placeholder="例如：我随时在线为您解答关于产品、订单和售后的所有疑问，请问今天有什么想了解的？"
                        class="text-textarea"
                        rows="3"
                        maxlength="250"
                    ></textarea>
                    <small class="input-hint">
                        留空将使用系统默认副标题说明
                    </small>
                </div>
            </div>

            <!-- Greeting messages Section -->
            <div class="form-section chat-initiation-section" :class="{ 'locked': isChatInitiationsLocked }">
                <div class="section-head-row">
                    <h3 class="section-heading">气泡上方主动气泡问候语</h3>
                    <button
                        v-if="!isChatInitiationsLocked"
                        type="button"
                        class="load-defaults-link"
                        @click="loadDefaultInitiations"
                    >恢复默认文案</button>
                    <div v-if="isChatInitiationsLocked" class="premium-badge-small">
                        <font-awesome-icon icon="fa-solid fa-crown" />
                        <span>高级专享</span>
                    </div>
                </div>
                <p class="section-subtext">
                    在访客尚未点击打开客服之前，<strong>在悬浮气泡按钮上方</strong> 弹出的主动破冰问候语。
                </p>

                <!-- Locked State -->
                <div v-if="isChatInitiationsLocked" class="locked-overlay-compact">
                    <div class="locked-content-compact">
                        <font-awesome-icon icon="fa-solid fa-lock" class="lock-icon-small" />
                        <p class="locked-text">升级套餐解锁自定义气泡主动破冰问候语，大幅提高访客进线咨询率。</p>
                        <button class="upgrade-btn-compact" @click="handleUpgrade">
                            <font-awesome-icon icon="fa-solid fa-crown" />
                            <span>立即升级</span>
                        </button>
                    </div>
                </div>
                
                <!-- Unlocked State -->
                <div v-else>
                    <!-- Add New Message -->
                    <div class="init-add-row">
                        <input
                            type="text"
                            v-model="newInitiationMessage"
                            placeholder="👋 您好！有什么可以帮您的？"
                            class="init-input"
                            maxlength="100"
                            @keyup.enter="addInitiationMessage"
                        >
                        <button
                            type="button"
                            class="init-add-btn"
                            @click="addInitiationMessage"
                            :disabled="!newInitiationMessage.trim()"
                            title="添加问候语"
                        >+</button>
                    </div>

                    <!-- Messages List -->
                    <div v-if="customization.chat_initiation_messages && customization.chat_initiation_messages.length > 0" class="init-list">
                        <div
                            v-for="(message, index) in customization.chat_initiation_messages"
                            :key="index"
                            class="init-item"
                        >
                            <div v-if="editingInitiationIndex === index" class="init-edit-inline">
                                <input
                                    type="text"
                                    v-model="editingInitiationMessage"
                                    class="init-edit-input"
                                    maxlength="100"
                                    @keyup.enter="saveEditInitiationMessage"
                                    @keyup.esc="cancelEditInitiationMessage"
                                    ref="editInput"
                                >
                                <button type="button" class="init-icon-btn save" @click="saveEditInitiationMessage" title="保存">
                                    <font-awesome-icon icon="fa-solid fa-check" />
                                </button>
                                <button type="button" class="init-icon-btn cancel" @click="cancelEditInitiationMessage" title="取消">
                                    <font-awesome-icon icon="fa-solid fa-times" />
                                </button>
                            </div>
                            <template v-else>
                                <span class="init-handle">☰</span>
                                <span class="init-text">{{ message }}</span>
                                <button
                                    type="button"
                                    class="init-icon-btn edit"
                                    @click="startEditInitiationMessage(index)"
                                    title="编辑"
                                >
                                    <font-awesome-icon icon="fa-solid fa-pen" />
                                </button>
                                <button
                                    type="button"
                                    class="init-remove"
                                    @click="removeInitiationMessage(index)"
                                    title="删除"
                                >✕</button>
                            </template>
                        </div>
                    </div>

                    <div v-else-if="customization.chat_initiation_messages && customization.chat_initiation_messages.length === 0" class="init-empty">
                        <span class="init-empty-icon">ⓘ</span>
                        <span>暂未添加问候语，请在上方输入框添加。</span>
                    </div>
                </div>
            </div>

            <!-- Welcome message + quick actions Section -->
            <div class="form-section">
                <h3 class="section-heading">开场欢迎语与快捷推荐选项</h3>
                <p class="section-subtext">
                    在访客<strong>打开聊天窗口内部</strong>后显示 — 包括首条欢迎问候气泡与一键发送的快捷按钮。快捷按钮在访客发送首条消息后自动收起。
                </p>

                <div class="form-group">
                    <label for="welcome-message">开场欢迎语</label>
                    <textarea
                        id="welcome-message"
                        v-model="customization.welcome_message"
                        placeholder="例如：您好！👋 我是您的 AI 智能顾问，支持实时查询订单、办理退换货或为您转接专属人工客服。请问有什么可以协助您？"
                        class="text-textarea"
                        rows="3"
                        maxlength="300"
                    ></textarea>
                    <small class="input-hint">留空将由智能客服的首条实时回复进行打招呼。</small>
                </div>

                <div class="section-head-row">
                    <h3 class="section-heading">快捷提问按钮 (Quick Actions)</h3>
                    <button type="button" class="load-defaults-link" @click="loadDefaultQuickActions">恢复默认按钮</button>
                </div>

                <div class="init-add-row">
                    <input
                        type="text"
                        v-model="newQuickAction"
                        placeholder="📦 查询我的订单物流"
                        class="init-input"
                        maxlength="60"
                        @keyup.enter="addQuickAction"
                    >
                    <button
                        type="button"
                        class="init-add-btn"
                        @click="addQuickAction"
                        :disabled="!newQuickAction.trim()"
                        title="添加快捷按钮"
                    >+</button>
                </div>

                <div v-if="customization.quick_actions && customization.quick_actions.length > 0" class="init-list">
                    <div
                        v-for="(action, index) in customization.quick_actions"
                        :key="index"
                        class="init-item"
                    >
                        <div v-if="editingQuickActionIndex === index" class="init-edit-inline">
                            <input
                                type="text"
                                v-model="editingQuickAction"
                                class="init-edit-input"
                                maxlength="60"
                                @keyup.enter="saveEditQuickAction"
                                @keyup.esc="cancelEditQuickAction"
                            >
                            <button type="button" class="init-icon-btn save" @click="saveEditQuickAction" title="保存">
                                <font-awesome-icon icon="fa-solid fa-check" />
                            </button>
                            <button type="button" class="init-icon-btn cancel" @click="cancelEditQuickAction" title="取消">
                                <font-awesome-icon icon="fa-solid fa-times" />
                            </button>
                        </div>
                        <template v-else>
                            <span class="init-handle">☰</span>
                            <span class="init-text">{{ action }}</span>
                            <button type="button" class="init-icon-btn edit" @click="startEditQuickAction(index)" title="编辑">
                                <font-awesome-icon icon="fa-solid fa-pen" />
                            </button>
                            <button type="button" class="init-remove" @click="removeQuickAction(index)" title="删除">✕</button>
                        </template>
                    </div>
                </div>
                <div v-else class="init-empty">
                    <span class="init-empty-icon">ⓘ</span>
                    <span>暂未设置快捷按钮，请在上方添加。</span>
                </div>
            </div>
        </div>

        <div class="button-group">
            <!-- Save Message -->
            <div v-if="saveMessage" class="save-message" :class="saveMessage.type">
                <font-awesome-icon 
                    :icon="saveMessage.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'" 
                    class="message-icon"
                />
                <span>{{ saveMessage.text }}</span>
            </div>
            
            <div class="button-actions">
                <button class="cancel-button" @click="emit('cancel')" :disabled="isSaving">取消</button>
                <button class="save-button" @click="handleSave" :disabled="isSaving">
                    <font-awesome-icon 
                        v-if="isSaving" 
                        icon="fa-solid fa-spinner" 
                        class="spinner"
                    />
                    <span>{{ isSaving ? '正在保存...' : '保存外观配置' }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.customization-form {
    padding: 0;
    max-width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.form-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-md);
}

/* Section cards (design spec) */
.form-section {
    margin-bottom: 18px;
    background: var(--surface);
    border: 1px solid var(--o08);
    border-radius: var(--radius-card);
    padding: 24px;
}

.section-heading {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 16px;
    color: var(--text);
    margin: 0 0 4px;
}

.section-heading-gap {
    margin-top: 24px;
    margin-bottom: 12px;
}

.section-subtext {
    font-size: 13.5px;
    color: var(--muted);
    line-height: 1.5;
    margin: 0 0 18px;
}

.section-subtext strong {
    color: var(--text3);
    font-weight: 600;
}

.section-head-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 6px;
}

.section-head-row .section-heading {
    margin: 0;
}

/* Chat design grid (design spec) */
.chat-style-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.chat-style-card {
    text-align: left;
    padding: 10px;
    border-radius: 14px;
    border: 1px solid var(--o10);
    background: var(--bg);
    cursor: pointer;
    font-family: var(--font-sans);
    transition: all var(--transition-fast);
}

.chat-style-card.active {
    background: var(--accent-bg-08);
    border-color: var(--accent-border);
}

.chat-style-thumb {
    position: relative;
    height: 64px;
    border-radius: 10px;
    background: var(--surface);
    border: 1px solid var(--o08);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 7px;
    padding: 12px;
    overflow: hidden;
}

.chat-style-thumb .thumb-bubble {
    height: 12px;
    border-radius: 7px;
    display: block;
}
.chat-style-thumb .thumb-bubble.agent {
    width: 62%;
    align-self: flex-start;
    background: rgba(255, 255, 255, 0.18);
}
.chat-style-thumb .thumb-bubble.user {
    width: 46%;
    align-self: flex-end;
}

/* Widget placement: mini viewport illustrations per display mode */
.placement-thumb {
    padding: 0;
}
.placement-shape {
    position: absolute;
    inset: 0;
}
.placement-shape::before,
.placement-shape::after {
    content: '';
    position: absolute;
    background: var(--accent-ink);
    opacity: 0.8;
    border-radius: 4px;
}
.placement-shape-floating::before {
    right: 10px;
    bottom: 18px;
    width: 26px;
    height: 32px;
}
.placement-shape-floating::after {
    right: 10px;
    bottom: 6px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
}
.placement-shape-sidebar-right::before {
    top: 5px;
    bottom: 5px;
    right: 5px;
    width: 30%;
}
.placement-shape-sidebar-left::before {
    top: 5px;
    bottom: 5px;
    left: 5px;
    width: 30%;
}
.placement-shape-search-bar::before {
    left: 15%;
    right: 15%;
    bottom: 8px;
    height: 11px;
    border-radius: 999px;
}

.chat-style-card.locked {
    opacity: 0.45;
    cursor: not-allowed;
}

.placement-side-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
}
.placement-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
}
.placement-side-chips {
    display: flex;
    gap: 8px;
}

.placement-fields {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-top: 16px;
}
.placement-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.placement-field > span {
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
}
.placement-field-wide {
    grid-column: 1 / -1;
}

.citations-toggle-desc code {
    background: var(--o06);
    padding: 1px 5px;
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 0.9em;
    color: var(--accent-ink);
}

.chat-style-group-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted2);
    margin: 18px 0 10px;
    display: flex;
    align-items: center;
    gap: 8px;
}
.chat-style-group-label:first-of-type { margin-top: 4px; }
.chat-style-group-badge {
    text-transform: none;
    letter-spacing: 0;
    font-size: 10.5px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--accent-bg-08);
    color: var(--accent-ink);
    border: 1px solid var(--accent-border);
}

.citations-toggle {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 18px;
    padding: 12px 14px;
    border: 1px solid var(--o10);
    border-radius: 12px;
    background: var(--bg);
    cursor: pointer;
}
.citations-toggle input { display: none; }
.citations-toggle-track {
    position: relative;
    flex-shrink: 0;
    width: 38px;
    height: 22px;
    border-radius: 999px;
    background: var(--o10);
    transition: background var(--transition-fast);
    margin-top: 2px;
}
.citations-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    transition: transform var(--transition-fast);
}
.citations-toggle input:checked + .citations-toggle-track {
    background: var(--accent-solid, var(--accent-border));
}
.citations-toggle input:checked + .citations-toggle-track .citations-toggle-thumb {
    transform: translateX(16px);
}
.citations-toggle-text { display: flex; flex-direction: column; gap: 2px; }
.citations-toggle-title { font-size: 13.5px; font-weight: 600; color: var(--text); }
.citations-toggle-desc { font-size: 12px; color: var(--muted2); line-height: 1.4; }

.chat-style-title {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text);
}

.chat-style-card.active .chat-style-title {
    color: var(--accent-ink);
}

.chat-style-check {
    color: var(--accent-ink);
}

.chat-style-desc {
    font-size: 12px;
    color: var(--muted2);
    margin-top: 2px;
}

/* Brand color swatches (design spec) */
.accent-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 18px;
}

.accent-swatch {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
    transition: box-shadow var(--transition-fast);
}

.accent-swatch.active {
    border-color: var(--surface);
}

.accent-custom {
    position: relative;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px dashed var(--o12);
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
}

.accent-custom input[type="color"] {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    border: none;
    padding: 0;
}

.accent-custom-icon {
    color: var(--muted);
    font-size: 18px;
    line-height: 1;
    pointer-events: none;
}

.accent-hex {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--muted);
    margin-left: 4px;
}

/* Auxiliary color pickers (background + bubble) */
.aux-color-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 4px;
}

.aux-color {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 140px;
}

.aux-color-label {
    font-size: 12px;
    color: var(--muted2);
}

.aux-color-input {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg);
    border: 1px solid var(--o12);
    border-radius: var(--radius-btn);
    padding: 6px 10px;
}

.aux-color-input input[type="color"] {
    width: 26px;
    height: 26px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: none;
    cursor: pointer;
}

.aux-color-value {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--muted);
}

/* Typography chips (design spec) */
.font-chips {
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
    margin-top: 12px;
}

.font-chip {
    padding: 9px 15px;
    border-radius: var(--radius-chip);
    cursor: pointer;
    font-size: 13.5px;
    font-weight: 500;
    background: var(--bg);
    border: 1px solid var(--o12);
    color: var(--text3);
    transition: all var(--transition-fast);
}

.font-chip.active {
    background: var(--accent-bg-12);
    border: 1px solid var(--accent-border);
    color: var(--accent-ink);
}

.form-group {
    margin-bottom: var(--space-md);
}

.form-group label {
    display: block;
    margin-bottom: var(--space-sm);
    color: var(--text3);
    font-weight: 500;
    font-size: 13.5px;
}

.form-group input[type="file"],
.form-group select,
.form-group textarea {
    width: 100%;
    padding: var(--space-sm);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--background-soft);
}

.file-input {
    position: relative;
}

.file-input input[type="file"] {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
}

.file-label {
    display: block;
    padding: var(--space-xs) var(--space-sm);
    background: var(--background-soft);
    border: 1px dashed var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    text-align: center;
    color: var(--text-muted);
    font-size: var(--text-sm);
}

.color-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
}

.color-picker {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.color-input {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    background: var(--background-soft);
    padding: var(--space-xs);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
}

.color-input input[type="color"] {
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
}

.color-value {
    font-family: monospace;
    color: var(--text-muted);
    font-size: var(--text-xs);
}

.button-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md);
    border-top: 1px solid var(--o08);
    background: transparent;
    margin-top: auto;
    flex-shrink: 0;
}

/* Save Message Styles */
.save-message {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.save-message.success {
    background: color-mix(in srgb, var(--success-color) 10%, transparent);
    color: var(--success-color);
    border: 1px solid color-mix(in srgb, var(--success-color) 30%, transparent);
}

.save-message.error {
    background: color-mix(in srgb, var(--error-color) 10%, transparent);
    color: var(--error-color);
    border: 1px solid color-mix(in srgb, var(--error-color) 30%, transparent);
}

.message-icon {
    font-size: 1rem;
}

/* Button Actions */
.button-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
}

.save-button,
.cancel-button {
    padding: var(--space-sm) var(--space-xl);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-weight: 500;
    min-width: 120px;
    transition: var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
}

.save-button {
    background: var(--accent-solid);
    color: var(--on-accent-solid);
}

.save-button:hover:not(:disabled) {
    background: var(--primary-dark);
}

.save-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.cancel-button {
    background: var(--background-soft);
    color: var(--text-color);
}

.cancel-button:hover:not(:disabled) {
    background: var(--background-mute);
}

.cancel-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Spinner Animation */
.spinner {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.font-picker {
    position: relative;
}

.font-dropdown {
    position: relative;
}

.font-search {
    width: 100%;
    padding: 11px 14px;
    border: 1px solid var(--o12);
    border-radius: var(--radius-btn);
    background: var(--bg);
    color: var(--text);
    font-size: 14px;
    outline: none;
}

.font-search:focus {
    border-color: var(--accent-border);
}

.font-options {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 200px;
    overflow-y: auto;
    background: var(--surface);
    border: 1px solid var(--o12);
    border-radius: var(--radius-md);
    margin-top: var(--space-xs);
    z-index: 10;
    box-shadow: var(--shadow-lg);
}

.font-option {
    padding: var(--space-sm);
    cursor: pointer;
    transition: var(--transition-fast);
}

.font-option:hover {
    background: var(--background-soft);
}

/* Welcome text customization styles */
.text-input,
.text-textarea {
    width: 100%;
    padding: 13px 15px;
    border: 1px solid var(--o12);
    border-radius: 11px;
    background: var(--bg);
    color: var(--text);
    font-size: 14px;
    font-family: inherit;
    transition: var(--transition-fast);
    resize: vertical;
}

.text-input:focus,
.text-textarea:focus {
    outline: none;
    border-color: var(--accent-border);
}

.text-input::placeholder,
.text-textarea::placeholder {
    color: var(--muted2);
}

.input-hint {
    display: block;
    margin-top: var(--space-xs);
    color: var(--muted);
    font-size: 12px;
    line-height: 1.4;
}

.text-textarea {
    min-height: 80px;
    line-height: 1.5;
}

/* Greeting messages (design spec) */
.chat-initiation-section {
    position: relative;
}

.load-defaults-link {
    background: none;
    border: none;
    color: var(--accent-ink);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: var(--font-sans);
    padding: 0;
    white-space: nowrap;
}

.load-defaults-link:hover {
    text-decoration: underline;
}

.premium-badge-small {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--grad-generate);
    color: var(--on-dark);
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 600;
}

.premium-badge-small svg {
    font-size: 9px;
    color: #ffd700;
}

/* Locked State */
.locked-overlay-compact {
    background: var(--bg);
    border: 1px dashed var(--o12);
    border-radius: var(--radius-btn);
    padding: 14px 16px;
    margin-top: 6px;
}

.locked-content-compact {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.lock-icon-small {
    font-size: 1rem;
    color: var(--muted);
    opacity: 0.7;
}

.locked-text {
    flex: 1;
    min-width: 200px;
    font-size: 13.5px;
    color: var(--muted);
    margin: 0;
}

.upgrade-btn-compact {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--accent-solid);
    color: var(--on-accent-solid);
    border: none;
    border-radius: var(--radius-btn);
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
}

.upgrade-btn-compact:hover {
    filter: brightness(1.05);
}

.upgrade-btn-compact svg {
    font-size: 10px;
    color: #ffd700;
}

/* Greeting input row */
.init-add-row {
    display: flex;
    gap: 10px;
    margin-bottom: 14px;
}

.init-input {
    flex: 1;
    padding: 13px 15px;
    background: var(--bg);
    border: 1px solid var(--o12);
    border-radius: 11px;
    color: var(--text);
    font-size: 14px;
    outline: none;
    font-family: var(--font-sans);
    transition: var(--transition-fast);
}

.init-input:focus {
    border-color: var(--accent-border);
}

.init-add-btn {
    flex-shrink: 0;
    width: 46px;
    border-radius: 11px;
    background: var(--accent-solid);
    border: none;
    color: var(--on-accent-solid);
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.init-add-btn:hover:not(:disabled) {
    filter: brightness(1.05);
}

.init-add-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Greeting list */
.init-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.init-item {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 11px 14px;
    border-radius: 11px;
    background: var(--bg);
    border: 1px solid var(--o08);
}

.init-handle {
    color: var(--faint);
    font-size: 14px;
    cursor: grab;
    line-height: 1;
}

.init-text {
    flex: 1;
    font-size: 14px;
    color: var(--text2);
}

.init-remove {
    background: none;
    border: none;
    color: var(--muted2);
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 0;
    transition: color var(--transition-fast);
}

.init-remove:hover {
    color: var(--text2);
}

.init-icon-btn {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--muted2);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
    font-size: 12px;
    flex-shrink: 0;
}

.init-icon-btn:hover {
    color: var(--accent-ink);
}

.init-icon-btn.save {
    color: var(--c-teal);
}

.init-icon-btn.cancel:hover {
    color: var(--text2);
}

/* Inline edit */
.init-edit-inline {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
}

.init-edit-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--accent-border);
    border-radius: var(--radius-btn);
    background: var(--surface);
    color: var(--text);
    font-size: 14px;
    outline: none;
}

/* Empty state */
.init-empty {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 14px 16px;
    border-radius: 11px;
    background: var(--o03);
    border: 1px solid var(--o06);
    color: var(--muted2);
    font-size: 13.5px;
}

.init-empty-icon {
    font-size: 14px;
    opacity: 0.8;
}
</style>
