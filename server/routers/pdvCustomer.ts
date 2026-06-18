import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const pdvCustomerRouter = router({
    // Buscar cliente PDV por telefone
    findByPhone: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(8), // Mínimo 8 dígitos
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const customer = await db.getPdvCustomerByPhone(input.establishmentId, input.phone);
        return customer;
      }),

    // Buscar clientes PDV por nome (autocomplete)
    searchByName: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(2),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const customers = await db.searchPdvCustomersByName(input.establishmentId, input.name, 20);
        return customers;
      }),

    // Buscar clientes PDV por telefone (autocomplete)
    searchByPhone: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(3),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const customers = await db.searchPdvCustomersByPhone(input.establishmentId, input.phone, 20);
        return customers;
      }),

    // Salvar/atualizar cliente PDV
    upsert: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(8),
        name: z.string().optional(),
        street: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        reference: z.string().optional(),
        originalPhone: z.string().optional(),
        customerId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.upsertPdvCustomer(input);
      }),

    // ============ GESTÃO DE CLIENTES ============

    // Estatísticas de clientes (cards de resumo)
    stats: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        periodStart: z.string(), // ISO date string
        periodEnd: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getCustomerStats(
          input.establishmentId,
          new Date(input.periodStart),
          new Date(input.periodEnd)
        );
      }),

    // Listar clientes paginados
    list: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        page: z.number().min(1).default(1),
        perPage: z.number().min(1).max(100).default(25),
        search: z.string().optional(),
        customerType: z.enum(['new', 'recurrent', 'atRisk', 'inactive']).optional(),
        periodStart: z.string().optional(),
        periodEnd: z.string().optional(),
        sortBy: z.enum(['name', 'totalOrders', 'lastOrderDate', 'totalSpent']).optional(),
        sortDir: z.enum(['asc', 'desc']).optional(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.listCustomersPaginated(
          input.establishmentId,
          input.page,
          input.perPage,
          input.search,
          input.customerType,
          input.periodStart ? new Date(input.periodStart) : undefined,
          input.periodEnd ? new Date(input.periodEnd) : undefined,
          input.sortBy,
          input.sortDir
        );
      }),

    // Perfil completo do cliente com estatísticas
    profile: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        customerId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const profile = await db.getCustomerProfile(input.establishmentId, input.customerId);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente não encontrado' });
        }
        return profile;
      }),

    // Histórico de pedidos do cliente
    orderHistory: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        customerPhone: z.string(),
        page: z.number().min(1).default(1),
        perPage: z.number().min(1).max(50).default(10),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getCustomerOrderHistory(
          input.establishmentId,
          input.customerPhone,
          input.page,
          input.perPage
        );
      }),

    // Atualizar perfil do cliente
    updateProfile: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        customerId: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        street: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        reference: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const { establishmentId, customerId, ...data } = input;
        return db.updateCustomerProfile(establishmentId, customerId, data);
      }),

    // Excluir cliente
    delete: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        customerId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const result = await db.deleteCustomer(input.establishmentId, input.customerId);
        if (!result.success) {
          throw new TRPCError({ code: 'NOT_FOUND', message: result.error || 'Cliente não encontrado' });
        }
        return result;
      }),

    // Criar novo cliente
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1),
        phone: z.string().min(8),
        street: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        reference: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const { establishmentId, ...data } = input;
        return db.createNewCustomer(establishmentId, data);
      }),

  detailsTab: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      console.log('[detailsTab] START - estId:', input.establishmentId);
      const t0 = Date.now();
      await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
      console.log('[detailsTab] after ownership check:', Date.now() - t0, 'ms');
      try {
        const result = await db.getCustomerDetailsTab(input.establishmentId);
        console.log('[detailsTab] DONE total:', Date.now() - t0, 'ms');
        return result;
      } catch (err: any) {
        console.error('[detailsTab] ERROR:', err?.message || err);
        console.error('[detailsTab] Stack:', err?.stack?.slice(0, 500));
        throw err;
      }
    }),
    
  });
