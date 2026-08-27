package mcptool

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestHTTPConnectorLifecycleAndToolCall(t *testing.T) {
	var methods []string
	var mu sync.Mutex
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			mu.Lock()
			methods = append(methods, "DELETE")
			mu.Unlock()
			w.WriteHeader(http.StatusNoContent)
			return
		}
		body := decodeMCPRequest(t, r)
		method, _ := body["method"].(string)
		mu.Lock()
		methods = append(methods, method)
		mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		if method == "initialize" {
			w.Header().Set("Mcp-Session-Id", "session-1")
		}
		if method == "notifications/initialized" {
			w.WriteHeader(http.StatusAccepted)
			return
		}
		id := body["id"]
		switch method {
		case "initialize":
			writeMCPJSON(w, map[string]any{"jsonrpc": "2.0", "id": id, "result": map[string]any{"protocolVersion": "2024-11-05"}})
		case "tools/list":
			writeMCPJSON(w, map[string]any{"jsonrpc": "2.0", "id": id, "result": map[string]any{"tools": []any{map[string]any{"name": "search", "description": "Search records", "inputSchema": map[string]any{"type": "object", "properties": map[string]any{"query": map[string]any{"type": "string"}}}}}}})
		case "tools/call":
			params, _ := body["params"].(map[string]any)
			if params["name"] != "search" {
				t.Fatalf("unexpected MCP tool name: %#v", params)
			}
			writeMCPJSON(w, map[string]any{"jsonrpc": "2.0", "id": id, "result": map[string]any{"content": []any{map[string]any{"type": "text", "text": "found"}}}})
		}
	}))
	defer server.Close()

	urlValue := server.URL
	connector := newHTTPConnector(Tool{URL: &urlValue, TransportType: "http"})
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := connector.Connect(ctx); err != nil {
		t.Fatal(err)
	}
	tools, err := connector.Tools(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if len(tools) != 1 || tools[0].Name != "search" || tools[0].Parameters["type"] != "object" {
		t.Fatalf("tools = %#v", tools)
	}
	result, err := connector.Call(ctx, "search", map[string]any{"query": "refund"})
	if err != nil {
		t.Fatal(err)
	}
	if !containsMCPValue(result, "found") {
		t.Fatalf("tool result = %#v", result)
	}
	if err := connector.Close(ctx); err != nil {
		t.Fatal(err)
	}
	mu.Lock()
	defer mu.Unlock()
	if !equalStrings(methods, []string{"initialize", "notifications/initialized", "tools/list", "tools/call", "DELETE"}) {
		t.Fatalf("MCP method sequence = %#v", methods)
	}
}

func TestSSEConnectorUsesEndpointAndCleansStream(t *testing.T) {
	var methods []string
	var mu sync.Mutex
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			w.Header().Set("Content-Type", "text/event-stream")
			flusher, ok := w.(http.Flusher)
			if !ok {
				t.Fatal("SSE test server does not support flushing")
			}
			_, _ = io.WriteString(w, "event: endpoint\ndata: /messages\n\n")
			flusher.Flush()
			<-r.Context().Done()
			return
		}
		body := decodeMCPRequest(t, r)
		method, _ := body["method"].(string)
		mu.Lock()
		methods = append(methods, method)
		mu.Unlock()
		if method == "notifications/initialized" {
			w.WriteHeader(http.StatusAccepted)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		writeMCPJSON(w, map[string]any{"jsonrpc": "2.0", "id": body["id"], "result": map[string]any{"tools": []any{map[string]any{"name": "ping", "inputSchema": map[string]any{"type": "object"}}}}})
		if method == "initialize" {
			// The initialize result above is intentionally accepted by the
			// connector; list and call use the same simple test response shape.
		}
	}))
	defer server.Close()

	urlValue := server.URL + "/sse"
	connector := newSSEConnector(Tool{URL: &urlValue, TransportType: "sse"})
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := connector.Connect(ctx); err != nil {
		t.Fatal(err)
	}
	tools, err := connector.Tools(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if len(tools) != 1 || tools[0].Name != "ping" {
		t.Fatalf("SSE tools = %#v", tools)
	}
	if err := connector.Close(ctx); err != nil {
		t.Fatal(err)
	}
	mu.Lock()
	defer mu.Unlock()
	if len(methods) < 3 || methods[0] != "initialize" || methods[1] != "notifications/initialized" || methods[2] != "tools/list" {
		t.Fatalf("SSE method sequence = %#v", methods)
	}
}

func TestStdioConnectorLifecycleAndToolCall(t *testing.T) {
	command := os.Args[0]
	connector := newStdioConnector(Tool{Command: &command, Args: []string{"-test.run=TestMCPStdioHelper"}, EnvVars: map[string]string{"MCP_STDIO_HELPER": "1"}}, command, []string{"-test.run=TestMCPStdioHelper"})
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := connector.Connect(ctx); err != nil {
		t.Fatal(err)
	}
	tools, err := connector.Tools(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if len(tools) != 1 || tools[0].Name != "echo" {
		t.Fatalf("stdio tools = %#v", tools)
	}
	result, err := connector.Call(ctx, "echo", map[string]any{"text": "hello"})
	if err != nil {
		t.Fatal(err)
	}
	if !containsMCPValue(result, "hello") {
		t.Fatalf("stdio result = %#v", result)
	}
	if err := connector.Close(ctx); err != nil {
		t.Fatal(err)
	}
}

func TestMCPStdioHelper(t *testing.T) {
	if os.Getenv("MCP_STDIO_HELPER") != "1" {
		return
	}
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		var request map[string]any
		if json.Unmarshal(scanner.Bytes(), &request) != nil {
			continue
		}
		method, _ := request["method"].(string)
		if method == "notifications/initialized" {
			continue
		}
		result := map[string]any{}
		switch method {
		case "initialize":
			result = map[string]any{"protocolVersion": "2024-11-05"}
		case "tools/list":
			result = map[string]any{"tools": []any{map[string]any{"name": "echo", "description": "Echo input", "inputSchema": map[string]any{"type": "object"}}}}
		case "tools/call":
			params, _ := request["params"].(map[string]any)
			arguments, _ := params["arguments"].(map[string]any)
			result = map[string]any{"content": []any{map[string]any{"type": "text", "text": arguments["text"]}}}
		}
		response := map[string]any{"jsonrpc": "2.0", "id": request["id"], "result": result}
		encoded, _ := json.Marshal(response)
		_, _ = fmt.Fprintln(os.Stdout, string(encoded))
	}
	os.Exit(0)
}

func decodeMCPRequest(t *testing.T, r *http.Request) map[string]any {
	t.Helper()
	var request map[string]any
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		t.Fatalf("decode MCP request: %v", err)
	}
	return request
}

func writeMCPJSON(w http.ResponseWriter, value any) {
	encoded, _ := json.Marshal(value)
	_, _ = w.Write(encoded)
}

func containsMCPValue(value any, needle string) bool {
	encoded, err := json.Marshal(value)
	return err == nil && strings.Contains(string(encoded), needle)
}

func equalStrings(left, right []string) bool {
	if len(left) != len(right) {
		return false
	}
	for index := range left {
		if left[index] != right[index] {
			return false
		}
	}
	return true
}
