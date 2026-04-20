import { useState } from "react";
import AddressSearch from "./components/AddressSearch";
import BinSchedule from "./components/BinSchedule";
import SavedPlaces from "./components/SavedPlaces";
import { lookupBins } from "./api";
import { useSavedPlaces } from "./hooks/useSavedPlaces";
import type { LookupResponse, SavedPlace } from "./types";
import "./App.css";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentParams, setCurrentParams] = useState<{ suburb: string; street: string; number: string } | null>(null);

  const { places, save, remove, isSaved } = useSavedPlaces();

  async function handleSearch(suburb: string, street: string, number: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentParams({ suburb, street, number });
    try {
      const data = await lookupBins({ suburb, street, number: number || undefined });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleLoadPlace(place: SavedPlace) {
    handleSearch(place.suburb, place.street, place.number);
  }

  function handleSaveToggle() {
    if (!result || !currentParams) return;
    if (isSaved(currentParams.suburb, currentParams.street, currentParams.number)) return;
    save({
      address: result.property.address,
      suburb: currentParams.suburb,
      street: currentParams.street,
      number: currentParams.number,
    });
  }

  const alreadySaved =
    currentParams != null &&
    isSaved(currentParams.suburb, currentParams.street, currentParams.number);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🗑 BCC Bin Days</h1>
        <p>Find out when your bins are next collected</p>
      </header>

      <main className="app-main">
        <SavedPlaces places={places} onLoad={handleLoadPlace} onRemove={remove} />

        <AddressSearch onSearch={handleSearch} loading={loading} />

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {result && (
          <>
            <div className="save-bar">
              <button
                className={`save-btn${alreadySaved ? " save-btn--saved" : ""}`}
                onClick={handleSaveToggle}
                disabled={alreadySaved}
              >
                {alreadySaved ? "✓ Saved" : "☆ Save this address"}
              </button>
            </div>
            <BinSchedule data={result} />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Data from{" "}
          <a
            href="https://data.brisbane.qld.gov.au"
            target="_blank"
            rel="noopener noreferrer"
          >
            Brisbane City Council Open Data
          </a>
        </p>
      </footer>
    </div>
  );
}

