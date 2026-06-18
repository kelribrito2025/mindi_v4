import mysql from 'mysql2/promise';

// Taxas por bairro extraídas das imagens do Portal Mindi
const neighborhoodFees = [
  { neighborhood: "Alagoano", fee: 5.00 },
  { neighborhood: "B. Cabral", fee: 5.00 },
  { neighborhood: "B. do Quadro", fee: 5.00 },
  { neighborhood: "Barao de Monjardim", fee: 4.00 },
  { neighborhood: "Bela vista", fee: 6.00 },
  { neighborhood: "Bento Ferreira", fee: 12.00 },
  { neighborhood: "Capixaba", fee: 3.00 },
  { neighborhood: "Caratoira", fee: 5.00 },
  { neighborhood: "Centro de vitoria", fee: 3.00 },
  { neighborhood: "Cruzamento", fee: 7.00 },
  { neighborhood: "Fonte Grande", fee: 3.00 },
  { neighborhood: "Forte Sao Joao", fee: 5.00 },
  { neighborhood: "Ilha de Santa Maria", fee: 7.00 },
  { neighborhood: "Ilha do Principe", fee: 5.00 },
  { neighborhood: "Jucutuquara", fee: 12.00 },
  { neighborhood: "Mario cypreste", fee: 5.00 },
  { neighborhood: "Monte Belo", fee: 7.00 },
  { neighborhood: "PA - Praia do Sua", fee: 12.00 },
  { neighborhood: "Parque Moscoso", fee: 3.00 },
  { neighborhood: "Piedade", fee: 3.00 },
  { neighborhood: "Romao", fee: 7.00 },
  { neighborhood: "Santa Clara", fee: 3.00 },
  { neighborhood: "Santa Tereza", fee: 5.00 },
  { neighborhood: "Santo Antonio", fee: 5.00 },
  { neighborhood: "Vila Rubim", fee: 5.00 },
];

const ESTABLISHMENT_ID = 90001;

async function importNeighborhoodFees() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log(`Importando ${neighborhoodFees.length} taxas de bairro para o estabelecimento ${ESTABLISHMENT_ID}...`);
    
    // Primeiro, remover taxas existentes para este estabelecimento
    await connection.execute(
      'DELETE FROM neighborhoodFees WHERE establishmentId = ?',
      [ESTABLISHMENT_ID]
    );
    console.log('Taxas existentes removidas.');
    
    // Inserir novas taxas
    for (const item of neighborhoodFees) {
      await connection.execute(
        'INSERT INTO neighborhoodFees (establishmentId, neighborhood, fee) VALUES (?, ?, ?)',
        [ESTABLISHMENT_ID, item.neighborhood, item.fee]
      );
      console.log(`  ✓ ${item.neighborhood}: R$ ${item.fee.toFixed(2)}`);
    }
    
    // Atualizar o tipo de taxa de entrega para "byNeighborhood"
    await connection.execute(
      'UPDATE establishments SET deliveryFeeType = ? WHERE id = ?',
      ['byNeighborhood', ESTABLISHMENT_ID]
    );
    console.log('\nTipo de taxa de entrega atualizado para "Por Bairro".');
    
    console.log(`\n✅ Importação concluída! ${neighborhoodFees.length} bairros importados.`);
    
  } catch (error) {
    console.error('Erro ao importar taxas:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

importNeighborhoodFees();
