package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// ── handleHealth ──────────────────────────────────────────────────────────────

func TestHandleHealth(t *testing.T) {
	req := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	handleHealth(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("health status = %d, want 200", w.Code)
	}
	var body map[string]string
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatal("failed to decode health response:", err)
	}
	if body["status"] != "ok" {
		t.Errorf("health status = %q, want ok", body["status"])
	}
}

func TestCORSHeader(t *testing.T) {
	req := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	handleHealth(w, req)
	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Errorf("CORS header = %q, want *", got)
	}
}

// ── handleLookup ──────────────────────────────────────────────────────────────

func TestHandleLookupMissingParams(t *testing.T) {
	cases := []string{
		"/bins",
		"/bins?suburb=WEST+END", // street missing
		"/bins?street=TONDARA",  // suburb missing
	}
	for _, url := range cases {
		req := httptest.NewRequest("GET", url, nil)
		w := httptest.NewRecorder()
		handleLookup(w, req)
		if w.Code != http.StatusBadRequest {
			t.Errorf("GET %s: status = %d, want 400", url, w.Code)
		}
	}
}

func TestHandleLookupNotFound(t *testing.T) {
	newUpstream(t,
		odsResponse{TotalCount: 0, Results: nil},
		odsResponse{},
	)
	req := httptest.NewRequest("GET", "/bins?suburb=SPRING+HILL&street=FAKE+STREET", nil)
	w := httptest.NewRecorder()
	handleLookup(w, req)
	if w.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 404", w.Code)
	}
}

func TestHandleLookupSuccess(t *testing.T) {
	newUpstream(t, westEndDaysResponse(), weeksResponse())

	req := httptest.NewRequest("GET", "/bins?suburb=WEST+END&street=TONDARA+LANE&number=41", nil)
	w := httptest.NewRecorder()
	handleLookup(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", w.Code, w.Body.String())
	}

	var resp LookupResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal("decode error:", err)
	}
	if resp.Property.PropertyNumber != "1264040" {
		t.Errorf("property_number = %q, want 1264040", resp.Property.PropertyNumber)
	}
	if resp.Property.Suburb != "WEST END" {
		t.Errorf("suburb = %q, want WEST END", resp.Property.Suburb)
	}
	if len(resp.NextBinDays) != 8 {
		t.Errorf("next_bin_days length = %d, want 8", len(resp.NextBinDays))
	}
	if resp.AsOf == "" {
		t.Error("as_of should not be empty")
	}
}

func TestHandleLookupByPropertyID(t *testing.T) {
	newUpstream(t, westEndDaysResponse(), weeksResponse())

	req := httptest.NewRequest("GET", "/bins?property_number=1264040", nil)
	w := httptest.NewRecorder()
	handleLookup(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", w.Code, w.Body.String())
	}
}

func TestHandleLookupUpstreamError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error_code":"ServerError"}`))
	}))
	orig := openDataBase
	openDataBase = srv.URL
	t.Cleanup(func() { srv.Close(); openDataBase = orig })

	req := httptest.NewRequest("GET", "/bins?suburb=SPRING+HILL&street=UPPER+EDWARD+ST", nil)
	w := httptest.NewRecorder()
	handleLookup(w, req)

	if w.Code != http.StatusBadGateway {
		t.Errorf("status = %d, want 502", w.Code)
	}
}

// ── handleSuburbs ─────────────────────────────────────────────────────────────

func TestHandleSuburbsMissingQ(t *testing.T) {
	req := httptest.NewRequest("GET", "/suburbs", nil)
	w := httptest.NewRecorder()
	handleSuburbs(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestHandleSuburbsSuccess(t *testing.T) {
	newUpstream(t, odsResponse{
		TotalCount: 2,
		Results: []odsRecord{
			{Suburb: "WEST END"},
			{Suburb: "WESTLAKE"},
		},
	}, odsResponse{})

	req := httptest.NewRequest("GET", "/suburbs?q=WEST", nil)
	w := httptest.NewRecorder()
	handleSuburbs(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	var body map[string][]string
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if len(body["suburbs"]) != 2 {
		t.Errorf("suburbs count = %d, want 2", len(body["suburbs"]))
	}
}

func TestHandleSuburbsDeduplicates(t *testing.T) {
	newUpstream(t, odsResponse{
		TotalCount: 3,
		Results: []odsRecord{
			{Suburb: "SPRING HILL"},
			{Suburb: "SPRING HILL"},
			{Suburb: "SPRINGWOOD"},
		},
	}, odsResponse{})

	req := httptest.NewRequest("GET", "/suburbs?q=SPRING", nil)
	w := httptest.NewRecorder()
	handleSuburbs(w, req)

	var body map[string][]string
	json.NewDecoder(w.Body).Decode(&body)
	if len(body["suburbs"]) != 2 {
		t.Errorf("suburbs count = %d, want 2 (deduped)", len(body["suburbs"]))
	}
}

// ── handleStreets ─────────────────────────────────────────────────────────────

func TestHandleStreetsMissingSuburb(t *testing.T) {
	req := httptest.NewRequest("GET", "/streets", nil)
	w := httptest.NewRecorder()
	handleStreets(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestHandleStreetsSuccess(t *testing.T) {
	newUpstream(t, odsResponse{
		TotalCount: 2,
		Results: []odsRecord{
			{StreetName: "UPPER EDWARD ST"},
			{StreetName: "ROGERS ST"},
		},
	}, odsResponse{})

	req := httptest.NewRequest("GET", "/streets?suburb=SPRING+HILL", nil)
	w := httptest.NewRecorder()
	handleStreets(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	var body map[string][]string
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if len(body["streets"]) != 2 {
		t.Errorf("streets count = %d, want 2", len(body["streets"]))
	}
}

func TestHandleStreetsDeduplicates(t *testing.T) {
	newUpstream(t, odsResponse{
		TotalCount: 3,
		Results: []odsRecord{
			{StreetName: "BIRLEY ST"},
			{StreetName: "BIRLEY ST"},
			{StreetName: "ROGERS ST"},
		},
	}, odsResponse{})

	req := httptest.NewRequest("GET", "/streets?suburb=SPRING+HILL", nil)
	w := httptest.NewRecorder()
	handleStreets(w, req)

	var body map[string][]string
	json.NewDecoder(w.Body).Decode(&body)
	if len(body["streets"]) != 2 {
		t.Errorf("streets count = %d, want 2 (deduped)", len(body["streets"]))
	}
}
