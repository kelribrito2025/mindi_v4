import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const cardapioData = {
  estabelecimentoId: 90001,
  categorias: [
    {nome: "PROMOÇÃO DO DIA", ordem: 1},
    {nome: "AÇAÍ NA GARRAFA", ordem: 2},
    {nome: "COMBOS", ordem: 3},
    {nome: "AÇAÍ", ordem: 4},
    {nome: "AÇAÍ ZERO AÇUCAR", ordem: 5},
    {nome: "CUPUAÇU", ordem: 6},
    {nome: "CUPUAÇU+AÇAÍ", ordem: 7},
    {nome: "FROZEN", ordem: 8},
    {nome: "SORVETE", ordem: 9},
    {nome: "CAIXA 5 LITROS AÇAÍ PREMIUM", ordem: 10},
    {nome: "MONTE SEU AÇAÍ 1000ML", ordem: 11},
    {nome: "MONTE SEU AÇAÍ ZERO 1000ML", ordem: 12},
    {nome: "BEBIDAS", ordem: 13}
  ],
  produtos: [
    {categoria: "PROMOÇÃO DO DIA", nome: "Açaí 1000ml PURO", preco: 28.00},
    {categoria: "PROMOÇÃO DO DIA", nome: "Açaí zero 1000ml PURO", preco: 32.00},
    {categoria: "PROMOÇÃO DO DIA", nome: "Cupuaçu 1000ml PURO", preco: 35.00},
    {categoria: "AÇAÍ NA GARRAFA", nome: "AÇAÍ TRADICIONAL 300ml", descricao: "A batida é feita na hora com produtos de qualidade!!! Contém lactose.", preco: 12.00},
    {categoria: "AÇAÍ NA GARRAFA", nome: "AÇAÍ TRADICIONAL 500ml", descricao: "A batida é feita na hora com produtos de qualidade!!! Contém lactose.", preco: 18.00},
    {categoria: "AÇAÍ NA GARRAFA", nome: "AÇAÍ COM BANANA 300ml", descricao: "A batida é feita na hora com produtos de qualidade!!! Contém lactose.", preco: 12.00},
    {categoria: "AÇAÍ NA GARRAFA", nome: "AÇAÍ COM BANANA 500ml", descricao: "A batida é feita na hora com produtos de qualidade!!! Contém lactose.", preco: 18.00},
    {categoria: "COMBOS", nome: "2x acai 300ml", descricao: "Nesse combo os 2 açaí são iguais. Não alteramos itens individuas dos combos.", preco: 27.00},
    {categoria: "COMBOS", nome: "3x acai 300ml", descricao: "Os dois acai são iguais. Não alteramos itens dos combos!", preco: 40.00},
    {categoria: "COMBOS", nome: "2x acai 500ml", descricao: "Nesse combo os 2 açaí são iguais. Não alteramos itens individuais dos combos.", preco: 32.00},
    {categoria: "COMBOS", nome: "2x acai 1000ml PURO", descricao: "Nesse combo o açaí é puro. Sem nenhuma complemento.", preco: 56.00},
    {categoria: "AÇAÍ", nome: "300 ml", descricao: "02 frutas 04 complementos 02 coberturas", preco: 14.00, temComplementos: true},
    {categoria: "AÇAÍ", nome: "500 ml", descricao: "02 frutas 04 complementos 02 coberturas", preco: 17.00, temComplementos: true},
    {categoria: "AÇAÍ", nome: "700 ml", descricao: "02 frutas 04 complementos 02 coberturas", preco: 22.00, temComplementos: true},
    {categoria: "AÇAÍ", nome: "1000 ml", descricao: "02 frutas 04 complementos 02 coberturas", preco: 30.00, temComplementos: true},
    {categoria: "AÇAÍ ZERO AÇUCAR", nome: "300ml", descricao: "2 frutas 4 complementos 2 cobertura", preco: 17.00, temComplementos: true},
    {categoria: "AÇAÍ ZERO AÇUCAR", nome: "500ml", descricao: "2 frutas 4 complementos 2 coberturas", preco: 20.00, temComplementos: true},
    {categoria: "AÇAÍ ZERO AÇUCAR", nome: "700ml", descricao: "2 frutas 4 complementos 2 coberturas", preco: 26.00, temComplementos: true},
    {categoria: "AÇAÍ ZERO AÇUCAR", nome: "1000ml", descricao: "2 frutas 4 complementos 2 coberturas", preco: 35.00, temComplementos: true},
    {categoria: "CUPUAÇU", nome: "300 ml", descricao: "2 frutas, 2 caldas, 4 complementos", preco: 17.00, temComplementos: true},
    {categoria: "CUPUAÇU", nome: "500 ml", descricao: "2 frutas, 2 caldas, 4 complementos", preco: 22.00, temComplementos: true},
    {categoria: "CUPUAÇU", nome: "700 ml", descricao: "2 frutas, 2 caldas, 4 complementos", preco: 28.00, temComplementos: true},
    {categoria: "CUPUAÇU", nome: "1000 ml", descricao: "2 frutas, 2 caldas, 4 complementos", preco: 38.00, temComplementos: true},
    {categoria: "CUPUAÇU+AÇAÍ", nome: "300 ml", descricao: "2 frutas, 2 coberturas, 4 complementos", preco: 18.00, temComplementos: true},
    {categoria: "CUPUAÇU+AÇAÍ", nome: "500 ml", descricao: "2 frutas, 2 coberturas, 4 complementos", preco: 22.00, temComplementos: true},
    {categoria: "CUPUAÇU+AÇAÍ", nome: "700 ml", descricao: "2 frutas, 2 coberturas, 4 complementos", preco: 30.00, temComplementos: true},
    {categoria: "CUPUAÇU+AÇAÍ", nome: "1000 ml", descricao: "2 frutas, 2 coberturas, 4 complementos", preco: 38.00, temComplementos: true},
    {categoria: "FROZEN", nome: "300ml", descricao: "4 complementos 2 coberturas 2 frutas", preco: 18.00, temComplementos: true},
    {categoria: "FROZEN", nome: "500ml", descricao: "4 complementos 2 coberturas 2 frutas", preco: 22.00, temComplementos: true},
    {categoria: "FROZEN", nome: "700ml", descricao: "4 complementos 2 coberturas 2 frutas", preco: 28.00, temComplementos: true},
    {categoria: "FROZEN", nome: "1000ml", descricao: "4 complementos 2 coberturas 2 frutas", preco: 38.00, temComplementos: true},
    {categoria: "SORVETE", nome: "Sorvete avela 500ml", preco: 15.00},
    {categoria: "SORVETE", nome: "Sorvete ninho trufado 500ml", preco: 15.00},
    {categoria: "SORVETE", nome: "Sorvete napolitano 500ml", preco: 15.00},
    {categoria: "SORVETE", nome: "Sorvete morango 500ml", preco: 15.00},
    {categoria: "CAIXA 5 LITROS AÇAÍ PREMIUM", nome: "Caixa de 5 litros", descricao: "2 a 4 dias para chegar. Pedir com antecedência. Pagamento 50% antecipado.", preco: 90.00},
    {categoria: "MONTE SEU AÇAÍ 1000ML", nome: "Acai 1000ml", descricao: "Aqui os complementos e as coberturas serao em potes separados, somente as frutas vão dentro do açaí.", preco: 38.00, temComplementos: true},
    {categoria: "MONTE SEU AÇAÍ ZERO 1000ML", nome: "Acai zero 1000ml", descricao: "Aqui os complementos e as coberturas serao em potes separados, somente as frutas vão dentro do açaí.", preco: 42.00, temComplementos: true},
    {categoria: "BEBIDAS", nome: "Agua mineral sem gas", descricao: "agua natural 500 ml", preco: 4.00}
  ],
  gruposComplementos: [
    {nome: "ESCOLHA SUAS FRUTAS", min: 0, max: 2},
    {nome: "ESCOLHA SEUS COMPLEMENTOS", min: 0, max: 4},
    {nome: "ESCOLHA SUAS COBERTURAS", min: 0, max: 2},
    {nome: "ESCOLHA SEUS ADICIONAIS", min: 0, max: 15},
    {nome: "Deseja colherzinha?", min: 0, max: 1}
  ],
  complementos: {
    "ESCOLHA SUAS FRUTAS": [
      {nome: "Banana", preco: 0},
      {nome: "Morango", preco: 0},
      {nome: "Manga", preco: 0},
      {nome: "Uva", preco: 0}
    ],
    "ESCOLHA SEUS COMPLEMENTOS": [
      {nome: "Pacoca", preco: 0},
      {nome: "Leite em Po", preco: 0},
      {nome: "Amendoim", preco: 0},
      {nome: "Sucrilhos", preco: 0},
      {nome: "Chocoball", preco: 0},
      {nome: "Confetes", preco: 0},
      {nome: "Gotas de Chocolates", preco: 0},
      {nome: "Flocos de Arroz", preco: 0},
      {nome: "Granola", preco: 0}
    ],
    "ESCOLHA SUAS COBERTURAS": [
      {nome: "Leite Condensado", preco: 0},
      {nome: "Mel", preco: 0},
      {nome: "Chocolate", preco: 0},
      {nome: "Morango", preco: 0},
      {nome: "Menta", preco: 0},
      {nome: "Amora", preco: 0},
      {nome: "Caramelo", preco: 0}
    ],
    "ESCOLHA SEUS ADICIONAIS": [
      {nome: "Puro", preco: 1.00},
      {nome: "3 camadas de complementos", preco: 3.00},
      {nome: "2 camadas de frutas", preco: 3.00},
      {nome: "Creme de ninho", preco: 5.00},
      {nome: "Creme de Cupuacu", preco: 5.00},
      {nome: "Creme de Avela", preco: 5.00},
      {nome: "Frozen", preco: 5.00},
      {nome: "Ovomaltine", preco: 3.00},
      {nome: "Jujuba", preco: 3.00},
      {nome: "Tortuguita", preco: 3.00},
      {nome: "Baton", preco: 3.00},
      {nome: "2x Canudo Wafer simples", preco: 1.00},
      {nome: "Canudo Wafer recheado", preco: 1.00}
    ],
    "Deseja colherzinha?": [
      {nome: "Sim, por favor!", preco: 0},
      {nome: "Nao, obrigado.", preco: 0}
    ]
  }
};

async function importCardapio() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Iniciando importação do cardápio para estabelecimento', cardapioData.estabelecimentoId);
    
    // Mapa para guardar IDs das categorias criadas
    const categoryMap = new Map();
    
    // 1. Criar categorias
    console.log('\\n=== Criando categorias ===');
    for (const cat of cardapioData.categorias) {
      const [result] = await connection.execute(
        'INSERT INTO categories (establishmentId, name, sortOrder, isActive) VALUES (?, ?, ?, ?)',
        [cardapioData.estabelecimentoId, cat.nome, cat.ordem, true]
      );
      categoryMap.set(cat.nome, result.insertId);
      console.log(`✓ Categoria criada: ${cat.nome} (ID: ${result.insertId})`);
    }
    
    // Mapa para guardar IDs dos produtos que têm complementos
    const productMap = new Map();
    
    // 2. Criar produtos
    console.log('\\n=== Criando produtos ===');
    for (const prod of cardapioData.produtos) {
      const categoryId = categoryMap.get(prod.categoria);
      const [result] = await connection.execute(
        'INSERT INTO products (establishmentId, categoryId, name, description, price, status) VALUES (?, ?, ?, ?, ?, ?)',
        [cardapioData.estabelecimentoId, categoryId, prod.nome, prod.descricao || null, prod.preco, 'active']
      );
      
      if (prod.temComplementos) {
        productMap.set(`${prod.categoria}-${prod.nome}`, result.insertId);
      }
      console.log(`✓ Produto criado: ${prod.nome} - R$ ${prod.preco} (ID: ${result.insertId})`);
    }
    
    // 3. Criar grupos de complementos e itens para produtos que têm complementos
    console.log('\\n=== Criando grupos de complementos ===');
    for (const [key, productId] of productMap) {
      console.log(`\\nProduto: ${key} (ID: ${productId})`);
      
      let sortOrder = 0;
      for (const grupo of cardapioData.gruposComplementos) {
        const [groupResult] = await connection.execute(
          'INSERT INTO complementGroups (productId, name, minQuantity, maxQuantity, isRequired, sortOrder) VALUES (?, ?, ?, ?, ?, ?)',
          [productId, grupo.nome, grupo.min, grupo.max, grupo.min > 0, sortOrder++]
        );
        const groupId = groupResult.insertId;
        console.log(`  ✓ Grupo: ${grupo.nome} (ID: ${groupId})`);
        
        // Adicionar itens do grupo
        const itens = cardapioData.complementos[grupo.nome] || [];
        let itemSortOrder = 0;
        for (const item of itens) {
          await connection.execute(
            'INSERT INTO complementItems (groupId, name, price, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)',
            [groupId, item.nome, item.preco, true, itemSortOrder++]
          );
          console.log(`    - ${item.nome}: R$ ${item.preco}`);
        }
      }
    }
    
    console.log('\\n=== Importação concluída com sucesso! ===');
    console.log(`Categorias criadas: ${cardapioData.categorias.length}`);
    console.log(`Produtos criados: ${cardapioData.produtos.length}`);
    console.log(`Produtos com complementos: ${productMap.size}`);
    
  } catch (error) {
    console.error('Erro na importação:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

importCardapio();
