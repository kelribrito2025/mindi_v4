import mysql from 'mysql2/promise';

const ESTABLISHMENT_ID = 30001;

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // 1. Ensure default expense categories exist
  const [existingCats] = await conn.execute(
    'SELECT id, name FROM expenseCategories WHERE establishmentId = ?',
    [ESTABLISHMENT_ID]
  );

  let categories = {};
  if (existingCats.length === 0) {
    const defaultCats = [
      { name: "Fornecedor", color: "#3b82f6", sortOrder: 0 },
      { name: "Funcionários", color: "#8b5cf6", sortOrder: 1 },
      { name: "Aluguel", color: "#f59e0b", sortOrder: 2 },
      { name: "Energia", color: "#eab308", sortOrder: 3 },
      { name: "Água", color: "#06b6d4", sortOrder: 4 },
      { name: "Marketing", color: "#ec4899", sortOrder: 5 },
      { name: "Impostos", color: "#ef4444", sortOrder: 6 },
      { name: "Outros", color: "#6b7280", sortOrder: 7 },
    ];
    for (const cat of defaultCats) {
      const [result] = await conn.execute(
        'INSERT INTO expenseCategories (establishmentId, name, color, isDefault, sortOrder) VALUES (?, ?, ?, 1, ?)',
        [ESTABLISHMENT_ID, cat.name, cat.color, cat.sortOrder]
      );
      categories[cat.name] = result.insertId;
    }
    console.log("Created default categories:", Object.keys(categories));
  } else {
    for (const cat of existingCats) {
      categories[cat.name] = cat.id;
    }
    console.log("Using existing categories:", Object.keys(categories));
  }

  // 2. Clear existing mock expenses for this establishment
  await conn.execute('DELETE FROM expenses WHERE establishmentId = ?', [ESTABLISHMENT_ID]);
  console.log("Cleared existing expenses");

  // 3. Insert realistic mock expenses for the last 30 days
  const expenses = [];
  const now = new Date();

  // Helper to create a date N days ago at noon UTC
  const daysAgo = (n) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    d.setHours(12, 0, 0, 0);
    return d;
  };

  // Fornecedor - compras de ingredientes (frequent, variable amounts)
  const fornecedorItems = [
    { desc: "Compra de peixes e frutos do mar - Mercado Central", amount: "1250.00", method: "transfer" },
    { desc: "Arroz japonês e temperos - Distribuidora Sakura", amount: "680.50", method: "pix" },
    { desc: "Legumes e verduras - Hortifruti", amount: "320.00", method: "cash" },
    { desc: "Alga nori e wasabi - Importadora Oriental", amount: "450.00", method: "card" },
    { desc: "Salmão fresco - Fornecedor Premium", amount: "1890.00", method: "transfer" },
    { desc: "Shoyu e molhos especiais", amount: "185.00", method: "pix" },
    { desc: "Embalagens descartáveis - Embala Mais", amount: "290.00", method: "pix" },
    { desc: "Bebidas - Distribuidora Drinks", amount: "520.00", method: "card" },
    { desc: "Compra semanal de peixes", amount: "1450.00", method: "transfer" },
    { desc: "Frutas para sobremesas", amount: "175.00", method: "cash" },
    { desc: "Camarão e lula - Peixaria do Porto", amount: "980.00", method: "transfer" },
    { desc: "Gengibre, cebolinha e complementos", amount: "95.00", method: "cash" },
    { desc: "Cream cheese e queijos", amount: "340.00", method: "pix" },
    { desc: "Óleo de gergelim e azeites", amount: "210.00", method: "card" },
    { desc: "Compra emergencial de salmão", amount: "750.00", method: "pix" },
  ];

  const fornecedorDays = [0, 1, 2, 3, 4, 5, 7, 8, 10, 12, 14, 16, 18, 21, 25];
  for (let i = 0; i < fornecedorItems.length; i++) {
    const item = fornecedorItems[i];
    expenses.push({
      categoryId: categories["Fornecedor"],
      description: item.desc,
      amount: item.amount,
      paymentMethod: item.method,
      date: daysAgo(fornecedorDays[i]),
      notes: null,
    });
  }

  // Funcionários - salários e extras
  expenses.push(
    { categoryId: categories["Funcionários"], description: "Salário - Sushiman chefe (fev/2026)", amount: "4500.00", paymentMethod: "transfer", date: daysAgo(11), notes: "Pagamento mensal" },
    { categoryId: categories["Funcionários"], description: "Salário - Auxiliar de cozinha (fev/2026)", amount: "2200.00", paymentMethod: "transfer", date: daysAgo(11), notes: "Pagamento mensal" },
    { categoryId: categories["Funcionários"], description: "Salário - Atendente (fev/2026)", amount: "1800.00", paymentMethod: "transfer", date: daysAgo(11), notes: "Pagamento mensal" },
    { categoryId: categories["Funcionários"], description: "Salário - Entregador fixo (fev/2026)", amount: "1600.00", paymentMethod: "transfer", date: daysAgo(11), notes: "Pagamento mensal" },
    { categoryId: categories["Funcionários"], description: "Hora extra - Sushiman (sábado)", amount: "350.00", paymentMethod: "pix", date: daysAgo(3), notes: null },
    { categoryId: categories["Funcionários"], description: "Vale transporte equipe", amount: "480.00", paymentMethod: "pix", date: daysAgo(11), notes: null },
    { categoryId: categories["Funcionários"], description: "Vale alimentação equipe", amount: "600.00", paymentMethod: "pix", date: daysAgo(11), notes: null },
  );

  // Aluguel
  expenses.push(
    { categoryId: categories["Aluguel"], description: "Aluguel do ponto comercial - Fev/2026", amount: "3500.00", paymentMethod: "transfer", date: daysAgo(11), notes: "Contrato mensal" },
    { categoryId: categories["Aluguel"], description: "Condomínio - Fev/2026", amount: "450.00", paymentMethod: "transfer", date: daysAgo(11), notes: null },
  );

  // Energia
  expenses.push(
    { categoryId: categories["Energia"], description: "Conta de luz - Jan/2026", amount: "890.00", paymentMethod: "pix", date: daysAgo(20), notes: "Referente a janeiro" },
    { categoryId: categories["Energia"], description: "Gás de cozinha (2 botijões)", amount: "280.00", paymentMethod: "cash", date: daysAgo(8), notes: null },
    { categoryId: categories["Energia"], description: "Gás de cozinha (1 botijão extra)", amount: "140.00", paymentMethod: "cash", date: daysAgo(1), notes: null },
  );

  // Água
  expenses.push(
    { categoryId: categories["Água"], description: "Conta de água - Jan/2026", amount: "320.00", paymentMethod: "pix", date: daysAgo(18), notes: "Referente a janeiro" },
    { categoryId: categories["Água"], description: "Galões de água mineral (10un)", amount: "85.00", paymentMethod: "cash", date: daysAgo(6), notes: null },
  );

  // Marketing
  expenses.push(
    { categoryId: categories["Marketing"], description: "Campanha SMS - Promoção de terça", amount: "120.00", paymentMethod: "pix", date: daysAgo(9), notes: "342 SMS enviados" },
    { categoryId: categories["Marketing"], description: "Anúncio Instagram - Combo família", amount: "250.00", paymentMethod: "card", date: daysAgo(15), notes: "7 dias de campanha" },
    { categoryId: categories["Marketing"], description: "Flyers e cardápios impressos", amount: "180.00", paymentMethod: "pix", date: daysAgo(22), notes: "500 unidades" },
    { categoryId: categories["Marketing"], description: "Campanha SMS - Cupom 10% off", amount: "95.00", paymentMethod: "pix", date: daysAgo(2), notes: "280 SMS enviados" },
  );

  // Impostos
  expenses.push(
    { categoryId: categories["Impostos"], description: "DAS Simples Nacional - Jan/2026", amount: "1250.00", paymentMethod: "pix", date: daysAgo(16), notes: "Referente a janeiro" },
    { categoryId: categories["Impostos"], description: "IPTU parcela 2/12", amount: "380.00", paymentMethod: "pix", date: daysAgo(13), notes: null },
    { categoryId: categories["Impostos"], description: "Alvará de funcionamento - renovação", amount: "290.00", paymentMethod: "pix", date: daysAgo(25), notes: null },
  );

  // Outros
  expenses.push(
    { categoryId: categories["Outros"], description: "Manutenção do ar-condicionado", amount: "350.00", paymentMethod: "pix", date: daysAgo(7), notes: "Limpeza e recarga de gás" },
    { categoryId: categories["Outros"], description: "Dedetização mensal", amount: "180.00", paymentMethod: "pix", date: daysAgo(19), notes: null },
    { categoryId: categories["Outros"], description: "Material de limpeza", amount: "145.00", paymentMethod: "cash", date: daysAgo(5), notes: null },
    { categoryId: categories["Outros"], description: "Troca de lâmpadas LED", amount: "120.00", paymentMethod: "card", date: daysAgo(10), notes: "6 lâmpadas" },
    { categoryId: categories["Outros"], description: "Reparo na pia da cozinha", amount: "200.00", paymentMethod: "pix", date: daysAgo(14), notes: null },
    { categoryId: categories["Outros"], description: "Compra de utensílios (facas e tábuas)", amount: "380.00", paymentMethod: "card", date: daysAgo(23), notes: null },
    { categoryId: categories["Outros"], description: "Uniforme equipe (4 camisetas)", amount: "240.00", paymentMethod: "pix", date: daysAgo(27), notes: null },
  );

  // Insert all expenses
  let inserted = 0;
  for (const exp of expenses) {
    await conn.execute(
      'INSERT INTO expenses (establishmentId, categoryId, description, amount, paymentMethod, date, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [ESTABLISHMENT_ID, exp.categoryId, exp.description, exp.amount, exp.paymentMethod, exp.date, exp.notes, exp.date]
    );
    inserted++;
  }
  console.log(`Inserted ${inserted} expenses`);

  // 4. Insert monthly goal
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  // Delete existing goal for this month
  await conn.execute(
    'DELETE FROM monthlyGoals WHERE establishmentId = ? AND month = ? AND year = ?',
    [ESTABLISHMENT_ID, month, year]
  );
  
  await conn.execute(
    'INSERT INTO monthlyGoals (establishmentId, month, year, targetProfit) VALUES (?, ?, ?, ?)',
    [ESTABLISHMENT_ID, month, year, "15000.00"]
  );
  console.log(`Set monthly goal: R$ 15.000,00 for ${month}/${year}`);

  await conn.end();
  console.log("Done!");
}

main().catch(console.error);
