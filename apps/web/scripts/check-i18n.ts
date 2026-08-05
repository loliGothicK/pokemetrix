import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively find all files with .ts or .tsx extensions
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// Helper to resolve dot-notation keys in an object
function hasKey(obj: any, keyPath: string): boolean {
  const keys = keyPath.split(".");
  let current = obj;
  for (const k of keys) {
    if (typeof current !== "object" || current === null || !(k in current)) {
      return false;
    }
    current = current[k];
  }
  return true;
}

function main() {
  const basePath = path.resolve(__dirname, "../../..");
  const srcPath = path.join(basePath, "apps/web/src");
  const enPath = path.join(basePath, "apps/web/public/locales/en/translation.json");
  const jaPath = path.join(basePath, "apps/web/public/locales/ja/translation.json");

  if (!fs.existsSync(srcPath)) {
    console.error("Source directory not found:", srcPath);
    process.exit(1);
  }

  const enJson = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const jaJson = JSON.parse(fs.readFileSync(jaPath, "utf8"));

  const files = getAllFiles(srcPath);

  // Regex to match t("some.key") or t('some.key') or t(`some.key${var}`)
  const regex = /\bt\(\s*(['"`])(.*?)\1/g;

  const missingKeys = new Set<string>();
  const allKeys = new Set<string>();

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    let match;
    while ((match = regex.exec(content)) !== null) {
      const key = match[2];

      if (!key || key.trim() === "" || key.includes(" ") || key.includes("\\n")) continue;

      let checkKey = key;
      if (key.includes("${")) {
        checkKey = key.split("${")[0];
        if (checkKey.endsWith(".")) {
          checkKey = checkKey.slice(0, -1);
        }
      }

      allKeys.add(checkKey);

      const hasEn = hasKey(enJson, checkKey);
      const hasJa = hasKey(jaJson, checkKey);

      if (!hasEn || !hasJa) {
        missingKeys.add(checkKey);
      }
    }
  }

  if (missingKeys.size > 0) {
    console.error(`\x1b[31mFound ${missingKeys.size} missing i18n keys:\x1b[0m`);
    missingKeys.forEach((key) => {
      const hasEn = hasKey(enJson, key);
      const hasJa = hasKey(jaJson, key);
      console.error(`  - ${key} (en: ${hasEn ? "✓" : "x"}, ja: ${hasJa ? "✓" : "x"})`);
    });
    process.exit(1);
  } else {
    console.log(
      `\x1b[32mSuccess! All ${allKeys.size} translation keys found in codebase exist in both locales.\x1b[0m`,
    );
  }
}

main();
