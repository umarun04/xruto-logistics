const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!dirFile.includes('node_modules') && !dirFile.includes('.git')) {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.jsx') || dirFile.endsWith('.js')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync(path.join(process.cwd(), 'src'));

let totalReplacements = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace borders
  content = content.replace(/border-white\/(?:10|5|20|15)/g, 'border-xr-line');
  content = content.replace(/border-white\/\[0\.\d+\]/g, 'border-xr-line');
  
  // Replace text
  content = content.replace(/text-white/g, 'text-xr-text');
  content = content.replace(/text-gray-200/g, 'text-xr-text');
  content = content.replace(/text-gray-300/g, 'text-xr-secondary');
  content = content.replace(/text-gray-400/g, 'text-xr-muted');
  
  // Replace backgrounds
  content = content.replace(/bg-white\/\[0\.0\d+\]/g, 'bg-xr-elevated');
  content = content.replace(/bg-xr-bg\/(?:40|50|60|80|90|92)/g, 'bg-white');
  content = content.replace(/bg-white\/(?:5|10|20|30)/g, 'bg-xr-elevated');
  content = content.replace(/bg-\[\#0a0e1a\]/g, 'bg-xr-surface');
  
  // Fills
  content = content.replace(/fill-white\/(?:30|35|40|50)/g, 'fill-xr-muted');

  // Fix buttons/badges which actually need text-white inside colored backgrounds
  // We can just revert 'text-xr-text' to 'text-white' when preceded by certain classes.
  // Actually, for Button.jsx and Badge.jsx and AppShell (where brand has text-white), it's easier to manually fix after.
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplacements++;
    console.log(`Updated ${path.basename(file)}`);
  }
});

console.log(`Total files updated: ${totalReplacements}`);
