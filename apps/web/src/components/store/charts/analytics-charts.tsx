"use client";

import { Fragment, useMemo } from "react";

type SimpleBarChartProps = {
  labels: string[];
  values: number[];
  color?: string;
  height?: number;
};

export function SimpleBarChart({
  labels,
  values,
  color = "#1FA971",
  height = 180,
}: SimpleBarChartProps) {
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {values.map((value, index) => (
        <div key={labels[index] ?? index} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md transition-all"
            style={{
              height: `${Math.max(4, (value / max) * (height - 28))}px`,
              background: color,
            }}
          />
          <span className="truncate text-[10px] text-muted-foreground">{labels[index]}</span>
        </div>
      ))}
    </div>
  );
}

type DonutChartProps = {
  slices: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerSub?: string;
  size?: number;
};

export function DonutChart({ slices, centerLabel, centerSub, size = 160 }: DonutChartProps) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = useMemo(() => {
    const lengths = slices.map((slice) => (slice.value / total) * circumference);
    const prefixLengths = lengths.map((_, index) =>
      lengths.slice(0, index).reduce((sum, length) => sum + length, 0),
    );
    return slices.map((slice, index) => ({
      slice,
      length: lengths[index]!,
      dashoffset: -prefixLengths[index]!,
    }));
  }, [slices, total, circumference]);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={22}
        />
        {segments.map(({ slice, length, dashoffset }) => {
          const dasharray = `${length} ${circumference - length}`;
          return (
            <circle
              key={slice.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={22}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-2xl font-medium italic">{centerLabel}</span>
        {centerSub ? (
          <span className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            {centerSub}
          </span>
        ) : null}
      </div>
    </div>
  );
}

type HeatmapGridProps = {
  cells: { day: number; hour: number; value: number }[];
};

export function HeatmapGrid({ cells }: HeatmapGridProps) {
  const max = Math.max(...cells.map((c) => c.value), 1);
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const days = Array.from({ length: 7 }, (_, d) => d);

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[auto_repeat(24,minmax(0,1fr))] gap-0.5 text-[10px]">
        <div />
        {hours.map((hour) => (
          <div key={`h-${hour}`} className="text-center text-muted-foreground">
            {hour}
          </div>
        ))}
        {days.map((day) => (
          <Fragment key={`row-${day}`}>
            <div className="pr-1 text-muted-foreground">D{day + 1}</div>
            {hours.map((hour) => {
              const cell = cells.find((c) => c.day === day && c.hour === hour);
              const value = cell?.value ?? 0;
              const alpha = 0.08 + (value / max) * 0.92;
              return (
                <div
                  key={`${day}-${hour}`}
                  className="aspect-square rounded-sm"
                  style={{ background: `rgba(31, 169, 113, ${alpha})` }}
                  title={String(value)}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
