"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type CameraState = "idle" | "loading" | "scanning" | "denied" | "unsupported";

type QrCameraProps = {
  onDetect: (raw: string) => void;
};

function isMobileDevice(): boolean {
  return (
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    navigator.maxTouchPoints > 1
  );
}

function isBarcodeDetectorSupported(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

export function useIsMobile() {
  const [mobile] = useState(() => (typeof navigator === "undefined" ? false : isMobileDevice()));
  return mobile;
}

export function QrCamera({ onDetect }: QrCameraProps) {
  const t = useTranslations("agent.scanner");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const onDetectRef = useRef(onDetect);
  const scheduleScanRef = useRef<() => void>(() => {});
  const [state, setState] = useState<CameraState>(() =>
    isBarcodeDetectorSupported() ? "idle" : "unsupported",
  );

  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const scheduleScan = useCallback(() => {
    rafRef.current = requestAnimationFrame(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        scheduleScanRef.current();
        return;
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        const results = await detector.detect(videoRef.current);
        if (results.length > 0) {
          stopCamera();
          onDetectRef.current(results[0].rawValue as string);
          return;
        }
      } catch {
        // continue scanning
      }
      scheduleScanRef.current();
    });
  }, [stopCamera]);

  useEffect(() => {
    scheduleScanRef.current = scheduleScan;
  }, [scheduleScan]);

  const startCamera = useCallback(async () => {
    setState("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("scanning");
      scheduleScanRef.current();
    } catch {
      setState("denied");
    }
  }, []);

  useEffect(() => {
    if (!isBarcodeDetectorSupported()) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      void startCamera();
    });
    return () => {
      cancelAnimationFrame(frame);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  if (state === "unsupported") {
    return <CameraMessage title={t("notSupported")} body={t("notSupportedHint")} />;
  }
  if (state === "denied") {
    return <CameraMessage title={t("cameraDenied")} body={t("cameraDeniedHint")} />;
  }

  return (
    <div style={{ position: "relative", width: 240, height: 240, margin: "0 auto" }}>
      <video
        ref={videoRef}
        muted
        playsInline
        style={{
          width: "100%", height: "100%",
          objectFit: "cover", borderRadius: 16,
          opacity: state === "scanning" ? 1 : 0,
          transition: "opacity .3s",
        }}
      />
      <ViewfinderCorners />
      {state === "scanning" && <div className="a-vf-line" />}
    </div>
  );
}

function ViewfinderCorners() {
  const corners = [
    { top: 0, left: 0,   borderRight: 0, borderBottom: 0, borderRadius: "8px 0 0 0" },
    { top: 0, right: 0,  borderLeft: 0,  borderBottom: 0, borderRadius: "0 8px 0 0" },
    { bottom: 0, left: 0,  borderRight: 0, borderTop: 0, borderRadius: "0 0 0 8px" },
    { bottom: 0, right: 0, borderLeft: 0,  borderTop: 0, borderRadius: "0 0 8px 0" },
  ];
  return (
    <>
      {corners.map((style, i) => (
        <span
          key={i}
          className="a-vf-corner"
          style={{ position: "absolute", width: 40, height: 40, border: "3px solid var(--a-gold-2)", ...style }}
        />
      ))}
    </>
  );
}

function CameraMessage({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        width: 240, height: 240, margin: "0 auto",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 10, textAlign: "center",
        background: "rgba(255,255,255,0.05)", borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        padding: 20,
      }}
    >
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--a-gold-2)", margin: 0 }}>{title}</p>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}
