import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Calculate average rating
const [rows] = await conn.execute('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE establishmentId = 1');
const avgRating = parseFloat(rows[0].avg_rating) || 0;
const count = parseInt(rows[0].count) || 0;

console.log('Calculated avg:', avgRating.toFixed(1), 'count:', count);

// Update establishment
await conn.execute('UPDATE establishments SET rating = ?, reviewCount = ? WHERE id = 1', [avgRating.toFixed(1), count]);

console.log('Updated establishment rating');

// Verify
const [verify] = await conn.execute('SELECT rating, reviewCount FROM establishments WHERE id = 1');
console.log('New values:', verify[0]);

await conn.end();
