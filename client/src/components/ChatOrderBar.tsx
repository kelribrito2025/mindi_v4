import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Package,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  CreditCard,
  ShoppingBag,
  Truck as TruckIcon,
  CheckCircle2,
  UtensilsCrossed,
  StickyNote,
  ChefHat,
} from "lucide-react";

// ==================== TYPES ====================
interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  complements: { name: string; price: number; quantity: number }[] | null;
  notes: string | null;
}

interface ActiveOrder {
  id: number;
  orderNumber: string;
  status: string;
  deliveryType: string;
  paymentMethod: string;
  customerName: string | null;
  customerAddress: string | null;
  subtotal: string;
  deliveryFee: string;
  discount: string;
  total: string;
  notes: string | null;
  createdAt: Date | string;
  items: OrderItem[];
}

// ==================== STATUS CONFIG ====================
// Matches the Pedidos page status flow: new → preparing → ready → out_for_delivery → completed
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; emoji: string; step: number }> = {
  pending_confirmation: { label: "Novo", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200", emoji: "🔔", step: 0 },
  new: { label: "Novo", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200", emoji: "🔔", step: 0 },
  scheduled: { label: "Agendado", color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200", emoji: "📅", step: 0 },
  preparing: { label: "Em Preparo", color: "text-red-500", bgColor: "bg-red-50", borderColor: "border-red-200", emoji: "🍳", step: 1 },
  ready: { label: "Pronto", color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", emoji: "✅", step: 2 },
  out_for_delivery: { label: "Em Rota", color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200", emoji: "🛵", step: 3 },
  completed: { label: "Finalizado", color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200", emoji: "✅", step: 4 },
};

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  delivery: "Entrega",
  pickup: "Retirada",
  dine_in: "Mesa",
};

const PAYMENT_LABELS: Record<string, { label: string; emoji: string }> = {
  cash: { label: "Dinheiro", emoji: "💵" },
  card: { label: "Cartão", emoji: "💳" },
  pix: { label: "PIX", emoji: "📱" },
  pix_online: { label: "Pix Online", emoji: "📱" },
  boleto: { label: "Boleto", emoji: "📄" },
  card_online: { label: "Cartão Online", emoji: "💳" },
};

// ==================== TIMELINE STEPS ====================
// Matches the Pedidos page flow: Novo → Em Preparo → Pronto → Em Rota → Finalizado
const TIMELINE_STEPS = [
  { key: "new", label: "Novo", icon: Clock },
  { key: "preparing", label: "Em Preparo", icon: ChefHat },
  { key: "ready", label: "Pronto", icon: Package },
  { key: "out_for_delivery", label: "Em Rota", icon: TruckIcon },
  { key: "completed", label: "Finalizado", icon: CheckCircle2 },
];

// ==================== HELPERS ====================
function timeAgo(ts: Date | string): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `R$ ${num.toFixed(2).replace(".", ",")}`;
}

// ==================== COMPONENT ====================
interface ChatOrderBarProps {
  orders: ActiveOrder[];
  isLoading?: boolean;
}

export function ChatOrderBar({ orders, isLoading }: ChatOrderBarProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Memoize to avoid re-renders
  const activeOrders = useMemo(() => orders || [], [orders]);

  if (isLoading) {
    return (
      <div className="border-b border-gray-200 dark:border-gray-700/50 bg-gradient-to-r from-gray-50 to-white dark:from-[#1a1a2e] dark:to-[#1e1e38] px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded ml-auto" />
        </div>
      </div>
    );
  }

  if (!activeOrders.length) return null;

  return (
    <div className="border-b border-gray-200 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/80 to-white dark:from-[#1a1a2e] dark:to-[#1e1e38] shrink-0">
      {activeOrders.map((order) => {
        const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
        const isExpanded = expandedOrderId === order.id;
        const currentStep = config.step;
        const payment = PAYMENT_LABELS[order.paymentMethod] || { label: order.paymentMethod, emoji: "💰" };

        return (
          <div key={order.id}>
            {/* Compact Info Line */}
            <button
              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors text-left"
            >
              <Package className="h-3.5 w-3.5 text-red-500 shrink-0" />
              
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                {order.orderNumber.startsWith("#") ? order.orderNumber : `#${order.orderNumber}`}
              </span>

              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border",
                config.bgColor, config.color, config.borderColor
              )}>
                {config.emoji} {config.label}
              </span>

              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {formatCurrency(order.total)}
              </span>

              <span className="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500 ml-auto">
                <Clock className="h-3 w-3" />
                {timeAgo(order.createdAt)}
              </span>

              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              )}
            </button>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="px-4 pb-3 space-y-3 animate-in slide-in-from-top-1 duration-200">
                {/* Timeline Progress */}
                <div className="flex items-center gap-0 px-1 pt-1">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const isDone = currentStep > idx;
                    const isCurrent = currentStep === idx;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.key} className="flex items-center flex-1 last:flex-initial">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className={cn(
                            "flex items-center justify-center h-6 w-6 rounded-full border-2 transition-colors",
                            isDone
                              ? "bg-green-500 border-green-500 text-white"
                              : isCurrent
                                ? "bg-red-500 border-red-500 text-white scale-110 shadow-md shadow-red-200"
                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-600"
                          )}>
                            {isDone ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <StepIcon className="h-3 w-3" />
                            )}
                          </div>
                          <span className={cn(
                            "text-[9px] font-medium whitespace-nowrap",
                            isDone ? "text-green-600 dark:text-green-400" :
                            isCurrent ? "text-red-500 dark:text-red-400 font-bold" :
                            "text-gray-300 dark:text-gray-600"
                          )}>
                            {step.label}
                          </span>
                        </div>
                        {idx < TIMELINE_STEPS.length - 1 && (
                          <div className={cn(
                            "flex-1 h-0.5 mx-1 rounded-full mt-[-12px]",
                            isDone ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"
                          )} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Order Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <ShoppingBag className="h-3 w-3 text-red-400" />
                    <span>{DELIVERY_TYPE_LABELS[order.deliveryType] || order.deliveryType}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <CreditCard className="h-3 w-3 text-red-400" />
                    <span>{payment.emoji} {payment.label}</span>
                  </div>
                  {order.customerAddress && (
                    <div className="flex items-start gap-1.5 text-gray-500 dark:text-gray-400 col-span-2">
                      <MapPin className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                      <span className="truncate">{order.customerAddress}</span>
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                  <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700/50">
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Itens do Pedido
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-700/30">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="px-3 py-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-gray-700 dark:text-gray-200 font-medium">
                            {item.quantity}x {item.productName}
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                            {formatCurrency(item.totalPrice)}
                          </span>
                        </div>
                        {item.complements && item.complements.length > 0 && (
                          <div className="mt-0.5 pl-3">
                            {item.complements.map((c, ci) => (
                              <span key={ci} className="text-[10px] text-gray-400 dark:text-gray-500 block">
                                + {c.quantity > 1 ? `${c.quantity}x ` : ""}{c.name}
                                {c.price > 0 && ` (${formatCurrency(c.price)})`}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 italic">
                            Obs: {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Totals */}
                  <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700/50 space-y-0.5">
                    {parseFloat(order.deliveryFee) > 0 && (
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>Taxa de entrega</span>
                        <span>{formatCurrency(order.deliveryFee)}</span>
                      </div>
                    )}
                    {parseFloat(order.discount) > 0 && (
                      <div className="flex justify-between text-[10px] text-green-500">
                        <span>Desconto</span>
                        <span>-{formatCurrency(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px] font-bold text-gray-700 dark:text-gray-200">
                      <span>Total</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes - Using StickyNote icon instead of Timer/Clock */}
                {order.notes && (
                  <div className="flex items-start gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg px-3 py-1.5 border border-amber-100 dark:border-amber-800/30">
                    <StickyNote className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                    <span className="italic">{order.notes}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

