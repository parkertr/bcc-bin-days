package main

import (
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"time"
)

const defaultPort = "8080"

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}
	if _, err := strconv.Atoi(port); err != nil {
		slog.Error("invalid PORT", "port", port)
		os.Exit(1)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/bins", handleLookup)
	mux.HandleFunc("/suburbs", handleSuburbs)
	mux.HandleFunc("/streets", handleStreets)
	mux.HandleFunc("/health", handleHealth)

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		mux.ServeHTTP(w, r)
		slog.Info("request", "method", r.Method, "url", r.URL.String(), "duration", time.Since(start))
	})

	addr := ":" + port
	slog.Info("BCC Bins API listening", "addr", addr)

	if err := http.ListenAndServe(addr, handler); err != nil {
		slog.Error("server error", "err", err)
		os.Exit(1)
	}
}
