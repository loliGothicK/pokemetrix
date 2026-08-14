import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const changelogPath = path.resolve(__dirname, "../CHANGELOG.md");
const blogDir = path.resolve(__dirname, "../content/blog");

async function main() {
  const content = await fs.readFile(changelogPath, "utf8");

  const lines = content.split("\n");
  let inLatestRelease = false;
  let releaseHeading = "";
  const releaseNotes: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (!inLatestRelease) {
        inLatestRelease = true;
        releaseHeading = line;
      } else {
        break;
      }
    } else if (inLatestRelease) {
      releaseNotes.push(line);
    }
  }

  if (!releaseHeading) {
    console.log("No release found in CHANGELOG.md");
    return;
  }

  const versionMatch = releaseHeading.match(/\[?v?(\d+\.\d+\.\d+)\]?/);
  const version = versionMatch ? versionMatch[1] : "unknown";

  const dateMatch = releaseHeading.match(/\((\d{4}-\d{2}-\d{2})\)/);
  const dateStr = dateMatch ? dateMatch[1] : new Date().toISOString().split("T")[0];

  const mdxContent = `---
title: Release v${version}
description: Release notes for version ${version}
date: ${dateStr}
tags: ["release"]
draft: false
---

${releaseNotes.join("\n").trim()}
`;

  const fileName = `${dateStr}-v${version}.mdx`;
  const filePath = path.join(blogDir, fileName);

  await fs.mkdir(blogDir, { recursive: true });
  await fs.writeFile(filePath, mdxContent, "utf8");
  console.log(`Generated blog post at ${filePath}`);
}

main().catch(console.error);
