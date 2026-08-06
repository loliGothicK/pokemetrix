const fs = require('fs');
const content = fs.readFileSync('apps/web/.content-collections/generated/allQuizzes.js', 'utf-8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Invalid') || lines[i].includes('\\"p\\') || lines[i].includes('p:')) {
    const idx = lines[i].indexOf('p:\\"p\\');
    if (idx !== -1) {
      console.log(`Line ${i + 1}: found at column ${idx}`);
      console.log(lines[i].substring(Math.max(0, idx - 40), idx + 40));
    }
  }
}
