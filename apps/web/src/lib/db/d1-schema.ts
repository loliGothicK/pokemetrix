import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const docsFts = sqliteTable("docs_fts", {
  slug: text("slug").notNull(),
  locale: text("locale").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
});
