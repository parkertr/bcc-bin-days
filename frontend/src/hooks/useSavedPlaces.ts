import { useState } from "react";
import type { SavedPlace } from "../types";

const STORAGE_KEY = "bcc-saved-places";

function load(): SavedPlace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedPlace[]) : [];
  } catch {
    return [];
  }
}

function persist(places: SavedPlace[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
}

export function useSavedPlaces() {
  const [places, setPlaces] = useState<SavedPlace[]>(load);

  function save(place: Omit<SavedPlace, "id">) {
    setPlaces((prev) => {
      // Avoid duplicates — same suburb + street + number
      const exists = prev.some(
        (p) =>
          p.suburb === place.suburb &&
          p.street === place.street &&
          p.number === place.number,
      );
      if (exists) return prev;
      const next = [{ ...place, id: crypto.randomUUID() }, ...prev];
      persist(next);
      return next;
    });
  }

  function remove(id: string) {
    setPlaces((prev) => {
      const next = prev.filter((p) => p.id !== id);
      persist(next);
      return next;
    });
  }

  function isSaved(suburb: string, street: string, number: string): boolean {
    return places.some(
      (p) => p.suburb === suburb && p.street === street && p.number === number,
    );
  }

  return { places, save, remove, isSaved };
}
