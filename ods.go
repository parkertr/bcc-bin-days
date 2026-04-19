package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// openDataBase is a var so tests can substitute a httptest.Server URL.
var openDataBase = "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets"

const (
	daysDataset  = "waste-collection-days-collection-days"
	weeksDataset = "waste-collection-days-collection-weeks"
)

// queryODS calls the OpenDataSoft v2.1 records endpoint.
//
// ODSQL syntax notes (these were the source of the original 400 errors):
//   - String literals MUST use double quotes:  suburb="WEST END"
//     Single quotes are not valid ODSQL and return HTTP 400.
//   - Integer fields take no quotes at all:    property_number=12345678
//   - Prefix search uses startswith(), not LIKE: startswith(suburb_name,"KEN")
//   - Date comparisons also use double quotes:  week_starting>="2026-04-20"
func queryODS(dataset, where string, limit int) (*odsResponse, error) {
	endpoint := fmt.Sprintf("%s/%s/records?where=%s&limit=%d",
		openDataBase, dataset, url.QueryEscape(where), limit)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("building request: %w", err)
	}
	req.Header.Set("User-Agent", "BCC-Bins-API/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("upstream request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return nil, fmt.Errorf("upstream returned HTTP %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var result odsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}
	return &result, nil
}
