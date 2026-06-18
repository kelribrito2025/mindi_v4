import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '/home/ubuntu/cardapio-admin/.env' });

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const EST_ID = 30001;

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function randDecimal(min, max) { return (Math.random() * (max - min) + min).toFixed(2); }

function dateStr(d) {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(rand(10, 22), rand(0, 59), rand(0, 59));
  return d;
}

// ============================================================
// 1. MOCK ORDERS (varied statuses, spread over last 30 days)
// ============================================================
const customerNames = [
  'Maria Silva', 'João Santos', 'Ana Oliveira', 'Carlos Souza', 'Fernanda Lima',
  'Pedro Almeida', 'Juliana Costa', 'Rafael Pereira', 'Camila Rodrigues', 'Lucas Martins',
  'Beatriz Ferreira', 'Gabriel Ribeiro', 'Larissa Gomes', 'Thiago Barbosa', 'Amanda Carvalho',
  'Bruno Nascimento', 'Isabela Araújo', 'Diego Monteiro', 'Patricia Mendes', 'Vinícius Correia',
  'Letícia Dias', 'Matheus Rocha', 'Daniela Teixeira', 'Felipe Moreira', 'Mariana Cardoso',
  'Renato Nunes', 'Aline Pinto', 'Gustavo Campos', 'Natália Vieira', 'Eduardo Lopes'
];

const phones = [
  '88999110001', '88999110002', '88999110003', '88999110004', '88999110005',
  '88999110006', '88999110007', '88999110008', '88999110009', '88999110010',
  '88999110011', '88999110012', '88999110013', '88999110014', '88999110015',
  '88999110016', '88999110017', '88999110018', '88999110019', '88999110020',
  '88999110021', '88999110022', '88999110023', '88999110024', '88999110025',
  '88999110026', '88999110027', '88999110028', '88999110029', '88999110030'
];

const addresses = [
  'Rua das Flores, 123 - Centro',
  'Av. Brasil, 456 - Jardim América',
  'Rua São Paulo, 789 - Vila Nova',
  'Rua Ceará, 321 - Alto da Boa Vista',
  'Av. Paulista, 1000 - Consolação',
  'Rua Minas Gerais, 55 - Liberdade',
  'Rua Rio de Janeiro, 88 - Bela Vista',
  'Av. Independência, 200 - Centro',
  'Rua Bahia, 150 - Jardim Europa',
  'Rua Paraná, 77 - Vila Mariana'
];

const products = [
  { id: 120001, name: 'SASHIMI DE SALMÃO', price: 15.00 },
  { id: 120017, name: 'SALMÃO ESPECIAL', price: 17.00 },
  { id: 120018, name: 'CAMARÃO ESPECIAL', price: 17.00 },
  { id: 120019, name: 'FILADÉLFIA', price: 17.00 },
  { id: 120020, name: 'CALIFORNIA', price: 16.00 },
  { id: 120022, name: 'SALMÃO', price: 17.00 },
  { id: 120023, name: 'SALMÃO C/TOMATE SECO', price: 22.00 },
  { id: 120028, name: 'HOSSOMAKI MISTO', price: 24.00 },
  { id: 120029, name: 'HOT FILADÉLFIA', price: 17.00 },
  { id: 120030, name: 'HOT CAMARÃO', price: 17.00 },
  { id: 120004, name: 'DUPLA KANI', price: 5.00 },
  { id: 120011, name: 'Dupla de salmão', price: 6.00 },
  { id: 120012, name: 'DUPLA DE SALMÃO C/ QUEIJO', price: 8.00 },
  { id: 120003, name: 'SUNOMONO', price: 16.00 },
];

const paymentMethods = ['cash', 'card', 'pix'];
const deliveryTypes = ['delivery', 'pickup', 'dine_in'];
const sources = ['internal', 'internal', 'internal', 'ifood']; // 75% internal

// Get max existing order ID
const [maxIdRow] = await conn.query('SELECT MAX(id) as maxId FROM orders');
let nextOrderId = (maxIdRow[0].maxId || 500000) + 1;

// Get max existing orderItem ID
const [maxItemIdRow] = await conn.query('SELECT MAX(id) as maxId FROM orderItems');
let nextItemId = (maxItemIdRow[0].maxId || 600000) + 1;

console.log('Starting order ID:', nextOrderId);
console.log('Starting item ID:', nextItemId);

// Create orders spread across last 30 days
const orderInserts = [];
const orderItemInserts = [];
const deliveryInserts = [];

// We want: 
// - ~5 pending/new (today)
// - ~3 preparing (today)
// - ~2 ready (today)
// - ~2 out_for_delivery (today)
// - ~3 scheduled (future)
// - ~80 completed (last 30 days)
// - ~10 cancelled (last 30 days)

const statusDistribution = [
  // Today's active orders
  ...Array(5).fill({ status: 'new', daysAgoRange: [0, 0] }),
  ...Array(3).fill({ status: 'preparing', daysAgoRange: [0, 0] }),
  ...Array(2).fill({ status: 'ready', daysAgoRange: [0, 0] }),
  ...Array(2).fill({ status: 'out_for_delivery', daysAgoRange: [0, 0] }),
  // Scheduled
  ...Array(3).fill({ status: 'scheduled', daysAgoRange: [-2, -1] }), // future dates
  // Completed over last 30 days
  ...Array(80).fill({ status: 'completed', daysAgoRange: [1, 30] }),
  // Cancelled
  ...Array(10).fill({ status: 'cancelled', daysAgoRange: [1, 30] }),
];

// Order number counter per day
const orderNumberCounters = {};

for (let i = 0; i < statusDistribution.length; i++) {
  const { status, daysAgoRange } = statusDistribution[i];
  const orderId = nextOrderId++;
  
  let createdDate;
  if (daysAgoRange[0] < 0) {
    // Future date (scheduled)
    createdDate = new Date();
    createdDate.setDate(createdDate.getDate() + rand(1, 3));
    createdDate.setHours(rand(11, 21), rand(0, 59), rand(0, 59));
  } else {
    createdDate = daysAgo(rand(daysAgoRange[0], daysAgoRange[1]));
  }
  
  const dayKey = createdDate.toISOString().slice(0, 10);
  orderNumberCounters[dayKey] = (orderNumberCounters[dayKey] || 0) + 1;
  const orderNumber = `#P${orderNumberCounters[dayKey]}`;
  
  const custIdx = rand(0, customerNames.length - 1);
  const deliveryType = pick(deliveryTypes);
  const paymentMethod = pick(paymentMethods);
  const source = pick(sources);
  
  // Generate 1-4 items per order
  const numItems = rand(1, 4);
  let subtotal = 0;
  const items = [];
  for (let j = 0; j < numItems; j++) {
    const prod = pick(products);
    const qty = rand(1, 3);
    const totalPrice = prod.price * qty;
    subtotal += totalPrice;
    items.push({
      id: nextItemId++,
      orderId,
      productId: prod.id,
      productName: prod.name,
      quantity: qty,
      unitPrice: prod.price,
      totalPrice,
    });
  }
  
  const deliveryFee = deliveryType === 'delivery' ? parseFloat(randDecimal(3, 8)) : 0;
  const discount = Math.random() < 0.15 ? parseFloat(randDecimal(2, 10)) : 0;
  const total = Math.max(subtotal + deliveryFee - discount, 0);
  
  let completedAt = null;
  let updatedAt = new Date(createdDate);
  
  if (status === 'completed') {
    completedAt = new Date(createdDate);
    completedAt.setMinutes(completedAt.getMinutes() + rand(20, 60));
    updatedAt = completedAt;
  } else if (status === 'cancelled') {
    updatedAt = new Date(createdDate);
    updatedAt.setMinutes(updatedAt.getMinutes() + rand(5, 30));
  } else {
    updatedAt.setMinutes(updatedAt.getMinutes() + rand(1, 15));
  }
  
  const isScheduled = status === 'scheduled' ? 1 : 0;
  const scheduledAt = isScheduled ? dateStr(createdDate) : null;
  const cancellationReason = status === 'cancelled' ? pick([
    'Cliente desistiu', 'Endereço incorreto', 'Sem troco', 'Demora na entrega',
    'Pedido duplicado', 'Produto indisponível'
  ]) : null;
  
  const address = deliveryType === 'delivery' ? pick(addresses) : null;
  const changeAmount = paymentMethod === 'cash' && deliveryType === 'delivery' 
    ? parseFloat((Math.ceil(total / 10) * 10).toFixed(2)) : null;
  
  orderInserts.push([
    orderId, EST_ID, orderNumber, customerNames[custIdx], phones[custIdx],
    address, status, deliveryType, paymentMethod,
    subtotal.toFixed(2), deliveryFee.toFixed(2), total.toFixed(2),
    Math.random() < 0.2 ? pick(['Sem wasabi', 'Sem gengibre', 'Caprichar no molho', 'Alergia a amendoim']) : null,
    dateStr(createdDate), dateStr(updatedAt), completedAt ? dateStr(completedAt) : null,
    changeAmount, discount.toFixed(2), null, cancellationReason, source,
    source === 'ifood' ? `ifood_${orderId}` : null,
    source === 'ifood' ? `${rand(1000, 9999)}` : null,
    null, null, 0, isScheduled, scheduledAt, 0, null
  ]);
  
  for (const item of items) {
    orderItemInserts.push([
      item.id, item.orderId, item.productId, item.productName,
      item.quantity, item.unitPrice.toFixed(2), item.totalPrice.toFixed(2),
      null, null, dateStr(createdDate), null
    ]);
  }
  
  // Create delivery record for out_for_delivery orders
  if (status === 'out_for_delivery' && deliveryType === 'delivery') {
    deliveryInserts.push([
      null, EST_ID, orderId, 60001, deliveryFee.toFixed(2), '5.00', 'pending',
      null, 0, null, dateStr(updatedAt), dateStr(updatedAt)
    ]);
  }
}

// Insert orders
console.log(`Inserting ${orderInserts.length} orders...`);
for (const o of orderInserts) {
  await conn.query(`INSERT INTO orders (id, establishmentId, orderNumber, customerName, customerPhone,
    customerAddress, status, deliveryType, paymentMethod, subtotal, deliveryFee, total, notes,
    createdAt, updatedAt, completedAt, changeAmount, discount, couponCode, cancellationReason, source,
    externalId, externalDisplayId, externalStatus, externalData, deliveryNotified, isScheduled, scheduledAt,
    movedToQueue, movedToQueueAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, o);
}

// Insert order items
console.log(`Inserting ${orderItemInserts.length} order items...`);
for (const item of orderItemInserts) {
  await conn.query(`INSERT INTO orderItems (id, orderId, productId, productName, quantity, unitPrice, totalPrice,
    complements, notes, createdAt, printerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, item);
}

// Insert deliveries
console.log(`Inserting ${deliveryInserts.length} deliveries...`);
for (const d of deliveryInserts) {
  await conn.query(`INSERT INTO deliveries (id, establishmentId, orderId, driverId, deliveryFee, repasseValue,
    paymentStatus, paidAt, whatsappSent, whatsappSentAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, d);
}

// ============================================================
// 2. MORE DRIVERS
// ============================================================
console.log('Inserting drivers...');
const driverData = [
  ['Lucas Oliveira', 'lucas@email.com', '(88) 99931-0001', 1, 'fixed', 5.00, null],
  ['Marcos Pereira', 'marcos@email.com', '(88) 99931-0002', 1, 'percentage', null, 10.00],
  ['Roberto Silva', null, '(88) 99931-0003', 1, 'fixed', 6.00, null],
  ['André Santos', null, '(88) 99931-0004', 0, 'fixed', 5.00, null],
];

for (const d of driverData) {
  await conn.query(`INSERT INTO drivers (establishmentId, name, email, whatsapp, isActive, repasseStrategy, fixedValue, percentageValue, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`, [EST_ID, ...d]);
}

// ============================================================
// 3. REVIEWS
// ============================================================
console.log('Inserting reviews...');
const reviewData = [
  ['Maria Silva', '88999110001', 5, 'Sushi maravilhoso! Sempre peço aqui. O salmão é super fresco.', 'Obrigado Maria! Ficamos felizes que gostou! 🍣', true],
  ['João Santos', '88999110002', 4, 'Boa comida, mas a entrega demorou um pouco. Fora isso, tudo perfeito.', 'Obrigado pelo feedback João! Vamos melhorar o tempo de entrega.', true],
  ['Ana Oliveira', '88999110003', 5, 'Melhor sushi da cidade! O hot filadélfia é sensacional.', null, true],
  ['Carlos Souza', '88999110004', 3, 'Comida boa mas veio sem o molho shoyu que pedi.', 'Desculpe pelo inconveniente Carlos. Na próxima vez vamos caprichar!', true],
  ['Fernanda Lima', '88999110005', 5, 'Perfeito como sempre! Amo o combo especial.', null, false],
  ['Pedro Almeida', '88999110006', 4, 'Muito bom! Só achei o preço um pouquinho alto.', null, false],
  ['Juliana Costa', '88999110007', 5, 'Entrega super rápida e comida deliciosa! Recomendo demais!', 'Obrigado Juliana! Esperamos você novamente! 😊', true],
  ['Rafael Pereira', '88999110008', 2, 'Pedido veio errado, pedi salmão e veio kani.', 'Sentimos muito Rafael! Vamos verificar o processo. Entre em contato para resolvermos.', true],
  ['Camila Rodrigues', '88999110009', 5, 'Programa de fidelidade é ótimo! Já ganhei desconto duas vezes.', null, false],
  ['Lucas Martins', '88999110010', 4, 'Comida excelente, embalagem bem feita. Parabéns!', null, false],
  ['Beatriz Ferreira', '88999110011', 5, 'O hossomaki misto é divino! Melhor pedido que já fiz.', null, false],
  ['Gabriel Ribeiro', '88999110012', 4, 'Muito saboroso! A apresentação dos pratos é impecável.', null, false],
  ['Larissa Gomes', '88999110013', 5, 'Atendimento nota 10! Sempre muito atenciosos.', 'Obrigado Larissa! Sua satisfação é nossa prioridade! 💚', true],
  ['Thiago Barbosa', '88999110014', 3, 'Bom, mas o tempurá estava um pouco mole.', null, false],
  ['Amanda Carvalho', '88999110015', 5, 'Simplesmente perfeito! Meu restaurante favorito de sushi.', null, false],
  ['Bruno Nascimento', '88999110016', 4, 'Ótima qualidade! Só faltou mais gengibre.', null, false],
  ['Isabela Araújo', '88999110017', 5, 'Incrível! O sashimi de salmão derrete na boca.', null, false],
  ['Diego Monteiro', '88999110018', 4, 'Muito bom! Entrega dentro do prazo. Voltarei a pedir.', null, false],
  ['Patricia Mendes', '88999110019', 5, 'Experiência maravilhosa! Tudo fresquinho e saboroso.', null, false],
  ['Vinícius Correia', '88999110020', 3, 'Razoável. Esperava mais pelo preço que paguei.', null, false],
];

// Get completed order IDs for reviews
const [completedOrders] = await conn.query(
  'SELECT id, createdAt FROM orders WHERE establishmentId = ? AND status = ? ORDER BY createdAt DESC LIMIT 20',
  [EST_ID, 'completed']
);

for (let i = 0; i < reviewData.length && i < completedOrders.length; i++) {
  const [name, phone, rating, comment, response, isRead] = reviewData[i];
  const order = completedOrders[i];
  const reviewDate = new Date(order.createdAt);
  reviewDate.setHours(reviewDate.getHours() + rand(1, 24));
  
  const responseDate = response ? new Date(reviewDate.getTime() + rand(1, 48) * 3600000) : null;
  
  await conn.query(`INSERT INTO reviews (establishmentId, orderId, customerName, rating, comment, createdAt, customerPhone, responseText, responseDate, isRead)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    EST_ID, order.id, name, rating, comment, dateStr(reviewDate), phone,
    response, responseDate ? dateStr(responseDate) : null, isRead ? 1 : 0
  ]);
}

// ============================================================
// 4. STOCK CATEGORIES & ITEMS
// ============================================================
console.log('Inserting stock categories...');
const stockCats = [
  ['Peixes e Frutos do Mar', 1],
  ['Arroz e Grãos', 2],
  ['Vegetais e Legumes', 3],
  ['Molhos e Temperos', 4],
  ['Embalagens', 5],
  ['Bebidas', 6],
];

const catIds = [];
for (const [name, sortOrder] of stockCats) {
  const [result] = await conn.query(
    'INSERT INTO stockCategories (establishmentId, name, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())',
    [EST_ID, name, sortOrder]
  );
  catIds.push(result.insertId);
}

console.log('Inserting stock items...');
const stockItems = [
  // Peixes e Frutos do Mar (catIds[0])
  [catIds[0], 'Salmão Fresco', 12.50, 5.00, 30.00, 'kg', 45.00, 'ok'],
  [catIds[0], 'Atum', 8.00, 3.00, 20.00, 'kg', 65.00, 'ok'],
  [catIds[0], 'Camarão', 5.20, 2.00, 15.00, 'kg', 55.00, 'ok'],
  [catIds[0], 'Kani', 15.00, 5.00, 30.00, 'unidade', 12.00, 'ok'],
  [catIds[0], 'Polvo', 2.50, 2.00, 10.00, 'kg', 80.00, 'low'],
  [catIds[0], 'Skin (Pele de Salmão)', 3.00, 1.00, 10.00, 'kg', 25.00, 'ok'],
  
  // Arroz e Grãos (catIds[1])
  [catIds[1], 'Arroz para Sushi', 25.00, 10.00, 50.00, 'kg', 8.50, 'ok'],
  [catIds[1], 'Arroz Integral', 8.00, 3.00, 20.00, 'kg', 12.00, 'ok'],
  [catIds[1], 'Nori (Alga)', 120.00, 50.00, 300.00, 'unidade', 0.80, 'ok'],
  
  // Vegetais e Legumes (catIds[2])
  [catIds[2], 'Pepino Japonês', 10.00, 5.00, 25.00, 'unidade', 3.50, 'ok'],
  [catIds[2], 'Abacate', 15.00, 5.00, 30.00, 'unidade', 4.00, 'ok'],
  [catIds[2], 'Cebolinha', 3.00, 2.00, 10.00, 'unidade', 2.00, 'ok'],
  [catIds[2], 'Gengibre', 2.50, 1.00, 5.00, 'kg', 18.00, 'ok'],
  [catIds[2], 'Tomate Seco', 0.80, 1.00, 5.00, 'kg', 35.00, 'critical'],
  
  // Molhos e Temperos (catIds[3])
  [catIds[3], 'Molho Shoyu', 8.00, 3.00, 15.00, 'L', 12.00, 'ok'],
  [catIds[3], 'Vinagre de Arroz', 5.00, 2.00, 10.00, 'L', 15.00, 'ok'],
  [catIds[3], 'Wasabi', 1.50, 0.50, 5.00, 'kg', 120.00, 'ok'],
  [catIds[3], 'Cream Cheese', 4.00, 2.00, 10.00, 'kg', 28.00, 'ok'],
  [catIds[3], 'Gergelim', 3.00, 1.00, 8.00, 'kg', 22.00, 'ok'],
  
  // Embalagens (catIds[4])
  [catIds[4], 'Embalagem Sushi (P)', 150.00, 50.00, 500.00, 'unidade', 0.45, 'ok'],
  [catIds[4], 'Embalagem Sushi (M)', 200.00, 50.00, 500.00, 'unidade', 0.65, 'ok'],
  [catIds[4], 'Embalagem Sushi (G)', 100.00, 30.00, 300.00, 'unidade', 0.85, 'ok'],
  [catIds[4], 'Hashi Descartável', 300.00, 100.00, 800.00, 'unidade', 0.15, 'ok'],
  [catIds[4], 'Sacola Delivery', 80.00, 50.00, 400.00, 'unidade', 0.30, 'low'],
  
  // Bebidas (catIds[5])
  [catIds[5], 'Coca-Cola 350ml', 48.00, 24.00, 120.00, 'unidade', 3.50, 'ok'],
  [catIds[5], 'Guaraná Antarctica 350ml', 36.00, 12.00, 96.00, 'unidade', 3.00, 'ok'],
  [catIds[5], 'Água Mineral 500ml', 60.00, 24.00, 120.00, 'unidade', 1.50, 'ok'],
  [catIds[5], 'Suco de Maracujá 300ml', 0.00, 6.00, 48.00, 'unidade', 5.00, 'out_of_stock'],
  [catIds[5], 'Cerveja Asahi 355ml', 24.00, 12.00, 72.00, 'unidade', 12.00, 'ok'],
];

for (const [catId, name, qty, minQty, maxQty, unit, cost, status] of stockItems) {
  await conn.query(`INSERT INTO stockItems (establishmentId, categoryId, name, currentQuantity, minQuantity, maxQuantity, unit, costPerUnit, status, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`, [EST_ID, catId, name, qty, minQty, maxQty, unit, cost, status]);
}

// ============================================================
// 5. STOCK MOVEMENTS (recent activity)
// ============================================================
console.log('Inserting stock movements...');
const [stockItemsList] = await conn.query('SELECT id, name, currentQuantity FROM stockItems WHERE establishmentId = ? LIMIT 10', [EST_ID]);

for (const item of stockItemsList) {
  // Add a few movements per item
  const numMovements = rand(2, 5);
  for (let i = 0; i < numMovements; i++) {
    const type = pick(['entry', 'exit', 'adjustment']);
    const qty = parseFloat(randDecimal(1, 10));
    const prevQty = parseFloat(item.currentQuantity) + (type === 'exit' ? qty : -qty);
    const reasons = {
      entry: pick(['Compra fornecedor', 'Reposição semanal', 'Entrega programada']),
      exit: pick(['Consumo diário', 'Pedido #' + rand(100, 999), 'Uso na cozinha']),
      adjustment: pick(['Inventário mensal', 'Correção de estoque', 'Ajuste pós-contagem']),
    };
    
    const movDate = daysAgo(rand(0, 14));
    
    await conn.query(`INSERT INTO stockMovements (stockItemId, type, quantity, previousQuantity, newQuantity, reason, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [
      item.id, type, qty, Math.max(prevQty, 0).toFixed(2), parseFloat(item.currentQuantity).toFixed(2),
      reasons[type], dateStr(movDate)
    ]);
  }
}

// ============================================================
// SUMMARY
// ============================================================
const [orderCount] = await conn.query('SELECT COUNT(*) as cnt FROM orders WHERE establishmentId = ?', [EST_ID]);
const [reviewCount] = await conn.query('SELECT COUNT(*) as cnt FROM reviews WHERE establishmentId = ?', [EST_ID]);
const [driverCount] = await conn.query('SELECT COUNT(*) as cnt FROM drivers WHERE establishmentId = ?', [EST_ID]);
const [stockCount] = await conn.query('SELECT COUNT(*) as cnt FROM stockItems WHERE establishmentId = ?', [EST_ID]);
const [statusDist] = await conn.query('SELECT status, COUNT(*) as cnt FROM orders WHERE establishmentId = ? GROUP BY status ORDER BY cnt DESC', [EST_ID]);

console.log('\n=== SUMMARY ===');
console.log('Total orders:', orderCount[0].cnt);
console.log('Total reviews:', reviewCount[0].cnt);
console.log('Total drivers:', driverCount[0].cnt);
console.log('Total stock items:', stockCount[0].cnt);
console.log('Order status distribution:', JSON.stringify(statusDist));

await conn.end();
console.log('\nDone! Mock data inserted successfully.');
