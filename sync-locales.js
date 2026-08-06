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
let copied = 0;

for (const file of missingInEn) {
  const src = path.join(jaDir, file);
  const dest = path.join(enDir, file);
  const destDir = path.dirname(dest);
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  fs.copyFileSync(src, dest);
  copied++;
}

console.log(`Successfully copied ${copied} missing files from ja to en.`);
