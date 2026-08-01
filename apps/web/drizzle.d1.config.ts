import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
loadEnvConfig(process.cwd(), isDev);

export default defineConfig({
  schema: "./src/lib/db/d1-schema.ts",
  out: "./d1-migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
});
