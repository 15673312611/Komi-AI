package httpapi

import (
	"context"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	goRedis "github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"

	"github.com/komi/komi/backend-go/internal/agent"
	"github.com/komi/komi/backend-go/internal/aiconfig"
	"github.com/komi/komi/backend-go/internal/analytics"
	"github.com/komi/komi/backend-go/internal/auth"
	"github.com/komi/komi/backend-go/internal/channel"
	"github.com/komi/komi/backend-go/internal/chat"
	"github.com/komi/komi/backend-go/internal/config"
	"github.com/komi/komi/backend-go/internal/crm"
	"github.com/komi/komi/backend-go/internal/customer"
	"github.com/komi/komi/backend-go/internal/guardrail"
	"github.com/komi/komi/backend-go/internal/helpcenter"
	"github.com/komi/komi/backend-go/internal/jira"
	knowledgeStore "github.com/komi/komi/backend-go/internal/knowledge"
	"github.com/komi/komi/backend-go/internal/leadcapture"
	"github.com/komi/komi/backend-go/internal/mcptool"
	"github.com/komi/komi/backend-go/internal/notification"
	"github.com/komi/komi/backend-go/internal/organization"
	"github.com/komi/komi/backend-go/internal/people"
	"github.com/komi/komi/backend-go/internal/realtime"
	"github.com/komi/komi/backend-go/internal/session"
	"github.com/komi/komi/backend-go/internal/shopify"
	"github.com/komi/komi/backend-go/internal/store"
	"github.com/komi/komi/backend-go/internal/ticketdb"
	"github.com/komi/komi/backend-go/internal/ticketing"
	"github.com/komi/komi/backend-go/internal/user"
	"github.com/komi/komi/backend-go/internal/widget"
	"github.com/komi/komi/backend-go/internal/widgetapp"
	"github.com/komi/komi/backend-go/internal/workflow"
)

type Dependencies struct {
	Config          config.Config
	Logger          zerolog.Logger
	DB              *pgxpool.Pool
	Redis           *goRedis.Client
	Auth            *auth.Service
	Users           user.Store
	Agents          agent.Store
	Organizations   organization.Store
	Widgets         widget.Store
	Customers       customer.Store
	LeadCapture     leadcapture.Store
	Knowledge       knowledgeStore.Store
	Notifications   notification.Store
	Workflows       workflow.Store
	MCPTools        mcptool.Store
	GuardrailEvents guardrail.EventStore
	AIConfigs       aiconfig.Store
	Analytics       analytics.Store
	People          people.Store
	CRM             *crm.Service
	Jira            *jira.Service
	Shopify         *shopify.Service
	Stores          store.Service
	Sessions        session.Store
	Chats           chat.Store
	Channels        *channel.Repository
	WidgetApps      widgetapp.Store
	TicketDB        ticketdb.Store
	Tickets         ticketing.Store
	HelpCenters     *helpcenter.Repository
	Realtime        *realtime.Server
	Sender          *channel.Sender
}

func NewRouter(deps Dependencies) http.Handler {
	r := chi.NewRouter()
	r.Use(RequestID)
	r.Use(Recover(deps.Logger))
	r.Use(AccessLog(deps.Logger))
	r.Use(CORS(deps.Config.CORSOrigins))

	r.Get("/", root(deps))
	r.Get("/health", health(deps))
	r.Head("/health", health(deps))
	r.Get("/health/help-center-domain", healthCenterDomain(deps))
	if deps.Realtime != nil {
		socketHandler := deps.Realtime.Handler()
		r.Handle("/socket.io", socketHandler)
		r.Handle("/socket.io/*", socketHandler)
	}

	// The public API is registered under the same prefix as FastAPI. Domain
	// handlers are added in bounded vertical slices; keeping registration in one
	// place makes contract comparison and cutover review mechanical.
	r.Route(deps.Config.APIBasePath, func(api chi.Router) {
		if deps.Users == nil && deps.DB != nil {
			deps.Users = user.NewRepository(deps.DB)
		}
		if deps.Agents == nil && deps.DB != nil {
			deps.Agents = agent.NewRepository(deps.DB)
		}
		if deps.Organizations == nil && deps.DB != nil {
			deps.Organizations = organization.NewRepository(deps.DB)
		}
		if deps.Widgets == nil && deps.DB != nil {
			deps.Widgets = widget.NewRepository(deps.DB)
		}
		if deps.Customers == nil && deps.DB != nil {
			deps.Customers = customer.NewRepository(deps.DB)
		}
		if deps.LeadCapture == nil && deps.DB != nil {
			deps.LeadCapture = leadcapture.NewRepository(deps.DB)
		}
		if deps.Knowledge == nil && deps.DB != nil {
			deps.Knowledge = knowledgeStore.NewRepository(deps.DB)
		}
		if deps.HelpCenters == nil && deps.DB != nil {
			deps.HelpCenters = helpcenter.NewRepository(deps.DB)
		}
		if deps.CRM == nil && deps.DB != nil {
			deps.CRM = crm.NewService(crm.NewRepository(deps.DB), deps.Config)
		}
		if deps.People == nil && deps.DB != nil {
			deps.People = people.NewRepository(deps.DB, deps.CRM)
		}
		if peopleRepo, ok := deps.People.(*people.Repository); ok {
			peopleRepo.SetCRMService(deps.CRM)
		}
		if deps.Jira == nil && deps.DB != nil {
			deps.Jira = jira.NewService(jira.NewRepository(deps.DB), deps.Config)
		}
		if deps.Shopify == nil && deps.DB != nil {
			deps.Shopify = shopify.NewService(shopify.NewRepository(deps.DB), deps.Config)
		}
		if deps.Stores == nil && deps.DB != nil {
			deps.Stores = store.NewRepository(deps.DB)
		}
		if deps.Notifications == nil && deps.DB != nil {
			deps.Notifications = notification.NewRepository(deps.DB)
		}
		if deps.Workflows == nil && deps.DB != nil {
			deps.Workflows = workflow.NewRepository(deps.DB)
		}
		if deps.MCPTools == nil && deps.DB != nil {
			deps.MCPTools = mcptool.NewRepository(deps.DB)
		}
		if deps.AIConfigs == nil && deps.DB != nil {
			deps.AIConfigs = aiconfig.NewRepository(deps.DB)
		}
		if deps.Analytics == nil && deps.DB != nil {
			deps.Analytics = analytics.NewRepository(deps.DB)
		}
		if deps.Sessions == nil && deps.DB != nil {
			deps.Sessions = session.NewRepository(deps.DB)
		}
		if deps.Chats == nil && deps.DB != nil {
			deps.Chats = chat.NewRepository(deps.DB)
		}
		if deps.Channels == nil && deps.DB != nil {
			deps.Channels = channel.NewRepository(deps.DB)
		}
		if deps.WidgetApps == nil && deps.DB != nil {
			deps.WidgetApps = widgetapp.NewRepository(deps.DB)
		}
		if deps.TicketDB == nil && deps.DB != nil {
			deps.TicketDB = ticketdb.NewRepository(deps.DB)
		}
		if deps.Tickets == nil && deps.DB != nil {
			deps.Tickets = ticketing.NewRepository(deps.DB)
		}
		registerAuthRoutes(api, deps)
		registerAgentRoutes(api, deps)
		registerLeadCaptureRoutes(api, deps)
		registerKnowledgeRoutes(api, deps)
		registerOrganizationRoutes(api, deps)
		registerChatRoutes(api, deps)
		registerChannelRoutes(api, deps)
		registerPeopleRoutes(api, deps)
		registerCRMRoutes(api, deps)
		registerJiraRoutes(api, deps)
		registerShopifyRoutes(api, deps)
		registerStoreRoutes(api, deps)
		registerNotificationRoutes(api, deps)
		registerWorkflowRoutes(api, deps)
		registerMCPToolRoutes(api, deps)
		registerAISetupRoutes(api, deps)
		registerAnalyticsRoutes(api, deps)
		registerCannedResponseRoutes(api, deps)
		registerFileRoutes(api, deps)
		registerSessionRoutes(api, deps)
		registerWidgetRoutes(api, deps)
		registerWidgetAppRoutes(api, deps)
		registerTokenRoutes(api, deps)
		registerUserManagementRoutes(api, deps)
		registerTicketDBConnectorRoutes(api, deps)
		registerTicketWebhookRoutes(api, deps)
		registerTicketRoutes(api, deps)
		registerHelpCenterAdminRoutes(api, deps)
	})
	registerHelpCenterPublicRoutes(r, deps)
	// Python exposes local uploads below the API prefix. Keep this mount after
	// API route registration so only the upload subtree is delegated to disk.
	if deps.Config.UploadsDir != "" {
		uploads := http.StripPrefix(deps.Config.APIBasePath+"/uploads/", http.FileServer(http.Dir(deps.Config.UploadsDir)))
		r.Handle(deps.Config.APIBasePath+"/uploads/*", uploads)
	}

	// Mount static assets for widget UI (/assets/widget.js and /assets/widget.css)
	assetsDir := deps.Config.AssetsDir
	if _, err := os.Stat(assetsDir); os.IsNotExist(err) {
		if _, err := os.Stat("assets"); err == nil {
			assetsDir = "assets"
		} else if _, err := os.Stat("backend/assets"); err == nil {
			assetsDir = "backend/assets"
		} else if _, err := os.Stat("../backend/assets"); err == nil {
			assetsDir = "../backend/assets"
		}
	}
	if info, err := os.Stat(assetsDir); err == nil && info.IsDir() {
		r.Handle("/assets/*", http.StripPrefix("/assets/", http.FileServer(http.Dir(assetsDir))))
	}

	return r
}

func root(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Host-dispatched help centers also own the origin root. This check must
		// happen before the API root response, otherwise {slug}.help domains see
		// the generic API welcome document instead of their public index.
		if deps.HelpCenters != nil {
			if body, ok := renderHelpCenterIndex(deps, r); ok {
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				_, _ = io.WriteString(w, body)
				return
			}
		}
		JSON(w, http.StatusOK, map[string]string{
			"name":        deps.Config.ProjectName,
			"version":     deps.Config.Version,
			"description": "Welcome to Komi AI API",
		})
	}
}

func health(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		JSON(w, http.StatusOK, map[string]string{
			"status":  "healthy",
			"version": deps.Config.Version,
		})
	}
}

func healthCenterDomain(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		domain := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("domain")))
		if domain == "" || strings.ContainsAny(domain, "/\\") {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		host := normalizePublicHost(domain)
		base := strings.ToLower(strings.TrimSuffix(strings.TrimSpace(deps.Config.HelpCenterBaseDomain), "."))
		if base != "" && strings.HasSuffix(host, "."+base) {
			label := strings.TrimSuffix(host, "."+base)
			if label != "" && !strings.Contains(label, ".") {
				w.WriteHeader(http.StatusOK)
				return
			}
		}
		if deps.HelpCenters != nil {
			if domains, err := deps.HelpCenters.ListVerifiedDomains(r.Context()); err == nil {
				for _, verified := range domains {
					if strings.EqualFold(normalizePublicHost(verified), host) {
						w.WriteHeader(http.StatusOK)
						return
					}
				}
			}
		}
		w.WriteHeader(http.StatusNotFound)
	}
}

func contextWithShutdown(ctx context.Context) context.Context {
	return ctx
}
