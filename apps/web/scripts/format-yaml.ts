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
      if (file.endsWith(".mdx")) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(quizDir);
let modifiedCount = 0;

files.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  const parsed = matter(content);

  if (parsed.data && (parsed.data.practicalData || parsed.data.speedCompareData)) {
    // If it has JSON-like formatting (curly braces as a string or raw object),
    // stringify will rewrite it as YAML because it's a parsed JS object now.
    // However, we just need to stringify it. gray-matter uses js-yaml under the hood.
    const newContent = matter.stringify(parsed.content, parsed.data);

    // Only write if it actually changed to avoid touching files that don't need it
    if (newContent !== content) {
      fs.writeFileSync(file, newContent, "utf8");
      modifiedCount++;
    }
  }
});

console.log(`Formatted YAML for ${modifiedCount} files.`);
