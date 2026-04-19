package main

// ── BCC Open Data response types ─────────────────────────────────────────────

type odsResponse struct {
	TotalCount int         `json:"total_count"`
	Results    []odsRecord `json:"results"`
}

type odsRecord struct {
	// collection-days dataset fields
	PropertyID    string `json:"property_id"`
	Suburb        string `json:"suburb"`
	StreetName    string `json:"street_name"`
	HouseNumber   string `json:"house_number"`
	CollectionDay string `json:"collection_day"`
	Zone          string `json:"zone"`

	// collection-weeks dataset fields (also uses "zone")
	WeekStarting string `json:"week_starting"`
}

// ── Public API response types ─────────────────────────────────────────────────

type PropertyInfo struct {
	PropertyNumber string `json:"property_number"`
	Address        string `json:"address"`
	Suburb         string `json:"suburb"`
	CollectionDay  string `json:"collection_day"`
	Zone           string `json:"zone"`
}

type BinSchedule struct {
	Date         string `json:"date"`
	DayName      string `json:"day_name"`
	GeneralWaste bool   `json:"general_waste"` // red  — every week
	Recycling    bool   `json:"recycling"`     // yellow — fortnightly
	GreenWaste   bool   `json:"green_waste"`   // green — fortnightly
	DaysUntil    int    `json:"days_until"`
}

type LookupResponse struct {
	Property    PropertyInfo  `json:"property"`
	NextBinDays []BinSchedule `json:"next_bin_days"` // 8 weeks ahead
	AsOf        string        `json:"as_of"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}
