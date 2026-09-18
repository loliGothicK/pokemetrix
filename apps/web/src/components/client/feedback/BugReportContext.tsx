"use client";

import { createContext, useContext, useState, useMemo, type ReactNode } from "react";

export type BugReportContextValue = {
  readonly isBugReportOpen: boolean;
  readonly openBugReport: () => void;
  readonly closeBugReport: () => void;
};

const BugReportContext = createContext<BugReportContextValue>({
  isBugReportOpen: false,
  openBugReport: () => {},
  closeBugReport: () => {},
});

export function BugReportProvider({ children }: { readonly children: ReactNode }) {
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);

  const value = useMemo(
    () => ({
      isBugReportOpen,
      openBugReport: () => setIsBugReportOpen(true),
      closeBugReport: () => setIsBugReportOpen(false),
    }),
    [isBugReportOpen],
  );

  return <BugReportContext.Provider value={value}>{children}</BugReportContext.Provider>;
}

export function useBugReport(): BugReportContextValue {
  return useContext(BugReportContext);
}
