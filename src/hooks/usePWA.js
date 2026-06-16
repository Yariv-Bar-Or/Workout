"use client";

import { useState, useEffect } from "react";

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [swRegistered, setSwRegistered] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => setSwRegistered(true))
        .catch((err) => console.error("[usePWA] SW registration failed:", err));

      // When a new SW takes over an existing controlled page (skipWaiting +
      // clients.claim), reload so stale chunks served by the old SW are replaced.
      // Guard against first-install where controller goes null → new SW (no prior page).
      const hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (hadController) window.location.reload();
      });
    }

    // Detect standalone mode
    const standaloneMq = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(standaloneMq.matches);
    const onStandaloneChange = (e) => setIsInstalled(e.matches);
    standaloneMq.addEventListener("change", onStandaloneChange);

    // Capture install prompt
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // Track online/offline
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      standaloneMq.removeEventListener("change", onStandaloneChange);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstallable(false);
  }

  return { isInstallable, isInstalled, isOnline, swRegistered, promptInstall };
}
