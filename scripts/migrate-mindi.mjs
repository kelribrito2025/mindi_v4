import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

const ESTABLISHMENT_ID = 210001;

// Ler dados do Mindi
const data = JSON.parse(readFileSync('/home/ubuntu/mindi_data.json', 'utf-8'));
const menu = data.menu || [];

// Conectar ao banco
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL não encontrada');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

console.log('Conectado ao banco de dados');

try {
  // Processar categorias
  let catOrder = 0;
  let totalProducts = 0;
  let totalGroups = 0;
  let totalItems = 0;

  for (const catData of menu) {
    const catName = (catData.nameShow || '').trim();
    if (!catName) continue;
    
    const itens = catData.itens || [];
    if (!itens.length) continue;
    
    catOrder++;
    const isActive = catData.is_active !== false;
    
    // Inserir categoria
    const [catResult] = await connection.execute(
      'INSERT INTO categories (establishmentId, name, sortOrder, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [ESTABLISHMENT_ID, catName, catOrder, isActive ? 1 : 0]
    );
    const catId = catResult.insertId;
    console.log(`Categoria: ${catName} (ID: ${catId}, ${itens.length} produtos)`);
    
    // Processar produtos
    let prodOrder = 0;
    for (const item of itens) {
      prodOrder++;
      const prodName = (item.printDescription || item.name || '').trim();
      if (!prodName) continue;
      
      const prodDesc = (item.details || '').trim();
      
      // Preço
      const priceData = item.price || {};
      const actualPrice = typeof priceData === 'object' ? (priceData.actualPrice || 0) : (priceData || 0);
      
      // Imagens
      const pictures = item.pictures || [];
      const imagesJson = pictures.length > 0 ? JSON.stringify(pictures) : null;
      
      // Status
      const isActiveProd = item.is_active !== false;
      const status = isActiveProd ? 'active' : 'paused';
      
      // Inserir produto
      const [prodResult] = await connection.execute(
        'INSERT INTO products (establishmentId, categoryId, name, description, price, images, status, hasStock, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, NOW(), NOW())',
        [ESTABLISHMENT_ID, catId, prodName, prodDesc || null, actualPrice, imagesJson, status, prodOrder]
      );
      const prodId = prodResult.insertId;
      totalProducts++;
      
      // Processar grupos de complementos
      const groups = item.groups || [];
      let grpOrder = 0;
      for (const grp of groups) {
        grpOrder++;
        let grpName = (grp.printDescription || grp.name || '').trim();
        if (!grpName) grpName = `Complemento ${grpOrder}`;
        
        const grpItens = grp.itens || [];
        if (!grpItens.length) continue;
        
        let minSel = grp.minSelection || 0;
        let maxSel = grp.maxSelection || 0;
        const isRequired = grp.required || false;
        
        // Se max é 0, usar o total de itens
        if (maxSel === 0) maxSel = grpItens.length;
        if (minSel === 0 && isRequired) minSel = 1;
        
        // Inserir grupo
        const [grpResult] = await connection.execute(
          'INSERT INTO complementGroups (productId, name, minQuantity, maxQuantity, isRequired, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [prodId, grpName, minSel, maxSel, isRequired ? 1 : 0, grpOrder]
        );
        const grpId = grpResult.insertId;
        totalGroups++;
        
        // Processar itens do grupo
        let itemOrder = 0;
        for (const gi of grpItens) {
          itemOrder++;
          const giName = (gi.printDescription || gi.name || '').trim();
          if (!giName) continue;
          
          const giIsActive = gi.is_active !== false;
          
          const giPriceData = gi.price || {};
          const giPrice = typeof giPriceData === 'object' ? (giPriceData.actualPrice || 0) : (giPriceData || 0);
          
          const giPics = gi.pictures || [];
          const giImage = giPics.length > 0 ? giPics[0] : null;
          
          await connection.execute(
            'INSERT INTO complementItems (groupId, name, price, imageUrl, isActive, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [grpId, giName, giPrice, giImage, giIsActive ? 1 : 0, itemOrder]
          );
          totalItems++;
        }
      }
    }
  }
  
  console.log('\n=== Migração concluída ===');
  console.log(`Categorias: ${catOrder}`);
  console.log(`Produtos: ${totalProducts}`);
  console.log(`Grupos de complementos: ${totalGroups}`);
  console.log(`Itens de complemento: ${totalItems}`);
  
} catch (error) {
  console.error('Erro na migração:', error);
  throw error;
} finally {
  await connection.end();
  console.log('Conexão fechada');
}
