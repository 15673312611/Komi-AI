package analytics

import (
	"context"
	"errors"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/komi/komi/backend-go/internal/encryption"
)

var ErrNotFound = errors.New("analytics resource not found")

type TimeRange struct {
	Name  string
	Start time.Time
	End   time.Time
	Prev  time.Time
	Unit  string
}

type Store interface {
	AgentPerformance(ctx context.Context, organizationID uuid.UUID, window TimeRange) (map[string]any, error)
	Overview(ctx context.Context, organizationID uuid.UUID, window TimeRange) (map[string]any, error)
	CustomerAnalytics(ctx context.Context, organizationID uuid.UUID, window TimeRange, page, pageSize int) (map[string]any, error)
	CustomerDetails(ctx context.Context, organizationID, customerID uuid.UUID) (map[string]any, error)
	Sentiment(ctx context.Context, organizationID uuid.UUID, window TimeRange) (map[string]any, error)
	SessionSentiment(ctx context.Context, organizationID, sessionID uuid.UUID) (map[string]any, error)
}

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository {
	if pool == nil {
		return nil
	}
	return &Repository{pool: pool}
}

func (r *Repository) ready() error {
	if r == nil || r.pool == nil {
		return errors.New("database is not configured")
	}
	return nil
}

func ParseTimeRange(value string, now time.Time) (TimeRange, error) {
	if value == "" {
		value = "7d"
	}
	if value != "24h" && value != "7d" && value != "30d" && value != "90d" {
		return TimeRange{}, errors.New("invalid time range")
	}
	now = now.UTC()
	duration := 7 * 24 * time.Hour
	unit := "day"
	switch value {
	case "24h":
		duration, unit = 24*time.Hour, "hour"
	case "30d":
		duration, unit = 30*24*time.Hour, "day"
	case "90d":
		duration, unit = 90*24*time.Hour, "week"
	}
	start := now.Add(-duration)
	return TimeRange{Name: value, Start: start, End: now, Prev: start.Add(-duration), Unit: unit}, nil
}

func (r *Repository) AgentPerformance(ctx context.Context, organizationID uuid.UUID, window TimeRange) (map[string]any, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	bot, err := r.performanceRows(ctx, `
SELECT a.id, a.name, COUNT(s.session_id),
       COALESCE(SUM(CASE WHEN s.status::text = 'CLOSED' THEN 1 ELSE 0 END), 0),
       COALESCE(AVG(r.rating), 0)::double precision, COUNT(r.id)
FROM agents a
LEFT JOIN session_to_agents s ON s.agent_id = a.id AND s.assigned_at BETWEEN $2 AND $3
LEFT JOIN ratings r ON r.session_id = s.session_id AND r.created_at BETWEEN $2 AND $3
WHERE a.organization_id = $1
GROUP BY a.id, a.name
ORDER BY COUNT(s.session_id) DESC`, organizationID, window.Start, window.End)
	if err != nil {
		return nil, err
	}
	human, err := r.performanceRows(ctx, `
SELECT u.id, COALESCE(u.full_name, 'Unknown User'), COUNT(s.session_id),
       COALESCE(SUM(CASE WHEN s.status::text = 'CLOSED' THEN 1 ELSE 0 END), 0),
       COALESCE(AVG(r.rating), 0)::double precision, COUNT(r.id)
FROM users u
LEFT JOIN session_to_agents s ON s.user_id = u.id AND s.assigned_at BETWEEN $2 AND $3
LEFT JOIN ratings r ON r.session_id = s.session_id AND r.created_at BETWEEN $2 AND $3
WHERE u.organization_id = $1
GROUP BY u.id, u.full_name
ORDER BY COUNT(s.session_id) DESC`, organizationID, window.Start, window.End)
	if err != nil {
		return nil, err
	}
	return map[string]any{"bot_agents": bot, "human_agents": human, "time_range": window.Name}, nil
}

func (r *Repository) performanceRows(ctx context.Context, query string, args ...any) ([]map[string]any, error) {
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]map[string]any, 0)
	for rows.Next() {
		var id uuid.UUID
		var name string
		var total, closed, ratings int64
		var average float64
		if err := rows.Scan(&id, &name, &total, &closed, &average, &ratings); err != nil {
			return nil, err
		}
		result = append(result, map[string]any{"id": id.String(), "name": name, "total_chats": total, "closed_chats": closed, "avg_rating": average, "rating_count": ratings})
	}
	return result, rows.Err()
}

func (r *Repository) Overview(ctx context.Context, organizationID uuid.UUID, window TimeRange) (map[string]any, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	conversations, err := r.countPoints(ctx, `SELECT COUNT(*), date_trunc('`+window.Unit+`', assigned_at) FROM session_to_agents WHERE organization_id = $1 AND assigned_at BETWEEN $2 AND $3 GROUP BY 2 ORDER BY 2`, organizationID, window.Start, window.End)
	if err != nil {
		return nil, err
	}
	aiClosures, err := r.countPoints(ctx, `SELECT COUNT(*), date_trunc('`+window.Unit+`', updated_at) FROM session_to_agents WHERE organization_id = $1 AND updated_at BETWEEN $2 AND $3 AND status::text = 'CLOSED' AND user_id IS NULL GROUP BY 2 ORDER BY 2`, organizationID, window.Start, window.End)
	if err != nil {
		return nil, err
	}
	transfers, err := r.countPoints(ctx, `SELECT COUNT(*), date_trunc('`+window.Unit+`', updated_at) FROM session_to_agents WHERE organization_id = $1 AND updated_at BETWEEN $2 AND $3 AND user_id IS NOT NULL GROUP BY 2 ORDER BY 2`, organizationID, window.Start, window.End)
	if err != nil {
		return nil, err
	}
	prevTotal, err := r.scalarCount(ctx, `SELECT COUNT(*) FROM session_to_agents WHERE organization_id = $1 AND assigned_at BETWEEN $2 AND $3`, organizationID, window.Prev, window.Start)
	if err != nil {
		return nil, err
	}
	prevAI, err := r.scalarCount(ctx, `SELECT COUNT(*) FROM session_to_agents WHERE organization_id = $1 AND updated_at BETWEEN $2 AND $3 AND status::text = 'CLOSED' AND user_id IS NULL`, organizationID, window.Prev, window.Start)
	if err != nil {
		return nil, err
	}
	prevTransfers, err := r.scalarCount(ctx, `SELECT COUNT(*) FROM session_to_agents WHERE organization_id = $1 AND updated_at BETWEEN $2 AND $3 AND user_id IS NOT NULL`, organizationID, window.Prev, window.Start)
	if err != nil {
		return nil, err
	}
	botRatings, err := r.ratingPoints(ctx, organizationID, window, true)
	if err != nil {
		return nil, err
	}
	humanRatings, err := r.ratingPoints(ctx, organizationID, window, false)
	if err != nil {
		return nil, err
	}
	currentBotAvg, err := r.ratingAverage(ctx, organizationID, window.Start, window.End, true)
	if err != nil {
		return nil, err
	}
	previousBotAvg, err := r.ratingAverage(ctx, organizationID, window.Prev, window.Start, true)
	if err != nil {
		return nil, err
	}
	currentHumanAvg, err := r.ratingAverage(ctx, organizationID, window.Start, window.End, false)
	if err != nil {
		return nil, err
	}
	previousHumanAvg, err := r.ratingAverage(ctx, organizationID, window.Prev, window.Start, false)
	if err != nil {
		return nil, err
	}
	botCount, err := r.ratingCount(ctx, organizationID, true)
	if err != nil {
		return nil, err
	}
	humanCount, err := r.ratingCount(ctx, organizationID, false)
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"conversations": metricMap(conversations, prevTotal),
		"aiClosures":    metricMap(aiClosures, prevAI),
		"transfers":     metricMap(transfers, prevTransfers),
		"ratings": map[string]any{
			"bot":     ratingMap(botRatings, percentageChange(currentBotAvg, previousBotAvg)),
			"human":   ratingMap(humanRatings, percentageChange(currentHumanAvg, previousHumanAvg)),
			"bot_avg": currentBotAvg, "human_avg": currentHumanAvg,
			"bot_count": botCount, "human_count": humanCount,
			"bot_change": percentageChange(currentBotAvg, previousBotAvg), "human_change": percentageChange(currentHumanAvg, previousHumanAvg),
			"bot_trend": trend(percentageChange(currentBotAvg, previousBotAvg)), "human_trend": trend(percentageChange(currentHumanAvg, previousHumanAvg)),
		},
	}, nil
}

type countPoint struct {
	Total  int64
	Period time.Time
}
type ratingPoint struct {
	Average float64
	Total   int64
	Period  time.Time
}

func (r *Repository) countPoints(ctx context.Context, query string, args ...any) ([]countPoint, error) {
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]countPoint, 0)
	for rows.Next() {
		var item countPoint
		if err := rows.Scan(&item.Total, &item.Period); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

func (r *Repository) ratingPoints(ctx context.Context, org uuid.UUID, window TimeRange, bot bool) ([]ratingPoint, error) {
	operator := "IS NULL"
	if !bot {
		operator = "IS NOT NULL"
	}
	query := `SELECT COALESCE(AVG(r.rating),0)::double precision, COUNT(r.id), date_trunc('` + window.Unit + `', r.created_at)
FROM ratings r JOIN session_to_agents s ON s.session_id = r.session_id
WHERE r.organization_id = $1 AND r.created_at BETWEEN $2 AND $3 AND s.user_id ` + operator + ` GROUP BY 3 ORDER BY 3`
	rows, err := r.pool.Query(ctx, query, org, window.Start, window.End)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]ratingPoint, 0)
	for rows.Next() {
		var item ratingPoint
		if err := rows.Scan(&item.Average, &item.Total, &item.Period); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

func (r *Repository) ratingAverage(ctx context.Context, org uuid.UUID, start, end time.Time, bot bool) (float64, error) {
	operator := "IS NULL"
	if !bot {
		operator = "IS NOT NULL"
	}
	var result float64
	err := r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(r.rating),0)::double precision FROM ratings r JOIN session_to_agents s ON s.session_id = r.session_id WHERE r.organization_id = $1 AND r.created_at BETWEEN $2 AND $3 AND s.user_id `+operator, org, start, end).Scan(&result)
	return result, err
}

func (r *Repository) ratingCount(ctx context.Context, org uuid.UUID, bot bool) (int64, error) {
	operator := "IS NULL"
	if !bot {
		operator = "IS NOT NULL"
	}
	return r.scalarCount(ctx, `SELECT COUNT(r.id) FROM ratings r JOIN session_to_agents s ON s.session_id = r.session_id WHERE r.organization_id = $1 AND s.user_id `+operator, org)
}

func (r *Repository) scalarCount(ctx context.Context, query string, args ...any) (int64, error) {
	var result int64
	err := r.pool.QueryRow(ctx, query, args...).Scan(&result)
	return result, err
}

func metricMap(points []countPoint, previous int64) map[string]any {
	current := int64(0)
	data := make([]int64, 0, len(points))
	labels := make([]string, 0, len(points))
	for _, point := range points {
		current += point.Total
		data = append(data, point.Total)
		labels = append(labels, point.Period.Format("2006-01-02"))
	}
	change := percentageChange(float64(current), float64(previous))
	return map[string]any{"total": current, "change": change, "trend": trend(change), "data": data, "labels": labels}
}

func ratingMap(points []ratingPoint, change float64) map[string]any {
	data := make([]float64, 0, len(points))
	labels := make([]string, 0, len(points))
	for _, point := range points {
		data = append(data, point.Average)
		labels = append(labels, point.Period.Format("2006-01-02"))
	}
	return map[string]any{"data": data, "labels": labels, "change": change, "trend": trend(change)}
}

func percentageChange(current, previous float64) float64 {
	if previous == 0 {
		return 0
	}
	return (current - previous) / previous * 100
}
func trend(change float64) string {
	if change >= 0 {
		return "up"
	}
	return "down"
}

func (r *Repository) CustomerAnalytics(ctx context.Context, org uuid.UUID, window TimeRange, page, pageSize int) (map[string]any, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM customers WHERE organization_id = $1`, org).Scan(&total); err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, `
SELECT c.id, c.email, c.full_name, COUNT(DISTINCT s.session_id), MAX(s.assigned_at),
       COALESCE(AVG(r.rating),0)::double precision, COUNT(r.id)
FROM customers c
LEFT JOIN session_to_agents s ON c.id = s.customer_id AND s.assigned_at BETWEEN $2 AND $3
LEFT JOIN ratings r ON r.customer_id = c.id AND r.organization_id = c.organization_id
WHERE c.organization_id = $1
GROUP BY c.id, c.email, c.full_name, c.created_at
ORDER BY c.created_at DESC OFFSET $4 LIMIT $5`, org, window.Start, window.End, (page-1)*pageSize, pageSize)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	customers := make([]map[string]any, 0)
	for rows.Next() {
		var id uuid.UUID
		var email string
		var fullName pgtype.Text
		var chats, ratings int64
		var last pgtype.Timestamptz
		var average float64
		if err := rows.Scan(&id, &email, &fullName, &chats, &last, &average, &ratings); err != nil {
			return nil, err
		}
		var lastValue any
		if last.Valid {
			lastValue = last.Time
		}
		customers = append(customers, map[string]any{"id": id.String(), "email": email, "full_name": textValue(fullName), "total_chats": chats, "last_interaction": lastValue, "avg_rating": average, "rating_count": ratings})
	}
	return map[string]any{"customers": customers, "time_range": window.Name, "pagination": map[string]any{"page": page, "page_size": pageSize, "total_count": total, "total_pages": (total + int64(pageSize) - 1) / int64(pageSize)}}, rows.Err()
}

func (r *Repository) CustomerDetails(ctx context.Context, org, customerID uuid.UUID) (map[string]any, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	var exists bool
	if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM customers WHERE id = $1 AND organization_id = $2)`, customerID, org).Scan(&exists); err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrNotFound
	}
	rows, err := r.pool.Query(ctx, `
SELECT r.rating, r.feedback, r.created_at, a.name, u.full_name
FROM ratings r JOIN session_to_agents s ON r.session_id = s.session_id
LEFT JOIN agents a ON s.agent_id = a.id LEFT JOIN users u ON s.user_id = u.id
WHERE r.customer_id = $1 AND r.organization_id = $2 ORDER BY r.created_at DESC`, customerID, org)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	feedback := make([]map[string]any, 0)
	for rows.Next() {
		var rating int
		var comment, agentName, userName pgtype.Text
		var created pgtype.Timestamptz
		if err := rows.Scan(&rating, &comment, &created, &agentName, &userName); err != nil {
			return nil, err
		}
		name := textValue(agentName)
		if userName.Valid {
			name = userName.String
		}
		feedback = append(feedback, map[string]any{"rating": rating, "feedback": textValue(comment), "created_at": created.Time, "agent_name": name})
	}
	return map[string]any{"feedback": feedback}, rows.Err()
}

func (r *Repository) Sentiment(ctx context.Context, org uuid.UUID, window TimeRange) (map[string]any, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	distribution := map[string]int64{"positive": 0, "neutral": 0, "negative": 0}
	rows, err := r.pool.Query(ctx, `SELECT sentiment_label, COUNT(*) FROM chat_history WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3 AND message_type = 'user' AND sentiment_label IS NOT NULL GROUP BY sentiment_label`, org, window.Start, window.End)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var label string
		var count int64
		if err := rows.Scan(&label, &count); err != nil {
			rows.Close()
			return nil, err
		}
		if _, ok := distribution[label]; ok {
			distribution[label] = count
		}
	}
	rows.Close()
	trendRows, err := r.pool.Query(ctx, `SELECT date_trunc('`+window.Unit+`', created_at), COALESCE(AVG(sentiment_score),0)::double precision, COUNT(*) FROM chat_history WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3 AND message_type = 'user' AND sentiment_score IS NOT NULL GROUP BY 1 ORDER BY 1`, org, window.Start, window.End)
	if err != nil {
		return nil, err
	}
	trendData := []float64{}
	trendLabels := []string{}
	trendCounts := []int64{}
	for trendRows.Next() {
		var period time.Time
		var score float64
		var count int64
		if err := trendRows.Scan(&period, &score, &count); err != nil {
			trendRows.Close()
			return nil, err
		}
		trendData = append(trendData, round(score, 4))
		trendLabels = append(trendLabels, period.Format("2006-01-02"))
		trendCounts = append(trendCounts, count)
	}
	trendRows.Close()
	var average, previous float64
	if err := r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(sentiment_score),0)::double precision FROM chat_history WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3 AND message_type = 'user' AND sentiment_score IS NOT NULL`, org, window.Start, window.End).Scan(&average); err != nil {
		return nil, err
	}
	if err := r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(sentiment_score),0)::double precision FROM chat_history WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3 AND message_type = 'user' AND sentiment_score IS NOT NULL`, org, window.Prev, window.Start).Scan(&previous); err != nil {
		return nil, err
	}
	change := 0.0
	if previous != 0 {
		change = (average - previous) / math.Abs(previous) * 100
	}
	negativeRows, err := r.pool.Query(ctx, `SELECT session_id, sentiment_label, sentiment_score, status::text FROM session_to_agents WHERE organization_id = $1 AND assigned_at BETWEEN $2 AND $3 AND sentiment_label = 'negative' ORDER BY sentiment_score ASC LIMIT 10`, org, window.Start, window.End)
	if err != nil {
		return nil, err
	}
	negative := []map[string]any{}
	for negativeRows.Next() {
		var id uuid.UUID
		var label, status string
		var score pgtype.Float8
		if err := negativeRows.Scan(&id, &label, &score, &status); err != nil {
			negativeRows.Close()
			return nil, err
		}
		var value any
		if score.Valid {
			value = round(score.Float64, 4)
		}
		negative = append(negative, map[string]any{"session_id": id.String(), "sentiment_label": label, "sentiment_score": value, "status": strings.ToLower(status)})
	}
	negativeRows.Close()
	total := distribution["positive"] + distribution["neutral"] + distribution["negative"]
	return map[string]any{"distribution": distribution, "total_analyzed": total, "avg_score": round(average, 4), "score_change": round(change, 2), "score_trend": trend(change), "trend": map[string]any{"data": trendData, "labels": trendLabels, "message_counts": trendCounts}, "negative_sessions": negative, "time_range": window.Name}, nil
}

func (r *Repository) SessionSentiment(ctx context.Context, org, sessionID uuid.UUID) (map[string]any, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	var label string
	var score pgtype.Float8
	if err := r.pool.QueryRow(ctx, `SELECT sentiment_label, sentiment_score FROM session_to_agents WHERE session_id = $1 AND organization_id = $2`, sessionID, org).Scan(&label, &score); errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	} else if err != nil {
		return nil, err
	}
	var overallScore any
	if score.Valid {
		overallScore = round(score.Float64, 4)
	}
	rows, err := r.pool.Query(ctx, `SELECT id, message, sentiment_label, sentiment_score, created_at FROM chat_history WHERE session_id = $1 AND message_type = 'user' AND sentiment_label IS NOT NULL ORDER BY created_at ASC`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	messages := []map[string]any{}
	for rows.Next() {
		var id int64
		var message, sentiment string
		var itemScore pgtype.Float8
		var created time.Time
		if err := rows.Scan(&id, &message, &sentiment, &itemScore, &created); err != nil {
			return nil, err
		}
		message = decryptOrPlain(message)
		if len([]rune(message)) > 200 {
			message = string([]rune(message)[:200])
		}
		var scoreValue any
		if itemScore.Valid {
			scoreValue = round(itemScore.Float64, 4)
		}
		messages = append(messages, map[string]any{"id": id, "message": message, "sentiment_label": sentiment, "sentiment_score": scoreValue, "created_at": created})
	}
	return map[string]any{"session_id": sessionID.String(), "overall_sentiment": map[string]any{"label": nullableString(label), "score": overallScore}, "messages": messages}, rows.Err()
}

func textValue(value pgtype.Text) any {
	if !value.Valid {
		return nil
	}
	return value.String
}
func nullableString(value string) any {
	if value == "" {
		return nil
	}
	return value
}
func round(value float64, decimals int) float64 {
	multiplier := math.Pow10(decimals)
	return math.Round(value*multiplier) / multiplier
}
func decryptOrPlain(value string) string {
	if decoded, err := encryption.Decrypt(value); err == nil {
		return decoded
	}
	return value
}
