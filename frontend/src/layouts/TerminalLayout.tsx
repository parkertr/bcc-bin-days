import AddressSearch from "../components/AddressSearch";
import ThemeSelector from "../components/ThemeSelector";
import type { LookupResponse, SavedPlace, BinSchedule } from "../types";
import type { Theme } from "../hooks/useTheme";
import "./TerminalLayout.css";

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

function fmtTerm(iso: string) {
  return new Date(iso + "T00:00:00")
    .toLocaleDateString("en-AU", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

function BinLine({ active, label, color }: { active: boolean; label: string; color: string }) {
  return (
    <span className="tl-bin" style={{ color: active ? color : "#2d4a2d" }}>
      [{active ? "█" : "░"}] {label.toUpperCase().padEnd(14)}
    </span>
  );
}

function TermResult({ data, alreadySaved, onSaveToggle }: {
  data: LookupResponse;
  alreadySaved: boolean;
  onSaveToggle: () => void;
}) {
  const { property, next_bin_days } = data;
  const next = next_bin_days[0];
  const countdown = next.days_until === 0 ? "TODAY" : next.days_until === 7 ? "NEXT WEEK" : `IN ${next.days_until} DAYS`;

  return (
    <div className="tl-output">
      <div className="tl-hr" />
      <div className="tl-section-hdr">▶ PROPERTY FOUND</div>
      <div className="tl-hr" />
      <div className="tl-kv"><span className="tl-key">address        </span><span className="tl-val">{property.address}</span></div>
      <div className="tl-kv"><span className="tl-key">collection day </span><span className="tl-val">{property.collection_day.toUpperCase()}</span></div>
      <div className="tl-kv"><span className="tl-key">zone           </span><span className="tl-val">{property.zone}</span></div>
      <div className="tl-blank" />
      <div className="tl-next-line">
        <span className="tl-next-label">NEXT COLLECTION</span>
        <span className="tl-arrow"> ──▶ </span>
        <span className="tl-next-date">{fmtTerm(next.date)}</span>
        <span className="tl-next-count"> ({countdown})</span>
      </div>
      <div className="tl-bins">
        <BinLine active={next.general_waste} label="General waste" color="#f87171" />
        <BinLine active={next.recycling} label="Recycling" color="#fbbf24" />
        <BinLine active={next.green_waste} label="Green waste" color="#4ade80" />
      </div>
      <div className="tl-blank" />
      <button className="tl-save-btn" onClick={onSaveToggle} disabled={alreadySaved}>
        {alreadySaved ? "$ # address already saved ✓" : "$ save-address"}
      </button>
      <div className="tl-blank" />
      <div className="tl-hr" />
      <div className="tl-section-hdr">▶ UPCOMING SCHEDULE (8 WEEKS)</div>
      <div className="tl-hr" />
      {next_bin_days.map((day) => (
        <div key={day.date} className={`tl-sched-row${day.days_until === 0 ? " tl-sched-row--today" : ""}`}>
          <span className="tl-sched-date">{fmtTerm(day.date)}</span>
          <span className="tl-sched-bins">
            <span style={{ color: day.general_waste ? "#f87171" : "#2d4a2d" }}>{day.general_waste ? "█" : "░"} GEN</span>
            {" "}
            <span style={{ color: day.recycling ? "#fbbf24" : "#2d4a2d" }}>{day.recycling ? "█" : "░"} REC</span>
            {" "}
            <span style={{ color: day.green_waste ? "#4ade80" : "#2d4a2d" }}>{day.green_waste ? "█" : "░"} GRN</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TerminalLayout({
  loading, result, error, places, alreadySaved,
  onSearch, onSaveToggle, onLoadPlace, onRemovePlace,
  theme, onThemeChange,
}: Props) {
  return (
    <div className="tl">
      <div className="tl-window">
        <div className="tl-titlebar">
          <span className="tl-dot tl-dot--red" />
          <span className="tl-dot tl-dot--yellow" />
          <span className="tl-dot tl-dot--green" />
          <span className="tl-titlebar__title">bcc-bin-days — zsh</span>
        </div>

        <div className="tl-body">
          <pre className="tl-banner">{`  ██████╗  ██████╗ ██████╗    ██████╗ ██╗███╗   ██╗    ██████╗  █████╗ ██╗   ██╗███████╗
  ██╔══██╗██╔════╝██╔════╝    ██╔══██╗██║████╗  ██║    ██╔══██╗██╔══██╗╚██╗ ██╔╝██╔════╝
  ██████╔╝██║     ██║         ██████╔╝██║██╔██╗ ██║    ██║  ██║███████║ ╚████╔╝ ███████╗
  ██╔══██╗██║     ██║         ██╔══██╗██║██║╚██╗██║    ██║  ██║██╔══██║  ╚██╔╝  ╚════██║
  ██████╔╝╚██████╗╚██████╗    ██████╔╝██║██║ ╚████║    ██████╔╝██║  ██║   ██║   ███████║
  ╚═════╝  ╚═════╝ ╚═════╝    ╚═════╝ ╚═╝╚═╝  ╚═══╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝`}</pre>

          <div className="tl-meta-row">
            <span className="tl-version">v1.0.0 · Brisbane City Council Open Data</span>
          </div>
          <div className="tl-meta-row">
            <ThemeSelector theme={theme} onChange={onThemeChange} variant="terminal" />
          </div>

          <div className="tl-blank" />

          {places.length > 0 && (
            <div className="tl-saved">
              <div className="tl-section-hdr">▶ SAVED PLACES</div>
              {places.map((p) => (
                <div key={p.id} className="tl-saved-row">
                  <button className="tl-saved-load" onClick={() => onLoadPlace(p)}>
                    $ check-bins --address="{p.address}"
                  </button>
                  <button className="tl-saved-remove" onClick={() => onRemovePlace(p.id)} aria-label="Remove">
                    [rm]
                  </button>
                </div>
              ))}
              <div className="tl-blank" />
            </div>
          )}

          <div className="tl-prompt-label">$ check-bins</div>
          <div className="tl-search-wrap">
            <AddressSearch onSearch={onSearch} loading={loading} />
          </div>

          {error && (
            <div className="tl-error">
              <span className="tl-error__prefix">ERROR: </span>{error}
            </div>
          )}

          {loading && (
            <div className="tl-loading">⣾ Querying BCC open data…</div>
          )}

          {result && (
            <TermResult data={result} alreadySaved={alreadySaved} onSaveToggle={onSaveToggle} />
          )}

          {!result && !loading && (
            <div className="tl-cursor-line"><span className="tl-cursor">▌</span></div>
          )}
        </div>
      </div>

      <footer className="tl-footer">
        <a href="https://data.brisbane.qld.gov.au" target="_blank" rel="noopener noreferrer">
          data.brisbane.qld.gov.au
        </a>
      </footer>
    </div>
  );
}
