"use client";

import { IconBackspace } from "./icons";

type NumpadProps = {
  onPress: (key: string) => void;
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "⌫"] as const;

export function Numpad({ onPress }: NumpadProps) {
  return (
    <div className="a-keypad" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
      {KEYS.map((k) => (
        <button
          key={k}
          className={k === "⌫" ? "muted" : ""}
          onClick={() => onPress(k)}
          type="button"
          style={{
            appearance: "none",
            border: 0,
            cursor: "pointer",
            background: k === "⌫" ? "transparent" : "var(--a-cream-2)",
            borderRadius: 16,
            padding: "14px 0",
            fontSize: k === "⌫" ? 20 : 26,
            fontWeight: 500,
            color: "var(--a-ink)",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background .12s ease, transform .08s ease",
          }}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)";
          }}
          onPointerUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "";
          }}
          onPointerLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "";
          }}
        >
          {k === "⌫" ? <IconBackspace size={22} /> : k}
        </button>
      ))}
    </div>
  );
}

export function applyNumpadKey(prev: string, key: string): string {
  if (key === "⌫") return prev.slice(0, -1);
  const next = (prev + key).replace(/^0+/, "");
  return next.slice(0, 7);
}
