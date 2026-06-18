/**
 * Limites e restrições por plano.
 * Usado tanto no backend (validação) quanto no frontend (UI bloqueada).
 */

export type PlanType = "trial" | "free" | "lite" | "basic" | "pro" | "enterprise";

export interface PlanLimits {
  maxCategories: number | null;       // null = ilimitado
  maxProducts: number | null;         // null = ilimitado
  maxComplementsPerGroup: number | null; // null = ilimitado
  hasScheduledAvailability: boolean;  // agendar disponibilidade de categoria
  hasProductSchedule: boolean;        // disponibilidade por dias/horários no produto
  hasStockControl: boolean;           // controle de estoque no produto
  hasDashboardAccessCard: boolean;    // card "Acessos ao Cardápio" na dashboard
  hasDashboardConversionCard: boolean; // card "Taxa de Conversão" na dashboard
  hasDashboardRevenueByHourCard: boolean; // card "Faturamento por Hora" na dashboard
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxCategories: 10,
    maxProducts: 35,
    maxComplementsPerGroup: 7,
    hasScheduledAvailability: false,
    hasProductSchedule: false,
    hasStockControl: false,
    hasDashboardAccessCard: false,
    hasDashboardConversionCard: false,
    hasDashboardRevenueByHourCard: false,
  },
  trial: {
    maxCategories: 10,
    maxProducts: 35,
    maxComplementsPerGroup: 7,
    hasScheduledAvailability: false,
    hasProductSchedule: false,
    hasStockControl: false,
    hasDashboardAccessCard: false,
    hasDashboardConversionCard: false,
    hasDashboardRevenueByHourCard: false,
  },
  lite: {
    maxCategories: null,
    maxProducts: null,
    maxComplementsPerGroup: null,
    hasScheduledAvailability: true,
    hasProductSchedule: true,
    hasStockControl: true,
    hasDashboardAccessCard: true,
    hasDashboardConversionCard: true,
    hasDashboardRevenueByHourCard: true,
  },
  basic: {
    maxCategories: null,
    maxProducts: null,
    maxComplementsPerGroup: null,
    hasScheduledAvailability: true,
    hasProductSchedule: true,
    hasStockControl: true,
    hasDashboardAccessCard: true,
    hasDashboardConversionCard: true,
    hasDashboardRevenueByHourCard: true,
  },
  pro: {
    maxCategories: null,
    maxProducts: null,
    maxComplementsPerGroup: null,
    hasScheduledAvailability: true,
    hasProductSchedule: true,
    hasStockControl: true,
    hasDashboardAccessCard: true,
    hasDashboardConversionCard: true,
    hasDashboardRevenueByHourCard: true,
  },
  enterprise: {
    maxCategories: null,
    maxProducts: null,
    maxComplementsPerGroup: null,
    hasScheduledAvailability: true,
    hasProductSchedule: true,
    hasStockControl: true,
    hasDashboardAccessCard: true,
    hasDashboardConversionCard: true,
    hasDashboardRevenueByHourCard: true,
  },
};

/**
 * Retorna os limites do plano. Planos desconhecidos herdam os limites do trial.
 */
export function getPlanLimits(planType: string): PlanLimits {
  return PLAN_LIMITS[planType as PlanType] ?? PLAN_LIMITS.trial;
}

/**
 * Verifica se o plano é o Free (trial).
 */
export function isFreePlan(planType: string): boolean {
  return planType === "trial" || planType === "free";
}

const AUTOMATIC_ORDER_NOTIFICATION_PLAN_TYPES = new Set(["basic", "pro", "enterprise"]);

/**
 * Verifica se o plano pode usar notificações automáticas de pedidos via canais conectados.
 * No produto, o plano Essencial é persistido como `basic`; Starter é persistido como `lite`.
 */
export function hasAutomaticOrderNotifications(planType: string | null | undefined): boolean {
  return AUTOMATIC_ORDER_NOTIFICATION_PLAN_TYPES.has(String(planType || "").toLowerCase());
}
