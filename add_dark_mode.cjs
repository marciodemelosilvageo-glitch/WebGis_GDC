const fs = require('fs');

const replacements = [
  { search: /\bbg-white\/40\b/g, replace: 'bg-white/40 dark:bg-slate-900/60' },
  { search: /\bbg-white\/80\b/g, replace: 'bg-white/80 dark:bg-slate-900/80' },
  { search: /\bbg-white\b/g, replace: 'bg-white dark:bg-slate-900' },
  { search: /\bbg-slate-50\b/g, replace: 'bg-slate-50 dark:bg-slate-800' },
  { search: /\bbg-slate-100\b/g, replace: 'bg-slate-100 dark:bg-slate-800/80' },
  { search: /\bbg-slate-200\b/g, replace: 'bg-slate-200 dark:bg-slate-700' },
  { search: /\bbg-indigo-50\b/g, replace: 'bg-indigo-50 dark:bg-indigo-900/40' },
  { search: /\bbg-emerald-50\b/g, replace: 'bg-emerald-50 dark:bg-emerald-900/40' },
  { search: /\bbg-amber-50\b/g, replace: 'bg-amber-50 dark:bg-amber-900/40' },

  { search: /\btext-slate-900\b/g, replace: 'text-slate-900 dark:text-slate-100' },
  { search: /\btext-slate-800\b/g, replace: 'text-slate-800 dark:text-slate-200' },
  { search: /\btext-slate-700\b/g, replace: 'text-slate-700 dark:text-slate-300' },
  { search: /\btext-slate-600\b/g, replace: 'text-slate-600 dark:text-slate-400' },
  { search: /\btext-slate-500\b/g, replace: 'text-slate-500 dark:text-slate-400' },
  { search: /\btext-indigo-900\b/g, replace: 'text-indigo-900 dark:text-indigo-200' },
  { search: /\btext-indigo-950\/80\b/g, replace: 'text-indigo-950/80 dark:text-indigo-200/80' },
  
  { search: /\bborder-white\/50\b/g, replace: 'border-white/50 dark:border-slate-700/50' },
  { search: /\bborder-slate-100\b/g, replace: 'border-slate-100 dark:border-slate-800' },
  { search: /\bborder-slate-200\b/g, replace: 'border-slate-200 dark:border-slate-700' },
  { search: /\bborder-slate-300\b/g, replace: 'border-slate-300 dark:border-slate-600' },
  { search: /\bborder-indigo-100\b/g, replace: 'border-indigo-100 dark:border-indigo-900/40' },
  
  { search: /\bbg-slate-900\/60\b/g, replace: 'bg-slate-900/60 dark:bg-slate-950/80' }
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = dir + '/' + file;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      for (const rule of replacements) {
        content = content.replace(rule.search, (match, offset, string) => {
           const replaceStr = rule.replace;
           const suffix = replaceStr.split(' ')[1];
           if (string.substring(offset).startsWith(replaceStr) || string.substring(offset, offset + match.length + suffix.length + 1).includes(suffix)) {
               return match;
           }
           return replaceStr;
        });
      }
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir('src');
console.log('Dark mode classes applied');
