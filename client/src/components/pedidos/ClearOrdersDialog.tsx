import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info } from "lucide-react";

type OrderStatus = "pending_confirmation" | "new" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";

interface ClearOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clearColumnTarget: OrderStatus | null;
  onConfirm: () => void;
}

export function ClearOrdersDialog({
  open,
  onOpenChange,
  clearColumnTarget,
  onConfirm,
}: ClearOrdersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden border-t-4 border-t-amber-500"
        style={{ borderRadius: '16px' }}
      >
        <DialogTitle className="sr-only">Limpar pedidos</DialogTitle>
        <div className="px-6 pt-5 pb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl flex-shrink-0 bg-amber-100 dark:bg-amber-950/50">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Limpar pedidos</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {clearColumnTarget === "completed"
                  ? "Tem certeza que deseja limpar todos os pedidos completos da tela?"
                  : "Tem certeza que deseja limpar todos os pedidos cancelados da tela?"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2.5 mb-5">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Os pedidos não serão apagados do sistema, apenas removidos da visualização atual.
            </p>
          </div>
          <Button
            className="w-full rounded-xl h-10 font-semibold bg-amber-500 hover:bg-amber-600 text-white"
            onClick={onConfirm}
          >
            Limpar Pedidos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
