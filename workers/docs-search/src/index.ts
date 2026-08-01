import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
  SEARCH_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post("/search", async (c) => {
  // Simple authentication using shared secret
  const secret = c.req.header("X-Secret");
  if (!secret || secret !== c.env.SEARCH_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { q, locale } = await c.req.json<{ q?: string; locale?: string }>();

    if (!q || q.length < 3) {
      return c.json({ results: [] });
    }
    
    if (!locale || (locale !== "en" && locale !== "ja")) {
      return c.json({ error: "Invalid locale" }, 400);
    }

    const query = `
      SELECT slug, locale, title, description,
             snippet(docs_fts, 4, '<mark>', '</mark>', '...', 20) AS snippet
      FROM   docs_fts
      WHERE  docs_fts MATCH ?1
        AND  locale = ?2
      ORDER BY rank
      LIMIT 10;
    `;

    // Wrap the term with double quotes to ensure fts5 phrase queries work smoothly if it contains special chars
    const matchStr = `"${q.replace(/"/g, '""')}"`;

    const { results } = await c.env.DB.prepare(query).bind(matchStr, locale).all();

    return c.json({ results });
  } catch (error: any) {
    console.error("Search error:", error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
