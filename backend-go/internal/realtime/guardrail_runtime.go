package realtime

import (
	"context"

	"github.com/chattermate/chattermate/backend-go/internal/agent"
	"github.com/chattermate/chattermate/backend-go/internal/config"
	"github.com/chattermate/chattermate/backend-go/internal/guardrail"
)

func guardrailSettings(cfg config.Config) guardrail.Settings {
	return guardrail.Settings{
		PolicyEnabled:      cfg.GuardrailPolicyEnabled,
		InboundAction:      cfg.GuardrailInboundAction,
		OfftopicAction:     cfg.GuardrailOfftopicAction,
		OutputCheckEnabled: cfg.GuardrailOutputCheckEnabled,
		EventsEnabled:      cfg.GuardrailEventsEnabled,
		StoreExcerpt:       cfg.GuardrailStoreExcerpt,
	}
}

// guardrailContext snapshots the tenant-owned prompt fields while the
// organization record is available. Prompt assembly then operates only on
// plain values and falls back safely when the organization lookup fails.
func (s *Server) guardrailContext(ctx context.Context, configured *agent.Agent) guardrail.Context {
	if configured == nil {
		return guardrail.Context{}
	}
	result := guardrail.Context{
		AgentType:        configured.AgentType,
		Description:      valueOrEmpty(configured.Description),
		TopicScope:       valueOrEmpty(configured.TopicScope),
		GuardrailPrompt:  valueOrEmpty(configured.GuardrailPrompt),
		GuardrailEnabled: configured.GuardrailEnabled,
		OrganizationID:   configured.OrganizationID.String(),
		AgentID:          configured.ID.String(),
	}
	if s != nil && s.deps.Organizations != nil {
		if organization, err := s.deps.Organizations.Get(ctx, configured.OrganizationID); err == nil && organization != nil {
			result.OrgName = organization.Name
			result.Domain = organization.Domain
		}
	}
	return result
}

func (s *Server) recordGuardrail(ctx context.Context, input guardrail.EventInput) {
	if s == nil {
		return
	}
	if err := guardrail.RecordEvent(ctx, s.deps.GuardrailEvents, guardrailSettings(s.deps.Config), input); err != nil {
		s.deps.Logger.Warn().Err(err).Str("guardrail_layer", input.Layer).Msg("guardrail event recording failed")
	}
}

func guardrailInboundAction(verdict guardrail.Verdict) string {
	if verdict.Block {
		return "blocked"
	}
	return "counted"
}

func mergeAttributes(target, values map[string]any) {
	for key, value := range values {
		target[key] = value
	}
}
