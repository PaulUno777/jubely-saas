"use client";

import * as React from "react";
import { cn } from "../../cn";

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function OtpInput({ length = 6, value, onChange, className }: OtpInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const handleChange = (index: number, char: string) => {
    const sanitized = char.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, i) => (i === index ? sanitized : d)).join("").slice(0, length);
    onChange(next);
    if (sanitized && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className={cn("flex gap-2", className)}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cn(
            "h-14 w-12 rounded-xl border border-border bg-muted text-center text-xl font-semibold text-foreground outline-none transition-all",
            "focus:border-primary focus:ring-2 focus:ring-primary/30",
            digit && "border-primary/50",
          )}
        />
      ))}
    </div>
  );
}
