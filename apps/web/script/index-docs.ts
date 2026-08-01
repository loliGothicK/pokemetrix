import { allDocs } from "../.content-collections/generated/index.js";
import { marked } from "marked";

async function executeD1Query(
  accountId: string,
  dbId: string,
  token: string,
  sql: string,
  params: any[] = [],
) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  if (!res.ok) {
    throw new Error(`D1 query failed: ${await res.text()}`);
  }
  return await res.json();
}

async function main() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
  const token = process.env.CLOUDFLARE_D1_TOKEN;

  if (!accountId || !databaseId || !token) {
    console.error("Missing Cloudflare D1 credentials in environment variables.");
    process.exit(1);
  }

  console.log(`Starting to index ${allDocs.length} documents to D1...`);

  // Transform markdown to plain text safely using marked
  const cleanContent = async (content: string) => {
    // 1. Remove frontmatter
    const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n/g, "");

    // 2. Parse markdown into HTML using marked (this handles tables, lists, links, etc.)
    const html = await marked.parse(withoutFrontmatter);

    // 3. Strip all HTML tags and normalize whitespace
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  try {
    console.log("Deleting existing index...");
    await executeD1Query(accountId, databaseId, token, "DELETE FROM docs_fts");

    console.log("Inserting new index...");
    // FTS5 bulk insert
    for (let i = 0; i < allDocs.length; i += 10) {
      const batch = allDocs.slice(i, i + 10);
      const placeholders = batch.map(() => "(?, ?, ?, ?, ?)").join(", ");

      const params = [];
      for (const doc of batch) {
        const plainText = await cleanContent(doc.content);
        params.push(doc.slug, doc.locale, doc.title, doc.description || "", plainText);
      }

      const sql = `INSERT INTO docs_fts (slug, locale, title, description, content) VALUES ${placeholders}`;
      await executeD1Query(accountId, databaseId, token, sql, params);
    }

    console.log("Successfully indexed documents to D1.");
  } catch (error) {
    console.error("Failed to index documents:", error);
    process.exit(1);
  }
}

void main();
