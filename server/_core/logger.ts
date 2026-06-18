/**
 * Logger condicional para produção.
 * Em produção, logs de debug/info são silenciados para evitar expor dados sensíveis.
 * Logs de erro e warn sempre aparecem.
 */

const isProduction = process.env.NODE_ENV === "production";

/**
 * Logger que silencia logs informativos em produção.
 * - debug: só em desenvolvimento
 * - info: só em desenvolvimento  
 * - warn: sempre (problemas que precisam atenção)
 * - error: sempre (erros que precisam correção)
 */
export const logger = {
  /** Log de debug - silenciado em produção */
  debug: (...args: unknown[]) => {
    if (!isProduction) {
      console.log("[DEBUG]", ...args);
    }
  },

  /** Log informativo - silenciado em produção */
  info: (...args: unknown[]) => {
    console.log(...args);
  },

  /** Log de aviso - sempre visível */
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },

  /** Log de erro - sempre visível */
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};

export default logger;
