const fs = require('fs');
const path = require('path');

const targetDirs = [
  'bolos-caseiros',
  'bolsasnatela',
  'bolsaspraianasdecroche',
  'bordadolivre',
  'hortascaseiras',
  'metodo-sapatinho-de-ouro',
  'recheios-secretos',
  'sapatinhoschic',
  'super-receitas-donuts-americanos'
];

const rootDir = path.resolve(__dirname, '..');
const GTM_ID = 'GTM-WWX5XB9';
const UTMIFY_URL = 'https://cdn.utmify.com.br/scripts/utms/latest.js';

function getHtmlFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file.toLowerCase() !== 'wp-json' && file.toLowerCase() !== 'feed') {
        results = results.concat(getHtmlFiles(filePath));
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.html' || ext === '.htm') {
        results.push(filePath);
      }
    }
  });
  return results;
}

let allHtmlFiles = [];
targetDirs.forEach(slug => {
  const folderPath = path.join(rootDir, slug);
  const files = getHtmlFiles(folderPath);
  allHtmlFiles = allHtmlFiles.concat(files);
});

let failed = false;

allHtmlFiles.forEach(filePath => {
  const relPath = path.relative(rootDir, filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Skip simple redirect files
  const isRedirect = content.includes('Redirecionando...') || content.includes('window.location.href =');
  if (isRedirect) {
    // Check if redirect preserves query parameters
    if (content.includes('/p') && !content.includes('window.location.search')) {
      console.error(`❌ [FAIL] Redirect in ${relPath} does not preserve query string!`);
      failed = true;
    } else {
      console.log(`✅ [PASS] Redirect: ${relPath}`);
    }
    return;
  }

  // Verify GTM-WWX5XB9
  const hasGtm = content.includes(GTM_ID);
  const hasOtherGtm = /GTM-(?!WWX5XB9)[A-Z0-9]+/i.test(content);
  const hasGtmScript = content.includes('gtm.js?id=') && content.includes(GTM_ID);
  const hasGtmNoscript = content.includes('ns.html?id=' + GTM_ID);

  // Verify UTMify
  const hasUtmify = content.includes(UTMIFY_URL);
  const hasLocalUtmify = content.includes('scripts/utms/latest.js') && !content.includes(UTMIFY_URL);

  // Verify Lovable Widget removed
  const hasLovable = content.includes('lovable.app/widget.js');

  let fileErrors = [];
  if (!hasGtm) fileErrors.push(`Missing GTM ID ${GTM_ID}`);
  if (hasOtherGtm) {
    const otherIds = content.match(/GTM-(?!WWX5XB9)[A-Z0-9]+/gi);
    fileErrors.push(`Contains other GTM IDs: ${otherIds.join(', ')}`);
  }
  if (!hasGtmScript) fileErrors.push(`Missing GTM script tag`);
  if (!hasGtmNoscript) fileErrors.push(`Missing GTM noscript tag`);
  if (!hasUtmify) fileErrors.push(`Missing UTMify CDN script`);
  if (hasLocalUtmify) fileErrors.push(`References local latest.js`);
  if (hasLovable) fileErrors.push(`Contains Lovable widget script`);

  if (fileErrors.length > 0) {
    console.error(`❌ [FAIL] ${relPath}:\n  - ` + fileErrors.join('\n  - '));
    failed = true;
  } else {
    console.log(`✅ [PASS] ${relPath}`);
  }
});

if (failed) {
  console.error('\n🔴 Some files failed verification. Please check the logs.');
  process.exit(1);
} else {
  console.log('\n🟢 All files passed verification successfully!');
  process.exit(0);
}
