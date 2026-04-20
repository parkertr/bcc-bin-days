# BCC Bin Days

A Go REST API and React frontend that wraps Brisbane City Council's public Open Data platform to show bin collection schedules (general waste, recycling, green waste) for any residential address in Brisbane.

## Background

BCC publishes two open datasets on `data.brisbane.qld.gov.au`:

| Dataset | What it contains |
|---|---|
| `waste-collection-days-collection-days` | Every residential property, its collection day of week, and zone (`ZONE 1` or `ZONE 2`) |
| `waste-collection-days-collection-weeks` | Dates mapped to zone, determining the fortnightly yellow/green rotation |

This API combines those two datasets to answer "which bins go out, and when?" for the next 8 weeks.

**Bin logic:**
- **General waste (red)** — every week, no exceptions
- **Recycling (yellow)** — fortnightly, alternates with green
- **Green waste (green)** — fortnightly, alternates with yellow
- The zone (`ZONE 1` / `ZONE 2`) determines which fortnight is yellow vs green

## Endpoints

### `GET /bins`

Look up bin collection days by address or property ID.

**Parameters (option A — address):**
| Param | Required | Example |
|---|---|---|
| `suburb` | yes | `WEST END` |
| `street` | yes | `Tondara Lane` or `Tondara` |
| `number` | no | `41` |

Street names are matched case-insensitively and stored in ALL CAPS with abbreviations (e.g. `ST`, `RD`). If an exact match returns no results the API automatically retries using a prefix match on the first word of the street name.

**Parameters (option B — direct):**
| Param | Required | Example |
|---|---|---|
| `property_number` | yes | `12345678` |

**Example:**
```
GET /bins?suburb=WEST+END&street=Tondara+Lane&number=41
```

**Response:**
```json
{
  "property": {
    "property_number": "1264040",
    "address": "41 TONDARA LANE, WEST END",
    "suburb": "WEST END",
    "collection_day": "THURSDAY",
    "zone": "ZONE 1"
  },
  "next_bin_days": [
    {
      "date": "2026-04-20",
      "day_name": "Monday",
      "general_waste": true,
      "recycling": false,
      "green_waste": true,
      "days_until": 0
    },
    {
      "date": "2026-04-27",
      "day_name": "Monday",
      "general_waste": true,
      "recycling": true,
      "green_waste": false,
      "days_until": 7
    }
  ],
  "as_of": "2026-04-20T09:00:00+10:00"
}
```

---

### `GET /suburbs?q=WEST`

Autocomplete helper — returns suburb names matching the prefix (case-insensitive).

```json
{ "suburbs": ["WEST END", "WESTLAKE"] }
```

---

### `GET /streets?suburb=SPRING+HILL&q=Upp`

Autocomplete helper — returns street names in a suburb matching the prefix.

```json
{ "streets": ["UPPER EDWARD ST", "UPPER MARY ST"] }
```

---

### `GET /health`

Health check.

```json
{ "status": "ok", "time": "2026-04-20T09:00:00+10:00" }
```

---

## Running

### API (Go)

```bash
go run .
# or
go build -o bcc-bins && ./bcc-bins
```

Defaults to port `8080`. Override with:

```bash
PORT=3000 ./bcc-bins
```

### Frontend (React / Vite)

```bash
cd frontend
npm install
npm run dev
```

The dev server starts on `http://localhost:5173`. API requests are proxied to `http://localhost:8080`, so the Go API must be running alongside it.

To build for production:

```bash
cd frontend && npm run build
```

The compiled output lands in `frontend/dist/` and can be served as static files alongside the API binary.

### Docker

```bash
docker build -t bcc-bins .
docker run -p 8080:8080 bcc-bins
```

---

## Testing

```bash
go test ./...
```

Tests use `httptest` mock servers and do not hit the live BCC API.

---

## Project Structure

```
# API
main.go            # Entry point, server setup, request logging
types.go           # ODS and public API struct types
ods.go             # BCC Open Data client (queryODS)
schedule.go        # Collection date and bin rotation logic
handlers.go        # HTTP handlers and response helpers

testhelpers_test.go # Shared test fixtures and mock upstream
schedule_test.go    # Tests for schedule and date logic
ods_test.go         # Tests for the ODS HTTP client
handlers_test.go    # Tests for all HTTP handlers

# Frontend
frontend/
  src/
    api.ts                      # Typed fetch wrappers for all API endpoints
    types.ts                    # TypeScript interfaces mirroring API responses
    App.tsx                     # Root component — address lookup and result state
    components/
      AddressSearch.tsx         # Suburb/street/number inputs with autocomplete
      BinSchedule.tsx           # Schedule display — next collection + 8-week list
      BinIcon.tsx               # SVG bin icon (red / yellow / green)
  vite.config.ts                # Dev proxy: /bins, /suburbs, /streets → :8080
```

---

## Logging

All log output is structured JSON (`log/slog`) written to stdout. Each request is logged at `INFO` level with `method`, `url`, and `duration`. Upstream errors are logged at `ERROR` with the full query and upstream response body.

```json
{"time":"2026-04-20T09:00:00+10:00","level":"INFO","msg":"request","method":"GET","url":"/bins?suburb=WEST+END&street=Tondara+Lane","duration":"142ms"}
```

---

## Notes

- No API key required — BCC Open Data is fully public
- The BCC dataset is updated quarterly (March, June, September, December)
- All times are in Brisbane local time (AEST, UTC+10, no DST)
- Street names in the dataset use abbreviations (`ST`, `RD`, `DR`, etc.)

- CORS headers are included (`Access-Control-Allow-Origin: *`)
