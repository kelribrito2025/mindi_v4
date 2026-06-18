import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { orders } from './drizzle/schema.js';
import { desc } from 'drizzle-orm';

const pool = mysql.createPool(process.env.DATABASE_URL);
const db = drizzle(pool);

const result = await db.select({
  id: orders.id,
  orderNumber: orders.orderNumber,
  establishmentId: orders.establishmentId,
  status: orders.status,
  customerName: orders.customerName,
  total: orders.total,
  createdAt: orders.createdAt
}).from(orders).orderBy(desc(orders.id));

console.log('Pedidos no banco:');
result.forEach(o => {
  console.log(`ID: ${o.id}, Número: ${o.orderNumber}, Est: ${o.establishmentId}, Status: ${o.status}, Cliente: ${o.customerName}, Total: ${o.total}, Criado: ${o.createdAt}`);
});

await pool.end();
