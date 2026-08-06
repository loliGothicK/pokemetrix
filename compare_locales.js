const fs = require('fs');
const path = require('path');

const quizDir = path.join(__dirname, 'apps/web/content/quiz');
const jaDir = path.join(quizDir, 'ja');
const enDir = path.join(quizDir, 'en');

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      getFiles(path.join(dir, file), fileList);
    } else if (file.endsWith('.mdx')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const jaFiles = getFiles(jaDir).map(f => path.relative(jaDir, f).replace(/\\/g, '/'));
const enFiles = getFiles(enDir).map(f => path.relative(enDir, f).replace(/\\/g, '/'));

const missingInEn = jaFiles.filter(f => !enFiles.includes(f));
const missingInJa = enFiles.filter(f => !jaFiles.includes(f));

console.log(`Missing in EN: ${missingInEn.length}`);
if (missingInEn.length > 0) {
  console.log(missingInEn.slice(0, 10).join('\n') + (missingInEn.length > 10 ? '\n...' : ''));
}

console.log(`\nMissing in JA: ${missingInJa.length}`);
if (missingInJa.length > 0) {
  console.log(missingInJa.slice(0, 10).join('\n') + (missingInJa.length > 10 ? '\n...' : ''));
}
