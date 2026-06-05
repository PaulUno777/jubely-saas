type EventType = "award" | "redeem" | "signup";

type MoveRowProps = {
  type: EventType;
  label: string;
  meta: string;
  points: number;
};

const DOT: Record<EventType, string> = {
  award:  "var(--c-green)",
  redeem: "var(--c-gold)",
  signup: "#d97757",
};

const AMT: Record<EventType, string> = {
  award:  "var(--c-green)",
  redeem: "var(--c-gold-3)",
  signup: "var(--c-ink-mut)",
};

function formatPts(type: EventType, pts: number): string {
  if (type === "award")  return `+${pts} pts`;
  if (type === "redeem") return `−${pts} pts`;
  return "+50 pts";
}

export function MoveRow({ type, label, meta, points }: MoveRowProps) {
  return (
    <div className="c-move-row">
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: DOT[type], flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--c-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--c-ink-mut)", marginTop: 2 }}>{meta}</div>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: AMT[type], flexShrink: 0 }}>
        {formatPts(type, points)}
      </div>
    </div>
  );
}
