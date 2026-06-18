import { useState, useCallback, useMemo, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { getThumbUrl } from "../../../shared/imageUtils";

interface BlurImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "onLoad" | "onError" | "srcSet"> {
  /** URL da imagem principal (1200px) */
  src: string;
  /** Placeholder blur em base64 data URI (data:image/webp;base64,...) */
  blurDataUrl?: string | null;
  /** Alt text para acessibilidade */
  alt: string;
  /** Classes CSS adicionais para o container */
  containerClassName?: string;
  /** Fallback quando não há imagem */
  fallback?: React.ReactNode;
  /**
   * Ativar srcset responsivo: serve thumb (400px) em mobile e main (1200px) em desktop.
   * Desativado por padrão para imagens que não precisam de responsividade (logos, ícones).
   */
  responsive?: boolean;
  /** Prioridade de carregamento (S15: usar "high" para imagens above-the-fold como cover) */
  fetchPriority?: "high" | "low" | "auto";
}

/**
 * Componente de imagem com lazy loading, placeholder blur e srcset responsivo.
 * 
 * Funcionalidades:
 * - Placeholder blur (~20px base64 inline) enquanto a imagem carrega
 * - Transição suave de opacidade ao carregar
 * - srcset automático: thumb (400w) para mobile, main (1200w) para desktop
 * - Fallback automático para imagem principal se thumbnail falhar (403/404)
 * - Fallback com pulse animation quando não há blur
 */
export function BlurImage({
  src,
  blurDataUrl,
  alt,
  className,
  containerClassName,
  fallback,
  responsive = false,
  sizes,
  loading,
  fetchPriority,
  ...imgProps
}: BlurImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    // Se estamos usando srcset responsivo e o thumb pode ter falhado,
    // tentar novamente sem srcset (apenas imagem principal)
    if (responsive && !thumbFailed) {
      setThumbFailed(true);
      return;
    }
    setHasError(true);
  }, [responsive, thumbFailed]);

  // Gerar srcset e sizes para imagens responsivas
  const srcSetProps = useMemo(() => {
    // Se o thumb falhou, não usar srcset - apenas a imagem principal
    if (thumbFailed) return {};
    if (!responsive || !src) return {};

    const thumbUrl = getThumbUrl(src);
    // Só gerar srcset se o thumb for diferente do main (imagem otimizada .webp)
    if (thumbUrl === src) return {};

    return {
      srcSet: `${thumbUrl} 400w, ${src} 1200w`,
      sizes: sizes || "(max-width: 640px) 400px, 1200px",
    };
  }, [responsive, src, sizes, thumbFailed]);

  if (!src || hasError) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className={cn("bg-muted", containerClassName)} />
    );
  }

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Blur placeholder — sempre visível até a imagem carregar */}
      {blurDataUrl && !isLoaded && (
        <img
          src={blurDataUrl}
          alt=""
          aria-hidden="true"
          className={cn(
            "absolute inset-0 w-full h-full object-cover scale-110",
            className
          )}
          style={{ filter: "blur(8px)" }}
        />
      )}

      {/* Placeholder genérico quando não há blur */}
      {!blurDataUrl && !isLoaded && (
        <div className="absolute inset-0 bg-muted" />
      )}

      {/* Imagem principal com loading configurável e srcset responsivo */}
      <img
        key={thumbFailed ? "fallback" : "srcset"}
        src={src}
        alt={alt}
        loading={loading ?? "lazy"}
        decoding="async"
        fetchPriority={fetchPriority}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...srcSetProps}
        {...imgProps}
      />
    </div>
  );
}

export default BlurImage;
