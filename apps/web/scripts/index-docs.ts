import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allDocs, allPosts } from "content-collections";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables if .env files exist (e.g. for local runs)
const envPaths = [
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../.env.local"),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    try {
      process.loadEnvFile(envPath);
    } catch {
      // ignore
    }
  }
}

async function executeD1Query(
  accountId: string,
  dbId: string,
  token: string,
  sql: string,
  params: unknown[] = [],
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

  const items = [...allDocs, ...allPosts];
  console.log(`Starting to index ${items.length} documents to D1...`);

  // Transform Markdown to plain text safely using marked
  const cleanContent = async (content: string) => {
    // 1. Remove frontmatter
    const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n/g, "");

    // 2. Parse Markdown into HTML using marked (this handles tables, lists, links, etc.)
    const html = await marked.parse(withoutFrontmatter);

    // 3. Strip all HTML tags and normalise whitespace
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
    const batchSize = 10;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const placeholders = batch.map(() => "(?, ?, ?, ?, ?)").join(", ");

      const params: unknown[] = [];
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
