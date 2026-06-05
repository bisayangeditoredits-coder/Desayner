const fs = require('fs');
const path = require('path');
const dirs = ['asset-store', 'mockups', 'tutorials', 'job-board', 'challenges', 'inspirations'];

dirs.forEach(d => {
  const p = path.join('d:/CRELDESK/CreldeskStudio/src/app/(main)', d, 'page.js');
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    if (!content.includes('App.css')) {
      content = "import '../../App.css';\n" + content;
      fs.writeFileSync(p, content);
    }
  }
});
console.log('Added App.css import');
