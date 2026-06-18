/**
 * Utilitários de imagem compartilhados entre frontend e backend.
 * 
 * Convenção de nomes:
 * - Principal: {id}.webp (max 1200px, WebP q80)
 * - Miniatura: {id}_thumb.webp (max 400px, WebP q75)
 */

/**
 * Deriva o URL da miniatura a partir do URL da imagem principal.
 * Se a imagem não for WebP ou não seguir a convenção, retorna o URL original.
 */
export function getThumbUrl(mainUrl: string | null | undefined): string {
  if (!mainUrl) return "";
  
  // Apenas derivar thumb para imagens .webp (novo formato otimizado)
  if (mainUrl.endsWith(".webp") && !mainUrl.endsWith("_thumb.webp")) {
    return mainUrl.replace(/\.webp$/, "_thumb.webp");
  }
  
  // Para imagens antigas (PNG, JPEG, etc.), retornar o URL original
  return mainUrl;
}

/**
 * Retorna o URL da imagem mais adequado para o contexto:
 * - Em listagens/grids: usa thumb (400px) se disponível
 * - Em detalhes/fullscreen: usa principal (1200px)
 */
export function getOptimizedImageUrl(mainUrl: string | null | undefined, useThumb = false): string {
  if (!mainUrl) return "";
  if (useThumb) return getThumbUrl(mainUrl);
  return mainUrl;
}
