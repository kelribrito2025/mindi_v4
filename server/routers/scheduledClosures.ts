import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { 
  getScheduledClosures, 
  createScheduledClosure, 
  updateScheduledClosure, 
  deleteScheduledClosure,
  checkScheduledClosure,
  getEstablishmentByUserId
} from "../db";
import { TRPCError } from "@trpc/server";

export const scheduledClosuresRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const est = await getEstablishmentByUserId(ctx.user.id);
    if (!est) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
    return getScheduledClosures(est.id);
  }),

  create: protectedProcedure
    .input(z.object({
      type: z.enum(["specific_date", "recurring"]),
      specificDate: z.string().optional(),
      recurringRule: z.string().optional(),
      reason: z.string().max(255).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const est = await getEstablishmentByUserId(ctx.user.id);
      if (!est) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });

      if (input.type === "specific_date" && !input.specificDate) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Data específica é obrigatória" });
      }
      if (input.type === "recurring" && !input.recurringRule) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Regra recorrente é obrigatória" });
      }

      const id = await createScheduledClosure({
        establishmentId: est.id,
        type: input.type,
        specificDate: input.specificDate ? new Date(input.specificDate + "T12:00:00") : null,
        recurringRule: input.recurringRule || null,
        reason: input.reason || null,
        isActive: true,
      });

      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      isActive: z.boolean().optional(),
      reason: z.string().max(255).optional(),
      specificDate: z.string().optional(),
      recurringRule: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const est = await getEstablishmentByUserId(ctx.user.id);
      if (!est) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });

      const { id, ...data } = input;
      await updateScheduledClosure(id, est.id, data as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const est = await getEstablishmentByUserId(ctx.user.id);
      if (!est) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });

      await deleteScheduledClosure(input.id, est.id);
      return { success: true };
    }),

  checkToday: protectedProcedure.query(async ({ ctx }) => {
    const est = await getEstablishmentByUserId(ctx.user.id);
    if (!est) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
    return checkScheduledClosure(est.id, est.timezone || "America/Sao_Paulo");
  }),

  /** Retorna o próximo fechamento programado nos próximos 7 dias */
  upcoming: protectedProcedure.query(async ({ ctx }) => {
    const est = await getEstablishmentByUserId(ctx.user.id);
    if (!est) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
    const closures = await getScheduledClosures(est.id);
    const tz = est.timezone || "America/Sao_Paulo";

    // Calcular próximos 7 dias no timezone do estabelecimento
    const now = new Date();
    const upcoming: Array<{ date: string; label: string; reason: string | null; daysUntil: number; type: string }> = [];

    for (let i = 0; i <= 7; i++) {
      const checkDate = new Date(now.getTime() + i * 86400000);
      const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
      const dateStr = formatter.format(checkDate); // YYYY-MM-DD

      const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" });
      const weekday = dayFormatter.format(checkDate).toLowerCase();

      const datePartsFormatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, day: "numeric", month: "numeric", year: "numeric" });
      const parts = datePartsFormatter.formatToParts(checkDate);
      const day = parseInt(parts.find(p => p.type === "day")?.value || "0");
      const month = parseInt(parts.find(p => p.type === "month")?.value || "0");
      const year = parseInt(parts.find(p => p.type === "year")?.value || "0");

      const labelFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: tz, weekday: "long", day: "numeric", month: "long" });
      const label = labelFormatter.format(checkDate);

      for (const closure of closures) {
        if (!closure.isActive) continue;

        let matches = false;
        if (closure.type === "specific_date" && closure.specificDate) {
          const closureDateStr = typeof closure.specificDate === "string"
            ? closure.specificDate
            : (closure.specificDate as Date).toISOString().split("T")[0];
          matches = closureDateStr === dateStr;
        } else if (closure.type === "recurring" && closure.recurringRule) {
          const rule = closure.recurringRule;
          if (rule.startsWith("every_")) {
            matches = weekday === rule.replace("every_", "");
          } else if (rule.startsWith("last_")) {
            const ruleDay = rule.replace("last_", "");
            if (weekday === ruleDay) {
              const daysInMonth = new Date(year, month, 0).getDate();
              matches = day + 7 > daysInMonth;
            }
          } else if (rule.startsWith("first_")) {
            const ruleDay = rule.replace("first_", "");
            matches = weekday === ruleDay && day <= 7;
          }
        }

        if (matches) {
          // Evitar duplicatas para o mesmo dia
          if (!upcoming.find(u => u.date === dateStr)) {
            upcoming.push({
              date: dateStr,
              label,
              reason: closure.reason,
              daysUntil: i,
              type: closure.type,
            });
          }
        }
      }
    }

    // Ordenar por proximidade
    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

    return { upcoming, nextClosure: upcoming[0] || null };
  }),
});
