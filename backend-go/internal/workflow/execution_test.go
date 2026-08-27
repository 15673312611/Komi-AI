package workflow

import (
	"context"
	"testing"

	"github.com/google/uuid"
)

type executionStoreFake struct {
	flow  *Workflow
	graph *NodesResult
}

func (f executionStoreFake) Get(context.Context, uuid.UUID, uuid.UUID) (*Workflow, error) {
	return f.flow, nil
}

func (f executionStoreFake) GetNodes(context.Context, uuid.UUID, uuid.UUID) (*NodesResult, error) {
	return f.graph, nil
}

type workflowSessionFake struct {
	current *uuid.UUID
	state   map[string]any
}

func (f *workflowSessionFake) SetWorkflowState(_ context.Context, _ uuid.UUID, _ uuid.UUID, current *uuid.UUID, state map[string]any) (bool, error) {
	if current != nil {
		value := *current
		f.current = &value
	} else {
		f.current = nil
	}
	f.state = state
	return true, nil
}

func (f *workflowSessionFake) AddWorkflowHistory(context.Context, uuid.UUID, uuid.UUID, uuid.UUID, string, map[string]any) error {
	return nil
}

func TestExecutorSingleLLMEmitsReplyBeforeUserInput(t *testing.T) {
	workflowID, organizationID, sessionID := uuid.New(), uuid.New(), uuid.New()
	llmID, inputID := uuid.New(), uuid.New()
	store := executionStoreFake{
		flow: &Workflow{ID: workflowID, OrganizationID: organizationID, Status: "PUBLISHED"},
		graph: &NodesResult{Nodes: []Node{
			{ID: llmID, NodeType: "LLM", Config: map[string]any{}},
			{ID: inputID, NodeType: "USER_INPUT", Name: "Contact name", Config: map[string]any{"prompt_message": "What is your name?"}},
		}, Connections: []Connection{{SourceNodeID: llmID, TargetNodeID: inputID}}},
	}
	sessions := &workflowSessionFake{}
	executor := NewExecutorWithCompletion(store, sessions, func(context.Context, string, string, string) (LLMReply, error) {
		return LLMReply{Message: "I can help with that."}, nil
	})

	result, err := executor.Execute(context.Background(), sessionID, organizationID, workflowID, nil, nil, "I need help")
	if err != nil {
		t.Fatal(err)
	}
	if result.Message != "What is your name?" {
		t.Fatalf("final message = %q", result.Message)
	}
	if len(result.IntermediateMessages) != 1 || result.IntermediateMessages[0] != "I can help with that." {
		t.Fatalf("intermediate messages = %#v", result.IntermediateMessages)
	}
	if sessions.current == nil || *sessions.current != inputID {
		t.Fatalf("current node = %v, want user input node", sessions.current)
	}
	if got := result.State["variables"].(map[string]any)["user_message"]; got != "I need help" {
		t.Fatalf("stored user message = %#v", got)
	}
}

func TestExecutorContinuousLLMStaysUntilExplicitExit(t *testing.T) {
	workflowID, organizationID, sessionID, llmID := uuid.New(), uuid.New(), uuid.New(), uuid.New()
	store := executionStoreFake{
		flow:  &Workflow{ID: workflowID, OrganizationID: organizationID, Status: "PUBLISHED"},
		graph: &NodesResult{Nodes: []Node{{ID: llmID, NodeType: "LLM", Config: map[string]any{"exit_condition": "continuous_execution"}}}},
	}
	sessions := &workflowSessionFake{}
	executor := NewExecutorWithCompletion(store, sessions, func(context.Context, string, string, string) (LLMReply, error) {
		return LLMReply{Message: "Tell me more."}, nil
	})

	result, err := executor.Execute(context.Background(), sessionID, organizationID, workflowID, nil, nil, "Question")
	if err != nil {
		t.Fatal(err)
	}
	if result.ShouldContinue || result.NextNodeID != nil || result.TransferToHuman || result.EndChat {
		t.Fatalf("continuous result should wait: %#v", result)
	}
	if sessions.current == nil || *sessions.current != llmID {
		t.Fatalf("current node = %v, want LLM node", sessions.current)
	}
}

func TestExecutorContinuousLLMTransferAndRatingRules(t *testing.T) {
	workflowID, organizationID, sessionID, llmID := uuid.New(), uuid.New(), uuid.New(), uuid.New()
	makeExecutor := func(config map[string]any, reply LLMReply) (*Executor, *workflowSessionFake) {
		sessions := &workflowSessionFake{}
		store := executionStoreFake{flow: &Workflow{ID: workflowID, OrganizationID: organizationID, Status: "PUBLISHED"}, graph: &NodesResult{Nodes: []Node{{ID: llmID, NodeType: "LLM", Config: config}}}}
		return NewExecutorWithCompletion(store, sessions, func(context.Context, string, string, string) (LLMReply, error) { return reply, nil }), sessions
	}

	executor, _ := makeExecutor(map[string]any{"exit_condition": "continuous_execution", "auto_transfer_enabled": false}, LLMReply{Message: "queued", TransferToHuman: true})
	result, err := executor.Execute(context.Background(), sessionID, organizationID, workflowID, nil, nil, "Need a person")
	if err != nil {
		t.Fatal(err)
	}
	if result.TransferToHuman {
		t.Fatal("transfer must be gated by auto_transfer_enabled")
	}

	groupID := uuid.New().String()
	executor, sessions := makeExecutor(map[string]any{"exit_condition": "continuous_execution", "auto_transfer_enabled": true, "transfer_group_id": groupID}, LLMReply{Message: "queued", TransferToHuman: true})
	result, err = executor.Execute(context.Background(), sessionID, organizationID, workflowID, nil, nil, "Need a person")
	if err != nil {
		t.Fatal(err)
	}
	if !result.TransferToHuman || result.TransferGroupID != groupID || sessions.current == nil || *sessions.current != llmID {
		t.Fatalf("transfer result = %#v, current=%v", result, sessions.current)
	}

	executor, _ = makeExecutor(map[string]any{"exit_condition": "continuous_execution"}, LLMReply{Message: "Done", EndChat: true})
	result, err = executor.Execute(context.Background(), sessionID, organizationID, workflowID, nil, nil, "Thanks")
	if err != nil {
		t.Fatal(err)
	}
	if !result.EndChat || !result.RequestRating {
		t.Fatalf("continuous end should request rating by default: %#v", result)
	}
}
