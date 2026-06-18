import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const ESTABLISHMENT_ID = 210017;

// Dados extraídos do menu antigo: https://menu.mindi.com.br/rota-17-burger
const menuData = [
  {
    categoryName: "Combos",
    sortOrder: 1,
    products: [
      {
        name: "2 Costela Burger",
        description: "Costela Burger Pão Brioche - Burger Acebolado 100g - Muçarela - Alface - Molho da Casa",
        price: "40.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/081c74d39b51-2%20COSTELAS%20BURGER.png",
        sortOrder: 1,
        isCombo: true,
      },
      {
        name: "2 Cupim Burger + Batata Frita",
        description: "Pão Brioche - Burger ao Alho 100g - Muçarela - Bacon ao Barbecue - Alface - Molho da Casa",
        price: "50.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/eea2d2ea645f-2%20CUPIM%20BURGER%20+%20BATATA%20FRITA.png",
        sortOrder: 2,
        isCombo: true,
      },
      {
        name: "Bruto + Batata Frita + Coca-Cola 1L",
        description: "Pão Australiano - 2 Hambúrguer 120g - 2 Muçarela - Ovo - Bacon - Rúcula e Molho da Casa",
        price: "50.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/2425959fce45-BRUTO%20+%20BATATA%20FRITA%20+%20COCA-COLA%201L.png",
        sortOrder: 3,
        isCombo: true,
      },
      {
        name: "Thunder + Coca-Cola 1L",
        description: "Pão Parmesão - 4 Burger de 100g - 3 Queijos - Bacon - Alface - Molho da Casa",
        price: "60.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/a054d0516ba5-THUNDER%20+%20BATATA%20FRITA%20+%20COCA-COLA%201L.png",
        sortOrder: 4,
        isCombo: true,
      },
    ],
  },
  {
    categoryName: "Exclusivos",
    sortOrder: 2,
    products: [
      {
        name: "Churrasco",
        description: "Pão Brioche - 2 Burger 100g (ao alho) - 2x Muçarela - Alface - Barbecue - Molho da Casa",
        price: "25.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/64a23fb5aac2-CHURRASCO%20.png",
        sortOrder: 1,
      },
      {
        name: "Trem Bão",
        description: "Pão Australiano - 2 Burger 100g (cada) - Mussarela - Cheddar - Cebola Caramelizada",
        price: "45.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/850b48f5b67d-TREM%20B%C3%83O.png",
        sortOrder: 2,
      },
      {
        name: "Tasty",
        description: "Pão Brioche - Burger 100g (cebola prensada) - Requeijão (Scala) - Barbecue - Alface",
        price: "18.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/937dc1e6e11d-TASTY%20.png",
        sortOrder: 3,
      },
      {
        name: "Cupim Burger",
        description: "Pão Brioche - Burger ao Alho 100g - Muçarela - Bacon ao Barbecue - Alface - Molho da Casa",
        price: "28.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/64db3834dd6d-CUPIM%20BURGER.png",
        sortOrder: 4,
      },
      {
        name: "Costela Burger",
        description: "Pão Brioche - Burger Acebolado 100g - Muçarela - Alface - Molho da Casa",
        price: "25.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/5817f56567b2-COSTELA%20BURGER.png",
        sortOrder: 5,
      },
      {
        name: "Double Cheese",
        description: "Pão de Parmesão - 2 Burgers de 100g - Dobro de Muçarela - Bacon em Dobro - Cebola Caramelizada",
        price: "35.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/06f170daed87-DOUBLE%20CHEESE.png",
        sortOrder: 6,
      },
      {
        name: "X-Burger",
        description: "Pão Brioche - Burger 100g - Muçarela - Barbecue",
        price: "15.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/642e14b588db-WORKER.png",
        sortOrder: 7,
      },
      {
        name: "Creamy Texas",
        description: "Pão Gergelim Mesclado - Smashburger 100g - Requeijão Cremoso - 3x Muçarela - Bacon",
        price: "24.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/34156105613d-CREAMY%20TEXAS.png",
        sortOrder: 8,
      },
      {
        name: "Katiau",
        description: "Pão Parmesão - Hambúrguer 100g - Bacon - Cebola Refogada em Dobro - Cheddar Cremoso",
        price: "25.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/56a292401841-KATIAU.png",
        sortOrder: 9,
      },
    ],
  },
  {
    categoryName: "Sanduíches",
    sortOrder: 3,
    products: [
      {
        name: "Egg Burger",
        description: "Pão Brioche - Hambúrguer 100g - Salsicha ao Barbecue - Ovo - Alface e Molho",
        price: "18.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/f977f1970aa8-EGG%20BURGER.png",
        sortOrder: 1,
      },
      {
        name: "Cheese Burger",
        description: "Pão Australiano - Burger 100g - Muçarela - Bacon ao Barbecue - Onion Rings - Alface",
        price: "28.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/4c9446aad659-CHEESE%20BURGER.png",
        sortOrder: 2,
      },
      {
        name: "Bruto",
        description: "Pão Australiano - 2 Hambúrguer 100g - 2 Muçarelas - Bacon Acebolado - Ovo - Alface",
        price: "40.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/df226bbb8e04-BRUTO.png",
        sortOrder: 3,
      },
    ],
  },
  {
    categoryName: "Monte Seu Sanduíche",
    sortOrder: 4,
    products: [
      {
        name: "Montado",
        description: "Monte seu sanduíche do seu jeito",
        price: "13.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/c53e622231dd-MONTADO%20.png",
        sortOrder: 1,
      },
    ],
  },
  {
    categoryName: "Porções",
    sortOrder: 5,
    products: [
      {
        name: "Batata Frita P",
        description: "Aproximadamente 150g",
        price: "10.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/bc555096b520-BATATA%20FRITA%20P.png",
        sortOrder: 1,
      },
      {
        name: "Batata Frita G",
        description: "Aproximadamente 400g",
        price: "22.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/6a9c0069cd31-BATATA%20FRITA%20G.png",
        sortOrder: 2,
      },
      {
        name: "Batata com Cheddar e Bacon",
        description: "Batata frita com cheddar cremoso e bacon crocante",
        price: "30.00",
        imageUrl: null,
        sortOrder: 3,
      },
    ],
  },
  {
    categoryName: "Bebidas",
    sortOrder: 6,
    products: [
      {
        name: "Coca Cola Lata 310ml",
        description: "Coca-Cola lata 310ml",
        price: "5.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/5e8f9d1ea6b0-COCA%20COLA%20LATA%20310ml.png",
        sortOrder: 1,
      },
      {
        name: "Coca Cola Zero Lata 310ml",
        description: "Coca-Cola Zero lata 310ml",
        price: "5.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/d26fd7addacd-COCA%20COLA%20ZERO%20LATA%20310ml%20%20.png",
        sortOrder: 2,
      },
      {
        name: "Coca Cola 1L",
        description: "Coca-Cola 1 litro",
        price: "10.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/21c2449c32cb-COCA%20COLA%201%20L.png",
        sortOrder: 3,
      },
      {
        name: "Coca Cola Zero 1L",
        description: "Coca-Cola Zero 1 litro",
        price: "10.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/6068491e4ce1-COCA%20COLA%20ZERO%201%20L%20%20.png",
        sortOrder: 4,
      },
      {
        name: "Água com Gás",
        description: "Água mineral com gás",
        price: "5.00",
        imageUrl: "https://storage.googleapis.com/mindi-static/3d50f281e98b-AGUA%20COM%20GAS.png",
        sortOrder: 5,
      },
    ],
  },
];

async function migrate() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log(`\n=== Migração Rota 17 Burger (Estabelecimento ${ESTABLISHMENT_ID}) ===\n`);
  
  let totalCategories = 0;
  let totalProducts = 0;
  
  for (const cat of menuData) {
    // Insert category
    const [catResult] = await conn.execute(
      `INSERT INTO categories (establishmentId, name, sortOrder, isActive) VALUES (?, ?, ?, true)`,
      [ESTABLISHMENT_ID, cat.categoryName, cat.sortOrder]
    );
    const categoryId = catResult.insertId;
    totalCategories++;
    console.log(`✅ Categoria criada: "${cat.categoryName}" (ID: ${categoryId})`);
    
    // Insert products for this category
    for (const prod of cat.products) {
      const images = prod.imageUrl ? JSON.stringify([prod.imageUrl]) : null;
      const isCombo = prod.isCombo || false;
      
      const [prodResult] = await conn.execute(
        `INSERT INTO products (establishmentId, categoryId, name, description, price, images, status, sortOrder, isCombo) 
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        [ESTABLISHMENT_ID, categoryId, prod.name, prod.description, prod.price, images, prod.sortOrder, isCombo]
      );
      totalProducts++;
      console.log(`   📦 Produto: "${prod.name}" - R$ ${prod.price} (ID: ${prodResult.insertId})`);
    }
  }
  
  console.log(`\n=== Migração concluída! ===`);
  console.log(`📁 ${totalCategories} categorias criadas`);
  console.log(`📦 ${totalProducts} produtos criados`);
  console.log(`🏪 Estabelecimento: ${ESTABLISHMENT_ID}\n`);
  
  await conn.end();
}

migrate().catch(err => {
  console.error('Erro na migração:', err);
  process.exit(1);
});
