/**
 * Admin Router
 * Endpoints exclusivos para a área administrativa global.
 * Autenticação separada do sistema de restaurantes.
 */
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";
import * as adminDb from "./adminDb";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { logger } from "./_core/logger";

const ADMIN_COOKIE_NAME = "admin_session";
// Secret dedicado para JWT admin — obrigatório e independente do cookieSecret
const ADMIN_JWT_SECRET = (() => {
  if (!ENV.adminJwtSecret) {
    throw new Error("FATAL: ADMIN_JWT_SECRET environment variable is required. Configure-a antes de fazer deploy.");
  }
  return ENV.adminJwtSecret;
})();

// Helper: create admin JWT
function createAdminToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email, role: "admin" },
    ADMIN_JWT_SECRET,
    { expiresIn: "7d" }
  );
}

type AdminSession = { userId: number; email: string };

// Helper: verify admin JWT from request
// A01: Usa req.cookies (cookie-parser já disponível no middleware) em vez de parsing manual
function getAdminTokenPayload(req: any): AdminSession | null {
  try {
    const token = req.cookies?.[ADMIN_COOKIE_NAME];
    if (!token) return null;

    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as any;
    if (decoded.role !== "admin") return null;
    if (typeof decoded.userId !== "number" || typeof decoded.email !== "string") return null;

    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
}

async function getVerifiedAdminFromRequest(req: any): Promise<AdminSession | null> {
  const payload = getAdminTokenPayload(req);
  if (!payload) return null;

  const admin = await adminDb.getAdminById(payload.userId);
  if (!admin?.email || admin.email !== payload.email) return null;

  return { userId: admin.id, email: admin.email };
}

// Admin-only procedure middleware
const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const admin = await getVerifiedAdminFromRequest(ctx.req);
  if (!admin) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo necessário." });
  }
  return next({
    ctx: { ...ctx, admin },
  });
});

export const adminRouter = router({
  // ============ AUTH ============
  auth: router({
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        const admin = await adminDb.getAdminByEmail(input.email);
        if (!admin || !admin.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas." });
        }

        const isValid = await bcrypt.compare(input.password, admin.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas." });
        }

        const token = createAdminToken(admin.id, admin.email!);

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(ADMIN_COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Log admin login
        await adminDb.logAdminAction({
          adminId: admin.id, adminEmail: admin.email!,
          action: "login", targetType: "admin",
        });

        return { success: true, name: admin.name };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(ADMIN_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),

    me: publicProcedure.query(async ({ ctx }) => {
      const admin = await getVerifiedAdminFromRequest(ctx.req);
      if (!admin) return null;
      return admin;
    }),
  }),

  // ============ DASHBOARD ============
  dashboard: router({
    stats: adminProcedure
      .input(z.object({
        period: z.enum(["today", "7days", "30days", "all"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        return adminDb.getAdminDashboardStats(input?.period ?? "all");
      }),
  }),

  // ============ REPORTS ============
  reports: router({
    data: adminProcedure.query(async () => {
      return adminDb.getAdminReportsData();
    }),
  }),

  // ============ RESTAURANTS ============
  restaurants: router({
    list: adminProcedure
      .input(z.object({
        search: z.string().max(100).optional().transform(v => v?.trim()),
        planFilter: z.string().optional(),
        page: z.number().min(1).optional(),
        limit: z.number().min(1).max(100).optional(),
      }).optional())
      .query(async ({ input }) => {
        return adminDb.getAdminRestaurantsList(input);
      }),

    detail: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const detail = await adminDb.getAdminRestaurantDetail(input.id);
        if (!detail) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Restaurante não encontrado." });
        }
        return detail;
      }),

    changePlan: adminProcedure
      .input(z.object({
        id: z.number(),
        planType: z.enum(["free", "trial", "lite", "basic", "pro"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await adminDb.adminChangePlan(input.id, input.planType);
        // Also update the active subscription planId to keep it in sync
        try {
          const { getActiveSubscription, updateSubscriptionById } = await import("./planSubscriptionDb");
          const activeSub = await getActiveSubscription(input.id);
          if (activeSub && activeSub.planId !== input.planType) {
            await updateSubscriptionById(activeSub.id, { planId: input.planType });
            logger.info(`[Admin] Updated subscription ${activeSub.id} planId from ${activeSub.planId} to ${input.planType}`);
          }
        } catch (err: any) {
          logger.warn(`[Admin] Failed to sync subscription planId: ${err.message}`);
        }
        await adminDb.logAdminAction({
          adminId: ctx.admin.userId, adminEmail: ctx.admin.email,
          action: "change_plan", targetType: "establishment", targetId: input.id,
          details: { planType: input.planType },
        });
        return { success: true };
      }),

    toggleMenu: adminProcedure
      .input(z.object({
        id: z.number(),
        isOpen: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        await adminDb.adminToggleMenu(input.id, input.isOpen);
        await adminDb.logAdminAction({
          adminId: ctx.admin.userId, adminEmail: ctx.admin.email,
          action: input.isOpen ? "open_menu" : "close_menu", targetType: "establishment", targetId: input.id,
        });
        return { success: true };
      }),

    extendTrial: adminProcedure
      .input(z.object({
        id: z.number(),
        extraDays: z.number().min(1).max(90),
      }))
      .mutation(async ({ ctx, input }) => {
        await adminDb.adminExtendTrial(input.id, input.extraDays);
        await adminDb.logAdminAction({
          adminId: ctx.admin.userId, adminEmail: ctx.admin.email,
          action: "extend_trial", targetType: "establishment", targetId: input.id,
          details: { extraDays: input.extraDays },
        });
        return { success: true };
      }),

    resetTrial: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await adminDb.adminResetTrial(input.id);
        await adminDb.logAdminAction({
          adminId: ctx.admin.userId, adminEmail: ctx.admin.email,
          action: "reset_trial", targetType: "establishment", targetId: input.id,
        });
        return { success: true };
      }),

    forceExpire: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await adminDb.adminForceExpireTrial(input.id);
        await adminDb.logAdminAction({
          adminId: ctx.admin.userId, adminEmail: ctx.admin.email,
          action: "force_expire", targetType: "establishment", targetId: input.id,
        });
        return { success: true };
      }),
    changeBillingDate: adminProcedure
      .input(z.object({
        id: z.number(),
        newDate: z.string(), // ISO date string (YYYY-MM-DD)
      }))
      .mutation(async ({ ctx, input }) => {
        const { getActiveSubscription, updateSubscriptionById } = await import("./planSubscriptionDb");
        
        // Parse the new billing date
        const newBillingDate = new Date(input.newDate + "T12:00:00.000Z");
        if (isNaN(newBillingDate.getTime())) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Data inválida." });
        }
        
        // Get active subscription
        const activeSub = await getActiveSubscription(input.id);
        if (!activeSub) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Nenhuma assinatura ativa encontrada para este estabelecimento." });
        }
        
        // Calculate new period: newDate is the END of current period (next billing)
        // currentPeriodStart = newDate - 1 month (or 1 year for annual)
        const periodStart = new Date(newBillingDate);
        if (activeSub.billingPeriod === "annual") {
          periodStart.setFullYear(periodStart.getFullYear() - 1);
        } else {
          periodStart.setMonth(periodStart.getMonth() - 1);
        }
        
        // Update subscription dates
        await updateSubscriptionById(activeSub.id, {
          currentPeriodStart: periodStart,
          currentPeriodEnd: newBillingDate,
          nextRenewalAt: newBillingDate,
          renewalNotifiedAt: null, // Reset notification so it will be re-sent at the right time
          renewalAttempts: 0,
          lastRenewalError: null,
        });
        
        // Also update planExpiresAt on the establishment
        const { getDb: getDbFn } = await import("./db");
        const { establishments } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDbFn();
        await db.update(establishments)
          .set({ planExpiresAt: newBillingDate })
          .where(eq(establishments.id, input.id));
        
        await adminDb.logAdminAction({
          adminId: ctx.admin.userId, adminEmail: ctx.admin.email,
          action: "change_billing_date", targetType: "establishment", targetId: input.id,
          details: { newDate: input.newDate, subscriptionId: activeSub.id },
        });
        
        logger.info(`[Admin] Changed billing date for establishment ${input.id} to ${input.newDate} (sub: ${activeSub.id})`);
        return { success: true };
      }),

    impersonate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const ownerOpenId = await adminDb.getRestaurantOwnerOpenId(input.id);
        if (!ownerOpenId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Proprietário não encontrado para este restaurante." });
        }

        const sessionToken = await sdk.createSessionToken(ownerOpenId, {
          name: "Admin Impersonation",
          expiresInMs: 4 * 60 * 60 * 1000, // 4 hours
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: 4 * 60 * 60 * 1000,
        });

        await adminDb.logAdminAction({
          adminId: ctx.admin.userId, adminEmail: ctx.admin.email,
          action: "impersonate", targetType: "establishment", targetId: input.id,
        });
        return { success: true };
      }),

    updateSubscriptionStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["trial", "active", "suspended", "cancelled"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await adminDb.adminUpdateSubscriptionStatus(input.id, input.status);
        await adminDb.logAdminAction({
          adminId: ctx.admin.userId, adminEmail: ctx.admin.email,
          action: "update_subscription", targetType: "establishment", targetId: input.id,
          details: { status: input.status },
        });
        return { success: true };
      }),

    updateContact: adminProcedure
      .input(z.object({
        id: z.number(),
        responsibleName: z.string().optional(),
        responsiblePhone: z.string().optional(),
        email: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await adminDb.adminUpdateContact(id, data);
        await adminDb.logAdminAction({
          adminId: ctx.admin.userId, adminEmail: ctx.admin.email,
          action: "update_contact", targetType: "establishment", targetId: id,
          details: data,
        });
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Buscar nome do restaurante antes de excluir (para log)
        const detail = await adminDb.getAdminRestaurantDetail(input.id);
        if (!detail) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Restaurante não encontrado." });
        }

        const restaurantName = detail.name || "Sem nome";

        try {
          const result = await adminDb.adminDeleteEstablishment(input.id);

          try {
            await adminDb.logAdminAction({
              adminId: ctx.admin.userId, adminEmail: ctx.admin.email,
              action: "delete_establishment", targetType: "establishment", targetId: input.id,
              targetName: restaurantName,
              details: { deletedUserId: result.deletedUserId },
            });
          } catch (logErr) {
            console.error("[Admin Delete] Erro ao registrar log:", logErr);
          }

          return { success: true, name: restaurantName };
        } catch (err: any) {
          console.error("[Admin Delete] Erro ao excluir estabelecimento:", err?.message || err);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Erro ao excluir restaurante: ${err?.message || "Erro desconhecido"}` });
        }
      }),
    getPaymentHistory: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return adminDb.getPaymentHistory(input.id);
      }),
  }),

  // ============ TRIALS ============
  trials: router({
    list: adminProcedure
      .input(z.object({
        filter: z.enum(["all", "active", "expiring_3days", "expiring_1day", "expired"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        return adminDb.getAdminTrialsList(input?.filter ?? "all");
      }),

    extend: adminProcedure
      .input(z.object({
        id: z.number(),
        extraDays: z.number().min(1).max(90),
      }))
      .mutation(async ({ ctx, input }) => {
        await adminDb.adminExtendTrial(input.id, input.extraDays);
        await adminDb.logAdminAction({
          adminId: ctx.admin.userId, adminEmail: ctx.admin.email,
          action: "extend_trial", targetType: "establishment", targetId: input.id,
          details: { extraDays: input.extraDays },
        });
        return { success: true };
      }),

    resetTrial: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await adminDb.adminResetTrial(input.id);
        await adminDb.logAdminAction({
          adminId: ctx.admin.userId, adminEmail: ctx.admin.email,
          action: "reset_trial", targetType: "establishment", targetId: input.id,
        });
        return { success: true };
      }),

    forceExpire: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await adminDb.adminForceExpireTrial(input.id);
        await adminDb.logAdminAction({
          adminId: ctx.admin.userId, adminEmail: ctx.admin.email,
          action: "force_expire", targetType: "establishment", targetId: input.id,
        });
        return { success: true };
      }),

    convertToPaid: adminProcedure
      .input(z.object({
        id: z.number(),
        planType: z.enum(["lite", "basic", "pro"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await adminDb.adminChangePlan(input.id, input.planType);
        // Also update the active subscription planId to keep it in sync
        try {
          const { getActiveSubscription, updateSubscriptionById } = await import("./planSubscriptionDb");
          const activeSub = await getActiveSubscription(input.id);
          if (activeSub && activeSub.planId !== input.planType) {
            await updateSubscriptionById(activeSub.id, { planId: input.planType });
            logger.info(`[Admin] Updated subscription ${activeSub.id} planId from ${activeSub.planId} to ${input.planType}`);
          }
        } catch (err: any) {
          logger.warn(`[Admin] Failed to sync subscription planId: ${err.message}`);
        }
        await adminDb.logAdminAction({
          adminId: ctx.admin.userId, adminEmail: ctx.admin.email,
          action: "convert_to_paid", targetType: "establishment", targetId: input.id,
          details: { planType: input.planType },
        });
        return { success: true };
      }),
  }),

  // ============ AUDIT LOG ============
  auditLog: router({
    list: adminProcedure
      .input(z.object({
        page: z.number().min(1).optional(),
        limit: z.number().min(1).max(100).optional(),
        action: z.string().optional(),
        adminEmail: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return adminDb.getAuditLogs(input);
      }),
  }),

  // ============ EXPORT ============
  export: router({
    auditLogCsv: adminProcedure.query(async () => {
      return adminDb.getAuditLogsCsv();
    }),
    restaurantsCsv: adminProcedure.query(async () => {
      return adminDb.getRestaurantsForExport();
    }),
  }),

  // ============ IMAGE CONVERSION ============
  images: router({
    /** Conta imagens legacy sem converter */
    countLegacy: adminProcedure
      .query(async () => {
        const { countLegacyImages } = await import("./imageConversionJob");
        return countLegacyImages();
      }),

    /** Executa o job de conversão de imagens legacy para WebP */
    convertLegacy: adminProcedure
      .mutation(async ({ ctx }) => {
        const { runImageConversionJob } = await import("./imageConversionJob");
        const logs: string[] = [];
        const stats = await runImageConversionJob((msg) => {
          logs.push(msg);
          logger.info(`[ImageConversion] ${msg}`);
        });
        await adminDb.logAdminAction({
          adminId: ctx.admin.userId, adminEmail: ctx.admin.email,
          action: "convert_legacy", targetType: "images",
          details: { stats },
        });
        return { stats, logs };
      }),

    /** Identifica imagens órfãs no S3 (dry-run) */
    orphanScan: adminProcedure
      .query(async () => {
        const { runOrphanCleanup } = await import("./orphanCleanupJob");
        const result = await runOrphanCleanup(true); // dry-run
        return {
          totalS3Objects: result.totalS3Objects,
          totalReferencedUrls: result.totalReferencedUrls,
          orphanCount: result.orphanCount,
          orphanKeys: result.orphanKeys.map((o) => ({
            key: o.key,
            sizeMB: (o.size / (1024 * 1024)).toFixed(2),
          })),
          totalOrphanSizeMB: result.totalOrphanSizeMB,
          errors: result.errors,
        };
      }),

    /** Remove imagens órfãs do S3 */
    orphanCleanup: adminProcedure
      .mutation(async ({ ctx }) => {
        const { runOrphanCleanup } = await import("./orphanCleanupJob");
        const result = await runOrphanCleanup(false); // actual deletion
        await adminDb.logAdminAction({
          adminId: ctx.admin.userId, adminEmail: ctx.admin.email,
          action: "orphan_cleanup", targetType: "images",
          details: { orphanCount: result.orphanCount, deletedCount: result.deletedCount, totalOrphanSizeMB: result.totalOrphanSizeMB },
        });
        return {
          totalS3Objects: result.totalS3Objects,
          totalReferencedUrls: result.totalReferencedUrls,
          orphanCount: result.orphanCount,
          deletedCount: result.deletedCount,
          totalOrphanSizeMB: result.totalOrphanSizeMB,
          errors: result.errors,
        };
      }),
  }),

  // ============ ORDER LOGS ============
  orderLogs: router({
    list: adminProcedure
      .input(z.object({
        establishmentId: z.number().optional(),
        level: z.enum(["info", "warn", "error"]).optional(),
        event: z.string().optional(),
        source: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        const filters = input ?? {} as NonNullable<typeof input>;
        const [logs, total] = await Promise.all([
          adminDb.getOrderLogs({
            establishmentId: filters.establishmentId,
            level: filters.level,
            event: filters.event,
            source: filters.source,
            search: filters.search,
            limit: filters.limit ?? 50,
            offset: filters.offset ?? 0,
          }),
          adminDb.getOrderLogsCount({
            establishmentId: filters.establishmentId,
            level: filters.level,
            event: filters.event,
            source: filters.source,
            search: filters.search,
          }),
        ]);
        return { logs, total };
      }),

    stats: adminProcedure.query(async () => {
      return adminDb.getOrderLogsStats();
    }),

    establishments: adminProcedure.query(async () => {
      return adminDb.getOrderLogsEstablishments();
    }),
  }),

  // ============ PLAN MANAGEMENT ============
  plans: router({
    /** Busca todos os dados de planos (preços + features) */
    getAll: adminProcedure.query(async () => {
      return adminDb.getAllPlanData();
    }),

    /** Atualiza preço de um plano */
    updatePrice: adminProcedure
      .input(z.object({
        planId: z.string(),
        monthlyPriceCents: z.number().min(0),
        annualPriceCents: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        return adminDb.upsertPlanPrice(input.planId, input.monthlyPriceCents, input.annualPriceCents);
      }),

    /** Atualiza o nome exibido de um plano */
    updateDisplayName: adminProcedure
      .input(z.object({
        planId: z.string(),
        displayName: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        return adminDb.updatePlanDisplayName(input.planId, input.displayName);
      }),

    /** Adiciona uma feature a um plano */
    addFeature: adminProcedure
      .input(z.object({
        planId: z.string(),
        text: z.string().min(1),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        return adminDb.addPlanFeature(input.planId, input.text, input.sortOrder);
      }),

    /** Atualiza texto de uma feature */
    updateFeature: adminProcedure
      .input(z.object({
        id: z.number(),
        text: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        return adminDb.updatePlanFeature(input.id, input.text);
      }),

    /** Remove uma feature */
    deleteFeature: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return adminDb.deletePlanFeature(input.id);
      }),

    /** Reordena features de um plano */
    reorderFeatures: adminProcedure
      .input(z.object({
        planId: z.string(),
        featureIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        return adminDb.reorderPlanFeatures(input.planId, input.featureIds);
      }),
  }),

  // ============ GATEWAY SETTINGS ============
  gateways: router({
    /** Busca todas as configurações de gateways */
    getAll: adminProcedure.query(async () => {
      const { getGatewaySettings, seedDefaultGateways } = await import("./planSubscriptionDb");
      await seedDefaultGateways(); // Garante que existem os defaults
      return getGatewaySettings();
    }),

    /** Ativa/desativa um gateway */
    toggle: adminProcedure
      .input(z.object({
        gateway: z.string(),
        enabled: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const { upsertGatewaySetting } = await import("./planSubscriptionDb");
        await upsertGatewaySetting(input.gateway, input.enabled);
        return { success: true };
      }),

    /** Atualiza nome e ordem de um gateway */
    update: adminProcedure
      .input(z.object({
        gateway: z.string(),
        displayName: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { upsertGatewaySetting } = await import("./planSubscriptionDb");
        const { getGatewaySettings } = await import("./planSubscriptionDb");
        const current = (await getGatewaySettings()).find(g => g.gateway === input.gateway);
        await upsertGatewaySetting(
          input.gateway,
          current?.enabled ?? false,
          input.displayName,
          input.sortOrder,
        );
        return { success: true };
      }),
  }),

  // ============ WHATSAPP DA PLATAFORMA (MINDI) ============
  platformWhatsapp: router({
    /** Busca configuração do WhatsApp da plataforma */
    getConfig: adminProcedure.query(async () => {
      const { getPlatformWhatsappConfig } = await import("./platformWhatsappDb");
      return getPlatformWhatsappConfig();
    }),

    /** Conectar instância WhatsApp da plataforma (gera QR Code) */
    connect: adminProcedure.mutation(async () => {
      const { isUazapiConfigured, getOrCreateInstance, connectInstance } = await import("./_core/uazapi");
      const { getPlatformWhatsappConfig, upsertPlatformWhatsappConfig, updatePlatformWhatsappStatus } = await import("./platformWhatsappDb");

      if (!isUazapiConfigured()) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "UAZAPI não configurado no sistema" });
      }

      let config = await getPlatformWhatsappConfig();

      // Se não tem instância, criar uma nova
      if (!config || !config.instanceToken) {
        const instanceResult = await getOrCreateInstance(999999, "mindi_platform");
        if (!instanceResult.success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: instanceResult.message || "Erro ao criar instância" });
        }

        await upsertPlatformWhatsappConfig({
          instanceId: instanceResult.instanceId,
          instanceToken: instanceResult.instanceToken,
          instanceName: "mindi_platform",
        });

        config = await getPlatformWhatsappConfig();
      }

      if (!config?.instanceToken) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Token da instância não encontrado" });
      }

      // Conectar instância (gera QR Code)
      const result = await connectInstance(config.instanceToken);

      // Atualizar status no banco
      await updatePlatformWhatsappStatus(
        result.status,
        null,
        null,
        result.qrcode || null
      );

      return result;
    }),

    /** Verificar status da conexão */
    getStatus: adminProcedure.query(async () => {
      const { getPlatformWhatsappConfig, updatePlatformWhatsappStatus } = await import("./platformWhatsappDb");
      const config = await getPlatformWhatsappConfig();

      if (!config || !config.instanceToken) {
        return { success: false, status: "disconnected" as const, message: "Não configurado" };
      }

      const { getInstanceStatus } = await import("./_core/uazapi");
      const result = await getInstanceStatus(config.instanceToken);

      // Atualizar status no banco se mudou
      if (result.status !== config.status || result.phone !== config.connectedPhone) {
        await updatePlatformWhatsappStatus(
          result.status,
          result.phone || null,
          result.name || null,
          result.qrcode || null
        );
      }

      return result;
    }),

    /** Desconectar WhatsApp da plataforma */
    disconnect: adminProcedure.mutation(async () => {
      const { getPlatformWhatsappConfig, updatePlatformWhatsappStatus } = await import("./platformWhatsappDb");
      const config = await getPlatformWhatsappConfig();

      if (!config?.instanceToken) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Instância não encontrada" });
      }

      const { disconnectInstance } = await import("./_core/uazapi");
      const result = await disconnectInstance(config.instanceToken);

      await updatePlatformWhatsappStatus("disconnected", null, null, null);

      return result;
    }),

    /** Enviar mensagem de teste */
    sendTest: adminProcedure
      .input(z.object({
        phone: z.string().min(10),
        message: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { sendPlatformWhatsappMessage } = await import("./platformWhatsappDb");
        return sendPlatformWhatsappMessage(input.phone, input.message);
      }),

    /** Atualizar templates de mensagem */
    updateTemplates: adminProcedure
      .input(z.object({
        templateRenewalPix: z.string().nullable().optional(),
        templateRenewalCard: z.string().nullable().optional(),
        templatePlanActivated: z.string().nullable().optional(),
        templatePlanExpiring: z.string().nullable().optional(),
        templatePlanDeactivated: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { upsertPlatformWhatsappConfig } = await import("./platformWhatsappDb");
        await upsertPlatformWhatsappConfig(input);
        return { success: true };
      }),
  }),

  // ============ SSE CONNECTIVITY LOGS ============
  sseConnectivity: router({
    list: adminProcedure
      .input(z.object({
        establishmentId: z.number().optional(),
        event: z.enum(["disconnected", "order_missed", "reconnected"]).optional(),
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        const filters = input ?? {} as NonNullable<typeof input>;
        const [logs, total] = await Promise.all([
          adminDb.getSseConnectivityLogs({
            establishmentId: filters.establishmentId,
            event: filters.event,
            limit: filters.limit ?? 100,
            offset: filters.offset ?? 0,
          }),
          adminDb.getSseConnectivityLogsCount({
            establishmentId: filters.establishmentId,
            event: filters.event,
          }),
        ]);
        return { logs, total };
      }),
    status: adminProcedure.query(async () => {
      const { getConnectionCount, getTotalConnections } = await import("./_core/sse");
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) return { totalConnections: 0, establishments: [] };
      const { establishments } = await import("../drizzle/schema");
      const allEstablishments = await db.select({ id: establishments.id, name: establishments.name }).from(establishments);
      const withConnections = allEstablishments.map(e => ({
        id: e.id,
        name: e.name,
        connections: getConnectionCount(e.id),
      }));
      return {
        totalConnections: getTotalConnections(),
        establishments: withConnections.filter(e => e.connections > 0),
        disconnected: withConnections.filter(e => e.connections === 0).length,
      };
    }),
  }),

});
export type AdminRouter = typeof adminRouter;
