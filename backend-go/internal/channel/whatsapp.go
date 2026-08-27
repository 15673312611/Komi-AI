package channel

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"unicode"

	"github.com/chattermate/chattermate/backend-go/internal/config"
)

const (
	DefaultWhatsAppTemplateLanguage = "en_US"
	whatsappTemplatePageLimit       = 100
	whatsappTemplateMaxPages        = 10
)

var whatsappPhonePattern = regexp.MustCompile(`^\+[1-9][0-9]{7,14}$`)
var whatsappTemplatePlaceholder = regexp.MustCompile(`\{\{([0-9]+)\}\}`)

// WhatsAppTemplateError carries the HTTP meaning of a template policy failure
// without making the channel package depend on net/http handlers.
type WhatsAppTemplateError struct {
	Status  int
	Message string
}

func (e *WhatsAppTemplateError) Error() string { return e.Message }

// NormalizeWhatsAppPhone accepts the same human-entered forms as Python's
// normalize_phone. A country code is mandatory; adding one to bare digits
// would silently assign a national number to the wrong country.
func NormalizeWhatsAppPhone(value string) string {
	var builder strings.Builder
	for _, r := range strings.TrimSpace(value) {
		if unicode.IsSpace(r) || r == '-' || r == '.' || r == '(' || r == ')' {
			continue
		}
		builder.WriteRune(r)
	}
	candidate := builder.String()
	if !whatsappPhonePattern.MatchString(candidate) {
		return ""
	}
	return candidate
}

// WhatsAppID is the Graph API address form of a canonical E.164 number.
func WhatsAppID(phone string) string { return strings.TrimPrefix(phone, "+") }

// ListWhatsAppTemplates follows the Graph cursor so the picker and outbound
// policy see the complete WABA template set, not only Meta's first page.
func ListWhatsAppTemplates(ctx context.Context, cfg config.Config, wabaID, accessToken string) ([]map[string]any, error) {
	if strings.TrimSpace(wabaID) == "" || strings.TrimSpace(accessToken) == "" {
		return nil, errors.New("WhatsApp Business Account credentials are incomplete")
	}
	params := url.Values{
		"fields": []string{"name,status,category,language,components"},
		"limit":  []string{fmt.Sprint(whatsappTemplatePageLimit)},
	}
	result := make([]map[string]any, 0)
	for page := 0; page < whatsappTemplateMaxPages; page++ {
		data, _, err := Graph(ctx, cfg, http.MethodGet, strings.TrimRight(wabaID, "/")+"/message_templates", accessToken, params, nil, false)
		if err != nil {
			return nil, err
		}
		items := objectList(data["data"])
		result = append(result, items...)
		paging := objectValue(data["paging"])
		cursors := objectValue(paging["cursors"])
		after := stringValue(cursors["after"])
		if after == "" || len(items) < whatsappTemplatePageLimit {
			break
		}
		params.Set("after", after)
	}
	return result, nil
}

// ValidateWhatsAppTemplate applies the business rules that Meta otherwise
// leaves to the caller: only approved templates are sendable, and a new
// business-initiated thread may use Utility or Authentication only.
func ValidateWhatsAppTemplate(templates []map[string]any, name, language string, startsConversation bool) (map[string]any, error) {
	name = strings.TrimSpace(name)
	language = strings.TrimSpace(language)
	for _, template := range templates {
		if stringValue(template["name"]) != name || stringValue(template["language"]) != language {
			continue
		}
		if !strings.EqualFold(stringValue(template["status"]), "APPROVED") {
			return nil, &WhatsAppTemplateError{Status: http.StatusBadRequest, Message: fmt.Sprintf("Template %s is not approved yet", name)}
		}
		category := strings.ToUpper(strings.TrimSpace(stringValue(template["category"])))
		if startsConversation && category != "UTILITY" && category != "AUTHENTICATION" {
			return nil, &WhatsAppTemplateError{
				Status:  http.StatusBadRequest,
				Message: "Only Utility and Authentication templates can start a conversation. Marketing templates need the customer to have messaged you first.",
			}
		}
		return template, nil
	}
	return nil, &WhatsAppTemplateError{Status: http.StatusNotFound, Message: fmt.Sprintf("No template named %s in %s on this account", name, language)}
}

// RenderWhatsAppTemplateBody mirrors the preview/AI context behavior in the
// Python service. Body parameters are positional and missing values leave the
// placeholder visible because Meta remains the final completeness validator.
func RenderWhatsAppTemplateBody(template map[string]any, components []map[string]any) string {
	body := ""
	for _, component := range objectList(template["components"]) {
		if strings.EqualFold(stringValue(component["type"]), "BODY") {
			body = stringValue(component["text"])
			break
		}
	}
	values := make([]string, 0)
	for _, component := range components {
		if !strings.EqualFold(stringValue(component["type"]), "body") {
			continue
		}
		for _, parameter := range objectList(component["parameters"]) {
			if value, ok := parameter["text"]; ok {
				values = append(values, fmt.Sprint(value))
			} else {
				values = append(values, "")
			}
		}
	}
	return whatsappTemplatePlaceholder.ReplaceAllStringFunc(body, func(value string) string {
		matches := whatsappTemplatePlaceholder.FindStringSubmatch(value)
		if len(matches) != 2 {
			return value
		}
		var index int
		_, _ = fmt.Sscanf(matches[1], "%d", &index)
		if index <= 0 || index > len(values) {
			return value
		}
		return values[index-1]
	})
}

func objectList(value any) []map[string]any {
	values := make([]map[string]any, 0)
	switch items := value.(type) {
	case []any:
		for _, item := range items {
			if object, ok := item.(map[string]any); ok {
				values = append(values, object)
			}
		}
	case []map[string]any:
		values = append(values, items...)
	}
	return values
}

func objectValue(value any) map[string]any {
	if object, ok := value.(map[string]any); ok {
		return object
	}
	return map[string]any{}
}
