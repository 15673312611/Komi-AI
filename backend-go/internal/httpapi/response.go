package httpapi

import (
	"encoding/json"
	"net/http"
)

type ErrorResponse struct {
	Detail string `json:"detail"`
}

func JSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func Error(w http.ResponseWriter, status int, detail string) {
	JSON(w, status, ErrorResponse{Detail: detail})
}

func NoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}
