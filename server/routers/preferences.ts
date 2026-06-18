import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getUserPreference,
  getUserPreferences,
  setUserPreference,
} from "../db";

export const preferencesRouter = router({
  /**
   * Busca uma única preferência por chave
   */
  get: protectedProcedure
    .input(z.object({
      key: z.string(),
      establishmentId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const value = await getUserPreference(
        ctx.user.id,
        input.key,
        input.establishmentId ?? null
      );
      return { key: input.key, value };
    }),

  /**
   * Busca múltiplas preferências de uma vez (batch)
   */
  getBatch: protectedProcedure
    .input(z.object({
      keys: z.array(z.string()),
      establishmentId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const prefs = await getUserPreferences(
        ctx.user.id,
        input.keys,
        input.establishmentId ?? null
      );
      return prefs;
    }),

  /**
   * Define uma preferência (upsert)
   */
  set: protectedProcedure
    .input(z.object({
      key: z.string(),
      value: z.string(),
      establishmentId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await setUserPreference(
        ctx.user.id,
        input.key,
        input.value,
        input.establishmentId ?? null
      );
      return { success: true };
    }),
});
