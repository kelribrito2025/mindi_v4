import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Bike, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Driver {
  id: number;
  name: string;
  whatsapp: string;
}

interface DriverAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number | null;
  drivers: Driver[];
  assigningDriverId: number | null;
  context: 'accept' | 'ready';
  onAssign: (driverId: number) => void;
}

export function DriverAssignModal({
  open,
  onOpenChange,
  orderId,
  drivers,
  assigningDriverId,
  context,
  onAssign,
}: DriverAssignModalProps) {
  return (
    <Dialog open={open} onOpenChange={(openVal) => {
      if (!openVal) {
        onOpenChange(false);
      }
    }}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden border-t-4 border-t-orange-500"
        style={{ borderRadius: '16px' }}
      >
        <DialogTitle className="sr-only">Selecionar Entregador</DialogTitle>
        <div className="px-6 pt-5 pb-6">
          {/* Header com ícone */}
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl flex-shrink-0 bg-orange-100 dark:bg-orange-950/50">
              <Bike className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Selecionar Entregador</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Escolha o entregador para este pedido. A notificação será enviada automaticamente via WhatsApp.
              </p>
            </div>
          </div>
          {/* Lista de entregadores */}
          <div className="space-y-2 mb-5 max-h-[300px] overflow-y-auto">
            {drivers.map((driver) => (
              <button
                key={driver.id}
                disabled={assigningDriverId !== null}
                onClick={() => {
                  if (!orderId) return;
                  onAssign(driver.id);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left",
                  assigningDriverId === driver.id
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                    : "border-border hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/20",
                  assigningDriverId !== null && assigningDriverId !== driver.id && "opacity-50"
                )}
              >
                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center flex-shrink-0">
                  <Bike className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{driver.name}</p>
                  <p className="text-xs text-muted-foreground">{driver.whatsapp}</p>
                </div>
                {assigningDriverId === driver.id && (
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
