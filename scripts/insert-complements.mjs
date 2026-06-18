import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // Buscar produto X-Tudo
  const [products] = await connection.execute(
    "SELECT id, name FROM products WHERE name LIKE '%X%Tudo%' OR name LIKE '%x-tudo%' OR name LIKE '%xtudo%' OR name = 'X Tudo' OR name = 'X-Tudo' LIMIT 5"
  );
  
  console.log('Produtos encontrados:', products);
  
  if (products.length === 0) {
    // Buscar qualquer produto para adicionar complementos
    const [allProducts] = await connection.execute(
      "SELECT id, name FROM products LIMIT 10"
    );
    console.log('Todos os produtos:', allProducts);
    
    if (allProducts.length > 0) {
      const productId = allProducts[0].id;
      console.log('Usando produto:', allProducts[0].name, 'ID:', productId);
      
      // Inserir grupos de complementos
      await insertComplements(connection, productId);
    }
  } else {
    const productId = products[0].id;
    console.log('Usando produto X-Tudo:', products[0].name, 'ID:', productId);
    
    // Inserir grupos de complementos
    await insertComplements(connection, productId);
  }
  
  await connection.end();
}

async function insertComplements(connection, productId) {
  // Verificar se já existem complementos
  const [existing] = await connection.execute(
    "SELECT id FROM complementGroups WHERE productId = ?",
    [productId]
  );
  
  if (existing.length > 0) {
    console.log('Complementos já existem para este produto');
    return;
  }
  
  // Grupo 1: Adicionais (múltipla escolha)
  const [group1Result] = await connection.execute(
    "INSERT INTO complementGroups (productId, name, minQuantity, maxQuantity, isRequired, sortOrder) VALUES (?, ?, ?, ?, ?, ?)",
    [productId, 'Adicionais', 0, 5, false, 1]
  );
  const group1Id = group1Result.insertId;
  console.log('Grupo Adicionais criado, ID:', group1Id);
  
  // Itens do grupo Adicionais
  await connection.execute(
    "INSERT INTO complementItems (groupId, name, price, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)",
    [group1Id, 'Bacon extra', '3.00', true, 1]
  );
  await connection.execute(
    "INSERT INTO complementItems (groupId, name, price, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)",
    [group1Id, 'Queijo extra', '2.50', true, 2]
  );
  await connection.execute(
    "INSERT INTO complementItems (groupId, name, price, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)",
    [group1Id, 'Ovo extra', '2.00', true, 3]
  );
  await connection.execute(
    "INSERT INTO complementItems (groupId, name, price, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)",
    [group1Id, 'Cebola caramelizada', '2.00', true, 4]
  );
  console.log('Itens do grupo Adicionais criados');
  
  // Grupo 2: Ponto da carne (escolha única, obrigatório)
  const [group2Result] = await connection.execute(
    "INSERT INTO complementGroups (productId, name, minQuantity, maxQuantity, isRequired, sortOrder) VALUES (?, ?, ?, ?, ?, ?)",
    [productId, 'Ponto da carne', 1, 1, true, 2]
  );
  const group2Id = group2Result.insertId;
  console.log('Grupo Ponto da carne criado, ID:', group2Id);
  
  // Itens do grupo Ponto da carne
  await connection.execute(
    "INSERT INTO complementItems (groupId, name, price, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)",
    [group2Id, 'Mal passado', '0.00', true, 1]
  );
  await connection.execute(
    "INSERT INTO complementItems (groupId, name, price, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)",
    [group2Id, 'Ao ponto', '0.00', true, 2]
  );
  await connection.execute(
    "INSERT INTO complementItems (groupId, name, price, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)",
    [group2Id, 'Bem passado', '0.00', true, 3]
  );
  console.log('Itens do grupo Ponto da carne criados');
  
  // Grupo 3: Bebida (opcional)
  const [group3Result] = await connection.execute(
    "INSERT INTO complementGroups (productId, name, minQuantity, maxQuantity, isRequired, sortOrder) VALUES (?, ?, ?, ?, ?, ?)",
    [productId, 'Adicionar bebida', 0, 1, false, 3]
  );
  const group3Id = group3Result.insertId;
  console.log('Grupo Adicionar bebida criado, ID:', group3Id);
  
  // Itens do grupo Bebida
  await connection.execute(
    "INSERT INTO complementItems (groupId, name, price, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)",
    [group3Id, 'Coca-Cola Lata', '5.00', true, 1]
  );
  await connection.execute(
    "INSERT INTO complementItems (groupId, name, price, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)",
    [group3Id, 'Guaraná Lata', '5.00', true, 2]
  );
  await connection.execute(
    "INSERT INTO complementItems (groupId, name, price, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)",
    [group3Id, 'Suco Natural', '7.00', true, 3]
  );
  console.log('Itens do grupo Adicionar bebida criados');
  
  console.log('Todos os complementos inseridos com sucesso!');
}

main().catch(console.error);
