/**
 * Image Processor Module
 * 
 * Processa imagens no upload para gerar duas versões otimizadas:
 * - Principal (main): largura máxima 1200px, WebP qualidade 80%
 * - Miniatura (thumb): largura máxima 400px, WebP qualidade 75%
 * 
 * Todas as imagens são convertidas para WebP independentemente do formato original.
 */

import sharp from "sharp";

export interface ProcessedImage {
  /** Buffer da imagem principal (max 1200px) */
  mainBuffer: Buffer;
  /** Buffer da miniatura (max 400px) */
  thumbBuffer: Buffer;
  /** Placeholder blur em base64 data URI (~20px, <1KB) */
  blurDataUrl: string;
  /** Largura da imagem principal */
  mainWidth: number;
  /** Altura da imagem principal */
  mainHeight: number;
  /** Largura da miniatura */
  thumbWidth: number;
  /** Altura da miniatura */
  thumbHeight: number;
  /** Tamanho em bytes da imagem principal */
  mainSize: number;
  /** Tamanho em bytes da miniatura */
  thumbSize: number;
  /** Tamanho original em bytes */
  originalSize: number;
}

const MAIN_MAX_WIDTH = 1200;
const THUMB_MAX_WIDTH = 400;
const BLUR_WIDTH = 20;
const MAIN_QUALITY = 80;
const THUMB_QUALITY = 75;
const BLUR_QUALITY = 30;

/**
 * Processa um buffer de imagem e gera duas versões otimizadas em WebP.
 * 
 * @param inputBuffer - Buffer da imagem original (qualquer formato suportado pelo sharp)
 * @returns Objeto com os buffers processados e metadados
 */
export async function processImage(inputBuffer: Buffer): Promise<ProcessedImage> {
  const originalSize = inputBuffer.length;

  // Obter metadados da imagem original
  const metadata = await sharp(inputBuffer).metadata();
  const originalWidth = metadata.width || MAIN_MAX_WIDTH;

  // Gerar imagem principal (max 1200px de largura)
  const mainPipeline = sharp(inputBuffer)
    .rotate() // Auto-rotate based on EXIF
    .resize({
      width: Math.min(originalWidth, MAIN_MAX_WIDTH),
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: MAIN_QUALITY });

  const mainBuffer = await mainPipeline.toBuffer();
  const mainMeta = await sharp(mainBuffer).metadata();

  // Gerar miniatura (max 400px de largura)
  const thumbPipeline = sharp(inputBuffer)
    .rotate()
    .resize({
      width: Math.min(originalWidth, THUMB_MAX_WIDTH),
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: THUMB_QUALITY });

  const thumbBuffer = await thumbPipeline.toBuffer();
  const thumbMeta = await sharp(thumbBuffer).metadata();

  // Gerar placeholder blur (~20px, base64 inline)
  const blurDataUrl = await generateBlurPlaceholder(inputBuffer);

  return {
    mainBuffer,
    thumbBuffer,
    blurDataUrl,
    mainWidth: mainMeta.width || 0,
    mainHeight: mainMeta.height || 0,
    thumbWidth: thumbMeta.width || 0,
    thumbHeight: thumbMeta.height || 0,
    mainSize: mainBuffer.length,
    thumbSize: thumbBuffer.length,
    originalSize,
  };
}

/**
 * Gera um placeholder blur de ~20px como data URI base64.
 * Resultado é tipicamente <500 bytes, ideal para inline no HTML/JSON.
 * 
 * @param inputBuffer - Buffer da imagem original
 * @returns Data URI base64 (ex: "data:image/webp;base64,...")
 */
export async function generateBlurPlaceholder(inputBuffer: Buffer): Promise<string> {
  const blurBuffer = await sharp(inputBuffer)
    .rotate()
    .resize({
      width: BLUR_WIDTH,
      withoutEnlargement: true,
      fit: "inside",
    })
    .blur(2)
    .webp({ quality: BLUR_QUALITY })
    .toBuffer();

  return `data:image/webp;base64,${blurBuffer.toString("base64")}`;
}

export async function processSingleImage(
  inputBuffer: Buffer,
  maxWidth = MAIN_MAX_WIDTH,
  quality = MAIN_QUALITY
): Promise<{ buffer: Buffer; blurDataUrl: string; width: number; height: number; size: number; originalSize: number }> {
  const originalSize = inputBuffer.length;
  const metadata = await sharp(inputBuffer).metadata();
  const originalWidth = metadata.width || maxWidth;

  const buffer = await sharp(inputBuffer)
    .rotate()
    .resize({
      width: Math.min(originalWidth, maxWidth),
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality })
    .toBuffer();

  const meta = await sharp(buffer).metadata();
  const blurDataUrl = await generateBlurPlaceholder(inputBuffer);

  return {
    buffer,
    blurDataUrl,
    width: meta.width || 0,
    height: meta.height || 0,
    size: buffer.length,
    originalSize,
  };
}
