const fs = require('fs');
const path = require('path');

const campaigns = [
  "2500-modelos-de-croche",
  "bolsas-costura-criativa",
  "bolsas-de-croche-lucrativas",
  "moldes-de-costura",
  "resina-artistica"
];

const rootDir = path.resolve(__dirname, '..');
let totalErrors = 0;

function auditHtmlFile(filePath, campaignSlug) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ HTML File not found: ${filePath}`);
    totalErrors++;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const folderDir = path.dirname(filePath);
  const fileBasename = path.basename(filePath);

  console.log(`\n========================================`);
  console.log(`🔍 AUDITING: ${campaignSlug}/${fileBasename}`);
  console.log(`========================================`);

  // Trackers
  let localAssetsCheckedCount = 0;
  let localAssetsBroken = 0;
  let externalAssets = 0;
  let inlineDataAssets = 0;

  const brokenList = [];

  // Helper to check asset
  function checkAsset(assetPath, tagContext) {
    if (!assetPath) return;
    
    const trimmed = assetPath.trim();
    
    // Ignore obviously JS variable patterns in CSS url() matching
    if (trimmed.length <= 4) return;
    if (trimmed.includes('{') || trimmed.includes('}') || trimmed.includes('[') || trimmed.includes(']') || trimmed.includes('(') || trimmed.includes(')')) return;
    if (trimmed.includes('concat') || trimmed.includes('Blob') || trimmed.includes('function') || trimmed.includes('replace') || trimmed.includes('var ') || trimmed.includes('let ') || trimmed.includes('const ')) return;
    
    // Check if it has a file extension
    const hasExtension = /\.[a-zA-Z0-9]{2,5}($|\?|#)/.test(trimmed);
    if (!hasExtension) return;

    // Ignore external URLs, data URLs, anchors, or mailto/tel
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
      // Check if it's a localhost or 127.0.0.1 leak
      if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
        localAssetsBroken++;
        totalErrors++;
        brokenList.push({ path: trimmed, error: 'Lingering Localhost Leak', context: tagContext });
      } else {
        externalAssets++;
      }
      return;
    }
    
    if (trimmed.startsWith('data:') || trimmed.startsWith('#') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
      inlineDataAssets++;
      return;
    }

    // It's a local relative path
    localAssetsCheckedCount++;
    
    // Remove query params or hashes (e.g. style.css?v=1.2 or font.woff2#iefix)
    let cleanPath = trimmed.split('?')[0].split('#')[0];
    // Decode percent-encoded URLs
    try {
      cleanPath = decodeURIComponent(cleanPath);
    } catch(e) {}

    const fullPath = path.join(folderDir, cleanPath);
    if (!fs.existsSync(fullPath)) {
      localAssetsBroken++;
      totalErrors++;
      brokenList.push({ path: trimmed, error: 'File Not Found on Disk', context: tagContext });
    }
  }

  // 1. Audit Images: <img src="...">
  const imgRegex = /<img[^>]+src=["'](.*?)["']/gi;
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    checkAsset(match[1], '<img> tag');
  }

  // 2. Audit Image Srcset: <img srcset="..." or <source srcset="...">
  const srcsetRegex = /srcset=["'](.*?)["']/gi;
  while ((match = srcsetRegex.exec(content)) !== null) {
    const srcsetVal = match[1];
    // srcset can be comma separated list of "path widthDescriptor"
    const parts = srcsetVal.split(',');
    parts.forEach(part => {
      const parts2 = part.trim().split(' ');
      if (parts2.length > 0) {
        checkAsset(parts2[0], 'srcset attribute');
      }
    });
  }

  // 3. Audit Links: <link href="...">
  const linkRegex = /<link[^>]+href=["'](.*?)["']/gi;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1];
    const relMatch = /rel=["'](.*?)["']/i.exec(match[0]);
    const rel = relMatch ? relMatch[1].toLowerCase() : '';
    // Audit stylesheets, favicons, etc.
    if (rel === 'stylesheet' || rel === 'icon' || rel === 'shortcut icon' || rel === 'apple-touch-icon') {
      checkAsset(href, `<link rel="${rel}"> tag`);
    }
  }

  // 4. Audit Scripts: <script src="...">
  const scriptRegex = /<script[^>]+src=["'](.*?)["']/gi;
  while ((match = scriptRegex.exec(content)) !== null) {
    checkAsset(match[1], '<script> tag');
  }

  // 5. Audit Background-Images or Inline CSS urls: url(...)
  const urlRegex = /url\((['"]?)(.*?)\1\)/gi;
  while ((match = urlRegex.exec(content)) !== null) {
    const url = match[2];
    checkAsset(url, 'CSS url(...) declaration');
  }

  // Summary for this page
  console.log(`📊 Statistics:`);
  console.log(`   - Local Assets Checked: ${localAssetsCheckedCount}`);
  console.log(`   - Local Assets OK:      ${localAssetsCheckedCount - localAssetsBroken}`);
  console.log(`   - Local Assets BROKEN:  ${localAssetsBroken}`);
  console.log(`   - External Assets:      ${externalAssets}`);
  console.log(`   - Inline/Data Assets:   ${inlineDataAssets}`);

  if (localAssetsBroken > 0) {
    console.log(`\n❌ BROKEN ASSETS FOUND IN ${campaignSlug}:`);
    brokenList.forEach(item => {
      console.log(`   * Path:    ${item.path}`);
      console.log(`     Type:    ${item.error}`);
      console.log(`     Context: ${item.context}`);
    });
  } else {
    console.log(`\n🟢 100% OK! All referenced local assets exist on disk.`);
  }
}

// Run audits
campaigns.forEach(slug => {
  const folderPath = path.join(rootDir, slug);
  if (fs.existsSync(folderPath)) {
    const htmlFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.html'));
    htmlFiles.forEach(file => {
      auditHtmlFile(path.join(folderPath, file), slug);
    });
  } else {
    console.warn(`Campaign folder not found: ${slug}`);
  }
});

console.log(`\n========================================`);
console.log(`🏁 FINAL AUDIT STATUS: ${totalErrors === 0 ? '🟢 SUCCESS (0 errors)' : `❌ FAILED (${totalErrors} errors)`}`);
console.log(`========================================`);

process.exit(totalErrors === 0 ? 0 : 1);
