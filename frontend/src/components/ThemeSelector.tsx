import type { Theme } from "../hooks/useTheme";

interface Props {
  theme: Theme;
  onChange: (t: Theme) => void;
  variant?: "pills" | "terminal" | "tabs";
}

const options: { id: Theme; label: string }[] = [
  { id: "ambient", label: "Ambient" },
  { id: "terminal", label: "Terminal" },
  { id: "grid", label: "Grid" },
];

export default function ThemeSelector({ theme, onChange, variant = "pills" }: Props) {
  if (variant === "terminal") {
    return (
      <span className="term-theme-selector">
        theme:{" "}
        {options.map((o) => (
          <button
            key={o.id}
            className={`term-theme-btn${theme === o.id ? " active" : ""}`}
            onClick={() => onChange(o.id)}
          >
            [{theme === o.id ? "x" : " "} {o.label}]
          </button>
        ))}
      </span>
    );
  }

  if (variant === "tabs") {
    return (
      <div className="tab-theme-selector" role="group" aria-label="Choose design">
        {options.map((o) => (
          <button
            key={o.id}
            className={`tab-theme-btn${theme === o.id ? " active" : ""}`}
            onClick={() => onChange(o.id)}
            aria-pressed={theme === o.id}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="pill-theme-selector" role="group" aria-label="Choose design">
      {options.map((o) => (
        <button
          key={o.id}
          className={`pill-theme-btn${theme === o.id ? " active" : ""}`}
          onClick={() => onChange(o.id)}
          aria-pressed={theme === o.id}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
