import { processRecurringExpenses } from "./db";
import { logger } from "./_core/logger";

let jobInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Busca todos os estabelecimentos com recorrências ativas e processa cada um.
 * Roda a cada 60 minutos.
 */
async function processAllRecurringExpenses() {
  try {
    // Import drizzle to query all distinct establishments with active recurring expenses
    const { drizzle } = await import("drizzle-orm/mysql2");
    const { recurringExpenses } = await import("../drizzle/schema");
    const { eq, sql } = await import("drizzle-orm");
    const { ENV } = await import("./_core/env");
    const mysql2 = await import("mysql2/promise");
    
    const connection = await mysql2.createConnection(ENV.databaseUrl);
    const db = drizzle(connection);
    
    // Get distinct establishment IDs with active recurring expenses
    const establishments = await db
      .selectDistinct({ establishmentId: recurringExpenses.establishmentId })
      .from(recurringExpenses)
      .where(eq(recurringExpenses.active, true));
    
    if (establishments.length === 0) {
      await connection.end();
      return;
    }
    
    logger.info(`[RecurringExpenses] Processando recorrências para ${establishments.length} estabelecimento(s)...`);
    
    let totalGenerated = 0;
    
    for (const { establishmentId } of establishments) {
      try {
        const result = await processRecurringExpenses(establishmentId);
        totalGenerated += result.generated;
        if (result.generated > 0) {
          logger.info(`[RecurringExpenses] Estabelecimento ${establishmentId}: ${result.generated} lançamento(s) gerado(s)`);
        }
      } catch (error) {
        logger.error(`[RecurringExpenses] Erro ao processar estabelecimento ${establishmentId}:`, error);
      }
    }
    
    if (totalGenerated > 0) {
      logger.info(`[RecurringExpenses] Total: ${totalGenerated} lançamento(s) gerado(s)`);
    }
    
    await connection.end();
  } catch (error) {
    logger.error("[RecurringExpenses] Erro no job de processamento:", error);
  }
}

/**
 * Inicia o job de processamento de despesas recorrentes.
 * Verifica a cada 60 minutos se há recorrências para gerar.
 */
export function startRecurringExpensesJob() {
  if (jobInterval) {
    logger.info("[RecurringExpenses] Job já está rodando");
    return;
  }
  
  logger.info("[RecurringExpenses] Iniciando job de processamento (intervalo: 60min)");
  
  // Processar imediatamente ao iniciar
  processAllRecurringExpenses();
  
  // Depois a cada 60 minutos
  jobInterval = setInterval(processAllRecurringExpenses, 60 * 60 * 1000);
}

export function stopRecurringExpensesJob() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    logger.info("[RecurringExpenses] Job parado");
  }
}
