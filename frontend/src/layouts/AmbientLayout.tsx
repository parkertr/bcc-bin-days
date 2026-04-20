import BinIcon from "../components/BinIcon";
import AddressSearch from "../components/AddressSearch";
import ThemeSelector from "../components/ThemeSelector";
import type { LookupResponse, SavedPlace, BinSchedule } from "../types";
import type { Theme } from "../hooks/useTheme";
import "./AmbientLayout.css";

interface Props {
  loading: boolean;
  result: LookupResponse | null;
  error: string | null;
  places: SavedPlace[];
  alreadySaved: boolean;
  onSearch: (suburb: string, street: string, number: string) => void;
  onSaveToggle: () => void;
  onLoadPlace: (place: SavedPlace) => void;
  onRemovePlace: (id: string) => void;
  theme: Theme;
  onThemeChange: (t: Theme) => void;
}

function fmtLong(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function fmtShort(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function daysLabel(n: number) {
  if (n === 0) return "Today";
  if (n === 7) return "Next week";
  return `In ${n} days`;
}

function UpcomingRow({ day }: { day: BinSchedule }) {
  return (
    <div className={`al-upcoming-row${day.days_until === 0 ? " al-upcoming-row--today" : ""}`}>
      <div className="al-upcoming-row__date">
        <span>{fmtShort(day.date)}</span>
        <span className="al-upcoming-row__countdown">{daysLabel(day.days_until)}</span>
      </div>
      <div className="al-upcoming-row__bins">
        <BinIcon type="general" active={day.general_waste} />
        <BinIcon type="recycling" active={day.recycling} />
        <BinIcon type="green" active={day.green_waste} />
      </div>
    </div>
  );
}

export default function AmbientLayout({
  loading, result, error, places, alreadySaved,
  onSearch, onSaveToggle, onLoadPlace, onRemovePlace,
  theme, onThemeChange,
}: Props) {
  const next = result?.next_bin_days[0];

  return (
    <div className="al">
      <div className="al__orb al__orb--1" />
      <div className="al__orb al__orb--2" />
      <div className="al__orb al__orb--3" />

      <div className="al__topbar">
        <ThemeSelector theme={theme} onChange={onThemeChange} variant="pills" />
      </div>

      <main className="al__main">
        <div className="al__hero">
          <div className="al__hero-icon">🗑</div>
          <h1 className="al__hero-title">BCC Bin Days</h1>
          <p className="al__hero-sub">Find your bin collection day</p>
        </div>

        {places.length > 0 && (
          <div className="al__chips">
            {places.map((p) => (
              <span key={p.id} className="al__chip">
                <button className="al__chip-load" onClick={() => onLoadPlace(p)}>{p.address}</button>
                <button className="al__chip-remove" onClick={() => onRemovePlace(p.id)} aria-label="Remove">×</button>
              </span>
            ))}
          </div>
        )}

        <div className="al__search-wrap">
          <AddressSearch onSearch={onSearch} loading={loading} />
        </div>

        {error && <div className="al__error">{error}</div>}

        {result && next && (
          <div className="al__result">
            <p className="al__result-address">{result.property.address}</p>
            <div className="al__result-label">NEXT COLLECTION</div>
            <div className="al__result-date">{fmtLong(next.date)}</div>
            <div className="al__result-countdown">{daysLabel(next.days_until)}</div>
            <div className="al__result-bins">
              <BinIcon type="general" active={next.general_waste} />
              <BinIcon type="recycling" active={next.recycling} />
              <BinIcon type="green" active={next.green_waste} />
            </div>
            <button
              className={`al__save-btn${alreadySaved ? " al__save-btn--saved" : ""}`}
              onClick={onSaveToggle}
              disabled={alreadySaved}
            >
              {alreadySaved ? "✓ Saved" : "☆ Save this address"}
            </button>

            {result.next_bin_days.length > 1 && (
              <details className="al__upcoming">
                <summary>All upcoming collections (8 weeks)</summary>
                <div className="al__upcoming-list">
                  {result.next_bin_days.map((day) => (
                    <UpcomingRow key={day.date} day={day} />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </main>

      <footer className="al__footer">
        Data from{" "}
        <a href="https://data.brisbane.qld.gov.au" target="_blank" rel="noopener noreferrer">
          Brisbane City Council Open Data
        </a>
      </footer>
    </div>
  );
}
