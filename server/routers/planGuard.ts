/**
 * Plan Guard: validações de limites do plano no backend.
 * Usado nos routers de category, product e complement para impedir
 * que o plano Free exceda os limites.
 */
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { getPlanLimits } from "../../shared/planLimits";

/**
 * Obtém o planType de um estabelecimento.
 */
async function getEstablishmentPlanType(establishmentId: number): Promise<string> {
  const est = await db.getEstablishmentById(establishmentId);
  return est?.planType ?? "trial";
}

/**
 * Verifica se o estabelecimento pode criar mais categorias.
 */
export async function assertCanCreateCategory(establishmentId: number): Promise<void> {
  const planType = await getEstablishmentPlanType(establishmentId);
  const limits = getPlanLimits(planType);
  if (limits.maxCategories === null) return; // ilimitado

  const categories = await db.getCategoriesByEstablishment(establishmentId);
  if (categories.length >= limits.maxCategories) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Limite de ${limits.maxCategories} categorias atingido no plano atual. Faça upgrade para criar mais categorias.`,
    });
  }
}

/**
 * Verifica se o estabelecimento pode criar mais produtos.
 */
export async function assertCanCreateProduct(establishmentId: number): Promise<void> {
  const planType = await getEstablishmentPlanType(establishmentId);
  const limits = getPlanLimits(planType);
  if (limits.maxProducts === null) return; // ilimitado

  const products = await db.getProductsByEstablishment(establishmentId, {});
  const totalProducts = Array.isArray(products) ? products.length : (products as any)?.products?.length ?? 0;
  if (totalProducts >= limits.maxProducts) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Limite de ${limits.maxProducts} produtos atingido no plano atual. Faça upgrade para criar mais produtos.`,
    });
  }
}

/**
 * Verifica se o grupo de complementos pode receber mais itens.
 */
export async function assertCanAddComplement(groupId: number, establishmentId: number): Promise<void> {
  const planType = await getEstablishmentPlanType(establishmentId);
  const limits = getPlanLimits(planType);
  if (limits.maxComplementsPerGroup === null) return; // ilimitado

  const items = await db.getComplementItemsByGroup(groupId);
  if (items.length >= limits.maxComplementsPerGroup) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Limite de ${limits.maxComplementsPerGroup} complementos por grupo atingido no plano atual. Faça upgrade para adicionar mais.`,
    });
  }
}

/**
 * Verifica se o plano permite agendar disponibilidade de categoria.
 */
export async function assertCanScheduleCategory(establishmentId: number): Promise<void> {
  const planType = await getEstablishmentPlanType(establishmentId);
  const limits = getPlanLimits(planType);
  if (!limits.hasScheduledAvailability) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Agendamento de disponibilidade não disponível no plano atual. Faça upgrade para liberar este recurso.",
    });
  }
}

/**
 * Verifica se o plano permite controle de estoque.
 */
export async function assertCanUseStockControl(establishmentId: number): Promise<void> {
  const planType = await getEstablishmentPlanType(establishmentId);
  const limits = getPlanLimits(planType);
  if (!limits.hasStockControl) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Controle de estoque não disponível no plano atual. Faça upgrade para liberar este recurso.",
    });
  }
}

/**
 * Verifica se o plano permite disponibilidade por dias/horários no produto.
 */
export async function assertCanUseProductSchedule(establishmentId: number): Promise<void> {
  const planType = await getEstablishmentPlanType(establishmentId);
  const limits = getPlanLimits(planType);
  if (!limits.hasProductSchedule) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Disponibilidade por dias/horários não disponível no plano atual. Faça upgrade para liberar este recurso.",
    });
  }
}
