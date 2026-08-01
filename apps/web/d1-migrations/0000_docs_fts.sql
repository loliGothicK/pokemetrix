-- d1-migrations/0000_docs_fts.sql
CREATE VIRTUAL TABLE IF NOT EXISTS docs_fts USING fts5(
  slug        UNINDEXED,
  locale      UNINDEXED,
  title,
  description,
  content,
  tokenize = 'trigram'
);
