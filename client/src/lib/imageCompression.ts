/**
 * Comprime uma imagem no browser antes do upload.
 * Redimensiona para maxWidth/maxHeight mantendo proporção e converte para JPEG com qualidade configurável.
 * Retorna o base64 (sem prefixo data:) e o mimeType resultante.
 */

interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** Tamanho máximo em bytes do resultado. Se exceder, reduz qualidade automaticamente. */
  maxSizeBytes?: number;
}

interface CompressImageResult {
  base64: string;
  mimeType: string;
}

export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<CompressImageResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
    maxSizeBytes = 3 * 1024 * 1024, // 3MB default (fica ~3MB base64 < 5MB limit)
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calcular dimensões mantendo proporção
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Não foi possível criar contexto canvas"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Tentar comprimir com qualidade decrescente até caber no limite
      let currentQuality = quality;
      const outputType = "image/jpeg"; // JPEG é mais leve que PNG para fotos

      const tryCompress = () => {
        const dataUrl = canvas.toDataURL(outputType, currentQuality);
        const base64 = dataUrl.split(",")[1];
        const sizeBytes = Math.ceil(base64.length * 3 / 4);

        if (sizeBytes > maxSizeBytes && currentQuality > 0.3) {
          // Reduzir qualidade e tentar novamente
          currentQuality -= 0.1;
          tryCompress();
        } else {
          resolve({ base64, mimeType: outputType });
        }
      };

      tryCompress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Erro ao carregar imagem para compressão"));
    };

    img.src = url;
  });
}

/**
 * Converte um File para base64 sem compressão (para arquivos pequenos ou não-imagem).
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}
