import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { logger } from "../_core/logger";
import { sendEvent } from "../_core/sse";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const tablesRouter = router({
    // Listar mesas do estabelecimento
    list: protectedProcedure.query(async ({ ctx }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) return [];
      return db.getTablesWithTabs(establishment.id);
    }),

    // Buscar mesa por ID
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const table = await db.getTableById(input.id);
        if (!table) return null;
        await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        const tab = await db.getActiveTabByTable(table.id);
        const items = tab ? await db.getTabItems(tab.id) : [];
        return { ...table, tab, items };
      }),

    // Criar nova mesa
    create: protectedProcedure
      .input(z.object({
        number: z.number(),
        name: z.string().optional(),
        capacity: z.number().optional(),
        spaceId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
        
        // Buscar o maior sortOrder existente para que a nova mesa fique no final
        const existingTables = await db.getTablesByEstablishment(establishment.id);
        const maxSortOrder = existingTables.length > 0
          ? Math.max(...existingTables.map(t => t.sortOrder ?? 0))
          : -1;
        
        const id = await db.createTable({
          establishmentId: establishment.id,
          number: input.number,
          name: input.name,
          capacity: input.capacity || 4,
          spaceId: input.spaceId,
          sortOrder: maxSortOrder + 1,
        });
        
        return { id };
      }),

    // Atualizar mesa
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        number: z.number().optional(),
        name: z.string().optional(),
        capacity: z.number().optional(),
        spaceId: z.number().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const table = await db.getTableById(input.id);
        if (!table) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mesa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        await db.updateTable(input.id, {
          number: input.number,
          name: input.name,
          capacity: input.capacity,
          spaceId: input.spaceId,
        });
        return { success: true };
      }),

    // Desativar mesa (marca isActive = false, continua visível no mapa como cinza)
    deactivate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const table = await db.getTableById(input.id);
        if (!table) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mesa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        await db.updateTable(input.id, { isActive: false });
        return { success: true };
      }),

    // Restaurar mesa desativada (marca isActive = true)
    restore: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const table = await db.getTableById(input.id);
        if (!table) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mesa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        await db.updateTable(input.id, { isActive: true });
        return { success: true };
      }),

    // Listar mesas desativadas do estabelecimento (visíveis no mapa como cinza)
    listDeactivated: protectedProcedure.query(async ({ ctx }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) return [];
      return db.getDeactivatedTables(establishment.id);
    }),

    // Excluir mesa (soft delete com deletedAt - some do mapa, aparece em Mesas Excluídas)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const table = await db.getTableById(input.id);
        if (!table) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mesa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        await db.softDeleteTable(input.id);
        return { success: true };
      }),

    // Excluir mesa permanentemente (hard delete - remove do banco)
    deletePermanently: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const table = await db.getTableById(input.id);
        if (!table) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mesa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        await db.deleteTable(input.id);
        return { success: true };
      }),

    // Listar mesas excluídas (soft deleted) do estabelecimento
    listDeleted: protectedProcedure.query(async ({ ctx }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) return [];
      return db.getDeletedTables(establishment.id);
    }),

    // Restaurar mesa excluída (limpa deletedAt e reativa)
    restoreDeleted: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const table = await db.getTableById(input.id);
        if (!table) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mesa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        await db.restoreDeletedTable(input.id);
        return { success: true };
      }),
    // Excluir múltiplas mesas de uma vez (soft delete)
    bulkDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        for (const id of input.ids) {
          const table = await db.getTableById(id);
          if (table && table.establishmentId === establishment.id) {
            await db.softDeleteTable(id);
          }
        }
        return { success: true, count: input.ids.length };
      }),
    // Excluir permanentemente TODAS as mesas excluídas
    deleteAllPermanently: protectedProcedure
      .mutation(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        const deletedTables = await db.getDeletedTables(establishment.id);
        for (const table of deletedTables) {
          await db.deleteTable(table.id);
        }
        return { success: true, count: deletedTables.length };
      }),

    // Abrir mesa (criar comanda)
    open: protectedProcedure
      .input(z.object({
        tableId: z.number(),
        guests: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
        
        const result = await db.openTable(establishment.id, input.tableId, input.guests || 1);
        sendEvent(establishment.id, "table_updated", { tableId: input.tableId, action: "open" });
        return result;
      }),

    // Fechar mesa
    close: protectedProcedure
      .input(z.object({
        tableId: z.number(),
        paymentMethod: z.string(),
        paidAmount: z.number(),
        changeAmount: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const table = await db.getTableById(input.tableId);
        if (!table) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mesa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        await db.closeTable(input.tableId, input.paymentMethod, input.paidAmount, input.changeAmount || 0);
        sendEvent(table.establishmentId, "table_updated", { tableId: input.tableId, action: "close" });
        return { success: true };
      }),

    // Solicitar conta (garçom pede fechamento)
    requestBill: protectedProcedure
      .input(z.object({
        tableId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const table = await db.getTableById(input.tableId);
        if (!table) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mesa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        // Atualizar status para requesting_bill
        await db.updateTableStatus(input.tableId, "requesting_bill");
        // Salvar quem solicitou e quando
        await db.setRequestingBillInfo(input.tableId, ctx.user.name || "Colaborador");
        sendEvent(table.establishmentId, "table_updated", { tableId: input.tableId, action: "requestBill" });
        return { success: true };
      }),

    // Listar mesas aguardando fechamento
    getPendingClosures: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return await db.getPendingClosures(input.establishmentId);
      }),

    // Fechamento parcial de mesa
    partialClose: protectedProcedure
      .input(z.object({
        tableId: z.number(),
        itemIds: z.array(z.number()),
        paymentMethod: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const table = await db.getTableById(input.tableId);
        if (!table) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mesa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        const result = await db.partialCloseTable(input.tableId, input.itemIds, input.paymentMethod);
        sendEvent(table.establishmentId, "table_updated", { tableId: input.tableId, action: "partialClose" });
        return result;
      }),

    // Pagamento avulso (abatimento por valor)
    loosePayment: protectedProcedure
      .input(z.object({
        tableId: z.number(),
        amount: z.number().positive(),
        paymentMethod: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const table = await db.getTableById(input.tableId);
        if (!table) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mesa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        const lpResult = await db.loosePayment(input.tableId, input.amount, input.paymentMethod, input.notes);
        sendEvent(table.establishmentId, "table_updated", { tableId: input.tableId, action: "loosePayment" });
        return lpResult;
      }),

    // Total de pagamentos avulsos de uma comanda
    getPaymentsTotal: protectedProcedure
      .input(z.object({
        tableId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const table = await db.getTableById(input.tableId);
        if (!table) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mesa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        const tab = await db.getActiveTabByTable(input.tableId);
        if (!tab) return { total: '0.00', payments: [] };
        const payments = await db.getTabPayments(tab.id);
        const total = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
        return { total: total.toFixed(2), payments };
      }),

    // Histórico de atividades da mesa (timeline)
    history: protectedProcedure
      .input(z.object({
        tableId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const table = await db.getTableById(input.tableId);
        if (!table) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mesa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        return db.getTableHistory(input.tableId);
      }),

    // Atualizar status da mesa
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["free", "occupied", "reserved", "requesting_bill"]),
        guests: z.number().optional(),
        reservedName: z.string().optional(),
        reservedPhone: z.string().optional(),
        reservedFor: z.string().optional(), // ISO string
        reservedGuests: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar ownership da mesa
        const table = await db.getTableById(input.id);
        if (!table) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mesa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        
        const reservationData = input.status === "reserved" ? {
          reservedName: input.reservedName,
          reservedPhone: input.reservedPhone,
          reservedFor: input.reservedFor ? new Date(input.reservedFor) : null,
          reservedGuests: input.reservedGuests,
        } : undefined;
        await db.updateTableStatus(input.id, input.status, input.guests, reservationData);
        sendEvent(table.establishmentId, "table_updated", { tableId: input.id, action: "updateStatus" });
        
        // Enviar WhatsApp de confirmação de reserva se telefone preenchido
        if (input.status === "reserved" && input.reservedPhone) {
          try {
            const establishment = await db.getEstablishmentByUserId(ctx.user.id);
            if (establishment) {
              const whatsappConfig = await db.getWhatsappConfig(establishment.id);
              if (whatsappConfig?.status === 'connected' && whatsappConfig.notifyOnReservation) {
                const { getWhatsAppProvider } = await import('../_core/whatsappProvider');
                const wa = await getWhatsAppProvider(establishment.id);
                if (wa.isAvailable()) {
                  // Buscar dados da mesa para pegar o número
                  const table = await db.getTableById(input.id);
                  const tableNumber = table?.number || input.id;
                  
                  const defaultTemplate = `Olá *{{cliente}}*! \ud83d\udc4b\ud83c\udffb\n\nSua reserva na *Mesa {{mesa}}* foi confirmada!\n\n\ud83d\udcc5 Horário: *{{horario}}*\n\ud83d\udc65 Pessoas: *{{pessoas}}*\n\n⚠️ *Obs:* Em caso de atraso, a mesa poderá ser ocupada.\n\nAguardamos você! \ud83d\ude0a\n\n*${establishment.name}*`;
                  let message = whatsappConfig.templateReservation || defaultTemplate;
                  message = message
                    .replace(/\{\{mesa\}\}/g, String(tableNumber))
                    .replace(/\{\{cliente\}\}/g, input.reservedName || 'Cliente')
                    .replace(/\{\{horario\}\}/g, input.reservedFor ? new Date(input.reservedFor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: establishment?.timezone || 'America/Sao_Paulo' }) : 'Não informado')
                    .replace(/\{\{pessoas\}\}/g, input.reservedGuests ? String(input.reservedGuests) : 'Não informado');
                  
                  await wa.sendText(input.reservedPhone, message);
                  logger.info(`[WhatsApp] Confirmação de reserva enviada para ${input.reservedPhone} - Mesa ${tableNumber}`);
                }
              }
            }
          } catch (error) {
            logger.error('[WhatsApp] Erro ao enviar confirmação de reserva:', error);
            // Não falhar a operação, apenas logar o erro
          }
        }
        
        return { success: true };
      }),

    // Criar múltiplas mesas de uma vez
    createBatch: protectedProcedure
      .input(z.object({
        startNumber: z.number(),
        count: z.number(),
        capacity: z.number().optional(),
        spaceId: z.number().optional(),
        spaceName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
        
        // Se spaceName fornecido e spaceId não, criar o espaço automaticamente
        let spaceId = input.spaceId;
        if (!spaceId && input.spaceName && input.spaceName.trim()) {
          // Verificar se já existe um espaço com esse nome
          const existingSpace = await db.getTableSpaceByName(establishment.id, input.spaceName.trim());
          if (existingSpace) {
            spaceId = existingSpace.id;
          } else {
            spaceId = await db.createTableSpace({
              establishmentId: establishment.id,
              name: input.spaceName.trim(),
            });
          }
        }
        
        // Buscar o maior sortOrder existente para que novas mesas fiquem no final
        const existingTables = await db.getTablesByEstablishment(establishment.id);
        const maxSortOrder = existingTables.length > 0
          ? Math.max(...existingTables.map(t => t.sortOrder ?? 0))
          : -1;
        
        const ids: number[] = [];
        for (let i = 0; i < input.count; i++) {
          const id = await db.createTable({
            establishmentId: establishment.id,
            number: input.startNumber + i,
            capacity: input.capacity || 4,
            sortOrder: maxSortOrder + 1 + i,
            spaceId: spaceId,
          });
          ids.push(id);
        }
        
        return { ids, count: ids.length, spaceId };
      }),

    // Juntar mesas (merge)
    merge: protectedProcedure
      .input(z.object({
        sourceTableId: z.number(), // Mesa que está sendo arrastada
        targetTableId: z.number(), // Mesa de destino
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
        
        // Buscar as duas mesas
        const sourceTable = await db.getTableById(input.sourceTableId);
        const targetTable = await db.getTableById(input.targetTableId);
        
        if (!sourceTable || !targetTable) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mesa não encontrada" });
        }
        
        // Verificar se alguma das mesas já está juntada a outra
        if (sourceTable.mergedIntoId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Esta mesa já está juntada a outra" });
        }
        if (targetTable.mergedIntoId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "A mesa de destino já está juntada a outra" });
        }
        
        // Determinar qual mesa será a principal (menor número)
        const primaryTable = sourceTable.number < targetTable.number ? sourceTable : targetTable;
        const secondaryTable = sourceTable.number < targetTable.number ? targetTable : sourceTable;
        
        // Coletar todos os números de mesas para o displayNumber
        const existingMergedIds: number[] = primaryTable.mergedTableIds 
          ? JSON.parse(primaryTable.mergedTableIds) 
          : [];
        
        // Adicionar a mesa secundária e suas mesas já juntadas
        const secondaryMergedIds: number[] = secondaryTable.mergedTableIds 
          ? JSON.parse(secondaryTable.mergedTableIds) 
          : [];
        
        const allMergedIds = [...existingMergedIds, secondaryTable.id, ...secondaryMergedIds];
        
        // Coletar todos os números para o displayNumber
        const allNumbers = [primaryTable.number];
        for (const id of allMergedIds) {
          const t = await db.getTableById(id);
          if (t) allNumbers.push(t.number);
        }
        allNumbers.sort((a, b) => a - b);
        const displayNumber = allNumbers.join('-');
        
        // Transferir itens da comanda da mesa secundária para a principal
        const sourceTab = await db.getActiveTabByTable(secondaryTable.id);
        let targetTab = await db.getActiveTabByTable(primaryTable.id);
        
        if (sourceTab) {
          // Se a mesa principal não tem comanda, criar uma
          if (!targetTab) {
            const result = await db.openTable(establishment.id, primaryTable.id, 1);
            targetTab = await db.getTabById(result.tabId);
          }
          
          if (targetTab) {
            // Transferir itens
            const sourceItems = await db.getTabItems(sourceTab.id);
            if (sourceItems.length > 0) {
              await db.addItemsToTab(targetTab.id, sourceItems.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                complements: item.complements || undefined,
                notes: item.notes || undefined,
              })));
            }
            
            // Fechar a comanda da mesa secundária (cancelar)
            await db.cancelTab(sourceTab.id);
          }
        }
        
        // Atualizar a mesa principal com os IDs das mesas juntadas
        await db.updateTableMerge(primaryTable.id, {
          mergedTableIds: JSON.stringify(allMergedIds),
          displayNumber,
          status: 'occupied',
          occupiedAt: primaryTable.occupiedAt || new Date(),
        });
        
        // Marcar a mesa secundária como juntada
        await db.updateTableMerge(secondaryTable.id, {
          mergedIntoId: primaryTable.id,
          mergedTableIds: null,
          displayNumber: null,
        });
        
        // Marcar mesas que estavam juntadas à secundária como juntadas à principal
        for (const id of secondaryMergedIds) {
          await db.updateTableMerge(id, {
            mergedIntoId: primaryTable.id,
          });
        }
        
        return { 
          success: true, 
          primaryTableId: primaryTable.id,
          displayNumber,
        };
      }),

    // Separar mesas (split)
    split: protectedProcedure
      .input(z.object({
        tableId: z.number(), // Mesa combinada a ser separada
      }))
      .mutation(async ({ ctx, input }) => {
        const table = await db.getTableById(input.tableId);
        if (!table) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mesa não encontrada" });
        }
        
        // Verificar se é uma mesa combinada
        if (!table.mergedTableIds) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Esta mesa não está combinada" });
        }
        
        const mergedIds: number[] = JSON.parse(table.mergedTableIds);
        
        // Limpar a mesa principal
        await db.updateTableMerge(table.id, {
          mergedTableIds: null,
          displayNumber: null,
        });
        
        // Liberar todas as mesas que estavam juntadas
        for (const id of mergedIds) {
          await db.updateTableMerge(id, {
            mergedIntoId: null,
            status: 'free',
          });
        }
        sendEvent(table.establishmentId, "table_updated", { tableId: input.tableId, action: "split" });
        
        return { success: true };
      }),

    // Atualizar label (identificação) da mesa
    updateLabel: protectedProcedure
      .input(z.object({
        id: z.number(),
        label: z.string().max(15).nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const table = await db.getTableById(input.id);
        if (!table) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mesa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        await db.updateTable(input.id, { label: input.label });
        return { success: true };
      }),

    // Mover mesa para outro espaço
    moveToSpace: protectedProcedure
      .input(z.object({
        tableId: z.number(),
        spaceId: z.number().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const table = await db.getTableById(input.tableId);
        if (!table) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mesa não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        await db.updateTable(input.tableId, { spaceId: input.spaceId });
        return { success: true };
      }),

    // Transferir itens de uma mesa para outra
    transferItems: protectedProcedure
      .input(z.object({
        sourceTableId: z.number(),
        targetTableId: z.number(),
        itemIds: z.array(z.number()).min(1),
        transferLabel: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
        
        // Buscar as duas mesas
        const sourceTable = await db.getTableById(input.sourceTableId);
        const targetTable = await db.getTableById(input.targetTableId);
        
        if (!sourceTable || !targetTable) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mesa não encontrada" });
        }
        
        // Buscar comanda ativa da mesa de origem
        const sourceTab = await db.getActiveTabByTable(input.sourceTableId);
        if (!sourceTab) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Mesa de origem não tem comanda aberta" });
        }
        
        // Buscar ou criar comanda na mesa de destino
        let targetTab = await db.getActiveTabByTable(input.targetTableId);
        if (!targetTab) {
          // Abrir a mesa de destino (cria comanda)
          const result = await db.openTable(establishment.id, input.targetTableId, 1);
          targetTab = await db.getTabById(result.tabId);
          if (!targetTab) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar comanda na mesa de destino" });
          }
        }
        
        // Transferir os itens
        const { sourceEmpty } = await db.transferTabItems(
          sourceTab.id,
          targetTab.id,
          input.itemIds,
          input.sourceTableId,
          input.targetTableId,
          input.transferLabel ?? false
        );
        
        sendEvent(establishment.id, "table_updated", { tableId: input.sourceTableId, action: "transfer" });
        sendEvent(establishment.id, "table_updated", { tableId: input.targetTableId, action: "transfer" });
        return { success: true, sourceEmpty };
      }),

    // Reordenar mesas (atualizar sortOrder de múltiplas mesas)
    reorder: protectedProcedure
      .input(z.object({
        orders: z.array(z.object({
          id: z.number(),
          sortOrder: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar ownership da primeira mesa para garantir que pertence ao utilizador
        if (input.orders.length > 0) {
          const table = await db.getTableById(input.orders[0].id);
          if (table) await assertEstablishmentOwnership(ctx.user.id, table.establishmentId);
        }
        await Promise.all(
          input.orders.map(({ id, sortOrder }) =>
            db.updateTable(id, { sortOrder })
          )
        );
        return { success: true };
      }),
  });
