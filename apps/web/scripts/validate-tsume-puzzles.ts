import fs from "fs";
import path from "path";
import matter from "gray-matter";

const quizDir = path.join(process.cwd(), "content", "quiz");

function walk(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith(".mdx") && file.includes("tsume")) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(quizDir);
let errors = 0;
let validated = 0;

files.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  const parsed = matter(content);

  if (parsed.data && parsed.data.format === "tsume_action") {
    validated++;
    const tsumeData = parsed.data.tsumeData;
    const fileId = path.basename(file);

    // Rule 2: Move exists in player's moves
    if (tsumeData.correctMoves) {
      tsumeData.correctMoves.forEach((moveStr: string) => {
        // e.g., "Sucker Punch (Target: Kangaskhan-Mega)" -> "Sucker Punch"
        const moveName = moveStr.split(" (Target:")[0];
        
        if (moveName === "Switch") {
          // Rule 4: Switch requires bench
          if (!tsumeData.playerSide.bench || tsumeData.playerSide.bench.length === 0) {
            console.error(`[ERROR] ${fileId}: 'Switch' is a correct move but no bench pokemon provided.`);
            errors++;
          }
        } else {
          // Check if moveName is in player's active pokemon moves
          let hasMove = false;
          tsumeData.playerSide.active.forEach((poke: any) => {
            if (poke.moves && poke.moves.includes(moveName)) {
              hasMove = true;
            }
          });
          if (!hasMove) {
            console.error(`[ERROR] ${fileId}: Correct move '${moveName}' not found in any player's active pokemon moves.`);
            errors++;
          }
        }
        
        if (moveName === "Destiny Bond") {
            if (!tsumeData.playerSide.bench || tsumeData.playerSide.bench.length === 0) {
                console.error(`[ERROR] ${fileId}: 'Destiny Bond' requires a bench pokemon to determine winner.`);
                errors++;
            }
        }
      });
    }

    // Rule 3: Check for stats.spe if puzzle relies on speed (heuristics based on move text)
    const questionText = parsed.data.question || "";
    const descriptionText = parsed.content || "";
    if (
      questionText.toLowerCase().includes("first") ||
      questionText.includes("先制") ||
      descriptionText.includes("速い方") ||
      descriptionText.toLowerCase().includes("speed") ||
      descriptionText.includes("素早さ")
    ) {
      let hasSpe = false;
      tsumeData.playerSide.active.forEach((poke: any) => {
        if (poke.stats && poke.stats.spe !== undefined) hasSpe = true;
      });
      if (!hasSpe) {
        console.error(`[ERROR] ${fileId}: Speed check heuristic matched but no 'stats.spe' found.`);
        errors++;
      }
    }
  }
});

console.log(`\nValidated ${validated} tsume files.`);
if (errors > 0) {
  console.error(`Found ${errors} errors.`);
  process.exit(1);
} else {
  console.log(`Success! No errors found.`);
}
