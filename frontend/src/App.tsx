import { useState } from "react";
import AddressSearch from "./components/AddressSearch";
import BinSchedule from "./components/BinSchedule";
import { lookupBins } from "./api";
import type { LookupResponse } from "./types";
import "./App.css";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(suburb: string, street: string, number: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await lookupBins({ suburb, street, number: number || undefined });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🗑 BCC Bin Days</h1>
        <p>Find out when your bins are next collected</p>
      </header>

      <main className="app-main">
        <AddressSearch onSearch={handleSearch} loading={loading} />

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {result && <BinSchedule data={result} />}
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
