import React, { memo } from "react";
import { UtensilsCrossed } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BlurImage } from "@/components/BlurImage";

// Helper function (also used in main file)
export function getStartingComplementPrice(product: {
  price?: string | number | null;
  minComplementPrice?: string | number | null;
}): number | null {
  if (Number(product.price) > 0) return null;
  if (product.minComplementPrice && Number(product.minComplementPrice) > 0) {
    return Number(product.minComplementPrice);
  }
  return null;
}

export const ProductCard = memo(function ProductCard({
  product,
  formatPrice,
  cashbackPercent,
}: {
  product: {
    id: number;
    name: string;
    description: string | null;
    price: string;
    promotionalPrice?: string | null;
    minComplementPrice?: string | number | null;
    images: string[] | null;
    blurPlaceholder?: string | null;
    hasStock: boolean;
    outOfStock?: boolean;
    categoryId?: number | null;
  };
  formatPrice: (price: string | number) => string;
  cashbackPercent?: number;
}) {
  const mainImage = product.images?.[0];
  const isUnavailable = product.outOfStock === true;
  const startingComplementPrice = getStartingComplementPrice(product);

  return (
    <div
      className={`bg-white rounded-lg border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors cursor-pointer border-l-[3px] ${isUnavailable ? "border-l-gray-300 opacity-60" : "border-l-red-500"}`}
    >
      <div className="flex">
        <div className="flex-1 p-3">
          <h3
            className={`font-medium text-sm leading-tight ${isUnavailable ? "text-gray-400" : "text-gray-900"}`}
          >
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
              {product.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {Number(product.price) > 0 &&
            product.promotionalPrice &&
            Number(product.promotionalPrice) > 0 &&
            Number(product.promotionalPrice) < Number(product.price) &&
            !isUnavailable ? (
              <>
                <span className="font-bold text-sm text-red-500">
                  {formatPrice(product.promotionalPrice)}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="relative overflow-hidden text-[10px] font-bold text-white bg-emerald-500 rounded px-1 py-0.5 leading-none">
                  <span className="relative z-10">
                    -
                    {Math.round(
                      (1 -
                        Number(product.promotionalPrice) /
                          Number(product.price)) *
                        100
                    )}
                    %
                  </span>
                  <span className="absolute inset-0 animate-[banner-shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </span>
              </>
            ) : Number(product.price) > 0 ? (
              <span
                className={`font-semibold text-sm ${isUnavailable ? "text-gray-400" : "text-red-500"}`}
              >
                {formatPrice(product.price)}
              </span>
            ) : startingComplementPrice ? (
              <span
                className={`font-semibold text-sm ${isUnavailable ? "text-gray-400" : "text-red-500"}`}
              >
                A partir de {formatPrice(startingComplementPrice)}
              </span>
            ) : null}
            {cashbackPercent &&
              cashbackPercent > 0 &&
              (Number(product.price) > 0 || startingComplementPrice) &&
              !isUnavailable && (
                <span className="relative text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full overflow-hidden inline-flex items-center">
                  <span className="relative z-10">
                    +
                    {formatPrice(
                      (
                        ((Number(product.promotionalPrice || 0) > 0 ? Number(product.promotionalPrice) : Number(product.price) > 0 ? Number(product.price) : Number(startingComplementPrice || 0)) *
                          cashbackPercent) /
                        100
                      ).toFixed(2)
                    )}{" "}
                    cashback
                  </span>
                  <span className="absolute inset-0 animate-[banner-shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-emerald-200/50 to-transparent" />
                </span>
              )}
            {isUnavailable && (
              <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded">
                Indisponível
              </span>
            )}
          </div>
        </div>
        <div className="w-20 md:w-24 flex-shrink-0 relative">
          {mainImage ? (
            <BlurImage
              src={mainImage}
              blurDataUrl={product.blurPlaceholder}
              alt={product.name}
              containerClassName="absolute inset-0"
              className="w-full h-full object-cover rounded-r-lg"
              responsive
              sizes="(max-width: 640px) 80px, 96px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center rounded-r-lg">
              <UtensilsCrossed className="h-6 w-6 md:h-8 md:w-8 text-white animate-placeholder-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export function MenuSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 flex-1 max-w-xl rounded-lg" />
            <div className="hidden md:flex gap-6">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>
      </header>

      {/* Cover Skeleton */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <Skeleton className="h-48 md:h-64 lg:h-72 rounded-2xl" />
      </div>

      {/* Info Skeleton */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative -mt-16 md:-mt-20 flex flex-col md:flex-row md:items-end gap-4 pb-4">
          <Skeleton className="h-28 w-28 md:h-36 md:w-36 rounded-full ml-4 md:ml-6" />
          <div className="flex-1 bg-white rounded-xl p-4 md:p-5 shadow-sm md:ml-4">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      {/* Categories Skeleton */}
      <div className="bg-white border-y">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-8 w-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Products Skeleton */}
      <main className="max-w-7xl mx-auto px-4 py-4 relative z-[1]">
        <div className="flex gap-6">
          <div className="flex-1">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border p-4 flex gap-4"
                >
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="w-28 h-28 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block w-80">
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}

// Componentes do Sistema de Fidelidade

