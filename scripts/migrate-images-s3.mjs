import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const ESTABLISHMENT_ID = 210017;

// Storage config from env
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/+$/, '');
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.error('Missing BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY');
  process.exit(1);
}

async function uploadToS3(fileBuffer, relKey, contentType) {
  const uploadUrl = new URL('v1/storage/upload', FORGE_API_URL + '/');
  uploadUrl.searchParams.set('path', relKey);
  
  const blob = new Blob([fileBuffer], { type: contentType });
  const form = new FormData();
  form.append('file', blob, relKey.split('/').pop());
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${FORGE_API_KEY}` },
    body: form,
  });
  
  if (!response.ok) {
    const msg = await response.text().catch(() => response.statusText);
    throw new Error(`Upload failed (${response.status}): ${msg}`);
  }
  
  const result = await response.json();
  return result.url;
}

async function downloadImage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || 'image/png';
  return { buffer, contentType };
}

async function migrate() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log(`\n=== Migração de Imagens para S3 (Estabelecimento ${ESTABLISHMENT_ID}) ===\n`);
  
  // Get all products with images
  const [products] = await conn.execute(
    'SELECT id, name, images FROM products WHERE establishmentId = ? AND images IS NOT NULL',
    [ESTABLISHMENT_ID]
  );
  
  console.log(`Encontrados ${products.length} produtos com imagens\n`);
  
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const product of products) {
    let images;
    try {
      images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
    } catch {
      console.log(`⚠️  Produto ${product.id} "${product.name}" - JSON inválido, pulando`);
      skipped++;
      continue;
    }
    
    if (!Array.isArray(images) || images.length === 0) {
      skipped++;
      continue;
    }
    
    const newImages = [];
    let changed = false;
    
    for (const imgUrl of images) {
      // Skip if already on S3 (not Google Storage)
      if (!imgUrl.includes('storage.googleapis.com')) {
        newImages.push(imgUrl);
        continue;
      }
      
      try {
        // Download from Google Storage
        const { buffer, contentType } = await downloadImage(imgUrl);
        
        // Generate unique key for S3
        const hash = crypto.randomBytes(6).toString('hex');
        const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
        const safeName = product.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const s3Key = `products/${ESTABLISHMENT_ID}/${safeName}_${hash}.${ext}`;
        
        // Upload to S3
        const s3Url = await uploadToS3(buffer, s3Key, contentType);
        newImages.push(s3Url);
        changed = true;
        
        console.log(`✅ ${product.name} → ${s3Url}`);
      } catch (err) {
        console.log(`❌ ${product.name} - Erro: ${err.message}`);
        newImages.push(imgUrl); // Keep original URL on failure
        failed++;
      }
    }
    
    if (changed) {
      // Update product images in database
      await conn.execute(
        'UPDATE products SET images = ? WHERE id = ?',
        [JSON.stringify(newImages), product.id]
      );
      success++;
    }
  }
  
  console.log(`\n=== Migração de Imagens Concluída! ===`);
  console.log(`✅ ${success} produtos atualizados com sucesso`);
  console.log(`❌ ${failed} falhas`);
  console.log(`⏭️  ${skipped} pulados (sem imagem válida)\n`);
  
  await conn.end();
}

migrate().catch(err => {
  console.error('Erro na migração:', err);
  process.exit(1);
});
