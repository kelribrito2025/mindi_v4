import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: 4000,
  ssl: { rejectUnauthorized: true }
});

const [rows] = await connection.execute('SELECT id, name, menuSlug, isOpen FROM establishments LIMIT 10');
console.log(JSON.stringify(rows, null, 2));
await connection.end();
