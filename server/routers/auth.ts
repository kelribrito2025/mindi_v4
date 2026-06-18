import * as db from "../db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { auditLog } from '../_core/auditLog';
import { clearSessionCookieVariants, getSessionCookieOptions } from "../_core/cookies";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { sdk } from "../_core/sdk";
import { z } from "zod";
import { zMoneyOptional } from "../../shared/validation";
import { sendEmail, buildPasswordResetEmail } from "../email";
import { forgotPasswordLimiter, loginLimiter } from "../rateLimiter";
import { getUserByOpenId } from "../db";

const TWO_FACTOR_LOGIN_TTL_MS = 10 * 60 * 1000;

type PendingTwoFactorLogin = {
  userId: number;
  openId: string;
  name: string | null;
  email: string | null;
  rememberMe: boolean;
  verificationEmail: string;
  expiresAt: number;
};

const pendingTwoFactorLogins = new Map<string, PendingTwoFactorLogin>();

function cleanupPendingTwoFactorLogins() {
  const now = Date.now();
  for (const [challengeId, pending] of Array.from(pendingTwoFactorLogins.entries())) {
    if (pending.expiresAt <= now) {
      pendingTwoFactorLogins.delete(challengeId);
    }
  }
}

function maskEmailAddress(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return email;
  const visibleStart = localPart.slice(0, Math.min(2, localPart.length));
  const visibleEnd = localPart.length > 4 ? localPart.slice(-1) : "";
  return `${visibleStart}${"*".repeat(Math.max(3, localPart.length - visibleStart.length - visibleEnd.length))}${visibleEnd}@${domain}`;
}

function buildTwoFactorLoginEmail(code: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111827;">
      <h2 style="margin: 0 0 12px; color: #111827;">Código de verificação Mindi</h2>
      <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">Use o código abaixo para concluir o login na sua conta.</p>
      <div style="font-size: 32px; letter-spacing: 8px; font-weight: 700; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 12px; margin: 24px 0;">${code}</div>
      <p style="font-size: 14px; line-height: 1.5; color: #6b7280; margin: 0;">Este código expira em 10 minutos. Se não foi você que tentou entrar, ignore este e-mail e reveja a segurança da sua conta.</p>
    </div>
  `;
}

function getClientIp(req: any): string {
  return req.headers["x-forwarded-for"]
    ? String(req.headers["x-forwarded-for"]).split(",")[0].trim()
    : req.socket.remoteAddress || "unknown";
}

export const authRouter = router({
    me: publicProcedure.query(opts => {
      return opts.ctx.user;
    }),

    // Retorna informações da conta Google vinculada (se houver)
    googleStatus: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserByOpenId(ctx.user.openId);
      if (!user) return { linked: false, googleId: null, hasPassword: false };
      return {
        linked: !!user.googleId,
        googleId: user.googleId || null,
        hasPassword: !!user.passwordHash,
        loginMethod: user.loginMethod || null,
      };
    }),

    // Desvincular conta Google
    unlinkGoogle: protectedProcedure.mutation(async ({ ctx }) => {
      const user = await db.getUserByOpenId(ctx.user.openId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usu\u00e1rio n\u00e3o encontrado." });
      }
      if (!user.googleId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma conta Google vinculada." });
      }
      if (!user.passwordHash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Voc\u00ea precisa criar uma senha antes de desvincular o Google, pois ficaria sem forma de login.",
        });
      }
      await db.unlinkGoogleId(user.id);
      auditLog({ type: "auth.google.unlink", userId: user.id, ip: ctx.req.ip });
      logger.info(`[Auth] User ${user.id} unlinked Google account`);
      return { success: true };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      clearSessionCookieVariants(ctx.req, ctx.res, COOKIE_NAME);
      return { success: true } as const;
    }),
    
    // Register with email/password AND create establishment in one step (new onboarding flow)
    registerAndCreateEstablishment: publicProcedure
      .input(z.object({
        // Auth fields
        email: z.string().email("Email inválido"),
        password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
        // Establishment fields
        name: z.string().min(1, "Nome do estabelecimento é obrigatório"),
        ownerDisplayName: z.string().max(11).optional(),
        menuSlug: z.string().optional(),
        whatsapp: z.string().optional(),
        instagram: z.string().optional(),
        allowsDelivery: z.boolean().optional(),
        allowsPickup: z.boolean().optional(),
        address: z.string().optional(),
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
        timezone: z.string().optional(),
        selectedPlan: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 1. Check if user already exists
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este email já está cadastrado.",
          });
        }
        
        // 2. Hash password
        const passwordHash = await bcrypt.hash(input.password, 10);
        
        // 3. Create user
        const userName = input.email.split("@")[0];
        const user = await db.createUserWithPassword({
          name: userName,
          email: input.email,
          passwordHash,
        });
        
        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao criar usuário.",
          });
        }
        
        // 4. Create establishment
        const { email, password, selectedPlan, address, ...establishmentFields } = input;
        
        // Mapear o plano selecionado no onboarding para o planType do banco
        // 'free' não existe mais como plano — todos os novos cadastros entram como 'trial' (teste grátis 15 dias)
        const planTypeMap: Record<string, string> = {
          free: 'free', // Plano gratuito permanente (sem trial)
          trial: 'trial',
          lite: 'lite',
          basic: 'basic',
          pro: 'pro',
        };
        const resolvedPlanType = selectedPlan && planTypeMap[selectedPlan] ? planTypeMap[selectedPlan] : 'trial';
        
        const establishmentId = await db.createEstablishment({
          ...establishmentFields,
          street: address || undefined,
          userId: user.id,
          responsibleName: establishmentFields.ownerDisplayName || null,
          planType: resolvedPlanType as any,
          ...(resolvedPlanType === 'trial' || resolvedPlanType === 'lite' ? { trialStartDate: new Date() } : {}),
        });
        
        // Multi-establishment: add entry to user_establishments and set active
        await db.addUserEstablishment(user.id, establishmentId, "owner");
        await db.setActiveEstablishment(user.id, establishmentId);
        // 5. Auto-login
        const token = await sdk.createSessionToken(user.openId, {
          name: user.name || user.email?.split('@')[0] || 'User',
          expiresInMs: 7 * 24 * 60 * 60 * 1000,
        });
        
        clearSessionCookieVariants(ctx.req, ctx.res, COOKIE_NAME);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        auditLog({ type: "auth.register", userId: user.id, ip: ctx.req.ip });
        return { success: true, userId: user.id, establishmentId };
      }),

    // Register with email/password (legacy)
    register: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user already exists
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este email já está cadastrado.",
          });
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(input.password, 10);
        
        // Create user
        const user = await db.createUserWithPassword({
          name: input.name,
          email: input.email,
          passwordHash,
        });
        
        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao criar usuário.",
          });
        }
        
        // Login automático após criar conta
        const token = await sdk.createSessionToken(user.openId, {
          name: user.name || user.email?.split('@')[0] || 'User',
          expiresInMs: 7 * 24 * 60 * 60 * 1000, // 7 dias
        });
        
        // Set cookie
        clearSessionCookieVariants(ctx.req, ctx.res, COOKIE_NAME);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        auditLog({ type: "auth.register", userId: user.id, ip: ctx.req.ip });
        return { success: true, userId: user.id };
      }),
    
    // Login with email/password
    loginWithEmail: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(1, "Senha é obrigatória"),
        rememberMe: z.boolean().optional(),
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
          logger.warn(`[Auth] Rate limit exceeded for login from IP: ${clientIp}`);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Muitas tentativas de login. Tente novamente em ${retryMinutes} minuto${retryMinutes > 1 ? "s" : ""}.`,
          });
        }

        // Check if this email belongs to a collaborator
        const collaborator = await db.getCollaboratorByEmailGlobal(input.email);
        if (collaborator) {
          // Verify the password matches the collaborator account
          const collabPasswordValid = await bcrypt.compare(input.password, collaborator.passwordHash);
          if (collabPasswordValid) {
            // Redirect to collaborator login
            logger.info(`[Auth] Collaborator ${collaborator.id} tried to login as establishment, redirecting`);
            return { success: false, isCollaborator: true };
          }
          // If password doesn't match collaborator, fall through to check user table
        }

        // Find user by email
        const user = await db.getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          loginLimiter.check(clientIp);
          auditLog({ type: "auth.login.failure", ip: ctx.req.ip });
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha incorretos.",
          });
        }

        // Verify password
        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValid) {
          loginLimiter.check(clientIp);
          auditLog({ type: "auth.login.failure", userId: user.id, ip: ctx.req.ip });
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha incorretos.",
          });
        }

        const establishment = await db.getEstablishmentByUserId(user.id);
        if (establishment?.twoFactorEnabled) {
          const verificationEmail = String(establishment.twoFactorEmail || user.email || "").trim().toLowerCase();
          if (!verificationEmail) {
            logger.warn(`[Auth] 2FA enabled for user ${user.id} but no verification email is available`);
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "A verificação em duas etapas está ativa, mas não há e-mail configurado para envio do código.",
            });
          }

          const verificationCode = await db.createEmailVerificationCode(verificationEmail);
          try {
            await sendEmail({
              to: [{ email: verificationEmail, name: user.name || undefined }],
              subject: "Código de verificação - Mindi",
              html: buildTwoFactorLoginEmail(verificationCode),
              tags: ["two-factor-login"],
            });
          } catch (error) {
            logger.error("[Auth] Failed to send 2FA login email:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Erro ao enviar o código de verificação. Tente novamente mais tarde.",
            });
          }

          cleanupPendingTwoFactorLogins();
          const challengeId = crypto.randomBytes(32).toString("hex");
          pendingTwoFactorLogins.set(challengeId, {
            userId: user.id,
            openId: user.openId,
            name: user.name || null,
            email: user.email || null,
            rememberMe: !!input.rememberMe,
            verificationEmail,
            expiresAt: Date.now() + TWO_FACTOR_LOGIN_TTL_MS,
          });

          return {
            success: false,
            requiresTwoFactor: true,
            challengeId,
            verificationEmail: maskEmailAddress(verificationEmail),
          };
        }

        // Update last signed in
        await db.updateUserLastSignedIn(user.id);
        
        // Create JWT token using SDK to match expected format
        const token = await sdk.createSessionToken(user.openId, {
          name: user.name || user.email?.split('@')[0] || 'User',
          expiresInMs: input.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
        });
        
        // Set cookie
        clearSessionCookieVariants(ctx.req, ctx.res, COOKIE_NAME);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: input.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
        });

        auditLog({ type: "auth.login.success", userId: user.id, ip: ctx.req.ip });
        return { success: true };
      }),

    verifyTwoFactorLogin: publicProcedure
      .input(z.object({
        challengeId: z.string().min(16, "Desafio inválido"),
        code: z.string().min(5, "Código inválido").max(5, "Código inválido"),
      }))
      .mutation(async ({ ctx, input }) => {
        const clientIp = getClientIp(ctx.req);
        const rateLimitStatus = loginLimiter.isBlocked(clientIp);
        if (rateLimitStatus.blocked) {
          const retryAfterSec = Math.ceil(rateLimitStatus.retryAfterMs / 1000);
          const retryMinutes = Math.ceil(retryAfterSec / 60);
          logger.warn(`[Auth] Rate limit exceeded for 2FA login from IP: ${clientIp}`);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Muitas tentativas de login. Tente novamente em ${retryMinutes} minuto${retryMinutes > 1 ? "s" : ""}.`,
          });
        }

        cleanupPendingTwoFactorLogins();
        const pending = pendingTwoFactorLogins.get(input.challengeId);
        if (!pending || pending.expiresAt <= Date.now()) {
          pendingTwoFactorLogins.delete(input.challengeId);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Código expirado. Faça login novamente para receber um novo código.",
          });
        }

        const result = await db.verifyEmailCode(pending.verificationEmail, input.code.trim());
        if (!result.valid) {
          loginLimiter.check(clientIp);
          auditLog({ type: "auth.login.failure", userId: pending.userId, ip: ctx.req.ip });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.reason || "Código inválido. Tente novamente.",
          });
        }

        const user = await db.getUserById(pending.userId);
        if (!user || user.openId !== pending.openId) {
          pendingTwoFactorLogins.delete(input.challengeId);
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Sessão de verificação inválida. Faça login novamente.",
          });
        }

        await db.updateUserLastSignedIn(user.id);
        const token = await sdk.createSessionToken(user.openId, {
          name: user.name || user.email?.split('@')[0] || 'User',
          expiresInMs: pending.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
        });

        clearSessionCookieVariants(ctx.req, ctx.res, COOKIE_NAME);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: pending.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
        });

        pendingTwoFactorLogins.delete(input.challengeId);
        auditLog({ type: "auth.login.success", userId: user.id, ip: ctx.req.ip });
        return { success: true };
      }),

    // Forgot password - sends reset email via Mandrill
    // Supports both users (establishment owners) and collaborators
    forgotPassword: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Rate limiting: 5 tentativas por IP a cada 15 minutos
        const clientIp = ctx.req.headers["x-forwarded-for"]
          ? String(ctx.req.headers["x-forwarded-for"]).split(",")[0].trim()
          : ctx.req.socket.remoteAddress || "unknown";
        const rateLimitResult = forgotPasswordLimiter.check(clientIp);
        if (!rateLimitResult.allowed) {
          const retryAfterSec = Math.ceil(rateLimitResult.retryAfterMs / 1000);
          logger.warn(`[Auth] Rate limit exceeded for forgotPassword from IP: ${clientIp}`);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Muitas tentativas. Tente novamente em ${retryAfterSec} segundos.`,
          });
        }

        // Check both tables: users (owners) and collaborators
        const user = await db.getUserByEmail(input.email);
        const collaborator = await db.getCollaboratorByEmailGlobal(input.email);
        
        // Always return success to prevent email enumeration
        if (!user && !collaborator) {
          logger.info(`[Auth] Password reset requested for non-existent email: ${input.email}`);
          return { success: true };
        }

        // Generate secure random token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Determine the target name for the email
        let targetName = "";
        
        if (collaborator) {
          // Prioritize collaborator if found (collaborator-specific reset)
          await db.setCollaboratorResetToken(collaborator.id, resetToken, expiresAt);
          targetName = collaborator.name || "";
          logger.info(`[Auth] Password reset token set for collaborator ${collaborator.id}`);
        } else if (user) {
          // User (establishment owner) reset
          await db.setPasswordResetToken(user.id, resetToken, expiresAt);
          targetName = user.name || "";
          logger.info(`[Auth] Password reset token set for user ${user.id}`);
        }

        // Build reset link using the request origin
        const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, "") || "https://v2.mindi.com.br";
        const resetLink = `${origin}/redefinir-senha?token=${resetToken}`;

        // Send email via Mandrill
        try {
          await sendEmail({
            to: [{ email: input.email, name: targetName || undefined }],
            subject: "Redefinir sua senha - Mindi",
            html: buildPasswordResetEmail(targetName, resetLink),
            tags: ["password-reset"],
          });
          logger.info(`[Auth] Password reset email sent to ${input.email}`);
          auditLog({ type: "auth.password_reset.requested", userId: user?.id, ip: ctx.req.ip });
        } catch (error) {
          logger.error("[Auth] Failed to send password reset email:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao enviar email. Tente novamente mais tarde.",
          });
        }

        return { success: true };
      }),

    // Reset password with token
    // Supports both users (establishment owners) and collaborators
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(1, "Token é obrigatório"),
        password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Search in both tables: users and collaborators
        const user = await db.getUserByResetToken(input.token);
        const collaborator = await db.getCollaboratorByResetToken(input.token);
        
        if (!user && !collaborator) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Link de redefinição inválido ou expirado.",
          });
        }

        const passwordHash = await bcrypt.hash(input.password, 10);

        if (collaborator) {
          // Check if collaborator token is expired
          if (!collaborator.resetTokenExpiresAt || new Date() > collaborator.resetTokenExpiresAt) {
            await db.setCollaboratorResetToken(collaborator.id, "", new Date(0));
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Link de redefinição expirado. Solicite um novo.",
            });
          }
          // Update collaborator password
          await db.updateCollaboratorPassword(collaborator.id, passwordHash);
          logger.info(`[Auth] Password reset completed for collaborator ${collaborator.id}`);
          auditLog({ type: "auth.password_reset.completed", ip: ctx.req.ip, metadata: { collaboratorId: collaborator.id } });
        } else if (user) {
          // Check if user token is expired
          if (!user.resetTokenExpiresAt || new Date() > user.resetTokenExpiresAt) {
            await db.setPasswordResetToken(user.id, "", new Date(0));
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Link de redefinição expirado. Solicite um novo.",
            });
          }
          // Update user password
          await db.updateUserPassword(user.id, passwordHash);
          logger.info(`[Auth] Password reset completed for user ${user.id}`);
          auditLog({ type: "auth.password_reset.completed", userId: user.id, ip: ctx.req.ip });
        }

        return { success: true };
      }),

    // Validate reset token (check if it's still valid)
    // Validate reset token - checks both users and collaborators
    validateResetToken: publicProcedure
      .input(z.object({
        token: z.string().min(1),
      }))
      .query(async ({ input }) => {
        // Mascara email para privacidade: joao.silva@gmail.com → j***a@g***l.com
        const maskEmail = (email: string): string => {
          const [local, domain] = email.split("@");
          if (!domain) return "***@***";
          const [domainName, ...tld] = domain.split(".");
          const maskPart = (s: string) => {
            if (s.length <= 2) return s[0] + "*";
            return s[0] + "***" + s[s.length - 1];
          };
          return maskPart(local) + "@" + maskPart(domainName) + "." + tld.join(".");
        };

        // Check users table first
        const user = await db.getUserByResetToken(input.token);
        if (user && user.resetTokenExpiresAt && new Date() <= user.resetTokenExpiresAt) {
          return { valid: true, email: maskEmail(user.email ?? ""), accountType: "user" as const };
        }

        // Check collaborators table
        const collaborator = await db.getCollaboratorByResetToken(input.token);
        if (collaborator && collaborator.resetTokenExpiresAt && new Date() <= collaborator.resetTokenExpiresAt) {
          return { valid: true, email: maskEmail(collaborator.email), accountType: "collaborator" as const };
        }

        return { valid: false };
      }),
  });
