import { Minus, Plus, Check } from "lucide-react";
import { useRef, useEffect, useState } from "react";

// Types
export interface ComplementItem {
  id: number;
  name: string;
  price: string;
  priceMode?: string;
  priceDineIn?: string | null;
  priceDelivery?: string | null;
  imageUrl?: string | null;
  description?: string;
  badgeText?: string;
}

export interface ComplementGroup {
  id: number;
  name: string;
  minQuantity: number;
  maxQuantity: number;
  isRequired?: boolean;
  groupType?: "complement" | "included";
  items: ComplementItem[];
}

export interface SubstitutionOption {
  id: number;
  name: string;
  additionalPrice: number;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface SubstitutionData {
  complementItemId: number;
  substitutions: SubstitutionOption[];
}

interface ComplementGroupsProps {
  groups: ComplementGroup[];
  selectedComplements: Map<number, Map<number, number>>;
  onSelectedComplementsChange: (updater: (prev: Map<number, Map<number, number>>) => Map<number, Map<number, number>>) => void;
  getPrice: (item: ComplementItem) => number;
  formatPrice: (value: number) => string;
  onComplementImageChange?: (url: string | null) => void;
  selectedComplementImage?: string | null;
  /** Prefix for element IDs (for scroll targeting). Default: "complement" */
  idPrefix?: string;
  /** Whether to hide groups after the first incomplete required group. Default: false */
  hideBlockedGroups?: boolean;
  /** Controls sticky behavior for group headers. Default: "always" */
  stickyHeaderMode?: "always" | "desktop-only" | "none";
  /** Substitution options for included items */
  substitutions?: SubstitutionData[];
  /** Currently selected substitutions: Map<complementItemId, substitutionId> */
  selectedSubstitutions?: Map<number, number>;
  /** Callback when substitution selection changes */
  onSelectedSubstitutionsChange?: (subs: Map<number, number>) => void;
}

/** Animated checkbox/radio indicator */
function SelectionIndicator({ isSelected, isRadio }: { isSelected: boolean; isRadio: boolean }) {
  return (
    <div
      className={`w-5 h-5 ${isRadio ? "rounded-full" : "rounded-md"} border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200 ease-out ${
        isSelected
          ? "border-red-500 bg-red-500 scale-110"
          : "border-gray-300 bg-white scale-100"
      }`}
    >
      <svg
        className={`w-3 h-3 text-white transition-colors duration-200 ease-out ${
          isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"
        }`}
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M2.5 6L5 8.5L9.5 3.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Animated quantity controls with slide-in effect */
function QuantityControls({
  quantity,
  onIncrement,
  onDecrement,
}: {
  quantity: number;
  onIncrement: (e: React.MouseEvent) => void;
  onDecrement: (e: React.MouseEvent) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div
      data-qty-controls
      className={`flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-1 transition-colors duration-250 ease-out ${
        isVisible
          ? "opacity-100 translate-x-0 scale-100"
          : "opacity-0 translate-x-2 scale-95"
      }`}
    >
      <button
        type="button"
        onClick={onDecrement}
        className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded transition-transform duration-150 active:scale-90"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span
        className="w-6 text-center text-sm font-medium text-gray-900 transition-colors duration-150"
        key={quantity}
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded transition-transform duration-150 active:scale-90"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Animated "Completo" badge */
function CompleteBadge() {
  return (
    <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-lg font-medium animate-in fade-in slide-in-from-right-2 duration-300">
      Completo
    </span>
  );
}

/** Animated checkmark icon for group completion */
function CompleteCheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-red-500 animate-in fade-in zoom-in duration-300"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Alternating badge for included items with swap options */
function SwapBadge({ 
  hasSubstitutions, 
  isSwapped, 
  swappedName, 
  swappedPrice,
  onSwapClick, 
  onUndoClick 
}: { 
  hasSubstitutions: boolean; 
  isSwapped: boolean; 
  swappedName?: string;
  swappedPrice?: number;
  onSwapClick: () => void; 
  onUndoClick: () => void;
}) {
  const [showSwapHint, setShowSwapHint] = useState(false);

  useEffect(() => {
    if (!hasSubstitutions || isSwapped) return;
    const interval = setInterval(() => {
      setShowSwapHint(prev => !prev);
    }, 3500);
    const timeout = setTimeout(() => setShowSwapHint(true), 2000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [hasSubstitutions, isSwapped]);

  if (isSwapped) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onUndoClick(); }}
        className="flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-100 border border-orange-200 rounded-lg px-2 py-0.5 hover:bg-orange-200 transition-all duration-200"
      >
        <span className="truncate max-w-[80px]">{swappedName}</span>
        {swappedPrice !== undefined && swappedPrice > 0 && (
          <span className="text-orange-500 text-[10px]">+{(swappedPrice / 100).toFixed(2).replace('.', ',')}</span>
        )}
        <svg className="w-3 h-3 ml-0.5 flex-shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3L3 9M3 3l6 6" strokeLinecap="round"/></svg>
      </button>
    );
  }

  if (!hasSubstitutions) {
    return (
      <span className="text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded-lg px-2 py-0.5">
        Incluso
      </span>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (showSwapHint) onSwapClick(); }}
      className="relative overflow-hidden rounded-lg transition-all duration-300"
      style={{ minWidth: showSwapHint ? '90px' : '60px', height: '22px' }}
    >
      <span
        className={`absolute inset-0 flex items-center justify-center text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded-lg px-2 py-0.5 transition-all duration-500 ${
          showSwapHint ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
        }`}
      >
        Incluso
      </span>
      <span
        className={`absolute inset-0 flex items-center justify-center gap-1 text-xs font-semibold text-white bg-gradient-to-r from-red-500 to-orange-500 border border-red-400 rounded-lg px-2 py-0.5 transition-all duration-500 cursor-pointer hover:from-red-600 hover:to-orange-600 shadow-sm ${
          showSwapHint ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3l5 5-5 5M21 8H7M8 21l-5-5 5-5M3 16h14"/></svg>
        Trocar?
      </span>
    </button>
  );
}

export function ComplementGroups({
  groups,
  selectedComplements,
  onSelectedComplementsChange,
  getPrice,
  formatPrice,
  onComplementImageChange,
  selectedComplementImage,
  idPrefix = "complement",
  hideBlockedGroups = false,
  stickyHeaderMode = "always",
  substitutions,
  selectedSubstitutions,
  onSelectedSubstitutionsChange,
}: ComplementGroupsProps) {
  const [swapModalItemId, setSwapModalItemId] = useState<number | null>(null);
  const swapModalItemSubs = swapModalItemId && substitutions
    ? substitutions.find(s => s.complementItemId === swapModalItemId)
    : null;

    const stickyHeaderClass =
    stickyHeaderMode === "always"
      ? "sticky"
      : stickyHeaderMode === "desktop-only"
        ? "md:sticky"
        : "";

  // Find first incomplete required group index
  let firstIncompleteRequiredIdx = -1;
  if (hideBlockedGroups) {
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      if (g.groupType === "included") continue;
      const sel = selectedComplements.get(g.id) || new Map<number, number>();
      const total = Array.from(sel.values()).reduce((a, b) => a + b, 0);
      if (g.minQuantity >= 1 && total < g.minQuantity) {
        firstIncompleteRequiredIdx = i;
        break;
      }
    }
  }

  return (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => {
        const isIncludedGroup = group.groupType === "included";
        const selectedInGroup = isIncludedGroup ? new Map<number, number>() : selectedComplements.get(group.id) || new Map<number, number>();
        const isRadio = group.maxQuantity === 1;
        const totalSelectedInGroup = Array.from(selectedInGroup.values()).reduce((a, b) => a + b, 0);
        const isGroupComplete = !isIncludedGroup && group.maxQuantity > 0 && totalSelectedInGroup >= group.maxQuantity;

        // Hide blocked groups
        if (hideBlockedGroups && firstIncompleteRequiredIdx !== -1 && groupIndex > firstIncompleteRequiredIdx) {
          return null;
        }

        return (
          <div
            key={group.id}
            id={`${idPrefix}-group-${group.id}`}
            className={`transition-colors duration-300 ease-out rounded-xl border ${
              isGroupComplete ? "border-red-200 shadow-sm shadow-red-100" : "border-gray-200"
            }`}
          >
            {/* Header do Grupo */}
            <div
              className={`px-4 py-3 border-b transition-colors duration-300 ease-out ${stickyHeaderClass} z-20 shadow-sm rounded-t-xl ${
                isGroupComplete
                  ? "bg-red-50 border-red-200"
                  : "bg-gray-50 border-gray-200"
              }`}
              style={{ paddingTop: "8px", top: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4
                    className={`font-semibold transition-colors duration-300 ${
                      isGroupComplete ? "text-red-500" : "text-gray-900"
                    }`}
                  >
                    {group.name}
                  </h4>
                  {isGroupComplete && <CompleteCheckIcon />}
                </div>
                <div className="flex items-center gap-2">
                  {isGroupComplete && <CompleteBadge />}
                  {isIncludedGroup && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-lg font-medium transition-opacity duration-200">
                      Incluso
                    </span>
                  )}
                  {!isIncludedGroup && !isGroupComplete &&
                    (group.isRequired || group.minQuantity >= 1) && (
                      <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-lg font-medium transition-opacity duration-200">
                        Obrigatório
                      </span>
                    )}
                  {!isIncludedGroup && !isGroupComplete &&
                    group.minQuantity === 0 &&
                    !group.isRequired && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg font-medium transition-opacity duration-200">
                        Opcional
                      </span>
                    )}
                </div>
              </div>
              <p
                className={`text-xs mt-0.5 transition-colors duration-300 ${
                  isGroupComplete ? "text-red-500" : "text-gray-500"
                }`}
              >
                {(() => {
                  if (isIncludedGroup) return "Itens já inclusos no combo";
                  const min = group.minQuantity;
                  const max = group.maxQuantity;
                  if (min === 1 && max === 1) return "Escolha 1 opção";
                  if (min === 1 && max > 1) return `Escolha até ${max} opções`;
                  if (min === max) return `Escolha ${min} opções`;
                  if (min > 1 && max > min)
                    return `Escolha de ${min} a ${max} opções`;
                  if (min === 0 && max === 1) return "Escolha até 1 opção";
                  if (min === 0 && max > 1)
                    return `Escolha até ${max} opções`;
                  return "";
                })()}
              </p>
            </div>

            {/* Itens do Grupo */}
            <div className="divide-y divide-gray-100">
              {group.items.map((item) => {
                const itemQuantity = selectedInGroup.get(item.id) || 0;
                const isSelected = itemQuantity > 0;
                const itemImageUrl = item.imageUrl;
                const displayPrice = isIncludedGroup ? 0 : getPrice(item);

                // Função para incrementar
                const handleIncrement = (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isIncludedGroup) return;
                  onSelectedComplementsChange((prev) => {
                    const newMap = new Map(prev);
                    const currentGroupMap = new Map(
                      prev.get(group.id) || []
                    );
                    const currentQty = currentGroupMap.get(item.id) || 0;
                    const totalInGroup = Array.from(
                      currentGroupMap.values()
                    ).reduce((a, b) => a + b, 0);
                    if (totalInGroup < group.maxQuantity) {
                      currentGroupMap.set(item.id, currentQty + 1);
                      newMap.set(group.id, currentGroupMap);
                      if (itemImageUrl) onComplementImageChange?.(itemImageUrl);
                      // Auto-scroll para próximo grupo se atingiu o máximo
                      const newTotal = totalInGroup + 1;
                      if (newTotal >= group.maxQuantity) {
                        const currentIndex = groups.findIndex(
                          (g) => g.id === group.id
                        );
                        if (currentIndex < groups.length - 1) {
                          const nextGroup = groups[currentIndex + 1];
                          setTimeout(() => {
                            document
                              .getElementById(
                                `${idPrefix}-group-${nextGroup.id}`
                              )
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                          }, 300);
                        } else {
                          setTimeout(() => {
                            document
                              .querySelector("[data-observation-field]")
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                          }, 300);
                        }
                      }
                    }
                    return newMap;
                  });
                };

                // Função para decrementar
                const handleDecrement = (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isIncludedGroup) return;
                  onSelectedComplementsChange((prev) => {
                    const newMap = new Map(prev);
                    const currentGroupMap = new Map(
                      prev.get(group.id) || []
                    );
                    const currentQty = currentGroupMap.get(item.id) || 0;
                    if (currentQty > 1) {
                      currentGroupMap.set(item.id, currentQty - 1);
                    } else {
                      currentGroupMap.delete(item.id);
                      if (
                        itemImageUrl &&
                        selectedComplementImage === itemImageUrl
                      ) {
                        onComplementImageChange?.(null);
                      }
                    }
                    newMap.set(group.id, currentGroupMap);
                    return newMap;
                  });
                };

                // Função para toggle (checkbox/radio)
                const handleToggle = () => {
                  if (isIncludedGroup) return;
                  onSelectedComplementsChange((prev) => {
                    const newMap = new Map(prev);
                    const currentGroupMap = new Map(
                      prev.get(group.id) || []
                    );

                    if (isRadio) {
                      const newGroupMap = new Map<number, number>();
                      newGroupMap.set(item.id, 1);
                      newMap.set(group.id, newGroupMap);
                      if (itemImageUrl) {
                        onComplementImageChange?.(itemImageUrl);
                      }
                      // Auto-scroll para próximo grupo
                      const currentIndex = groups.findIndex(
                        (g) => g.id === group.id
                      );
                      if (currentIndex < groups.length - 1) {
                        const nextGroup = groups[currentIndex + 1];
                        setTimeout(() => {
                          document
                            .getElementById(
                              `${idPrefix}-group-${nextGroup.id}`
                            )
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                        }, 300);
                      } else {
                        setTimeout(() => {
                          document
                            .querySelector("[data-observation-field]")
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                        }, 300);
                      }
                    } else {
                      if (isSelected) {
                        currentGroupMap.delete(item.id);
                        if (
                          itemImageUrl &&
                          selectedComplementImage === itemImageUrl
                        ) {
                          onComplementImageChange?.(null);
                        }
                      } else {
                        const totalInGroup = Array.from(
                          currentGroupMap.values()
                        ).reduce((a, b) => a + b, 0);
                        if (
                          group.maxQuantity === 0 ||
                          totalInGroup < group.maxQuantity
                        ) {
                          currentGroupMap.set(item.id, 1);
                          if (itemImageUrl) {
                            onComplementImageChange?.(itemImageUrl);
                          }
                          // Auto-scroll para próximo grupo se atingiu o máximo
                          const newTotal = totalInGroup + 1;
                          if (newTotal >= group.maxQuantity) {
                            const currentIndex = groups.findIndex(
                              (g) => g.id === group.id
                            );
                            if (currentIndex < groups.length - 1) {
                              const nextGroup = groups[currentIndex + 1];
                              setTimeout(() => {
                                document
                                  .getElementById(
                                    `${idPrefix}-group-${nextGroup.id}`
                                  )
                                  ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                  });
                              }, 300);
                            } else {
                              setTimeout(() => {
                                document
                                  .querySelector("[data-observation-field]")
                                  ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                  });
                              }, 300);
                            }
                          }
                        }
                      }
                      newMap.set(group.id, currentGroupMap);
                    }
                    return newMap;
                  });
                };

                return (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      if (
                        (e.target as HTMLElement).closest("[data-qty-controls]")
                      )
                        return;
                      if (!isIncludedGroup) handleToggle();
                    }}
                    className={`flex flex-col px-4 py-3 transition-colors duration-200 ease-out ${
                      isIncludedGroup
                        ? "bg-green-50/40 cursor-default"
                        : isSelected
                          ? "bg-red-50 cursor-pointer"
                          : "hover:bg-gray-50 cursor-pointer"
                    }`}
                  >
                    {/* Linha 1: Checkbox + Nome + Badge + (Botões +/- se sem descrição) + Preço */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isIncludedGroup ? (
                          <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 border border-green-200 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        ) : (
                          <SelectionIndicator isSelected={isSelected} isRadio={isRadio} />
                        )}
                        <span className={`text-sm transition-colors duration-200 flex-1 min-w-0 ${
                          isSelected ? "text-gray-900 font-medium" : "text-gray-900"
                        }`}>
                          {item.name}
                        </span>
                        {item.badgeText && (
                          <span
                            className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white leading-none flex-shrink-0"
                            style={{
                              width: "69px",
                              height: "19px",
                              borderRadius: "8px",
                            }}
                          >
                            {item.badgeText}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        {isIncludedGroup && (() => {
                          const itemSubs = substitutions?.find(s => s.complementItemId === item.id);
                          const hasSwapOptions = !!(itemSubs && itemSubs.substitutions.length > 0);
                          const selectedSubId = selectedSubstitutions?.get(item.id);
                          const selectedSub = selectedSubId ? itemSubs?.substitutions.find(s => s.id === selectedSubId) : null;
                          return (
                            <SwapBadge
                              hasSubstitutions={hasSwapOptions}
                              isSwapped={!!selectedSub}
                              swappedName={selectedSub?.name}
                              swappedPrice={selectedSub?.additionalPrice}
                              onSwapClick={() => setSwapModalItemId(item.id)}
                              onUndoClick={() => {
                                if (onSelectedSubstitutionsChange && selectedSubstitutions) {
                                  const newMap = new Map(selectedSubstitutions);
                                  newMap.delete(item.id);
                                  onSelectedSubstitutionsChange(newMap);
                                }
                              }}
                            />
                          );
                        })()}
                        {/* Botões +/- na linha 1 APENAS quando NÃO tem descrição - oculto no mobile */}
                        {isSelected && !isRadio && !item.description && (
                          <div className="hidden sm:block">
                            <QuantityControls
                              quantity={itemQuantity}
                              onIncrement={handleIncrement}
                              onDecrement={handleDecrement}
                            />
                          </div>
                        )}
                        {/* Preço */}
                        {(() => {
                          if (displayPrice > 0) {
                            const totalItemPrice =
                              displayPrice * (itemQuantity || 1);
                            return (
                              <span className={`text-sm min-w-[70px] text-right transition-colors duration-200 ${
                                isSelected ? "text-red-500 font-medium" : "text-gray-600"
                              }`}>
                                {isSelected && itemQuantity > 1
                                  ? `+ ${formatPrice(totalItemPrice)}`
                                  : `+ ${formatPrice(displayPrice)}`}
                              </span>
                            );
                          } else if (
                            !isIncludedGroup &&
                            displayPrice === 0 &&
                            item.priceMode === "free"
                          ) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-lg border border-green-200 transition-colors duration-200">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Grátis
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    {/* Linha 2: Descrição + Botões +/- à direita (SÓ quando tem descrição) */}
                    {item.description && (
                      <div className="flex items-end justify-between ml-8 mt-1">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-gray-500 leading-tight">
                            {item.description}
                          </span>
                        </div>
                        {isSelected && !isRadio && (
                          <QuantityControls
                            quantity={itemQuantity}
                            onIncrement={handleIncrement}
                            onDecrement={handleDecrement}
                          />
                        )}
                      </div>
                    )}

                    {/* Linha mobile: Botões +/- à direita abaixo do preço quando NÃO tem descrição (só mobile) */}
                    {isSelected && !isRadio && !item.description && (
                      <div className="flex sm:hidden items-center justify-end mt-1">
                        <QuantityControls
                          quantity={itemQuantity}
                          onIncrement={handleIncrement}
                          onDecrement={handleDecrement}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {/* Modal de Opções de Troca */}
      {swapModalItemId && swapModalItemSubs && (
        <div
          className="fixed inset-0 z-[9999] flex items-end md:items-center md:justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={() => setSwapModalItemId(null)}
          />
          {/* Modal Content - Bottom Sheet no mobile */}
          <div
            className="relative bg-white w-full md:max-w-md rounded-t-[30px] overflow-hidden md:rounded-[30px] shadow-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - estilo vermelho padrão */}
            <div
              className="flex-shrink-0 bg-gradient-to-r from-red-500 to-red-500 px-5 overflow-hidden flex items-center"
              style={{ height: "67px", paddingTop: "12px", paddingBottom: "12px" }}
            >
              <div className="flex items-center justify-between h-full w-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3l5 5-5 5"/><path d="M21 8H7"/><path d="M8 21l-5-5 5-5"/><path d="M3 16h14"/></svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Trocar item por...</h2>
                  </div>
                </div>
                <button
                  onClick={() => setSwapModalItemId(null)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            </div>
            {/* Options list */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {swapModalItemSubs.substitutions.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => {
                    if (onSelectedSubstitutionsChange && selectedSubstitutions) {
                      const newMap = new Map(selectedSubstitutions);
                      newMap.set(swapModalItemId, sub.id);
                      onSelectedSubstitutionsChange(newMap);
                    }
                    setSwapModalItemId(null);
                  }}
                  className="w-full flex items-center gap-3 text-left bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-red-300 hover:bg-red-50 transition-colors"
                >
                  {sub.imageUrl && (
                    <img src={sub.imageUrl} alt={sub.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-800 block truncate">{sub.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-red-500 flex-shrink-0">
                    {sub.additionalPrice > 0 ? `+${formatPrice(sub.additionalPrice / 100)}` : "Grátis"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/**
 * Helper: check if all required complement groups are filled
 */
export function areRequiredGroupsFilled(
  groups: ComplementGroup[],
  selectedComplements: Map<number, Map<number, number>>
): boolean {
  return groups.every((group) => {
    if (group.groupType === "included") return true;
    if (group.minQuantity === 0 && !group.isRequired) return true;
    const groupSelections = selectedComplements.get(group.id);
    if (!groupSelections) return group.minQuantity === 0;
    const totalQty = Array.from(groupSelections.values()).reduce(
      (sum, q) => sum + q,
      0
    );
    return totalQty >= group.minQuantity;
  });
}

/**
 * Helper: calculate total price of selected complements
 */
export function calculateComplementsTotal(
  groups: ComplementGroup[],
  selectedComplements: Map<number, Map<number, number>>,
  getPrice: (item: ComplementItem) => number
): number {
  let total = 0;
  selectedComplements.forEach((groupMap, groupId) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group || group.groupType === "included") return;
    groupMap.forEach((qty, itemId) => {
      const item = group.items.find((i) => i.id === itemId);
      if (item) {
        total += getPrice(item) * qty;
      }
    });
  });
  return total;
}

/**
 * Helper: collect selected complements as flat array
 */
export function collectSelectedComplements(
  groups: ComplementGroup[],
  selectedComplements: Map<number, Map<number, number>>,
  getPrice: (item: ComplementItem) => number
): Array<{ id: number; name: string; price: string; quantity: number }> {
  const result: Array<{ id: number; name: string; price: string; quantity: number }> = [];
  selectedComplements.forEach((groupMap, groupId) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group || group.groupType === "included") return;
    groupMap.forEach((qty, itemId) => {
      const item = group.items.find((i) => i.id === itemId);
      if (item && qty > 0) {
        result.push({
          id: item.id,
          name: item.name,
          price: String(getPrice(item)),
          quantity: qty,
        });
      }
    });
  });
  return result;
}
