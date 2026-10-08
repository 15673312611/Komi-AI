package realtime

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCompleteChannelAIOpenAIToolLoop(t *testing.T) {
	var requests []map[string]any
	toolCalls := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body := decodeAIRequest(t, r)
		requests = append(requests, body)
		w.Header().Set("Content-Type", "application/json")
		if len(requests) == 1 {
			_, _ = io.WriteString(w, `{"choices":[{"message":{"content":"","tool_calls":[{"id":"call-1","type":"function","function":{"name":"lookup","arguments":"{\"query\":\"refund\"}"}}]}}]}`)
			return
		}
		messages, _ := body["messages"].([]any)
		if len(messages) < 4 || objectString(messages[3], "role") != "tool" || !containsJSON(messages[3], "tool-result") {
			t.Fatalf("second OpenAI request did not contain the tool result: %#v", body["messages"])
		}
		_, _ = io.WriteString(w, `{"choices":[{"message":{"content":"{\"message\":\"OpenAI done\"}"}}]}`)
	}))
	defer server.Close()
	t.Setenv("AI_OPENAI_BASE_URL", server.URL)

	raw, _, err := completeChannelAI(context.Background(), "OPENAI", "test-model", "key", "system", []channelAIMessage{{Role: "user", Content: "help"}}, 100, []aiToolDefinition{{
		Name: "lookup", Parameters: map[string]any{"type": "object"}, Execute: func(_ context.Context, args map[string]any) (any, error) {
			toolCalls++
			if args["query"] != "refund" {
				t.Fatalf("tool args = %#v", args)
			}
			return map[string]any{"value": "tool-result"}, nil
		},
	}}, &aiToolState{})
	if err != nil {
		t.Fatal(err)
	}
	if raw != `{"message":"OpenAI done"}` || toolCalls != 1 || len(requests) != 2 {
		t.Fatalf("raw=%q toolCalls=%d requests=%d", raw, toolCalls, len(requests))
	}
}

func TestCompleteChannelAIAnthropicToolLoop(t *testing.T) {
	var requests []map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body := decodeAIRequest(t, r)
		requests = append(requests, body)
		w.Header().Set("Content-Type", "application/json")
		if len(requests) == 1 {
			_, _ = io.WriteString(w, `{"content":[{"type":"tool_use","id":"use-1","name":"lookup","input":{"query":"status"}}]}`)
			return
		}
		messages, _ := body["messages"].([]any)
		if len(messages) < 3 || objectString(messages[2], "role") != "user" || !containsJSON(messages[2], "tool_result") {
			t.Fatalf("second Anthropic request did not contain the tool result: %#v", body["messages"])
		}
		_, _ = io.WriteString(w, `{"content":[{"type":"text","text":"{\"message\":\"Anthropic done\"}"}]}`)
	}))
	defer server.Close()
	t.Setenv("AI_ANTHROPIC_BASE_URL", server.URL)

	raw, _, err := completeChannelAI(context.Background(), "ANTHROPIC", "claude-test", "key", "system", []channelAIMessage{{Role: "user", Content: "help"}}, 100, testAIEnabledTool(), &aiToolState{})
	if err != nil {
		t.Fatal(err)
	}
	if raw != `{"message":"Anthropic done"}` || len(requests) != 2 {
		t.Fatalf("raw=%q requests=%d", raw, len(requests))
	}
}

func TestCompleteChannelAIGoogleToolLoop(t *testing.T) {
	var requests []map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body := decodeAIRequest(t, r)
		requests = append(requests, body)
		w.Header().Set("Content-Type", "application/json")
		if len(requests) == 1 {
			_, _ = io.WriteString(w, `{"candidates":[{"content":{"role":"model","parts":[{"functionCall":{"name":"lookup","args":{"query":"status"}}}]}}]}`)
			return
		}
		contents, _ := body["contents"].([]any)
		if len(contents) < 3 || objectString(contents[2], "role") != "user" || !containsJSON(contents[2], "functionResponse") || !containsJSON(contents[2], "lookup") {
			t.Fatalf("second Google request did not contain the function response: %#v", body["contents"])
		}
		_, _ = io.WriteString(w, `{"candidates":[{"content":{"role":"model","parts":[{"text":"{\"message\":\"Google done\"}"}]}}]}`)
	}))
	defer server.Close()
	t.Setenv("AI_GOOGLE_BASE_URL", server.URL)

	raw, _, err := completeChannelAI(context.Background(), "GOOGLE", "gemini-test", "key", "system", []channelAIMessage{{Role: "user", Content: "help"}}, 100, testAIEnabledTool(), &aiToolState{})
	if err != nil {
		t.Fatal(err)
	}
	if raw != `{"message":"Google done"}` || len(requests) != 2 {
		t.Fatalf("raw=%q requests=%d", raw, len(requests))
	}
}

func TestCompleteChannelAIToolLoopStopsAtFiveCalls(t *testing.T) {
	requests := 0
	executions := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests++
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{"choices":[{"message":{"content":"","tool_calls":[{"id":"loop","type":"function","function":{"name":"lookup","arguments":"{}"}}]}}]}`)
	}))
	defer server.Close()
	t.Setenv("AI_OPENAI_BASE_URL", server.URL)

	_, _, err := completeChannelAI(context.Background(), "OPENAI", "test-model", "key", "system", []channelAIMessage{{Role: "user", Content: "loop"}}, 100, []aiToolDefinition{{
		Name: "lookup", Parameters: map[string]any{"type": "object"}, Execute: func(_ context.Context, _ map[string]any) (any, error) {
			executions++
			return map[string]any{"ok": true}, nil
		},
	}}, &aiToolState{})
	if err == nil || !strings.Contains(err.Error(), "tool call limit") {
		t.Fatalf("expected tool limit error, got %v", err)
	}
	if executions != channelAIToolCallLimit || requests != channelAIToolCallLimit+1 {
		t.Fatalf("executions=%d requests=%d", executions, requests)
	}
}

func testAIEnabledTool() []aiToolDefinition {
	return []aiToolDefinition{{
		Name: "lookup", Parameters: map[string]any{"type": "object"}, Execute: func(_ context.Context, _ map[string]any) (any, error) {
			return map[string]any{"value": "tool-result"}, nil
		},
	}}
}

func decodeAIRequest(t *testing.T, r *http.Request) map[string]any {
	t.Helper()
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		t.Fatalf("decode AI request: %v", err)
	}
	return body
}

func objectString(value any, key string) string {
	object, _ := value.(map[string]any)
	result, _ := object[key].(string)
	return result
}

func containsJSON(value any, needle string) bool {
	encoded, err := json.Marshal(value)
	return err == nil && strings.Contains(string(encoded), needle)
}
