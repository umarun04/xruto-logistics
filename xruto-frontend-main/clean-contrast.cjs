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

  // Replace light text colors with solid semantic tokens for light mode
  content = content.replace(/text-amber-[123]00(\/[0-9]+)?/g, 'text-xr-warning');
  content = content.replace(/text-emerald-[123]00(\/[0-9]+)?/g, 'text-xr-success');
  content = content.replace(/text-blue-[123]00(\/[0-9]+)?/g, 'text-xr-info');
  content = content.replace(/text-indigo-[123]00(\/[0-9]+)?/g, 'text-xr-brandDark');
  content = content.replace(/text-red-[123]00(\/[0-9]+)?/g, 'text-xr-danger');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated contrast in ${path.basename(file)}`);
  }
});
