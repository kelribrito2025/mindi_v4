import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bike, Send, Info, CheckCircle, Loader2 } from "lucide-react";

interface DriverInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number | null;
  onFinalize: (orderId: number) => void;
  loadingOrderId: number | null;
}

export function DriverInfoModal({
  open,
  onOpenChange,
  orderId,
  onFinalize,
  loadingOrderId,
}: DriverInfoModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="sm:max-w-[440px] p-0 overflow-hidden border-t-4"
        style={{ borderTopColor: '#059669', borderRadius: '16px' }}
      >
        <DialogTitle className="sr-only">Entregador responsável</DialogTitle>
        <div className="px-6 pt-5 pb-6">
          {/* Header com ícone */}
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl flex-shrink-0" style={{ backgroundColor: '#05966915' }}>
              <Bike className="h-6 w-6" style={{ color: '#059669' }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Entregador responsável</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                A finalização deste pedido é de responsabilidade do entregador.
              </p>
            </div>
          </div>
          {/* Info detalhada */}
          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5" style={{ backgroundColor: '#05966910', border: '1px solid #05966930' }}>
              <Send className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#059669' }} />
              <p className="text-xs leading-relaxed" style={{ color: '#047857' }}>
                O entregador receberá uma mensagem via WhatsApp com os botões <strong>"Sair para entrega"</strong> e <strong>"O pedido foi entregue"</strong>.
              </p>
            </div>
            <div className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2.5">
              <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                Ao clicar em <strong>"Sair para entrega"</strong>, o cliente será notificado automaticamente que o pedido está a caminho.
              </p>
            </div>
            <div className="flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                Ao clicar em <strong>"O pedido foi entregue"</strong>, o pedido será finalizado automaticamente no sistema.
              </p>
            </div>
          </div>
          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-10 font-semibold border-red-200 text-red-500 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={() => {
                if (orderId) {
                  onFinalize(orderId);
                }
              }}
              disabled={loadingOrderId !== null}
            >
              {loadingOrderId === orderId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><CheckCircle className="h-4 w-4 mr-1.5" /> Finalizar</>
              )}
            </Button>
            <Button
              className="flex-1 rounded-xl h-10 font-semibold text-white hover:opacity-90" style={{ backgroundColor: '#059669' }}
              onClick={() => { onOpenChange(false); }}
            >
              Entendi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
