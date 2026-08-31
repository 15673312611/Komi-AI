package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rs/zerolog"

	"github.com/chattermate/chattermate/backend-go/internal/agent"
	"github.com/chattermate/chattermate/backend-go/internal/aiconfig"
	"github.com/chattermate/chattermate/backend-go/internal/analytics"
	"github.com/chattermate/chattermate/backend-go/internal/auth"
	"github.com/chattermate/chattermate/backend-go/internal/channel"
	"github.com/chattermate/chattermate/backend-go/internal/chat"
	"github.com/chattermate/chattermate/backend-go/internal/config"
	"github.com/chattermate/chattermate/backend-go/internal/crm"
	"github.com/chattermate/chattermate/backend-go/internal/customer"
	"github.com/chattermate/chattermate/backend-go/internal/helpcenter"
	"github.com/chattermate/chattermate/backend-go/internal/guardrail"
	"github.com/chattermate/chattermate/backend-go/internal/httpapi"
	"github.com/chattermate/chattermate/backend-go/internal/jira"
	knowledgeStore "github.com/chattermate/chattermate/backend-go/internal/knowledge"
	"github.com/chattermate/chattermate/backend-go/internal/leadcapture"
	"github.com/chattermate/chattermate/backend-go/internal/mcptool"
	"github.com/chattermate/chattermate/backend-go/internal/notification"
	"github.com/chattermate/chattermate/backend-go/internal/organization"
	"github.com/chattermate/chattermate/backend-go/internal/people"
	"github.com/chattermate/chattermate/backend-go/internal/platform/database"
	platformLogger "github.com/chattermate/chattermate/backend-go/internal/platform/logger"
	platformRedis "github.com/chattermate/chattermate/backend-go/internal/platform/redis"
	"github.com/chattermate/chattermate/backend-go/internal/rating"
	"github.com/chattermate/chattermate/backend-go/internal/realtime"
	"github.com/chattermate/chattermate/backend-go/internal/session"
	"github.com/chattermate/chattermate/backend-go/internal/shopify"
	"github.com/chattermate/chattermate/backend-go/internal/store"
	"github.com/chattermate/chattermate/backend-go/internal/ticketdb"
	"github.com/chattermate/chattermate/backend-go/internal/ticketing"
	"github.com/chattermate/chattermate/backend-go/internal/user"
	"github.com/chattermate/chattermate/backend-go/internal/widget"
	"github.com/chattermate/chattermate/backend-go/internal/widgetapp"
	"github.com/chattermate/chattermate/backend-go/internal/workflow"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fatal(err)
	}
	log := platformLogger.New(cfg.LogLevel)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	db, err := database.Open(ctx, cfg)
	if err != nil && !errors.Is(err, database.ErrNotConfigured) {
		log.Fatal().Err(err).Msg("open postgres pool")
	}
	if db != nil {
		defer db.Close()
	}
	redisClient, err := platformRedis.Open(cfg)
	if err != nil && !errors.Is(err, platformRedis.ErrNotConfigured) {
		log.Fatal().Err(err).Msg("open redis client")
	}
	if redisClient != nil {
		defer redisClient.Close()
	}
	authService := auth.NewService(cfg)
	authService.SetConversationTokenStore(auth.NewRedisTokenStore(redisClient))

	var users user.Store
	var agents agent.Store
	var organizations organization.Store
	var widgets widget.Store
	var customers customer.Store
	var leadCaptureStore leadcapture.Store
	var knowledgeStoreValue knowledgeStore.Store
	var helpCenterStore *helpcenter.Repository
	var peopleStore people.Store
	var crmService *crm.Service
	var jiraService *jira.Service
	var shopifyService *shopify.Service
	var storeStore store.Service
	var notificationStore notification.Store
	var workflowStore workflow.Store
	var mcpToolStore mcptool.Store
	var aiConfigStore aiconfig.Store
	var analyticsStore analytics.Store
	var sessions session.Store
	var chats chat.Store
	var channelStore *channel.Repository
	var widgetApps widgetapp.Store
	var ticketDBStore ticketdb.Store
	var ticketStore ticketing.Store
	var ratings rating.Store
	var guardrailEvents guardrail.EventStore
	if db != nil {
		users = user.NewRepository(db)
		agents = agent.NewRepository(db)
		organizations = organization.NewRepository(db)
		widgets = widget.NewRepository(db)
		customers = customer.NewRepository(db)
		leadCaptureStore = leadcapture.NewRepository(db)
		knowledgeRepo := knowledgeStore.NewRepository(db)
		knowledgeStoreValue = knowledgeRepo
		knowledgeProcessor := knowledgeStore.NewProcessor(knowledgeRepo, log)
		knowledgeProcessor.Start(ctx)
		helpCenterStore = helpcenter.NewRepository(db)
		crmService = crm.NewService(crm.NewRepository(db), cfg)
		peopleStore = people.NewRepository(db, crmService)
		jiraService = jira.NewService(jira.NewRepository(db), cfg)
		shopifyService = shopify.NewService(shopify.NewRepository(db), cfg)
		storeStore = store.NewRepository(db)
		notificationStore = notification.NewRepository(db)
		workflowStore = workflow.NewRepository(db)
		mcpToolStore = mcptool.NewRepository(db)
		aiConfigStore = aiconfig.NewRepository(db)
		analyticsStore = analytics.NewRepository(db)
		sessions = session.NewRepository(db)
		chats = chat.NewRepository(db)
		channelStore = channel.NewRepository(db)
		widgetApps = widgetapp.NewRepository(db)
		ticketDBStore = ticketdb.NewRepository(db)
		ticketStore = ticketing.NewRepository(db)
		ratings = rating.NewRepository(db)
		guardrailEvents = guardrail.NewRepository(db)
	}
	var channelSender *channel.Sender
	if channelStore != nil {
		channelSender = channel.NewSender(cfg, channelStore)
	}
	realtimeServer := realtime.New(realtime.Dependencies{
		Config: cfg, Logger: log, DB: db, Auth: authService, Users: users,
		Agents: agents, Organizations: organizations, Widgets: widgets, Customers: customers,
		Sessions: sessions, Chats: chats, Ratings: ratings, Workflows: workflowStore,
		AIConfigs:     aiConfigStore,
		LeadCapture:   leadCaptureStore,
		Knowledge:     knowledgeStoreValue,
		Redis:         redisClient,
		Shopify:       shopifyService,
		Jira:          jiraService,
		Tickets:       ticketStore,
		MCPTools:      mcpToolStore,
		GuardrailEvents: guardrailEvents,
		Notifications: notificationStore,
		Sender:        channelSender,
	})
	server := &http.Server{
		Addr:              cfg.HTTPAddr,
			Handler:           httpapi.NewRouter(httpapi.Dependencies{Config: cfg, Logger: log, DB: db, Redis: redisClient, Auth: authService, Users: users, Agents: agents, Organizations: organizations, Widgets: widgets, Customers: customers, LeadCapture: leadCaptureStore, Knowledge: knowledgeStoreValue, HelpCenters: helpCenterStore, People: peopleStore, CRM: crmService, Jira: jiraService, Shopify: shopifyService, Stores: storeStore, Notifications: notificationStore, Workflows: workflowStore, MCPTools: mcpToolStore, GuardrailEvents: guardrailEvents, AIConfigs: aiConfigStore, Analytics: analyticsStore, Sessions: sessions, Chats: chats, Channels: channelStore, WidgetApps: widgetApps, TicketDB: ticketDBStore, Tickets: ticketStore, Realtime: realtimeServer, Sender: channelSender}),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	go func() {
		log.Info().Str("addr", cfg.HTTPAddr).Str("config", cfg.String()).Msg("go backend listening")
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal().Err(err).Msg("http server stopped")
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Error().Err(err).Msg("http server shutdown")
	}
	realtimeServer.Close()
}

func fatal(err error) {
	log := zerolog.New(os.Stderr)
	log.Fatal().Err(err).Msg("startup failed")
}
