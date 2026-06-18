/**
 * Google OAuth Express Routes
 * 
 * Rotas HTTP (não tRPC) para autenticação via Google OAuth 2.0.
 * Apenas para donos de restaurante (admin), não para clientes do menu público.
 * 
 * Fluxo:
 * 1. GET /api/auth/google → redireciona para Google Authorization
 * 2. GET /api/auth/google/callback → recebe code, troca por token, obtém perfil, cria/vincula usuário
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";
import { ENV } from "../_core/env";
import { COOKIE_NAME } from "@shared/const";
import { clearSessionCookieVariants, getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { logger } from "../_core/logger";
import { auditLog } from "../_core/auditLog";
import * as db from "../db";

// Google OAuth URLs
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// State tokens armazenados em memória (com TTL de 10 minutos)
const pendingStates = new Map<string, { createdAt: number; redirectAfterLogin?: string; mode?: string; redirectUri?: string }>();

// Limpar states expirados a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(pendingStates.entries());
  for (const [key, value] of entries) {
    if (now - value.createdAt > 10 * 60 * 1000) {
      pendingStates.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Determina a redirect URI baseada no request.
 * Em produção usa o domínio canônico; em dev usa a origin do request.
 */
function getRedirectUri(req: Request): string {
  // Sempre usar o domínio canônico de produção se disponível
  // pois é o que está configurado no Google Cloud Console
  const productionDomain = "https://mindi.com.br";
  
  // Em ambiente de desenvolvimento, usar a origin do request
  const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, "");
  
  // Se a origin é de um domínio de produção conhecido, usar mindi.com.br
  const productionDomains = [
    "mindi.com.br",
    "app.mindi.com.br",
    "v2.mindi.com.br",
    "mindi.manus.space",
    "cardapio-dash-enmwmxpa.manus.space",
  ];
  
  const isProduction = origin && productionDomains.some(d => origin.includes(d));
  const baseUrl = isProduction ? productionDomain : (origin || productionDomain);
  
  return `${baseUrl}/api/auth/google/callback`;
}

export function createGoogleAuthRouter(): Router {
  const router = Router();

  /**
   * GET /api/auth/google
   * Inicia o fluxo OAuth redirecionando para o Google.
   * Query params opcionais:
   *   - mode: "login" | "register" (default: "login")
   *   - redirect: URL para redirecionar após login bem-sucedido
   */
  router.get("/api/auth/google", (req: Request, res: Response) => {
    try {
      if (!ENV.googleClientId || !ENV.googleClientSecret) {
        logger.error("[Google OAuth] Client ID ou Secret não configurados");
        return res.redirect("/login?error=google_not_configured");
      }

      // Gerar state token para proteção CSRF
      const state = crypto.randomBytes(32).toString("hex");
      const mode = (req.query.mode as string) || "login";
      const redirectAfterLogin = (req.query.redirect as string) || "/login?select=1";
      
      const redirectUri = getRedirectUri(req);
      
      pendingStates.set(state, {
        createdAt: Date.now(),
        redirectAfterLogin,
        mode,
        redirectUri,
      });

      logger.info(`[Google OAuth] Redirect URI: ${redirectUri}`);

      // Construir URL de autorização do Google
      const params = new URLSearchParams({
        client_id: ENV.googleClientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state,
        access_type: "offline",
        prompt: "select_account", // Sempre mostrar seletor de conta
      });

      const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
      logger.info(`[Google OAuth] Redirecting to Google authorization`);
      return res.redirect(authUrl);
    } catch (error) {
      logger.error("[Google OAuth] Error initiating OAuth flow:", error);
      return res.redirect("/login?error=google_error");
    }
  });

  /**
   * GET /api/auth/google/callback
   * Callback do Google OAuth. Recebe o code, troca por token, obtém perfil.
   * Se o email já existe → vincula conta Google e faz login.
   * Se o email não existe → cria nova conta.
   */
  router.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const { code, state, error: googleError } = req.query;

      // Google retornou erro
      if (googleError) {
        logger.warn(`[Google OAuth] Google returned error: ${googleError}`);
        return res.redirect(`/login?error=google_denied`);
      }

      // Validar parâmetros
      if (!code || !state) {
        logger.warn("[Google OAuth] Missing code or state parameter");
        return res.redirect("/login?error=google_invalid");
      }

      // Validar state (proteção CSRF)
      const stateData = pendingStates.get(state as string);
      if (!stateData) {
        logger.warn("[Google OAuth] Invalid or expired state token");
        return res.redirect("/login?error=google_expired");
      }
      pendingStates.delete(state as string);

      // Usar a mesma redirect_uri que foi usada na autorização (armazenada no state)
      // Isso é crítico: o Google exige que a redirect_uri no token exchange seja idêntica
      const redirectUri = stateData.redirectUri || getRedirectUri(req);
      logger.info(`[Google OAuth] Callback redirect URI for token exchange: ${redirectUri}`);

      // 1. Trocar code por access token
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.text();
        logger.error(`[Google OAuth] Token exchange failed: ${tokenResponse.status} - ${errorBody}`);
        return res.redirect("/login?error=google_token_failed");
      }

      const tokenData = await tokenResponse.json() as {
        access_token: string;
        id_token?: string;
        token_type: string;
        expires_in: number;
        refresh_token?: string;
      };

      // 2. Obter perfil do usuário
      const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userInfoResponse.ok) {
        logger.error(`[Google OAuth] Failed to fetch user info: ${userInfoResponse.status}`);
        return res.redirect("/login?error=google_profile_failed");
      }

      const googleProfile = await userInfoResponse.json() as {
        id: string;
        email: string;
        verified_email: boolean;
        name: string;
        given_name?: string;
        family_name?: string;
        picture?: string;
      };

      if (!googleProfile.email) {
        logger.error("[Google OAuth] No email in Google profile");
        return res.redirect("/login?error=google_no_email");
      }

      logger.info(`[Google OAuth] Got profile for: ${googleProfile.email} (Google ID: ${googleProfile.id})`);

      // 3. Modo "link" — vincular Google a usuário já logado
      if (stateData.mode === "link") {
        // Verificar se o usuário está logado (cookie de sessão)
        let loggedUser: Awaited<ReturnType<typeof sdk.authenticateRequest>> | null = null;
        try {
          loggedUser = await sdk.authenticateRequest(req);
        } catch {
          logger.warn("[Google OAuth] Link mode but no valid session");
          return res.redirect("/configuracoes?tab=conta-seguranca&error=google_link_no_session");
        }

        // Verificar se este googleId já está vinculado a outra conta
        const existingGoogleUser = await db.getUserByGoogleId(googleProfile.id);
        if (existingGoogleUser && existingGoogleUser.openId !== loggedUser.openId) {
          logger.warn(`[Google OAuth] Google ID ${googleProfile.id} already linked to user ${existingGoogleUser.id}`);
          return res.redirect("/configuracoes?tab=conta-seguranca&error=google_already_linked");
        }

        // Vincular
        const dbUser = await db.getUserByOpenId(loggedUser.openId);
        if (dbUser) {
          await db.linkGoogleId(dbUser.id, googleProfile.id);
          auditLog({
            type: "auth.google.link",
            userId: dbUser.id,
            ip: req.ip,
            metadata: { googleId: googleProfile.id, email: googleProfile.email },
          });
          logger.info(`[Google OAuth] Linked Google account to user ${dbUser.id} via settings`);
        }
        return res.redirect("/configuracoes?tab=conta-seguranca&google_linked=1");
      }

      // 4. Buscar ou criar usuário (modo login/register)
      let user = await db.getUserByGoogleId(googleProfile.id);
      let isNewUser = false;

      if (!user) {
        // Verificar se já existe um usuário com este email
        user = await db.getUserByEmail(googleProfile.email);

        if (user) {
          // Vincular conta Google ao usuário existente
          await db.linkGoogleId(user.id, googleProfile.id);
          logger.info(`[Google OAuth] Linked Google account to existing user ${user.id}`);
        } else {
          // Criar novo usuário automaticamente (tanto em modo login quanto register)
          user = await db.createUserWithGoogle({
            name: googleProfile.name || googleProfile.email.split("@")[0],
            email: googleProfile.email,
            googleId: googleProfile.id,
          });
          isNewUser = true;
          logger.info(`[Google OAuth] Created new user ${user?.id} via Google (mode: ${stateData.mode})`);
        }
      }

      if (!user) {
        logger.error("[Google OAuth] Failed to get/create user");
        return res.redirect("/login?error=google_user_failed");
      }

      // 4. Atualizar last signed in
      await db.updateUserLastSignedIn(user.id);

      // 5. Criar sessão (mesmo fluxo do loginWithEmail)
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email?.split("@")[0] || "User",
        expiresInMs: 30 * 24 * 60 * 60 * 1000, // 30 dias para login Google
      });

      // 6. Set cookie
      clearSessionCookieVariants(req, res, COOKIE_NAME);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      auditLog({
        type: isNewUser ? "auth.google.register" : "auth.google.login",
        userId: user.id,
        ip: req.ip,
        metadata: { googleId: googleProfile.id, email: googleProfile.email },
      });

      // 7. Redirecionar para a página apropriada
      if (isNewUser) {
        // Novo usuário → redirecionar para onboarding (criar estabelecimento)
        return res.redirect("/onboarding?google=1");
      }

      // Usuário existente → redirecionar para dashboard ou URL solicitada
      const redirectTo = stateData.redirectAfterLogin || "/login?select=1";
      return res.redirect(redirectTo);

    } catch (error) {
      logger.error("[Google OAuth] Callback error:", error);
      return res.redirect("/login?error=google_error");
    }
  });

  return router;
}
