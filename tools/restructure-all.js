const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const targetCampaigns = [
  {
    name: 'bolos-caseiros',
    activePath: 'p/index.htm', // Moves p/index.htm to index.html at root
    redirects: ['p/index.htm', 'p/index.html']
  },
  {
    name: 'bolsasnatela',
    activePath: 'index.html'
  },
  {
    name: 'bolsaspraianasdecroche',
    activePath: 'index.html'
  },
  {
    name: 'bordadolivre',
    activePath: 'index.html'
  },
  {
    name: 'hortascaseiras',
    activePath: 'index.html'
  },
  {
    name: 'metodo-sapatinho-de-ouro',
    activePath: 'index.html'
  },
  {
    name: 'recheios-secretos',
    activePath: 'index.html'
  },
  {
    name: 'sapatinhoschic',
    activePath: 'index.html'
  },
  {
    name: 'super-receitas-donuts-americanos',
    activePath: 'index.html'
  }
];

// Escapes regex special chars
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Copy directory recursively
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

// Move file or directory
function moveItem(src, dest) {
  if (!fs.existsSync(src)) return;
  
  let finalDest = dest;
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

// Merge folders (moves all files/folders inside src into dest, then deletes src)
function mergeDirectory(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src);
  for (const entry of entries) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    moveItem(srcPath, destPath);
  }
  try {
    fs.rmSync(src, { recursive: true, force: true });
  } catch (e) {
    // Ignore if not empty or locked
  }
}

// Create redirect HTML code
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

// Find all HTML and HTM files inside a directory (excluding wp-json, feed, assets)
function getHtmlFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      const lowerFile = file.toLowerCase();
      if (lowerFile !== 'wp-json' && lowerFile !== 'feed' && lowerFile !== 'assets' && lowerFile !== 'assets_backup' && lowerFile !== 'index-backup') {
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

// Master rewrite function for HTML paths
function rewriteHTMLContent(content, depth) {
  const rootPrefix = '../'.repeat(depth);

  // Define asset replacements mapping
  const replacements = [
    // WordPress core system directories
    { old: 'wp-content/', new: 'assets/vendor/wordpress/wp-content/' },
    { old: 'wp-includes/', new: 'assets/vendor/wordpress/wp-includes/' },
    { old: 'wp-json/', new: 'assets/vendor/wordpress/wp-json/' },
    { old: 'comments/', new: 'assets/vendor/wordpress/comments/' },
    { old: 'feed/', new: 'assets/vendor/wordpress/feed/' },
    
    // Other root-level asset directories
    { old: 'npm/', new: 'assets/vendor/npm/' },
    { old: 's/', new: 'assets/vendor/s/' },
    { old: 'u/', new: 'assets/vendor/u/' },
    { old: 'avatar/', new: 'assets/vendor/avatar/' },
    { old: 'gtag/', new: 'assets/vendor/gtag/' },
    { old: 'scripts/', new: 'assets/vendor/scripts/' },
    { old: 'images/', new: 'assets/images/' },
    { old: '736x/', new: 'assets/images/736x/' },
    { old: 'tr/', new: 'assets/vendor/tr/' },
    { old: 'tr-1/', new: 'assets/vendor/tr-1/' },
    { old: 'recheios-secretos/', new: 'assets/vendor/recheios-secretos/' },
    
    // CSS stylesheets
    { old: 'css"', new: 'assets/css/css"' },
    { old: 'css\'', new: 'assets/css/css\'' },
    { old: 'css-1"', new: 'assets/css/css-1"' },
    { old: 'css-1\'', new: 'assets/css/css-1\'' },
    { old: 'css-2"', new: 'assets/css/css-2"' },
    { old: 'css-2\'', new: 'assets/css/css-2\'' }
  ];

  // Perform replacements in content
  replacements.forEach(rep => {
    // Regex matches quote, space, comma, equals, or opening parenthesis followed by optional relative path prefix (like ../ or ../../) and the old asset folder name
    // It captures the boundary char in group $1
    const regex = new RegExp(`(["'\\s,=\\(])(?:\\.\\.\\/)*${escapeRegExp(rep.old)}`, 'g');
    content = content.replace(regex, `$1${rootPrefix}${rep.new}`);
  });

  return content;
}

// Rewrite font and relative paths in moved stylesheets
function rewriteStylesheetContent(content) {
  content = content.replace(/url\((['"]?)s\//gi, 'url($1../vendor/s/');
  content = content.replace(/url\((['"]?)wp-content\//gi, 'url($1../vendor/wordpress/wp-content/');
  content = content.replace(/url\((['"]?)wp-includes\//gi, 'url($1../vendor/wordpress/wp-includes/');
  return content;
}

console.log('=== STARTING CAMPAIGN RESTORE & RESTRUCTURE ALL ===\n');

targetCampaigns.forEach(c => {
  const cPath = path.join(repoRoot, c.name);
  console.log(`\n==================================================`);
  console.log(`> Campaign: ${c.name.toUpperCase()}`);
  if (!fs.existsSync(cPath)) {
    console.log(`  Folder not found. Skipping.`);
    return;
  }

  // 1. Create assets target folders
  const assetSubfolders = [
    'assets/css',
    'assets/js',
    'assets/images',
    'assets/videos',
    'assets/fonts',
    'assets/vendor',
    'assets/vendor/wordpress'
  ];
  assetSubfolders.forEach(sub => {
    fs.mkdirSync(path.join(cPath, sub), { recursive: true });
  });

  // 2. Clean up backups in campaign if they exist
  const backups = ['assets_backup', 'index-backup'];
  backups.forEach(b => {
    const bPath = path.join(cPath, b);
    if (fs.existsSync(bPath)) {
      console.log(`  Deleting backup folder: ${b}`);
      fs.rmSync(bPath, { recursive: true, force: true });
    }
  });

  // 3. Move/merge folders from campaign root
  const wpDirs = ['wp-content', 'wp-includes', 'wp-json', 'comments', 'feed'];
  wpDirs.forEach(d => {
    const src = path.join(cPath, d);
    if (fs.existsSync(src)) {
      console.log(`  Merging root WordPress folder: ${d} -> assets/vendor/wordpress/${d}`);
      mergeDirectory(src, path.join(cPath, 'assets', 'vendor', 'wordpress', d));
    }
  });

  const vendorDirs = ['npm', 's', 'u', 'avatar', 'gtag', 'scripts', 'recheios-secretos'];
  vendorDirs.forEach(d => {
    const src = path.join(cPath, d);
    if (fs.existsSync(src)) {
      console.log(`  Merging root vendor folder: ${d} -> assets/vendor/${d}`);
      mergeDirectory(src, path.join(cPath, 'assets', 'vendor', d));
    }
  });

  const imageDirs = ['images', '736x'];
  imageDirs.forEach(d => {
    const src = path.join(cPath, d);
    if (fs.existsSync(src)) {
      console.log(`  Merging root images folder: ${d} -> assets/images/${d}`);
      mergeDirectory(src, path.join(cPath, 'assets', 'images', d));
    }
  });

  // Move root stylesheets
  const cssFiles = ['css', 'css-1', 'css-2'];
  cssFiles.forEach(f => {
    const src = path.join(cPath, f);
    if (fs.existsSync(src) && fs.statSync(src).isFile()) {
      console.log(`  Moving stylesheet: ${f} -> assets/css/${f}`);
      moveItem(src, path.join(cPath, 'assets', 'css', f));
      
      const stylesheetPath = path.join(cPath, 'assets', 'css', f);
      let sheetContent = fs.readFileSync(stylesheetPath, 'utf8');
      sheetContent = rewriteStylesheetContent(sheetContent);
      fs.writeFileSync(stylesheetPath, sheetContent, 'utf8');
    }
  });

  // Move other files
  const otherFiles = ['tr', 'tr-1', 'webcopy-origin.txt'];
  otherFiles.forEach(f => {
    const src = path.join(cPath, f);
    if (fs.existsSync(src)) {
      console.log(`  Moving special file: ${f} -> assets/vendor/${f}`);
      moveItem(src, path.join(cPath, 'assets', 'vendor', f));
    }
  });

  // 4. Move/merge assets from nested subdirectories (like crosell/wp-content etc.)
  // We scan the directory and for any subdirectory that is NOT 'assets', we check if it has asset folders inside
  const rootEntries = fs.readdirSync(cPath, { withFileTypes: true });
  rootEntries.forEach(entry => {
    if (entry.isDirectory() && entry.name !== 'assets') {
      const subDirPath = path.join(cPath, entry.name);
      
      // WordPress folders in nested dir
      wpDirs.forEach(d => {
        const src = path.join(subDirPath, d);
        if (fs.existsSync(src)) {
          console.log(`  Merging nested WordPress folder: ${entry.name}/${d} -> assets/vendor/wordpress/${d}`);
          mergeDirectory(src, path.join(cPath, 'assets', 'vendor', 'wordpress', d));
        }
      });
      
      // Vendor folders in nested dir
      vendorDirs.forEach(d => {
        const src = path.join(subDirPath, d);
        if (fs.existsSync(src)) {
          console.log(`  Merging nested vendor folder: ${entry.name}/${d} -> assets/vendor/${d}`);
          mergeDirectory(src, path.join(cPath, 'assets', 'vendor', d));
        }
      });

      // Images folders in nested dir
      imageDirs.forEach(d => {
        const src = path.join(subDirPath, d);
        if (fs.existsSync(src)) {
          console.log(`  Merging nested images folder: ${entry.name}/${d} -> assets/images/${d}`);
          mergeDirectory(src, path.join(cPath, 'assets', 'images', d));
        }
      });

      // Stylesheets in nested dir
      cssFiles.forEach(f => {
        const src = path.join(subDirPath, f);
        if (fs.existsSync(src) && fs.statSync(src).isFile()) {
          console.log(`  Moving nested stylesheet: ${entry.name}/${f} -> assets/css/${f}`);
          moveItem(src, path.join(cPath, 'assets', 'css', f));
          
          const stylesheetPath = path.join(cPath, 'assets', 'css', f);
          let sheetContent = fs.readFileSync(stylesheetPath, 'utf8');
          sheetContent = rewriteStylesheetContent(sheetContent);
          fs.writeFileSync(stylesheetPath, sheetContent, 'utf8');
        }
      });

      // Other files in nested dir
      otherFiles.forEach(f => {
        const src = path.join(subDirPath, f);
        if (fs.existsSync(src)) {
          console.log(`  Moving nested special file: ${entry.name}/${f} -> assets/vendor/${f}`);
          moveItem(src, path.join(cPath, 'assets', 'vendor', f));
        }
      });
    }
  });

  // 5. Handle activePath if nested (like bolos-caseiros/p/index.htm)
  if (c.activePath !== 'index.html' && c.activePath !== 'index.htm') {
    const oldActivePath = path.join(cPath, c.activePath);
    const newActivePath = path.join(cPath, 'index.html');
    if (fs.existsSync(oldActivePath)) {
      console.log(`  Moving active file: ${c.activePath} -> index.html`);
      
      let activeContent = fs.readFileSync(oldActivePath, 'utf8');
      
      // Fix all relative paths that go up one level to root assets
      const dirsToStrip = [
        'wp-content/', 'wp-includes/', 'wp-json/', 'comments/', 'feed/',
        'npm/', 's/', 'u/', 'avatar/', 'gtag/', 'scripts/', 'images/', '736x/',
        'tr/', 'tr-1/', 'recheios-secretos/'
      ];
      dirsToStrip.forEach(d => {
        const regex = new RegExp(`\\.\\.\\/${escapeRegExp(d)}`, 'g');
        activeContent = activeContent.replace(regex, d);
      });
      
      fs.writeFileSync(newActivePath, activeContent, 'utf8');
      fs.unlinkSync(oldActivePath);
    }
  }

  // 6. Rewrite paths in ALL HTML/HTM files of the campaign
  const htmlFiles = getHtmlFiles(cPath);
  console.log(`  Rewriting paths in ${htmlFiles.length} HTML files...`);
  htmlFiles.forEach(htmlPath => {
    const fileRelPath = path.relative(cPath, htmlPath);
    const fileDepth = fileRelPath.split(path.sep).length - 1;
    
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const updatedHtml = rewriteHTMLContent(htmlContent, fileDepth);
    fs.writeFileSync(htmlPath, updatedHtml, 'utf8');
    console.log(`     Success: ${fileRelPath} (depth: ${fileDepth})`);
  });

  // 7. Create redirects for activePath redirects
  if (c.redirects) {
    c.redirects.forEach(red => {
      const redPath = path.join(cPath, red);
      console.log(`  Creating query-preserving redirect at: ${red} -> /${c.name}/`);
      const redirContent = createRedirectHTML(`/${c.name}/`);
      const redDir = path.dirname(redPath);
      fs.mkdirSync(redDir, { recursive: true });
      fs.writeFileSync(redPath, redirContent, 'utf8');
    });
  }

  console.log(`✓ Campaign ${c.name} restructured successfully!`);
});

console.log('\n=== RESTURING & RESTRUCTURING CONCLUÍDOS COM SUCESSO! ===');
