package settings

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/alphabravo-oss/wagon/backend/internal/sqlite"
)

// newTestHandler opens a fresh migrated database in a temp dir and returns a
// settings handler wired to it. Migration 0001 seeds the default settings.
func newTestHandler(t *testing.T) *Handler {
	t.Helper()

	db, err := sqlite.Open(filepath.Join(t.TempDir(), "t.db"))
	if err != nil {
		t.Fatalf("opening database: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })

	return NewHandler(db.DB)
}

// doGet issues a GET /api/settings and decodes the response.
func doGet(t *testing.T, h *Handler) (*httptest.ResponseRecorder, SettingsResponse) {
	t.Helper()

	req := httptest.NewRequest(http.MethodGet, "/api/settings", nil)
	rec := httptest.NewRecorder()
	h.GetSettings(rec, req)

	var resp SettingsResponse
	if rec.Code == http.StatusOK {
		if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decoding GetSettings response: %v; body=%s", err, rec.Body.String())
		}
	}
	return rec, resp
}

// doUpdate issues a PUT /api/settings with the given raw JSON body.
func doUpdate(t *testing.T, h *Handler, body string) *httptest.ResponseRecorder {
	t.Helper()

	req := httptest.NewRequest(http.MethodPut, "/api/settings", bytes.NewBufferString(body))
	rec := httptest.NewRecorder()
	h.UpdateSettings(rec, req)
	return rec
}

// TestGetSettingsReturnsDefaults asserts the defaults seeded by migration 0001
// are returned as JSON with the expected values and convenience fields.
func TestGetSettingsReturnsDefaults(t *testing.T) {
	h := newTestHandler(t)

	rec, resp := doGet(t, h)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body=%s", rec.Code, rec.Body.String())
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("Content-Type = %q, want application/json", ct)
	}

	// Convenience fields reflect the seeded defaults.
	if resp.LogLevel != "info" {
		t.Errorf("LogLevel = %q, want info", resp.LogLevel)
	}
	if resp.Retries != "0" {
		t.Errorf("Retries = %q, want 0", resp.Retries)
	}
	// ignore_errors default is "false"; it is exposed in the settings map.
	if got := resp.Settings["ignore_errors"].Value; got != "false" {
		t.Errorf("ignore_errors = %q, want false", got)
	}

	// All six seeded keys are present with descriptions.
	wantKeys := []string{
		"log_level", "retries", "ignore_errors",
		"default_platform", "default_key_path", "temp_dir",
	}
	for _, k := range wantKeys {
		s, ok := resp.Settings[k]
		if !ok {
			t.Errorf("missing seeded setting %q", k)
			continue
		}
		if s.Key != k {
			t.Errorf("setting %q has Key = %q", k, s.Key)
		}
		if s.Description == "" {
			t.Errorf("setting %q has empty Description", k)
		}
		if s.UpdatedAt.IsZero() {
			t.Errorf("setting %q has zero UpdatedAt", k)
		}
	}

	// Defaults for the empty-valued settings really are empty.
	for _, k := range []string{"default_platform", "default_key_path", "temp_dir"} {
		if v := resp.Settings[k].Value; v != "" {
			t.Errorf("%q default value = %q, want empty", k, v)
		}
	}

	// EnvHelp is populated so the frontend can show env-var names.
	if resp.EnvHelp["log_level"] != "HAULER_LOG_LEVEL" {
		t.Errorf("EnvHelp[log_level] = %q, want HAULER_LOG_LEVEL", resp.EnvHelp["log_level"])
	}
}

// TestUpdateSettingsPersists updates several settings and asserts a subsequent
// GET reflects the changes.
func TestUpdateSettingsPersists(t *testing.T) {
	h := newTestHandler(t)

	body := `{
		"logLevel": "debug",
		"retries": "5",
		"ignoreErrors": "true",
		"defaultPlatform": "linux/amd64",
		"defaultKeyPath": "/keys/cosign.key",
		"tempDir": "/tmp/hauler"
	}`
	rec := doUpdate(t, h, body)
	if rec.Code != http.StatusOK {
		t.Fatalf("UpdateSettings status = %d, want 200; body=%s", rec.Code, rec.Body.String())
	}

	// Response acknowledges the update.
	var upd map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &upd); err != nil {
		t.Fatalf("decoding update response: %v", err)
	}
	if upd["message"] != "Settings updated successfully" {
		t.Errorf("update message = %v, want success message", upd["message"])
	}

	// A subsequent GET reflects every persisted change.
	_, resp := doGet(t, h)
	want := map[string]string{
		"log_level":        "debug",
		"retries":          "5",
		"ignore_errors":    "true",
		"default_platform": "linux/amd64",
		"default_key_path": "/keys/cosign.key",
		"temp_dir":         "/tmp/hauler",
	}
	for k, v := range want {
		if got := resp.Settings[k].Value; got != v {
			t.Errorf("after update, %q = %q, want %q", k, got, v)
		}
	}
	if resp.LogLevel != "debug" {
		t.Errorf("convenience LogLevel = %q, want debug", resp.LogLevel)
	}
	if resp.TempDir != "/tmp/hauler" {
		t.Errorf("convenience TempDir = %q, want /tmp/hauler", resp.TempDir)
	}
}

// TestUpdateSettingsRoundTripSpecificKeys sets two specific keys and asserts
// they persist while unrelated keys retain their seeded defaults (empty values
// in the request body must not overwrite existing data).
func TestUpdateSettingsRoundTripSpecificKeys(t *testing.T) {
	h := newTestHandler(t)

	// Only log_level and temp_dir are provided; the rest are empty strings and
	// therefore must be left untouched by the handler.
	rec := doUpdate(t, h, `{"logLevel": "debug", "tempDir": "/tmp/x"}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("UpdateSettings status = %d, want 200; body=%s", rec.Code, rec.Body.String())
	}

	_, resp := doGet(t, h)

	if got := resp.Settings["log_level"].Value; got != "debug" {
		t.Errorf("log_level = %q, want debug", got)
	}
	if got := resp.Settings["temp_dir"].Value; got != "/tmp/x" {
		t.Errorf("temp_dir = %q, want /tmp/x", got)
	}
	// retries was not in the body, so it keeps its seeded default.
	if got := resp.Settings["retries"].Value; got != "0" {
		t.Errorf("retries = %q, want unchanged default 0", got)
	}
}

// TestUpdateSettingsInvalidBody asserts malformed JSON is rejected with 400.
func TestUpdateSettingsInvalidBody(t *testing.T) {
	h := newTestHandler(t)

	rec := doUpdate(t, h, `{not valid json`)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 for invalid body; body=%s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "Invalid request body") {
		t.Errorf("body = %q, want it to mention invalid request body", rec.Body.String())
	}
}

// TestMethodNotAllowed asserts the wrong HTTP method is rejected on each handler
// and via the RegisterRoutes mux dispatcher.
func TestMethodNotAllowed(t *testing.T) {
	h := newTestHandler(t)

	// GetSettings rejects non-GET.
	rec := httptest.NewRecorder()
	h.GetSettings(rec, httptest.NewRequest(http.MethodPost, "/api/settings", nil))
	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("GetSettings POST status = %d, want 405", rec.Code)
	}

	// UpdateSettings rejects non-PUT.
	rec = httptest.NewRecorder()
	h.UpdateSettings(rec, httptest.NewRequest(http.MethodGet, "/api/settings", nil))
	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("UpdateSettings GET status = %d, want 405", rec.Code)
	}

	// The mux registered by RegisterRoutes rejects unknown methods (e.g. DELETE).
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)
	rec = httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodDelete, "/api/settings", nil))
	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("mux DELETE status = %d, want 405", rec.Code)
	}
}
