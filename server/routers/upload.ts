import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { logger } from "../_core/logger";
import { mindiStoragePut } from "../mindiStorage";
import { nanoid } from "nanoid";
import { processImage, processSingleImage, generateBlurPlaceholder } from "../imageProcessor";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"];

export const uploadRouter = router({
    image: protectedProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.enum(ALLOWED_MIME_TYPES as unknown as readonly [string, ...string[]], {
          error: `Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_MIME_TYPES.join(", ")}`,
        }),
        folder: z.string().optional(),
        singleVersion: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { base64, mimeType, folder = "products", singleVersion = false } = input;
        const buffer = Buffer.from(base64, "base64");
        const id = nanoid();

        if (singleVersion) {
          // Logos, capas, QR codes — versão otimizada + thumbnail + blur placeholder
          const processed = await processSingleImage(buffer);
          const blurDataUrl = await generateBlurPlaceholder(buffer);
          const mainFileName = `${folder}/${id}.webp`;
          const thumbFileName = `${folder}/${id}_thumb.webp`;

          // Gerar thumbnail (400px) para uso em listagens/srcset
          const thumbBuffer = await processSingleImage(buffer, 400, 75);

          const [mainResult] = await Promise.all([
            mindiStoragePut(mainFileName, processed.buffer, "image/webp"),
            mindiStoragePut(thumbFileName, thumbBuffer.buffer, "image/webp"),
          ]);

          return { url: mainResult.url, blurDataUrl };
        }

        // Produtos — gerar main (1200px) + thumb (400px) + blur placeholder
        const processed = await processImage(buffer);
        const mainFileName = `${folder}/${id}.webp`;
        const thumbFileName = `${folder}/${id}_thumb.webp`;

        const [mainResult, thumbResult] = await Promise.all([
          mindiStoragePut(mainFileName, processed.mainBuffer, "image/webp"),
          mindiStoragePut(thumbFileName, processed.thumbBuffer, "image/webp"),
        ]);

        return { url: mainResult.url, thumbUrl: thumbResult.url, blurDataUrl: processed.blurDataUrl };
      }),

    // Endpoint standalone de enhance de imagem - funciona sem productId (para criação de produto)
    enhanceImage: protectedProcedure
      .input(z.object({
        imageUrl: z.string().url(),
        establishmentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar ownership do estabelecimento
        const { assertEstablishmentOwnership } = await import("./helpers");
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);

        // Verificar créditos de imagem IA
        const credits = await db.getAiImageCredits(input.establishmentId);
        if (credits <= 0) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Seus créditos de melhoria de imagem acabaram. Compre mais créditos para continuar.' });
        }

        const { enhanceProductImage } = await import('../imageEnhancer');
        const result = await enhanceProductImage(input.imageUrl, input.establishmentId);

        // Baixar a imagem melhorada e aplicar o mesmo pipeline de otimização
        const enhancedResponse = await fetch(result.enhancedUrl);
        if (!enhancedResponse.ok) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Falha ao baixar imagem melhorada para otimização' });
        }
        const enhancedBuffer = Buffer.from(await enhancedResponse.arrayBuffer());

        // Processar: WebP + resize (1200px main + 400px thumb) + blur placeholder
        const processed = await processImage(enhancedBuffer);
        const id = nanoid(12);
        const folder = `est/${input.establishmentId}/products`;
        const mainFileName = `${folder}/enhanced_${id}.webp`;
        const thumbFileName = `${folder}/enhanced_${id}_thumb.webp`;

        const [mainResult, thumbResult] = await Promise.all([
          mindiStoragePut(mainFileName, processed.mainBuffer, "image/webp"),
          mindiStoragePut(thumbFileName, processed.thumbBuffer, "image/webp"),
        ]);

        // Consumir 1 crédito após sucesso
        const remainingCredits = await db.consumeAiImageCredit(input.establishmentId, ctx.user.id);

        return {
          enhancedUrl: mainResult.url,
          originalUrl: input.imageUrl,
          remainingCredits: remainingCredits ?? 0,
        };
      }),
  });
