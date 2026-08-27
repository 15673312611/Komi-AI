package realtime

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/chattermate/chattermate/backend-go/internal/agent"
	"github.com/chattermate/chattermate/backend-go/internal/aiconfig"
	"github.com/chattermate/chattermate/backend-go/internal/channel"
	"github.com/chattermate/chattermate/backend-go/internal/chat"
	"github.com/chattermate/chattermate/backend-go/internal/guardrail"
	"github.com/chattermate/chattermate/backend-go/internal/leadcapture"
)

type channelAIMessage struct {
	Role       string              `json:"role"`
	Content    string              `json:"content,omitempty"`
	Name       string              `json:"name,omitempty"`
	ToolCallID string              `json:"tool_call_id,omitempty"`
	ToolCalls  []channelAIToolCall `json:"tool_calls,omitempty"`
}

type channelAIToolCall struct {
	ID       string                `json:"id"`
	Type     string                `json:"type"`
	Function channelAIFunctionCall `json:"function"`
}

type channelAIFunctionCall struct {
	Name      string `json:"name"`
	Arguments string `json:"arguments"`
}

// ChannelReply is the AI callback used by channel ingress. It deliberately
// returns the same action fields that the Python ChatResponse exposes, even
// when a provider returns ordinary text and the action fields remain false.
func (s *Server) ChannelReply(ctx context.Context, request channel.ReplyRequest) (channel.Reply, error) {
	if s == nil || s.deps.Agents == nil {
		return channel.Reply{}, errors.New("agent service is not configured")
	}
	configuredAgent, err := s.deps.Agents.Get(ctx, request.AgentID, request.OrganizationID)
	if err != nil {
		return channel.Reply{}, err
	}
	if configuredAgent == nil || !configuredAgent.IsActive {
		return channel.Reply{}, errors.New("agent is not active")
	}
	if !configuredAgent.AIRepliesEnabled {
		return channel.Reply{}, errors.New("AI replies are disabled")
	}
	if s.deps.AIConfigs == nil {
		return channel.Reply{}, errors.New("AI configuration is not available")
	}
	store, ok := s.deps.AIConfigs.(aiconfig.CredentialStore)
	if !ok || store == nil {
		return channel.Reply{}, errors.New("AI credentials are not available")
	}
	cfg, key, err := store.GetActiveAPIKey(ctx, request.OrganizationID)
	if err != nil || cfg == nil || strings.TrimSpace(key) == "" {
		if err != nil {
			return channel.Reply{}, err
		}
		return channel.Reply{}, errors.New("AI configuration is not available")
	}
	guardrailCtx := s.guardrailContext(ctx, configuredAgent)
	guardrailConfig := guardrailSettings(s.deps.Config)

	var leadConfig *leadcapture.Config
	if leadStore, ok := s.deps.LeadCapture.(leadcapture.Store); ok && leadStore != nil {
		leadConfig, _ = leadStore.GetOrCreate(ctx, request.AgentID, request.OrganizationID)
	}
	system := channelSystemPrompt(configuredAgent, leadConfig, request.Channel, guardrailCtx, guardrailConfig)
	grounded, knowledgeContext := s.searchKnowledgeForReply(ctx, request.OrganizationID, request.AgentID, request.Message, "")
	system += knowledgeContext
	messages := channelConversationMessages(ctx, s.deps.Chats, request.SessionID, request.OrganizationID)
	if len(messages) == 0 {
		messages = []channelAIMessage{{Role: "user", Content: request.Message}}
	}
	tools, toolState := s.buildAITools(ctx, configuredAgent, request.OrganizationID, request.AgentID, request.CustomerID, request.SessionID)
	defer closeAIToolState(toolState)
	if toolState.MCPRuntime != nil {
		system += mcpAIInstructions
	}
	raw, toolState, err := completeChannelAI(ctx, cfg.ModelType, cfg.ModelName, key, system, messages, 1200, tools, toolState)
	if err != nil {
		return channel.Reply{}, err
	}
	reply := parseChannelReply(raw)
	reply = applyAIToolState(reply, toolState)
	originalMessage := reply.Message
	var outputRules []string
	reply.Message, outputRules = guardrail.CheckOutput(originalMessage, guardrailCtx, guardrailConfig)
	if len(outputRules) > 0 {
		s.recordGuardrail(ctx, guardrail.EventInput{
			OrganizationID: request.OrganizationID, AgentID: request.AgentID, SessionID: request.SessionID,
			Surface: guardrail.SurfaceChannel, Layer: "output", Action: outputAction(outputRules),
			Rules: outputRules, CharLen: len([]rune(originalMessage)), Excerpt: originalMessage,
		})
	}
	return finalizeAIReply(configuredAgent, request.Channel, leadConfig, reply, grounded), nil
}

func channelSystemPrompt(configured *agent.Agent, leadConfig *leadcapture.Config, channelName string, guardrailCtx guardrail.Context, guardrailConfig guardrail.Settings) string {
	instructions := strings.Join(configured.Instructions, "\n")
	if strings.TrimSpace(instructions) == "" {
		instructions = "You are a helpful customer service agent. Be concise and professional."
	}
	prompt := guardrail.WrapOperator(instructions) + guardrail.ScopePrompt(guardrailCtx) + `

Keep responses concise and focused, normally 2-4 sentences. Never invent prices, URLs, order status, tracking, refunds, policies, stock, dates, or other operational facts. If you do not know, say so and offer human help.

Return ONLY a JSON object with these fields:
{"message":"customer-facing reply","transfer_to_human":false,"transfer_reason":"","transfer_description":"","end_chat":false,"end_chat_reason":"","end_chat_description":"","request_contact":false,"request_rating":false,"request_lead_capture":false,"lead_email":"","lead_name":"","lead_company":"","lead_phone":"","lead_data":{},"lead_summary":"","lead_consent":false,"sources":[],"shopify_output":null,"create_ticket":false,"ticket_summary":"","ticket_description":"","integration_type":"","ticket_id":"","ticket_status":"","ticket_priority":""}
Set transfer_to_human=true only when human transfer is appropriate. Set end_chat=true only after the issue is resolved or the customer explicitly ends the conversation.`
	if widgetChannel(channelName) {
		prompt += " Widget chats may request a rating only when end_chat=true; never request a rating on an otherwise open turn."
	} else {
		prompt += " External channels do not support ratings; keep request_rating=false."
	}
	if configured.TransferToHuman {
		prompt += " A human transfer is enabled; include a concise transfer_reason and transfer_description when using it."
	} else {
		prompt += " Human transfer is disabled for this agent; keep transfer_to_human=false."
	}
	if leadConfig != nil && leadConfig.Enabled {
		prompt += leadCapturePrompt(leadConfig, channelName)
	} else {
		prompt += " Lead capture is disabled; keep request_lead_capture=false and do not ask for contact details solely for lead capture."
	}
	return guardrail.ApplyPolicy(prompt, guardrailCtx, guardrailConfig.PolicyEnabled)
}

func outputAction(rules []string) string {
	for _, rule := range rules {
		if rule == guardrail.RulePromptLeak {
			return "replaced"
		}
	}
	return "counted"
}

func leadCapturePrompt(configured *leadcapture.Config, channelName string) string {
	if configured == nil || !configured.Enabled {
		return ""
	}
	fields := make([]string, 0, len(configured.Fields))
	for _, field := range configured.Fields {
		if !field.Enabled && field.Key != "email" {
			continue
		}
		key := strings.TrimSpace(field.Key)
		if key == "" {
			continue
		}
		label := strings.TrimSpace(key)
		if field.Label != nil && strings.TrimSpace(*field.Label) != "" {
			label = strings.TrimSpace(*field.Label)
		}
		fields = append(fields, key+" ("+label+")")
	}
	if len(fields) == 0 {
		fields = []string{"email (email)"}
	}
	channelName = strings.TrimSpace(channelName)
	if channelName == "" {
		channelName = "channel"
	}
	prompt := "\nLead capture is enabled for this " + channelName + ". Collect the configured details naturally when relevant; never invent them. Configured fields: " + strings.Join(fields, ", ") + "."
	if configured.Guidance != nil && strings.TrimSpace(*configured.Guidance) != "" {
		prompt += " Operator guidance: " + strings.TrimSpace(*configured.Guidance)
	}
	prompt += " When a valid email has been explicitly provided, copy the exact value into lead_email and set request_lead_capture=true. Put configured custom values in lead_data, and write a concise qualification summary in lead_summary. Set lead_consent=true only when the visitor clearly consents."
	if configured.RequireConsent {
		prompt += " Explicit consent is required before requesting capture."
	}
	return prompt
}

func channelConversationMessages(ctx context.Context, store chat.Store, sessionID, organizationID uuid.UUID) []channelAIMessage {
	if store == nil {
		return nil
	}
	detail, err := store.GetDetail(ctx, sessionID, organizationID)
	if err != nil || detail == nil {
		return nil
	}
	result := make([]channelAIMessage, 0, len(detail.Messages))
	start := len(detail.Messages) - 30
	if start < 0 {
		start = 0
	}
	for _, item := range detail.Messages[start:] {
		if item.MessageType == "private_note" || boolAttribute(item.Attributes, "is_private") {
			continue
		}
		content := strings.TrimSpace(item.Message)
		if content == "" {
			continue
		}
		role := "assistant"
		if item.MessageType == "user" {
			role = "user"
		}
		result = append(result, channelAIMessage{Role: role, Content: content})
	}
	return result
}

type channelAICompletion struct {
	Content   string
	ToolCalls []channelAIToolCall
}

const channelAIToolCallLimit = 5

// completeChannelAI runs the provider request and, for OpenAI-compatible
// providers, feeds tool results back into the same conversation until the
// model produces its final answer. The limit is deliberately per turn so a
// malformed model cannot create an unbounded external side-effect loop.
func completeChannelAI(ctx context.Context, modelType, modelName, key, system string, messages []channelAIMessage, maxTokens int, tools []aiToolDefinition, state *aiToolState) (string, *aiToolState, error) {
	modelType = strings.ToUpper(strings.TrimSpace(modelType))
	if state == nil {
		state = &aiToolState{}
	}
	if modelType == "ANTHROPIC" {
		if len(tools) > 0 {
			return completeAnthropicAI(ctx, modelName, key, system, messages, maxTokens, tools, state)
		}
		body := map[string]any{"model": modelName, "system": system, "max_tokens": maxTokens, "messages": messages}
		raw, err := executeChannelAI(ctx, anthropicMessagesEndpoint(), map[string]string{"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"}, body, func(raw []byte) (string, error) {
			var response struct {
				Content []struct {
					Text string `json:"text"`
				} `json:"content"`
			}
			if err := json.Unmarshal(raw, &response); err != nil {
				return "", err
			}
			if len(response.Content) == 0 {
				return "", errors.New("AI provider returned no content")
			}
			return response.Content[0].Text, nil
		})
		return raw, state, err
	}
	if modelType == "GOOGLE" || modelType == "GOOGLEVERTEX" {
		if len(tools) > 0 {
			return completeGoogleAI(ctx, modelName, key, system, messages, maxTokens, tools, state)
		}
		contents := make([]map[string]any, 0, len(messages))
		for _, item := range messages {
			role := item.Role
			if role == "assistant" {
				role = "model"
			}
			contents = append(contents, map[string]any{"role": role, "parts": []map[string]string{{"text": item.Content}}})
		}
		body := map[string]any{
			"systemInstruction": map[string]any{"parts": []map[string]string{{"text": system}}},
			"contents":          contents,
			"generationConfig":  map[string]any{"maxOutputTokens": maxTokens, "temperature": 0.2},
		}
		endpoint := googleGenerateContentEndpoint(modelName, key)
		raw, err := executeChannelAI(ctx, endpoint, map[string]string{"content-type": "application/json"}, body, func(raw []byte) (string, error) {
			var response struct {
				Candidates []struct {
					Content struct {
						Parts []struct {
							Text string `json:"text"`
						} `json:"parts"`
					} `json:"content"`
				} `json:"candidates"`
			}
			if err := json.Unmarshal(raw, &response); err != nil {
				return "", err
			}
			if len(response.Candidates) == 0 || len(response.Candidates[0].Content.Parts) == 0 {
				return "", errors.New("AI provider returned no content")
			}
			return response.Candidates[0].Content.Parts[0].Text, nil
		})
		return raw, state, err
	}
	base := strings.TrimRight(os.Getenv("AI_OPENAI_BASE_URL"), "/")
	if base == "" {
		switch modelType {
		case "GROQ":
			base = "https://api.groq.com/openai/v1"
		case "DEEPSEEK":
			base = "https://api.deepseek.com/v1"
		case "MISTRAL":
			base = "https://api.mistral.ai/v1"
		case "XAI":
			base = "https://api.x.ai/v1"
		case "OLLAMA":
			base = "http://localhost:11434/v1"
		case "HUGGINGFACE":
			base = "https://api-inference.huggingface.co/v1"
		default:
			base = "https://api.openai.com/v1"
		}
	}
	conversation := append([]channelAIMessage{{Role: "system", Content: system}}, messages...)
	definitions := make([]map[string]any, 0, len(tools))
	for _, tool := range tools {
		definitions = append(definitions, map[string]any{
			"type": "function",
			"function": map[string]any{
				"name": tool.Name, "description": tool.Description, "parameters": tool.Parameters,
			},
		})
	}

	for callCount := 0; ; {
		body := map[string]any{"model": modelName, "messages": conversation, "max_tokens": maxTokens, "temperature": 0.2}
		if len(definitions) == 0 || (callCount > 0 && modelType != "GROQ") {
			body["response_format"] = map[string]string{"type": "json_object"}
		}
		if len(definitions) > 0 {
			// Groq and several OpenAI-compatible gateways reject response_format
			// together with function tools. The first tool turn therefore leaves
			// JSON mode off; after a tool result, other OpenAI-compatible providers
			// get JSON mode back for the final structured reply.
			body["tools"] = definitions
			body["tool_choice"] = "auto"
		}
		completion, err := executeChannelAICompletion(ctx, base+"/chat/completions", map[string]string{"Authorization": "Bearer " + key, "content-type": "application/json"}, body)
		if err != nil {
			return "", state, err
		}
		if len(completion.ToolCalls) == 0 {
			return completion.Content, state, nil
		}
		if callCount+len(completion.ToolCalls) > channelAIToolCallLimit {
			return "", state, fmt.Errorf("AI tool call limit exceeded")
		}
		callCount += len(completion.ToolCalls)
		conversation = append(conversation, channelAIMessage{Role: "assistant", Content: completion.Content, ToolCalls: completion.ToolCalls})
		for _, call := range completion.ToolCalls {
			result := executeAITool(ctx, tools, call)
			encoded, encodeErr := json.Marshal(result)
			if encodeErr != nil {
				encoded = []byte(`{"success":false,"message":"tool result could not be encoded"}`)
			}
			conversation = append(conversation, channelAIMessage{Role: "tool", ToolCallID: call.ID, Name: call.Function.Name, Content: string(encoded)})
		}
	}
}

type anthropicMessage struct {
	Role    string           `json:"role"`
	Content []map[string]any `json:"content"`
}

type anthropicResponse struct {
	Content []struct {
		Type  string         `json:"type"`
		Text  string         `json:"text"`
		ID    string         `json:"id"`
		Name  string         `json:"name"`
		Input map[string]any `json:"input"`
	} `json:"content"`
}

func completeAnthropicAI(ctx context.Context, modelName, key, system string, messages []channelAIMessage, maxTokens int, tools []aiToolDefinition, state *aiToolState) (string, *aiToolState, error) {
	conversation := make([]anthropicMessage, 0, len(messages)+channelAIToolCallLimit)
	for _, item := range messages {
		role := item.Role
		if role != "user" && role != "assistant" {
			continue
		}
		conversation = append(conversation, anthropicMessage{Role: role, Content: []map[string]any{{"type": "text", "text": item.Content}}})
	}
	definitions := make([]map[string]any, 0, len(tools))
	for _, tool := range tools {
		definitions = append(definitions, map[string]any{"name": tool.Name, "description": tool.Description, "input_schema": tool.Parameters})
	}
	byName := make(map[string]aiToolDefinition, len(tools))
	for _, tool := range tools {
		byName[tool.Name] = tool
	}
	for callCount := 0; ; {
		body := map[string]any{"model": modelName, "system": system, "max_tokens": maxTokens, "messages": conversation, "tools": definitions, "tool_choice": map[string]string{"type": "auto"}}
		var completion anthropicResponse
		raw, err := executeChannelAIRaw(ctx, anthropicMessagesEndpoint(), map[string]string{"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"}, body)
		if err != nil {
			return "", state, err
		}
		if err := json.Unmarshal(raw, &completion); err != nil {
			return "", state, err
		}
		textParts := make([]string, 0)
		toolUses := make([]struct {
			ID    string
			Name  string
			Input map[string]any
		}, 0)
		assistantBlocks := make([]map[string]any, 0, len(completion.Content))
		for _, block := range completion.Content {
			switch block.Type {
			case "text":
				if strings.TrimSpace(block.Text) != "" {
					textParts = append(textParts, block.Text)
					assistantBlocks = append(assistantBlocks, map[string]any{"type": "text", "text": block.Text})
				}
			case "tool_use":
				toolUses = append(toolUses, struct {
					ID    string
					Name  string
					Input map[string]any
				}{ID: block.ID, Name: block.Name, Input: block.Input})
				assistantBlocks = append(assistantBlocks, map[string]any{"type": "tool_use", "id": block.ID, "name": block.Name, "input": block.Input})
			}
		}
		if len(toolUses) == 0 {
			return strings.Join(textParts, "\n"), state, nil
		}
		if callCount+len(toolUses) > channelAIToolCallLimit {
			return "", state, fmt.Errorf("AI tool call limit exceeded")
		}
		callCount += len(toolUses)
		conversation = append(conversation, anthropicMessage{Role: "assistant", Content: assistantBlocks})
		results := make([]map[string]any, 0, len(toolUses))
		for _, use := range toolUses {
			result := executeAIToolByName(ctx, byName, use.Name, use.Input)
			results = append(results, map[string]any{"type": "tool_result", "tool_use_id": use.ID, "content": mustJSONText(result)})
		}
		conversation = append(conversation, anthropicMessage{Role: "user", Content: results})
	}
}

type googleMessage struct {
	Role  string           `json:"role"`
	Parts []map[string]any `json:"parts"`
}

type googleResponse struct {
	Candidates []struct {
		Content struct {
			Role  string `json:"role"`
			Parts []struct {
				Text         string          `json:"text"`
				FunctionCall *googleFunction `json:"functionCall"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

type googleFunction struct {
	Name string         `json:"name"`
	Args map[string]any `json:"args"`
}

func completeGoogleAI(ctx context.Context, modelName, key, system string, messages []channelAIMessage, maxTokens int, tools []aiToolDefinition, state *aiToolState) (string, *aiToolState, error) {
	conversation := make([]googleMessage, 0, len(messages)+channelAIToolCallLimit*2)
	for _, item := range messages {
		role := item.Role
		if role == "assistant" {
			role = "model"
		}
		if role != "user" && role != "model" {
			continue
		}
		conversation = append(conversation, googleMessage{Role: role, Parts: []map[string]any{{"text": item.Content}}})
	}
	declarations := make([]map[string]any, 0, len(tools))
	byName := make(map[string]aiToolDefinition, len(tools))
	for _, tool := range tools {
		declarations = append(declarations, map[string]any{"name": tool.Name, "description": tool.Description, "parameters": tool.Parameters})
		byName[tool.Name] = tool
	}
	endpoint := googleGenerateContentEndpoint(modelName, key)
	for callCount := 0; ; {
		body := map[string]any{
			"systemInstruction": map[string]any{"parts": []map[string]string{{"text": system}}},
			"contents":          conversation,
			"tools":             []map[string]any{{"functionDeclarations": declarations}},
			"generationConfig":  map[string]any{"maxOutputTokens": maxTokens, "temperature": 0.2},
		}
		raw, err := executeChannelAIRaw(ctx, endpoint, map[string]string{"content-type": "application/json"}, body)
		if err != nil {
			return "", state, err
		}
		var completion googleResponse
		if err := json.Unmarshal(raw, &completion); err != nil {
			return "", state, err
		}
		if len(completion.Candidates) == 0 {
			return "", state, errors.New("AI provider returned no content")
		}
		parts := completion.Candidates[0].Content.Parts
		textParts := make([]string, 0)
		modelParts := make([]map[string]any, 0, len(parts))
		calls := make([]*googleFunction, 0)
		for index := range parts {
			part := parts[index]
			if strings.TrimSpace(part.Text) != "" {
				textParts = append(textParts, part.Text)
				modelParts = append(modelParts, map[string]any{"text": part.Text})
			}
			if part.FunctionCall != nil && strings.TrimSpace(part.FunctionCall.Name) != "" {
				calls = append(calls, part.FunctionCall)
				modelParts = append(modelParts, map[string]any{"functionCall": map[string]any{"name": part.FunctionCall.Name, "args": part.FunctionCall.Args}})
			}
		}
		if len(calls) == 0 {
			return strings.Join(textParts, "\n"), state, nil
		}
		if callCount+len(calls) > channelAIToolCallLimit {
			return "", state, fmt.Errorf("AI tool call limit exceeded")
		}
		callCount += len(calls)
		conversation = append(conversation, googleMessage{Role: "model", Parts: modelParts})
		responses := make([]map[string]any, 0, len(calls))
		for _, call := range calls {
			result := executeAIToolByName(ctx, byName, call.Name, call.Args)
			responses = append(responses, map[string]any{"functionResponse": map[string]any{"name": call.Name, "response": result}})
		}
		conversation = append(conversation, googleMessage{Role: "user", Parts: responses})
	}
}

func anthropicMessagesEndpoint() string {
	base := strings.TrimRight(strings.TrimSpace(os.Getenv("AI_ANTHROPIC_BASE_URL")), "/")
	if base == "" {
		base = "https://api.anthropic.com"
	}
	if strings.HasSuffix(base, "/v1/messages") {
		return base
	}
	return base + "/v1/messages"
}

func googleGenerateContentEndpoint(modelName, key string) string {
	base := strings.TrimRight(strings.TrimSpace(os.Getenv("AI_GOOGLE_BASE_URL")), "/")
	if base == "" {
		base = "https://generativelanguage.googleapis.com/v1beta"
	}
	if !strings.HasSuffix(base, "/v1beta") && !strings.HasSuffix(base, "/v1") {
		base += "/v1beta"
	}
	return base + "/models/" + url.PathEscape(modelName) + ":generateContent?key=" + url.QueryEscape(key)
}

func mustJSONText(value any) string {
	encoded, err := json.Marshal(value)
	if err != nil {
		return `{"success":false,"message":"tool result could not be encoded"}`
	}
	return string(encoded)
}

func executeChannelAICompletion(ctx context.Context, endpoint string, headers map[string]string, body any) (channelAICompletion, error) {
	var completion channelAICompletion
	raw, err := executeChannelAIRaw(ctx, endpoint, headers, body)
	if err != nil {
		return completion, err
	}
	var response struct {
		Choices []struct {
			Message struct {
				Content   string              `json:"content"`
				ToolCalls []channelAIToolCall `json:"tool_calls"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(raw, &response); err != nil {
		return completion, err
	}
	if len(response.Choices) == 0 {
		return completion, errors.New("AI provider returned no content")
	}
	completion.Content = response.Choices[0].Message.Content
	completion.ToolCalls = response.Choices[0].Message.ToolCalls
	return completion, nil
}

func executeChannelAIRaw(ctx context.Context, endpoint string, headers map[string]string, body any) ([]byte, error) {
	encoded, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(encoded))
	if err != nil {
		return nil, err
	}
	for key, value := range headers {
		request.Header.Set(key, value)
	}
	client := &http.Client{Timeout: 90 * time.Second}
	response, err := client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(response.Body, 4<<20))
	if err != nil {
		return nil, err
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return nil, fmt.Errorf("AI provider returned HTTP %d: %s", response.StatusCode, strings.TrimSpace(string(raw)))
	}
	return raw, nil
}

func executeChannelAI(ctx context.Context, endpoint string, headers map[string]string, body any, decode func([]byte) (string, error)) (string, error) {
	encoded, err := json.Marshal(body)
	if err != nil {
		return "", err
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(encoded))
	if err != nil {
		return "", err
	}
	for key, value := range headers {
		request.Header.Set(key, value)
	}
	client := &http.Client{Timeout: 90 * time.Second}
	response, err := client.Do(request)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(response.Body, 4<<20))
	if err != nil {
		return "", err
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return "", fmt.Errorf("AI provider returned HTTP %d: %s", response.StatusCode, strings.TrimSpace(string(raw)))
	}
	return decode(raw)
}

func parseChannelReply(raw string) channel.Reply {
	value := strings.TrimSpace(raw)
	if strings.HasPrefix(value, "```") {
		value = strings.TrimSpace(strings.TrimPrefix(value, "```json"))
		value = strings.TrimSpace(strings.TrimPrefix(value, "```"))
		value = strings.TrimSuffix(value, "```")
		value = strings.TrimSpace(value)
	}
	var parsed struct {
		Message             string           `json:"message"`
		TransferToHuman     bool             `json:"transfer_to_human"`
		TransferReason      string           `json:"transfer_reason"`
		TransferDescription string           `json:"transfer_description"`
		EndChat             bool             `json:"end_chat"`
		EndChatReason       string           `json:"end_chat_reason"`
		EndChatDescription  string           `json:"end_chat_description"`
		RequestContact      bool             `json:"request_contact"`
		RequestRating       bool             `json:"request_rating"`
		RequestLeadCapture  bool             `json:"request_lead_capture"`
		LeadEmail           string           `json:"lead_email"`
		LeadName            string           `json:"lead_name"`
		LeadCompany         string           `json:"lead_company"`
		LeadPhone           string           `json:"lead_phone"`
		LeadData            map[string]any   `json:"lead_data"`
		LeadSummary         string           `json:"lead_summary"`
		LeadConsent         bool             `json:"lead_consent"`
		Sources             []map[string]any `json:"sources"`
		ShopifyOutput       map[string]any   `json:"shopify_output"`
		CreateTicket        bool             `json:"create_ticket"`
		TicketSummary       string           `json:"ticket_summary"`
		TicketDescription   string           `json:"ticket_description"`
		IntegrationType     string           `json:"integration_type"`
		TicketID            string           `json:"ticket_id"`
		TicketStatus        string           `json:"ticket_status"`
		TicketPriority      string           `json:"ticket_priority"`
	}
	if json.Unmarshal([]byte(value), &parsed) != nil {
		return channel.Reply{Message: strings.TrimSpace(raw)}
	}
	return channel.Reply{
		Message: parsed.Message, TransferToHuman: parsed.TransferToHuman, TransferReason: parsed.TransferReason,
		TransferDescription: parsed.TransferDescription, EndChat: parsed.EndChat, EndChatReason: parsed.EndChatReason,
		EndChatDescription: parsed.EndChatDescription, RequestContact: parsed.RequestContact, RequestRating: parsed.RequestRating,
		RequestLeadCapture: parsed.RequestLeadCapture, LeadEmail: parsed.LeadEmail, LeadName: parsed.LeadName,
		LeadCompany: parsed.LeadCompany, LeadPhone: parsed.LeadPhone, LeadData: parsed.LeadData,
		LeadSummary: parsed.LeadSummary, LeadConsent: parsed.LeadConsent, Sources: parsed.Sources,
		ShopifyOutput: parsed.ShopifyOutput, CreateTicket: parsed.CreateTicket, TicketSummary: parsed.TicketSummary,
		TicketDescription: parsed.TicketDescription, IntegrationType: parsed.IntegrationType, TicketID: parsed.TicketID,
		TicketStatus: parsed.TicketStatus, TicketPriority: parsed.TicketPriority,
	}
}
