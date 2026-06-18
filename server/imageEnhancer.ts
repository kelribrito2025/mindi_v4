/**
 * Image Enhancer - Melhoramento de fotos de produtos com Nano Banana Pro/fallback local
 *
 * Fluxo principal:
 * 1. Usa Google Gemini para descrever a foto original e Gemini 3 Pro Image
 *    (Nano Banana Pro) para gerar uma composição profissional quando uma chave Gemini/Google está configurada.
 * 2. Se o Google não estiver configurado ou falhar, aplica um melhoramento local
 *    seguro com Sharp.
 *
 * O fallback local não altera o alimento/produto. Ele melhora iluminação, contraste,
 * saturação, nitidez e cria uma composição profissional com fundo desfocado derivado
 * da própria foto. Assim o Mindi Vision continua operacional mesmo sem provedor externo.
 *
 * Limite: imagens até 4MB
 */

import sharp from "sharp";
import { mindiStoragePut } from "./mindiStorage";
import { nanoid } from "nanoid";
import { logger } from "./_core/logger";
import { ENV } from "./_core/env";

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB
const LOCAL_CANVAS_WIDTH = 1200;
const LOCAL_CANVAS_HEIGHT = 900;
const GOOGLE_GENAI_ENDPOINT_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GOOGLE_GEMINI_IMAGE_PROVIDER = "google-gemini-image";
const GOOGLE_IMAGEN_PROVIDER = "google-imagen"; // alias legado aceito para não quebrar .env existente
const LOCAL_PROVIDER = "local";
const NANO_BANANA_PRO_MODEL = "gemini-3-pro-image-preview";
const GOOGLE_GEMINI_IMAGE_ASPECT_RATIO = "4:3";
const GOOGLE_GEMINI_IMAGE_SIZE = "1K";

/**
 * Domínios permitidos para URLs de imagens.
 * Previne SSRF (Server-Side Request Forgery) bloqueando
 * URLs internas como localhost, 127.0.0.1, IPs privados, etc.
 */
const ALLOWED_DOMAIN_PATTERNS = [
  /\.s3\.[a-z0-9-]+\.amazonaws\.com$/i,   // S3 buckets
  /\.s3\.amazonaws\.com$/i,                // S3 legacy
  /\.cloudfront\.net$/i,                    // CloudFront CDN
  /\.manus\.storage/i,                      // Manus storage
  /\.manus\.space$/i,                       // Manus hosted
  /\.manus\.im$/i,                          // Manus platform
  /^app\.mindi\.com\.br$/i,                 // domínio público da aplicação
  /^mindi\.com\.br$/i,                      // domínio público raiz, se usado
];

/**
 * Valida que a URL da imagem é segura (não é SSRF).
 * - Deve usar protocolo HTTPS
 * - Deve pertencer a um domínio permitido
 * - Não pode apontar para localhost, IPs privados ou serviços internos
 */
export function validateImageUrl(imageUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    throw new Error("URL da imagem inválida");
  }

  // Bloquear protocolos não-HTTPS
  if (parsed.protocol !== 'https:') {
    throw new Error("Apenas URLs HTTPS são permitidas para imagens");
  }

  const hostname = parsed.hostname.toLowerCase();

  // Bloquear localhost e IPs privados
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('172.') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error("URLs internas não são permitidas");
  }

  // Verificar se o domínio está na whitelist
  const isAllowed = ALLOWED_DOMAIN_PATTERNS.some(pattern => pattern.test(hostname));
  if (!isAllowed) {
    throw new Error(`Domínio não permitido para imagens: ${hostname}. Apenas imagens do storage do sistema são aceitas.`);
  }
}

/**
 * Prompt usado pelo Gemini para transformar a imagem original em uma descrição textual.
 * A etapa ajuda a preservar o produto original antes da geração final com Nano Banana Pro,
 * que recebe o prompt e a imagem original como referência visual.
 */
const FOOD_DESCRIPTION_PROMPT = `Describe this restaurant product photo for a food photography image generation model.

Focus only on visible facts. Be precise and concise:
- identify the exact dish or product type when visible;
- list visible ingredients, colors, sauces, toppings and plating/container;
- describe the camera angle, crop and portion size;
- mention the current background only if it matters;
- do not invent ingredients, brand names, text, people, utensils or decorations that are not visible.

Return one compact English paragraph, maximum 120 words.`;

function buildImagenPrompt(foodDescription: string): string {
  return `Create a realistic professional restaurant menu photograph based on the attached reference image and this exact food description: ${foodDescription}

Requirements:
- Preserve the same dish type, visible ingredients, colors, portion size, container/plating and camera angle described above.
- Do not add, remove or change food items.
- Improve lighting, sharpness, color balance and appetizing presentation.
- Use a clean professional food photography setup with subtle depth of field, natural shadows and premium restaurant styling.
- No people, no hands, no logos, no text, no watermark, no extra dishes.
- Output one high-quality realistic food photograph suitable for an online menu.`;
}

export interface EnhanceImageResult {
  enhancedUrl: string;
  originalUrl: string;
}

/**
 * Melhora uma foto de produto usando Google Imagen ou fallback local.
 * @param imageUrl URL da imagem original no storage
 * @param establishmentId ID do estabelecimento (para organizar no storage)
 * @returns URLs da imagem original e melhorada
 */
export async function enhanceProductImage(
  imageUrl: string,
  establishmentId: number
): Promise<EnhanceImageResult> {
  // Validar que a URL existe
  if (!imageUrl) {
    throw new Error("URL da imagem é obrigatória");
  }

  // Validar URL contra SSRF (whitelist de domínios)
  validateImageUrl(imageUrl);

  // Verificar tamanho da imagem (fetch HEAD para verificar Content-Length)
  try {
    const headResponse = await fetch(imageUrl, { method: "HEAD" });
    const contentLength = headResponse.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE_BYTES) {
      throw new Error("A imagem excede o limite de 4MB. Por favor, use uma imagem menor.");
    }
  } catch (error: any) {
    if (error.message?.includes("4MB")) throw error;
    // Se não conseguir verificar o tamanho, continuar mesmo assim
    logger.warn("[ImageEnhancer] Não foi possível verificar tamanho da imagem:", error.message);
  }

  // Detectar o mime type pela extensão
  const mimeType = getMimeType(imageUrl);

  try {
    const googleGeminiImageUrl = await enhanceImageWithGoogleImagen(imageUrl, establishmentId, mimeType);
    if (googleGeminiImageUrl) {
      return {
        enhancedUrl: googleGeminiImageUrl,
        originalUrl: imageUrl,
      };
    }
  } catch (error: any) {
    logger.warn("[ImageEnhancer] Google Gemini Image/Nano Banana Pro falhou; usando fallback local:", sanitizeProviderError(error));
  }

  const fallbackUrl = await enhanceImageLocally(imageUrl, establishmentId);
  return {
    enhancedUrl: fallbackUrl,
    originalUrl: imageUrl,
  };
}

async function enhanceImageWithGoogleImagen(
  imageUrl: string,
  establishmentId: number,
  mimeType: string
): Promise<string | null> {
  const provider = (ENV.mindiImageProvider || GOOGLE_GEMINI_IMAGE_PROVIDER).trim().toLowerCase();

  if (provider === LOCAL_PROVIDER) {
    logger.info("[ImageEnhancer] Provedor local selecionado; usando melhoria local Sharp.");
    return null;
  }

  if (provider !== GOOGLE_GEMINI_IMAGE_PROVIDER && provider !== GOOGLE_IMAGEN_PROVIDER) {
    logger.warn(`[ImageEnhancer] Provedor de imagem não suportado (${provider}); usando fallback local.`);
    return null;
  }

  if (!ENV.googleImagenApiKey) {
    logger.info("[ImageEnhancer] GEMINI_API_KEY/GOOGLE_API_KEY não configurada; usando fallback local de melhoria de imagem.");
    return null;
  }

  const originalBuffer = await downloadImageBuffer(imageUrl);
  const foodDescription = await describeFoodImageWithGemini(originalBuffer, mimeType);
  const prompt = buildImagenPrompt(foodDescription);
  const generated = await generateImageWithGeminiImage(prompt, originalBuffer, mimeType);

  const extension = extensionFromMimeType(generated.mimeType);
  const fileName = `est/${establishmentId}/mindi-vision/google_gemini_image_${nanoid(12)}.${extension}`;
  const { url } = await mindiStoragePut(fileName, generated.buffer, generated.mimeType);

  return url;
}

async function describeFoodImageWithGemini(originalBuffer: Buffer, mimeType: string): Promise<string> {
  const model = encodeURIComponent(ENV.googleImagenVisionModel || "gemini-2.5-flash");
  const response = await fetch(`${GOOGLE_GENAI_ENDPOINT_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": ENV.googleImagenApiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: FOOD_DESCRIPTION_PROMPT },
            {
              inlineData: {
                mimeType,
                data: originalBuffer.toString("base64"),
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 220,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini vision request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`);
  }

  const result = (await response.json()) as any;
  const text = result?.candidates?.[0]?.content?.parts
    ?.map((part: any) => part?.text)
    ?.filter(Boolean)
    ?.join(" ")
    ?.trim();

  if (!text) {
    throw new Error("Gemini não retornou descrição utilizável da imagem original");
  }

  return text.slice(0, 900);
}

async function generateImageWithGeminiImage(
  prompt: string,
  originalBuffer: Buffer,
  originalMimeType: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const model = encodeURIComponent(ENV.googleImagenModel || NANO_BANANA_PRO_MODEL);
  const response = await fetch(`${GOOGLE_GENAI_ENDPOINT_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": ENV.googleImagenApiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: originalMimeType,
                data: originalBuffer.toString("base64"),
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: GOOGLE_GEMINI_IMAGE_ASPECT_RATIO,
          imageSize: GOOGLE_GEMINI_IMAGE_SIZE,
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini image request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`);
  }

  const result = (await response.json()) as any;
  const parts = result?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part: any) => {
    const inlineData = part?.inlineData ?? part?.inline_data;
    const mimeType = inlineData?.mimeType ?? inlineData?.mime_type ?? "";
    return Boolean(inlineData?.data) && String(mimeType).startsWith("image/");
  });
  const inlineData = imagePart?.inlineData ?? imagePart?.inline_data;
  const base64Data = inlineData?.data;

  if (!base64Data) {
    throw new Error("Gemini Image/Nano Banana Pro não retornou imagem em base64");
  }

  const mimeType = inlineData?.mimeType ?? inlineData?.mime_type ?? "image/jpeg";

  return {
    buffer: Buffer.from(base64Data, "base64"),
    mimeType,
  };
}

/**
 * Melhoramento local com Sharp.
 * Mantém o produto original, aplica correções fotográficas e cria um fundo desfocado
 * derivado da própria imagem para aparência de estúdio/profundidade de campo.
 */
async function enhanceImageLocally(imageUrl: string, establishmentId: number): Promise<string> {
  const originalBuffer = await downloadImageBuffer(imageUrl);

  const background = await sharp(originalBuffer, { failOn: "none" })
    .rotate()
    .resize(LOCAL_CANVAS_WIDTH, LOCAL_CANVAS_HEIGHT, { fit: "cover", position: "centre" })
    .blur(28)
    .modulate({ brightness: 0.82, saturation: 1.18 })
    .linear(0.95, 8)
    .webp({ quality: 90 })
    .toBuffer();

  const foreground = await sharp(originalBuffer, { failOn: "none" })
    .rotate()
    .resize(Math.round(LOCAL_CANVAS_WIDTH * 0.9), Math.round(LOCAL_CANVAS_HEIGHT * 0.86), {
      fit: "inside",
      withoutEnlargement: true,
    })
    .modulate({ brightness: 1.06, saturation: 1.14 })
    .gamma(1.05)
    .sharpen({ sigma: 1.1, m1: 0.65, m2: 1.8 })
    .webp({ quality: 94 })
    .toBuffer();

  const metadata = await sharp(foreground).metadata();
  const left = Math.max(0, Math.round((LOCAL_CANVAS_WIDTH - (metadata.width ?? LOCAL_CANVAS_WIDTH)) / 2));
  const top = Math.max(0, Math.round((LOCAL_CANVAS_HEIGHT - (metadata.height ?? LOCAL_CANVAS_HEIGHT)) / 2));

  const outputBuffer = await sharp(background)
    .composite([
      {
        input: Buffer.from(`<svg width="${LOCAL_CANVAS_WIDTH}" height="${LOCAL_CANVAS_HEIGHT}">
          <rect x="0" y="0" width="${LOCAL_CANVAS_WIDTH}" height="${LOCAL_CANVAS_HEIGHT}" fill="rgba(255,255,255,0.10)"/>
          <ellipse cx="600" cy="760" rx="390" ry="70" fill="rgba(0,0,0,0.20)"/>
        </svg>`),
        top: 0,
        left: 0,
      },
      {
        input: foreground,
        left,
        top,
      },
    ])
    .webp({ quality: 92 })
    .toBuffer();

  const fileName = `est/${establishmentId}/mindi-vision/local_${nanoid(12)}.webp`;
  const { url } = await mindiStoragePut(fileName, outputBuffer, "image/webp");
  return url;
}

async function downloadImageBuffer(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Falha ao baixar imagem original para melhoria de imagem");
  }

  const originalBuffer = Buffer.from(await response.arrayBuffer());
  if (originalBuffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("A imagem excede o limite de 4MB. Por favor, use uma imagem menor.");
  }

  return originalBuffer;
}

function sanitizeProviderError(error: any): string {
  const message = String(error?.message || error || "Erro desconhecido");
  return message
    .replace(/Bearer\s+[A-Za-z0-9._~+\-/]+=*/gi, "Bearer [redacted]")
    .replace(/AIza[0-9A-Za-z_\-]{20,}/g, "[redacted-google-api-key]")
    .replace(/key=([A-Za-z0-9_\-]+)/gi, "key=[redacted]")
    .replace(/token[^\n\r]{0,120}/gi, "token [redacted]")
    .slice(0, 500);
}

/**
 * Detecta o MIME type baseado na extensão da URL
 */
function getMimeType(url: string): string {
  const cleanUrl = url.split("?")[0].toLowerCase();
  if (cleanUrl.endsWith(".png")) return "image/png";
  if (cleanUrl.endsWith(".webp")) return "image/webp";
  if (cleanUrl.endsWith(".gif")) return "image/gif";
  return "image/jpeg"; // Default para jpg/jpeg
}

function extensionFromMimeType(mimeType: string): string {
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("png")) return "png";
  return "png";
}
