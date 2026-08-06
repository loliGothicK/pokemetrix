const fs = require('fs');
const lines = fs.readFileSync('apps/web/.content-collections/generated/allQuizzes.js', 'utf-8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('"mdx":')) {
    const jsonStr = lines[i].replace(/^\\s*"mdx":\\s*/, '').replace(/,$/, '');
    try {
      JSON.parse('{' + lines[i] + (lines[i].endsWith(',') ? '""}' : '}'));
    } catch (e) {
      console.log(`JSON parse error on line ${i + 1}`);
    }
  }
}
