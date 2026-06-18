import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const EST_ID = 30001;
const PRODUCT_IDS = [120001, 120002, 120003, 120004, 120005, 120006, 120007, 120008, 120009, 120010];
const PRODUCT_NAMES = [
  'SASHIMI DE SALMÃO', 'SHASHIMI - TEMPURÁ', 'SUNOMONO', 'DUPLA KANI', 'DUPLA DE SKIN',
  'DUPLA DE CAMARÃO', 'DUPLA DE GUNGA SKIN', 'DUPLA DE GUNGA PATÊ DE CAMARÃO', 'Dupla de gunda tomate seco', 'DUPLA EBI SHAKÊ'
];
const PRODUCT_PRICES = [15, 16, 16, 5, 5, 7, 7, 7, 7, 8];

const CUSTOMER_NAMES = [
  'Maria Silva', 'João Santos', 'Ana Oliveira', 'Pedro Costa', 'Juliana Lima',
  'Carlos Souza', 'Fernanda Pereira', 'Lucas Almeida', 'Patrícia Ferreira', 'Rafael Rodrigues',
  'Camila Nascimento', 'Bruno Martins', 'Isabela Gomes', 'Thiago Ribeiro', 'Larissa Araújo',
  'Diego Barbosa', 'Amanda Carvalho', 'Gustavo Mendes', 'Letícia Rocha', 'Felipe Nunes'
];

const CUSTOMER_PHONES = [
  '11987654321', '11976543210', '11965432109', '11954321098', '11943210987',
  '21987654321', '21976543210', '21965432109', '21954321098', '21943210987',
  '31987654321', '31976543210', '31965432109', '31954321098', '31943210987',
  '41987654321', '41976543210', '41965432109', '41954321098', '41943210987'
];

const TABLE_IDS = [60001, 60002, 60003, 60004, 60005, 90001, 90002, 90003, 90004, 90005];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDate(d) {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get current max order number
  const [maxOrdRow] = await conn.execute(
    'SELECT MAX(CAST(orderNumber AS UNSIGNED)) as maxNum FROM orders WHERE establishmentId = ?', [EST_ID]
  );
  let orderNum = Math.max(maxOrdRow[0].maxNum || 0, 300);

  const now = new Date();
  
  // Generate 150 new orders spread over the last 45 days
  // Good distribution: ~40% PDV, ~35% Menu público, ~25% Mesas
  const totalNewOrders = 150;
  let insertedOrders = 0;
  
  for (let i = 0; i < totalNewOrders; i++) {
    const channel = Math.random();
    let source, deliveryType;
    
    if (channel < 0.40) {
      // PDV
      source = 'pdv';
      deliveryType = Math.random() < 0.6 ? 'dine_in' : 'pickup';
    } else if (channel < 0.75) {
      // Menu público (internal, delivery or pickup)
      source = 'internal';
      deliveryType = Math.random() < 0.65 ? 'delivery' : 'pickup';
    } else {
      // Mesas (dine_in via internal)
      source = 'internal';
      deliveryType = 'dine_in';
    }
    
    // Random items (1-5 items per order)
    const numItems = rand(1, 5);
    let subtotal = 0;
    const items = [];
    
    for (let j = 0; j < numItems; j++) {
      const prodIdx = rand(0, PRODUCT_IDS.length - 1);
      const qty = rand(1, 3);
      const unitPrice = PRODUCT_PRICES[prodIdx];
      const totalPrice = unitPrice * qty;
      subtotal += totalPrice;
      
      items.push({
        productId: PRODUCT_IDS[prodIdx],
        productName: PRODUCT_NAMES[prodIdx],
        quantity: qty,
        unitPrice: unitPrice.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
      });
    }
    
    const deliveryFee = deliveryType === 'delivery' ? rand(3, 12) : 0;
    const discount = Math.random() < 0.12 ? rand(2, 8) : 0;
    const total = Math.max(subtotal + deliveryFee - discount, 5);
    
    const paymentMethod = pick(['cash', 'card', 'pix', 'card_online']);
    const custIdx = rand(0, CUSTOMER_NAMES.length - 1);
    
    // Spread dates: more recent days have more orders (realistic)
    const daysBack = Math.floor(Math.pow(Math.random(), 0.7) * 45);
    const createdAt = new Date(now.getTime() - daysBack * 86400000);
    createdAt.setHours(rand(10, 22), rand(0, 59), rand(0, 59));
    const completedAt = new Date(createdAt.getTime() + rand(15, 60) * 60000);
    
    orderNum++;
    
    const customerAddress = deliveryType === 'delivery' 
      ? `Rua ${pick(['das Flores', 'São Paulo', 'XV de Novembro', 'Bela Vista', 'Augusta', 'Paulista', 'Consolação', 'Liberdade'])}, ${rand(10, 999)}` 
      : null;
    
    const [orderResult] = await conn.execute(
      `INSERT INTO orders (establishmentId, orderNumber, customerName, customerPhone, customerAddress, status, deliveryType, paymentMethod, subtotal, deliveryFee, discount, total, source, createdAt, completedAt) VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [EST_ID, String(orderNum), CUSTOMER_NAMES[custIdx], CUSTOMER_PHONES[custIdx], customerAddress, deliveryType, paymentMethod, subtotal.toFixed(2), deliveryFee.toFixed(2), discount.toFixed(2), total.toFixed(2), source, formatDate(createdAt), formatDate(completedAt)]
    );
    
    const orderId = orderResult.insertId;
    
    // Insert order items
    for (const item of items) {
      await conn.execute(
        `INSERT INTO orderItems (orderId, productId, productName, quantity, unitPrice, totalPrice) VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.productName, item.quantity, item.unitPrice, item.totalPrice]
      );
    }
    
    insertedOrders++;
  }
  
  console.log(`Inserted ${insertedOrders} new orders`);
  
  // Additional expenses to make the data richer
  const EXPENSE_CATS = { Fornecedor: 10, Funcionários: 11, Aluguel: 12, Energia: 13, Água: 14, Marketing: 15, Impostos: 16, Outros: 17 };
  
  const additionalExpenses = [
    // More supplier expenses
    { catId: 10, desc: 'Peixes premium - Mercado São Pedro', amount: '2150.00', method: 'transfer', daysAgo: 3 },
    { catId: 10, desc: 'Temperos e condimentos orientais', amount: '340.00', method: 'pix', daysAgo: 5 },
    { catId: 10, desc: 'Cream cheese Philadelphia (10kg)', amount: '420.00', method: 'card', daysAgo: 7 },
    { catId: 10, desc: 'Abacate e frutas para rolls', amount: '180.00', method: 'cash', daysAgo: 2 },
    { catId: 10, desc: 'Vinagre de arroz e mirin', amount: '95.00', method: 'pix', daysAgo: 10 },
    
    // Staff bonuses
    { catId: 11, desc: 'Bonificação equipe - meta atingida', amount: '800.00', method: 'transfer', daysAgo: 8 },
    { catId: 11, desc: 'Treinamento novo sushiman', amount: '450.00', method: 'pix', daysAgo: 15 },
    
    // Marketing campaigns
    { catId: 15, desc: 'Campanha WhatsApp - Rodízio especial', amount: '180.00', method: 'pix', daysAgo: 4 },
    { catId: 15, desc: 'Parceria com influencer local', amount: '500.00', method: 'transfer', daysAgo: 12 },
    
    // Misc
    { catId: 17, desc: 'Conserto da máquina de gelo', amount: '280.00', method: 'pix', daysAgo: 6 },
    { catId: 17, desc: 'Compra de pratos e bowls novos', amount: '650.00', method: 'card', daysAgo: 20 },
    { catId: 17, desc: 'Decoração do salão - Ano Novo', amount: '320.00', method: 'cash', daysAgo: 35 },
  ];
  
  let insertedExpenses = 0;
  for (const exp of additionalExpenses) {
    const date = new Date(now.getTime() - exp.daysAgo * 86400000);
    date.setHours(12, 0, 0, 0);
    
    await conn.execute(
      `INSERT INTO expenses (establishmentId, categoryId, description, amount, paymentMethod, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [EST_ID, exp.catId, exp.desc, exp.amount, exp.method, formatDate(date), formatDate(date)]
    );
    insertedExpenses++;
  }
  
  console.log(`Inserted ${insertedExpenses} additional expenses`);
  
  // Update monthly goal to R$ 15.000
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  await conn.execute('DELETE FROM monthlyGoals WHERE establishmentId = ? AND month = ? AND year = ?', [EST_ID, month, year]);
  await conn.execute(
    'INSERT INTO monthlyGoals (establishmentId, month, year, targetProfit) VALUES (?, ?, ?, ?)',
    [EST_ID, month, year, '15000.00']
  );
  console.log(`Updated monthly goal to R$ 15.000,00 for ${month}/${year}`);
  
  // Print summary
  const [totalOrders] = await conn.execute('SELECT COUNT(*) as cnt FROM orders WHERE establishmentId = ?', [EST_ID]);
  const [totalExpenses] = await conn.execute('SELECT COUNT(*) as cnt FROM expenses WHERE establishmentId = ?', [EST_ID]);
  const [channelDist] = await conn.execute(`
    SELECT 
      CASE 
        WHEN source = 'pdv' THEN 'PDV'
        WHEN source = 'internal' AND deliveryType = 'dine_in' THEN 'Mesas'
        ELSE 'Menu público'
      END as channel,
      COUNT(*) as cnt,
      ROUND(SUM(CAST(total AS DECIMAL(10,2))), 2) as revenue
    FROM orders 
    WHERE establishmentId = ? AND status = 'completed'
    GROUP BY channel
  `, [EST_ID]);
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total orders: ${totalOrders[0].cnt}`);
  console.log(`Total expenses: ${totalExpenses[0].cnt}`);
  console.log('Channel distribution:');
  for (const ch of channelDist) {
    console.log(`  ${ch.channel}: ${ch.cnt} orders, R$ ${ch.revenue}`);
  }
  
  await conn.end();
}

main().catch(console.error);
