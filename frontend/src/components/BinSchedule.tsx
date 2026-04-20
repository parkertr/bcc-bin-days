import type { BinSchedule as BinScheduleType, LookupResponse } from "../types";
import BinIcon from "./BinIcon";

interface Props {
  data: LookupResponse;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function daysLabel(daysUntil: number): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 7) return "Next week";
  return `In ${daysUntil} days`;
}

function CollectionRow({ day }: { day: BinScheduleType }) {
  return (
    <div className={`collection-row ${day.days_until === 0 ? "collection-row--today" : ""}`}>
      <div className="collection-row__date">
        <span className="collection-row__day-label">{formatDate(day.date)}</span>
        <span className="collection-row__days-until">{daysLabel(day.days_until)}</span>
      </div>
      <div className="collection-row__bins">
        <BinIcon type="general" active={day.general_waste} />
        <BinIcon type="recycling" active={day.recycling} />
        <BinIcon type="green" active={day.green_waste} />
      </div>
    </div>
  );
}

export default function BinSchedule({ data }: Props) {
  const { property, next_bin_days } = data;

  // Find the next collection (soonest)
  const next = next_bin_days[0];

  return (
    <div className="bin-schedule">
      <div className="property-info">
        <h2>{property.address}</h2>
        <p>
          Collection day: <strong>{property.collection_day}</strong> &mdash; Zone:{" "}
          <strong>{property.zone}</strong>
        </p>
      </div>

      <div className="next-collection">
        <h3>Next collection</h3>
        <div className="next-collection__date">{formatDate(next.date)}</div>
        <div className="next-collection__bins">
          <BinIcon type="general" active={next.general_waste} />
          <BinIcon type="recycling" active={next.recycling} />
          <BinIcon type="green" active={next.green_waste} />
        </div>
      </div>

      <details className="upcoming">
        <summary>All upcoming collections (8 weeks)</summary>
        <div className="upcoming__list">
          {next_bin_days.map((day) => (
            <CollectionRow key={day.date} day={day} />
          ))}
        </div>
      </details>
    </div>
  );
}
