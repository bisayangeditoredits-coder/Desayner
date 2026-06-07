const fs = require('fs');
const text = fs.readFileSync('eslint-report-new.json', 'utf16le').replace(/^\uFEFF/, '');
const data = JSON.parse(text);
data.forEach(file => {
  file.messages.forEach(msg => {
    if (msg.severity === 2 && msg.ruleId === 'react/no-unescaped-entities') {
      const lines = fs.readFileSync(file.filePath, 'utf8').split('\n');
      const lineIndex = msg.line - 1;
      let line = lines[lineIndex];
      // only replace apostrophes that are part of words
      line = line.replace(/(\w)'(\w)/g, "$1&apos;$2");
      // replace unescaped quotes outside tags if we want, but usually it's just apostrophes
      line = line.replace(/"([^"]*)"/g, (match, p1) => {
         if (line.includes('className=') || line.includes('style=')) return match;
         return `&quot;${p1}&quot;`;
      });
      lines[lineIndex] = line;
      fs.writeFileSync(file.filePath, lines.join('\n'));
    }
  });
});
console.log('Fixed entities');
