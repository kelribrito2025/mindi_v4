import * as db from "../db";
import crypto from 'crypto';
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { auditLog } from '../_core/auditLog';
import { botApiKeys } from '../../drizzle/schema';
import { eq } from "drizzle-orm";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { hashApiKey } from "../_core/apiKeyHash";

export const botApiKeysRouter = router({
    list: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const dbInstance = await db.getDb();
        if (!dbInstance) return [];
        return dbInstance.select().from(botApiKeys)
          .where(eq(botApiKeys.establishmentId, input.establishmentId))
          .orderBy(botApiKeys.createdAt);
      }),

    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1, "Nome é obrigatório"),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB indisponível' });
        const apiKey = `bot_${crypto.randomBytes(32).toString('hex')}`;
        const result = await dbInstance.insert(botApiKeys).values({
          establishmentId: input.establishmentId,
          name: input.name,
          apiKey,
          apiKeyHash: hashApiKey(apiKey), // P09: Armazenar hash SHA-256
          isActive: true,
          requestCount: 0,
        });
        auditLog({ type: "api_key.create", userId: ctx.user.id, establishmentId: input.establishmentId, metadata: { keyId: result[0].insertId, name: input.name } });
        return { id: result[0].insertId, apiKey, name: input.name };
      }),

    toggleActive: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB indisponível' });
        const [existing] = await dbInstance.select().from(botApiKeys).where(eq(botApiKeys.id, input.id)).limit(1);
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'API Key não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, existing.establishmentId);
        await dbInstance.update(botApiKeys)
          .set({ isActive: input.isActive })
          .where(eq(botApiKeys.id, input.id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB indisponível' });
        const [existing] = await dbInstance.select().from(botApiKeys).where(eq(botApiKeys.id, input.id)).limit(1);
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'API Key não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, existing.establishmentId);
        await dbInstance.delete(botApiKeys)
          .where(eq(botApiKeys.id, input.id));
        auditLog({ type: "api_key.delete", userId: ctx.user.id, establishmentId: existing.establishmentId, metadata: { keyId: input.id } });
        return { success: true };
      }),

    rename: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB indisponível' });
        const [existing] = await dbInstance.select().from(botApiKeys).where(eq(botApiKeys.id, input.id)).limit(1);
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'API Key não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, existing.establishmentId);
        await dbInstance.update(botApiKeys)
          .set({ name: input.name })
          .where(eq(botApiKeys.id, input.id));
        return { success: true };
      }),

    createGlobal: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1, "Nome é obrigatório"),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB indisponível' });
        const apiKey = `bot_global_${crypto.randomBytes(32).toString('hex')}`;
        const result = await dbInstance.insert(botApiKeys).values({
          establishmentId: input.establishmentId,
          name: input.name,
          apiKey,
          apiKeyHash: hashApiKey(apiKey), // P09: Armazenar hash SHA-256
          isActive: true,
          isGlobal: true,
          requestCount: 0,
        });
        return { id: result[0].insertId, apiKey, name: input.name };
      }),
  });
