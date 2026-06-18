import { z } from "zod";

/**
 * Schema Zod para valores monetários em formato string.
 * Aceita apenas strings no formato decimal válido: "0", "0.00", "12.50", "1234.99"
 * Rejeita: strings vazias, letras, valores negativos, mais de 2 casas decimais, valores absurdos.
 */
export const zMoney = z
  .string()
  .regex(
    /^\d{1,10}(\.\d{1,2})?$/,
    "Valor monetário inválido. Use formato: 0.00"
  )
  .refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 9999999.99;
    },
    { message: "Valor monetário fora do intervalo permitido (0 a 9.999.999,99)" }
  );

/**
 * Schema Zod para valores monetários opcionais.
 */
export const zMoneyOptional = zMoney.optional();

/**
 * Converte string monetária para número com 2 casas decimais.
 * Retorna 0 se a string for inválida.
 */
export function parseMoney(value: string | undefined | null): number {
  if (!value) return 0;
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) return 0;
  return Math.round(num * 100) / 100;
}

/**
 * Valida que o total informado pelo cliente é consistente com os valores calculados.
 * Permite uma tolerância de R$ 0.02 para arredondamentos.
 */
export function validateOrderTotal(params: {
  claimedSubtotal: string;
  claimedDeliveryFee: string;
  claimedDiscount: string;
  claimedTotal: string;
  claimedCashback?: string;
}): { valid: boolean; expectedTotal: number; claimedTotal: number; diff: number } {
  const subtotal = parseMoney(params.claimedSubtotal);
  const deliveryFee = parseMoney(params.claimedDeliveryFee);
  const discount = parseMoney(params.claimedDiscount);
  const cashback = parseMoney(params.claimedCashback);
  const claimedTotal = parseMoney(params.claimedTotal);

  const expectedTotal = Math.max(0, subtotal - discount + deliveryFee - cashback);
  const diff = Math.abs(expectedTotal - claimedTotal);

  // Tolerância de R$ 0.02 para arredondamentos de ponto flutuante
  return {
    valid: diff <= 0.02,
    expectedTotal,
    claimedTotal,
    diff,
  };
}
