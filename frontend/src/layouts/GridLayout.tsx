import AddressSearch from "../components/AddressSearch";
import ThemeSelector from "../components/ThemeSelector";
import type { LookupResponse, SavedPlace, BinSchedule } from "../types";
import type { Theme } from "../hooks/useTheme";
import "./GridLayout.css";

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

const BIN_CONFIG = {
  general:   { label: "General Waste", cls: "gl-badge--general" },
  recycling: { label: "Recycling",      cls: "gl-badge--recycling" },
  green:     { label: "Green Waste",    cls: "gl-badge--green" },
} as const;

function BinBadge({ type, active }: { type: keyof typeof BIN_CONFIG; active: boolean }) {
  const { label, cls } = BIN_CONFIG[type];
  return (
    <span className={`gl-badge ${cls}${active ? "" : " gl-badge--inactive"}`}>
      {label}
    </span>
  );
}

function fmtDay(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long" });
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "long" });
}

function fmtRow(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-AU", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function daysLabel(n: number) {
  if (n === 0) return "Today";
  if (n === 7) return "Next week";
  return `In ${n} days`;
}

function ScheduleRow({ day }: { day: BinSchedule }) {
  return (
    <div className={`gl-sched-row${day.days_until === 0 ? " gl-sched-row--today" : ""}`}>
      <div className="gl-sched-row__left">
        <span className="gl-sched-row__date">{fmtRow(day.date)}</span>
        <span className="gl-sched-row__countdown">{daysLabel(day.days_until)}</span>
      </div>
      <div className="gl-sched-row__badges">
        {day.general_waste && <BinBadge type="general" active />}
        {day.recycling && <BinBadge type="recycling" active />}
        {day.green_waste && <BinBadge type="green" active />}
      </div>
    </div>
  );
}

export default function GridLayout({
  loading, result, error, places, alreadySaved,
  onSearch, onSaveToggle, onLoadPlace, onRemovePlace,
  theme, onThemeChange,
}: Props) {
  const next = result?.next_bin_days[0];

  return (
    <div className="gl">
      <header className="gl-header">
        <div className="gl-header__brand">
          <span className="gl-header__icon">🗑</span>
          <div>
            <div className="gl-header__title">BCC Bin Days</div>
            <div className="gl-header__sub">Brisbane waste collection</div>
          </div>
        </div>
        <ThemeSelector theme={theme} onChange={onThemeChange} variant="tabs" />
      </header>

      <div className="gl-body">
        <aside className="gl-sidebar">
          <div className="gl-sidebar__heading">📍 Saved Places</div>
          {places.length === 0 ? (
            <p className="gl-sidebar__empty">Save an address to see it here</p>
          ) : (
            <ul className="gl-sidebar__list">
              {places.map((p) => (
                <li key={p.id} className="gl-sidebar__item">
                  <button className="gl-sidebar__load" onClick={() => onLoadPlace(p)}>
                    {p.address}
                  </button>
                  <button className="gl-sidebar__remove" onClick={() => onRemovePlace(p.id)} aria-label="Remove">
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="gl-main">
          <section className="gl-search-section">
            <AddressSearch onSearch={onSearch} loading={loading} />
            {error && <div className="gl-error">{error}</div>}
          </section>

          {result && next && (
            <>
              <div className="gl-address-bar">
                <div className="gl-address-bar__left">
                  <span className="gl-address-bar__addr">{result.property.address}</span>
                  <span className="gl-address-bar__meta">
                    {result.property.collection_day} · Zone {result.property.zone}
                  </span>
                </div>
                <button
                  className={`gl-save-btn${alreadySaved ? " gl-save-btn--saved" : ""}`}
                  onClick={onSaveToggle}
                  disabled={alreadySaved}
                >
                  {alreadySaved ? "✓ Saved" : "☆ Save"}
                </button>
              </div>

              <div className="gl-results">
                <div className="gl-next-tile">
                  <div className="gl-next-tile__label">NEXT COLLECTION</div>
                  <div className="gl-next-tile__day">{fmtDay(next.date)}</div>
                  <div className="gl-next-tile__date">{fmtDate(next.date)}</div>
                  <div className="gl-next-tile__countdown">{daysLabel(next.days_until)}</div>
                  <div className="gl-next-tile__badges">
                    <BinBadge type="general" active={next.general_waste} />
                    <BinBadge type="recycling" active={next.recycling} />
                    <BinBadge type="green" active={next.green_waste} />
                  </div>
                </div>

                <div className="gl-schedule">
                  <div className="gl-schedule__heading">Next 8 weeks</div>
                  <div className="gl-schedule__list">
                    {result.next_bin_days.map((day) => (
                      <ScheduleRow key={day.date} day={day} />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <footer className="gl-footer">
        Data from{" "}
        <a href="https://data.brisbane.qld.gov.au" target="_blank" rel="noopener noreferrer">
          Brisbane City Council Open Data
        </a>
      </footer>
    </div>
  );
}
