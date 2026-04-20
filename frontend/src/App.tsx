import { useState } from "react";
import { lookupBins } from "./api";
import { useSavedPlaces } from "./hooks/useSavedPlaces";
import { useTheme } from "./hooks/useTheme";
import type { LookupResponse, SavedPlace } from "./types";
import AmbientLayout from "./layouts/AmbientLayout";
import TerminalLayout from "./layouts/TerminalLayout";
import GridLayout from "./layouts/GridLayout";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentParams, setCurrentParams] = useState<{ suburb: string; street: string; number: string } | null>(null);

  const { places, save, remove, isSaved } = useSavedPlaces();
  const { theme, setTheme } = useTheme();

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

  const layoutProps = {
    loading, result, error, places, alreadySaved,
    onSearch: handleSearch,
    onSaveToggle: handleSaveToggle,
    onLoadPlace: handleLoadPlace,
    onRemovePlace: remove,
    theme,
    onThemeChange: setTheme,
  };

  if (theme === "terminal") return <TerminalLayout {...layoutProps} />;
  if (theme === "grid") return <GridLayout {...layoutProps} />;
  return <AmbientLayout {...layoutProps} />;
}

