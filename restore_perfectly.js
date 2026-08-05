const fs = require('fs');
const path = require('path');

const baseLogDir = 'C:\\Users\\lolig\\.gemini\\antigravity\\brain';
const convIds = [
  '5997eba1-f7aa-4724-a327-8310ef68741b',
  '88556eb1-ab8b-4431-a0d6-b0ef4642b775',
  'bf530a4c-d37e-4b90-936c-f8f1caa284dc',
  'a729cf70-7b47-4a94-b698-3d8510d4689f'
];

let appliedCount = 0;

function normalize(str) {
  if (str.startsWith('"') && str.endsWith('"')) {
    try { str = JSON.parse(str); } catch(e) {}
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
                
                let originalChoices = '';
                if (tc.name === 'default_api:replace_file_content') {
                  originalChoices = normalize(args.TargetContent);
                } else if (tc.name === 'default_api:multi_replace_file_content') {
                  let chunks = typeof args.ReplacementChunks === 'string' ? JSON.parse(args.ReplacementChunks) : args.ReplacementChunks;
                  originalChoices = normalize(chunks[0].TargetContent);
                }
                
                // Replace everything from format: (something) down to right before tsumeData:
                let regex = /format:\s*tsume_action\nquestion:[\s\S]*?(?=tsumeData:)/;
                if (regex.test(content) && originalChoices) {
                  if (!originalChoices.endsWith('\n')) originalChoices += '\n';
                  let newContent = content.replace(regex, originalChoices);
                  fs.writeFileSync(targetFile, newContent, 'utf8');
                  appliedCount++;
                }
              }
            }
          });
        }
      } catch (e) {}
    });
  }
});

console.log('Restored perfectly: ' + appliedCount);
