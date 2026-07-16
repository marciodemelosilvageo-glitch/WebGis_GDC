const fs = require('fs');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = dir + '/' + file;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // regex to find multiple of same dark class
      // like dark:bg-slate-900 ... dark:bg-slate-900
      let modified = content.replace(/(dark:[a-zA-Z0-9\-\/]+)(.*?)\1/g, '$1$2');
      // loop until no more duplicates in the same string
      while (modified !== content) {
          content = modified;
          modified = content.replace(/(dark:[a-zA-Z0-9\-\/]+)(.*?)\1/g, '$1$2');
      }
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir('src');
