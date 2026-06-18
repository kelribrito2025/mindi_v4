import type { CookieOptions, Request, Response } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isLocalRequest(req: Request): boolean {
  const host = req.hostname;
  return LOCAL_HOSTS.has(host) || isIpAddress(host);
}

/**
 * Determina se a requisição veio via HTTPS.
 * Usa apenas req.protocol (definido pelo Express com base em trust proxy configurado),
 * evitando ler diretamente o header x-forwarded-proto que pode ser manipulado por clientes.
 */
function isSecureRequest(req: Request): boolean {
  return req.protocol === "https";
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);
  const isLocal = isLocalRequest(req);

  return {
    httpOnly: true,
    path: "/",
    // "lax" protege contra CSRF em navegadores modernos e é compatível com
    // fluxos de autenticação padrão. "none" só é necessário para contextos
    // cross-site explícitos e exige secure=true.
    sameSite: isLocal ? "lax" : secure ? "lax" : "none",
    secure,
  };
}


function getCookieDomainCandidates(req: Request): string[] {
  const hostname = req.hostname.toLowerCase();
  const domains = new Set<string>();

  if (hostname === "app.mindi.com.br" || hostname === "v2.mindi.com.br" || hostname === "mindi.com.br") {
    domains.add(".mindi.com.br");
    domains.add("mindi.com.br");
  }

  return Array.from(domains);
}

export function clearSessionCookieVariants(
  req: Request,
  res: Response,
  cookieName: string
): void {
  const baseOptions = getSessionCookieOptions(req);
  const expireOptions = { ...baseOptions, maxAge: -1 };

  res.clearCookie(cookieName, expireOptions);

  for (const domain of getCookieDomainCandidates(req)) {
    res.clearCookie(cookieName, {
      ...expireOptions,
      domain,
    });
  }
}
