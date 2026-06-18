import { getPendingCampaignsDue, updateScheduledCampaignStatus, debitSmsBalance, getOrCreateSmsBalance, addSmsCredit } from "./db";
import { sendSMS } from "./_core/sms";
import { logger } from "./_core/logger";

let jobInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Processa campanhas agendadas que já passaram do horário
 * Roda a cada 60 segundos
 */
async function processPendingCampaigns() {
  try {
    const campaigns = await getPendingCampaignsDue();
    
    if (campaigns.length === 0) return;
    
    logger.info(`[ScheduledCampaigns] Processando ${campaigns.length} campanha(s) pendente(s)...`);
    
    for (const campaign of campaigns) {
      try {
        const recipients = typeof campaign.recipients === 'string' 
          ? JSON.parse(campaign.recipients) 
          : campaign.recipients;
        
        if (!Array.isArray(recipients) || recipients.length === 0) {
          await updateScheduledCampaignStatus(campaign.id, "failed");
          logger.error(`[ScheduledCampaigns] Campanha ${campaign.id}: sem destinatários válidos`);
          continue;
        }
        
        // Debitar saldo
        const saldoCheck = await debitSmsBalance(
          campaign.establishmentId,
          recipients.length,
          campaign.campaignName
        );
        
        if (!saldoCheck.success) {
          await updateScheduledCampaignStatus(campaign.id, "failed");
          logger.error(`[ScheduledCampaigns] Campanha ${campaign.id}: ${saldoCheck.message}`);
          continue;
        }
        
        let successCount = 0;
        let failCount = 0;
        
        for (const recipient of recipients) {
          try {
            const phone = typeof recipient === 'string' ? recipient : recipient.phone;
            const result = await sendSMS({
              to: phone,
              message: campaign.message,
              campaignName: campaign.campaignName,
            });
            
            if (result.success) {
              successCount++;
            } else {
              failCount++;
              logger.error(`[ScheduledCampaigns] Falha ao enviar para ${phone}: ${result.error}`);
            }
          } catch (error) {
            failCount++;
            logger.error(`[ScheduledCampaigns] Erro ao enviar SMS:`, error);
          }
        }
        
        // Estornar créditos de falhas
        if (failCount > 0) {
          const balance = await getOrCreateSmsBalance(campaign.establishmentId);
          const costPerSms = parseFloat(balance.costPerSms as string);
          const refundAmount = failCount * costPerSms;
          await addSmsCredit(
            campaign.establishmentId,
            refundAmount,
            `Estorno de ${failCount} SMS não enviados - ${campaign.campaignName}`
          );
        }
        
        await updateScheduledCampaignStatus(campaign.id, "sent", {
          sentAt: new Date(),
          successCount,
          failCount,
        });
        
        logger.info(`[ScheduledCampaigns] Campanha ${campaign.id} processada: ${successCount} enviados, ${failCount} falhas`);
        
      } catch (error) {
        await updateScheduledCampaignStatus(campaign.id, "failed");
        logger.error(`[ScheduledCampaigns] Erro ao processar campanha ${campaign.id}:`, error);
      }
    }
  } catch (error) {
    logger.error("[ScheduledCampaigns] Erro no job de processamento:", error);
  }
}

/**
 * Inicia o job de processamento de campanhas agendadas
 * Verifica a cada 60 segundos se há campanhas pendentes
 */
export function startScheduledCampaignJob() {
  if (jobInterval) {
    logger.info("[ScheduledCampaigns] Job já está rodando");
    return;
  }
  
  logger.info("[ScheduledCampaigns] Iniciando job de processamento (intervalo: 60s)");
  
  // Processar imediatamente ao iniciar
  processPendingCampaigns();
  
  // Depois a cada 60 segundos
  jobInterval = setInterval(processPendingCampaigns, 60 * 1000);
}

export function stopScheduledCampaignJob() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    logger.info("[ScheduledCampaigns] Job parado");
  }
}
