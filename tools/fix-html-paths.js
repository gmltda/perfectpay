const fs = require('fs');
const path = require('path');

const gtmId = 'GTM-WWX5XB9';

const gtmHead = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');</script>
<!-- End Google Tag Manager -->`;

const gtmBody = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

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

function processHtmlFile(filePath) {
  console.log(`Processing file: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Google Fonts 404 Fix: Replace css?family= with absolute google fonts prefix
  content = content.replace(/(href=["'])css\?family=/gi, '$1https://fonts.googleapis.com/css?family=');

  // 2. Absolute / relative wp-content/wp-includes/wp-json paths to localized assets
  // Using negative lookbehind to ensure we don't prefix already-prefixed paths.
  content = content.replace(/(?<!assets\/vendor\/wordpress\/)(?<!assets\/vendor\/wordpress)(?:\.\.\/|\.\/|\/)*wp-content\//g, 'assets/vendor/wordpress/wp-content/');
  content = content.replace(/(?<!assets\/vendor\/wordpress\/)(?<!assets\/vendor\/wordpress)(?:\.\.\/|\.\/|\/)*wp-includes\//g, 'assets/vendor/wordpress/wp-includes/');
  content = content.replace(/(?<!assets\/vendor\/wordpress\/)(?<!assets\/vendor\/wordpress)(?:\.\.\/|\.\/|\/)*wp-json\//g, 'assets/vendor/wordpress/wp-json/');

  // 3. Remove integrity and crossorigin from any local scripts or links that got localized
  content = content.replace(/<(script|link)\b([^>]+)>/gi, (match, tag, attrs) => {
    if ((attrs.includes('assets/') || attrs.includes('wp-content') || attrs.includes('wp-includes')) && attrs.includes('integrity=')) {
      console.log(`  Removing integrity from local ${tag} tag in ${path.basename(filePath)}`);
      let newAttrs = attrs
        .replace(/\bintegrity=(["'])(.*?)\1/gi, '')
        .replace(/\bcrossorigin=(["'])(.*?)\1/gi, '')
        .replace(/\bcrossorigin\b/gi, '');
      return `<${tag}${newAttrs}>`;
    }
    return match;
  });

  // 4. Inject Google Tag Manager
  if (!content.includes(gtmId)) {
    console.log(`  Injecting Google Tag Manager to ${path.basename(filePath)}`);
    // Insert into Head
    content = content.replace(/<head\b([^>]*)>/i, `$&\\n${gtmHead}`);
    // Insert into Body
    content = content.replace(/<body\b([^>]*)>/i, `$&\\n${gtmBody}`);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Successfully updated: ${filePath}`);
  } else {
    console.log(`  No changes needed: ${filePath}`);
  }
}

const rootDir = path.resolve(__dirname, '..');
walkDir(rootDir, (filePath) => {
  if (filePath.endsWith('.html')) {
    processHtmlFile(filePath);
  }
});

console.log('Path and GTM fixes completed successfully.');
