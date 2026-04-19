package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// newUpstream starts a test server that mimics the BCC Open Data API.
// daysResult is served for the collection-days dataset; weeksResult for weeks.
// It substitutes openDataBase for the duration of the test and restores it via t.Cleanup.
func newUpstream(t *testing.T, daysResult odsResponse, weeksResult odsResponse) *httptest.Server {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if strings.Contains(r.URL.Path, weeksDataset) {
			json.NewEncoder(w).Encode(weeksResult)
		} else {
			json.NewEncoder(w).Encode(daysResult)
		}
	}))
	orig := openDataBase
	openDataBase = srv.URL
	t.Cleanup(func() {
		srv.Close()
		openDataBase = orig
	})
	return srv
}

func westEndDaysResponse() odsResponse {
	return odsResponse{
		TotalCount: 1,
		Results: []odsRecord{
			{
				PropertyID:    "1264040",
				Suburb:        "WEST END",
				StreetName:    "TONDARA LANE",
				HouseNumber:   "41",
				CollectionDay: "THURSDAY",
				Zone:          "ZONE 1",
			},
		},
	}
}

func weeksResponse() odsResponse {
	return odsResponse{
		TotalCount: 2,
		Results: []odsRecord{
			{WeekStarting: "2026-04-20", Zone: "Zone 1"},
			{WeekStarting: "2026-04-27", Zone: "Zone 2"},
		},
	}
}
