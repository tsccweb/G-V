import fs from 'fs';
import path from 'path';

const directory = 'c:/Users/USER/Documents/Psalms/frontend/src';

const replacements = [
  // Backgrounds
  [/bg-slate-900/g, 'bg-black'],
  [/bg-slate-800/g, 'bg-zinc-900'],
  [/bg-slate-700/g, 'bg-zinc-800'],
  
  // Borders
  [/border-slate-700/g, 'border-zinc-800'],
  [/border-slate-600/g, 'border-zinc-700'],
  [/hover:border-slate-500/g, 'hover:border-zinc-600'],
  
  // Text
  [/text-slate-400/g, 'text-zinc-400'],
  [/text-slate-500/g, 'text-zinc-500'],
  [/text-slate-600/g, 'text-zinc-600'],
  [/text-slate-700/g, 'text-zinc-700'],

  // Indigo / Blue Accents (Buttons, links)
  [/bg-blue-600 hover:bg-blue-700 text-white/g, 'bg-white hover:bg-zinc-200 text-black'],
  [/bg-blue-600 hover:bg-blue-700/g, 'bg-white hover:bg-zinc-200'],
  [/bg-emerald-600 hover:bg-emerald-700 text-white/g, 'bg-white hover:bg-zinc-200 text-black'],
  [/bg-emerald-600 hover:bg-emerald-700/g, 'bg-white hover:bg-zinc-200'],
  [/text-blue-600/g, 'text-black'],
  [/bg-blue-600/g, 'bg-white text-black'], 

  // Specific Blue / Emerald text colors
  [/text-blue-400/g, 'text-zinc-300'],
  [/text-emerald-400/g, 'text-zinc-300'],
  [/text-amber-400/g, 'text-zinc-300'],
  [/text-red-400/g, 'text-white'], 
  [/text-purple-400/g, 'text-zinc-300'],

  // Gradients
  [/from-blue-400 to-emerald-400/g, 'from-zinc-100 to-zinc-500'],
  [/from-blue-600 to-indigo-700/g, 'from-zinc-800 to-black'],
  
  // Shadows & Borders
  [/border-blue-500/g, 'border-zinc-600'],
  [/shadow-blue-900\/20/g, 'shadow-white/5'],
  [/shadow-emerald-900\/20/g, 'shadow-white/5'],

  // Background overlays
  [/bg-blue-500\/10/g, 'bg-zinc-100/10'],
  [/bg-blue-500\/30/g, 'bg-white/10'],
  [/bg-blue-50/g, 'bg-zinc-900'],
  [/bg-emerald-500\/10/g, 'bg-zinc-100/10'],
  [/bg-amber-500\/10/g, 'bg-zinc-100/10'],
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css') || fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
      }
      
      // Cleanup conflicting text-white text-black etc that might have stacked
      content = content.replace(/text-white text-black/g, 'text-black');
      content = content.replace(/text-black text-white/g, 'text-black');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(directory);
console.log('Complete');
