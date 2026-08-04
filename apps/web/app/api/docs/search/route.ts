import { NextRequest, NextResponse } from "next/server";
import { withSpan } from "@/lib/otel";

export async function GET(req: NextRequest) {
  return withSpan("api.docs.search", async (span) => {
    try {
      const searchParams = req.nextUrl.searchParams;
      const q = searchParams.get("q");
      const locale = searchParams.get("locale");

      if (!q || !locale) {
        return NextResponse.json({ results: [] });
      }

      const workerUrl = process.env.D1_WORKER_URL;
      const secret = process.env.D1_WORKER_SECRET;

      if (!workerUrl || !secret) {
        // Fallback or error if worker is not configured
        console.error("D1 Worker is not configured. Missing D1_WORKER_URL or D1_WORKER_SECRET.");
        span.setAttribute("error", true);
        return NextResponse.json({ results: [] });
      }

      const res = await fetch(`${workerUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Secret": secret,
        },
        body: JSON.stringify({ q, locale }),
      });

      if (!res.ok) {
        throw new Error(`Worker returned ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      return NextResponse.json(data);
    } catch (error: any) {
      // Re-throw Next.js prerender interruption signals so the route handler
      // correctly bails out of prerendering instead of returning empty results.
      if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") {
        throw error;
      }
      span.setAttribute("error", true);
      return NextResponse.json({ results: [] });
    }
  });
}
