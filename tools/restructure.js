const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const campaignsConfig = [
  {
    name: 'resinaartistica',
    activePath: 'index.htm',
    depth: 0,
    hasExpiredIndex: false,
    specialFolders: {
      'scripts': 'assets/vendor/scripts',
      'webcopy-origin.txt': 'assets/vendor/webcopy-origin.txt'
    }
  },
  {
    name: 'bolsaslucrativas2025',
    activePath: 'index.htm',
    depth: 0,
    hasExpiredIndex: false,
    specialFolders: {
      '736x': 'assets/images/736x',
      'atm': 'assets/vendor/atm',
      'npm': 'assets/vendor/npm',
      'webcopy-origin.txt': 'assets/vendor/webcopy-origin.txt'
    }
  },
  {
    name: '2500-modelos-de-croche',
    activePath: 'p/index.html',
    depth: 1,
    hasExpiredIndex: false,
    specialFolders: {
      'css': 'assets/css',
      'css-1': 'assets/css',
      'js': 'assets/js',
      'scripts': 'assets/vendor/scripts',
      's': 'assets/vendor/s',
      'e-202504.js': 'assets/js/e-202504.js',
      's-202504.js': 'assets/js/s-202504.js',
      'webcopy-origin.txt': 'assets/vendor/webcopy-origin.txt'
    },
    redirects: ['p/index.html', 'p/index.htm']
  },
  {
    name: 'croche2500modelos',
    activePath: 'croche/index.html',
    depth: 1,
    hasExpiredIndex: true,
    specialFolders: {
      'css': 'assets/css',
      'scripts': 'assets/vendor/scripts',
      's': 'assets/vendor/s',
      'webcopy-origin.txt': 'assets/vendor/webcopy-origin.txt'
    },
    redirects: ['croche/index.html', 'croche/index.htm']
  },
  {
    name: 'costura',
    activePath: 'moldes/index.htm',
    depth: 1,
    hasExpiredIndex: true,
    specialFolders: {
      'css': 'assets/css',
      's': 'assets/vendor/s',
      'images': 'assets/images',
      'webcopy-origin.txt': 'assets/vendor/webcopy-origin.txt'
    },
    redirects: ['moldes/index.htm', 'moldes/index.html']
  },
  {
    name: 'costuracreativa',
    activePath: 'curso-de-confeccao-de-bolsas-passo-a-passo/index.htm',
    depth: 1,
    hasExpiredIndex: true,
    specialFolders: {
      'webcopy-origin.txt': 'assets/vendor/webcopy-origin.txt'
    },
    redirects: [
      'curso-de-confeccao-de-bolsas-passo-a-passo/index.htm',
      'curso-de-confeccao-de-bolsas-passo-a-passo/index.html'
    ]
  },
  {
    name: 'feltros2025',
    activePath: 'feltros-religioso/index.htm',
    depth: 1,
    hasExpiredIndex: false,
    specialFolders: {
      'css': 'assets/css',
      's': 'assets/vendor/s',
      'webcopy-origin.txt': 'assets/vendor/webcopy-origin.txt'
    },
    redirects: ['feltros-religioso/index.htm', 'feltros-religioso/index.html']
  },
  {
    name: 'moldesparafeltro',
    activePath: 'index.html',
    depth: 0,
    hasExpiredIndex: false,
    specialFolders: {
      'css': 'assets/css',
      's': 'assets/vendor/s',
      'webcopy-origin.txt': 'assets/vendor/webcopy-origin.txt'
    }
  },
  {
    name: 'criacao-de-camaroes',
    activePath: 'p/index.htm',
    depth: 1,
    hasExpiredIndex: false,
    specialFolders: {
      'scripts': 'assets/vendor/scripts',
      'webcopy-origin.txt': 'assets/vendor/webcopy-origin.txt'
    },
    redirects: ['p/index.htm', 'p/index.html']
  }
];

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function moveItem(src, dest) {
  if (!fs.existsSync(src)) return;
  let finalDest = dest;
  // If destination is an existing directory and source is a file, copy file inside it
  if (fs.existsSync(dest) && fs.statSync(dest).isDirectory()) {
    const srcStat = fs.statSync(src);
    if (!srcStat.isDirectory()) {
      finalDest = path.join(dest, path.basename(src));
    }
  }
  const parent = path.dirname(finalDest);
  fs.mkdirSync(parent, { recursive: true });
  try {
    fs.renameSync(src, finalDest);
  } catch (err) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      copyDirRecursive(src, finalDest);
      fs.rmSync(src, { recursive: true, force: true });
    } else {
      fs.copyFileSync(src, finalDest);
      fs.unlinkSync(src);
    }
  }
}

function createRedirectHTML(targetUrl) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0;url=${targetUrl}">
    <title>Redirecionando...</title>
    <script type="text/javascript">
        // Preserve UTM parameters during redirect
        var currentQuery = window.location.search;
        var destination = "${targetUrl}" + currentQuery;
        window.location.replace(destination);
    </script>
</head>
<body>
    <p>Se você não for redirecionado automaticamente, <a id="redir-link" href="${targetUrl}">clique aqui</a>.</p>
    <script type="text/javascript">
        document.getElementById('redir-link').href = destination;
    </script>
</body>
</html>`;
}

function rewriteHTMLPaths(htmlContent, campaignDepth, campaignName) {
  let content = htmlContent;

  // If the active page is inside a nested folder, strip '../' prefixes from relative URLs
  // to align them with the new root-level campaign directory context.
  if (campaignDepth > 0) {
    // Specifically search for relative paths like href="../wp-content/..." and replace with href="wp-content/..."
    const attributes = ['src', 'href', 'poster', 'data-src', 'data-background', 'srcset'];
    attributes.forEach(attr => {
      // Handle standard and double quoted / single quoted links
      const regex = new RegExp(`(${attr})=(["'])\\.\\.\\/([^"']+)["']`, 'g');
      content = content.replace(regex, '$1="$3"');
    });
  }

  // 1. Move WordPress core asset folders
  const wpFolders = ['wp-content', 'wp-includes', 'wp-json', 'comments', 'feed', 'ajax', 'production', 'tr', 'tr-1', '7gW5229'];
  wpFolders.forEach(folder => {
    const regex = new RegExp(`(["'])${folder}/`, 'g');
    content = content.replace(regex, `$1assets/vendor/wordpress/${folder}/`);
  });

  // 2. Move standard vendors
  const vendorFolders = ['npm', 'atm', 's'];
  vendorFolders.forEach(folder => {
    const regex = new RegExp(`(["'])${folder}/`, 'g');
    content = content.replace(regex, `$1assets/vendor/${folder}/`);
  });

  // 3. Move standard images folders
  const imgFolders = ['images', '736x'];
  imgFolders.forEach(folder => {
    const regex = new RegExp(`(["'])${folder}/`, 'g');
    content = content.replace(regex, `$1assets/images/${folder}/`);
  });

  // 4. Move standard scripts, css, js
  content = content.replace(/(["'])scripts\//g, '$1assets/vendor/scripts/');
  content = content.replace(/(["'])css\//g, '$1assets/css/');
  content = content.replace(/(["'])js\//g, '$1assets/js/');

  // 5. Special files
  content = content.replace(/(["'])e-202504\.js/g, '$1assets/js/e-202504.js');
  content = content.replace(/(["'])s-202504\.js/g, '$1assets/js/s-202504.js');
  content = content.replace(/(["'])css(["'])/g, '$1assets/css/css$2');
  content = content.replace(/(["'])css-1(["'])/g, '$1assets/css/css-1$2');

  // 6. Correct old routes inside the HTML links to ensure clean URLs
  content = content.replace(/href=["'][^"']*(p\/index\.html|croche\/index\.html|moldes\/index\.htm|feltros-religioso\/index\.htm|curso-de-confeccao-de-bolsas-passo-a-passo\/index\.htm)["']/g, (match) => {
    if (match.includes('p/index.html')) {
      if (campaignName === '2500-modelos-de-croche') return 'href="/2500-modelos-de-croche/"';
      if (campaignName === 'criacao-de-camaroes') return 'href="/criacao-de-camaroes/"';
    }
    if (match.includes('croche/index.html')) return 'href="/croche2500modelos/"';
    if (match.includes('moldes/index.htm')) return 'href="/costura/"';
    if (match.includes('feltros-religioso/index.htm')) return 'href="/feltros2025/"';
    if (match.includes('curso-de-confeccao-de-bolsas-passo-a-passo/index.htm')) return 'href="/costuracreativa/"';
    return match;
  });

  return content;
}

console.log('=== INICIANDO A REESTRUTURAÇÃO DO HOJE HUB ===\n');

campaignsConfig.forEach(c => {
  const cPath = path.join(repoRoot, c.name);
  console.log(`> PROCESSANDO CAMPANHA: ${c.name.toUpperCase()}`);

  if (!fs.existsSync(cPath)) {
    console.log(`  Erro: Pasta da campanha não encontrada!\n`);
    return;
  }

  let activeFilePath = path.join(cPath, c.activePath);
  if (!fs.existsSync(activeFilePath)) {
    const fallbackPath = path.join(cPath, 'index.html');
    if (fs.existsSync(fallbackPath)) {
      activeFilePath = fallbackPath;
      console.log(`  Nota: Usando index.html já existente como ponto de partida.`);
    } else {
      console.log(`  Erro: Página ativa em ${c.activePath} não encontrada!\n`);
      return;
    }
  }

  // 1. Leia o arquivo HTML ativo original
  const originalHTML = fs.readFileSync(activeFilePath, 'utf8');

  // 2. Crie a estrutura de pastas assets vazia
  const assetFolders = ['images', 'videos', 'css', 'js', 'fonts', 'vendor'];
  assetFolders.forEach(sub => {
    fs.mkdirSync(path.join(cPath, 'assets', sub), { recursive: true });
  });

  // 3. Renomeie o index.html da raiz como backup se ele for expirado
  const rootIndex = path.join(cPath, 'index.html');
  if (c.hasExpiredIndex && fs.existsSync(rootIndex)) {
    console.log(`  Renomeando index.html expirado da raiz para index-encerrada.html...`);
    moveItem(rootIndex, path.join(cPath, 'index-encerrada.html'));
  }

  // 4. Mova as pastas de sistemas do WordPress/Elementor para assets/vendor/wordpress
  const wpFolders = ['wp-content', 'wp-includes', 'wp-json', 'comments', 'feed', 'ajax', 'production', 'tr', 'tr-1', '7gW5229'];
  wpFolders.forEach(folder => {
    const folderPath = path.join(cPath, folder);
    if (fs.existsSync(folderPath)) {
      console.log(`  Movendo pasta do sistema WordPress: ${folder} -> assets/vendor/wordpress/${folder}`);
      moveItem(folderPath, path.join(cPath, 'assets', 'vendor', 'wordpress', folder));
    }
  });

  // 5. Mova as pastas especiais e arquivos soltos configurados
  if (c.specialFolders) {
    Object.entries(c.specialFolders).forEach(([item, targetPath]) => {
      const srcPath = path.join(cPath, item);
      if (fs.existsSync(srcPath)) {
        const destPath = path.join(cPath, targetPath);
        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
          console.log(`  Movendo pasta especial: ${item} -> ${targetPath}`);
          // Se a pasta destino já existe (ex: assets/css), podemos querer mover o conteúdo para dentro dela
          const isDestCssOrJs = targetPath.startsWith('assets/css') || targetPath.startsWith('assets/js') || targetPath.startsWith('assets/images');
          if (isDestCssOrJs) {
            // Mover os arquivos de dentro para a pasta destino correspondente (achatar)
            const files = fs.readdirSync(srcPath);
            files.forEach(f => {
              moveItem(path.join(srcPath, f), path.join(destPath, f));
            });
            fs.rmSync(srcPath, { recursive: true, force: true });
          } else {
            moveItem(srcPath, destPath);
          }
        } else {
          console.log(`  Movendo arquivo especial: ${item} -> ${targetPath}`);
          moveItem(srcPath, destPath);
        }
      }
    });
  }

  // 6. Processe o conteúdo HTML e corrija os caminhos
  console.log(`  Reescrevendo caminhos de assets e links no HTML da Landing Page...`);
  const rewrittenHTML = rewriteHTMLPaths(originalHTML, c.depth, c.name);

  // 7. Escreva o novo index.html na raiz da pasta da oferta
  console.log(`  Gravando novo index.html na raiz da pasta da oferta...`);
  fs.writeFileSync(rootIndex, rewrittenHTML, 'utf8');

  // 8. Crie as páginas de redirecionamento (fallback) nos locais antigos
  if (c.redirects) {
    c.redirects.forEach(red => {
      const redPath = path.join(cPath, red);
      console.log(`  Criando página de redirecionamento em: ${red}`);
      const targetUrl = `/${c.name}/`;
      const redirContent = createRedirectHTML(targetUrl);
      const redDir = path.dirname(redPath);
      fs.mkdirSync(redDir, { recursive: true });
      fs.writeFileSync(redPath, redirContent, 'utf8');
    });
  }

  // 9. Se a página ativa antiga estava em um subdiretório, remova-a (ela foi substituída pelo redirecionamento ou movida)
  if (c.depth > 0) {
    const oldActivePath = path.join(cPath, c.activePath);
    // Verifique se já não criamos um redirecionamento em cima dela.
    // Se a página ativa era croche/index.html e criamos um redirecionamento em croche/index.html,
    // o conteúdo já foi substituído corretamente.
  }

  console.log(`✓ Campanha ${c.name} concluída com sucesso!\n--------------------------------------------------\n`);
});

console.log('=== REESTRUTURAÇÃO CONCLUÍDA COM SUCESSO! ===');
