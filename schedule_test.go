package main

import (
	"testing"
	"time"
)

// ── nextCollectionDate ────────────────────────────────────────────────────────

func TestNextCollectionDate(t *testing.T) {
	monday := time.Date(2026, 4, 20, 0, 0, 0, 0, time.UTC)

	cases := []struct {
		day  string
		from time.Time
		want string
	}{
		{"MONDAY", monday, "2026-04-20"}, // already Monday
		{"TUESDAY", monday, "2026-04-21"},
		{"FRIDAY", monday, "2026-04-24"},
		{"SUNDAY", monday, "2026-04-26"},
		{"MONDAY", monday.AddDate(0, 0, 1), "2026-04-27"}, // Tuesday → next Monday
		{"INVALID", monday, "2026-04-20"},                 // unknown day defaults to Monday
	}

	for _, c := range cases {
		got := nextCollectionDate(c.day, c.from)
		if got.Format("2006-01-02") != c.want {
			t.Errorf("nextCollectionDate(%q, %s) = %s, want %s",
				c.day, c.from.Format("2006-01-02"), got.Format("2006-01-02"), c.want)
		}
	}
}

// ── buildSchedule ─────────────────────────────────────────────────────────────

func TestBuildScheduleLength(t *testing.T) {
	prop := PropertyInfo{CollectionDay: "MONDAY", Zone: "ZONE 1"}
	from := time.Date(2026, 4, 20, 0, 0, 0, 0, time.UTC)
	sched := buildSchedule(prop, map[string]string{}, from)
	if len(sched) != 8 {
		t.Fatalf("expected 8 entries, got %d", len(sched))
	}
}

func TestBuildScheduleAlwaysHasGeneralWaste(t *testing.T) {
	prop := PropertyInfo{CollectionDay: "MONDAY", Zone: "ZONE 1"}
	from := time.Date(2026, 4, 20, 0, 0, 0, 0, time.UTC)
	for _, s := range buildSchedule(prop, map[string]string{}, from) {
		if !s.GeneralWaste {
			t.Errorf("GeneralWaste should always be true, got false for %s", s.Date)
		}
		if s.Recycling == s.GreenWaste {
			t.Errorf("exactly one of Recycling/GreenWaste should be true for %s", s.Date)
		}
	}
}

func TestBuildScheduleWeeklySpacing(t *testing.T) {
	prop := PropertyInfo{CollectionDay: "WEDNESDAY", Zone: "ZONE 1"}
	from := time.Date(2026, 4, 20, 0, 0, 0, 0, time.UTC)
	sched := buildSchedule(prop, map[string]string{}, from)

	if sched[0].Date != "2026-04-22" {
		t.Errorf("first collection date = %s, want 2026-04-22", sched[0].Date)
	}
	for i := 1; i < len(sched); i++ {
		prev, _ := time.Parse("2006-01-02", sched[i-1].Date)
		curr, _ := time.Parse("2006-01-02", sched[i].Date)
		if diff := int(curr.Sub(prev).Hours() / 24); diff != 7 {
			t.Errorf("gap between collection %d and %d = %d days, want 7", i-1, i, diff)
		}
	}
}

func TestBuildScheduleDaysUntil(t *testing.T) {
	prop := PropertyInfo{CollectionDay: "MONDAY", Zone: "ZONE 1"}
	from := time.Date(2026, 4, 20, 0, 0, 0, 0, time.UTC)
	sched := buildSchedule(prop, map[string]string{}, from)

	for i, s := range sched {
		want := i * 7
		if s.DaysUntil != want {
			t.Errorf("sched[%d].DaysUntil = %d, want %d", i, s.DaysUntil, want)
		}
	}
}

func TestBuildScheduleWithExplicitZoneMap(t *testing.T) {
	prop := PropertyInfo{CollectionDay: "MONDAY", Zone: "ZONE 1"}
	from := time.Date(2026, 4, 20, 0, 0, 0, 0, time.UTC)
	weekZoneMap := map[string]string{
		"2026-04-20": "green",
		"2026-04-27": "yellow",
	}
	sched := buildSchedule(prop, weekZoneMap, from)

	if sched[0].GreenWaste != true || sched[0].Recycling != false {
		t.Errorf("week 0: want GreenWaste=true Recycling=false, got %+v", sched[0])
	}
	if sched[1].Recycling != true || sched[1].GreenWaste != false {
		t.Errorf("week 1: want Recycling=true GreenWaste=false, got %+v", sched[1])
	}
}

// TestBuildScheduleFallbackParity verifies the ISO-week fallback logic
// for both Zone 1 and Zone 2. 2026-04-20 is ISO week 17 (odd).
func TestBuildScheduleFallbackParity(t *testing.T) {
	from := time.Date(2026, 4, 20, 0, 0, 0, 0, time.UTC) // ISO week 17, odd

	cases := []struct {
		zone       string
		wantFirst  string // week 17 (odd)
		wantSecond string // week 18 (even)
	}{
		{"ZONE 1", "green", "yellow"}, // Zone 1: odd→green, even→yellow
		{"ZONE 2", "yellow", "green"}, // Zone 2: odd→yellow, even→green
	}

	for _, c := range cases {
		prop := PropertyInfo{CollectionDay: "MONDAY", Zone: c.zone}
		sched := buildSchedule(prop, map[string]string{}, from)

		first := map[bool]string{true: "yellow", false: "green"}[sched[0].Recycling]
		second := map[bool]string{true: "yellow", false: "green"}[sched[1].Recycling]

		if first != c.wantFirst {
			t.Errorf("%s week 0: want %s, got %s", c.zone, c.wantFirst, first)
		}
		if second != c.wantSecond {
			t.Errorf("%s week 1: want %s, got %s", c.zone, c.wantSecond, second)
		}
	}
}
