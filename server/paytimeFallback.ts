/**
 * Mecanismo de Fallback de Webhooks para Transações Paytime
 * 
 * Fluxo:
 * 1. Transação criada → status PENDING salvo localmente
 * 2. Webhook "updated-sub-transaction" → atualiza para PAID (fluxo normal)
 * 3. Se webhook não chegar em X minutos → fallback consulta API Paytime
 * 4. Se API retornar PAID/APPROVED → atualiza localmente com origem "fallback"
 * 
 * Boas práticas:
 * - Backoff exponencial para tentativas (2min, 4min, 8min, 16min, 32min)
 * - Máximo de 10 tentativas por transação
 * - Logs centralizados para auditoria
 * - Validação sempre na API da Paytime (fonte da verdade)
 */

import { logger } from "./_core/logger";
import { getTransaction } from "./paytime";
import {
  getPendingPaytimeTransactionsForFallback,
  updatePaytimeTransactionStatus,
  updatePaytimeFallbackAttempt,
  updateOrderStatus,
  getOrderById,
  deductStockForOrder,
} from "./db";

// Referência ao intervalo para poder cancelar
let fallbackInterval: ReturnType<typeof setInterval> | null = null;

// Flag para evitar execuções concorrentes
let isRunning = false;

/**
 * Executa uma rodada de verificação de fallback.
 * Busca transações PENDING antigas e consulta a API Paytime para cada uma.
 */
export async function runFallbackCheck(): Promise<{
  checked: number;
  updated: number;
  errors: number;
}> {
  if (isRunning) {
    logger.info("[Paytime Fallback] Já em execução, pulando esta rodada");
    return { checked: 0, updated: 0, errors: 0 };
  }

  isRunning = true;
  let checked = 0;
  let updated = 0;
  let errors = 0;

  try {
    const pendingTxs = await getPendingPaytimeTransactionsForFallback(3, 10);

    if (pendingTxs.length === 0) {
      return { checked: 0, updated: 0, errors: 0 };
    }

    logger.info(`[Paytime Fallback] Verificando ${pendingTxs.length} transações PENDING`);

    for (const tx of pendingTxs) {
      checked++;
      try {
        // Registrar tentativa de fallback (incrementa contador e atualiza timestamp)
        await updatePaytimeFallbackAttempt(tx.paytimeTransactionId);

        // Consultar API Paytime para obter status real
        const apiTx = await getTransaction(tx.paytimeTransactionId);

        if (!apiTx) {
          logger.warn(`[Paytime Fallback] Transação ${tx.paytimeTransactionId} não encontrada na API`);
          continue;
        }

        const apiStatus = apiTx.status?.toUpperCase();
        const paymentType = tx.paymentType === 'CREDIT_CARD' ? 'CARTÃO' : tx.paymentType;

        logger.info(`[Paytime Fallback] Transação ${tx.paytimeTransactionId}: local=PENDING, api=${apiStatus}`);

        // Se a API retornar PAID ou APPROVED, atualizar localmente
        if (apiStatus === 'APPROVED' || apiStatus === 'PAID') {
          await updatePaytimeTransactionStatus(
            tx.paytimeTransactionId,
            'APPROVED',
            new Date(),
            'fallback'
          );

          // Se tem pedido associado, atualizar status e deduzir estoque somente se ainda estiver pendente
          if (tx.orderId) {
            try {
              const order = await getOrderById(tx.orderId);
              if (order?.status === 'pending_confirmation') {
                await updateOrderStatus(tx.orderId, 'new');
                await deductStockForOrder(tx.orderId);
                logger.info(`[Paytime Fallback] Pedido ${tx.orderId} atualizado para 'new' e estoque deduzido via fallback`);
              } else {
                logger.info(`[Paytime Fallback] Pedido ${tx.orderId} já não está pendente; confirmação idempotente ignorada (status=${order?.status || 'N/A'})`);
              }
            } catch (orderErr) {
              logger.error(`[Paytime Fallback] Erro ao confirmar pedido ${tx.orderId}:`, orderErr);
            }
          }

          updated++;
          logger.info(`[Paytime Fallback] ✅ Pagamento ${paymentType} confirmado via FALLBACK: transação ${tx.paytimeTransactionId}, pedido ${tx.orderId || 'N/A'}`);

        } else if (apiStatus === 'FAILED' || apiStatus === 'CANCELLED' || apiStatus === 'EXPIRED') {
          // Transação falhou/cancelou/expirou - atualizar localmente
          const mappedStatus = apiStatus as "FAILED" | "CANCELLED" | "EXPIRED";
          await updatePaytimeTransactionStatus(
            tx.paytimeTransactionId,
            mappedStatus,
            undefined,
            'fallback'
          );
          updated++;
          logger.info(`[Paytime Fallback] Transação ${paymentType} ${apiStatus} via FALLBACK: ${tx.paytimeTransactionId}`);

        } else if (apiStatus === 'REFUNDED') {
          await updatePaytimeTransactionStatus(
            tx.paytimeTransactionId,
            'REFUNDED',
            undefined,
            'fallback'
          );
          updated++;
          logger.info(`[Paytime Fallback] Transação ${paymentType} REFUNDED via FALLBACK: ${tx.paytimeTransactionId}`);

        } else if (apiStatus === 'WAITING_ANTIFRAUD') {
          await updatePaytimeTransactionStatus(
            tx.paytimeTransactionId,
            'WAITING_ANTIFRAUD',
            undefined,
            'fallback'
          );
          updated++;
          logger.info(`[Paytime Fallback] Transação ${paymentType} aguardando antifraude: ${tx.paytimeTransactionId}`);

        } else {
          // Status ainda PENDING na API - nada a fazer, backoff cuidará
          logger.info(`[Paytime Fallback] Transação ${tx.paytimeTransactionId} ainda PENDING na API (tentativa ${(tx.fallbackAttempts ?? 0) + 1})`);
        }

      } catch (txErr) {
        errors++;
        logger.error(`[Paytime Fallback] Erro ao verificar transação ${tx.paytimeTransactionId}:`, txErr);
      }
    }

    if (checked > 0) {
      logger.info(`[Paytime Fallback] Rodada concluída: ${checked} verificadas, ${updated} atualizadas, ${errors} erros`);
    }

  } catch (err) {
    logger.error("[Paytime Fallback] Erro na rodada de fallback:", err);
  } finally {
    isRunning = false;
  }

  return { checked, updated, errors };
}

/**
 * Inicia o job periódico de fallback.
 * Executa a cada 2 minutos para verificar transações PENDING.
 */
export function startPaytimeFallbackJob(): void {
  if (fallbackInterval) {
    logger.warn("[Paytime Fallback] Job já está rodando, ignorando");
    return;
  }

  // Intervalo de 2 minutos (120 segundos)
  const INTERVAL_MS = 2 * 60 * 1000;

  fallbackInterval = setInterval(async () => {
    try {
      await runFallbackCheck();
    } catch (err) {
      logger.error("[Paytime Fallback] Erro não tratado no job:", err);
    }
  }, INTERVAL_MS);

  // Executar primeira verificação após 30 segundos do startup
  setTimeout(async () => {
    try {
      await runFallbackCheck();
    } catch (err) {
      logger.error("[Paytime Fallback] Erro na verificação inicial:", err);
    }
  }, 30 * 1000);

  logger.info(`[Paytime Fallback] Job iniciado - verificação a cada ${INTERVAL_MS / 1000}s`);
}

/**
 * Para o job periódico de fallback.
 */
export function stopPaytimeFallbackJob(): void {
  if (fallbackInterval) {
    clearInterval(fallbackInterval);
    fallbackInterval = null;
    logger.info("[Paytime Fallback] Job parado");
  }
}
