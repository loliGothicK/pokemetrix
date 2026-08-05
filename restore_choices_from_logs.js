const fs = require('fs');
const path = require('path');

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
                
                // We want to replace the current file content (which might be the tsume_action from ReplacementContent)
                // WITH the original choices block (which is TargetContent in the log).
                
                if (tc.name === 'default_api:replace_file_content') {
                  const targetContent = normalize(args.TargetContent); // original choices
                  const replacementContent = normalize(args.ReplacementContent); // tsume_action
                  
                  if (normContent.includes(replacementContent)) {
                    normContent = normContent.replace(replacementContent, targetContent);
                    changed = true;
                  }
                } else if (tc.name === 'default_api:multi_replace_file_content') {
                  args.ReplacementChunks.forEach(chunk => {
                    let tgt = typeof chunk === 'string' ? JSON.parse(chunk).TargetContent : chunk.TargetContent;
                    let rep = typeof chunk === 'string' ? JSON.parse(chunk).ReplacementContent : chunk.ReplacementContent;
                    const targetContent = normalize(tgt);
                    const replacementContent = normalize(rep);
                    if (normContent.includes(replacementContent)) {
                      normContent = normContent.replace(replacementContent, targetContent);
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
console.log('Restored original format from logs: ' + appliedCount);
