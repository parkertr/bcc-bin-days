package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

// ── HTTP helpers ──────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg, details string) {
	if status >= 500 {
		slog.Error("request error", "status", status, "error", msg, "details", details)
	} else {
		slog.Warn("request error", "status", status, "error", msg, "details", details)
	}
	writeJSON(w, status, ErrorResponse{Error: msg, Details: details})
}

// ── Handlers ──────────────────────────────────────────────────────────────────

// GET /bins?suburb=WEST+END&street=Tondara+Lane&number=41
// GET /bins?property_number=12345678
func handleLookup(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	suburb := q.Get("suburb")
	street := q.Get("street")
	number := q.Get("number")
	propertyNumber := q.Get("property_number")

	if propertyNumber == "" && (suburb == "" || street == "") {
		writeError(w, http.StatusBadRequest,
			"missing parameters",
			"provide suburb + street (+ optionally number), or property_number")
		return
	}

	// Build ODSQL where clause.
	// CRITICAL: string literals use double quotes in ODSQL, not single quotes.
	// The suburb name field is stored in ALL CAPS in the dataset.
	var where string
	if propertyNumber != "" {
		where = fmt.Sprintf("property_id=%s", propertyNumber)
	} else {
		where = fmt.Sprintf(`suburb="%s" AND street_name="%s"`,
			strings.ToUpper(suburb), strings.ToUpper(street))
		if number != "" {
			where += fmt.Sprintf(` AND house_number="%s"`, number)
		}
	}

	daysResp, err := queryODS(daysDataset, where, 5)
	if err != nil {
		slog.Error("queryODS failed", "dataset", daysDataset, "where", where, "err", err)
		writeError(w, http.StatusBadGateway, "upstream error", err.Error())
		return
	}

	// Street names in the dataset use abbreviations (e.g. "TWILIGHT ST" not "TWILIGHT STREET").
	// If an exact match returns nothing and a street was provided, retry using startswith()
	// against the first word of the street name so abbreviated names still resolve.
	if (daysResp.TotalCount == 0 || len(daysResp.Results) == 0) && street != "" && propertyNumber == "" {
		firstWord := strings.ToUpper(strings.Fields(street)[0])
		fallbackWhere := fmt.Sprintf(`suburb="%s" AND startswith(street_name,"%s")`,
			strings.ToUpper(suburb), firstWord)
		if number != "" {
			fallbackWhere += fmt.Sprintf(` AND house_number="%s"`, number)
		}
		slog.Info("exact street match empty, retrying with startswith", "fallback_where", fallbackWhere)
		daysResp, err = queryODS(daysDataset, fallbackWhere, 5)
		if err != nil {
			slog.Error("queryODS fallback failed", "dataset", daysDataset, "where", fallbackWhere, "err", err)
			writeError(w, http.StatusBadGateway, "upstream error", err.Error())
			return
		}
	}

	if daysResp.TotalCount == 0 || len(daysResp.Results) == 0 {
		slog.Warn("address not found", "where", where)
		writeError(w, http.StatusNotFound, "address not found",
			"no matching property in the BCC waste collection dataset")
		return
	}

	rec := daysResp.Results[0]
	prop := PropertyInfo{
		PropertyNumber: rec.PropertyID,
		Address:        fmt.Sprintf("%s %s, %s", rec.HouseNumber, rec.StreetName, rec.Suburb),
		Suburb:         rec.Suburb,
		CollectionDay:  rec.CollectionDay,
		Zone:           rec.Zone,
	}

	// Fetch the weeks rotation data to determine yellow/green for each upcoming week.
	// Date literals in ODSQL also use double quotes.
	now := time.Now().In(brisbaneTZ())
	today := now.Truncate(24 * time.Hour)
	weeksWhere := fmt.Sprintf(`week_starting>="%s"`, today.Format("2006-01-02"))

	weekZoneMap := map[string]string{}
	weeksResp, err := queryODS(weeksDataset, weeksWhere, 20)
	if err == nil && weeksResp != nil {
		for _, wr := range weeksResp.Results {
			if wr.WeekStarting == "" {
				continue
			}
			t, parseErr := time.Parse("2006-01-02", wr.WeekStarting)
			if parseErr != nil {
				continue
			}
			key := t.Format("2006-01-02")
			// Both fields are named "zone"; property stores "ZONE 1", weeks stores "Zone 1".
			// Same zone as property = yellow (recycling) week.
			if strings.EqualFold(rec.Zone, wr.Zone) {
				weekZoneMap[key] = "yellow"
			} else {
				weekZoneMap[key] = "green"
			}
		}
	}

	writeJSON(w, http.StatusOK, LookupResponse{
		Property:    prop,
		NextBinDays: buildSchedule(prop, weekZoneMap, today),
		AsOf:        now.Format(time.RFC3339),
	})
}

// GET /suburbs?q=KEN
func handleSuburbs(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		writeError(w, http.StatusBadRequest, "missing parameter", "provide q= for suburb search")
		return
	}

	// startswith() is the correct ODSQL prefix function — "like" does not exist.
	// The function is case-sensitive; suburb names are stored in ALL CAPS.
	where := fmt.Sprintf(`startswith(suburb,"%s")`, strings.ToUpper(q))
	resp, err := queryODS(daysDataset, where, 50)
	if err != nil {
		slog.Error("queryODS failed", "dataset", daysDataset, "where", where, "err", err)
		writeError(w, http.StatusBadGateway, "upstream error", err.Error())
		return
	}

	seen := map[string]bool{}
	var suburbs []string
	for _, rec := range resp.Results {
		if !seen[rec.Suburb] {
			seen[rec.Suburb] = true
			suburbs = append(suburbs, rec.Suburb)
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"suburbs": suburbs})
}

// GET /streets?suburb=SPRING+HILL&q=Upp
func handleStreets(w http.ResponseWriter, r *http.Request) {
	suburb := r.URL.Query().Get("suburb")
	q := r.URL.Query().Get("q")
	if suburb == "" {
		writeError(w, http.StatusBadRequest, "missing parameter", "provide suburb=")
		return
	}

	where := fmt.Sprintf(`suburb="%s"`, strings.ToUpper(suburb))
	if q != "" {
		// Street names are stored in ALL CAPS; uppercase the prefix before querying.
		where += fmt.Sprintf(` AND startswith(street_name,"%s")`, strings.ToUpper(q))
	}

	resp, err := queryODS(daysDataset, where, 100)
	if err != nil {
		slog.Error("queryODS failed", "dataset", daysDataset, "where", where, "err", err)
		writeError(w, http.StatusBadGateway, "upstream error", err.Error())
		return
	}

	seen := map[string]bool{}
	var streets []string
	for _, rec := range resp.Results {
		if !seen[rec.StreetName] {
			seen[rec.StreetName] = true
			streets = append(streets, rec.StreetName)
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"streets": streets})
}

// GET /health
func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status": "ok",
		"time":   time.Now().Format(time.RFC3339),
	})
}
