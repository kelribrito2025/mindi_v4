import * as db from "../db";
import bcrypt from "bcryptjs";
import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { auditLog } from '../_core/auditLog';
import { getSessionCookieOptions } from "../_core/cookies";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { assertEstablishmentOwnership } from "./helpers";
import { sdk } from "../_core/sdk";
import { z } from "zod";
import { loginLimiter } from "../rateLimiter";

export const collaboratorRouter = router({
    list: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const collabs = await db.getCollaboratorsByEstablishment(input.establishmentId);
        return collabs.map(({ passwordHash, ...rest }) => rest);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const collab = await db.getCollaboratorById(input.id);
        if (!collab) return null;
        await assertEstablishmentOwnership(ctx.user.id, collab.establishmentId);
        const { passwordHash, ...rest } = collab;
        return rest;
      }),

    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1, "Nome é obrigatório").max(10, "Nome deve ter no máximo 10 caracteres"),
        email: z.string().email("Email inválido"),
        password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
        permissions: z.array(z.string()),
        whatsapp: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        // Check if email already exists for this establishment
        const existing = await db.getCollaboratorByEmail(input.establishmentId, input.email);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe um colaborador com este email.",
          });
        }
        
        const passwordHash = await bcrypt.hash(input.password, 10);
        const id = await db.createCollaborator({
          establishmentId: input.establishmentId,
          name: input.name,
          email: input.email,
          passwordHash,
          permissions: input.permissions,
        });

        // Enviar dados de acesso via WhatsApp se número informado
        let whatsappSent = false;
        if (input.whatsapp && input.whatsapp.replace(/\D/g, '').length >= 10) {
          try {
            const establishment = await db.getEstablishmentById(input.establishmentId);
            const whatsappConfig = await db.getWhatsappConfig(input.establishmentId);
            if (whatsappConfig?.status === 'connected') {
              const { getWhatsAppProvider } = await import('../_core/whatsappProvider');
              const wa = await getWhatsAppProvider(input.establishmentId);
              if (wa.isAvailable()) {
                const message = `Olá ${input.name} 👋\n\nSeu acesso ao painel do estabelecimento *${establishment?.name || 'Restaurante'}* foi criado.\n\n🔐 *Dados de acesso*\n\nEmail: ${input.email}\nSenha: ${input.password}\n\nAcesse pelo link: app.mindi.com.br/login\n\nApós entrar no link, clique em \"Sou colaborador\" para acessar o sistema.\nVocê terá acesso apenas às páginas autorizadas pelo administrador.\n\nSe tiver dúvidas, fale com o responsável do restaurante.`;
                await wa.sendText(input.whatsapp, message);
                whatsappSent = true;
                logger.info(`[Collaborator] Dados de acesso enviados via WhatsApp para ${input.whatsapp}`);
              }
            }
          } catch (err) {
            logger.error('[Collaborator] Erro ao enviar WhatsApp:', err);
          }
        }

        return { id, whatsappSent };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(10).optional(),
        email: z.string().email().optional(),
        password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").optional(),
        permissions: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const collab = await db.getCollaboratorById(input.id);
        if (!collab) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Colaborador não encontrado' });
        }
        await assertEstablishmentOwnership(ctx.user.id, collab.establishmentId);
        const { id, password, ...data } = input;
        const updateData: any = { ...data };
        if (password) {
          updateData.passwordHash = await bcrypt.hash(password, 10);
        }
        await db.updateCollaborator(id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const collab = await db.getCollaboratorById(input.id);
        if (!collab) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Colaborador não encontrado' });
        }
        await assertEstablishmentOwnership(ctx.user.id, collab.establishmentId);
        await db.deleteCollaborator(input.id);
        return { success: true };
      }),

    // Login as collaborator (email/password)
    login: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Rate limiting: 20 falhas de autenticação por IP a cada 15 minutos.
        // Verifica bloqueio sem incrementar; apenas falhas consomem tentativas.
        const clientIp = ctx.req.headers["x-forwarded-for"]
          ? String(ctx.req.headers["x-forwarded-for"]).split(",")[0].trim()
          : ctx.req.socket.remoteAddress || "unknown";
        const rateLimitStatus = loginLimiter.isBlocked(clientIp);
        if (rateLimitStatus.blocked) {
          const retryAfterSec = Math.ceil(rateLimitStatus.retryAfterMs / 1000);
          const retryMinutes = Math.ceil(retryAfterSec / 60);
          logger.warn(`[Auth] Rate limit exceeded for collaborator login from IP: ${clientIp}`);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Muitas tentativas de login. Tente novamente em ${retryMinutes} minuto${retryMinutes > 1 ? "s" : ""}.`,
          });
        }

        // Find collaborator by email (global search)
        const collab = await db.getCollaboratorByEmailGlobal(input.email);
        if (!collab || !collab.passwordHash) {
          loginLimiter.check(clientIp);
          auditLog({ type: "collaborator.login.failure", ip: ctx.req.ip });
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha incorretos.",
          });
        }

        if (!collab.isActive) {
          auditLog({ type: "collaborator.login.failure", establishmentId: collab.establishmentId, ip: ctx.req.ip, metadata: { reason: "account_disabled" } });
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Sua conta foi desativada. Contacte o administrador.",
          });
        }

        // Verify password
        const isValid = await bcrypt.compare(input.password, collab.passwordHash);
        if (!isValid) {
          loginLimiter.check(clientIp);
          auditLog({ type: "collaborator.login.failure", establishmentId: collab.establishmentId, ip: ctx.req.ip });
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha incorretos.",
          });
        }
        
        // Find the establishment owner to create session as them
        const establishment = await db.getEstablishmentById(collab.establishmentId);
        if (!establishment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Estabelecimento não encontrado.",
          });
        }
        
        // Get the owner user to create a session
        const ownerUser = await db.getUserById(establishment.userId);
        if (!ownerUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Proprietário não encontrado.",
          });
        }
        
        // Update last login
        await db.updateCollaboratorLastLogin(collab.id);
        
        // Create JWT token as the owner user (so collaborator sees the same establishment)
        const token = await sdk.createSessionToken(ownerUser.openId, {
          name: collab.name,
          expiresInMs: 12 * 60 * 60 * 1000, // 12 hours
        });
        
        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 12 * 60 * 60 * 1000,
        });
        
        // Also set a collaborator info cookie for the frontend
        ctx.res.cookie('collaborator_info', JSON.stringify({
          id: collab.id,
          name: collab.name,
          permissions: collab.permissions,
          establishmentId: collab.establishmentId,
        }), {
          ...cookieOptions,
          maxAge: 12 * 60 * 60 * 1000,
          httpOnly: false, // Frontend needs to read this
        });
        
        auditLog({ type: "collaborator.login.success", establishmentId: collab.establishmentId, ip: ctx.req.ip, metadata: { collaboratorId: collab.id } });
        return {
          success: true,
          collaborator: {
            id: collab.id,
            name: collab.name,
            permissions: collab.permissions,
          },
        };
      }),

    // Get current collaborator info (if logged in as collaborator)
    me: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const collab = await db.getCollaboratorById(input.id);
        if (!collab) return null;
        return {
          id: collab.id,
          name: collab.name,
          email: collab.email,
          permissions: collab.permissions,
          isActive: collab.isActive,
        };
      }),
  });
