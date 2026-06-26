import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { UtensilsCrossed, Package, Pizza, Lock, X, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductType = "preparado" | "industrializado" | "pizza";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: ProductType) => void;
}

const productTypes = [
  {
    type: "preparado" as ProductType,
    icon: UtensilsCrossed,
    title: "Preparado",
    description: "Produtos produzidos pela sua loja, como marmitas, bolos, lanches e etc.",
    disabled: false,
  },
  {
    type: "industrializado" as ProductType,
    icon: Package,
    title: "Industrializado",
    description: "Produtos prontos que sua loja não produz, como chocolates, chicletes e refrigerantes.",
    disabled: true,
  },
  {
    type: "pizza" as ProductType,
    icon: Pizza,
    title: "Pizza",
    description: "Defina tamanho, tipos de massa, borda e sabores",
    disabled: false,
  },
];

export default function ProductTypeSelector({ open, onOpenChange, onSelect }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] !p-0 !gap-0 !h-dvh" hideCloseButton>
        <SheetTitle className="sr-only">Escolha um tipo de produto</SheetTitle>
        <SheetDescription className="sr-only">Selecione o tipo de produto que deseja criar</SheetDescription>
        <div className="flex flex-col h-full">
          {/* Header - same style as other sheets */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <LayoutGrid className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Novo Produto</h2>
                  <p className="text-sm text-white/80">Escolha um tipo de produto</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-card">
            {productTypes.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => {
                    if (!item.disabled) {
                      onSelect(item.type);
                    }
                  }}
                  disabled={item.disabled}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                    item.disabled
                      ? "opacity-50 cursor-not-allowed border-border bg-muted/30"
                      : "hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/10 cursor-pointer border-border"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    item.disabled ? "bg-muted" : "bg-red-100 dark:bg-red-950/30"
                  )}>
                    <Icon className={cn("h-5 w-5", item.disabled ? "text-muted-foreground" : "text-red-500")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.title}</span>
                      {item.disabled && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          Em breve
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                  </div>
                  {!item.disabled && (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                  )}
                  {item.disabled && (
                    <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
