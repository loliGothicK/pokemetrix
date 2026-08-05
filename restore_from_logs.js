const fs = require('fs');
const path = require('path');

// Clean the cache that got corrupted during checkout
const cacheDir = path.join(__dirname, 'apps', 'web', '.content-collections');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('Cleared corrupted cache');
}

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
              const targetFile = args.TargetFile;
              if (fs.existsSync(targetFile)) {
                let content = fs.readFileSync(targetFile, 'utf8');
                let normContent = normalize(content);
                let changed = false;
                
                if (tc.name === 'default_api:replace_file_content') {
                  const targetContent = normalize(args.TargetContent);
                  if (normContent.includes(targetContent)) {
                    normContent = normContent.replace(targetContent, normalize(args.ReplacementContent));
                    changed = true;
                  }
                } else if (tc.name === 'default_api:multi_replace_file_content') {
                  args.ReplacementChunks.forEach(chunk => {
                    const targetContent = normalize(chunk.TargetContent);
                    if (normContent.includes(targetContent)) {
                      normContent = normContent.replace(targetContent, normalize(chunk.ReplacementContent));
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
        console.error('Error parsing line:', e.message);
      }
    });
  }
});

console.log('Restored modifications from logs: ' + appliedCount);
