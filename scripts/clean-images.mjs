import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Buscar todos os produtos com imagens do estabelecimento 210001
const [rows] = await conn.execute(
  'SELECT id, name, images FROM products WHERE establishmentId = 210001 AND images IS NOT NULL'
);

console.log(`Total produtos com images: ${rows.length}`);

// Produtos que NÃO tinham foto real no Mindi (lista extraída da análise)
const noPhotoProducts = [
  'Alho e Óleo',
  'Prato Econômico Alho e óleo',
  'Panqueca',
  'Omeletes',
  'Cachorro quente aberto',
  'Cachorro quente fechado',
  'Cachorro quente fechado +refrigerante lata',
  'Cachorro quente aberto + refrigerante lata.',
  'Cachorro quente família, três cachorros quente aberto +refrigerante de 1 litro.',
  'Cachorro quente aberto  (cópia)',
  'PRESTIGIO',
  'MENTOS MORANGO',
  'MENTOS Frutas Vermelhas (bala)',
  'MENTOS Rainbow(bala)',
  'MENTOS STRONG MINT (PRETO)CHICLETE',
  'MENTOS Fresh Mind (azul)',
  'MENTOS Melancia 🍉',
  'MENTOS FRUIT',
  'MENTOS Tutti Fresh',
  'MENTOS Morango-Maca Verde+Framboesa',
  'MENTOS SPEARMINT (VERDE)',
  'Bombom (ouro branco).',
  'Suco de laranja🍊🍊 450 ML',
  'SUCO laranja🍊🍊 1 LITRO.',
  'guarana cotuba 2 litros',
  'guarana mineiro 2 litros',
  'kuat 1 litro',
  'refrigerante fanta laranja lata 310ml',
  'coca cola 1 litro',
  'refrigerante coca lata 310ml.',
  'refrigerante coca lata zero 310ml.',
  'coca cola 2 litros',
  'cerveja brahma lata',
  'cerveja skol lata',
  'Fanta 1 litro',
  'Fanta 2 litros',
  'Fanta Guaraná 1 litro.',
];

let cleaned = 0;
for (const row of rows) {
  const img = String(row.images).trim();
  
  // Verificar se é um produto que não tinha foto real
  // Comparar pelo nome (trim para ignorar espaços extras)
  const nameMatch = noPhotoProducts.some(n => 
    row.name.trim().toLowerCase() === n.trim().toLowerCase() ||
    row.name.trim() === n.trim()
  );
  
  // Também limpar se a URL é do mindi.com.br (placeholder gerado)
  const isMindiBr = img.includes('mindi.com.br');
  
  if (nameMatch || isMindiBr) {
    await conn.execute('UPDATE products SET images = NULL WHERE id = ?', [row.id]);
    console.log(`Limpou: ${row.id} - ${row.name}`);
    cleaned++;
  } else {
    console.log(`Manteve: ${row.id} - ${row.name} -> ${img.substring(0, 60)}`);
  }
}

console.log(`\nTotal limpos: ${cleaned}`);
const [remaining] = await conn.execute(
  'SELECT COUNT(*) as total FROM products WHERE establishmentId = 210001 AND images IS NOT NULL'
);
console.log(`Produtos com foto restantes: ${remaining[0].total}`);

await conn.end();
