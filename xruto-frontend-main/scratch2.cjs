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

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/text-red-200/g, 'text-xr-danger');
  content = content.replace(/text-red-300/g, 'text-xr-danger');
  content = content.replace(/text-emerald-200/g, 'text-xr-success');
  content = content.replace(/text-emerald-300/g, 'text-xr-success');
  content = content.replace(/text-blue-200/g, 'text-xr-info');
  content = content.replace(/text-blue-300/g, 'text-xr-info');
  content = content.replace(/text-indigo-200/g, 'text-xr-brandDark');
  content = content.replace(/text-indigo-300/g, 'text-xr-brandDark');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${path.basename(file)}`);
  }
});
