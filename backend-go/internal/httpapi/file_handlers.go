package httpapi

import (
	"crypto/hmac"
	"errors"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/auth"
)

func registerFileRoutes(r chi.Router, deps Dependencies) {
	r.Get("/files/download/{file_path:.*}", downloadFile(deps))
}

func downloadFile(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		storageKey, organizationID, ok := authorizedAttachmentPath(chi.URLParam(r, "file_path"))
		if !ok {
			Error(w, http.StatusNotFound, "File not found")
			return
		}
		if !validLocalAttachmentSignature(storageKey, r.URL.Query().Get("expires"), r.URL.Query().Get("signature"), deps.Auth) {
			orgID, authenticated := attachmentOrganization(r, deps)
			if !authenticated || orgID != organizationID.String() {
				Error(w, http.StatusNotFound, "File not found")
				return
			}
		}
		if strings.EqualFold(os.Getenv("S3_FILE_STORAGE"), "true") || deps.Config.S3FileStorage {
			client, err := newS3Client(deps.Config)
			if err != nil {
				deps.Logger.Error().Err(err).Msg("create S3 client for attachment download failed")
				Error(w, http.StatusServiceUnavailable, "S3 file storage is not configured")
				return
			}
			response, err := client.Get(r.Context(), storageKey)
			if err != nil {
				deps.Logger.Error().Err(err).Msg("download attachment from S3 failed")
				Error(w, http.StatusBadGateway, "Failed to download file")
				return
			}
			if response.StatusCode == http.StatusNotFound || response.StatusCode == http.StatusGone {
				response.Body.Close()
				Error(w, http.StatusNotFound, "File not found")
				return
			}
			if response.StatusCode < 200 || response.StatusCode >= 300 {
				response.Body.Close()
				deps.Logger.Error().Int("status", response.StatusCode).Msg("S3 rejected attachment download")
				Error(w, http.StatusBadGateway, "Failed to download file")
				return
			}
			defer response.Body.Close()
			contentType := response.Header.Get("Content-Type")
			if contentType == "" {
				contentType = mime.TypeByExtension(strings.ToLower(filepath.Ext(storageKey)))
			}
			if contentType == "" {
				contentType = "application/octet-stream"
			}
			filename := filepath.Base(storageKey)
			w.Header().Set("Content-Type", contentType)
			w.Header().Set("Content-Disposition", `inline; filename="`+strings.ReplaceAll(filename, `"`, "")+`"`)
			if response.ContentLength >= 0 {
				w.Header().Set("Content-Length", strconv.FormatInt(response.ContentLength, 10))
			}
			_, _ = io.Copy(w, response.Body)
			return
		}
		if deps.Config.UploadsDir == "" {
			Error(w, http.StatusNotFound, "File not found")
			return
		}
		filePath, err := safeAttachmentPath(deps.Config.UploadsDir, storageKey)
		if err != nil {
			Error(w, http.StatusNotFound, "File not found")
			return
		}
		file, err := os.Open(filePath)
		if errors.Is(err, os.ErrNotExist) {
			Error(w, http.StatusNotFound, "File not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to download file")
			return
		}
		defer file.Close()
		info, err := file.Stat()
		if err != nil || info.IsDir() {
			Error(w, http.StatusNotFound, "File not found")
			return
		}
		contentType := mime.TypeByExtension(strings.ToLower(filepath.Ext(storageKey)))
		if contentType == "" {
			contentType = "application/octet-stream"
		}
		filename := filepath.Base(storageKey)
		w.Header().Set("Content-Type", contentType)
		w.Header().Set("Content-Disposition", `inline; filename="`+strings.ReplaceAll(filename, `"`, "")+`"`)
		w.Header().Set("Content-Length", strconv.FormatInt(info.Size(), 10))
		_, _ = io.Copy(w, file)
	}
}

func attachmentOrganization(r *http.Request, deps Dependencies) (string, bool) {
	if current, err := currentUser(r, deps); err == nil && current != nil && current.OrganizationID != nil {
		return current.OrganizationID.String(), true
	}
	token := strings.TrimSpace(r.Header.Get("X-Conversation-Token"))
	if token == "" || deps.Auth == nil || deps.Widgets == nil {
		return "", false
	}
	claims, err := deps.Auth.VerifyConversationToken(token)
	if err != nil || claims.WidgetID == "" {
		return "", false
	}
	found, err := deps.Widgets.Get(r.Context(), claims.WidgetID)
	if err != nil || found == nil {
		return "", false
	}
	return found.OrganizationID.String(), true
}

func authorizedAttachmentPath(filePath string) (string, uuid.UUID, bool) {
	clean := strings.TrimPrefix(strings.TrimLeft(filePath, "/"), "uploads/")
	parts := strings.Split(clean, "/")
	if len(parts) != 3 || parts[0] != "chat_attachments" || parts[2] == "" {
		return "", uuid.Nil, false
	}
	organizationID, err := uuid.Parse(parts[1])
	if err != nil || organizationID == uuid.Nil {
		return "", uuid.Nil, false
	}
	if parts[2] == "." || parts[2] == ".." || strings.ContainsAny(parts[2], `\<>:"|?*`) {
		return "", uuid.Nil, false
	}
	return strings.Join([]string{"chat_attachments", organizationID.String(), parts[2]}, "/"), organizationID, true
}

func safeAttachmentPath(root, storageKey string) (string, error) {
	root, err := filepath.Abs(root)
	if err != nil {
		return "", err
	}
	candidate := filepath.Join(root, filepath.FromSlash(storageKey))
	relative, err := filepath.Rel(root, candidate)
	if err != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) {
		return "", errors.New("attachment path escapes upload root")
	}
	return candidate, nil
}

func validLocalAttachmentSignature(storageKey, expiresText, signature string, service *auth.Service) bool {
	if service == nil || expiresText == "" || signature == "" {
		return false
	}
	expires, err := strconv.ParseInt(expiresText, 10, 64)
	if err != nil || expires < time.Now().Unix() {
		return false
	}
	// The conversation secret is intentionally not exposed by auth.Service.
	// Signed local URLs use the same HMAC format as the Python backend.
	expected, err := service.SignLocalAttachment(storageKey, expires)
	if err != nil {
		return false
	}
	return hmac.Equal([]byte(expected), []byte(signature))
}
