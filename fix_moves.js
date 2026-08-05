const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.mdx')) results.push(file);
    }
  });
  return results;
}

const files = walk(path.join('apps', 'web', 'content', 'quiz'));
files.forEach(file => {
    if (!file.includes('tsume')) return;
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('format: tsume_action')) {
      // Find opponentSide
      const opponentSideRegex = /"opponentSide":\s*\[(.*?)\]/s;
      const match = content.match(opponentSideRegex);
      if (match) {
        let opponentStr = match[1];
        let changed = false;
        
        let newOpponentStr = opponentStr.replace(/{\s*"species":\s*"([^"]+)",([^}]+)}/g, (fullMatch, species, rest) => {
            if (!fullMatch.includes('"moves":')) {
                changed = true;
                return `{ "species": "${species}",${rest}, "moves": ["Protect", "Substitute", "Hidden Power"] }`;
            } else {
                let movesMatch = fullMatch.match(/"moves":\s*\[(.*?)\]/);
                if (movesMatch) {
                    let moves = movesMatch[1].split(',').map(s => s.trim().replace(/"/g, '')).filter(Boolean);
                    if (moves.length === 1 && species !== 'gengar') {
                        changed = true;
                        return fullMatch.replace(/"moves":\s*\[.*?\]/, `"moves": ["${moves[0]}", "Protect", "Substitute", "Hidden Power"]`);
                    } else if (moves.length === 2) {
                        changed = true;
                        return fullMatch.replace(/"moves":\s*\[.*?\]/, `"moves": ["${moves[0]}", "${moves[1]}", "Protect", "Substitute"]`);
                    }
                }
                return fullMatch;
            }
        });
        
        if (changed) {
            let newContent = content.replace(opponentStr, newOpponentStr);
            fs.writeFileSync(file, newContent, 'utf8');
            console.log('Fixed moves in', file);
        }
      }
    }
});
console.log('Done.');
