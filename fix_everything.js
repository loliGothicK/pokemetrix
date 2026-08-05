const fs = require('fs');
const path = require('path');

// 1. Delete corrupted cache
const cacheDir = path.join(__dirname, 'apps', 'web', '.content-collections');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('Cleared corrupted cache');
}

// 2. Restore subagent modifications from logs
const baseLogDir = 'C:\\Users\\lolig\\.gemini\\antigravity\\brain';
const convIds = [
  '5997eba1-f7aa-4724-a327-8310ef68741b',
  '88556eb1-ab8b-4431-a0d6-b0ef4642b775',
  'bf530a4c-d37e-4b90-936c-f8f1caa284dc',
  'a729cf70-7b47-4a94-b698-3d8510d4689f',
  '69f869f0-743d-4c22-bf39-56e241bd765b'
];

let appliedCount = 0;

function normalize(str) {
  if (str.startsWith('"') && str.endsWith('"')) {
    // Unescape JSON string
    try {
      str = JSON.parse(str);
    } catch(e) {}
  }
  return str.replace(/\r\n/g, '\n');
}

convIds.forEach(id => {
  const logPath = path.join(baseLogDir, id, '.system_generated', 'logs', 'transcript_full.jsonl');
  if (fs.existsSync(logPath)) {
    const lines = fs.readFileSync(logPath, 'utf8').split('\n');
    lines.forEach(line => {
      if (!line.trim()) return;
      try {
        const step = JSON.parse(line);
        if (step.tool_calls && step.tool_calls.length > 0) {
          step.tool_calls.forEach(tc => {
            if (tc.name === 'default_api:replace_file_content' || tc.name === 'default_api:multi_replace_file_content') {
              const args = tc.args;
              let targetFile = args.TargetFile;
              if (targetFile.startsWith('"') && targetFile.endsWith('"')) {
                targetFile = JSON.parse(targetFile);
              }
              if (fs.existsSync(targetFile)) {
                let content = fs.readFileSync(targetFile, 'utf8');
                let normContent = content.replace(/\r\n/g, '\n');
                let changed = false;
                
                if (tc.name === 'default_api:replace_file_content') {
                  const targetContent = normalize(args.TargetContent);
                  if (normContent.includes(targetContent)) {
                    normContent = normContent.replace(targetContent, normalize(args.ReplacementContent));
                    changed = true;
                  }
                } else if (tc.name === 'default_api:multi_replace_file_content') {
                  args.ReplacementChunks.forEach(chunk => {
                    // Sometimes chunk is stringified, sometimes it's object
                    let tgt = typeof chunk === 'string' ? JSON.parse(chunk).TargetContent : chunk.TargetContent;
                    let rep = typeof chunk === 'string' ? JSON.parse(chunk).ReplacementContent : chunk.ReplacementContent;
                    const targetContent = normalize(tgt);
                    if (normContent.includes(targetContent)) {
                      normContent = normContent.replace(targetContent, normalize(rep));
                      changed = true;
                    }
                  });
                }
                
                if (changed) {
                  fs.writeFileSync(targetFile, normContent, 'utf8');
                  appliedCount++;
                }
              }
            }
          });
        }
      } catch (e) {
        // ignore
      }
    });
  }
});
console.log('Restored modifications from logs: ' + appliedCount);

// 3. Restore generic decoy moves (since this was the state right before the checkout)
function getAllFiles(dirPath, arrayOfFiles) {
  let fileNames = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  fileNames.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.mdx')) {
        arrayOfFiles.push(path.join(__dirname, dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles('apps/web/content/quiz');
let changedCount = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  
  content = content.replace(/"moves":\s*\["([^"]+)"\]/g, (match, move1) => {
    changed = true;
    let decoys = [];
    if (move1 === 'Protect') {
      decoys = ['Substitute', 'Helping Hand', 'Wide Guard'];
    } else if (move1 === 'Destiny Bond') {
      decoys = ['Shadow Ball', 'Sludge Bomb', 'Protect'];
    } else if (move1 === 'Fake Out') {
      decoys = ['Return', 'Sucker Punch', 'Protect'];
    } else if (move1 === "King's Shield") {
      decoys = ['Shadow Ball', 'Flash Cannon', 'Wide Guard'];
    } else {
      decoys = ['Protect', 'Substitute', 'Hidden Power'];
    }
    return '"moves": ["' + move1 + '", "' + decoys[0] + '", "' + decoys[1] + '"]';
  });

  if (changed) {
    fs.writeFileSync(f, content);
    changedCount++;
  }
});
console.log('Restored generic dummy moves: ' + changedCount);
