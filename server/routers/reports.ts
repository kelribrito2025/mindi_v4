import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { assertEstablishmentOwnership } from "./helpers";
import { getReportKPIs, getProductsABC, getWeeklyPerformance, getSeasonalityMap, getDRE } from "./reportHelpers";

const periodInput = z.object({
  establishmentId: z.number(),
  period: z.enum(["today", "week", "month", "last_month", "custom"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const reportsRouter = router({
  kpis: protectedProcedure
    .input(periodInput)
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return getReportKPIs(
        input.establishmentId,
        input.period,
        input.startDate,
        input.endDate
      );
    }),

  productsABC: protectedProcedure
    .input(periodInput)
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return getProductsABC(
        input.establishmentId,
        input.period,
        input.startDate,
        input.endDate
      );
    }),

  weeklyPerformance: protectedProcedure
    .input(periodInput)
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return getWeeklyPerformance(
        input.establishmentId,
        input.period,
        input.startDate,
        input.endDate
      );
    }),

  seasonalityMap: protectedProcedure
    .input(periodInput)
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return getSeasonalityMap(
        input.establishmentId,
        input.period,
        input.startDate,
        input.endDate
      );
    }),

  dre: protectedProcedure
    .input(periodInput)
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      return getDRE(
        input.establishmentId,
        input.period,
        input.startDate,
        input.endDate
      );
    }),
});
