"use client";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let deferred: BeforeInstallPromptEvent | null = null;

export function captureInstallPrompt() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
  });
}

export async function promptInstall() {
  if (!deferred) return { available: false as const };
  await deferred.prompt();
  const choice = await deferred.userChoice;
  deferred = null;
  return { available: true as const, choice };
}

export function isInstallAvailable() {
  return Boolean(deferred);
}

