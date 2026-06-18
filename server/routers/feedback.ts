import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const feedbackRouter = router({
    submit: protectedProcedure
      .input(z.object({
        establishmentId: z.number().optional(),
        type: z.enum(["bug", "suggestion", "praise"]),
        subject: z.string().min(1, "Assunto é obrigatório").max(255),
        message: z.string().min(1, "Mensagem é obrigatória"),
        imageUrls: z.array(z.string()).max(7).optional(),
        page: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createFeedback({
          userId: ctx.user.id,
          establishmentId: input.establishmentId ?? null,
          type: input.type,
          subject: input.subject,
          message: input.message,
          screenshotUrl: input.imageUrls?.join(",") ?? null,
          page: input.page ?? null,
          status: "new",
        });
        // Notificar owner
        try {
          const { notifyOwner } = await import("../_core/notification");
          const typeLabels: Record<string, string> = { bug: "Problema", suggestion: "Sugestão", praise: "Elogio" };
          await notifyOwner({
            title: `Novo Feedback: ${typeLabels[input.type] || input.type}`,
            content: `**${input.subject}**\n\n${input.message}\n\n_Enviado por: ${ctx.user.name || ctx.user.email}_`,
          });
        } catch (e) {
          logger.warn("[Feedback] Falha ao notificar owner:", e);
        }
        return { id };
      }),

    myFeedbacks: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getFeedbacksByUser(ctx.user.id);
      }),

    // Admin: listar todos os feedbacks
    listAll: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return db.getAllFeedbacks();
      }),

    // Admin: atualizar status
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "read", "in_progress", "resolved", "closed"]),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se é o owner
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        await db.updateFeedbackStatus(input.id, input.status, input.adminNotes);
        return { success: true };
      }),

    // Admin: estatísticas
    stats: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return db.getFeedbackStats();
      }),
  });
