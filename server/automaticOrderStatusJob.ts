import {
  autoCancelExpiredNewOrder,
  autoCompleteExpiredReadyOrder,
  getNewOrdersExpiredForAutoCancellation,
  getReadyOrdersExpiredForAutoCompletion,
} from "./db";
import { logger } from "./_core/logger";

const AUTO_ORDER_STATUS_INTERVAL_MS = 5 * 60 * 1000;
const NEW_ORDER_AUTO_CANCEL_AFTER_MS = 35 * 60 * 1000;
const READY_ORDER_AUTO_COMPLETE_AFTER_MS = 60 * 60 * 1000;

let jobInterval: ReturnType<typeof setInterval> | null = null;
let isProcessing = false;

async function processAutomaticOrderStatusRules() {
  if (isProcessing) {
    logger.info("[AutomaticOrderStatusJob] Execução anterior ainda em andamento; pulando ciclo");
    return;
  }

  isProcessing = true;

  try {
    const now = Date.now();
    const newOrderCutoff = new Date(now - NEW_ORDER_AUTO_CANCEL_AFTER_MS);
    const readyOrderCutoff = new Date(now - READY_ORDER_AUTO_COMPLETE_AFTER_MS);

    const [expiredNewOrders, expiredReadyOrders] = await Promise.all([
      getNewOrdersExpiredForAutoCancellation(newOrderCutoff),
      getReadyOrdersExpiredForAutoCompletion(readyOrderCutoff),
    ]);

    if (expiredNewOrders.length === 0 && expiredReadyOrders.length === 0) {
      return;
    }

    logger.info(
      `[AutomaticOrderStatusJob] Encontrados ${expiredNewOrders.length} pedido(s) Novo expirado(s) e ${expiredReadyOrders.length} pedido(s) Pronto expirado(s)`
    );

    let cancelledCount = 0;
    let completedCount = 0;

    for (const order of expiredNewOrders) {
      try {
        const changed = await autoCancelExpiredNewOrder(order.id);
        if (changed) {
          cancelledCount += 1;
          logger.info(`[AutomaticOrderStatusJob] Pedido ${order.orderNumber || order.id} cancelado automaticamente`);
        }
      } catch (error) {
        logger.error(`[AutomaticOrderStatusJob] Erro ao cancelar pedido ${order.id}:`, error);
      }
    }

    for (const order of expiredReadyOrders) {
      try {
        const changed = await autoCompleteExpiredReadyOrder(order.id);
        if (changed) {
          completedCount += 1;
          logger.info(`[AutomaticOrderStatusJob] Pedido ${order.orderNumber || order.id} finalizado automaticamente`);
        }
      } catch (error) {
        logger.error(`[AutomaticOrderStatusJob] Erro ao finalizar pedido ${order.id}:`, error);
      }
    }

    logger.info(
      `[AutomaticOrderStatusJob] Ciclo concluído: ${cancelledCount} cancelado(s), ${completedCount} finalizado(s)`
    );
  } catch (error) {
    logger.error("[AutomaticOrderStatusJob] Erro no processamento automático de pedidos:", error);
  } finally {
    isProcessing = false;
  }
}

export function startAutomaticOrderStatusJob() {
  if (jobInterval) {
    logger.info("[AutomaticOrderStatusJob] Job já está rodando");
    return;
  }

  logger.info("[AutomaticOrderStatusJob] Iniciando job de status automáticos de pedidos (intervalo: 5min)");

  processAutomaticOrderStatusRules();
  jobInterval = setInterval(processAutomaticOrderStatusRules, AUTO_ORDER_STATUS_INTERVAL_MS);
}

export function stopAutomaticOrderStatusJob() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    logger.info("[AutomaticOrderStatusJob] Job parado");
  }
}
