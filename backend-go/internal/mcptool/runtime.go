package mcptool

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

const (
	runtimeConnectTimeout = 10 * time.Second
	runtimeCloseTimeout   = 2 * time.Second
	defaultCallTimeout    = 30 * time.Second
	maxRPCBodyBytes       = 4 << 20
)

// ToolDefinition is the provider-neutral description of one function exposed
// by a connected MCP server.
type ToolDefinition struct {
	Name        string
	Description string
	Parameters  map[string]any
	Connector   string
}

type RuntimeFailure struct {
	Name  string `json:"name"`
	Error string `json:"error"`
}

type RuntimeReport struct {
	Connected []string         `json:"connected"`
	Failed    []RuntimeFailure `json:"failed"`
}

// Runtime owns all MCP processes and remote streams for one AI turn. A
// runtime is intentionally short-lived: credentials and external sessions
// must not survive the conversation turn that created them.
type Runtime struct {
	mu          sync.RWMutex
	connections []mcpConnector
	tools       map[string]runtimeTool
	closed      bool
}

type runtimeTool struct {
	definition ToolDefinition
	connector  mcpConnector
}

type mcpConnector interface {
	Connect(context.Context) error
	Tools(context.Context) ([]ToolDefinition, error)
	Call(context.Context, string, map[string]any) (any, error)
	Close(context.Context) error
}

// NewRuntime loads the enabled MCP tools associated with an agent, connects
// each server, and keeps usable servers even when another one is unavailable.
// This mirrors the Python manager's partial-start behavior.
func NewRuntime(ctx context.Context, store Store, agentID, organizationID uuid.UUID) (*Runtime, RuntimeReport) {
	report := RuntimeReport{Connected: []string{}, Failed: []RuntimeFailure{}}
	if store == nil || agentID == uuid.Nil || organizationID == uuid.Nil {
		return nil, report
	}
	agentTools, err := store.AgentTools(ctx, agentID, organizationID)
	if err != nil {
		report.Failed = append(report.Failed, RuntimeFailure{Name: "agent_mcp_tools", Error: err.Error()})
		return nil, report
	}
	if agentTools == nil || len(agentTools.MCPTools) == 0 {
		return nil, report
	}

	runtime := &Runtime{connections: make([]mcpConnector, 0, len(agentTools.MCPTools)), tools: make(map[string]runtimeTool)}
	for _, config := range agentTools.MCPTools {
		connector, buildErr := newConnector(config)
		if buildErr != nil {
			report.Failed = append(report.Failed, RuntimeFailure{Name: config.Name, Error: buildErr.Error()})
			continue
		}
		connectCtx, cancel := context.WithTimeout(ctx, runtimeConnectTimeout)
		connectErr := connector.Connect(connectCtx)
		cancel()
		if connectErr != nil {
			_ = closeConnector(connector)
			report.Failed = append(report.Failed, RuntimeFailure{Name: config.Name, Error: connectErr.Error()})
			continue
		}
		listCtx, cancel := context.WithTimeout(ctx, toolTimeout(config))
		definitions, listErr := connector.Tools(listCtx)
		cancel()
		if listErr != nil {
			_ = closeConnector(connector)
			report.Failed = append(report.Failed, RuntimeFailure{Name: config.Name, Error: listErr.Error()})
			continue
		}
		usable := 0
		for _, definition := range definitions {
			definition.Name = strings.TrimSpace(definition.Name)
			if definition.Name == "" {
				continue
			}
			if definition.Parameters == nil {
				definition.Parameters = map[string]any{"type": "object", "properties": map[string]any{}}
			}
			definition.Connector = config.Name
			// Agno exposes the server's function name directly. Preserve that
			// contract and keep the first function when two servers collide.
			if _, exists := runtime.tools[definition.Name]; exists {
				continue
			}
			runtime.tools[definition.Name] = runtimeTool{definition: definition, connector: connector}
			usable++
		}
		if usable == 0 {
			_ = closeConnector(connector)
			report.Failed = append(report.Failed, RuntimeFailure{Name: config.Name, Error: "Connected, but the server exposed no tools"})
			continue
		}
		runtime.connections = append(runtime.connections, connector)
		report.Connected = append(report.Connected, config.Name)
	}
	if len(runtime.tools) == 0 {
		_ = runtime.Close(context.Background())
		return nil, report
	}
	return runtime, report
}

func (r *Runtime) Tools() []ToolDefinition {
	if r == nil {
		return nil
	}
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make([]ToolDefinition, 0, len(r.tools))
	for _, item := range r.tools {
		result = append(result, item.definition)
	}
	sort.Slice(result, func(i, j int) bool { return result[i].Name < result[j].Name })
	return result
}

func (r *Runtime) Call(ctx context.Context, name string, args map[string]any) (any, error) {
	if r == nil {
		return nil, errors.New("MCP runtime is not available")
	}
	r.mu.RLock()
	if r.closed {
		r.mu.RUnlock()
		return nil, errors.New("MCP runtime is closed")
	}
	item, ok := r.tools[name]
	r.mu.RUnlock()
	if !ok {
		return nil, fmt.Errorf("MCP tool not found: %s", name)
	}
	return item.connector.Call(ctx, name, args)
}

func (r *Runtime) Close(ctx context.Context) error {
	if r == nil {
		return nil
	}
	r.mu.Lock()
	if r.closed {
		r.mu.Unlock()
		return nil
	}
	r.closed = true
	connections := append([]mcpConnector(nil), r.connections...)
	r.connections = nil
	r.tools = nil
	r.mu.Unlock()

	var firstErr error
	for _, connector := range connections {
		closeCtx, cancel := context.WithTimeout(ctx, runtimeCloseTimeout)
		err := connector.Close(closeCtx)
		cancel()
		if err != nil && firstErr == nil {
			firstErr = err
		}
	}
	return firstErr
}

func closeConnector(connector mcpConnector) error {
	ctx, cancel := context.WithTimeout(context.Background(), runtimeCloseTimeout)
	defer cancel()
	return connector.Close(ctx)
}

func newConnector(tool Tool) (mcpConnector, error) {
	switch strings.ToLower(strings.TrimSpace(tool.TransportType)) {
	case "stdio":
		command, args, err := stdioCommand(tool)
		if err != nil {
			return nil, err
		}
		return newStdioConnector(tool, command, args), nil
	case "http", "sse":
		if tool.URL == nil || strings.TrimSpace(*tool.URL) == "" {
			return nil, errors.New("URL is required")
		}
		if _, err := url.ParseRequestURI(strings.TrimSpace(*tool.URL)); err != nil {
			return nil, fmt.Errorf("invalid MCP URL: %w", err)
		}
		if strings.EqualFold(tool.TransportType, "sse") {
			return newSSEConnector(tool), nil
		}
		return newHTTPConnector(tool), nil
	default:
		return nil, fmt.Errorf("unsupported MCP transport type: %s", tool.TransportType)
	}
}

func stdioCommand(tool Tool) (string, []string, error) {
	if tool.Command == nil || strings.TrimSpace(*tool.Command) == "" {
		return "", nil, errors.New("command is required")
	}
	command := strings.TrimSpace(*tool.Command)
	args := append([]string(nil), tool.Args...)
	for index, arg := range args {
		if arg != "@modelcontextprotocol/server-filesystem" {
			continue
		}
		if index == len(args)-1 {
			for _, value := range strings.Split(tool.EnvVars["ALLOWED_DIRECTORIES"], ",") {
				value = strings.TrimSpace(value)
				if value != "" {
					args = append(args, value)
				}
			}
			if len(args) == index+1 {
				return "", nil, errors.New("filesystem MCP tool requires allowed directories")
			}
		}
		break
	}
	return command, args, nil
}

func toolTimeout(tool Tool) time.Duration {
	if tool.Timeout != nil && *tool.Timeout > 0 {
		return time.Duration(*tool.Timeout) * time.Second
	}
	return defaultCallTimeout
}

type rpcError struct {
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data,omitempty"`
}

type rpcResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id"`
	Result  json.RawMessage `json:"result"`
	Error   *rpcError       `json:"error,omitempty"`
}

func rpcRequest(id uint64, method string, params any) ([]byte, string, error) {
	request := map[string]any{"jsonrpc": "2.0", "id": id, "method": method}
	if params != nil {
		request["params"] = params
	}
	encoded, err := json.Marshal(request)
	return encoded, idKeyNumber(id), err
}

func rpcNotification(method string, params any) ([]byte, error) {
	request := map[string]any{"jsonrpc": "2.0", "method": method}
	if params != nil {
		request["params"] = params
	}
	return json.Marshal(request)
}

func idKeyNumber(id uint64) string {
	return fmt.Sprintf("%d", id)
}

func responseIDKey(value json.RawMessage) string {
	return string(bytes.TrimSpace(value))
}

func checkRPCResponse(response rpcResponse) error {
	if response.Error == nil {
		return nil
	}
	if response.Error.Message == "" {
		return fmt.Errorf("MCP JSON-RPC error (%d)", response.Error.Code)
	}
	return fmt.Errorf("MCP JSON-RPC error (%d): %s", response.Error.Code, response.Error.Message)
}

func decodeRPCResult(response rpcResponse) (any, error) {
	if err := checkRPCResponse(response); err != nil {
		return nil, err
	}
	if len(response.Result) == 0 || bytes.Equal(bytes.TrimSpace(response.Result), []byte("null")) {
		return map[string]any{}, nil
	}
	var result any
	if err := json.Unmarshal(response.Result, &result); err != nil {
		return nil, err
	}
	return result, nil
}

func decodeToolList(response rpcResponse) ([]ToolDefinition, error) {
	if err := checkRPCResponse(response); err != nil {
		return nil, err
	}
	var result struct {
		Tools []struct {
			Name        string         `json:"name"`
			Description string         `json:"description"`
			InputSchema map[string]any `json:"inputSchema"`
		} `json:"tools"`
	}
	if err := json.Unmarshal(response.Result, &result); err != nil {
		return nil, err
	}
	definitions := make([]ToolDefinition, 0, len(result.Tools))
	for _, item := range result.Tools {
		definitions = append(definitions, ToolDefinition{Name: item.Name, Description: item.Description, Parameters: item.InputSchema})
	}
	return definitions, nil
}

type stdioConnector struct {
	tool        Tool
	command     string
	args        []string
	process     *exec.Cmd
	stdin       io.WriteCloser
	responses   map[string]chan rpcResponse
	mu          sync.Mutex
	writeMu     sync.Mutex
	nextID      uint64
	done        chan struct{}
	closeOnce   sync.Once
	processDone chan struct{}
	stderr      bytes.Buffer
}

func newStdioConnector(tool Tool, command string, args []string) *stdioConnector {
	return &stdioConnector{tool: tool, command: command, args: args, responses: make(map[string]chan rpcResponse), done: make(chan struct{}), processDone: make(chan struct{})}
}

func (c *stdioConnector) Connect(ctx context.Context) error {
	processCtx, cancel := context.WithCancel(context.Background())
	command := exec.CommandContext(processCtx, c.command, c.args...)
	command.Env = os.Environ()
	for key, value := range c.tool.EnvVars {
		if key == "ALLOWED_DIRECTORIES" {
			continue
		}
		command.Env = append(command.Env, key+"="+value)
	}
	stdin, err := command.StdinPipe()
	if err != nil {
		cancel()
		return err
	}
	stdout, err := command.StdoutPipe()
	if err != nil {
		cancel()
		return err
	}
	stderr, err := command.StderrPipe()
	if err != nil {
		cancel()
		return err
	}
	if err := command.Start(); err != nil {
		cancel()
		return err
	}
	c.process = command
	c.stdin = stdin
	go func() {
		_, _ = io.Copy(&c.stderr, stderr)
	}()
	go c.readStdout(stdout)
	go func() {
		_ = command.Wait()
		cancel()
		close(c.processDone)
		c.failPending(errors.New("MCP stdio server stopped"))
	}()
	if err := c.initialize(ctx); err != nil {
		return err
	}
	return nil
}

func (c *stdioConnector) readStdout(stdout io.Reader) {
	scanner := bufio.NewScanner(stdout)
	scanner.Buffer(make([]byte, 4096), maxRPCBodyBytes)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		var response rpcResponse
		if json.Unmarshal([]byte(line), &response) != nil || len(response.ID) == 0 {
			continue
		}
		key := responseIDKey(response.ID)
		c.mu.Lock()
		waiter := c.responses[key]
		delete(c.responses, key)
		c.mu.Unlock()
		if waiter != nil {
			waiter <- response
		}
	}
	select {
	case <-c.done:
	default:
		close(c.done)
	}
	c.failPending(errors.New("MCP stdio server closed its output"))
}

func (c *stdioConnector) initialize(ctx context.Context) error {
	_, err := c.request(ctx, "initialize", map[string]any{
		"protocolVersion": "2024-11-05",
		"capabilities":    map[string]any{},
		"clientInfo":      map[string]string{"name": "chattermate-go", "version": "1"},
	})
	if err != nil {
		return err
	}
	notification, err := rpcNotification("notifications/initialized", map[string]any{})
	if err != nil {
		return err
	}
	return c.write(notification)
}

func (c *stdioConnector) Tools(ctx context.Context) ([]ToolDefinition, error) {
	response, err := c.request(ctx, "tools/list", map[string]any{})
	if err != nil {
		return nil, err
	}
	return decodeToolList(response)
}

func (c *stdioConnector) Call(ctx context.Context, name string, args map[string]any) (any, error) {
	if args == nil {
		args = map[string]any{}
	}
	response, err := c.request(ctx, "tools/call", map[string]any{"name": name, "arguments": args})
	if err != nil {
		return nil, err
	}
	return decodeRPCResult(response)
}

func (c *stdioConnector) request(ctx context.Context, method string, params any) (rpcResponse, error) {
	c.mu.Lock()
	c.nextID++
	id := c.nextID
	c.mu.Unlock()
	payload, key, err := rpcRequest(id, method, params)
	if err != nil {
		return rpcResponse{}, err
	}
	waiter := make(chan rpcResponse, 1)
	c.mu.Lock()
	select {
	case <-c.done:
		c.mu.Unlock()
		return rpcResponse{}, errors.New("MCP stdio server is closed")
	default:
	}
	c.responses[key] = waiter
	c.mu.Unlock()
	if err := c.write(payload); err != nil {
		c.mu.Lock()
		delete(c.responses, key)
		c.mu.Unlock()
		return rpcResponse{}, err
	}
	select {
	case response := <-waiter:
		return response, nil
	case <-ctx.Done():
		c.mu.Lock()
		delete(c.responses, key)
		c.mu.Unlock()
		return rpcResponse{}, ctx.Err()
	case <-c.done:
		return rpcResponse{}, errors.New("MCP stdio server closed")
	}
}

func (c *stdioConnector) write(payload []byte) error {
	c.writeMu.Lock()
	defer c.writeMu.Unlock()
	if c.stdin == nil {
		return errors.New("MCP stdio server is not started")
	}
	_, err := c.stdin.Write(append(payload, '\n'))
	return err
}

func (c *stdioConnector) failPending(err error) {
	c.mu.Lock()
	pending := make([]chan rpcResponse, 0, len(c.responses))
	for key, waiter := range c.responses {
		delete(c.responses, key)
		pending = append(pending, waiter)
	}
	c.mu.Unlock()
	// A zero-ID response cannot carry an error string through rpcResponse, so
	// closing the channels lets request callers observe c.done instead.
	_ = err
	for _, waiter := range pending {
		select {
		case waiter <- rpcResponse{}:
		default:
		}
	}
}

func (c *stdioConnector) Close(ctx context.Context) error {
	var result error
	c.closeOnce.Do(func() {
		if c.stdin != nil {
			_ = c.stdin.Close()
		}
		select {
		case <-c.processDone:
		case <-ctx.Done():
			result = ctx.Err()
			if c.process != nil && c.process.Process != nil {
				_ = c.process.Process.Kill()
			}
			select {
			case <-c.processDone:
			case <-time.After(250 * time.Millisecond):
			}
		}
		select {
		case <-c.done:
		default:
			close(c.done)
		}
	})
	return result
}

type httpConnector struct {
	tool      Tool
	endpoint  string
	client    *http.Client
	requestMu sync.Mutex
	mu        sync.Mutex
	nextID    uint64
	sessionID string
	closed    bool
}

func newHTTPConnector(tool Tool) *httpConnector {
	return &httpConnector{tool: tool, endpoint: strings.TrimSpace(stringPointerValue(tool.URL)), client: &http.Client{}}
}

func (c *httpConnector) Connect(ctx context.Context) error {
	response, err := c.request(ctx, "initialize", map[string]any{
		"protocolVersion": "2024-11-05",
		"capabilities":    map[string]any{},
		"clientInfo":      map[string]string{"name": "chattermate-go", "version": "1"},
	})
	if err != nil {
		return err
	}
	if err := checkRPCResponse(response); err != nil {
		return err
	}
	return c.notify(ctx, "notifications/initialized", map[string]any{})
}

func (c *httpConnector) Tools(ctx context.Context) ([]ToolDefinition, error) {
	response, err := c.request(ctx, "tools/list", map[string]any{})
	if err != nil {
		return nil, err
	}
	return decodeToolList(response)
}

func (c *httpConnector) Call(ctx context.Context, name string, args map[string]any) (any, error) {
	if args == nil {
		args = map[string]any{}
	}
	response, err := c.request(ctx, "tools/call", map[string]any{"name": name, "arguments": args})
	if err != nil {
		return nil, err
	}
	return decodeRPCResult(response)
}

func (c *httpConnector) request(ctx context.Context, method string, params any) (rpcResponse, error) {
	c.requestMu.Lock()
	defer c.requestMu.Unlock()
	c.mu.Lock()
	c.nextID++
	id := c.nextID
	c.mu.Unlock()
	payload, key, err := rpcRequest(id, method, params)
	if err != nil {
		return rpcResponse{}, err
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint, bytes.NewReader(payload))
	if err != nil {
		return rpcResponse{}, err
	}
	c.setHeaders(request)
	response, err := c.client.Do(request)
	if err != nil {
		return rpcResponse{}, err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(response.Body, maxRPCBodyBytes))
		return rpcResponse{}, fmt.Errorf("MCP server returned HTTP %d: %s", response.StatusCode, strings.TrimSpace(string(body)))
	}
	c.captureSession(response)
	return readRPCResponse(response.Body, response.Header.Get("Content-Type"), key)
}

func (c *httpConnector) notify(ctx context.Context, method string, params any) error {
	payload, err := rpcNotification(method, params)
	if err != nil {
		return err
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	c.setHeaders(request)
	response, err := c.client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(response.Body, maxRPCBodyBytes))
		return fmt.Errorf("MCP notification returned HTTP %d: %s", response.StatusCode, strings.TrimSpace(string(body)))
	}
	return nil
}

func (c *httpConnector) setHeaders(request *http.Request) {
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Accept", "application/json, text/event-stream")
	request.Header.Set("MCP-Protocol-Version", "2024-11-05")
	for key, value := range c.tool.Headers {
		request.Header.Set(key, value)
	}
	c.mu.Lock()
	if c.sessionID != "" {
		request.Header.Set("Mcp-Session-Id", c.sessionID)
	}
	c.mu.Unlock()
}

func (c *httpConnector) captureSession(response *http.Response) {
	if value := response.Header.Get("Mcp-Session-Id"); value != "" {
		c.mu.Lock()
		c.sessionID = value
		c.mu.Unlock()
	}
}

func (c *httpConnector) Close(ctx context.Context) error {
	c.mu.Lock()
	if c.closed {
		c.mu.Unlock()
		return nil
	}
	c.closed = true
	sessionID := c.sessionID
	c.mu.Unlock()
	if sessionID == "" || c.tool.TerminateOnClose != nil && !*c.tool.TerminateOnClose {
		return nil
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodDelete, c.endpoint, nil)
	if err != nil {
		return err
	}
	c.setHeaders(request)
	response, err := c.client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return fmt.Errorf("MCP session close returned HTTP %d", response.StatusCode)
	}
	return nil
}

type sseConnector struct {
	tool       Tool
	endpoint   string
	client     *http.Client
	streamCtx  context.Context
	streamStop context.CancelFunc
	streamBody io.ReadCloser
	endpointCh chan string
	responses  map[string]chan rpcResponse
	mu         sync.Mutex
	writeMu    sync.Mutex
	nextID     uint64
	done       chan struct{}
	closeOnce  sync.Once
}

func newSSEConnector(tool Tool) *sseConnector {
	return &sseConnector{tool: tool, endpoint: strings.TrimSpace(stringPointerValue(tool.URL)), client: &http.Client{}, endpointCh: make(chan string, 1), responses: make(map[string]chan rpcResponse), done: make(chan struct{})}
}

func (c *sseConnector) Connect(ctx context.Context) error {
	streamCtx, stop := context.WithCancel(context.Background())
	c.streamCtx = streamCtx
	c.streamStop = stop
	request, err := http.NewRequestWithContext(streamCtx, http.MethodGet, c.endpoint, nil)
	if err != nil {
		stop()
		return err
	}
	request.Header.Set("Accept", "text/event-stream")
	for key, value := range c.tool.Headers {
		request.Header.Set(key, value)
	}
	responseCh := make(chan struct {
		response *http.Response
		err      error
	}, 1)
	go func() {
		response, requestErr := c.client.Do(request)
		responseCh <- struct {
			response *http.Response
			err      error
		}{response, requestErr}
	}()
	select {
	case result := <-responseCh:
		if result.err != nil {
			stop()
			return result.err
		}
		if result.response.StatusCode < 200 || result.response.StatusCode >= 300 {
			body, _ := io.ReadAll(io.LimitReader(result.response.Body, maxRPCBodyBytes))
			result.response.Body.Close()
			stop()
			return fmt.Errorf("MCP SSE server returned HTTP %d: %s", result.response.StatusCode, strings.TrimSpace(string(body)))
		}
		c.streamBody = result.response.Body
		go c.readSSE(result.response.Body)
	case <-ctx.Done():
		stop()
		return ctx.Err()
	}
	select {
	case endpoint := <-c.endpointCh:
		c.endpoint = endpoint
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(runtimeConnectTimeout):
		return errors.New("timed out waiting for MCP SSE endpoint")
	}
	response, err := c.request(ctx, "initialize", map[string]any{
		"protocolVersion": "2024-11-05",
		"capabilities":    map[string]any{},
		"clientInfo":      map[string]string{"name": "chattermate-go", "version": "1"},
	})
	if err != nil {
		return err
	}
	if err := checkRPCResponse(response); err != nil {
		return err
	}
	return c.notify(ctx, "notifications/initialized", map[string]any{})
}

func (c *sseConnector) readSSE(body io.Reader) {
	scanner := bufio.NewScanner(body)
	scanner.Buffer(make([]byte, 4096), maxRPCBodyBytes)
	eventName := ""
	data := make([]string, 0)
	dispatch := func() {
		if len(data) == 0 {
			eventName = ""
			return
		}
		payload := strings.Join(data, "\n")
		if eventName == "endpoint" {
			endpoint := strings.TrimSpace(payload)
			var quoted string
			if json.Unmarshal([]byte(endpoint), &quoted) == nil {
				endpoint = quoted
			}
			if parsed, err := url.Parse(endpoint); err == nil {
				base, _ := url.Parse(c.endpoint)
				if base != nil {
					endpoint = base.ResolveReference(parsed).String()
				}
			}
			select {
			case c.endpointCh <- endpoint:
			default:
			}
		} else {
			var response rpcResponse
			if json.Unmarshal([]byte(payload), &response) == nil && len(response.ID) > 0 {
				key := responseIDKey(response.ID)
				c.mu.Lock()
				waiter := c.responses[key]
				delete(c.responses, key)
				c.mu.Unlock()
				if waiter != nil {
					waiter <- response
				}
			}
		}
		eventName = ""
		data = data[:0]
	}
	for scanner.Scan() {
		line := strings.TrimSuffix(scanner.Text(), "\r")
		switch {
		case line == "":
			dispatch()
		case strings.HasPrefix(line, "event:"):
			eventName = strings.TrimSpace(strings.TrimPrefix(line, "event:"))
		case strings.HasPrefix(line, "data:"):
			data = append(data, strings.TrimSpace(strings.TrimPrefix(line, "data:")))
		}
	}
	dispatch()
	select {
	case <-c.done:
	default:
		close(c.done)
	}
	c.failPending()
}

func (c *sseConnector) Tools(ctx context.Context) ([]ToolDefinition, error) {
	response, err := c.request(ctx, "tools/list", map[string]any{})
	if err != nil {
		return nil, err
	}
	return decodeToolList(response)
}

func (c *sseConnector) Call(ctx context.Context, name string, args map[string]any) (any, error) {
	if args == nil {
		args = map[string]any{}
	}
	response, err := c.request(ctx, "tools/call", map[string]any{"name": name, "arguments": args})
	if err != nil {
		return nil, err
	}
	return decodeRPCResult(response)
}

func (c *sseConnector) request(ctx context.Context, method string, params any) (rpcResponse, error) {
	c.mu.Lock()
	c.nextID++
	id := c.nextID
	c.mu.Unlock()
	payload, key, err := rpcRequest(id, method, params)
	if err != nil {
		return rpcResponse{}, err
	}
	waiter := make(chan rpcResponse, 1)
	c.mu.Lock()
	c.responses[key] = waiter
	c.mu.Unlock()
	if err := c.post(ctx, payload, key); err != nil {
		c.mu.Lock()
		delete(c.responses, key)
		c.mu.Unlock()
		return rpcResponse{}, err
	}
	select {
	case response := <-waiter:
		if len(response.ID) == 0 {
			return rpcResponse{}, errors.New("MCP SSE server closed before replying")
		}
		return response, nil
	case <-ctx.Done():
		c.mu.Lock()
		delete(c.responses, key)
		c.mu.Unlock()
		return rpcResponse{}, ctx.Err()
	case <-c.done:
		return rpcResponse{}, errors.New("MCP SSE server closed")
	}
}

func (c *sseConnector) notify(ctx context.Context, method string, params any) error {
	payload, err := rpcNotification(method, params)
	if err != nil {
		return err
	}
	return c.post(ctx, payload, "")
}

func (c *sseConnector) post(ctx context.Context, payload []byte, expectedID string) error {
	c.writeMu.Lock()
	defer c.writeMu.Unlock()
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Accept", "application/json, text/event-stream")
	for key, value := range c.tool.Headers {
		request.Header.Set(key, value)
	}
	response, err := c.client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(response.Body, maxRPCBodyBytes))
		return fmt.Errorf("MCP SSE message returned HTTP %d: %s", response.StatusCode, strings.TrimSpace(string(body)))
	}
	if expectedID == "" {
		return nil
	}
	contentType := response.Header.Get("Content-Type")
	if strings.Contains(strings.ToLower(contentType), "text/event-stream") {
		responseValue, readErr := readRPCResponse(response.Body, contentType, expectedID)
		if readErr != nil {
			return nil
		}
		c.mu.Lock()
		waiter := c.responses[expectedID]
		delete(c.responses, expectedID)
		c.mu.Unlock()
		if waiter != nil {
			waiter <- responseValue
		}
		return nil
	}
	body, readErr := io.ReadAll(io.LimitReader(response.Body, maxRPCBodyBytes))
	if readErr != nil || len(bytes.TrimSpace(body)) == 0 {
		return nil
	}
	var responseValue rpcResponse
	if json.Unmarshal(body, &responseValue) != nil {
		return nil
	}
	c.mu.Lock()
	waiter := c.responses[expectedID]
	delete(c.responses, expectedID)
	c.mu.Unlock()
	if waiter != nil {
		waiter <- responseValue
	}
	return nil
}

func (c *sseConnector) failPending() {
	c.mu.Lock()
	pending := make([]chan rpcResponse, 0, len(c.responses))
	for key, waiter := range c.responses {
		delete(c.responses, key)
		pending = append(pending, waiter)
	}
	c.mu.Unlock()
	for _, waiter := range pending {
		select {
		case waiter <- rpcResponse{}:
		default:
		}
	}
}

func (c *sseConnector) Close(_ context.Context) error {
	c.closeOnce.Do(func() {
		if c.streamStop != nil {
			c.streamStop()
		}
		if c.streamBody != nil {
			_ = c.streamBody.Close()
		}
		select {
		case <-c.done:
		default:
			close(c.done)
		}
		c.failPending()
	})
	return nil
}

func readRPCResponse(body io.Reader, contentType, expectedID string) (rpcResponse, error) {
	if strings.Contains(strings.ToLower(contentType), "text/event-stream") {
		scanner := bufio.NewScanner(body)
		scanner.Buffer(make([]byte, 4096), maxRPCBodyBytes)
		eventName := ""
		data := make([]string, 0)
		for scanner.Scan() {
			line := strings.TrimSuffix(scanner.Text(), "\r")
			if line == "" {
				if response, ok := parseSSEResponse(eventName, data, expectedID); ok {
					return response, nil
				}
				eventName = ""
				data = data[:0]
				continue
			}
			if strings.HasPrefix(line, "event:") {
				eventName = strings.TrimSpace(strings.TrimPrefix(line, "event:"))
			} else if strings.HasPrefix(line, "data:") {
				data = append(data, strings.TrimSpace(strings.TrimPrefix(line, "data:")))
			}
		}
		return rpcResponse{}, errors.New("MCP stream ended before the response")
	}
	encoded, err := io.ReadAll(io.LimitReader(body, maxRPCBodyBytes))
	if err != nil {
		return rpcResponse{}, err
	}
	if len(bytes.TrimSpace(encoded)) == 0 {
		return rpcResponse{}, errors.New("MCP server returned an empty response")
	}
	var response rpcResponse
	if err := json.Unmarshal(encoded, &response); err != nil {
		return rpcResponse{}, err
	}
	if expectedID != "" && responseIDKey(response.ID) != expectedID {
		return rpcResponse{}, fmt.Errorf("MCP response id mismatch: got %s, want %s", responseIDKey(response.ID), expectedID)
	}
	return response, nil
}

func parseSSEResponse(eventName string, data []string, expectedID string) (rpcResponse, bool) {
	if len(data) == 0 || eventName == "endpoint" {
		return rpcResponse{}, false
	}
	var response rpcResponse
	if json.Unmarshal([]byte(strings.Join(data, "\n")), &response) != nil || len(response.ID) == 0 {
		return rpcResponse{}, false
	}
	if expectedID != "" && responseIDKey(response.ID) != expectedID {
		return rpcResponse{}, false
	}
	return response, true
}

func stringPointerValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
