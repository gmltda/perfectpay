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

const gtmHeadCode = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');</script>
<!-- End Google Tag Manager -->`;

const gtmBodyCode = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

const utmifyCode = `<!-- UTMify -->
<script
  src="https://cdn.utmify.com.br/scripts/utms/latest.js"
  data-utmify-prevent-xcod-sck
  data-utmify-prevent-subids
  data-utmify-ignore-iframe
  data-utmify-is-cartpanda
  async
  defer
></script>`;

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

// 1. Gather all files to fix
let allHtmlFiles = [];
targetDirs.forEach(slug => {
  const folderPath = path.join(rootDir, slug);
  const files = getHtmlFiles(folderPath);
  allHtmlFiles = allHtmlFiles.concat(files);
});

console.log(`Found ${allHtmlFiles.length} HTML/HTM files to process.\n`);

allHtmlFiles.forEach(filePath => {
  const relPath = path.relative(rootDir, filePath);
  console.log(`Processing: ${relPath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Check if it's a redirect file (e.g. bolos-caseiros/index.html)
  const isRedirect = content.includes('Redirecionando...') || content.includes('window.location.href =');
  if (isRedirect) {
    console.log(`  -> Detected redirect script. Updating to preserve query string...`);
    const redirectRegex = /(window\.location\.href\s*=\s*window\.location\.origin\s*\+\s*['"]\/[a-zA-Z0-9-]+\/p['"])(?!\s*\+\s*window\.location\.search)/g;
    if (redirectRegex.test(content)) {
      content = content.replace(redirectRegex, "$1 + window.location.search");
      console.log(`     Updated redirect to preserve UTM parameters.`);
    }
    
    // Save if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`     File saved.`);
    }
    return;
  }

  // 1. Remove Lovable Script and its comments (highly robust)
  const lovableCommentPattern = /<!--\s*1\.\s*Script\s*global[^>]*-->/gi;
  content = content.replace(lovableCommentPattern, '');

  const lovableScriptPattern = /<script\s+[^>]*src=["']https:\/\/hwobfpq\.lovable\.app\/widget\.js[^"']*["'][^>]*>([\s\S]*?)<\/script>/gi;
  content = content.replace(lovableScriptPattern, '');

  // 2. Process GTM
  const hasGtm = /gtm\.js\?id=GTM-[A-Z0-9]+/i.test(content) || /ns\.html\?id=GTM-[A-Z0-9]+/i.test(content) || /GTM-WWX5XB9/i.test(content) || /GTM-NRP3VMHK/i.test(content);
  
  if (hasGtm) {
    console.log(`  -> Replacing existing GTM containers with ${GTM_ID}...`);
    content = content.replace(/GTM-NRP3VMHK/g, GTM_ID);
    content = content.replace(/GTM-NRP3VMH/g, GTM_ID); // In case of truncation
  } else {
    console.log(`  -> GTM not found. Injecting GTM-WWX5XB9...`);
    // Re-inject GTM Head as high as possible in <head>
    const headIndex = content.toLowerCase().indexOf('<head>');
    if (headIndex !== -1) {
      let insertIndex = headIndex + 6;
      const charsetMatch = /<meta\s+charset="[^"]+"\s*\/?>/i.exec(content) || /<meta\s+charset='[^']+'\s*\/?>/i.exec(content);
      if (charsetMatch && charsetMatch.index > headIndex && charsetMatch.index < headIndex + 300) {
        insertIndex = charsetMatch.index + charsetMatch[0].length;
      }
      content = content.substring(0, insertIndex) + '\n' + gtmHeadCode + '\n' + content.substring(insertIndex);
    }

    // Re-inject GTM Body immediately after <body> tag
    const bodyMatch = /<body[^>]*>/i.exec(content);
    if (bodyMatch) {
      const insertIndex = bodyMatch.index + bodyMatch[0].length;
      content = content.substring(0, insertIndex) + '\n' + gtmBodyCode + '\n' + content.substring(insertIndex);
    }
  }

  // 3. Inject or fix UTMify
  const hasCdnUtmify = /cdn\.utmify\.com\.br\/scripts\/utms\/latest\.js/i.test(content);
  if (hasCdnUtmify) {
    console.log(`  -> UTMify CDN is already present.`);
  } else {
    const hasAnyUtmify = /latest\.js/i.test(content) || /utmify\.com\.br/i.test(content);
    if (hasAnyUtmify) {
      console.log(`  -> Found local or outdated UTMify script. Replacing with CDN version...`);
      const localUtmifyRegex = /<script\s+[^>]*src=["'][^"']*latest\.js[^"']*["'][^>]*>([\s\S]*?)<\/script>/gi;
      if (localUtmifyRegex.test(content)) {
        content = content.replace(localUtmifyRegex, utmifyCode);
      } else {
        const closingHeadIndex = content.toLowerCase().indexOf('</head>');
        if (closingHeadIndex !== -1) {
          content = content.substring(0, closingHeadIndex) + '\n' + utmifyCode + '\n' + content.substring(closingHeadIndex);
        }
      }
    } else {
      console.log(`  -> UTMify not found. Injecting UTMify script...`);
      const closingHeadIndex = content.toLowerCase().indexOf('</head>');
      if (closingHeadIndex !== -1) {
        content = content.substring(0, closingHeadIndex) + '\n' + utmifyCode + '\n' + content.substring(closingHeadIndex);
      }
    }
  }

  // Save if changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  -> File updated and saved.`);
  } else {
    console.log(`  -> No changes needed.`);
  }
});

console.log(`\nAll done!`);
