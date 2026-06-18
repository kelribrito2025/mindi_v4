import * as db from "../db";
import * as planSubDb from "../planSubscriptionDb";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { logger } from "../_core/logger";
import { sdk } from "../_core/sdk";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { sendMenuPublicEvent } from "../_core/sse";
import { z } from "zod";
import { zMoneyOptional } from "../../shared/validation";

const INSTAGRAM_USERNAME_MAX_LENGTH = 35;
const INSTAGRAM_LINK_PATTERN = /(?:https?:\/\/|www\.|instagram\.com)/i;
const DELIVERY_KM_ENABLED_PLAN_TYPES = new Set(['basic', 'essential', 'essencial', 'pro']);

const canUseDeliveryKmByPlan = (planType: unknown) => (
  DELIVERY_KM_ENABLED_PLAN_TYPES.has(String(planType || '').toLowerCase())
);

const normalizeInstagramUsername = (value: string) => value.trim().replace(/^@+/, "");

const instagramUsernameSchema = z.string()
  .trim()
  .refine((value) => !INSTAGRAM_LINK_PATTERN.test(value), {
    message: "Digite apenas o usuário do Instagram, sem link.",
  })
  .refine((value) => normalizeInstagramUsername(value).length <= INSTAGRAM_USERNAME_MAX_LENGTH, {
    message: "Instagram deve ter no máximo 35 caracteres.",
  })
  .transform(normalizeInstagramUsername);

export const establishmentRouter = router({
    get: protectedProcedure
      .input(z.object({ sessionUserId: z.number().optional() }).optional())
      .query(async ({ ctx }) => {
        return db.getEstablishmentByUserId(ctx.user.id);
      }),
    
    getOpenStatus: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getEstablishmentOpenStatus(input.establishmentId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        logo: z.string().optional(),
        logoBlur: z.string().nullable().optional(),
        coverImage: z.string().optional(),
        coverBlur: z.string().nullable().optional(),
        street: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        menuSlug: z.string().optional(),
        whatsapp: z.string().optional(),
        instagram: instagramUsernameSchema.optional(),
        // Novos campos do onboarding Step 2
        address: z.string().optional(), // Endereço completo (será parseado para street)
        openingTime: z.string().optional(), // Horário de abertura (HH:MM)
        closingTime: z.string().optional(), // Horário de fechamento (HH:MM)
        acceptsPix: z.boolean().optional(),
        acceptsCash: z.boolean().optional(),
        acceptsCard: z.boolean().optional(),
        deliveryTimeMin: z.number().optional(),
        deliveryTimeMax: z.number().optional(),
        deliveryTimeEnabled: z.boolean().optional(),
        minimumOrderEnabled: z.boolean().optional(),
        minimumOrderValue: z.string().optional(),
        deliveryFeeType: z.enum(["free", "fixed", "byNeighborhood", "byRadius"]).optional(),
        deliveryFeeFixed: zMoneyOptional,
        freeDeliveryEnabled: z.boolean().optional(),
        freeDeliveryMinValue: z.string().optional(),
        allowsDelivery: z.boolean().optional(),
        allowsPickup: z.boolean().optional(),
        timezone: z.string().optional(), // IANA timezone detectado do navegador
        ownerDisplayName: z.string().max(11).optional(),
        selectedPlan: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Multi-establishment: enforce limit of 3
        const currentCount = await db.countUserEstablishments(ctx.user.id);
        if (currentCount >= 3) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Limite de 3 estabelecimentos atingido. Não é possível criar mais.",
          });
        }
        // Separar campos auxiliares do input
        const { address, openingTime, closingTime, selectedPlan, ...establishmentData } = input;
        
        // Mapear o plano selecionado no onboarding para o planType do banco
        const planTypeMap: Record<string, string> = {
          free: 'trial', trial: 'trial', lite: 'lite', basic: 'basic', pro: 'pro',
        };
        const resolvedPlanType = selectedPlan && planTypeMap[selectedPlan] ? planTypeMap[selectedPlan] : 'trial';

        if (establishmentData.deliveryFeeType === 'byRadius' && !canUseDeliveryKmByPlan(resolvedPlanType)) {
          establishmentData.deliveryFeeType = 'free';
        }
        
        // Se tiver endereço, colocar no campo street
        // Se ownerDisplayName foi fornecido, também salvar como responsibleName
        const dataToSave = {
          ...establishmentData,
          street: address || establishmentData.street,
          userId: ctx.user.id,
          responsibleName: establishmentData.ownerDisplayName || null,
          planType: resolvedPlanType as any,
          ...(resolvedPlanType === 'trial' || resolvedPlanType === 'lite' ? { trialStartDate: new Date() } : {}),
        };
        const id = await db.createEstablishment(dataToSave);
        // Multi-establishment: add entry to user_establishments and set active
        await db.addUserEstablishment(ctx.user.id, id, "owner");
        await db.setActiveEstablishment(ctx.user.id, id);
        
        // Horários de funcionamento NÃO são criados automaticamente
        // O utilizador deve configurá-los manualmente via "Primeiros Passos" > "Configurar atendimento"
        
        return { id };
      }),
    // ============ Multi-Establishment Procedures ============

    // List all establishments the user has access to
    listUserEstablishments: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserEstablishments(ctx.user.id);
      }),

    // Select/switch active establishment
    selectEstablishment: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.setActiveEstablishment(ctx.user.id, input.establishmentId);
        return { success: true };
      }),

    // Clear active establishment (go back to selector)
    clearActiveEstablishment: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.clearActiveEstablishment(ctx.user.id);
        return { success: true };
      }),

    // Count user establishments (for limit check)
    countEstablishments: protectedProcedure
      .query(async ({ ctx }) => {
        const count = await db.countUserEstablishments(ctx.user.id);
        return { count, limit: 3 };
      }),
    // Set/unset default (favorite) establishment
    setDefaultEstablishment: protectedProcedure
      .input(z.object({ establishmentId: z.number().nullable() }))
      .mutation(async ({ ctx, input }) => {
        await db.setDefaultEstablishment(ctx.user.id, input.establishmentId);
        return { success: true };
      }),
    // Get user's default establishment ID
    getDefaultEstablishment: protectedProcedure
      .query(async ({ ctx }) => {
        const defaultId = await db.getDefaultEstablishmentId(ctx.user.id);
        return { defaultEstablishmentId: defaultId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        logo: z.string().nullable().optional(),
        logoBlur: z.string().nullable().optional(),
        coverImage: z.string().nullable().optional(),
        coverBlur: z.string().nullable().optional(),
        street: z.string().nullable().optional(),
        number: z.string().nullable().optional(),
        complement: z.string().nullable().optional(),
        neighborhood: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        state: z.string().nullable().optional(),
        zipCode: z.string().nullable().optional(),
        latitude: z.string().nullable().optional(),
        longitude: z.string().nullable().optional(),
        menuSlug: z.string().nullable().optional(),
        whatsapp: z.string().nullable().optional(),
        instagram: instagramUsernameSchema.nullable().optional(),
        acceptsCash: z.boolean().optional(),
        acceptsCard: z.boolean().optional(),
        acceptsPix: z.boolean().optional(),
        pixKey: z.string().nullable().optional(),
        pixHolderName: z.string().nullable().optional(),
        acceptsBoleto: z.boolean().optional(),
        allowsDelivery: z.boolean().optional(),
        allowsPickup: z.boolean().optional(),
        allowsDineIn: z.boolean().optional(),
        smsEnabled: z.boolean().optional(),
        deliveryTimeEnabled: z.boolean().optional(),
        deliveryTimeMin: z.number().optional(),
        deliveryTimeMax: z.number().optional(),
        minimumOrderEnabled: z.boolean().optional(),
        minimumOrderValue: z.string().optional(),
        deliveryFeeType: z.enum(["free", "fixed", "byNeighborhood", "byRadius"]).optional(),
        deliveryFeeFixed: zMoneyOptional,
        freeDeliveryEnabled: z.boolean().optional(),
        freeDeliveryMinValue: z.string().optional(),
        timezone: z.string().optional(),
        reviewsEnabled: z.boolean().optional(),
        fakeReviewCount: z.number().min(0).max(250).optional(),
        ownerDisplayName: z.string().max(11).nullable().optional(),
        autoAcceptOrders: z.boolean().optional(),
        whatsappBotEnabled: z.boolean().optional(),
        botOrdersEnabled: z.boolean().optional(),
        botQuestionsEnabled: z.boolean().optional(),
        paytimeCardEnabled: z.boolean().optional(),
        paytimeCardFeePassthrough: z.boolean().optional(),
        // Nomes customizados dos status de pedidos
        customStatusLabels: z.record(z.string(), z.string()).nullable().optional(),
        // Paytime Onboarding (Fase 4)
        paytimeEnabled: z.boolean().optional(),
        paytimeEstablishmentId: z.string().nullable().optional(),
        paytimeOnboardingStatus: z.enum(["not_started", "pending", "submitted", "approved", "rejected"]).optional(),
        paytimeGatewayActive: z.boolean().optional(),
        paytimeSplitConfigured: z.boolean().optional(),
        paytimeSplitRuleId: z.string().nullable().optional(),
        representativeName: z.string().nullable().optional(),
        representativeLastName: z.string().nullable().optional(),
        representativeCpf: z.string().nullable().optional(),
        representativeEmail: z.string().nullable().optional(),
        representativePhone: z.string().nullable().optional(),
        representativeBirthDate: z.string().nullable().optional(),
        cnae: z.string().nullable().optional(),
        razaoSocial: z.string().nullable().optional(),
        nomeFantasia: z.string().nullable().optional(),
        // Cor do background do menu público (hue-rotate em graus)
        menuBackgroundHue: z.number().min(0).max(360).nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        
        // Verificar que o utilizador é dono deste estabelecimento
        await assertEstablishmentOwnership(ctx.user.id, id);
        
        if (data.smsEnabled === true) {
          const whatsappConfig = await db.getWhatsappConfig(id);
          if (whatsappConfig?.status === 'connected') {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Não é possível ativar as Notificações SMS enquanto o WhatsApp estiver conectado.",
            });
          }
        }

        if (data.deliveryFeeType === 'byRadius') {
          const establishment = await db.getEstablishmentById(id);
          if (!canUseDeliveryKmByPlan(establishment?.planType)) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "A taxa por quilômetro está disponível apenas nos planos Essencial e Pro.",
            });
          }
        }

        // Validate slug uniqueness if provided
        if (data.menuSlug) {
          const isAvailable = await db.isSlugAvailable(data.menuSlug, id);
          if (!isAvailable) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Este link já está em uso por outro restaurante.",
            });
          }
        }
        
        await db.updateEstablishment(id, data);
        
        // Invalidar cache do menu público para refletir alterações imediatamente
        db.invalidatePublicMenuCache(id);
        
        // Invalidate OG image cache when visual fields change
        const visualFieldsChanged = data.name !== undefined || data.logo !== undefined || data.coverImage !== undefined || data.city !== undefined || data.state !== undefined || data.allowsDelivery !== undefined || data.allowsPickup !== undefined || data.allowsDineIn !== undefined || data.deliveryTimeMin !== undefined || data.deliveryTimeMax !== undefined;
        if (visualFieldsChanged) {
          try {
            const { invalidateOGCache } = await import("../og-image");
            // Get the slug for this establishment
            const est = await db.getEstablishmentById(id);
            if (est?.menuSlug) {
              invalidateOGCache(est.menuSlug);
              logger.info(`[OG-Cache] Invalidated cache for establishment ${id} (slug: ${est.menuSlug})`);
            }
          } catch (err) {
            logger.error('[OG-Cache] Error invalidating cache (non-blocking):', err);
          }
        }
        
        // PREVENÇÃO: Ao ativar o bot, garantir que existe API key não-global para o N8N
        if (data.whatsappBotEnabled === true) {
          try {
            const est = await db.getEstablishmentById(id);
            if (est) {
              await db.ensureNonGlobalBotApiKey(id, est.name);
            }
          } catch (err) {
            logger.error('[WhatsApp] Erro ao garantir API key não-global ao ativar bot (não bloqueante):', err);
          }
        }
        
        return { success: true };
      }),
    
    checkSlugAvailability: publicProcedure
      .input(z.object({
        slug: z.string().min(1),
        excludeId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const isAvailable = await db.isSlugAvailable(input.slug, input.excludeId);
        return { available: isAvailable };
      }),
    
    // Informações de trial e bloqueio obrigatório por cobrança vencida
    getTrialInfo: protectedProcedure.query(async ({ ctx }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) return null;
      
      // Plano Free é permanente e gratuito - não tem trial
      // Apenas planos pagos (trial/lite) têm período de teste
      const isFreePlan = establishment.planType === 'free';
      if (isFreePlan) {
        return { isTrial: false, trialExpired: false, daysRemaining: 0, planType: establishment.planType, isFreePlan: true };
      }

      const now = new Date();
      const paidPlanTypes = new Set(['lite', 'basic', 'pro']);
      const isPaidPlan = paidPlanTypes.has(String(establishment.planType));

      if (isPaidPlan) {
        const activeOrPastDueSubscription = await planSubDb.getActiveSubscription(establishment.id);
        const latestSubscription = activeOrPastDueSubscription
          ?? (await planSubDb.getAllSubscriptionsForEstablishment(establishment.id))[0]
          ?? null;
        const planExpiresAt = establishment.planExpiresAt ? new Date(establishment.planExpiresAt) : null;
        const gracePeriodEnd = latestSubscription?.gracePeriodEnd ? new Date(latestSubscription.gracePeriodEnd) : null;
        const planAccessExpired = planExpiresAt ? planExpiresAt.getTime() <= now.getTime() : false;
        const graceExpired = gracePeriodEnd ? gracePeriodEnd.getTime() <= now.getTime() : false;
        const subscriptionStatus = latestSubscription?.status;
        const billingBlocked =
          (subscriptionStatus === 'past_due' && graceExpired) ||
          ((subscriptionStatus === 'canceled' || subscriptionStatus === 'expired') && planAccessExpired);

        if (billingBlocked) {
          return {
            isTrial: false,
            trialExpired: true,
            daysRemaining: 0,
            planType: establishment.planType,
            isFreePlan: false,
            blockReason: 'payment_overdue',
            subscriptionStatus,
            gracePeriodEnd: latestSubscription?.gracePeriodEnd ?? null,
            planExpiresAt: establishment.planExpiresAt ?? null,
          };
        }
      }
      
      const isTrial = establishment.planType === 'trial' || establishment.planType === 'lite';
      if (!isTrial || !establishment.trialStartDate) {
        return { isTrial: false, trialExpired: false, daysRemaining: 0, planType: establishment.planType, isFreePlan: false };
      }
      
      const trialStart = new Date(establishment.trialStartDate);
      const trialEnd = new Date(trialStart.getTime() + establishment.trialDays * 24 * 60 * 60 * 1000);
      const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
      
      return {
        isTrial: true,
        daysRemaining,
        trialDays: establishment.trialDays,
        trialStartDate: establishment.trialStartDate,
        trialExpired: daysRemaining === 0,
        planType: establishment.planType,
        isFreePlan: false,
        blockReason: daysRemaining === 0 ? 'trial_expired' : null,
      };
    }),

    // Ativar plano após pagamento
    activatePlan: protectedProcedure
      .input(z.object({
        planType: z.enum(['lite', 'basic', 'pro']),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        await db.activatePlan(establishment.id, input.planType);
        return { success: true };
      }),

    toggleOpen: protectedProcedure
      .input(z.object({
        id: z.number(),
        isOpen: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.id);
        await db.toggleEstablishmentOpen(input.id, input.isOpen);
        // Invalidar cache do menu público para que o próximo refetch traga dados frescos
        db.invalidatePublicMenuCache(input.id);
        sendMenuPublicEvent(
          input.id,
          input.isOpen ? 'establishment_opened' : 'establishment_closed',
          { establishmentId: input.id, isOpen: input.isOpen }
        );
        return { success: true };
      }),
    
    // Nova mutation para fechamento manual com reabertura automática
    setManualClose: protectedProcedure
      .input(z.object({
        id: z.number(),
        close: z.boolean(), // true = fechar manualmente, false = abrir
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.id);
        await db.setManualClose(input.id, input.close);
        // Invalidar cache do menu público para que o próximo refetch traga dados frescos
        db.invalidatePublicMenuCache(input.id);
        sendMenuPublicEvent(
          input.id,
          input.close ? 'establishment_closed' : 'establishment_opened',
          { establishmentId: input.id, isOpen: !input.close }
        );
        return { success: true };
      }),
    
    // Salvar nota pública temporária
    savePublicNote: protectedProcedure
      .input(z.object({
        id: z.number(),
        note: z.string().max(80, "A nota deve ter no máximo 80 caracteres"),
        noteStyle: z.string().optional(),
        validityDays: z.number().min(1).max(7).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.id);
        await db.savePublicNote(input.id, input.note, input.noteStyle, input.validityDays);
        // Invalidar cache do menu público para refletir alteração imediatamente
        db.invalidatePublicMenuCache(input.id);
        sendMenuPublicEvent(input.id, 'menu_updated', { type: 'note_changed' });
        return { success: true };
      }),
    
    // Remover nota pública
    removePublicNote: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.id);
        await db.removePublicNote(input.id);
        // Invalidar cache do menu público para refletir remoção imediatamente
        db.invalidatePublicMenuCache(input.id);
        sendMenuPublicEvent(input.id, 'menu_updated', { type: 'note_removed' });
        return { success: true };
      }),
    
    // Buscar horários de funcionamento
    getBusinessHours: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getBusinessHoursByEstablishment(input.establishmentId);
      }),
    
    // Salvar horários de funcionamento
    saveBusinessHours: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        hours: z.array(z.object({
          dayOfWeek: z.number().min(0).max(6),
          isActive: z.boolean(),
          openTime: z.string().nullable(),
          closeTime: z.string().nullable(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await db.saveBusinessHours(input.establishmentId, input.hours);
        
        // Se o dia atual foi desligado, fechar a loja imediatamente
        const tz = await db.getEstablishmentTimezone(input.establishmentId);
        const localNow = db.getLocalDate(tz);
        const currentDayOfWeek = localNow.getDay();
        const todayHour = input.hours.find(h => h.dayOfWeek === currentDayOfWeek);
        
        if (todayHour && !todayHour.isActive) {
          // O dia atual foi desligado - verificar se a loja está aberta e fechar
          const currentStatus = await db.getEstablishmentOpenStatus(input.establishmentId);
          if (currentStatus.isOpen) {
            await db.setManualClose(input.establishmentId, true);
            // Invalidar cache e notificar via SSE
            db.invalidatePublicMenuCache(input.establishmentId);
            sendMenuPublicEvent(
              input.establishmentId,
              'establishment_closed',
              { establishmentId: input.establishmentId, isOpen: false }
            );
            logger.info('[BusinessHours] Loja fechada imediatamente ao desligar dia atual', {
              establishmentId: input.establishmentId,
              dayOfWeek: currentDayOfWeek,
            });
            return { success: true, closedImmediately: true };
          }
        }
        
        return { success: true, closedImmediately: false };
      }),
    
    // ============ CONTA E SEGURANÇA ============
    
    // Obter dados da conta
    getAccountData: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const accountData = await db.getEstablishmentAccountData(input.establishmentId);
        const establishment = await db.getEstablishmentById(input.establishmentId);
        const ownerUser = establishment?.userId ? await db.getUserById(establishment.userId) : null;
        const canonicalUserEmail = ownerUser?.email || ctx.user.email;
        const canonicalUserName = ownerUser?.name || ctx.user.name;

        // O e-mail canónico da conta é o de login/perfil (`users.email`).
        // `establishmentEmail` fica disponível apenas para diagnóstico/compatibilidade.
        return {
          ...accountData,
          email: canonicalUserEmail || accountData?.email || null,
          establishmentEmail: accountData?.email || null,
          userEmail: canonicalUserEmail,
          userName: canonicalUserName,
        };
      }),

    // Atualizar dados da conta
    updateAccountData: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1, "Nome do estabelecimento é obrigatório").optional(),
        email: z.string().email("Email inválido").nullable().optional(),
        cnpj: z.string().nullable().optional(),
        responsibleName: z.string().nullable().optional(),
        responsiblePhone: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { establishmentId, ...rawData } = input;
        const normalizedEmail = typeof input.email === "string" ? input.email.trim().toLowerCase() : input.email;
        const data = {
          ...rawData,
          ...(input.email !== undefined ? { email: normalizedEmail } : {}),
        };
        let targetUserIdForEmailUpdate: number | null = null;
        let targetUserOpenIdForCacheInvalidation: string | null = null;

        // Se o email foi alterado, validar antes de atualizar qualquer tabela.
        // O userId alvo deve vir do estabelecimento, pois um admin pode editar uma conta de outro usuário.
        if (normalizedEmail !== undefined && normalizedEmail !== null) {
          const establishment = await db.getEstablishmentById(establishmentId);
          const targetUserId = establishment?.userId ?? ctx.user.id;
          const usersWithEmail = await db.getUsersByEmail(normalizedEmail);

          if (usersWithEmail.some((existingUser) => existingUser.id !== targetUserId)) {
            throw new TRPCError({ code: "CONFLICT", message: "Este e-mail já está em uso por outra conta." });
          }

          const targetUser = await db.getUserById(targetUserId);
          targetUserIdForEmailUpdate = targetUserId;
          targetUserOpenIdForCacheInvalidation = targetUser?.openId ?? null;
        }

        // Manter o e-mail do estabelecimento e o e-mail de login sempre sincronizados.
        // A transação evita o estado parcial em que a tela mostra um e-mail e o perfil/login usam outro.
        if (targetUserIdForEmailUpdate !== null && normalizedEmail !== undefined && normalizedEmail !== null) {
          logger.info(`[Establishment] Updating establishment and login email for userId=${targetUserIdForEmailUpdate}`);
          await db.updateEstablishmentAccountDataAndUserEmail(establishmentId, data, targetUserIdForEmailUpdate, normalizedEmail);

          const cacheAwareSdk = sdk as typeof sdk & {
            invalidateUserCache?: (openId: string) => void | Promise<void>;
          };
          if (targetUserOpenIdForCacheInvalidation) {
            await cacheAwareSdk.invalidateUserCache?.(targetUserOpenIdForCacheInvalidation);
          }

          logger.info(`[Establishment] Establishment and login email updated successfully for userId=${targetUserIdForEmailUpdate}`);
        } else {
          await db.updateEstablishmentAccountData(establishmentId, data);
        }

        // Se o nome do responsável foi alterado, atualizar o nome do dono do estabelecimento e o ownerDisplayName
        if (input.responsibleName) {
          // Buscar o estabelecimento para obter o userId correcto (pode ser diferente do admin logado)
          const establishment = await db.getEstablishmentById(establishmentId);
          const targetUserId = establishment?.userId ?? ctx.user.id;
          await db.updateUserName(targetUserId, input.responsibleName);
          // Também atualizar o ownerDisplayName para manter o avatar sincronizado
          await db.updateEstablishment(establishmentId, { ownerDisplayName: input.responsibleName });
        }
        
        return { success: true };
      }),
    
    // Alterar senha
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1, "Senha atual é obrigatória"),
        newPassword: z.string().min(8, "Nova senha deve ter pelo menos 8 caracteres"),
        confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se as senhas coincidem
        if (input.newPassword !== input.confirmPassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Nova senha e confirmação não coincidem.",
          });
        }
        
        // Buscar usuário com hash da senha
        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Usuário não possui senha cadastrada.",
          });
        }
        
        // Verificar senha atual
        const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Senha atual incorreta.",
          });
        }
        
        // Atualizar senha
        const newPasswordHash = await bcrypt.hash(input.newPassword, 10);
        await db.updateUserPassword(ctx.user.id, newPasswordHash);
        
        return { success: true };
      }),
    
    // Toggle 2FA por e-mail
    toggleTwoFactor: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        enabled: z.boolean(),
        email: z.string().email("Email inválido").optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await db.updateTwoFactorSettings(input.establishmentId, input.enabled, input.email);
        return { success: true };
      }),
  });
