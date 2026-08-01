import * as Sentry from "@sentry/nextjs";
import { withSpan } from "@/lib/otel";

export type DocsSearchResult = {
  slug: string;
  locale: string;
  title: string;
  description: string;
  snippet: string;
};

export const searchDocs = async (query: string, locale: string): Promise<DocsSearchResult[]> => {
  return withSpan("ui.docs.search", async (span) => {
    span.setAttribute("query", query);
    span.setAttribute("locale", locale);

    try {
      const params = new URLSearchParams({ q: query, locale });
      const res = await fetch(`/api/docs/search?${params.toString()}`);

      if (!res.ok) {
        const errorText = await res.text();
        span.setAttribute("error", true);
        Sentry.captureException(new Error(`Docs search failed: ${res.status}`), {
          extra: { status: res.status, errorText, query, locale },
        });
        return [];
      }

      const data = await res.json();
      return data.results || [];
    } catch (error) {
      span.setAttribute("error", true);
      Sentry.captureException(error, { extra: { query, locale } });
      return [];
    }
  });
};
