package store

import (
	"net/http"

	"github.com/hauler-ui/hauler-ui/backend/internal/config"
	"github.com/hauler-ui/hauler-ui/backend/internal/hauls"
	"github.com/hauler-ui/hauler-ui/backend/internal/jobrunner"
)

// Handler handles HTTP requests for store operations
type Handler struct {
	JobRunner *jobrunner.Runner
	Cfg       *config.Config
	Hauls     *hauls.Service
}

// NewHandler creates a new store handler
func NewHandler(jobRunner *jobrunner.Runner, cfg *config.Config, haulSvc *hauls.Service) *Handler {
	return &Handler{
		JobRunner: jobRunner,
		Cfg:       cfg,
		Hauls:     haulSvc,
	}
}

// RegisterRoutes registers the store routes with the given mux. Operations are
// scoped to a haul via a "haulId" field in the request body (or "?haul=" query
// for reads); when omitted they fall back to the default haul.
func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/store/info", h.GetInfo)
	mux.HandleFunc("/api/store/add-image", h.AddImage)
	mux.HandleFunc("/api/store/add-chart", h.AddChart)
	mux.HandleFunc("/api/store/add-file", h.AddFile)
	mux.HandleFunc("/api/store/sync", h.Sync)
	mux.HandleFunc("/api/store/save", h.Save)
	mux.HandleFunc("/api/store/load", h.Load)
	mux.HandleFunc("/api/store/extract", h.Extract)
	mux.HandleFunc("/api/store/copy", h.Copy)
	mux.HandleFunc("/api/store/remove", h.Remove)
	mux.HandleFunc("/api/store/rescan", h.Rescan)
	mux.HandleFunc("/api/store/import", h.Import)
}
