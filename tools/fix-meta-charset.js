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

campaigns.forEach(slug => {
  const folderPath = path.join(rootDir, slug);
  if (!fs.existsSync(folderPath)) return;

  const htmlFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.html'));
  
  htmlFiles.forEach(file => {
    const filePath = path.join(folderPath, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if <head> exists
    const headIndex = content.toLowerCase().indexOf('<head>');
    if (headIndex === -1) return;
    
    // 1. Remove any existing <meta charset="..."> tags
    content = content.replace(/<meta\s+charset=["']?utf-8["']?\s*\/?>/gi, '');
    
    // 2. Remove any existing <meta name="viewport" ...> tags
    content = content.replace(/<meta\s+name=["']?viewport["']?\s+content=["'][^"']*["']\s*\/?>/gi, '');
    
    // 3. Inject them immediately after <head>
    const headTagEnd = headIndex + 6;
    const injectStr = `\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">`;
    
    content = content.substring(0, headTagEnd) + injectStr + content.substring(headTagEnd);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Ensured <meta charset="UTF-8"> is at the top of <head> in ${slug}/${file}`);
  });
});
