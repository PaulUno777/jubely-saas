type EventType = "award" | "redeem" | "signup";

type ActivityRowProps = {
  type: EventType;
  client: string;
  time: string;
  meta?: string;
  points: number;
  amount?: number;
  reward?: string;
};

const DOT_COLOR: Record<EventType, string> = {
  award:  "var(--a-green)",
  redeem: "var(--a-gold)",
  signup: "#d97757",
};

const AMT_COLOR: Record<EventType, string> = {
  award:  "var(--a-green)",
  redeem: "var(--a-gold-3)",
  signup: "var(--a-ink)",
};

function formatPts(type: EventType, points: number): string {
  if (type === "award")  return `+${points} pts`;
  if (type === "redeem") return `${points} pts`;
  return "+50 pts";
}

function getTitle(row: ActivityRowProps): string {
  if (row.type === "award")  return `${row.client} · ${row.amount?.toLocaleString("fr-FR") ?? ""} FCFA`;
  if (row.type === "redeem") return `${row.reward ?? ""} · ${row.client}`;
  return `${row.client} · nouveau client`;
}

export function ActivityRow(props: ActivityRowProps) {
  return (
    <div className="a-activity-row" style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "0.5px solid rgba(26,24,20,0.06)" }}>
      <span
        style={{
          width: 8, height: 8, borderRadius: "50%",
          marginTop: 6, flexShrink: 0,
          background: DOT_COLOR[props.type],
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--a-ink)" }}>
          {getTitle(props)}
        </div>
        <div style={{ fontSize: 12, color: "var(--a-ink-mut)", marginTop: 2 }}>
          {props.meta ? `${props.meta} · ` : ""}{props.time}
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: AMT_COLOR[props.type], flexShrink: 0 }}>
        {formatPts(props.type, props.points)}
      </div>
    </div>
  );
}
