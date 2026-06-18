import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const campanhasRouter = router({
    // Buscar clientes únicos que fizeram pedidos
    getClientes: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const clientes = await db.getUniqueCustomers(establishment.id);
        return clientes;
      }),
    
    // Buscar clientes filtrados por critérios
    getClientesFiltrados: protectedProcedure
      .input(z.object({
        inactiveDays: z.number().min(0).optional(),
        minOrders: z.number().min(0).optional(),
        usedCoupon: z.boolean().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const clientes = await db.getFilteredCustomers(establishment.id, input || undefined);
        return clientes;
      }),

    // Buscar saldo SMS do estabelecimento
    getSaldo: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
      
      const balance = await db.getOrCreateSmsBalance(establishment.id);
      const lastDispatch = await db.getLastSmsDispatch(establishment.id);
      
      return {
        saldo: parseFloat(balance.balance as string),
        custoPorSms: parseFloat(balance.costPerSms as string),
        smsDisponiveis: Math.floor(parseFloat(balance.balance as string) / parseFloat(balance.costPerSms as string)),
        ultimoDisparo: lastDispatch?.createdAt || null,
      };
    }),
    
    // Buscar histórico de transações SMS
    getTransacoes: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        return await db.getSmsTransactions(establishment.id, input?.limit || 50);
      }),
    
    // Enviar SMS em massa para múltiplos destinatários
    enviarSMS: protectedProcedure
      .input(z.object({
        mensagem: z.string().min(1).max(160),
        destinatarios: z.array(z.string()).min(1),
        nomeCampanha: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        // Verificar saldo antes de enviar
        const saldoCheck = await db.debitSmsBalance(
          establishment.id,
          input.destinatarios.length,
          input.nomeCampanha || `Campanha ${establishment.name}`
        );
        
        if (!saldoCheck.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: saldoCheck.message,
          });
        }
        
        const { sendSMS } = await import('../_core/sms');
        
        const resultados: { numero: string; sucesso: boolean; erro?: string }[] = [];
        let enviados = 0;
        let falhas = 0;
        
        logger.info(`[Campanhas] Iniciando envio de SMS para ${input.destinatarios.length} destinatários`);
        logger.info(`[Campanhas] Mensagem: ${input.mensagem}`);
        
        for (const numero of input.destinatarios) {
          try {
            logger.info(`[Campanhas] Enviando SMS para ${numero}...`);
            const resultado = await sendSMS({
              to: numero,
              message: input.mensagem,
              campaignName: input.nomeCampanha || `Campanha ${establishment.name}`,
            });
            
            if (resultado.success) {
              enviados++;
              resultados.push({ numero, sucesso: true });
              logger.info(`[Campanhas] SMS enviado com sucesso para ${numero}`);
            } else {
              falhas++;
              resultados.push({ numero, sucesso: false, erro: resultado.error });
              logger.error(`[Campanhas] Falha ao enviar SMS para ${numero}: ${resultado.error}`);
            }
          } catch (error) {
            falhas++;
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            resultados.push({ numero, sucesso: false, erro: errorMessage });
            logger.error(`[Campanhas] Erro ao enviar SMS para ${numero}:`, error);
          }
        }
        
        // Se houve falhas, devolver créditos proporcionais
        if (falhas > 0) {
          const balance = await db.getOrCreateSmsBalance(establishment.id);
          const costPerSms = parseFloat(balance.costPerSms as string);
          const refundAmount = falhas * costPerSms;
          await db.addSmsCredit(
            establishment.id,
            refundAmount,
            `Estorno de ${falhas} SMS não enviados`
          );
          logger.info(`[Campanhas] Estorno de R$ ${refundAmount.toFixed(2)} por ${falhas} SMS não enviados`);
        }
        
        logger.info(`[Campanhas] Envio concluído: ${enviados} enviados, ${falhas} falhas`);
        
        return {
          total: input.destinatarios.length,
          enviados,
          falhas,
          resultados,
        };
      }),

    // Agendar campanha SMS
    agendarCampanha: protectedProcedure
      .input(z.object({
        mensagem: z.string().min(1).max(160),
        destinatarios: z.array(z.object({
          phone: z.string(),
          name: z.string(),
        })).min(1),
        nomeCampanha: z.string().optional(),
        scheduledAt: z.string(), // ISO date string
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const scheduledDate = new Date(input.scheduledAt);
        if (scheduledDate <= new Date()) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'A data de agendamento deve ser no futuro' });
        }
        
        // Verificar saldo antes de agendar
        const balance = await db.getOrCreateSmsBalance(establishment.id);
        const costPerSms = parseFloat(balance.costPerSms as string);
        const totalCost = input.destinatarios.length * costPerSms;
        const currentBalance = parseFloat(balance.balance as string);
        
        if (currentBalance < totalCost) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Saldo insuficiente. Necessário R$ ${totalCost.toFixed(2)}, disponível R$ ${currentBalance.toFixed(2)}`,
          });
        }
        
        const campaignId = await db.createScheduledCampaign({
          establishmentId: establishment.id,
          campaignName: input.nomeCampanha || `Campanha agendada ${establishment.name}`,
          message: input.mensagem,
          recipients: input.destinatarios,
          recipientCount: input.destinatarios.length,
          scheduledAt: scheduledDate,
          costPerSms,
          totalCost,
        });
        
        return { id: campaignId, scheduledAt: scheduledDate };
      }),

    // Listar campanhas agendadas
    listarAgendadas: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        return await db.getScheduledCampaigns(establishment.id);
      }),

    // Cancelar campanha agendada
    cancelarAgendada: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const cancelled = await db.cancelScheduledCampaign(input.id, establishment.id);
        if (!cancelled) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Campanha não encontrada ou já processada' });
        }
        
        return { success: true };
      }),

    // Listar pacotes de recarga SMS
    getPackages: protectedProcedure
      .query(async () => {
        const { SMS_PACKAGES } = await import("../stripe");
        return SMS_PACKAGES;
      }),

    // Criar sessão de checkout Stripe para recarga
    createCheckout: protectedProcedure
      .input(z.object({
        packageId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento n\u00e3o encontrado' });
        
        const { createSmsCheckoutSession } = await import("../stripe");
        const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, '') || '';
        
        const result = await createSmsCheckoutSession({
          packageId: input.packageId,
          userId: ctx.user.id,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || '',
          establishmentId: establishment.id,
          origin,
        });
        
        if (!result) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe n\u00e3o configurado. Configure as chaves em Configura\u00e7\u00f5es > Pagamento.' });
        }
        
        return result;
      }),

    // Criar sessão de checkout Stripe com valor personalizado
    createCustomCheckout: protectedProcedure
      .input(z.object({
        amountInCents: z.number().min(100, "Valor mínimo: R$ 1,00").max(100000, "Valor máximo: R$ 1.000,00"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const { createCustomSmsCheckoutSession, COST_PER_SMS } = await import("../stripe");
        const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, '') || '';
        
        const amountInReais = input.amountInCents / 100;
        const smsCount = Math.floor(amountInReais / COST_PER_SMS);
        
        if (smsCount < 1) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Valor insuficiente para pelo menos 1 SMS' });
        }
        
        const result = await createCustomSmsCheckoutSession({
          amountInCents: input.amountInCents,
          smsCount,
          userId: ctx.user.id,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || '',
          establishmentId: establishment.id,
          origin,
        });
        
        if (!result) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe não configurado. Configure as chaves em Configurações > Pagamento.' });
        }
        
        return { ...result, smsCount };
      }),
  });
