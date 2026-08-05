const fs = require('fs');

const files = [
  'apps/web/content/quiz/en/expert/tsume/sucker_punch_fail.mdx',
  'apps/web/content/quiz/ja/expert/tsume/sucker_punch_fail.mdx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('format: choices')) {
    let questionText = file.includes('ja/') 
      ? '相手のメガガルーラはゲンガーに「ふいうち」を撃とうとしています。これを無効化しつつ、相手を機能停止させるための最適な行動を選択してください。'
      : 'Your opponent\'s Mega Kangaskhan is about to use Sucker Punch against your Gengar. Select the optimal move and target to nullify this attack and cripple Kangaskhan.';
      
    content = content.replace(/format:\s*choices/, 'format: tsume_action');
    content = content.replace(/question:.*?\n/s, `question: "${questionText}"\n`);
    content = content.replace(/options:\s*\n(\s*-.*?\n)+/s, '');
    content = content.replace(/correctAnswer:.*?\n/s, '');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
