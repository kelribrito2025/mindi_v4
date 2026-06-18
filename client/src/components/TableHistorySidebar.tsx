import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Clock,
  X,
  UtensilsCrossed,
  CreditCard,
  Banknote,
  QrCode,
  ChefHat,
  DoorOpen,
  DoorClosed,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  DollarSign,
  Printer,
} from "lucide-react";

interface TableHistorySidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: number | null;
  tableDisplayName: string;
}

const paymentMethodLabels: Record<string, { label: string; icon: typeof CreditCard }> = {
  cash: { label: "Dinheiro", icon: Banknote },
  card: { label: "Cartão", icon: CreditCard },
  pix: { label: "Pix", icon: QrCode },
  pix_online: { label: "Pix Online", icon: QrCode },
  dinheiro: { label: "Dinheiro", icon: Banknote },
  cartao_credito: { label: "Cartão", icon: CreditCard },
  cartao_debito: { label: "Cartão", icon: CreditCard },
};

const eventConfig: Record<string, { color: string; bgColor: string; dotColor: string; icon: typeof Clock }> = {
  table_opened: { color: "text-emerald-600", bgColor: "bg-emerald-50", dotColor: "bg-emerald-500", icon: DoorOpen },
  item_added: { color: "text-blue-600", bgColor: "bg-blue-50", dotColor: "bg-blue-500", icon: UtensilsCrossed },
  item_cancelled: { color: "text-amber-600", bgColor: "bg-amber-50", dotColor: "bg-amber-500", icon: XCircle },
  partial_payment: { color: "text-orange-600", bgColor: "bg-orange-50", dotColor: "bg-orange-500", icon: CreditCard },
  loose_payment: { color: "text-blue-600", bgColor: "bg-blue-50", dotColor: "bg-blue-500", icon: DollarSign },
  order_sent: { color: "text-purple-600", bgColor: "bg-purple-50", dotColor: "bg-purple-500", icon: ChefHat },
  table_closed: { color: "text-gray-600", bgColor: "bg-gray-50", dotColor: "bg-gray-400", icon: DoorClosed },
};

function formatTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date: Date | string) {
  const d = new Date(date);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return "Hoje";
  if (isYesterday) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function TimelineEvent({ event, isLast }: { event: any; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const config = eventConfig[event.type] || eventConfig.item_added;
  const hasItems = event.items && event.items.length > 0;
  const PaymentIcon = event.paymentMethod ? paymentMethodLabels[event.paymentMethod]?.icon : null;

  return (
    <div className="flex gap-3 relative">
      {/* Timeline vertical line */}
      {!isLast && (
        <div className="absolute left-[11px] top-[26px] bottom-0 w-[2px] bg-border" />
      )}

      {/* Dot */}
      <div className={`relative z-10 flex-shrink-0 w-[24px] h-[24px] rounded-full ${config.dotColor} flex items-center justify-center mt-0.5 ring-4 ring-card`}>
        <div className="w-2 h-2 rounded-full bg-white" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        <div
          className={`p-3 bg-muted/50 rounded-xl ${hasItems ? "cursor-pointer hover:bg-muted/80 transition-colors" : ""}`}
          onClick={() => hasItems && setExpanded(!expanded)}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{event.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{formatTime(event.timestamp)}</span>
                {event.paymentMethod && PaymentIcon && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <PaymentIcon className="h-3 w-3" />
                    {paymentMethodLabels[event.paymentMethod]?.label || event.paymentMethod}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {event.amount && (
                <span className={`text-sm font-bold ${
                  event.type === 'partial_payment' || event.type === 'item_cancelled' || event.type === 'loose_payment'
                    ? 'text-blue-600' 
                    : event.type === 'table_closed' 
                      ? 'text-red-500' 
                      : 'text-foreground'
                }`}>
                  {formatCurrency(parseFloat(event.amount))}
                </span>
              )}
              {hasItems && (
                expanded 
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> 
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Details */}
          {event.details && (
            <p className="text-xs text-muted-foreground mt-1">{event.details}</p>
          )}
          {/* Reprint receipt button for closed tables */}
          {event.type === 'table_closed' && event.tabId && (
            <div className="mt-2 pt-2 border-t border-border/50">
            <button
              className="w-full flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                const receiptUrl = `${window.location.origin}/api/print/tab-receipt/${event.tabId}`;
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = 'none';
                iframe.src = receiptUrl;
                document.body.appendChild(iframe);
                iframe.onload = () => {
                  setTimeout(() => {
                    iframe.contentWindow?.print();
                    setTimeout(() => {
                      document.body.removeChild(iframe);
                    }, 1000);
                  }, 500);
                };
              }}
            >
              <Printer className="h-3.5 w-3.5" />
              Reimprimir recibo
            </button>
            </div>
          )}

          {/* Expanded items */}
          {expanded && hasItems && (
            <div className="mt-2 pt-2 border-t border-border/50 space-y-1.5">
              {event.items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{item.quantity}x</span>{" "}
                    {item.name}
                  </span>
                  <span className="text-muted-foreground font-semibold">
                    {formatCurrency(parseFloat(item.price))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryContent({ tableId, open }: { tableId: number | null; open: boolean }) {
  const { data: history, isLoading } = trpc.tables.history.useQuery(
    { tableId: tableId! },
    { enabled: open && !!tableId }
  );

  // Group events by date
  const groupedEvents = (history || []).reduce<Record<string, typeof history>>((acc, event) => {
    const dateKey = formatDate(event.timestamp);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey]!.push(event);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-red-500" />
        <p className="text-sm text-muted-foreground">Carregando histórico...</p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <div className="p-3 bg-muted/50 rounded-full">
          <Clock className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Nenhuma atividade</p>
          <p className="text-xs text-muted-foreground mt-0.5">O histórico aparecerá aqui</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {Object.entries(groupedEvents).map(([dateLabel, events]) => (
        <div key={dateLabel}>
          {/* Date separator - same style as delivery sidebar section headers */}
          <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-500" />
            {dateLabel}
          </h3>
          <div>
            {events!.map((event, idx) => (
              <TimelineEvent
                key={`${event.type}-${idx}`}
                event={event}
                isLast={idx === events!.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableHistorySidebar({ open, onOpenChange, tableId, tableDisplayName }: TableHistorySidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[371px] sm:max-w-[371px] p-0 flex flex-col" hideCloseButton>
        <SheetTitle className="sr-only">Histórico da Mesa {tableDisplayName}</SheetTitle>
        <SheetDescription className="sr-only">Todas as atividades desta mesa</SheetDescription>
        
        {/* Header - identical to delivery sidebar */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Histórico da Mesa</h2>
                <p className="text-sm text-white/80">Mesa {tableDisplayName} • Todas as atividades</p>
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

        {/* Content - same bg-card and padding as delivery sidebar */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-card">
          <HistoryContent tableId={tableId} open={open} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Mobile version - full screen overlay matching the same visual identity
 */
export function TableHistoryMobile({ open, onClose, tableId, tableDisplayName }: {
  open: boolean;
  onClose: () => void;
  tableId: number | null;
  tableDisplayName: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-card flex flex-col">
      {/* Header - identical to delivery sidebar */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Histórico da Mesa</h2>
              <p className="text-sm text-white/80">Mesa {tableDisplayName} • Todas as atividades</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Content - same bg-card and padding as delivery sidebar */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-card">
        <HistoryContent tableId={tableId} open={open} />
      </div>
    </div>
  );
}
