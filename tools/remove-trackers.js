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

const gtmHead = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WWX5XB9');</script>
<!-- End Google Tag Manager -->`;

const gtmBody = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WWX5XB9"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

campaigns.forEach(slug => {
  const folderPath = path.join(rootDir, slug);
  if (!fs.existsSync(folderPath)) return;

  const htmlFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.html'));

  htmlFiles.forEach(file => {
    const filePath = path.join(folderPath, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalLength = content.length;

    console.log(`\n----------------------------------------`);
    console.log(`🧹 Processing trackers in: ${slug}/${file}`);

    // 1. Remove comments-based Meta Pixel block (extremely safe as it is bounded by unique comments)
    content = content.replace(/<!--\s*Meta Pixel Code\s*-->[\s\S]*?<!--\s*End Meta Pixel Code\s*-->/gi, '');

    // 2. Remove script blocks containing Facebook Pixel function calls (tempered to single block)
    content = content.replace(/<script[^>]*>(?:(?!<\/script>)[\s\S])*?fbq\((?:(?!<\/script>)[\s\S])*?<\/script>/gi, '');

    // 3. Remove noscript blocks containing Facebook Pixel URLs (tempered to single block)
    content = content.replace(/<noscript>(?:(?!<\/noscript>)[\s\S])*?(facebook\.com\/tr|tr\?id=)(?:(?!<\/noscript>)[\s\S])*?<\/noscript>/gi, '');

    // 4. Remove Microsoft Clarity blocks (tempered to single block)
    content = content.replace(/<script[^>]*>(?:(?!<\/script>)[\s\S])*?clarity\.ms\/tag(?:(?!<\/script>)[\s\S])*?<\/script>/gi, '');

    // 5. Remove Google Analytics (gtag.js) script links (tempered to single block)
    content = content.replace(/<script[^>]*src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js[^"']*["'][^>]*>(?:(?!<\/script>)[\s\S])*?<\/script>/gi, '');

    // 6. Remove Google Analytics inline configurations (tempered to single block)
    content = content.replace(/<script[^>]*>(?:(?!<\/script>)[\s\S])*?gtag\((?:(?!<\/script>)[\s\S])*?<\/script>/gi, '');

    // 7. Ensure GTM-WWX5XB9 tag is present, clean up duplicates
    // First, let's remove any GTM blocks that might exist to perform a clean insert
    content = content.replace(/<!--\s*Google Tag Manager\s*-->[\s\S]*?<!--\s*End Google Tag Manager\s*-->/gi, '');
    content = content.replace(/<!--\s*Google Tag Manager \(noscript\)\s*-->[\s\S]*?<!--\s*End Google Tag Manager \(noscript\)\s*-->/gi, '');

    // 8. Re-inject GTM Head at the absolute top of <head> (below <meta charset="UTF-8">)
    const headIndex = content.toLowerCase().indexOf('<head>');
    if (headIndex !== -1) {
      let insertIndex = headIndex + 6;
      
      // Look if there's a meta charset or viewport to insert after
      const charsetMatch = /<meta\s+charset="UTF-8"\s*\/?>/i.exec(content);
      if (charsetMatch && charsetMatch.index > headIndex && charsetMatch.index < headIndex + 200) {
        insertIndex = charsetMatch.index + charsetMatch[0].length;
      }
      
      content = content.substring(0, insertIndex) + '\n' + gtmHead + content.substring(insertIndex);
    }

    // 9. Re-inject GTM Body immediately after <body> tag
    const bodyIndex = content.toLowerCase().indexOf('<body');
    if (bodyIndex !== -1) {
      const bodyTagEnd = content.indexOf('>', bodyIndex) + 1;
      content = content.substring(0, bodyTagEnd) + '\n' + gtmBody + content.substring(bodyTagEnd);
    }

    const diff = originalLength - content.length;
    console.log(`   Removed tracker characters: ${diff > 0 ? diff : 0}`);
    fs.writeFileSync(filePath, content, 'utf8');
  });
});

console.log(`\n========================================`);
console.log(`🟢 Tracker cleanup complete!`);
console.log(`========================================`);
