import { z } from "zod";
import { protectedProcedure, adminProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getChangelogVersions,
  getChangelogVersionById,
  createChangelogVersion,
  updateChangelogVersion,
  deleteChangelogVersion,
  getChangelogEntries,
  createChangelogEntry,
  updateChangelogEntry,
  deleteChangelogEntry,
  getPublishedChangelogWithEntries,
  getEstablishmentByUserId,
  toggleChangelogLike,
} from "../db";
import { TRPCError } from "@trpc/server";
import { generateImage } from "../_core/imageGeneration";

export const changelogRouter = router({
  // ===== ADMIN ENDPOINTS =====

  /** Lista todas as versões (admin) */
  listVersions: adminProcedure.query(async () => {
    return getChangelogVersions();
  }),

  /** Obtém uma versão com suas entradas (admin) */
  getVersion: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const version = await getChangelogVersionById(input.id);
      if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Versão não encontrada" });
      const entries = await getChangelogEntries(input.id);
      return { ...version, entries };
    }),

  /** Cria uma nova versão (admin) */
  createVersion: adminProcedure
    .input(z.object({
      version: z.string().min(1).max(20),
      title: z.string().min(1).max(200),
      imageUrl: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await createChangelogVersion({
        version: input.version,
        title: input.title,
        imageUrl: input.imageUrl ?? null,
        isPublished: false,
      });
      return { id };
    }),

  /** Atualiza uma versão (admin) */
  updateVersion: adminProcedure
    .input(z.object({
      id: z.number(),
      version: z.string().min(1).max(20).optional(),
      title: z.string().min(1).max(200).optional(),
      imageUrl: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateChangelogVersion(id, data);
      return { success: true };
    }),

  /** Publica ou despublica uma versão (admin) */
  togglePublish: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const version = await getChangelogVersionById(input.id);
      if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Versão não encontrada" });

      const entries = await getChangelogEntries(input.id);
      if (!version.isPublished && entries.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Adicione pelo menos uma entrada antes de publicar" });
      }

      const newPublished = !version.isPublished;
      await updateChangelogVersion(input.id, {
        isPublished: newPublished,
        publishedAt: newPublished ? new Date() : null,
      });
      return { isPublished: newPublished };
    }),

  /** Exclui uma versão e suas entradas (admin) */
  deleteVersion: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteChangelogVersion(input.id);
      return { success: true };
    }),

  // ===== ENTRY ENDPOINTS (admin) =====

  /** Lista entradas de uma versão (admin) */
  listEntries: adminProcedure
    .input(z.object({ versionId: z.number() }))
    .query(async ({ input }) => {
      return getChangelogEntries(input.versionId);
    }),

  /** Cria uma entrada (admin) */
  createEntry: adminProcedure
    .input(z.object({
      versionId: z.number(),
      type: z.enum(["feature", "improvement", "fix"]),
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
      imageUrl: z.string().nullable().optional(),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const version = await getChangelogVersionById(input.versionId);
      if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Versão não encontrada" });
      const id = await createChangelogEntry(input);
      return { id };
    }),

  /** Atualiza uma entrada (admin) */
  updateEntry: adminProcedure
    .input(z.object({
      id: z.number(),
      type: z.enum(["feature", "improvement", "fix"]).optional(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(1000).optional(),
      imageUrl: z.string().nullable().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateChangelogEntry(id, data);
      return { success: true };
    }),

  /** Exclui uma entrada (admin) */
  deleteEntry: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteChangelogEntry(input.id);
      return { success: true };
    }),

  /** Gera imagem ilustrativa com IA para uma entrada do changelog */
  generateEntryImage: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      type: z.enum(["feature", "improvement", "fix"]).default("feature"),
    }))
    .mutation(async ({ input }) => {
      const typeLabel = input.type === "feature" ? "new feature" : input.type === "improvement" ? "improvement" : "bug fix";
      const context = input.description ? `${input.title}. ${input.description}` : input.title;

      const prompt = `Wide horizontal landscape banner illustration (16:9 ratio, much wider than tall) for a restaurant management platform ${typeLabel}: '${context}'. Flat design, minimal, professional. Soft gradient background from white to very light pink (#fff1f2). Primary colors: vibrant red (#dc2626), dark red (#b91c1c), soft pink (#fecaca), white, light gray. No green colors. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO LABELS anywhere in the image. RED-based color scheme. Include relevant abstract icons and simple UI elements spread horizontally across the wide canvas to represent the feature conceptually. The composition MUST be horizontal landscape orientation, like a website banner.`;

      try {
        const { url } = await generateImage({ prompt });
        return { url: url ?? null };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Falha ao gerar imagem: ${error.message}`,
        });
      }
    }),

  // ===== PUBLIC ENDPOINT =====

  /** Lista versões publicadas com entradas (para sidebar de novidades) */
  published: protectedProcedure.query(async ({ ctx }) => {
    const establishment = await getEstablishmentByUserId(ctx.user.id);
    return getPublishedChangelogWithEntries(establishment?.id ?? null);
  }),

  /** Alterna a curtida do estabelecimento autenticado numa versão publicada */
  toggleLike: protectedProcedure
    .input(z.object({ versionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const establishment = await getEstablishmentByUserId(ctx.user.id);
      if (!establishment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
      }

      const result = await toggleChangelogLike(input.versionId, establishment.id);
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Novidade publicada não encontrada" });
      }

      return result;
    }),
});
