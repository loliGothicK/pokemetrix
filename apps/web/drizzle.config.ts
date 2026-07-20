import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// 開発環境（NODE_ENVが未指定、または'development'）の場合にのみdevフラグをtrueにする
const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
loadEnvConfig(process.cwd(), isDev);

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
