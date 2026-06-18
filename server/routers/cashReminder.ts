import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

function assertEstablishmentOwnership(userId: number, establishmentId: number) {
  // Reuse existing pattern - will be validated by the procedure
  return db.getEstablishmentByUserId(userId).then(est => {
    if (!est || est.id !== establishmentId) {
      throw new Error("Unauthorized");
    }
  });
}

export const cashReminderRouter = router({
  // Obter configurações de lembretes
  getSettings: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const settings = await db.getCashReminderSettings(input.establishmentId);
      return settings || {
        openReminderEnabled: true,
        closeReminderEnabled: true,
        openReminderDelayMinutes: 5,
        closeReminderBeforeMinutes: 5,
        maxCloseReminders: 3,
        respectClosedDays: true,
      };
    }),

  // Salvar configurações de lembretes
  saveSettings: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      openReminderEnabled: z.boolean(),
      closeReminderEnabled: z.boolean(),
      openReminderDelayMinutes: z.number().min(1).max(60),
      closeReminderBeforeMinutes: z.number().min(1).max(60),
      maxCloseReminders: z.number().min(1).max(10),
      respectClosedDays: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const { establishmentId, ...data } = input;
      return db.upsertCashReminderSettings(establishmentId, data);
    }),

  // Obter lembretes pendentes (para polling do frontend)
  getPendingReminders: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      // Calcular data atual no timezone do estabelecimento
      const est = await db.getEstablishmentByUserId(ctx.user.id);
      if (!est) return [];
      const timezone = est.timezone || "America/Sao_Paulo";
      const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" });
      const dateStr = formatter.format(new Date());
      return db.getPendingCashReminders(input.establishmentId, dateStr);
    }),

  // Dispensar lembrete
  dismissReminder: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      reminderType: z.enum(["open", "close"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      const est = await db.getEstablishmentByUserId(ctx.user.id);
      if (!est) return { success: false };
      const timezone = est.timezone || "America/Sao_Paulo";
      const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" });
      const dateStr = formatter.format(new Date());
      await db.dismissCashReminder(input.establishmentId, input.reminderType, dateStr);
      return { success: true };
    }),
});
