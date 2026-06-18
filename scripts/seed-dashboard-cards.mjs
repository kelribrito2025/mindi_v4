// Script para inserir dados mockados para os 3 novos cards da dashboard
// Usa conexão direta ao banco via DATABASE_URL
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  // Parse DATABASE_URL
  const url = new URL(DATABASE_URL);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  });

  console.log('Connected to database');

  // Get establishmentId
  const [estRows] = await connection.execute('SELECT id FROM establishments LIMIT 1');
  const establishmentId = estRows[0]?.id;
  if (!establishmentId) {
    console.error('No establishment found');
    process.exit(1);
  }
  console.log(`Establishment ID: ${establishmentId}`);

  // Get max order id and number
  const [maxRows] = await connection.execute('SELECT COALESCE(MAX(id), 0) as maxId FROM orders');
  const startId = maxRows[0].maxId + 1;
  console.log(`Starting from order ID: ${startId}`);

  // Gerar timestamps de hoje (UTC) com diferentes horários
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Produtos variados para o ranking
  const products = [
    { name: 'X-Burger Clássico', price: 28.90, id: 1 },
    { name: 'Combo Casal', price: 65.90, id: 2 },
    { name: 'Batata Frita P', price: 15.90, id: 3 },
    { name: 'Coca-Cola Lata', price: 7.90, id: 4 },
    { name: 'Milkshake Chocolate', price: 18.90, id: 5 },
    { name: 'Smash Duplo', price: 35.90, id: 6 },
    { name: 'X-Tudo', price: 38.90, id: 7 },
    { name: 'Onion Rings', price: 19.90, id: 8 },
    { name: 'Suco Natural', price: 12.90, id: 9 },
    { name: 'Combo Clássico', price: 45.90, id: 10 },
  ];

  // Definir pedidos: variando modalidade, horário, produtos
  const orderDefs = [
    // Pedidos de HOJE - delivery
    { delivery: 'delivery', payment: 'pix', hoursAgo: 1, items: [{ p: 0, qty: 2 }, { p: 3, qty: 2 }] },
    { delivery: 'delivery', payment: 'card', hoursAgo: 2, items: [{ p: 1, qty: 1 }, { p: 4, qty: 1 }] },
    { delivery: 'delivery', payment: 'cash', hoursAgo: 3, items: [{ p: 5, qty: 1 }, { p: 3, qty: 1 }] },
    { delivery: 'delivery', payment: 'pix', hoursAgo: 4, items: [{ p: 6, qty: 1 }, { p: 2, qty: 1 }] },
    { delivery: 'delivery', payment: 'card', hoursAgo: 5, items: [{ p: 0, qty: 1 }, { p: 7, qty: 1 }, { p: 3, qty: 1 }] },
    { delivery: 'delivery', payment: 'pix', hoursAgo: 6, items: [{ p: 9, qty: 1 }] },
    { delivery: 'delivery', payment: 'cash', hoursAgo: 7, items: [{ p: 0, qty: 3 }, { p: 8, qty: 2 }] },
    { delivery: 'delivery', payment: 'card', hoursAgo: 8, items: [{ p: 1, qty: 2 }] },
    // Pedidos de HOJE - pickup
    { delivery: 'pickup', payment: 'pix', hoursAgo: 1.5, items: [{ p: 5, qty: 2 }, { p: 3, qty: 2 }] },
    { delivery: 'pickup', payment: 'card', hoursAgo: 2.5, items: [{ p: 0, qty: 1 }, { p: 4, qty: 1 }] },
    { delivery: 'pickup', payment: 'cash', hoursAgo: 3.5, items: [{ p: 9, qty: 1 }, { p: 8, qty: 1 }] },
    { delivery: 'pickup', payment: 'pix', hoursAgo: 5.5, items: [{ p: 2, qty: 2 }] },
    // Pedidos de HOJE - dine_in
    { delivery: 'dine_in', payment: 'card', hoursAgo: 2, items: [{ p: 6, qty: 2 }, { p: 7, qty: 1 }, { p: 3, qty: 3 }] },
    { delivery: 'dine_in', payment: 'pix', hoursAgo: 4, items: [{ p: 0, qty: 2 }, { p: 5, qty: 1 }, { p: 8, qty: 2 }] },
    { delivery: 'dine_in', payment: 'cash', hoursAgo: 6, items: [{ p: 1, qty: 1 }, { p: 3, qty: 2 }] },
    // Mais pedidos para ter um ranking mais interessante
    { delivery: 'delivery', payment: 'pix', hoursAgo: 9, items: [{ p: 0, qty: 2 }, { p: 2, qty: 1 }] },
    { delivery: 'pickup', payment: 'card', hoursAgo: 10, items: [{ p: 5, qty: 1 }, { p: 4, qty: 2 }] },
    { delivery: 'delivery', payment: 'cash', hoursAgo: 11, items: [{ p: 9, qty: 2 }, { p: 7, qty: 1 }] },
    { delivery: 'dine_in', payment: 'pix', hoursAgo: 12, items: [{ p: 6, qty: 1 }, { p: 3, qty: 1 }] },
    { delivery: 'delivery', payment: 'card', hoursAgo: 13, items: [{ p: 0, qty: 1 }, { p: 1, qty: 1 }] },
  ];

  const customerNames = [
    'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Lucas Pereira',
    'Fernanda Lima', 'Carlos Souza', 'Juliana Alves', 'Rafael Mendes', 'Camila Rocha',
    'Bruno Ferreira', 'Larissa Martins', 'Diego Ribeiro', 'Patrícia Gomes', 'Thiago Barbosa',
    'Amanda Cardoso', 'Rodrigo Nascimento', 'Beatriz Araújo', 'Gustavo Correia', 'Isabela Dias',
  ];

  let orderNum = 990100;
  let insertedOrders = 0;
  let insertedItems = 0;

  for (let i = 0; i < orderDefs.length; i++) {
    const def = orderDefs[i];
    const createdAt = new Date(now.getTime() - def.hoursAgo * 60 * 60 * 1000);
    // Tempo de preparo entre 15 e 55 minutos
    const prepMinutes = 15 + Math.floor(Math.random() * 40);
    const completedAt = new Date(createdAt.getTime() + prepMinutes * 60 * 1000);
    
    // Calcular totais
    let subtotal = 0;
    for (const item of def.items) {
      subtotal += products[item.p].price * item.qty;
    }
    const deliveryFee = def.delivery === 'delivery' ? 8.90 : 0;
    const total = subtotal + deliveryFee;

    const orderNumber = String(orderNum++);
    const customerName = customerNames[i % customerNames.length];
    const customerPhone = `553499${String(1000000 + Math.floor(Math.random() * 9000000)).slice(0, 7)}`;

    // Insert order
    await connection.execute(
      `INSERT INTO orders (establishmentId, orderNumber, customerName, customerPhone, status, deliveryType, paymentMethod, subtotal, deliveryFee, discount, total, source, createdAt, updatedAt, completedAt)
       VALUES (?, ?, ?, ?, 'completed', ?, ?, ?, ?, 0, ?, 'internal', ?, ?, ?)`,
      [establishmentId, orderNumber, customerName, customerPhone, def.delivery, def.payment, 
       subtotal.toFixed(2), deliveryFee.toFixed(2), total.toFixed(2),
       createdAt, createdAt, completedAt]
    );

    // Get the inserted order ID
    const [orderIdRows] = await connection.execute('SELECT LAST_INSERT_ID() as id');
    const orderId = orderIdRows[0].id;

    // Insert order items
    for (const item of def.items) {
      const product = products[item.p];
      const itemTotal = product.price * item.qty;
      await connection.execute(
        `INSERT INTO orderItems (orderId, productId, productName, quantity, unitPrice, totalPrice, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, product.id, product.name, item.qty, product.price.toFixed(2), itemTotal.toFixed(2), createdAt]
      );
      insertedItems++;
    }
    insertedOrders++;
  }

  console.log(`Inserted ${insertedOrders} orders with ${insertedItems} items`);
  
  // Verificar contagens
  const [countRows] = await connection.execute(
    `SELECT COUNT(*) as total, 
            SUM(CASE WHEN deliveryType = 'delivery' THEN 1 ELSE 0 END) as delivery,
            SUM(CASE WHEN deliveryType = 'pickup' THEN 1 ELSE 0 END) as pickup,
            SUM(CASE WHEN deliveryType = 'dine_in' THEN 1 ELSE 0 END) as dine_in
     FROM orders WHERE establishmentId = ? AND status = 'completed' AND DATE(createdAt) = CURDATE()`,
    [establishmentId]
  );
  console.log('Today completed orders:', countRows[0]);

  await connection.end();
  console.log('Done!');
}

main().catch(console.error);
