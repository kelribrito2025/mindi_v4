import * as db from "../db";
import crypto from 'crypto';
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { botApiKeys } from '../../drizzle/schema';
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { hashApiKey } from "../_core/apiKeyHash";


export const whatsappRouter = router({
    // Retorna META_APP_ID e META_CONFIG_ID para o frontend (valores públicos)
    getMetaConfig: publicProcedure
      .query(async () => {
        const { ENV } = await import('../_core/env');
        return {
          appId: ENV.metaAppId || '',
          configId: ENV.metaConfigId || '',
        };
      }),

    // Obter configuração do WhatsApp
    getConfig: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) return null;
        
        const config = await db.getWhatsappConfig(establishment.id);
        if (!config) return null;
        
        // Se tem instanceToken (UAZAPI) e o status no DB não é 'connected',
        // fazer verificação live para corrigir status stale no banner
        if (config.instanceToken && config.provider === 'uazapi' && config.status !== 'connected') {
          try {
            const { getInstanceStatus } = await import('../_core/uazapi');
            const liveStatus = await getInstanceStatus(config.instanceToken);
            
            // Se o status real é diferente do DB, atualizar o DB
            if (liveStatus.status !== config.status) {
              await db.updateWhatsappStatus(
                establishment.id,
                liveStatus.status,
                liveStatus.phone || null,
                liveStatus.qrcode || null
              );
              if (liveStatus.status === 'connected') {
                await db.updateEstablishment(establishment.id, { smsEnabled: false });
              }
              // Retornar config com status atualizado
              return { ...config, status: liveStatus.status, connectedPhone: liveStatus.phone || config.connectedPhone };
            }
          } catch (err) {
            // Se falhar a verificação live, retornar config do DB normalmente
            logger.error('[WhatsApp getConfig] Erro na verificação live (não bloqueante):', err);
          }
        }
        
        if (config.status === 'connected') {
          await db.updateEstablishment(establishment.id, { smsEnabled: false });
        }
        return config;
      }),
    
    // Salvar configurações de notificação (sem precisar de subdomain/token)
    saveNotificationSettings: protectedProcedure
      .input(z.object({
        requireOrderConfirmation: z.boolean().optional(),
        notifyOnNewOrder: z.boolean().optional(),
        notifyOnPreparing: z.boolean().optional(),
        notifyOnReady: z.boolean().optional(),
        notifyOnOutForDelivery: z.boolean().optional(),
        notifyOnCompleted: z.boolean().optional(),
        notifyOnCancelled: z.boolean().optional(),
        notifyOnReservation: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        // Confirmação via botões está temporariamente bloqueada
        input.requireOrderConfirmation = false;
        
        // Se está ativando confirmação via botões, configurar webhook automaticamente
        if (input.requireOrderConfirmation) {
          const whatsappConfig = await db.getWhatsappConfig(establishment.id);
          if (whatsappConfig?.instanceToken) {
            const { configureWebhook } = await import('../_core/uazapi');
            // Usar a URL do app publicado
            const appUrl = process.env.VITE_APP_URL || 'https://mindi.manus.space';
            const secret = whatsappConfig.webhookSecret || '';
            const webhookUrl = secret
              ? `${appUrl}/api/webhook/whatsapp/${establishment.id}?token=${secret}`
              : `${appUrl}/api/webhook/whatsapp/${establishment.id}`;
            
            try {
              const result = await configureWebhook(whatsappConfig.instanceToken, webhookUrl);
              logger.info('[WhatsApp] Webhook configurado automaticamente:', { establishmentId: establishment.id, webhookUrl, success: result.success });
            } catch (error) {
              logger.error('[WhatsApp] Erro ao configurar webhook:', error);
              // Não falhar a operação, apenas logar o erro
            }
          }
        }
        
        await db.upsertWhatsappConfig({
          establishmentId: establishment.id,
          requireOrderConfirmation: input.requireOrderConfirmation,
          notifyOnNewOrder: input.notifyOnNewOrder,
          notifyOnPreparing: input.notifyOnPreparing,
          notifyOnReady: input.notifyOnReady,
          notifyOnOutForDelivery: input.notifyOnOutForDelivery,
          notifyOnCompleted: input.notifyOnCompleted,
          notifyOnCancelled: input.notifyOnCancelled,
          notifyOnReservation: input.notifyOnReservation,
        });
        
        return { success: true };
      }),
    
    // Conectar instância ao WhatsApp (gera QR code automaticamente)
    connect: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const { isUazapiConfigured, getOrCreateInstance, connectInstance, configureWebhook } = await import('../_core/uazapi');
        
        // Verificar se UAZAPI está configurado
        if (!isUazapiConfigured()) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'WhatsApp não configurado no sistema' });
        }
        
        // Obter ou criar instância para este estabelecimento
        let config = await db.getWhatsappConfig(establishment.id);
        
        if (!config || !config.instanceToken) {
          // Criar nova instância
          const instanceResult = await getOrCreateInstance(establishment.id, establishment.name);
          
          if (!instanceResult.success) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: instanceResult.message || 'Erro ao criar instância' });
          }
          
          // P10: Gerar token secreto para autenticação do webhook
          const webhookSecret = crypto.randomBytes(32).toString('hex');
          
          // Salvar instância no banco (com webhookSecret)
          await db.upsertWhatsappConfig({
            establishmentId: establishment.id,
            instanceId: instanceResult.instanceId,
            instanceToken: instanceResult.instanceToken,
            webhookSecret,
          });
          
          // Configurar webhook para nosso endpoint (que encaminha para n8n automaticamente)
          if (instanceResult.instanceToken) {
            const appUrl = process.env.VITE_APP_URL || 'https://mindi.manus.space';
            const APP_WEBHOOK_URL = `${appUrl}/api/webhook/whatsapp/${establishment.id}?token=${webhookSecret}`;
            try {
              const webhookResult = await configureWebhook(instanceResult.instanceToken, APP_WEBHOOK_URL);
              logger.info('[WhatsApp] Webhook app configurado automaticamente:', webhookResult.success ? 'OK' : webhookResult.message, 'URL:', APP_WEBHOOK_URL);
            } catch (webhookError) {
              logger.error('[WhatsApp] Erro ao configurar webhook app (não bloqueante):', webhookError);
            }
          }
          
          // Criar API Key global automaticamente se não existir
          try {
            const dbInstance = await db.getDb();
            if (dbInstance) {
              const existingGlobalKey = await dbInstance.select().from(botApiKeys)
                .where(and(
                  eq(botApiKeys.establishmentId, establishment.id),
                  eq(botApiKeys.isGlobal, true)
                ))
                .limit(1);
              
              if (existingGlobalKey.length === 0) {
                const apiKey = `bot_global_${crypto.randomBytes(32).toString('hex')}`;
                await dbInstance.insert(botApiKeys).values({
                  establishmentId: establishment.id,
                  name: `Bot ${establishment.name}`,
                  apiKey,
                  apiKeyHash: hashApiKey(apiKey), // P09: Armazenar hash SHA-256
                  isActive: true,
                  isGlobal: true,
                  requestCount: 0,
                });
                logger.info('[WhatsApp] API Key global criada automaticamente para estabelecimento:', establishment.id);
              }
            }
          } catch (apiKeyError) {
            logger.error('[WhatsApp] Erro ao criar API Key global (não bloqueante):', apiKeyError);
          }
          
          config = await db.getWhatsappConfig(establishment.id);
        }
        
        if (!config?.instanceToken) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Token da instância não encontrado' });
        }
        
        // Conectar instância
        const result = await connectInstance(config.instanceToken);
        
        // Configurar webhook para nosso endpoint (que encaminha para n8n automaticamente)
        {
          const appUrl = process.env.VITE_APP_URL || 'https://mindi.manus.space';
          // P10: Incluir token secreto na URL do webhook se disponível
          const secret = config.webhookSecret || '';
          const APP_WEBHOOK_URL = secret
            ? `${appUrl}/api/webhook/whatsapp/${establishment.id}?token=${secret}`
            : `${appUrl}/api/webhook/whatsapp/${establishment.id}`;
          try {
            const webhookResult = await configureWebhook(config.instanceToken, APP_WEBHOOK_URL);
            logger.info('[WhatsApp] Webhook app configurado na conexão:', webhookResult.success ? 'OK' : webhookResult.message, 'URL:', APP_WEBHOOK_URL);
          } catch (webhookError) {
            logger.error('[WhatsApp] Erro ao configurar webhook app na conexão (não bloqueante):', webhookError);
          }
        }
        
        // Atualizar status no banco
        await db.updateWhatsappStatus(
          establishment.id, 
          result.status,
          null,
          result.qrcode || null
        );
        if (result.status === 'connected') {
          await db.updateEstablishment(establishment.id, { smsEnabled: false });
        }
        
        return result;
      }),
    
    // Verificar status da conexão
    getStatus: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const config = await db.getWhatsappConfig(establishment.id);
        if (!config || !config.instanceToken) {
          return { success: false, status: 'disconnected' as const, message: 'Não configurado' };
        }
        
        const { getInstanceStatus } = await import('../_core/uazapi');
        const result = await getInstanceStatus(config.instanceToken);
        
        // Atualizar status no banco
        if (result.status !== config.status || result.phone !== config.connectedPhone) {
          await db.updateWhatsappStatus(
            establishment.id,
            result.status,
            result.phone || null,
            result.qrcode || null
          );
          
          // PREVENÇÃO: Ao conectar com um número, limpar esse número de outros estabelecimentos
          if (result.status === 'connected' && result.phone) {
            try {
              await db.clearPhoneFromOtherEstablishments(establishment.id, result.phone);
            } catch (err) {
              logger.error('[WhatsApp] Erro ao limpar phone de outros estabelecimentos (não bloqueante):', err);
            }
            
            // PREVENÇÃO: Garantir que existe API key não-global para o N8N
            try {
              await db.ensureNonGlobalBotApiKey(establishment.id, establishment.name);
            } catch (err) {
              logger.error('[WhatsApp] Erro ao garantir API key não-global (não bloqueante):', err);
            }
            
          }
        }
        
        // AUTO-RECONFIGURAR webhook para nosso endpoint SEMPRE que conectado
        // (fora da condição de mudança de status para garantir migração)
        if (result.status === 'connected') {
          await db.updateEstablishment(establishment.id, { smsEnabled: false });
          try {
            const { configureWebhook } = await import('../_core/uazapi');
            const appUrl = process.env.VITE_APP_URL || 'https://mindi.manus.space';
            const secret = config.webhookSecret || '';
            const APP_WEBHOOK_URL = secret
              ? `${appUrl}/api/webhook/whatsapp/${establishment.id}?token=${secret}`
              : `${appUrl}/api/webhook/whatsapp/${establishment.id}`;
            await configureWebhook(config.instanceToken, APP_WEBHOOK_URL);
            logger.info('[WhatsApp] Webhook auto-reconfigurado para:', APP_WEBHOOK_URL);
          } catch (whErr) {
            logger.error('[WhatsApp] Erro ao auto-reconfigurar webhook (não bloqueante):', whErr);
          }
        }
        
        return result;
      }),
    
    // Desconectar instância
    disconnect: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const config = await db.getWhatsappConfig(establishment.id);
        if (!config || !config.instanceToken) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'WhatsApp não configurado' });
        }
        
        const { disconnectInstance } = await import('../_core/uazapi');
        const result = await disconnectInstance(config.instanceToken);
        
        // Atualizar status no banco — LIMPAR connectedPhone ao desconectar
        await db.updateWhatsappStatus(establishment.id, 'disconnected', null, null);
        
        logger.info(`[WhatsApp] Desconectado e connectedPhone limpo para estabelecimento ${establishment.id}`);
        
        return result;
      }),
    
    // Enviar mensagem de teste
    sendTest: protectedProcedure
      .input(z.object({
        phone: z.string().min(10, "Telefone inválido"),
        message: z.string().min(1, "Mensagem é obrigatória"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const config = await db.getWhatsappConfig(establishment.id);
        if (!config || config.status !== 'connected') {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'WhatsApp não configurado ou desconectado' });
        }

        const { getWhatsAppProvider } = await import('../_core/whatsappProvider');
        const wa = await getWhatsAppProvider(establishment.id);
        return wa.sendText(input.phone, input.message);
      }),
    
    // Salvar templates de mensagem
    saveTemplates: protectedProcedure
      .input(z.object({
        templateNewOrder: z.string().nullable().optional(),
        templatePreparing: z.string().nullable().optional(),
        templateReady: z.string().nullable().optional(),
        templateReadyPickup: z.string().nullable().optional(),
        templateCompleted: z.string().nullable().optional(),
        templateCancelled: z.string().nullable().optional(),
        templateReservation: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        await db.upsertWhatsappConfig({
          establishmentId: establishment.id,
          templateNewOrder: input.templateNewOrder,
          templatePreparing: input.templatePreparing,
          templateReady: input.templateReady,
          templateReadyPickup: input.templateReadyPickup,
          templateCompleted: input.templateCompleted,
          templateCancelled: input.templateCancelled,
          templateReservation: input.templateReservation,
        });
        
        return { success: true };
      }),

    // ─── WhatsApp Cloud API (Meta) ─────────────────────────────────────────────

    /**
     * Finaliza o fluxo do Embedded Signup.
     * Recebe o código curto gerado pelo SDK do Facebook, troca pelo token
     * de acesso, e salva o WABA/Phone Number do estabelecimento no banco.
     */
    connectOfficial: protectedProcedure
      .input(z.object({
        code: z.string().min(1),
        wabaId: z.string().optional(),
        phoneNumberId: z.string().optional(),
        businessId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

        const { exchangeCodeForToken, subscribeWabaWebhook } = await import('../_core/whatsappOfficial');

        let tokenData: Awaited<ReturnType<typeof exchangeCodeForToken>>;
        try {
          tokenData = await exchangeCodeForToken(input.code, {
            wabaId: input.wabaId,
            phoneNumberId: input.phoneNumberId,
            businessId: input.businessId,
          });
        } catch (err) {
          logger.error('[WhatsApp Official] Falha na troca de código:', err);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Não foi possível conectar à conta WhatsApp. Tente novamente.',
          });
        }

        // Inscrever webhook para esta WABA (necessário uma vez por conta)
        await subscribeWabaWebhook(tokenData.wabaId, tokenData.accessToken);

        await db.upsertWhatsappConfig({
          establishmentId: establishment.id,
          provider: 'official',
          wabaId: tokenData.wabaId,
          phoneNumberId: tokenData.phoneNumberId,
          accessToken: tokenData.accessToken,
          businessId: tokenData.businessId,
          status: 'connected',
          connectedPhone: tokenData.phoneNumber,
        });
        await db.updateEstablishment(establishment.id, { smsEnabled: false });

        logger.info('[WhatsApp Official] Conectado com sucesso:', {
          establishmentId: establishment.id,
          phone: tokenData.phoneNumber,
          wabaId: tokenData.wabaId,
        });

        return { success: true, phoneNumber: tokenData.phoneNumber };
      }),

    /**
     * Desconecta a conta oficial e volta o provider para 'uazapi' (ou desconectado).
     * Os campos da UAZAPI são preservados — o estabelecimento pode reconectar
     * o QR code sem perder nada.
     */
    disconnectOfficial: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });

        await db.upsertWhatsappConfig({
          establishmentId: establishment.id,
          provider: 'uazapi',
          wabaId: null,
          phoneNumberId: null,
          accessToken: null,
          businessId: null,
          status: 'disconnected',
          connectedPhone: null,
        });

        return { success: true };
      }),
  });
