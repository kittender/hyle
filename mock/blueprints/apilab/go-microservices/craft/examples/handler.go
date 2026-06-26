package transport

import (
	"encoding/json"
	"net/http"

	"go.uber.org/zap"
)

type UserHandler struct {
	svc UserService
	log *zap.Logger
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
	var cmd CreateUser
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	user, err := h.svc.Create(r.Context(), cmd)
	if err != nil {
		h.log.Warn("create user failed", zap.Error(err))
		http.Error(w, "could not create user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(user)
}
