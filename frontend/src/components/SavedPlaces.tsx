import type { SavedPlace } from "../types";

interface Props {
  places: SavedPlace[];
  onLoad: (place: SavedPlace) => void;
  onRemove: (id: string) => void;
}

export default function SavedPlaces({ places, onLoad, onRemove }: Props) {
  if (places.length === 0) return null;

  return (
    <section className="saved-places">
      <h2 className="saved-places__heading">Saved places</h2>
      <ul className="saved-places__list">
        {places.map((place) => (
          <li key={place.id} className="saved-place">
            <button
              className="saved-place__load"
              onClick={() => onLoad(place)}
              title="Load this address"
            >
              <span className="saved-place__address">{place.address}</span>
            </button>
            <button
              className="saved-place__remove"
              onClick={() => onRemove(place.id)}
              aria-label={`Remove ${place.address}`}
              title="Remove"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
