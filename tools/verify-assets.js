const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const targetCampaigns = [
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

function getHtmlFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      const lowerFile = file.toLowerCase();
      if (lowerFile !== 'assets') {
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

let overallPass = true;

console.log('=== AUDITING CAMPAIGN STRUCTURES & PATHS ===\n');

targetCampaigns.forEach(cName => {
  const cPath = path.join(repoRoot, cName);
  if (!fs.existsSync(cPath)) {
    console.log(`❌ [FAIL] Campaign folder not found: ${cName}`);
    overallPass = false;
    return;
  }

  console.log(`Campaign: ${cName.toUpperCase()}`);

  // 1. Audit root entries
  const rootEntries = fs.readdirSync(cPath);
  const allowedRootNames = ['assets', 'index.html', 'index-encerrada.html', 'xmlrpc.php', 'xmlrpc-1.php', 'p', 'lowify', 'crosell', 'index'];
  
  rootEntries.forEach(entry => {
    if (!allowedRootNames.includes(entry)) {
      console.log(`   ❌ [FAIL] Unexpected root entry found: ${entry}`);
      overallPass = false;
    }
  });

  // 2. Audit sub-page folders (crosell, lowify, p, index) to ensure they only contain HTML/HTM redirects or files
  const subpages = ['p', 'lowify', 'crosell', 'index'];
  subpages.forEach(sp => {
    const spPath = path.join(cPath, sp);
    if (fs.existsSync(spPath)) {
      const spEntries = fs.readdirSync(spPath);
      spEntries.forEach(entry => {
        const entryPath = path.join(spPath, entry);
        const stat = fs.statSync(entryPath);
        if (stat.isDirectory()) {
          console.log(`   ❌ [FAIL] Unexpected directory in sub-page folder ${sp}: ${entry}`);
          overallPass = false;
        } else {
          const ext = path.extname(entry).toLowerCase();
          if (ext !== '.html' && ext !== '.htm' && entry !== 'xmlrpc.php') {
            console.log(`   ❌ [FAIL] Unexpected file in sub-page folder ${sp}: ${entry}`);
            overallPass = false;
          }
        }
      });
    }
  });

  // 3. Scan all HTML files for path correctness & tracking scripts
  const htmlFiles = getHtmlFiles(cPath);
  htmlFiles.forEach(htmlPath => {
    const fileRel = path.relative(cPath, htmlPath);
    const content = fs.readFileSync(htmlPath, 'utf8');
    
    // Check if redirect page
    const isRedirect = content.includes('http-equiv="refresh"') || content.includes('window.location.replace');
    
    if (isRedirect) {
      console.log(`   ✅ [PASS] Redirect page: ${fileRel}`);
      return;
    }

    // Check for GTM
    if (!content.includes('GTM-WWX5XB9')) {
      console.log(`   ❌ [FAIL] GTM-WWX5XB9 missing in: ${fileRel}`);
      overallPass = false;
    } else {
      console.log(`   ✅ [PASS] GTM present in: ${fileRel}`);
    }

    // Check for UTMify CDN script
    if (!content.includes('cdn.utmify.com.br/scripts/utms/latest.js')) {
      console.log(`   ❌ [FAIL] UTMify CDN script missing in: ${fileRel}`);
      overallPass = false;
    } else {
      console.log(`   ✅ [PASS] UTMify CDN present in: ${fileRel}`);
    }

    // Check for Lovable widget
    if (content.includes('lovable.app/widget.js')) {
      console.log(`   ❌ [FAIL] Lovable widget script still present in: ${fileRel}`);
      overallPass = false;
    }

    // Check for raw un-rewritten paths (like wp-content/ or wp-includes/ at depth-root level)
    // We should not find references to "wp-content/" or "wp-includes/" that aren't preceded by "assets/vendor/wordpress/" or part of absolute URLs.
    const lines = content.split('\n');
    let pathFailures = [];
    lines.forEach((line, index) => {
      const match = line.match(/(?<!assets\/vendor\/wordpress\/|wordpress\/)wp-content\//g);
      if (match) {
        // Exclude absolute URLs
        if (!line.includes('http://') && !line.includes('https://')) {
          pathFailures.push(`Line ${index + 1}: ${line.trim()}`);
        }
      }
    });

    if (pathFailures.length > 0) {
      console.log(`   ❌ [FAIL] Un-rewritten wp-content/ path found in: ${fileRel}`);
      pathFailures.forEach(f => console.log(`      ${f}`));
      overallPass = false;
    } else {
      console.log(`   ✅ [PASS] Asset paths rewritten correctly in: ${fileRel}`);
    }
  });
});

if (overallPass) {
  console.log('\n🟢 All campaigns passed asset layout and tracking verification successfully!');
  process.exit(0);
} else {
  console.log('\n🔴 Verification failed. Please check errors above.');
  process.exit(1);
}
