import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { solveTsume, solveProbabilisticTsumeDeep } from "@/utils/tsumeMinimax";

const scriptArgs = process.argv.slice(2);

if (scriptArgs.length === 0) {
  console.error("Usage: pnpx tsx scripts/generate-tsume-responses.ts <path-to-mdx-file-or-glob>");
  process.exit(1);
}

function processFile(filePath: string) {
  console.log(`\nProcessing ${filePath}...`);
  if (!filePath.endsWith(".mdx")) {
    console.warn(`[WARN] Skipping ${filePath} (not an MDX file).`);
    return;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = matter(content);

  if (parsed.data.format !== "tsume_action" && parsed.data.format !== "choices") {
    console.warn(`[WARN] Skipping ${filePath} (format is neither 'tsume_action' nor 'choices').`);
    return;
  }

  if (!parsed.data.tsumeData) {
    if (parsed.data.format === "tsume_action") {
      console.error(`[ERROR] ${filePath} has format 'tsume_action' but missing 'tsumeData'.`);
    }
    return;
  }

  const tsumeData = parsed.data.tsumeData as any;

  if (tsumeData.rngControl?.mode === "probabilistic") {
    console.time(`Probabilistic Solver (${filePath})`);

    // Calculate required depth based on player's correctMoves length.
    const depth = tsumeData.correctMoves ? tsumeData.correctMoves.length : 3;

    const { responses } = solveProbabilisticTsumeDeep(
      tsumeData,
      depth,
      tsumeData.rngControl.iterations || 20,
    );
    console.timeEnd(`Probabilistic Solver (${filePath})`);

    // Optionally we can still inject the responses tree into MDX if it's a tsume_action!
    if (parsed.data.format === "tsume_action" && Object.keys(responses).length > 0) {
      console.log(`Generated ${Object.keys(responses).length} optimal responses.`);

      let newContent = content;
      const yamlResponseLines = [`  opponentResponses:`].concat(
        Object.entries(responses).map(([k, v]) => `    "${k}": "${String(v)}"`),
      );
      const yamlResponse = yamlResponseLines.join("\n");

      const hasOpponentResponses = /^\s*opponentResponses:/m.test(content);

      if (hasOpponentResponses) {
        const regex = /^\s*opponentResponses:(\s*{}|\n(\s*".*?": ".*?"\n)*)/m;
        newContent = newContent.replace(regex, yamlResponse + "\n");
      } else {
        const regex = /correctMoves:(\s*\[\]|\n(\s*- ".*?"\n)*)/m;
        newContent = newContent.replace(regex, `$&${yamlResponse}\n`);
      }

      fs.writeFileSync(filePath, newContent);
      console.log(`[SUCCESS] Saved responses to ${filePath}.`);
    }

    return;
  }

  // Calculate required depth based on player's correctMoves length.
  // We assume the puzzle ends after the correct moves sequence.
  const depth = tsumeData.correctMoves ? tsumeData.correctMoves.length : 3;

  console.time(`Solver (${filePath})`);
  const result = solveTsume(tsumeData, depth);
  console.timeEnd(`Solver (${filePath})`);

  console.log(`Generated ${Object.keys(result).length} optimal responses.`);

  // Manually inject the YAML to preserve formatting
  // Look for the end of `tsumeData:` block (or right after correctMoves)
  let newContent = content;

  // If opponentResponses already exists, replace it, else append it
  const yamlResponseLines = [`  opponentResponses:`].concat(
    Object.entries(result).map(([k, v]) => `    "${k}": "${v}"`),
  );
  const yamlResponse = yamlResponseLines.join("\n");

  const hasOpponentResponses = /^\s*opponentResponses:/m.test(content);

  if (hasOpponentResponses) {
    // Replace existing block
    // We match `  opponentResponses:\n` followed by lines starting with `    "` or `{}`
    const regex = /^\s*opponentResponses:(\s*{}|\n(\s*".*?": ".*?"\n)*)/m;
    newContent = newContent.replace(regex, "\n" + yamlResponse + "\n");
  } else {
    // Inject right before the closing `---`
    // Since matter preserves the raw content, we can just find the second `---` and insert it right before it,
    // or better, inject it at the end of tsumeData.
    // We'll just replace the last `---` with the block + `---`
    // However, gray-matter has a `stringify` method, but it might reformat things (like empty arrays `[]`).
    // Let's use gray-matter stringify, it's safer than regex for generic files!

    parsed.data.tsumeData.opponentResponses = result;
    newContent = matter.stringify(parsed.content, parsed.data);
  }

  fs.writeFileSync(filePath, newContent);
  console.log(`[SUCCESS] Saved responses to ${filePath}.`);
}

scriptArgs.forEach((arg) => {
  const fullPath = path.resolve(arg);
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      // Find all MDX files in dir
      const files = fs.readdirSync(fullPath).filter((f) => f.endsWith(".mdx"));
      files.forEach((f) => processFile(path.join(fullPath, f)));
    } else {
      processFile(fullPath);
    }
  } else {
    console.error(`[ERROR] Path not found: ${fullPath}`);
  }
});
