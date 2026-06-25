import * as db from "../db";
import { notifyPrintOrder, notifyPrintCashReceipt, getPrinterConnectionCount } from "../_core/sse";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const printerRouter = router({
    // Listar impressoras do estabelecimento
    list: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getPrintersByEstablishment(input.establishmentId);
      }),
    
    // Buscar impressora por ID
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const printer = await db.getPrinterById(input.id);
        if (printer) await assertEstablishmentOwnership(ctx.user.id, printer.establishmentId);
        return printer;
      }),
    
    // Criar nova impressora
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1, "Nome é obrigatório"),
        ipAddress: z.string().min(1, "Endereço IP é obrigatório"),
        port: z.number().optional(),
        printerType: z.enum(['all', 'kitchen', 'counter', 'bar']).optional(),
        categoryIds: z.string().optional(),
        isActive: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const id = await db.createPrinter(input);
        return { id };
      }),
    
    // Atualizar impressora
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        ipAddress: z.string().optional(),
        port: z.number().optional(),
        printerType: z.enum(['all', 'kitchen', 'counter', 'bar']).optional(),
        categoryIds: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const printer = await db.getPrinterById(input.id);
        if (!printer) throw new TRPCError({ code: 'NOT_FOUND', message: 'Impressora não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, printer.establishmentId);
        const { id, ...data } = input;
        // Se categoryIds for undefined (não enviado), não alterar
        // Se categoryIds for null, limpar (impressora imprime tudo)
        // Se categoryIds for string, atualizar com os IDs selecionados
        await db.updatePrinter(id, data);
        return { success: true };
      }),
    
    // Deletar impressora
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const printer = await db.getPrinterById(input.id);
        if (!printer) throw new TRPCError({ code: 'NOT_FOUND', message: 'Impressora não encontrada' });
        await assertEstablishmentOwnership(ctx.user.id, printer.establishmentId);
        await db.deletePrinter(input.id);
        return { success: true };
      }),
    
    // Buscar configurações de impressão
    getSettings: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const settings = await db.getPrinterSettings(input.establishmentId);
        // Retornar objeto padrão se não houver configurações salvas
        return settings || {
          id: 0,
          establishmentId: input.establishmentId,
          autoPrintEnabled: false,
          printOnNewOrder: true,
          printOnStatusChange: false,
          copies: 1,
          showLogo: true,
          logoUrl: null,
          showQrCode: false,
          headerMessage: null,
          footerMessage: null,
          paperWidth: '80mm',
          posPrinterEnabled: false,
          posPrinterLinkcode: null,
          posPrinterNumber: 1,
          directPrintEnabled: false,
          directPrintIp: null,
          directPrintPort: 9100,
          fontSize: 12,
          fontWeight: 500,
          titleFontSize: 16,
          titleFontWeight: 700,
          itemFontSize: 12,
          itemFontWeight: 700,
          obsFontSize: 11,
          obsFontWeight: 500,
          showDividers: false,
          defaultPrintMethod: 'normal' as const,
          printerApiKey: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),
    
    // Salvar configurações de impressão
    saveSettings: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        autoPrintEnabled: z.boolean().optional(),
        printOnNewOrder: z.boolean().optional(),
        printOnStatusChange: z.boolean().optional(),
        copies: z.number().min(1).max(5).optional(),
        showLogo: z.boolean().optional(),
        logoUrl: z.string().nullable().optional(),
        showQrCode: z.boolean().optional(),
        qrCodeUrl: z.string().nullable().optional(),
        headerMessage: z.string().nullable().optional(),
        footerMessage: z.string().nullable().optional(),
        paperWidth: z.enum(['58mm', '80mm']).optional(),
        posPrinterEnabled: z.boolean().optional(),
        posPrinterLinkcode: z.string().nullable().optional(),
        posPrinterNumber: z.number().min(1).max(10).optional(),
        directPrintEnabled: z.boolean().optional(),
        directPrintIp: z.string().nullable().optional(),
        directPrintPort: z.number().min(1).max(65535).optional(),
        fontSize: z.number().min(8).max(24).optional(),
        fontWeight: z.number().min(300).max(900).optional(),
        titleFontSize: z.number().min(10).max(32).optional(),
        titleFontWeight: z.number().min(300).max(900).optional(),
        itemFontSize: z.number().min(8).max(24).optional(),
        itemFontWeight: z.number().min(300).max(900).optional(),
        obsFontSize: z.number().min(8).max(20).optional(),
        obsFontWeight: z.number().min(300).max(900).optional(),
        showDividers: z.boolean().optional(),
        boxPadding: z.number().min(4).max(20).optional(),
        itemBorderStyle: z.enum(['rounded', 'dashed']).optional(),
        defaultPrintMethod: z.enum(['normal', 'android', 'automatic']).optional(),
        htmlPrintEnabled: z.boolean().optional(),
        beepOnPrint: z.boolean().optional(),
        // Configurações específicas do Mindi Printer
        mindiFontSize: z.number().min(8).max(24).optional(),
        mindiFontWeight: z.number().min(300).max(900).optional(),
        mindiTitleFontSize: z.number().min(10).max(32).optional(),
        mindiTitleFontWeight: z.number().min(300).max(900).optional(),
        mindiItemFontSize: z.number().min(8).max(24).optional(),
        mindiItemFontWeight: z.number().min(300).max(900).optional(),
        mindiObsFontSize: z.number().min(8).max(20).optional(),
        mindiObsFontWeight: z.number().min(300).max(900).optional(),
        mindiShowDividers: z.boolean().optional(),
        mindiBoxPadding: z.number().min(4).max(20).optional(),
        mindiItemBorderStyle: z.enum(['rounded', 'dashed']).optional(),
        mindiPaperWidth: z.enum(['58mm', '80mm']).optional(),
        mindiShowLogo: z.boolean().optional(),
        mindiHeaderMessage: z.string().nullable().optional(),
        mindiFooterMessage: z.string().nullable().optional(),
        mindiBeepOnPrint: z.boolean().optional(),
        mindiHtmlPrintEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await db.upsertPrinterSettings(input);
        return { success: true };
      }),
    
    // Gerar nova API key para integração com app de impressora
    generateApiKey: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const apiKey = await db.generatePrinterApiKey(input.establishmentId);
        return { apiKey };
      }),
    
    // Revogar API key da impressora
    revokeApiKey: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await db.revokePrinterApiKey(input.establishmentId);
        return { success: true };
      }),
    
    // Testar conexão com impressão direta via rede
    testDirectPrint: protectedProcedure
      .input(z.object({
        ip: z.string(),
        port: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { testPrinterConnection } = await import('../escposPrinter');
        return testPrinterConnection({ ip: input.ip, port: input.port || 9100 });
      }),
    
    // Testar conexão com POSPrinterDriver
    testPOSPrinter: protectedProcedure
      .input(z.object({
        linkcode: z.string(),
        printerNumber: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { testPOSPrinterConnection } = await import('../posPrinterDriver');
        return testPOSPrinterConnection(input.linkcode, input.printerNumber || 1);
      }),
    
    // Buscar impressora padrão
    getDefault: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getDefaultPrinter(input.establishmentId);
      }),
    
    // Imprimir pedido manualmente (retorna dados para o cliente enviar à impressora)
    printOrder: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        printerId: z.number().optional(), // Se não informado, usa a impressora padrão
      }))
      .mutation(async ({ ctx, input }) => {
        // Buscar dados do pedido
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pedido não encontrado",
          });
        }
        
        // Buscar itens do pedido
        const orderItems = await db.getOrderItems(input.orderId);
        
        // Buscar impressora
        let printer;
        if (input.printerId) {
          printer = await db.getPrinterById(input.printerId);
        } else {
          printer = await db.getDefaultPrinter(order.establishmentId);
        }
        
        if (!printer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Nenhuma impressora configurada",
          });
        }
        
        if (!printer.isActive) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Impressora está desativada",
          });
        }
        
        // Buscar configurações de impressão
        const settings = await db.getPrinterSettings(order.establishmentId);
        
        // Buscar estabelecimento para o nome
        const establishment = await db.getEstablishmentById(order.establishmentId);
        
        // Retornar dados para o cliente enviar à impressora
        return {
          printer: {
            ip: printer.ipAddress,
            port: printer.port || 9100,
          },
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerAddress: order.customerAddress,
            deliveryType: order.deliveryType,
            paymentMethod: order.paymentMethod,
            subtotal: order.subtotal,
            deliveryFee: order.deliveryFee,
            discount: order.discount,
            total: order.total,
            notes: order.notes,
            couponCode: order.couponCode,
            createdAt: order.createdAt,
            items: orderItems.map(item => ({
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              notes: item.notes,
              complements: item.complements,
            })),
          },
          settings: {
            copies: settings?.copies || 1,
            showLogo: settings?.showLogo ?? true,
            showQrCode: settings?.showQrCode ?? false,
            footerMessage: settings?.footerMessage || null,
          },
          establishment: {
            name: establishment?.name || 'Estabelecimento',
          },
        };
      }),
    
    // Testar conexão com impressora via TCP
    testConnection: protectedProcedure
      .input(z.object({
        ipAddress: z.string().min(1, "Endereço IP é obrigatório"),
        port: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const net = await import('net');
        const port = input.port || 9100;
        
        return new Promise<{ success: boolean; message: string }>((resolve) => {
          const socket = new net.Socket();
          const timeout = 5000; // 5 segundos de timeout
          
          socket.setTimeout(timeout);
          
          socket.on('connect', () => {
            socket.destroy();
            resolve({ 
              success: true, 
              message: `Conexão estabelecida com sucesso em ${input.ipAddress}:${port}` 
            });
          });
          
          socket.on('timeout', () => {
            socket.destroy();
            resolve({ 
              success: false, 
              message: `Tempo limite excedido ao conectar em ${input.ipAddress}:${port}` 
            });
          });
          
          socket.on('error', (err: Error) => {
            socket.destroy();
            let errorMessage = `Erro ao conectar em ${input.ipAddress}:${port}`;
            
            if (err.message.includes('ECONNREFUSED')) {
              errorMessage = `Conexão recusada em ${input.ipAddress}:${port}. Verifique se a impressora está ligada e acessível.`;
            } else if (err.message.includes('EHOSTUNREACH')) {
              errorMessage = `Host inacessível: ${input.ipAddress}. Verifique o endereço IP.`;
            } else if (err.message.includes('ENETUNREACH')) {
              errorMessage = `Rede inacessível. Verifique sua conexão de rede.`;
            } else if (err.message.includes('ENOTFOUND')) {
              errorMessage = `Endereço não encontrado: ${input.ipAddress}`;
            }
            
            resolve({ 
              success: false, 
              message: errorMessage 
            });
          });
          
          socket.connect(port, input.ipAddress);
        });
      }),
    
    // ============ PRINT QUEUE (API para App Android) ============
    
    // Buscar pedidos pendentes na fila de impressão (polling)
    queue: router({
      // Buscar pedidos pendentes para impressão
      pending: publicProcedure
        .input(z.object({ 
          establishmentId: z.number(),
          apiKey: z.string().optional() // Para autenticação do app Android
        }))
        .query(async ({ input }) => {
          const jobs = await db.getPendingPrintJobs(input.establishmentId);
          return jobs;
        }),
      
      // Buscar dados completos de um job para impressão
      getJob: publicProcedure
        .input(z.object({ 
          jobId: z.number(),
          apiKey: z.string().optional()
        }))
        .query(async ({ input }) => {
          const result = await db.getPrintJobWithOrder(input.jobId);
          if (!result) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Job não encontrado'
            });
          }
          
          // Buscar configurações de impressão
          const settings = await db.getPrinterSettings(result.job.establishmentId);
          const establishment = await db.getEstablishmentById(result.job.establishmentId);
          
          return {
            job: result.job,
            order: result.order,
            items: result.items,
            settings: {
              copies: settings?.copies || 1,
              showLogo: settings?.showLogo ?? true,
              logoUrl: settings?.logoUrl || establishment?.logo,
              showQrCode: settings?.showQrCode ?? false,
              headerMessage: settings?.headerMessage,
              footerMessage: settings?.footerMessage,
              paperWidth: settings?.paperWidth || '80mm',
            },
            establishment: {
              name: establishment?.name || 'Estabelecimento',
              logo: establishment?.logo,
              whatsapp: establishment?.whatsapp,
            },
          };
        }),
      
      // Marcar job como impresso
      markPrinted: publicProcedure
        .input(z.object({ 
          jobId: z.number(),
          apiKey: z.string().optional()
        }))
        .mutation(async ({ input }) => {
          await db.updatePrintJobStatus(input.jobId, 'completed');
          return { success: true };
        }),
      
      // Marcar job como falha
      markFailed: publicProcedure
        .input(z.object({ 
          jobId: z.number(),
          errorMessage: z.string().optional(),
          apiKey: z.string().optional()
        }))
        .mutation(async ({ input }) => {
          await db.updatePrintJobStatus(input.jobId, 'failed', input.errorMessage);
          return { success: true };
        }),
      
      // Adicionar pedido à fila manualmente
      add: protectedProcedure
        .input(z.object({
          establishmentId: z.number(),
          orderId: z.number(),
          printerId: z.number().optional(),
          copies: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
          const id = await db.addToPrintQueue(input);
          return { id };
        }),
      
      // Buscar histórico de impressões
      history: protectedProcedure
        .input(z.object({ 
          establishmentId: z.number(),
          limit: z.number().optional()
        }))
        .query(async ({ ctx, input }) => {
          await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
          return db.getPrintHistory(input.establishmentId, input.limit);
        }),
    }),
    
    // ============ PRINT LOGS ============
    logs: router({
      // Listar logs de impressão com filtros
      list: protectedProcedure
        .input(z.object({
          establishmentId: z.number(),
          limit: z.number().optional(),
          offset: z.number().optional(),
          orderId: z.number().optional(),
          orderNumber: z.string().optional(),
          trigger: z.string().optional(),
          status: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        }))
        .query(async ({ ctx, input }) => {
          await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
          return db.getPrintLogs(input.establishmentId, {
            limit: input.limit,
            offset: input.offset,
            orderId: input.orderId,
            orderNumber: input.orderNumber,
            trigger: input.trigger,
            status: input.status,
            startDate: input.startDate,
            endDate: input.endDate,
          });
        }),
      
      // Estatísticas de impressão
      stats: protectedProcedure
        .input(z.object({
          establishmentId: z.number(),
          days: z.number().optional(),
        }))
        .query(async ({ ctx, input }) => {
          await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
          return db.getPrintLogStats(input.establishmentId, input.days);
        }),
      
      // Limpar logs antigos
      clear: protectedProcedure
        .input(z.object({
          establishmentId: z.number(),
          olderThanDays: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
          const deleted = await db.clearPrintLogs(input.establishmentId, input.olderThanDays);
          return { deleted };
        }),
    }),
    // Reimprimir pedido via impressão automática (Mindi Printer)
    reprintOrder: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        establishmentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        
        // Buscar dados do pedido
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido não encontrado' });
        }
        
        // Buscar itens do pedido
        const items = await db.getOrderItems(input.orderId);
        if (!items || items.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Itens do pedido não encontrados' });
        }
        
        // Buscar configurações da impressora
        const printerSettings = await db.getPrinterSettings(input.establishmentId);
        
        // Buscar printers para incluir categoryIds no payload
        const printers = await db.getPrintersByEstablishment(input.establishmentId);
        const printerCategoryMap: Record<string, number[]> = {};
        if (printers && printers.length > 0) {
          for (const p of printers) {
            if (p.isActive && p.categoryIds) {
              try {
                const catIds = typeof p.categoryIds === 'string' ? JSON.parse(p.categoryIds) : p.categoryIds;
                if (Array.isArray(catIds) && catIds.length > 0) {
                  printerCategoryMap[String(p.id)] = catIds;
                }
              } catch {}
            }
          }
        }
        
        // Verificar se há impressoras conectadas
        const connectionCount = getPrinterConnectionCount(input.establishmentId);
        if (connectionCount === 0) {
          throw new TRPCError({ 
            code: 'PRECONDITION_FAILED', 
            message: 'Nenhuma impressora Mindi conectada. Verifique se o app Mindi Printer está aberto e conectado.' 
          });
        }
        
        // Enviar evento SSE para impressão
        notifyPrintOrder(input.establishmentId, {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName || null,
          customerPhone: order.customerPhone || null,
          customerAddress: order.customerAddress || null,
          deliveryType: order.deliveryType || "delivery",
          paymentMethod: order.paymentMethod || "cash",
          subtotal: order.subtotal || "0",
          deliveryFee: order.deliveryFee || "0",
          discount: order.discount || "0",
          total: order.total,
          notes: order.notes || null,
          changeAmount: order.changeAmount || null,
          items: items.map(item => ({
            productName: item.productName,
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            complements: item.complements || null,
            notes: item.notes || null,
            categoryId: item.categoryId || null,
            productId: item.productId || null,
          })),
          createdAt: order.createdAt || new Date(),
          beepOnPrint: (printerSettings as any)?.mindiBeepOnPrint ?? printerSettings?.beepOnPrint ?? false,
          htmlPrintEnabled: (printerSettings as any)?.mindiHtmlPrintEnabled ?? printerSettings?.htmlPrintEnabled ?? true,
          printerCategoryMap: Object.keys(printerCategoryMap).length > 0 ? printerCategoryMap : undefined,
        });
        
        // Registrar log de reimpressão
        db.createPrintLog({
          establishmentId: input.establishmentId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          trigger: 'reprint',
          method: 'sse',
          status: 'sent',
          printerConnections: connectionCount,
          metadata: { reprintedBy: ctx.user.id },
        }).catch(() => {});
        
        logger.info(`[Printer:reprintOrder] Reimpressão enviada: pedido=${order.orderNumber} conns=${connectionCount}`);
        
        return { success: true, connections: connectionCount };
      }),
    printCashReceipt: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        storeName: z.string(),
        operatorName: z.string(),
        openedAt: z.string().nullable(),
        closedAt: z.string().nullable(),
        openingAmount: z.number(),
        closingAmount: z.number(),
        salesTotal: z.number(),
        salesCount: z.number(),
        paymentBreakdown: z.array(z.object({
          method: z.string(),
          total: z.number(),
          count: z.number(),
        })),
        movements: z.array(z.object({
          type: z.string(),
          amount: z.string(),
          reason: z.string().nullable(),
          createdAt: z.any(),
        })),
        commissionsTotal: z.number().optional(),
        commissionsCount: z.number().optional(),
        commissionDestination: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const connectionCount = getPrinterConnectionCount(input.establishmentId);
        if (connectionCount === 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Nenhuma impressora Mindi conectada. Verifique se o app Mindi Printer está aberto e conectado.",
          });
        }
        const printerSettings = await db.getPrinterSettings(input.establishmentId);
        notifyPrintCashReceipt(input.establishmentId, {
          storeName: input.storeName,
          operatorName: input.operatorName,
          openedAt: input.openedAt,
          closedAt: input.closedAt,
          openingAmount: input.openingAmount,
          closingAmount: input.closingAmount,
          salesTotal: input.salesTotal,
          salesCount: input.salesCount,
          commissionsTotal: input.commissionsTotal,
          commissionsCount: input.commissionsCount,
          commissionDestination: input.commissionDestination,
          paymentBreakdown: input.paymentBreakdown,
          movements: input.movements,
          beepOnPrint: (printerSettings as any)?.mindiBeepOnPrint ?? printerSettings?.beepOnPrint ?? false,
          htmlPrintEnabled: (printerSettings as any)?.mindiHtmlPrintEnabled ?? printerSettings?.htmlPrintEnabled ?? true,
        });
        logger.info(`[Printer:printCashReceipt] Recibo de caixa enviado: conns=${connectionCount}`);
        return { success: true, connections: connectionCount };
      }),
  });
