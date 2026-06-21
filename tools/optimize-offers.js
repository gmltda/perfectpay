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

const campaigns = {
  "2500-modelos-de-croche": {
    slug: "2500-modelos-de-croche",
    title: "2500 Modelos de Crochê - Gráficos e Receitas Passo a Passo",
    description: "Tenha acesso ao maior pacote de receitas e gráficos de crochê do Brasil. Mais de 2500 modelos exclusivos com vídeo aulas passo a passo para iniciantes e avançados.",
    defaultFavicon: "assets/vendor/wordpress/wp-content/uploads/2024/11/Design-sem-nome-2-Photoroom-300x300.png"
  },
  "bolsas-de-croche-lucrativas": {
    slug: "bolsas-de-croche-lucrativas",
    title: "Bolsas de Crochê Lucrativas - Aprenda a Faturar Alto",
    description: "Descubra como criar lindas bolsas de crochê passo a passo e monte seu próprio negócio altamente lucrativo trabalhando no conforto da sua casa.",
    defaultFavicon: "assets/vendor/wordpress/wp-content/uploads/2024/10/Design-sem-nome-Photoroom.png"
  },
  "costura-criativa": {
    slug: "costura-criativa",
    title: "Curso de Costura Criativa - Molde & Costure Peças Exclusivas",
    description: "Aprenda costura criativa do absoluto zero. Guia prático com moldes premium e aulas didáticas para criar peças exclusivas e lucrar.",
    defaultFavicon: "assets/vendor/wordpress/wp-content/uploads/2024/10/Selo_de_Garantia_de_30_Dias_PNG_Transparente_Sem_Fundo.png"
  },
  "criacao-de-camaroes": {
    slug: "criacao-de-camaroes",
    title: "Como Criar Camarões de Água Doce - Guia Profissional",
    description: "O guia definitivo para criação de camarões de água doce. Aprenda desde a montagem do tanque até a comercialização e tenha uma fonte de renda altamente lucrativa.",
    defaultFavicon: "assets/vendor/wordpress/wp-content/uploads/2024/10/logo-camarao.png"
  },
  "croche-2500-modelos": {
    slug: "croche-2500-modelos",
    title: "Crochê Premium - Mais de 2500 Gráficos e Receitas com Vídeos",
    description: "Tenha acesso imediato a mais de 2500 receitas e gráficos de crochê selecionados, mais vídeo aulas completas para aprimorar suas técnicas.",
    defaultFavicon: "assets/vendor/wordpress/wp-content/uploads/2024/11/Design-sem-nome-2-Photoroom-300x300.png"
  },
  "moldes-de-costura-premium": {
    slug: "moldes-de-costura-premium",
    title: "Moldes de Costura Premium - Prontos para Imprimir",
    description: "Facilite seu trabalho com nosso pacote exclusivo de moldes de costura premium. Peças femininas, masculinas, infantis e mais, prontas para imprimir e cortar.",
    defaultFavicon: "assets/vendor/wordpress/wp-content/uploads/2024/10/garantia.png"
  },
  "resina-artistica": {
    slug: "resina-artistica",
    title: "Curso de Resina Artística - Peças Incríveis Passo a Passo",
    description: "Aprenda as técnicas mais modernas de resina artística. Faça joias, chaveiros, bandejas e peças decorativas de luxo de forma descomplicada e lucrativa.",
    defaultFavicon: "assets/vendor/wordpress/wp-content/uploads/2024/10/ChatGPT-Image-29-de-mar.-de-2025-10_40_02-300x200.png"
  }
};

const rootDir = path.resolve(__dirname, '..');

// Helper to find all image files in a directory recursively
function findImages(dir) {
  let images = [];
  if (!fs.existsSync(dir)) return images;
  
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      images = images.concat(findImages(filePath));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico'].includes(ext)) {
        images.push(filePath);
      }
    }
  });
  return images;
}

function getBestFavicon(campaignFolder, config) {
  const fullPathDefault = path.join(campaignFolder, config.defaultFavicon);
  if (fs.existsSync(fullPathDefault)) {
    return config.defaultFavicon;
  }
  
  // Search for fallback
  const assetsFolder = path.join(campaignFolder, 'assets');
  const allImages = findImages(assetsFolder);
  if (allImages.length > 0) {
    // Filter out payment logos, selos, etc. if possible
    const candidates = allImages.filter(p => {
      const lower = p.toLowerCase();
      return !lower.includes('pagamento') && !lower.includes('garantia') && !lower.includes('selo') && !lower.includes('visa') && !lower.includes('master');
    });
    const chosen = candidates.length > 0 ? candidates[0] : allImages[0];
    return path.relative(campaignFolder, chosen).replace(/\\/g, '/');
  }
  
  return null;
}

function processHtmlFile(filePath, campaignSlug, config) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  console.log(`\n----------------------------------------`);
  console.log(`Processing: ${path.relative(rootDir, filePath)} (Campaign: ${campaignSlug})`);

  // 1. Clean HTML start (remove blank lines, garbage, or leading whitespaces before DOCTYPE)
  const doctypeIndex = content.search(/<!DOCTYPE html/i);
  if (doctypeIndex > 0) {
    console.log(`  Cleaning ${doctypeIndex} characters of trash from top of file.`);
    content = content.substring(doctypeIndex);
  } else if (doctypeIndex === -1) {
    const htmlIndex = content.search(/<html/i);
    if (htmlIndex > 0) {
      console.log(`  Cleaning ${htmlIndex} characters of trash from top of file.`);
      content = content.substring(htmlIndex);
    }
  }
  content = content.trim();

  // 2. Remove literal "\n" strings from any previous messy injections
  content = content.replace(/\\n/g, '\n');

  // 3. Re-inject Google Tag Manager cleanly
  // Let's remove existing GTM script to prevent duplication
  content = content.replace(/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/gi, '');
  content = content.replace(/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/gi, '');
  // Also remove standard scripts with GTM-WWX5XB9
  content = content.replace(/<script>[^<]*GTM-WWX5XB9[^<]*<\/script>/gi, '');
  content = content.replace(/<noscript><iframe[^<]*GTM-WWX5XB9[^<]*<\/iframe><\/noscript>/gi, '');

  // Now inject them high in <head> and immediately after <body>
  content = content.replace(/<head\b([^>]*)>/i, `$&` + '\n' + gtmHead);
  content = content.replace(/<body\b([^>]*)>/i, `$&` + '\n' + gtmBody);

  // 4. Inject / Standardize Favicon
  const faviconRelPath = getBestFavicon(path.dirname(filePath), config);
  if (faviconRelPath) {
    console.log(`  Selected Favicon: ${faviconRelPath}`);
    // Remove existing icon links
    content = content.replace(/<link[^>]+rel=(?:"icon"|"shortcut icon"|'icon'|'shortcut icon')[^>]*>/gi, '');
    content = content.replace(/<link[^>]+rel=(?:"apple-touch-icon")[^>]*>/gi, '');
    
    // Inject brand new favicon links high in <head>
    let iconType = 'image/x-icon';
    if (faviconRelPath.endsWith('.png')) iconType = 'image/png';
    else if (faviconRelPath.endsWith('.webp')) iconType = 'image/webp';
    else if (faviconRelPath.endsWith('.jpg') || faviconRelPath.endsWith('.jpeg')) iconType = 'image/jpeg';
    
    const faviconTags = `\n  <link rel="icon" href="${faviconRelPath}" type="${iconType}">\n  <link rel="shortcut icon" href="${faviconRelPath}" type="${iconType}">`;
    content = content.replace(/<head\b([^>]*)>/i, `$&` + faviconTags);
  }

  // 5. Inject SEO and Open Graph tags
  // Let's remove existing title and meta descriptions/OG tags to keep it extremely clean
  content = content.replace(/<title>[\s\S]*?<\/title>/gi, '');
  content = content.replace(/<meta[^>]+name=(?:"description"|'description')[^>]*>/gi, '');
  content = content.replace(/<meta[^>]+property=(?:"og:[^"]+"|'og:[^']+'|og:[a-z0-9_-]+)[^>]*>/gi, '');
  content = content.replace(/<meta[^>]+name=(?:"twitter:[^"]+"|'twitter:[^']+'|twitter:[a-z0-9_-]+)[^>]*>/gi, '');

  const ogImageUrl = faviconRelPath ? `https://hoje.vagalimitada.com/${campaignSlug}/${faviconRelPath}` : '';

  const seoMetaTags = `
  <title>${config.title}</title>
  <meta name="description" content="${config.description}">
  <meta property="og:title" content="${config.title}">
  <meta property="og:description" content="${config.description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://hoje.vagalimitada.com/${campaignSlug}/">
  ${ogImageUrl ? `<meta property="og:image" content="${ogImageUrl}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${config.title}">
  <meta name="twitter:description" content="${config.description}">
  ${ogImageUrl ? `<meta name="twitter:image" content="${ogImageUrl}">` : ''}
  `;

  // Inject immediately after <head>
  content = content.replace(/<head\b([^>]*)>/i, `$&` + seoMetaTags);

  // 6. Clean WordPress references and resolve broken image hosts (e.g. 127.0.0.1:8080)
  content = content.replace(/http:\/\/127\.0\.0\.1:8080\/[a-zA-Z0-9_-]+\/wp-content/gi, 'http://vagalimitada.com/moldesparafeltro/wp-content');
  content = content.replace(/http:\/\/127\.0\.0\.1:8080\/wp-content/gi, 'http://vagalimitada.com/moldesparafeltro/wp-content');

  // Also replace any lingering 127.0.0.1 or localhost references in source code to keep pages 100% relative and clean
  content = content.replace(/http:\/\/127\.0\.0\.1:8080\//g, './');
  content = content.replace(/http:\/\/localhost:8080\//g, './');

  // Let's do a sanity check to make sure content is formatted nicely
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n'); // collapse multi-newlines

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Successfully updated and optimized!`);
  } else {
    console.log(`  No changes required.`);
  }
}

// Walk active folders
Object.keys(campaigns).forEach(slug => {
  const folderPath = path.join(rootDir, slug);
  if (fs.existsSync(folderPath)) {
    const htmlFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.html'));
    htmlFiles.forEach(file => {
      const filePath = path.join(folderPath, file);
      processHtmlFile(filePath, slug, campaigns[slug]);
    });
  } else {
    console.warn(`Campaign folder does not exist: ${slug}`);
  }
});

console.log(`\n========================================`);
console.log(`Offer Optimization Script executed successfully!`);
console.log(`========================================`);
