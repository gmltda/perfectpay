const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== '.git' && f !== 'node_modules' && f !== 'tools') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

const rootDir = path.resolve(__dirname, '..');
const extensions = ['.html', '.htm', '.css', '.js'];

console.log('Scanning all files for unlocalized WordPress paths...');

let totalMatches = 0;
const fileSummary = [];

walkDir(rootDir, (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (!extensions.includes(ext)) return;

  const content = fs.readFileSync(filePath, 'utf8');

  const regex = /(wp-content|wp-includes|wp-json)/g;
  let match;
  let fileMatches = 0;
  
  while ((match = regex.exec(content)) !== null) {
    const index = match.index;
    const term = match[1];
    
    // Check if preceded by assets/vendor/wordpress/ or assets\/vendor\/wordpress\/
    const prefixNormal = 'assets/vendor/wordpress/';
    const prefixEscaped = 'assets\\/vendor\\/wordpress\\/';
    
    const checkStartNormal = index - prefixNormal.length;
    const checkStartEscaped = index - prefixEscaped.length;
    
    const isPrefixedNormal = checkStartNormal >= 0 && content.substring(checkStartNormal, index) === prefixNormal;
    const isPrefixedEscaped = checkStartEscaped >= 0 && content.substring(checkStartEscaped, index) === 'assets\\/vendor\\/wordpress\\/';
    
    if (!isPrefixedNormal && !isPrefixedEscaped) {
      fileMatches++;
      totalMatches++;
    }
  }

  if (fileMatches > 0) {
    fileSummary.push({
      file: path.relative(rootDir, filePath),
      count: fileMatches
    });
  }
});

console.log('\n--- SCAN RESULTS SUMMARY (TRUE UNPREFIXED) ---');
fileSummary.forEach(item => {
  console.log(`- ${item.file}: ${item.count} un-prefixed terms`);
});
console.log(`\nScan finished. Total un-prefixed occurrences found: ${totalMatches}`);
