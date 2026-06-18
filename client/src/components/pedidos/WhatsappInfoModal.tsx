import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface WhatsappInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentName: string;
  onDismiss: () => void;
  onConnect: () => void;
}

export function WhatsappInfoModal({
  open,
  onOpenChange,
  establishmentName,
  onDismiss,
  onConnect,
}: WhatsappInfoModalProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [msgFading, setMsgFading] = useState(false);

  const whatsappMessages = useMemo(() => [
    {
      text: <>Olá <strong>João Silva!</strong> Boa tarde, Tudo bem?</>,
      text2: <>Seu pedido <strong>#1234</strong> foi recebido com sucesso!</>,
      items: ['• 1x Pizza Margherita', '• 1x Refrigerante'],
      time: '12:20',
    },
    {
      text: <>Olá <strong>João Silva!</strong></>,
      text2: <>Seu pedido <strong>#1234</strong> está sendo preparado! 👨‍🍳</>,
      items: ['Tempo estimado: 25 min'],
      time: '12:25',
    },
    {
      text: <>Olá <strong>João Silva!</strong></>,
      text2: <>Seu pedido <strong>#1234</strong> saiu para entrega! 🚨</>,
      items: ['Entregador: Carlos', 'Previsão: 15 min'],
      time: '12:45',
    },
    {
      text: <>Olá <strong>João Silva!</strong></>,
      text2: <>Seu pedido <strong>#1234</strong> foi entregue! ✅</>,
      items: ['Obrigado pela preferência!'],
      time: '13:00',
    },
  ], []);

  useEffect(() => {
    if (!open) return;
    setMsgIndex(0);
    setMsgFading(false);
    const interval = setInterval(() => {
      setMsgFading(true);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % whatsappMessages.length);
        setMsgFading(false);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, [open, whatsappMessages.length]);

  return (
    <Dialog open={open} onOpenChange={(openVal) => {
      if (!openVal) {
        onDismiss();
      }
      onOpenChange(openVal);
    }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-t-4 border-t-emerald-500" style={{borderRadius: '16px'}}>
        <div className="px-6 pt-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl flex-shrink-0">
              <MessageCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">Notificações de pedidos via WhatsApp</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Conecte o WhatsApp para notificar seus clientes sobre o status de cada pedido.
              </p>
            </div>
          </div>
        </div>
        {/* Card visual de conversa WhatsApp com carrossel */}
        <div className="px-6 py-2">
          <div className="rounded-xl overflow-hidden border border-border shadow-sm">
            {/* Header do WhatsApp */}
            <div className="bg-emerald-700 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-muted-foreground/50 flex items-center justify-center text-white font-bold text-sm">
                {establishmentName?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{establishmentName || 'Seu Estabelecimento'}</p>
                <p className="text-emerald-200 text-xs">online</p>
              </div>
            </div>
            {/* Corpo da conversa - carrossel animado */}
            <div className="bg-[#e5ddd5] px-4 py-5 min-h-[160px] flex items-start">
              <div
                className="bg-card rounded-lg px-3 py-2.5 max-w-[85%] shadow-sm relative"
                style={{
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                  opacity: msgFading ? 0 : 1,
                  transform: msgFading ? 'translateY(8px)' : 'translateY(0)',
                }}
              >
                <div className="absolute -left-1.5 top-0 w-3 h-3 bg-card" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                <p className="text-[13px] text-foreground leading-relaxed">
                  {whatsappMessages[msgIndex].text}
                </p>
                <p className="text-[13px] text-foreground leading-relaxed mt-2">
                  {whatsappMessages[msgIndex].text2}
                </p>
                <div className="mt-2 text-[13px] text-foreground">
                  {whatsappMessages[msgIndex].items.map((item, i) => (
                    <p key={i}>{item}</p>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground text-right mt-1">{whatsappMessages[msgIndex].time}</p>
              </div>
            </div>
            {/* Indicadores de posição */}
            <div className="bg-[#e5ddd5] px-4 pb-3 flex justify-center gap-1.5">
              {whatsappMessages.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${i === msgIndex ? 'bg-emerald-600 w-4' : 'bg-muted-foreground/50'}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex flex-col gap-2.5 pt-2">
          <Button
            variant="outline"
            className="w-full rounded-xl h-10 font-medium border-border text-muted-foreground hover:bg-muted/50"
            onClick={() => {
              onDismiss();
              onOpenChange(false);
            }}
          >
            Agora não
          </Button>
          <Button
            className="w-full rounded-xl h-10 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            onClick={() => {
              onDismiss();
              onOpenChange(false);
              onConnect();
            }}
          >
            <MessageCircle className="h-4 w-4" />
            Conectar WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
