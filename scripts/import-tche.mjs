import { storagePut } from './server/storage.ts';

// This script imports the Tche Restaurante menu data into establishment 210007
// It downloads images from Google Storage, uploads to our S3, and inserts into DB

import mysql from 'mysql2/promise';

const ESTABLISHMENT_ID = 210007;

// Profile and cover images from the public menu
const PROFILE_IMAGE = 'https://storage.googleapis.com/mindi-static/f1bce43e40cd-logo.png';
const COVER_IMAGE = 'https://storage.googleapis.com/mindi-static/bec37fb6521b-coverImage.png';

// Menu items data
const CATEGORIES = [
  { name: 'BEBIDA', sortOrder: 0 },
  { name: 'MARMITEX', sortOrder: 1 },
];

const PRODUCTS = [
  // BEBIDA category
  {
    category: 'BEBIDA',
    name: 'Refri lata 220ml',
    description: 'Descartável - Coca-Cola zero,coca-cola',
    price: '4.00',
    imageUrl: 'https://storage.googleapis.com/mindi-static/3a6cb865cd15-Refri%20lata%20220ml.png',
    sortOrder: 0,
  },
  {
    category: 'BEBIDA',
    name: 'Refri lata 310ml',
    description: 'Coca-Cola, coca-cola zero, citrus, tônica, kuat, sprite, fanta laranja, fanta uva',
    price: '6.00',
    imageUrl: 'https://storage.googleapis.com/mindi-static/0f54f69d8ff5-Refri%20lata%20310ml.png',
    sortOrder: 1,
  },
  {
    category: 'BEBIDA',
    name: 'Refri 600ml',
    description: 'Descartável - Fanta Laranja, Coca-Cola, guaraná Antártica, coca-cola zero',
    price: '8.00',
    imageUrl: 'https://storage.googleapis.com/mindi-static/90a769fc72ba-Refri%20600ml.png',
    sortOrder: 2,
  },
  {
    category: 'BEBIDA',
    name: 'Refri 1L',
    description: 'Descartável - coca cola, fanta uva, sprite, fanta laranja, guaraná Antártica, Coca-Cola zero',
    price: '10.00',
    imageUrl: 'https://storage.googleapis.com/mindi-static/997f990d12b3-Refri%201L.png',
    sortOrder: 3,
  },
  {
    category: 'BEBIDA',
    name: 'Refri 1,5L',
    description: 'Descartável - coca cola tradicional',
    price: '11.00',
    imageUrl: 'https://storage.googleapis.com/mindi-static/09dec6dc2476-Refri%201,5L.png',
    sortOrder: 4,
  },
  {
    category: 'BEBIDA',
    name: 'Refrigerante 2 litros',
    description: 'Descartável - Coca-Cola, coca-cola zero, fanta laranja, guaraná Antártica, sprite',
    price: '12.00',
    imageUrl: 'https://storage.googleapis.com/mindi-static/32cdc0a9fb55-Refrigerante%202%20litros%20%20.png',
    sortOrder: 5,
  },
  {
    category: 'BEBIDA',
    name: 'Suco Del vale 1 litro',
    description: 'Descartável - Caju, Uva, Pêssego',
    price: '12.00',
    imageUrl: 'https://storage.googleapis.com/mindi-static/938d8ca55673-Suco%20Del%20vale%201%20litro%20%20.png',
    sortOrder: 6,
  },
  {
    category: 'BEBIDA',
    name: 'Suco Natural de Limão 450ml',
    description: 'Suco natural de Limão 450ml **com gelo e açúcar',
    price: '10.00',
    imageUrl: 'https://storage.googleapis.com/mindi-static/654631400363-Suco%20Natural%20de%20Lim%C3%A3o.png',
    sortOrder: 7,
  },
  {
    category: 'BEBIDA',
    name: 'Água 500ml',
    description: 'Água sem gás 500ml ou com gás 500ml',
    price: '4.00',
    imageUrl: 'https://storage.googleapis.com/mindi-static/c0107f40b7a5-%C3%81gua%20500ml.png',
    sortOrder: 8,
  },
  {
    category: 'BEBIDA',
    name: 'Suco natural de laranja - 450ml',
    description: 'Suco natural de laranja 450ml **com gelo e açúcar',
    price: '10.00',
    imageUrl: 'https://storage.googleapis.com/mindi-static/f5a6b8d5156c-Suco%20natural%20de%20laranja%20-%20450ml.png',
    sortOrder: 9,
  },
  // MARMITEX category
  {
    category: 'MARMITEX',
    name: 'Marmitex Padrão da casa',
    description: 'Acompanha arroz branco soltinho, feijão de caldo, massa saborosa, frituras crocantes, legumes cozidos no ponto certo e verduras fresquinhas. No churrasco, saboreie uma seleção especial de carne vermelha (coxão mole), carne branca (pernil suíno ou frango) e linguiça, tudo preparado com aquele sabor irresistível da brasa! Prato generoso de 700g a 850g – sabor, qualidade e fartura em cada garfada!',
    price: '23.00',
    imageUrl: null,
    sortOrder: 0,
  },
  {
    category: 'MARMITEX',
    name: 'Marmitex Especial',
    description: 'Acompanha arroz branco soltinho, feijão de caldo, massa saborosa, frituras crocantes, legumes cozidos no ponto certo e verduras fresquinhas. No churrasco, saboreie uma seleção especial de carne vermelha (coxão mole), carne branca (pernil suíno ou frango) e linguiça, tudo preparado com aquele sabor irresistível da brasa! Prato generoso – sabor, qualidade e fartura em cada garfada!',
    price: '40.00',
    imageUrl: null,
    sortOrder: 1,
  },
  {
    category: 'MARMITEX',
    name: 'Marmitex Padrão da casa sem arroz',
    description: 'Acompanha massa saborosa, feijão tropeiro, frituras crocantes, legumes cozidos no ponto certo e verduras fresquinhas. No churrasco, saboreie uma seleção especial de carne vermelha (coxão mole), carne branca (pernil suíno ou frango) e linguiça, tudo preparado com aquele sabor irresistível da brasa!',
    price: '28.00',
    imageUrl: null,
    sortOrder: 2,
  },
  {
    category: 'MARMITEX',
    name: 'Marmitex Especial sem arroz',
    description: 'Acompanha massa saborosa, feijão tropeiro, frituras crocantes, legumes cozidos no ponto certo e verduras fresquinhas. No churrasco, saboreie uma seleção especial de carne vermelha (coxão mole), carne branca (pernil suíno ou frango) e linguiça, tudo preparado com aquele sabor irresistível da brasa!',
    price: '45.00',
    imageUrl: null,
    sortOrder: 3,
  },
  {
    category: 'MARMITEX',
    name: 'Marmitex fitnes',
    description: '🍗 Filé de frango assado na brasa, suculento e cheio de sabor! Acompanha arroz branco soltinho, feijão de caldo, salada fresca e legumes cozidos no ponto certo. Uma refeição leve, nutritiva e deliciosa!',
    price: '28.00',
    imageUrl: 'https://storage.googleapis.com/mindi-static/3ebe45df579b-Marmitex%20fitnes.png',
    sortOrder: 4,
  },
];

async function downloadImage(url) {
  console.log(`  Downloading: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'image/png';
  return { buffer, contentType };
}

async function uploadToS3(buffer, contentType, fileName) {
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const key = `${ESTABLISHMENT_ID}/products/${fileName}-${randomSuffix}.png`;
  console.log(`  Uploading to S3: ${key}`);
  const { url } = await storagePut(key, buffer, contentType);
  console.log(`  ✅ Uploaded: ${url}`);
  return url;
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const connection = await mysql.createConnection(dbUrl);
  console.log('Connected to database');

  try {
    // 1. Update profile and cover images
    console.log('\n=== Updating profile and cover images ===');
    // Download and upload profile image
    let profileUrl = null;
    let coverUrl = null;
    
    try {
      const profileData = await downloadImage(PROFILE_IMAGE);
      profileUrl = await uploadToS3(profileData.buffer, profileData.contentType, 'tche-profile');
    } catch (e) {
      console.log('  ⚠️ Could not download profile image, will use original URL');
      profileUrl = PROFILE_IMAGE;
    }
    
    try {
      const coverData = await downloadImage(COVER_IMAGE);
      coverUrl = await uploadToS3(coverData.buffer, coverData.contentType, 'tche-cover');
    } catch (e) {
      console.log('  ⚠️ Could not download cover image, will use original URL');
      coverUrl = COVER_IMAGE;
    }

    // Update establishment
    await connection.execute(
      'UPDATE establishments SET logo = ?, coverImage = ? WHERE id = ?',
      [profileUrl, coverUrl, ESTABLISHMENT_ID]
    );
    console.log('✅ Establishment images updated');

    // 2. Create categories
    console.log('\n=== Creating categories ===');
    const categoryIds = {};
    for (const cat of CATEGORIES) {
      const [result] = await connection.execute(
        'INSERT INTO categories (establishmentId, name, sortOrder, isActive) VALUES (?, ?, ?, true)',
        [ESTABLISHMENT_ID, cat.name, cat.sortOrder]
      );
      categoryIds[cat.name] = result.insertId;
      console.log(`✅ Category "${cat.name}" created with ID ${result.insertId}`);
    }

    // 3. Create products
    console.log('\n=== Creating products ===');
    for (const product of PRODUCTS) {
      let imageUrls = null;
      
      if (product.imageUrl) {
        try {
          const imgData = await downloadImage(product.imageUrl);
          const s3Url = await uploadToS3(imgData.buffer, imgData.contentType, product.name.replace(/[^a-zA-Z0-9]/g, '-'));
          imageUrls = JSON.stringify([s3Url]);
        } catch (e) {
          console.log(`  ⚠️ Could not download image for "${product.name}", using original URL`);
          imageUrls = JSON.stringify([product.imageUrl]);
        }
      }

      const categoryId = categoryIds[product.category];
      const [result] = await connection.execute(
        'INSERT INTO products (establishmentId, categoryId, name, description, price, images, status, sortOrder) VALUES (?, ?, ?, ?, ?, ?, "active", ?)',
        [ESTABLISHMENT_ID, categoryId, product.name, product.description, product.price, imageUrls, product.sortOrder]
      );
      console.log(`✅ Product "${product.name}" created with ID ${result.insertId} (category: ${product.category})`);
    }

    console.log('\n=== Import complete! ===');
    console.log(`Categories created: ${CATEGORIES.length}`);
    console.log(`Products created: ${PRODUCTS.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

main();
