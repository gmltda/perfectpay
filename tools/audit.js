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

console.log('=== INICIANDO AUDITORIA DO HOJE HUB ===\n');

campaigns.forEach(c => {
  const cPath = path.join(repoRoot, c);
  if (!fs.existsSync(cPath)) {
    console.log(`Campaign ${c}: PASTA NÃO ENCONTRADA\n`);
    return;
  }

  const items = fs.readdirSync(cPath);
  console.log(`Campanha: ${c}`);
  console.log(`Items na Raiz: ${JSON.stringify(items)}`);

  // Detect active page
  let activePage = null;
  const activeCandidates = [
    'index.html',
    'index.htm',
    'p/index.html',
    'p/index.htm',
    'croche/index.html',
    'croche/index.htm',
    'moldes/index.html',
    'moldes/index.htm',
    'feltros-religioso/index.html',
    'feltros-religioso/index.htm',
    'curso-de-confeccao-de-bolsas-passo-a-passo/index.html',
    'curso-de-confeccao-de-bolsas-passo-a-passo/index.htm'
  ];

  for (const cand of activeCandidates) {
    const p = path.join(cPath, cand);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      const isExpired = content.includes('Promoção Encerrada') || content.includes('PROMOÇÃO ENCERRADA');
      if (!isExpired) {
        activePage = cand;
        break;
      }
    }
  }

  console.log(`Página Ativa Identificada: ${activePage || 'NENHUMA (ou todas expiradas)'}`);

  // Detect root-level expired index.html
  const rootIndex = path.join(cPath, 'index.html');
  if (fs.existsSync(rootIndex)) {
    const content = fs.readFileSync(rootIndex, 'utf8');
    const isExpired = content.includes('Promoção Encerrada') || content.includes('PROMOÇÃO ENCERRADA');
    console.log(`index.html na Raiz existe? Sim (Expirado: ${isExpired})`);
  } else {
    console.log(`index.html na Raiz existe? Não`);
  }
  console.log('--------------------------------------------------\n');
});
