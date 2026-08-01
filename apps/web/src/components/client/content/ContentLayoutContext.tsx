"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type BreadcrumbItem = {
  readonly label: string;
  readonly href?: string;
};

type ContentLayoutContextValue = {
  readonly breadcrumbs: readonly BreadcrumbItem[];
  readonly setBreadcrumbs: (items: readonly BreadcrumbItem[]) => void;
  readonly isSidebarOpen: boolean;
  readonly setIsSidebarOpen: (open: boolean) => void;
  readonly isTocOpen: boolean;
  readonly setIsTocOpen: (open: boolean) => void;
};

const ContentLayoutContext = createContext<ContentLayoutContextValue | null>(null);

export function ContentLayoutProvider({ children }: { readonly children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<readonly BreadcrumbItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);

  return (
    <ContentLayoutContext.Provider
      value={{
        breadcrumbs,
        setBreadcrumbs,
        isSidebarOpen,
        setIsSidebarOpen,
        isTocOpen,
        setIsTocOpen,
      }}
    >
      {children}
    </ContentLayoutContext.Provider>
  );
}

export function useContentLayout() {
  const ctx = useContext(ContentLayoutContext);
  if (!ctx) throw new Error("useContentLayout must be used within ContentLayoutProvider");
  return ctx;
}
