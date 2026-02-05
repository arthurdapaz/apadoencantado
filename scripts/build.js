#!/usr/bin/env node

/**
 * APA do Encantado - Build Toolkit
 * 
 * Este script processa os arquivos fonte em /src e gera
 * artefatos otimizados em /dist para deploy no GitHub Pages.
 * 
 * Funcionalidades:
 * - Minificação de HTML, CSS e JavaScript
 * - Concatenação de arquivos JS em bundle único
 * - Conversão de imagens JPG para WebP (mantendo originais)
 * - Otimização de imagens com compressão
 * - Atualização automática de referências no HTML
 */

const fs = require('fs');
const path = require('path');
const { minify: minifyHTML } = require('html-minifier-terser');
const CleanCSS = require('clean-css');
const { minify: minifyJS } = require('terser');
const sharp = require('sharp');

// Configurações
const CONFIG = {
  srcDir: path.join(__dirname, '..', 'src'),
  distDir: path.join(__dirname, '..', 'dist'),
  
  // Arquivos JS para concatenar (ordem importa!)
  jsFiles: ['droplets.js', 'lightbox.js', 'app.js'],
  jsBundleName: 'bundle.min.js',
  
  // Configurações de minificação HTML
  htmlOptions: {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true,
    minifyCSS: true,
    minifyJS: true,
    sortAttributes: true,
    sortClassName: true
  },
  
  // Configurações de imagem
  imageOptions: {
    webpQuality: 82,
    jpgQuality: 85,
    maxWidth: 1920,
    maxHeight: 1080
  }
};

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`${colors.cyan}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

// Criar diretório se não existir
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Copiar arquivo
function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

// Copiar diretório recursivamente
function copyDir(src, dest, filter = () => true) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (!filter(entry.name, srcPath)) continue;
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, filter);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

// Limpar diretório dist
function cleanDist() {
  logStep('CLEAN', 'Limpando diretório dist/');
  
  if (fs.existsSync(CONFIG.distDir)) {
    fs.rmSync(CONFIG.distDir, { recursive: true });
  }
  ensureDir(CONFIG.distDir);
  logSuccess('Diretório dist/ limpo');
}

// Minificar CSS
async function buildCSS() {
  logStep('CSS', 'Minificando arquivos CSS');
  
  const cssDir = path.join(CONFIG.srcDir, 'css');
  const distCssDir = path.join(CONFIG.distDir, 'css');
  ensureDir(distCssDir);
  
  const cleanCSS = new CleanCSS({
    level: 2,
    format: false
  });
  
  let totalOriginal = 0;
  let totalMinified = 0;
  
  const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
  
  for (const file of cssFiles) {
    const srcPath = path.join(cssDir, file);
    const content = fs.readFileSync(srcPath, 'utf8');
    const minified = cleanCSS.minify(content);
    
    if (minified.errors.length > 0) {
      logError(`Erro ao minificar ${file}: ${minified.errors.join(', ')}`);
      continue;
    }
    
    const outName = file.replace('.css', '.min.css');
    const destPath = path.join(distCssDir, outName);
    fs.writeFileSync(destPath, minified.styles);
    
    totalOriginal += content.length;
    totalMinified += minified.styles.length;
    
    const savings = ((1 - minified.styles.length / content.length) * 100).toFixed(1);
    logSuccess(`${file} → ${outName} (${savings}% menor)`);
  }
  
  const totalSavings = ((1 - totalMinified / totalOriginal) * 100).toFixed(1);
  log(`   Total CSS: ${(totalOriginal / 1024).toFixed(1)}KB → ${(totalMinified / 1024).toFixed(1)}KB (${totalSavings}% menor)`, 'yellow');
}

// Concatenar e minificar JavaScript
async function buildJS() {
  logStep('JS', 'Concatenando e minificando JavaScript');
  
  const jsDir = path.join(CONFIG.srcDir, 'js');
  const distJsDir = path.join(CONFIG.distDir, 'js');
  ensureDir(distJsDir);
  
  // Concatenar arquivos na ordem especificada
  let concatenated = '';
  let totalOriginal = 0;
  
  for (const file of CONFIG.jsFiles) {
    const filePath = path.join(jsDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      concatenated += `\n// === ${file} ===\n${content}\n`;
      totalOriginal += content.length;
      logSuccess(`Incluído: ${file}`);
    } else {
      logError(`Arquivo não encontrado: ${file}`);
    }
  }
  
  // Minificar bundle
  const minified = await minifyJS(concatenated, {
    compress: {
      drop_console: false, // Manter console.log para debug se necessário
      drop_debugger: true,
      pure_funcs: ['console.debug']
    },
    mangle: true,
    format: {
      comments: false
    }
  });
  
  if (minified.error) {
    logError(`Erro ao minificar JS: ${minified.error}`);
    return;
  }
  
  const destPath = path.join(distJsDir, CONFIG.jsBundleName);
  fs.writeFileSync(destPath, minified.code);
  
  const savings = ((1 - minified.code.length / totalOriginal) * 100).toFixed(1);
  log(`   Bundle: ${(totalOriginal / 1024).toFixed(1)}KB → ${(minified.code.length / 1024).toFixed(1)}KB (${savings}% menor)`, 'yellow');
}

// Processar imagens
async function buildImages() {
  logStep('IMAGES', 'Otimizando imagens e gerando WebP');
  
  const imgDir = path.join(CONFIG.srcDir, 'images');
  const distImgDir = path.join(CONFIG.distDir, 'images');
  
  await processImagesInDir(imgDir, distImgDir);
}

async function processImagesInDir(srcDir, destDir) {
  ensureDir(destDir);
  
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    
    if (entry.isDirectory()) {
      await processImagesInDir(srcPath, destPath);
      continue;
    }
    
    const ext = path.extname(entry.name).toLowerCase();
    
    if (['.jpg', '.jpeg'].includes(ext)) {
      try {
        // Otimizar JPG original
        const image = sharp(srcPath);
        const metadata = await image.metadata();
        
        // Redimensionar se muito grande
        let resizeOptions = {};
        if (metadata.width > CONFIG.imageOptions.maxWidth) {
          resizeOptions.width = CONFIG.imageOptions.maxWidth;
        }
        
        // Salvar JPG otimizado
        await image
          .resize(resizeOptions)
          .jpeg({ quality: CONFIG.imageOptions.jpgQuality, mozjpeg: true })
          .toFile(destPath);
        
        // Gerar versão WebP
        const webpPath = destPath.replace(/\.(jpg|jpeg)$/i, '.webp');
        await sharp(srcPath)
          .resize(resizeOptions)
          .webp({ quality: CONFIG.imageOptions.webpQuality })
          .toFile(webpPath);
        
        const originalSize = fs.statSync(srcPath).size;
        const jpgSize = fs.statSync(destPath).size;
        const webpSize = fs.statSync(webpPath).size;
        
        const jpgSavings = ((1 - jpgSize / originalSize) * 100).toFixed(0);
        const webpSavings = ((1 - webpSize / originalSize) * 100).toFixed(0);
        
        logSuccess(`${entry.name} → JPG(${jpgSavings}%) + WebP(${webpSavings}%)`);
      } catch (err) {
        logError(`Erro ao processar ${entry.name}: ${err.message}`);
        // Fallback: copiar original
        copyFile(srcPath, destPath);
      }
    } else if (['.png', '.svg', '.webp', '.gif'].includes(ext)) {
      // Copiar outros formatos sem modificar
      copyFile(srcPath, destPath);
      logSuccess(`${entry.name} (copiado)`);
    } else if (['.mp4', '.webm', '.mov'].includes(ext)) {
      // Copiar vídeos na pasta de imagens
      copyFile(srcPath, destPath);
      logSuccess(`${entry.name} (vídeo copiado)`);
    }
  }
}

// Processar vídeos (copiar sem modificar)
async function buildVideos() {
  logStep('VIDEO', 'Copiando arquivos de vídeo');
  
  const videoDir = path.join(CONFIG.srcDir, 'video');
  const distVideoDir = path.join(CONFIG.distDir, 'video');
  
  if (fs.existsSync(videoDir)) {
    copyDir(videoDir, distVideoDir);
    const files = fs.readdirSync(distVideoDir);
    logSuccess(`${files.length} arquivos de vídeo copiados`);
  }
}

// Minificar HTML e atualizar referências
async function buildHTML() {
  logStep('HTML', 'Minificando HTML e atualizando referências');
  
  const srcPath = path.join(CONFIG.srcDir, 'index.html');
  let html = fs.readFileSync(srcPath, 'utf8');
  
  // Atualizar referências CSS para versões minificadas
  html = html.replace(/href="css\/styles\.css"/g, 'href="css/styles.min.css"');
  html = html.replace(/href="css\/animations\.css"/g, 'href="css/animations.min.css"');
  
  // Substituir múltiplos scripts JS por bundle único
  // Remover scripts individuais
  html = html.replace(/<script src="js\/droplets\.js"><\/script>\s*/g, '');
  html = html.replace(/<script src="js\/lightbox\.js"><\/script>\s*/g, '');
  html = html.replace(/<script src="js\/app\.js"><\/script>/g, `<script src="js/${CONFIG.jsBundleName}"></script>`);
  
  // Atualizar referências de imagens para usar <picture> com WebP
  html = updateImageReferences(html);
  
  // Minificar HTML
  const minified = await minifyHTML(html, CONFIG.htmlOptions);
  
  const destPath = path.join(CONFIG.distDir, 'index.html');
  fs.writeFileSync(destPath, minified);
  
  const savings = ((1 - minified.length / html.length) * 100).toFixed(1);
  logSuccess(`index.html minificado (${savings}% menor)`);
}

// Atualizar referências de imagens para usar WebP com fallback
function updateImageReferences(html) {
  // Pattern para encontrar tags img com src JPG
  const imgPattern = /<img([^>]*?)src="(images\/[^"]+\.(?:jpg|jpeg))"([^>]*?)>/gi;
  
  html = html.replace(imgPattern, (match, before, src, after) => {
    const webpSrc = src.replace(/\.(jpg|jpeg)$/i, '.webp');
    
    // Extrair atributos existentes
    const altMatch = (before + after).match(/alt="([^"]*)"/);
    const alt = altMatch ? altMatch[1] : '';
    const loadingMatch = (before + after).match(/loading="([^"]*)"/);
    const loading = loadingMatch ? ` loading="${loadingMatch[1]}"` : '';
    
    // Manter outros atributos (class, etc)
    const classMatch = (before + after).match(/class="([^"]*)"/);
    const classAttr = classMatch ? ` class="${classMatch[1]}"` : '';
    
    return `<picture>
      <source srcset="${webpSrc}" type="image/webp">
      <img src="${src}" alt="${alt}"${loading}${classAttr}>
    </picture>`;
  });
  
  return html;
}

// Copiar arquivos estáticos
async function copyStaticFiles() {
  logStep('STATIC', 'Copiando arquivos estáticos');
  
  const staticFiles = [
    'CNAME',
    'robots.txt',
    'sitemap.xml',
    'favicon.svg',
    'googleea809f6d4c5446fa.html'
  ];
  
  for (const file of staticFiles) {
    const srcPath = path.join(CONFIG.srcDir, file);
    const destPath = path.join(CONFIG.distDir, file);
    
    if (fs.existsSync(srcPath)) {
      copyFile(srcPath, destPath);
      logSuccess(`${file} copiado`);
    }
  }
}

// Gerar relatório final
function generateReport() {
  logStep('REPORT', 'Gerando relatório de build');
  
  const distDir = CONFIG.distDir;
  let totalSize = 0;
  
  function calculateSize(dir) {
    let size = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        size += calculateSize(fullPath);
      } else {
        size += fs.statSync(fullPath).size;
      }
    }
    return size;
  }
  
  totalSize = calculateSize(distDir);
  
  console.log('\n' + '='.repeat(50));
  log('📦 BUILD COMPLETO!', 'green');
  console.log('='.repeat(50));
  log(`   Diretório: ${distDir}`, 'cyan');
  log(`   Tamanho total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`, 'cyan');
  console.log('='.repeat(50) + '\n');
}

// Executar build completo
async function build() {
  console.log('\n' + '='.repeat(50));
  log('🌿 APA do Encantado - Build Toolkit', 'green');
  console.log('='.repeat(50) + '\n');
  
  const startTime = Date.now();
  
  try {
    cleanDist();
    await buildCSS();
    await buildJS();
    await buildImages();
    await buildVideos();
    await buildHTML();
    await copyStaticFiles();
    generateReport();
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`⏱️  Tempo total: ${elapsed}s\n`, 'yellow');
  } catch (error) {
    logError(`Build falhou: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Executar
build();
