// Script para migrar imagens do CloudFront antigo para o S3 próprio
// Execução: node scripts/migrate-images.mjs

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import mysql from 'mysql2/promise';

// Configuração do S3
const s3Client = new S3Client({
  region: process.env.MINDI_S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINDI_S3_ACCESS_KEY || '',
    secretAccessKey: process.env.MINDI_S3_SECRET_KEY || '',
  },
});

const BUCKET = process.env.MINDI_S3_BUCKET || '';
const REGION = process.env.MINDI_S3_REGION || 'us-east-1';
const OLD_CLOUDFRONT_DOMAIN = 'd2xsxph8kpxj0f.cloudfront.net';

// Função para gerar URL pública do S3
function getPublicUrl(key) {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

// Função para fazer download de uma imagem
async function downloadImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`  ⚠️  Imagem não acessível (${response.status}): ${url}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return { buffer: Buffer.from(arrayBuffer), contentType };
  } catch (error) {
    console.log(`  ❌ Erro ao baixar imagem: ${error.message}`);
    return null;
  }
}

// Função para fazer upload para o S3
async function uploadToS3(buffer, key, contentType) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return getPublicUrl(key);
}

// Função para extrair extensão da URL
function getExtensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'jpg';
  } catch {
    return 'jpg';
  }
}

async function main() {
  console.log('🚀 Iniciando migração de imagens para S3 próprio...\n');
  
  // Verificar credenciais
  if (!BUCKET || !process.env.MINDI_S3_ACCESS_KEY || !process.env.MINDI_S3_SECRET_KEY) {
    console.error('❌ Credenciais S3 não configuradas!');
    console.error('Configure: MINDI_S3_BUCKET, MINDI_S3_ACCESS_KEY, MINDI_S3_SECRET_KEY');
    process.exit(1);
  }
  
  console.log(`📦 Bucket: ${BUCKET}`);
  console.log(`🌍 Região: ${REGION}\n`);
  
  // Conectar ao banco
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Buscar todos os produtos com imagens do CloudFront antigo
  const [products] = await connection.execute(`
    SELECT id, name, images 
    FROM products 
    WHERE images IS NOT NULL 
      AND images != '[]' 
      AND images != 'null'
      AND images LIKE '%${OLD_CLOUDFRONT_DOMAIN}%'
  `);
  
  console.log(`📸 Produtos com imagens do CloudFront antigo: ${products.length}\n`);
  
  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const product of products) {
    console.log(`\n📦 Produto #${product.id}: ${product.name}`);
    
    let images = [];
    try {
      images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
    } catch {
      console.log('  ⚠️  JSON inválido, pulando...');
      skipped++;
      continue;
    }
    
    if (!Array.isArray(images) || images.length === 0) {
      console.log('  ⚠️  Sem imagens, pulando...');
      skipped++;
      continue;
    }
    
    const newImages = [];
    let hasChanges = false;
    
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      
      // Verificar se já está no nosso S3
      if (imageUrl && imageUrl.includes(BUCKET)) {
        console.log(`  ✅ Imagem ${i + 1} já está no S3 próprio`);
        newImages.push(imageUrl);
        continue;
      }
      
      // Verificar se é do CloudFront problemático
      if (imageUrl && imageUrl.includes(OLD_CLOUDFRONT_DOMAIN)) {
        console.log(`  🔄 Migrando imagem ${i + 1} do CloudFront...`);
        
        // Tentar baixar a imagem
        const imageData = await downloadImage(imageUrl);
        
        if (!imageData) {
          console.log(`  ❌ Não foi possível baixar, mantendo URL original`);
          newImages.push(imageUrl);
          failed++;
          continue;
        }
        
        // Fazer upload para o novo S3
        const ext = getExtensionFromUrl(imageUrl);
        const key = `products/${product.id}/image_${i + 1}_${Date.now()}.${ext}`;
        
        try {
          const newUrl = await uploadToS3(imageData.buffer, key, imageData.contentType);
          console.log(`  ✅ Migrada para: ${newUrl}`);
          newImages.push(newUrl);
          hasChanges = true;
          migrated++;
        } catch (error) {
          console.log(`  ❌ Erro no upload: ${error.message}`);
          newImages.push(imageUrl);
          failed++;
        }
      } else {
        // URL de outro domínio, manter como está
        newImages.push(imageUrl);
      }
    }
    
    // Atualizar no banco se houve mudanças
    if (hasChanges) {
      await connection.execute(
        'UPDATE products SET images = ? WHERE id = ?',
        [JSON.stringify(newImages), product.id]
      );
      console.log(`  💾 Banco atualizado!`);
    }
  }
  
  // Migrar também logos e capas dos estabelecimentos
  console.log('\n\n🏪 Migrando imagens de estabelecimentos...\n');
  
  const [establishments] = await connection.execute(`
    SELECT id, name, logo, cover_image 
    FROM establishments 
    WHERE (logo LIKE '%${OLD_CLOUDFRONT_DOMAIN}%' OR cover_image LIKE '%${OLD_CLOUDFRONT_DOMAIN}%')
  `);
  
  console.log(`🏪 Estabelecimentos com imagens do CloudFront: ${establishments.length}\n`);
  
  for (const est of establishments) {
    console.log(`\n🏪 Estabelecimento #${est.id}: ${est.name}`);
    
    let logoUrl = est.logo;
    let coverUrl = est.cover_image;
    let hasChanges = false;
    
    // Migrar logo
    if (logoUrl && logoUrl.includes(OLD_CLOUDFRONT_DOMAIN)) {
      console.log('  🔄 Migrando logo...');
      const imageData = await downloadImage(logoUrl);
      if (imageData) {
        const ext = getExtensionFromUrl(logoUrl);
        const key = `establishments/${est.id}/logo_${Date.now()}.${ext}`;
        try {
          logoUrl = await uploadToS3(imageData.buffer, key, imageData.contentType);
          console.log(`  ✅ Logo migrada: ${logoUrl}`);
          hasChanges = true;
          migrated++;
        } catch (error) {
          console.log(`  ❌ Erro: ${error.message}`);
          failed++;
        }
      } else {
        failed++;
      }
    }
    
    // Migrar capa
    if (coverUrl && coverUrl.includes(OLD_CLOUDFRONT_DOMAIN)) {
      console.log('  🔄 Migrando capa...');
      const imageData = await downloadImage(coverUrl);
      if (imageData) {
        const ext = getExtensionFromUrl(coverUrl);
        const key = `establishments/${est.id}/cover_${Date.now()}.${ext}`;
        try {
          coverUrl = await uploadToS3(imageData.buffer, key, imageData.contentType);
          console.log(`  ✅ Capa migrada: ${coverUrl}`);
          hasChanges = true;
          migrated++;
        } catch (error) {
          console.log(`  ❌ Erro: ${error.message}`);
          failed++;
        }
      } else {
        failed++;
      }
    }
    
    // Atualizar no banco
    if (hasChanges) {
      await connection.execute(
        'UPDATE establishments SET logo = ?, cover_image = ? WHERE id = ?',
        [logoUrl, coverUrl, est.id]
      );
      console.log('  💾 Banco atualizado!');
    }
  }
  
  await connection.end();
  
  console.log('\n\n📊 RESUMO DA MIGRAÇÃO:');
  console.log(`  ✅ Migradas: ${migrated}`);
  console.log(`  ⏭️  Puladas: ${skipped}`);
  console.log(`  ❌ Falhas: ${failed}`);
  console.log('\n🎉 Migração concluída!');
}

main().catch(console.error);
