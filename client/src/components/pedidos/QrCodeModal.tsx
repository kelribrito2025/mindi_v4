import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface QrCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrcode: string | null | undefined;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function QrCodeModal({
  open,
  onOpenChange,
  qrcode,
  onRefresh,
  isRefreshing,
}: QrCodeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden border-t-4 border-t-amber-500"
        style={{ borderRadius: '16px' }}
      >
        <DialogTitle className="sr-only">Aguardando conexão WhatsApp</DialogTitle>
        <div className="px-6 pt-5 pb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl flex-shrink-0 bg-amber-100 dark:bg-amber-950/50">
              <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Aguardando conexão...</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Escaneie o QR Code com seu WhatsApp
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center py-4">
            {/* QR Code */}
            <div className="bg-muted/50 p-4 rounded-xl">
              {qrcode ? (
                <img loading="lazy"
                  src={qrcode}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            {/* Instruções */}
            <p className="mt-6 text-sm text-muted-foreground text-center max-w-xs">
              Abra o WhatsApp no seu celular, vá em <strong>Dispositivos conectados</strong> e escaneie o QR Code
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full rounded-xl h-10 font-semibold gap-2 mt-4"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            Atualizar QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
