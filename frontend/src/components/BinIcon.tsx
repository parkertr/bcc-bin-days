type BinType = "general" | "recycling" | "green";

interface Props {
  type: BinType;
  active?: boolean;
}

const config: Record<BinType, { label: string; body: string; lid: string }> = {
  general: { label: "General Waste", body: "#c0392b", lid: "#922b21" },
  recycling: { label: "Recycling", body: "#f1c40f", lid: "#b7950b" },
  green: { label: "Green Waste", body: "#27ae60", lid: "#1e8449" },
};

export default function BinIcon({ type, active = true }: Props) {
  const { label, body, lid } = config[type];
  const opacity = active ? 1 : 0.25;

  return (
    <div className="bin-icon" style={{ opacity }} aria-label={label} title={label}>
      <svg
        viewBox="0 0 60 80"
        width="60"
        height="80"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={label}
      >
        {/* lid */}
        <rect x="5" y="8" width="50" height="8" rx="3" fill={lid} />
        {/* handle */}
        <rect x="22" y="2" width="16" height="8" rx="3" fill={lid} />
        {/* body */}
        <path d="M10 16 L12 74 Q12 78 16 78 L44 78 Q48 78 48 74 L50 16 Z" fill={body} />
        {/* stripes */}
        <line x1="25" y1="22" x2="23" y2="72" stroke="white" strokeWidth="2.5" strokeOpacity="0.3" />
        <line x1="33" y1="22" x2="31" y2="72" stroke="white" strokeWidth="2.5" strokeOpacity="0.3" />
      </svg>
      <span className="bin-label">{label}</span>
    </div>
  );
}
