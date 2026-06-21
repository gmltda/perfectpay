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

console.log("🚀 Starting Checkout URL Updates...\n");

campaigns.forEach(slug => {
  const folderPath = path.join(rootDir, slug);
  if (!fs.existsSync(folderPath)) return;

  const htmlFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.html'));

  htmlFiles.forEach(file => {
    const filePath = path.join(folderPath, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    console.log(`📦 Auditing & Updating: ${slug}/${file}`);

    if (slug === 'bolsas-costura-criativa') {
      // Replace vagalimitada checkout with PerfectPay
      const oldLink = 'https://app.vagalimitada.com/checkout/169361626:1';
      const newLink = 'https://go.perfectpay.com.br/PPU38CPO7RF';
      if (content.includes(oldLink)) {
        console.log(`   - Found and replacing old checkout: ${oldLink}`);
        content = content.split(oldLink).join(newLink);
      }
    }

    if (slug === 'moldes-de-costura') {
      // Replace vagalimitada and monetizze checkout with PerfectPay
      const oldVagaLink = 'https://app.vagalimitada.com/checkout/52581190:1';
      const oldMonetizzeLink = 'https://app.monetizze.com.br/checkout/KSA348024';
      const oldMonetizzeLinkEscaped = 'https:\\/\\/app.monetizze.com.br\\/checkout\\/KSA348024';
      const newLink = 'https://go.perfectpay.com.br/PPU38CPO8P8';

      if (content.includes(oldVagaLink)) {
        console.log(`   - Found and replacing old checkout: ${oldVagaLink}`);
        content = content.split(oldVagaLink).join(newLink);
      }
      if (content.includes(oldMonetizzeLink)) {
        console.log(`   - Found and replacing old checkout: ${oldMonetizzeLink}`);
        content = content.split(oldMonetizzeLink).join(newLink);
      }
      if (content.includes(oldMonetizzeLinkEscaped)) {
        console.log(`   - Found and replacing old escaped checkout: ${oldMonetizzeLinkEscaped}`);
        content = content.split(oldMonetizzeLinkEscaped).join('https:\\/\\/go.perfectpay.com.br\\/PPU38CPO8P8');
      }
    }

    if (slug === 'resina-artistica') {
      // Replace old PerfectPay links with the checkout.perfectpay subdomains
      const oldLink1 = 'https://go.perfectpay.com.br/PPU38CPO858';
      const newLink1 = 'https://checkout.perfectpay.com.br/pay/PPU38CPO858';
      const oldLink2 = 'https://go.perfectpay.com.br/PPU38CPO85J';
      const newLink2 = 'https://checkout.perfectpay.com.br/pay/PPU38CPO85J';

      if (content.includes(oldLink1)) {
        console.log(`   - Found and replacing checkout: ${oldLink1}`);
        content = content.split(oldLink1).join(newLink1);
      }
      if (content.includes(oldLink2)) {
        console.log(`   - Found and replacing checkout: ${oldLink2}`);
        content = content.split(oldLink2).join(newLink2);
      }
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`   🟢 SUCCESS: Updated file!`);
    } else {
      console.log(`   ⚪ No changes needed.`);
    }

    // Post-check for other legacy checkout domains to avoid lingering issues
    const legacyPatterns = [
      'vagalimitada.com/checkout',
      'monetizze.com.br',
      'kiwify.com.br',
      'hotmart.com',
      'appmax.com.br'
    ];
    legacyPatterns.forEach(pattern => {
      if (content.toLowerCase().includes(pattern)) {
        console.warn(`   ⚠️ WARNING: Found lingering legacy pattern "${pattern}" in this file!`);
      }
    });
  });
});

console.log("\n========================================");
console.log("🟢 Checkout updates complete!");
console.log("========================================");
