package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestQueryODSSuccess(t *testing.T) {
	want := odsResponse{TotalCount: 1, Results: []odsRecord{{PropertyID: "123"}}}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(want)
	}))
	defer srv.Close()

	orig := openDataBase
	openDataBase = srv.URL
	defer func() { openDataBase = orig }()

	got, err := queryODS(daysDataset, `suburb="WEST END"`, 5)
	if err != nil {
		t.Fatal(err)
	}
	if got.TotalCount != 1 || got.Results[0].PropertyID != "123" {
		t.Errorf("unexpected response: %+v", got)
	}
}

func TestQueryODSNon200IncludesBody(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error_code":"ODSQLError","message":"Unknown field: bad_field"}`))
	}))
	defer srv.Close()

	orig := openDataBase
	openDataBase = srv.URL
	defer func() { openDataBase = orig }()

	_, err := queryODS(daysDataset, "bad_field=x", 5)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "400") {
		t.Errorf("error should mention HTTP 400, got: %v", err)
	}
	if !strings.Contains(err.Error(), "ODSQLError") {
		t.Errorf("error should include upstream body, got: %v", err)
	}
}

func TestQueryODSMalformedJSON(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`not json`))
	}))
	defer srv.Close()

	orig := openDataBase
	openDataBase = srv.URL
	defer func() { openDataBase = orig }()

	_, err := queryODS(daysDataset, `suburb="X"`, 5)
	if err == nil {
		t.Fatal("expected error for malformed JSON, got nil")
	}
}
