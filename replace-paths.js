const fs = require('fs');
const path = require('path');
function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content
        .replace(/'\/dashboard\//g, "'/")
        .replace(/\"\/dashboard\//g, "\"/")
        .replace(/\`\/dashboard\//g, "`/")
        .replace(/href=\"\/dashboard\"/g, 'href=\"/\"')
        .replace(/href=\'\/dashboard\'/g, 'href=\'/\'')
        .replace(/push\(\'\/dashboard\'\)/g, "push('/')")
        .replace(/push\(\"\/dashboard\"\)/g, 'push("/")')
        .replace(/redirectTo=\/dashboard/g, 'redirectTo=/');
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log('Updated routes in: ' + fullPath);
      }
    }
  });
}
walk('src');
