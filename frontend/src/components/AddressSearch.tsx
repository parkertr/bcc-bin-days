import { useState, useEffect, useRef } from "react";
import { fetchSuburbs, fetchStreets } from "../api";

interface Props {
  onSearch: (suburb: string, street: string, number: string) => void;
  loading: boolean;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AddressSearch({ onSearch, loading }: Props) {
  const [suburb, setSuburb] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");

  const [suburbSuggestions, setSuburbSuggestions] = useState<string[]>([]);
  const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);
  const [showSuburbList, setShowSuburbList] = useState(false);
  const [showStreetList, setShowStreetList] = useState(false);

  const debouncedSuburb = useDebounce(suburb, 250);
  const debouncedStreet = useDebounce(street, 250);
  const suburbRef = useRef<HTMLDivElement>(null);
  const streetRef = useRef<HTMLDivElement>(null);

  // Suburb autocomplete
  useEffect(() => {
    if (debouncedSuburb.length < 2) {
      setSuburbSuggestions([]);
      return;
    }
    fetchSuburbs(debouncedSuburb).then((results) => {
      setSuburbSuggestions(results.slice(0, 8));
      setShowSuburbList(results.length > 0);
    });
  }, [debouncedSuburb]);

  // Street autocomplete — only when a suburb is confirmed
  useEffect(() => {
    if (!suburb || debouncedStreet.length < 2) {
      setStreetSuggestions([]);
      return;
    }
    fetchStreets(suburb, debouncedStreet).then((results) => {
      setStreetSuggestions(results.slice(0, 8));
      setShowStreetList(results.length > 0);
    });
  }, [suburb, debouncedStreet]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suburbRef.current && !suburbRef.current.contains(e.target as Node)) {
        setShowSuburbList(false);
      }
      if (streetRef.current && !streetRef.current.contains(e.target as Node)) {
        setShowStreetList(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!suburb || !street) return;
    onSearch(suburb, street, number);
  }

  return (
    <form className="address-search" onSubmit={handleSubmit}>
      <div className="field-group" ref={suburbRef}>
        <label htmlFor="suburb">Suburb</label>
        <input
          id="suburb"
          type="text"
          value={suburb}
          placeholder="e.g. WEST END"
          autoComplete="off"
          onChange={(e) => {
            setSuburb(e.target.value.toUpperCase());
            setStreet("");
            setShowSuburbList(true);
          }}
        />
        {showSuburbList && suburbSuggestions.length > 0 && (
          <ul className="suggestions">
            {suburbSuggestions.map((s) => (
              <li
                key={s}
                onMouseDown={() => {
                  setSuburb(s);
                  setShowSuburbList(false);
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="field-group" ref={streetRef}>
        <label htmlFor="street">Street</label>
        <input
          id="street"
          type="text"
          value={street}
          placeholder="e.g. TONDARA LANE"
          autoComplete="off"
          disabled={!suburb}
          onChange={(e) => {
            setStreet(e.target.value.toUpperCase());
            setShowStreetList(true);
          }}
        />
        {showStreetList && streetSuggestions.length > 0 && (
          <ul className="suggestions">
            {streetSuggestions.map((s) => (
              <li
                key={s}
                onMouseDown={() => {
                  setStreet(s);
                  setShowStreetList(false);
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="field-group field-group--narrow">
        <label htmlFor="number">Number</label>
        <input
          id="number"
          type="text"
          value={number}
          placeholder="e.g. 41"
          onChange={(e) => setNumber(e.target.value)}
        />
      </div>

      <button type="submit" disabled={loading || !suburb || !street}>
        {loading ? "Looking up…" : "Look up bins"}
      </button>
    </form>
  );
}
