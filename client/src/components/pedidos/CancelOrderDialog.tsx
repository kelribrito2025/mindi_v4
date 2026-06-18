import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Ban, AlertTriangle } from "lucide-react";

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderToCancel: number | null;
  orderToCancelIsIfood: boolean;
  orderToCancelExternalId: string | null;
  cancellationReason: string;
  setCancellationReason: (reason: string) => void;
  ifoodCancellationCode: string;
  setIfoodCancellationCode: (code: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function CancelOrderDialog({
  open,
  onOpenChange,
  orderToCancel,
  orderToCancelIsIfood,
  orderToCancelExternalId,
  cancellationReason,
  setCancellationReason,
  ifoodCancellationCode,
  setIfoodCancellationCode,
  onConfirm,
  isPending,
}: CancelOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setCancellationReason("");
        setIfoodCancellationCode("");
      }
    }}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden border-t-4 border-t-red-500"
        style={{ borderRadius: '16px' }}
      >
        <DialogTitle className="sr-only">Cancelar pedido</DialogTitle>
        <div className="px-6 pt-5 pb-6">
          {/* Header com ícone */}
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
              <Ban className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Cancelar pedido</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {orderToCancelIsIfood
                  ? "Informe o motivo e o código de cancelamento iFood para cancelar este pedido."
                  : "Informe o motivo do cancelamento. O cliente será notificado."}
              </p>
            </div>
          </div>
          {/* Formulário */}
          <div className="space-y-3 mb-5">
            {orderToCancelIsIfood && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Código de cancelamento iFood</label>
                <input
                  type="text"
                  value={ifoodCancellationCode}
                  onChange={(e) => setIfoodCancellationCode(e.target.value)}
                  placeholder="Ex: 501, 502..."
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            )}
            {!orderToCancelIsIfood && (
              <>
                <div className="mb-2">
                  <select
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none cursor-pointer"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        setCancellationReason(e.target.value);
                      }
                    }}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: '36px',
                    }}
                  >
                    <option value="" disabled>Selecione um motivo rápido...</option>
                    <option value="Produto indisponível no momento">Produto indisponível no momento</option>
                    <option value="Estabelecimento fechado por imprevisto">Estabelecimento fechado por imprevisto</option>
                    <option value="Tempo de preparo muito alto no momento">Tempo de preparo muito alto no momento</option>
                    <option value="Cancelado a pedido do cliente">Cancelado a pedido do cliente</option>
                    <option value="Endereço fora da área de entrega">Endereço fora da área de entrega</option>
                    <option value="Pedido duplicado ou realizado por engano">Pedido duplicado ou realizado por engano</option>
                  </select>
                </div>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Ou escreva o motivo manualmente..."
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                  rows={3}
                />
              </>
            )}
          </div>
          <Button
            className="w-full rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white"
            onClick={onConfirm}
            disabled={isPending || !cancellationReason.trim() || (orderToCancelIsIfood && !ifoodCancellationCode)}
          >
            {isPending ? "Cancelando..." : "Cancelar Pedido"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
