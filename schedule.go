package main

import (
	"strings"
	"time"
)

// brisbaneTZ returns the Australia/Brisbane time zone (UTC+10, no DST).
func brisbaneTZ() *time.Location {
	loc, err := time.LoadLocation("Australia/Brisbane")
	if err != nil {
		loc = time.FixedZone("AEST", 10*60*60)
	}
	return loc
}

// nextCollectionDate returns the next occurrence of weekday on or after from.
func nextCollectionDate(weekday string, from time.Time) time.Time {
	dayMap := map[string]time.Weekday{
		"MONDAY":    time.Monday,
		"TUESDAY":   time.Tuesday,
		"WEDNESDAY": time.Wednesday,
		"THURSDAY":  time.Thursday,
		"FRIDAY":    time.Friday,
		"SATURDAY":  time.Saturday,
		"SUNDAY":    time.Sunday,
	}
	target, ok := dayMap[weekday]
	if !ok {
		target = time.Monday
	}
	d := from
	for d.Weekday() != target {
		d = d.AddDate(0, 0, 1)
	}
	return d
}

// buildSchedule returns 8 weekly collection events starting from `from`.
// weekZoneMap: Monday ISO date → "yellow" | "green" (from the weeks dataset).
// Falls back to ISO week parity if the weeks dataset doesn't cover the date.
func buildSchedule(prop PropertyInfo, weekZoneMap map[string]string, from time.Time) []BinSchedule {
	var schedule []BinSchedule
	first := nextCollectionDate(prop.CollectionDay, from)

	for i := 0; i < 8; i++ {
		d := first.AddDate(0, 0, i*7)

		// Find Monday of this collection week to key into weekZoneMap.
		monday := d
		for monday.Weekday() != time.Monday {
			monday = monday.AddDate(0, 0, -1)
		}
		mondayKey := monday.Format("2006-01-02")

		weekZone, found := weekZoneMap[mondayKey]
		if !found {
			// Fallback: use ISO week number parity.
			// Zone 1: even week → yellow, odd week → green
			// Zone 2: even week → green, odd week → yellow
			_, isoWeek := d.ISOWeek()
			if strings.Contains(strings.ToUpper(prop.Zone), "1") {
				if isoWeek%2 == 0 {
					weekZone = "yellow"
				} else {
					weekZone = "green"
				}
			} else {
				if isoWeek%2 == 0 {
					weekZone = "green"
				} else {
					weekZone = "yellow"
				}
			}
		}

		schedule = append(schedule, BinSchedule{
			Date:         d.Format("2006-01-02"),
			DayName:      d.Weekday().String(),
			GeneralWaste: true,
			Recycling:    weekZone == "yellow",
			GreenWaste:   weekZone == "green",
			DaysUntil:    int(d.Sub(from).Hours() / 24),
		})
	}
	return schedule
}
