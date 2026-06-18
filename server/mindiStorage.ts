// Storage helpers usando S3 próprio do usuário (Mindi)
// Substitui o storage do Manus Forge por bucket S3 configurado pelo usuário
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { ENV } from './_core/env';
import { logger } from './_core/logger';

// Configuração do cliente S3
function getS3Client(): S3Client {
  if (!ENV.mindiS3Bucket || !ENV.mindiS3AccessKey || !ENV.mindiS3SecretKey) {
    throw new Error(
      "S3 credentials missing: set MINDI_S3_BUCKET, MINDI_S3_ACCESS_KEY, and MINDI_S3_SECRET_KEY"
    );
  }

  return new S3Client({
    region: ENV.mindiS3Region || 'us-east-1',
    credentials: {
      accessKeyId: ENV.mindiS3AccessKey,
      secretAccessKey: ENV.mindiS3SecretKey,
    },
  });
}

// Normaliza a chave do arquivo (remove barras iniciais e previne path traversal)
function normalizeKey(relKey: string): string {
  const normalized = relKey.replace(/^\/+/, "");
  if (normalized.includes("..") || normalized.includes("\x00")) {
    throw new Error("Caminho de arquivo inv\u00e1lido");
  }

  return normalized;
}

function getLocalUploadRoot(): string {
  return process.env.LOCAL_UPLOAD_ROOT || path.resolve(process.cwd(), 'uploads');
}

function getLocalPublicUrl(key: string): string {
  let baseUrl = (
    process.env.PUBLIC_UPLOAD_BASE_URL ||
    process.env.PUBLIC_BASE_URL ||
    process.env.VITE_APP_URL ||
    ''
  );
  while (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  const urlPath = `/uploads/${key}`;
  return baseUrl ? `${baseUrl}${urlPath}` : urlPath;
}

async function localStoragePut(
  key: string,
  body: Buffer | Uint8Array | string,
  _contentType: string
): Promise<{ key: string; url: string }> {
  const uploadRoot = getLocalUploadRoot();
  const destination = path.resolve(uploadRoot, key);
  const normalizedRoot = path.resolve(uploadRoot);
  if (!destination.startsWith(normalizedRoot + path.sep)) {
    throw new Error('Caminho de upload local inválido');
  }
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, body);
  return { key, url: getLocalPublicUrl(key) };
}

// Gera URL pública do arquivo no S3
function getPublicUrl(key: string): string {
  const bucket = ENV.mindiS3Bucket;
  const region = ENV.mindiS3Region || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Upload de arquivo para o S3 próprio
 * @param relKey - Caminho relativo do arquivo (ex: "products/123/image.jpg")
 * @param data - Conteúdo do arquivo (Buffer, Uint8Array ou string)
 * @param contentType - Tipo MIME do arquivo (ex: "image/jpeg")
 * @returns Objeto com key e url pública do arquivo
 */
export async function mindiStoragePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  // Converter string para Buffer se necessário
  const body = typeof data === 'string' ? Buffer.from(data) : data;

  // Determinar Cache-Control baseado no tipo de conteúdo
  // Imagens: cache longo (1 ano) pois usamos nomes únicos com hash
  // Outros: cache moderado (1 dia)
  const isImage = contentType.startsWith("image/");
  const cacheControl = isImage
    ? "public, max-age=31536000, immutable"
    : "public, max-age=86400";

  try {
    const s3Client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: ENV.mindiS3Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    });
    await s3Client.send(command);
    const url = getPublicUrl(key);
    return { key, url };
  } catch (error) {
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    logger.error(`[Storage] Falha no upload S3; usando fallback local em /uploads. Motivo: ${reason}`);
    return localStoragePut(key, body, contentType);
  }
}

/**
 * Obtém a URL pública de um arquivo no S3
 * @param relKey - Caminho relativo do arquivo
 * @returns Objeto com key e url pública do arquivo
 */
export async function mindiStorageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return {
    key,
    url: getPublicUrl(key),
  };
}

/**
 * Remove um arquivo do S3
 * @param relKey - Caminho relativo do arquivo
 */
export async function mindiStorageDelete(relKey: string): Promise<void> {
  const s3Client = getS3Client();
  const key = normalizeKey(relKey);

  const command = new DeleteObjectCommand({
    Bucket: ENV.mindiS3Bucket,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Lista todos os objetos no bucket S3 (com paginação automática)
 * @param prefix - Prefixo opcional para filtrar objetos
 * @returns Array de objetos com key, size e lastModified
 */
export async function mindiStorageList(
  prefix?: string
): Promise<Array<{ key: string; size: number; lastModified: Date | undefined }>> {
  const s3Client = getS3Client();
  const results: Array<{ key: string; size: number; lastModified: Date | undefined }> = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: ENV.mindiS3Bucket,
      Prefix: prefix ? normalizeKey(prefix) : undefined,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    });

    const response = await s3Client.send(command);

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key) {
          results.push({
            key: obj.Key,
            size: obj.Size ?? 0,
            lastModified: obj.LastModified,
          });
        }
      }
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return results;
}

/**
 * Verifica se as credenciais do S3 estão configuradas
 */
export function isMindiStorageConfigured(): boolean {
  return !!(ENV.mindiS3Bucket && ENV.mindiS3AccessKey && ENV.mindiS3SecretKey);
}
