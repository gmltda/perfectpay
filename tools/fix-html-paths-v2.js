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
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  console.log(`Processing file: ${path.relative(rootDir, filePath)}`);

  // 1. Fix literal "\n" characters from previous head/body injection
  content = content.replace(/\\n<!-- Google Tag Manager -->/g, '\n' + gtmHead);
  content = content.replace(/<head\b([^>]*)>\\n<!-- Google Tag Manager -->/gi, (match, attrs) => {
    return `<head${attrs}>\n${gtmHead}`;
  });
  content = content.replace(/\\n<!-- Google Tag Manager \(noscript\) -->/g, '\n' + gtmBody);
  content = content.replace(/<body\b([^>]*)>\\n<!-- Google Tag Manager \(noscript\) -->/gi, (match, attrs) => {
    return `<body${attrs}>\n${gtmBody}`;
  });

  // 2. Fix Google Fonts 404: Replace css?family= with absolute google fonts prefix
  content = content.replace(/(href=["'])css\?family=/gi, '$1https://fonts.googleapis.com/css?family=');

  // 3. Localize absolute domains (e.g. http://moldesparafeltro.online/wp-content/ -> assets/vendor/wordpress/wp-content/)
  // Also matches escaped domains in JSON: https:\/\/moldesparafeltro.online\/wp-content\/
  
  // Normal slashes
  content = content.replace(/https?:\/\/[a-zA-Z0-9.-]+\/wp-content\//gi, 'assets/vendor/wordpress/wp-content/');
  content = content.replace(/https?:\/\/[a-zA-Z0-9.-]+\/wp-includes\//gi, 'assets/vendor/wordpress/wp-includes/');
  content = content.replace(/https?:\/\/[a-zA-Z0-9.-]+\/wp-json\//gi, 'assets/vendor/wordpress/wp-json/');
  
  // Escaped slashes for JSON
  content = content.replace(/https?:\\\/\\\/[a-zA-Z0-9.-]+\\\/wp-content\\\//gi, 'assets\\/vendor\\/wordpress\\/wp-content\\/');
  content = content.replace(/https?:\\\/\\\/[a-zA-Z0-9.-]+\\\/wp-includes\\\//gi, 'assets\\/vendor\\/wordpress\\/wp-includes\\/');
  content = content.replace(/https?:\\\/\\\/[a-zA-Z0-9.-]+\\\/wp-json\\\//gi, 'assets\\/vendor\\/wordpress\\/wp-json\\/');

  // 4. Localize un-prefixed relative paths (e.g. wp-content/ -> assets/vendor/wordpress/wp-content/)
  // Normal slashes
  content = content.replace(/(?<!assets\/vendor\/wordpress\/)(?<!assets\/vendor\/wordpress)(?:\.\.\/|\.\/|\/)*wp-content\//g, 'assets/vendor/wordpress/wp-content/');
  content = content.replace(/(?<!assets\/vendor\/wordpress\/)(?<!assets\/vendor\/wordpress)(?:\.\.\/|\.\/|\/)*wp-includes\//g, 'assets/vendor/wordpress/wp-includes/');
  content = content.replace(/(?<!assets\/vendor\/wordpress\/)(?<!assets\/vendor\/wordpress)(?:\.\.\/|\.\/|\/)*wp-json\//g, 'assets/vendor/wordpress/wp-json/');

  // Escaped slashes for JSON
  content = content.replace(/(?<!assets\\\/vendor\\\/wordpress\\\/)(?<!assets\\\/vendor\\\/wordpress)(?:\\\.\\\.\\\/|\\\.\\\/|\\\/)*wp-content\\\//g, 'assets\\/vendor\\/wordpress\\/wp-content\\/');
  content = content.replace(/(?<!assets\\\/vendor\\\/wordpress\\\/)(?<!assets\\\/vendor\\\/wordpress)(?:\\\.\\\.\\\/|\\\.\\\/|\\\/)*wp-includes\\\//g, 'assets\\/vendor\\/wordpress\\/wp-includes\\/');
  content = content.replace(/(?<!assets\\\/vendor\\\/wordpress\\\/)(?<!assets\\\/vendor\\\/wordpress)(?:\\\.\\\.\\\/|\\\.\\\/|\\\/)*wp-json\\\//g, 'assets\\/vendor\\/wordpress\\/wp-json\\/');

  // 5. Remove integrity and crossorigin from any local scripts or links that got localized
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

  // 6. Ensure Google Tag Manager is injected and clean
  if (!content.includes(gtmId)) {
    console.log(`  Injecting Google Tag Manager to ${path.basename(filePath)}`);
    // Insert into Head
    content = content.replace(/<head\b([^>]*)>/i, `$&` + '\n' + gtmHead);
    // Insert into Body
    content = content.replace(/<body\b([^>]*)>/i, `$&` + '\n' + gtmBody);
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
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html' || ext === '.htm') {
    processHtmlFile(filePath);
  }
});

console.log('Path and GTM fixes v2 completed successfully.');
