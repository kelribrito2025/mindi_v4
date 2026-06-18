/**
 * Rate Limiter em memória — simples e eficiente
 * Usa um Map com limpeza automática de entradas expiradas
 */

interface RateLimitEntry {
  count: number;
  firstRequest: number; // timestamp ms
}

interface RateLimiterOptions {
  /** Número máximo de requisições permitidas na janela */
  maxRequests: number;
  /** Janela de tempo em milissegundos */
  windowMs: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxRequests: number;
  private windowMs: number;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;

    // Limpar entradas expiradas a cada 5 minutos
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    // Não impedir o processo de sair
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Regista uma tentativa para a chave e verifica se excedeu o limite.
   * Retorna { allowed: true, remaining } se permitido,
   * ou { allowed: false, retryAfterMs } se bloqueado.
   */
  check(key: string): { allowed: true; remaining: number } | { allowed: false; retryAfterMs: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now - entry.firstRequest >= this.windowMs) {
      // Janela expirada ou primeira requisição — resetar
      this.store.set(key, { count: 1, firstRequest: now });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    if (entry.count >= this.maxRequests) {
      // Limite excedido
      const retryAfterMs = this.windowMs - (now - entry.firstRequest);
      return { allowed: false, retryAfterMs };
    }

    // Incrementar contador
    entry.count++;
    return { allowed: true, remaining: this.maxRequests - entry.count };
  }

  /**
   * Verifica se a chave já está bloqueada sem incrementar o contador.
   * Útil para permitir que apenas falhas consumam tentativas.
   */
  isBlocked(key: string): { blocked: false; remaining: number } | { blocked: true; retryAfterMs: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now - entry.firstRequest >= this.windowMs) {
      if (entry) {
        this.store.delete(key);
      }
      return { blocked: false, remaining: this.maxRequests };
    }

    if (entry.count >= this.maxRequests) {
      const retryAfterMs = this.windowMs - (now - entry.firstRequest);
      return { blocked: true, retryAfterMs };
    }

    return { blocked: false, remaining: this.maxRequests - entry.count };
  }

  /** Remove entradas expiradas do Map */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.store.entries())) {
      if (now - entry.firstRequest >= this.windowMs) {
        this.store.delete(key);
      }
    }
  }

  /** Para testes — resetar o store */
  reset(): void {
    this.store.clear();
  }

  /** Para cleanup no shutdown */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// ── Instâncias pré-configuradas ──

/** forgotPassword: 5 tentativas por IP a cada 15 minutos */
export const forgotPasswordLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutos
});

/** Bot API: 100 requisições por API key por minuto */
export const botApiLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minuto
});

/** Login: 20 falhas de autenticação por IP a cada 15 minutos */
export const loginLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 15 * 60 * 1000, // 15 minutos
});
