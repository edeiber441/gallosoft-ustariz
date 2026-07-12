"use client";

import { useEffect } from "react";

export default function SessionGuard() {
  useEffect(() => {
    let enviado = false;

    function logoutBeacon() {
      if (enviado) return;
      enviado = true;
      try {
        const payload = new Blob(["{}"], { type: "application/json" });
        navigator.sendBeacon?.("/api/auth/logout", payload);
      } catch {
        // si sendBeacon no está disponible, la cookie de sesión y el
        // botón Salir igualmente limitan la persistencia.
      }
    }

    function onPageHide(e: PageTransitionEvent) {
      if (e.persisted) return;
      logoutBeacon();
    }

    function onBeforeUnload() {
      logoutBeacon();
    }

    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  return null;
}
