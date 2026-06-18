import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const menuViewsRouter = router({
    // Procedure pública para registrar sessão do cardápio
    registerSession: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        establishmentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.registerMenuSession(input.sessionId, input.establishmentId);
        
        // Incrementar contagem do mapa de calor usando timezone do estabelecimento
        const tz = await db.getEstablishmentTimezone(input.establishmentId);
        const localTime = db.getLocalDate(tz);
        const dayOfWeek = localTime.getDay();
        const hour = localTime.getHours();
        await db.incrementMenuViewHourly(input.establishmentId, dayOfWeek, hour);
        
        return { success: true };
      }),
    
    // Procedure protegida para contar visualizações ativas
    getActiveViewers: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) return { activeViewers: 0 };
        const count = await db.getActiveViewers(establishment.id);
        return { activeViewers: count };
      }),
    
    // Procedure protegida para buscar estatísticas de visualizações
    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) {
          return {
            totalViews: 0,
            uniqueVisitors: 0,
            previousTotalViews: 0,
            previousUniqueVisitors: 0,
            dailyViews: [],
            percentageChange: 0,
          };
        }
        return db.getMenuViewsStats(establishment.id);
      }),
    
    // Procedure protegida para buscar histórico de visualizações
    getHistory: protectedProcedure
      .input(z.object({
        days: z.number().optional().default(7),
      }))
      .query(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) return [];
        return db.getMenuViewsHistory(establishment.id, input.days);
      }),
    
    // Procedure protegida para buscar dados do mapa de calor
    getHeatmap: protectedProcedure
      .input(z.object({ period: z.enum(['today', 'week', 'month']).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) {
          return {
            data: [],
            maxCount: 0,
            totalViews: 0,
            periodViews: 0,
            previousPeriodViews: 0,
            viewsChange: 0,
          };
        }
        return db.getMenuViewsHeatmapWithPeriod(establishment.id, input?.period ?? 'today');
      }),
  });
