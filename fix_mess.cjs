const fs = require('fs');

function fixFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = dir + '/' + file;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fixFiles(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(/ order-slate-/g, ' dark:border-slate-');
      content = content.replace(/ g-slate-/g, ' dark:bg-slate-');
      content = content.replace(/ hover:bg-slate-200 700'/g, " hover:bg-slate-200 dark:hover:bg-slate-700'");
      content = content.replace(/ indigo-900\/40\/10 /g, ' dark:bg-indigo-900/10 ');

      fs.writeFileSync(fullPath, content);
    }
  }
}

fixFiles('src');
