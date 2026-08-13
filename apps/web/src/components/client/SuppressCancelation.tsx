"use client";

import { useEffect } from "react";

export function SuppressCancelation() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      if (
        event.reason &&
        (event.reason.name === "Canceled" || event.reason.type === "cancelation")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener("unhandledrejection", handler);
    return () => {
      window.removeEventListener("unhandledrejection", handler);
    };
  }, []);

  return null;
}
