/**
 * iFood Catalog Cache Module
 * 
 * Cache em memória para o catálogo completo do iFood com:
 * - TTL de 10 minutos (configurável)
 * - Invalidação automática após operações de escrita
 * - Cache por establishmentId (cada restaurante tem seu cache)
 * - Fallback para dados em cache quando a API falha
 */

import { logger } from "./_core/logger";

// ==========================================
// CONFIGURAÇÃO
// ==========================================

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

// ==========================================
// TIPOS
// ==========================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CatalogCacheStats {
  hits: number;
  misses: number;
  invalidations: number;
  lastHit?: number;
  lastMiss?: number;
  lastInvalidation?: number;
}

// ==========================================
// CACHE STORE
// ==========================================

/** Cache por establishmentId */
const catalogCache = new Map<number, CacheEntry<any>>();

/** Estatísticas do cache */
const cacheStats: CatalogCacheStats = {
  hits: 0,
  misses: 0,
  invalidations: 0,
};

// ==========================================
// FUNÇÕES PÚBLICAS
// ==========================================

/**
 * Busca dados do cache para um estabelecimento
 * Retorna undefined se não houver cache válido
 */
export function getCachedCatalog(establishmentId: number): any | undefined {
  const entry = catalogCache.get(establishmentId);
  
  if (!entry) {
    cacheStats.misses++;
    cacheStats.lastMiss = Date.now();
    logger.info(`[iFood Cache] MISS - Nenhum cache para estabelecimento ${establishmentId}`);
    return undefined;
  }

  // Verificar se expirou
  if (Date.now() > entry.expiresAt) {
    cacheStats.misses++;
    cacheStats.lastMiss = Date.now();
    catalogCache.delete(establishmentId);
    logger.info(`[iFood Cache] EXPIRED - Cache expirado para estabelecimento ${establishmentId} (idade: ${Math.round((Date.now() - entry.timestamp) / 1000)}s)`);
    return undefined;
  }

  cacheStats.hits++;
  cacheStats.lastHit = Date.now();
  const ageSeconds = Math.round((Date.now() - entry.timestamp) / 1000);
  logger.info(`[iFood Cache] HIT - Cache válido para estabelecimento ${establishmentId} (idade: ${ageSeconds}s, expira em ${Math.round((entry.expiresAt - Date.now()) / 1000)}s)`);
  return entry.data;
}

/**
 * Armazena dados do catálogo no cache
 */
export function setCachedCatalog(establishmentId: number, data: any): void {
  const now = Date.now();
  catalogCache.set(establishmentId, {
    data,
    timestamp: now,
    expiresAt: now + CACHE_TTL_MS,
  });
  logger.info(`[iFood Cache] SET - Cache atualizado para estabelecimento ${establishmentId} (TTL: ${CACHE_TTL_MS / 1000}s)`);
}

/**
 * Invalida o cache de um estabelecimento específico
 * Deve ser chamado após qualquer operação de escrita no catálogo
 */
export function invalidateCatalogCache(establishmentId: number): void {
  const existed = catalogCache.has(establishmentId);
  catalogCache.delete(establishmentId);
  cacheStats.invalidations++;
  cacheStats.lastInvalidation = Date.now();
  
  if (existed) {
    logger.info(`[iFood Cache] INVALIDATED - Cache removido para estabelecimento ${establishmentId}`);
  }
}

/**
 * Invalida todo o cache (útil para manutenção)
 */
export function invalidateAllCatalogCache(): void {
  const size = catalogCache.size;
  catalogCache.clear();
  cacheStats.invalidations += size;
  cacheStats.lastInvalidation = Date.now();
  logger.info(`[iFood Cache] INVALIDATED ALL - ${size} entradas removidas`);
}

/**
 * Retorna estatísticas do cache
 */
export function getCatalogCacheStats(): CatalogCacheStats & { size: number; ttlSeconds: number } {
  return {
    ...cacheStats,
    size: catalogCache.size,
    ttlSeconds: CACHE_TTL_MS / 1000,
  };
}

/**
 * Verifica se existe cache válido para um estabelecimento
 */
export function hasCachedCatalog(establishmentId: number): boolean {
  const entry = catalogCache.get(establishmentId);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    catalogCache.delete(establishmentId);
    return false;
  }
  return true;
}
