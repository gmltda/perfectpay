const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const campaigns = [
  'resinaartistica',
  'bolsaslucrativas2025',
  '2500-modelos-de-croche',
  'croche2500modelos',
  'costura',
  'costuracreativa',
  'feltros2025',
  'moldesparafeltro',
  'criacao-de-camaroes'
];

console.log('=== INICIANDO VALIDAÇÃO DE ROTAS E ASSETS ===\n');

let totalChecks = 0;
let totalFailed = 0;
const failures = [];

campaigns.forEach(c => {
  const cPath = path.join(repoRoot, c);
  console.log(`> Campaign: ${c.toUpperCase()}`);

  const activeIndex = path.join(cPath, 'index.html');
  if (!fs.existsSync(activeIndex)) {
    console.log(`  ❌ ERRO CRÍTICO: index.html não encontrado na raiz da campanha!\n`);
    failures.push({ campaign: c, asset: 'index.html', error: 'Missing active page index.html' });
    totalFailed++;
    return;
  }

  // Read HTML
  const html = fs.readFileSync(activeIndex, 'utf8');

  // Regex to match relative links in src, href, poster, data-src, data-background, etc.
  const attrRegex = /(src|href|poster|data-src|data-background)=["']([^"']+)["']/g;
  let match;
  const localAssets = new Set();

  while ((match = attrRegex.exec(html)) !== null) {
    const link = match[2];

    // Filter out absolute or special links
    const isAbsolute = link.startsWith('http://') || link.startsWith('https://') || link.startsWith('//');
    const isSpecial = link.startsWith('#') || link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('javascript:');
    const isDataOrBlank = link.startsWith('data:') || link.startsWith('about:');
    
    if (!isAbsolute && !isSpecial && !isDataOrBlank && link.trim() !== '') {
      // Decode URL encoding (e.g. %40 to @)
      let cleanLink = decodeURIComponent(link);
      // Strip any query parameters or hashes (e.g. style.css?ver=6.7.1 or font.woff2#iefix)
      cleanLink = cleanLink.split('?')[0].split('#')[0];
      
      // Skip document routes, alternate feeds, pingbacks, or standard index pages
      const isDocumentRoute = [
        'index.html', 'index.htm', 'index.php', 'xmlrpc.php',
        'feed/', 'feed/index.htm', 'comments/feed/index.htm',
        'tr', 'tr-1', 'tr/', 'tr-1/', 'css', 'css/', 'comments', 'comments/'
      ].includes(cleanLink.trim());

      if (cleanLink.trim() !== '' && !isDocumentRoute) {
        localAssets.add(cleanLink);
      }
    }
  }

  console.log(`  Assets locais mapeados: ${localAssets.size}`);

  localAssets.forEach(asset => {
    // Check if asset exists on disk.
    // The asset path in the HTML is relative to the campaign folder.
    const assetPath = path.join(cPath, asset);
    totalChecks++;

    if (fs.existsSync(assetPath)) {
      // OK
    } else {
      // It's possible that the asset was referencing an index.html or similar directory link
      // E.g. href="/costura/" or similar. Let's check if it exists if we treat it as an absolute path from the repo root
      // if it starts with a slash
      let existsFallback = false;
      if (asset.startsWith('/')) {
        const absolutePath = path.join(repoRoot, asset);
        if (fs.existsSync(absolutePath)) {
          existsFallback = true;
        }
      }

      if (!existsFallback) {
        console.log(`  ❌ ASSET QUEBRADO (404): ${asset}`);
        failures.push({ campaign: c, asset: asset, error: 'File not found on disk' });
        totalFailed++;
      }
    }
  });

  // Verify redirects
  const redirectInfo = {
    '2500-modelos-de-croche': ['p/index.html', 'p/index.htm'],
    'croche2500modelos': ['croche/index.html', 'croche/index.htm'],
    'costura': ['moldes/index.htm', 'moldes/index.html'],
    'costuracreativa': ['curso-de-confeccao-de-bolsas-passo-a-passo/index.htm', 'curso-de-confeccao-de-bolsas-passo-a-passo/index.html'],
    'feltros2025': ['feltros-religioso/index.htm', 'feltros-religioso/index.html'],
    'criacao-de-camaroes': ['p/index.htm', 'p/index.html']
  };

  if (redirectInfo[c]) {
    redirectInfo[c].forEach(red => {
      const redPath = path.join(cPath, red);
      totalChecks++;
      if (fs.existsSync(redPath)) {
        // OK
      } else {
        console.log(`  ❌ REDIRECIONAMENTO FALTANDO: ${red}`);
        failures.push({ campaign: c, asset: red, error: 'Missing redirect fallback file' });
        totalFailed++;
      }
    });
  }

  if (failures.filter(f => f.campaign === c).length === 0) {
    console.log(`  ✅ Todos os assets e rotas verificados e funcionando perfeitamente!`);
  }
  console.log('--------------------------------------------------\n');
});

console.log('=== RESUMO DA VALIDAÇÃO ===');
console.log(`Total de verificações de arquivos: ${totalChecks}`);
console.log(`Total de falhas encontradas: ${totalFailed}`);

if (totalFailed > 0) {
  console.log('\n❌ A VALIDAÇÃO FALHOU! LISTA DE ERROS DE CONTEXTO:');
  failures.forEach(f => {
    console.log(`- Campaign [${f.campaign}]: Missing ${f.asset} (${f.error})`);
  });
  process.exit(1);
} else {
  console.log('\n🎉 SUCESSO! Todas as páginas estáticas e rotas estão 100% integradas e sem quebras!');
  process.exit(0);
}
