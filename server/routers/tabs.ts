import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const tabsRouter = router({
    // Buscar comanda por ID
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const tab = await db.getTabById(input.id);
        if (!tab) return null;
        if (tab.tableId) {
          const table = await db.getTableById(tab.tableId);
          if (table) await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        }
        const items = await db.getTabItems(tab.id);
        return { ...tab, items };
      }),

    // Buscar comanda ativa de uma mesa
    getByTable: protectedProcedure
      .input(z.object({ tableId: z.number() }))
      .query(async ({ ctx, input }) => {
        const table = await db.getTableById(input.tableId);
        if (table) await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        const tab = await db.getActiveTabByTable(input.tableId);
        if (!tab) return null;
        const items = await db.getTabItems(tab.id);
        return { ...tab, items };
      }),

    // Adicionar itens à comanda
    addItems: protectedProcedure
      .input(z.object({
        tabId: z.number(),
        items: z.array(z.object({
          productId: z.number(),
          productName: z.string(),
          quantity: z.number(),
          unitPrice: z.string(),
          totalPrice: z.string(),
          complements: z.array(z.object({
            name: z.string(),
            price: z.number(),
            quantity: z.number(),
          })).optional(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar ownership da comanda
        const tab = await db.getTabById(input.tabId);
        if (!tab) throw new TRPCError({ code: 'NOT_FOUND', message: 'Comanda não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, tab.establishmentId);
        
        // Adicionar itens à comanda
        await db.addItemsToTab(input.tabId, input.items);
        
        // Buscar a comanda para obter informações da mesa
        const tabAfter = await db.getTabById(input.tabId);
        if (!tabAfter) {
          return { success: true };
        }
        
        // Buscar a mesa para obter o número
        if (!tabAfter.tableId) {
          return { success: true };
        }
        const table = await db.getTableById(tabAfter.tableId);
        if (!table) {
          return { success: true };
        }
        
        // Buscar o estabelecimento
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) {
          return { success: true };
        }
        
        // Calcular o total dos itens
        const subtotal = input.items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
        
        // Gerar número do pedido
        const orderNumber = Date.now().toString().slice(-6);
        
        // Usar displayNumber para mesas combinadas, senão usar o número normal
        const tableDisplayName = table.displayNumber || String(table.number);
        
        // Criar o pedido na tabela orders
        await db.createOrder({
          establishmentId: establishment.id,
          orderNumber,
          customerName: `Mesa ${tableDisplayName}`,
          customerPhone: "",
          customerAddress: "",
          deliveryType: "dine_in",
          paymentMethod: "cash",
          subtotal: subtotal.toFixed(2),
          deliveryFee: "0.00",
          discount: "0.00",
          total: subtotal.toFixed(2),
          notes: `Comanda da Mesa ${tableDisplayName}`,
          status: "preparing",
          source: "pdv",
        }, input.items.map(item => ({
          orderId: 0, // Será preenchido pela função createOrder
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          complements: item.complements || [],
          notes: item.notes,
        })));
        
        // Nota: a dedução de estoque (produtos + complementos) é feita automaticamente
        // dentro de db.createOrder -> db.deductStockForOrder
        // que desconta tanto o estoque avançado (stockItems) quanto o simples (stockQuantity)
        
        return { success: true };
      }),

    // Atualizar item da comanda
    updateItem: protectedProcedure
      .input(z.object({
        id: z.number(),
        quantity: z.number().optional(),
        status: z.enum(["pending", "preparing", "ready", "delivered", "cancelled"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar ownership do item via comanda
        const tabItem = await db.getTabItemById(input.id);
        if (!tabItem) throw new TRPCError({ code: 'NOT_FOUND', message: 'Item não encontrado' });
        const tab = await db.getTabById(tabItem.tabId);
        if (!tab) throw new TRPCError({ code: 'NOT_FOUND', message: 'Comanda não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, tab.establishmentId);
        
        const { id, quantity, ...rest } = input;
        
        // Se a quantidade mudou, recalcular o totalPrice
        if (quantity !== undefined) {
          // Buscar o item atual para calcular o novo totalPrice
          const currentItem = await db.getTabItemById(id);
          if (currentItem) {
            const unitPrice = parseFloat(currentItem.unitPrice);
            const complementsTotal = (currentItem.complements || []).reduce(
              (sum: number, c: any) => sum + (parseFloat(c.price) || 0) * (c.quantity || 1), 0
            );
            const newTotalPrice = ((unitPrice + complementsTotal) * quantity).toFixed(2);
            await db.updateTabItem(id, { ...rest, quantity, totalPrice: newTotalPrice });
          } else {
            await db.updateTabItem(id, { ...rest, quantity });
          }
        } else {
          await db.updateTabItem(id, rest);
        }
        return { success: true };
      }),

    // Cancelar item da comanda
    cancelItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verificar ownership do item via comanda
        const tabItem = await db.getTabItemById(input.id);
        if (!tabItem) throw new TRPCError({ code: 'NOT_FOUND', message: 'Item não encontrado' });
        const tab = await db.getTabById(tabItem.tabId);
        if (!tab) throw new TRPCError({ code: 'NOT_FOUND', message: 'Comanda não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, tab.establishmentId);
        
        await db.cancelTabItem(input.id);
        return { success: true };
      }),

    // Atualizar comanda (desconto, taxa de serviço, etc)
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        discount: z.string().optional(),
        serviceCharge: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar ownership da comanda
        const tab = await db.getTabById(input.id);
        if (!tab) throw new TRPCError({ code: 'NOT_FOUND', message: 'Comanda não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, tab.establishmentId);
        
        const { id, ...data } = input;
        await db.updateTab(id, data);
        // Recalcular totais
        await db.recalculateTabTotals(id);
        return { success: true };
      }),

    // Pedir conta (mudar status para requesting_bill)
    requestBill: protectedProcedure
      .input(z.object({ tableId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const table = await db.getTableById(input.tableId);
        if (table) await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        await db.updateTableStatus(input.tableId, "requesting_bill");
        const tab = await db.getActiveTabByTable(input.tableId);
        if (tab) {
          await db.updateTab(tab.id, { status: "requesting_bill" });
        }
        return { success: true };
      }),
  });
