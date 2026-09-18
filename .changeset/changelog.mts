import githubChangelog from "@changesets/changelog-github";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stagingPath = path.resolve(__dirname, ".changelog-ja-staging.json");

export type ModdedChangeset = {
  id: string;
  summary: string;
  commit?: string;
  releases: Array<{ name: string; type: "major" | "minor" | "patch" | "none" }>;
};

export type ChangelogFunctions = {
  getReleaseLine: (
    changeset: ModdedChangeset,
    type: "major" | "minor" | "patch",
    options: Record<string, unknown> | null,
  ) => Promise<string>;
  getDependencyReleaseLine: (
    changesets: ModdedChangeset[],
    dependenciesUpdated: unknown[],
    options: Record<string, unknown> | null,
  ) => Promise<string>;
};

import { splitSummary } from "../apps/web/scripts/generate-blog.ts";

async function recordJaEntry(entry: { type: string; line: string }): Promise<void> {
  let entries: Array<{ type: string; line: string }> = [];
  try {
    const raw = await fs.readFile(stagingPath, "utf8");
    entries = JSON.parse(raw);
  } catch {
    entries = [];
  }
  entries.push(entry);
  await fs.writeFile(stagingPath, JSON.stringify(entries, null, 2), "utf8");
}

const changelog: ChangelogFunctions = {
  async getReleaseLine(changeset, type, options) {
    const { en, ja } = splitSummary(changeset.summary);

    const enLine = await githubChangelog.getReleaseLine(
      { ...changeset, summary: en },
      type,
      options,
    );

    const jaLine = await githubChangelog.getReleaseLine(
      { ...changeset, summary: ja },
      type,
      options,
    );

    await recordJaEntry({ type, line: jaLine.trim() });

    // Return ONLY the English release line to Changesets
    return enLine;
  },

  async getDependencyReleaseLine(changesets, dependenciesUpdated, options) {
    return githubChangelog.getDependencyReleaseLine(
      changesets as any,
      dependenciesUpdated as any,
      options,
    );
  },
};

export default changelog;
