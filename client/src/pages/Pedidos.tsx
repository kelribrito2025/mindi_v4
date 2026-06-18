import { AdminLayout } from "@/components/AdminLayout";
import { useSearch } from "@/contexts/SearchContext";
import { SlidingTabs } from "@/components/SlidingTabs";
import { PageHeader, StatusBadge, EmptyState, SectionCard } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Package,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  RefreshCw,
  Printer,
  Smartphone,
  MessageCircle,
  Mail,
  Calendar,
  User,
  Trash2,
  Edit,
  ArrowLeft,
  Bike,
  Plus,
  MoreVertical,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Inbox,
  Wifi,
  WifiOff,
  Link2Off,
  QrCode,
  Star,
  LayoutGrid,
  List,
  Eye,
  Info,
  Send,
  Video,
  AlertTriangle,
  Ban,
  Settings2,
  Activity,
  CloudOff,
  Search,
  Minus,
  ShoppingCart,
  X,
  Pencil,
  Check,
  Eraser,
  Copy,
  Share2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { usePreference } from "@/hooks/usePreference";
import { useLocation } from "wouter";
import { useOrdersSSE } from "@/hooks/useOrdersSSE";
import { normalizeSSEOrder, insertOrderIntoList } from "@/lib/normalizeSSEOrder";
import { useNewOrders } from "@/contexts/NewOrdersContext";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ComplementGroups, areRequiredGroupsFilled, calculateComplementsTotal, collectSelectedComplements } from "@/components/ComplementGroups";
import type { ComplementGroup, ComplementItem } from "@/components/ComplementGroups";
import { CancelOrderDialog, ClearOrdersDialog, QrCodeModal, WhatsappInfoModal, DriverAssignModal, DriverInfoModal, StatusOnboardingModal } from "@/components/pedidos";

type OrderStatus = "pending_confirmation" | "new" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";
type MutableOrderStatus = Exclude<OrderStatus, "pending_confirmation">;

type IfoodBenefitDisplay = {
  description: string;
  valueInCents: number;
  sponsorLabels: string[];
};

function formatIfoodSponsorLabel(sponsor: string): string {
  const normalized = sponsor.trim().toUpperCase();
  if (normalized === "IFOOD") return "iFood";
  if (["MERCHANT", "STORE", "LOJA", "RESTAURANT"].includes(normalized)) return "Loja";
  return sponsor.trim() || "Responsável não informado";
}

function getIfoodSponsorshipEntries(sponsorshipValues: unknown): Array<[string, number]> {
  if (!sponsorshipValues) return [];

  if (Array.isArray(sponsorshipValues)) {
    return sponsorshipValues
      .map((entry: any): [string, number] => [String(entry?.name || entry?.sponsor || entry?.type || ""), Number(entry?.value || 0)])
      .filter(([sponsor, value]) => sponsor.trim().length > 0 && value > 0);
  }

  if (typeof sponsorshipValues === "object") {
    return Object.entries(sponsorshipValues as Record<string, unknown>)
      .map(([sponsor, value]) => [sponsor, Number(value || 0)] as [string, number])
      .filter(([sponsor, value]) => sponsor.trim().length > 0 && value > 0);
  }

  return [];
}

function getIfoodBenefitValueInCents(benefit: any): number {
  const explicitValue = Number(benefit?.value || 0);
  if (Number.isFinite(explicitValue) && explicitValue > 0) return explicitValue;

  return getIfoodSponsorshipEntries(benefit?.sponsorshipValues).reduce((sum, [, value]) => sum + value, 0);
}

function getIfoodBenefitDisplays(order: any): IfoodBenefitDisplay[] {
  const externalData = order?.externalData || {};
  const rawBenefits = Array.isArray(externalData?.benefits)
    ? externalData.benefits
    : Array.isArray(externalData?.total?.benefits)
      ? externalData.total.benefits
      : [];

  return rawBenefits
    .map((benefit: any, index: number): IfoodBenefitDisplay => {
      const sponsorshipEntries = getIfoodSponsorshipEntries(benefit?.sponsorshipValues);
      const sponsorLabels = sponsorshipEntries.length > 0
        ? sponsorshipEntries.map(([sponsor]) => formatIfoodSponsorLabel(sponsor))
        : ["Responsável não informado"];

      return {
        description: benefit?.description || benefit?.campaignName || benefit?.target || `Benefício ${index + 1}`,
        valueInCents: getIfoodBenefitValueInCents(benefit),
        sponsorLabels,
      };
    })
    .filter((benefit: IfoodBenefitDisplay) => benefit.valueInCents > 0);
}

type IfoodPaymentDisplay = {
  label: string;
  typeLabel: string;
  valueInCents: number | null;
  prepaid: boolean;
  cardBrand: string | null;
  changeForInCents: number | null;
};

function getIfoodMindiMetadata(order: any): Record<string, any> {
  return order?.externalData?._mindi || {};
}

function getIfoodCustomerDocument(order: any): string | null {
  return normalizeIfoodText(order?.externalData?.customer?.documentNumber)
    || normalizeIfoodText(getIfoodMindiMetadata(order)?.customer?.documentNumber);
}

function getIfoodPhoneLocalizer(order: any): string | null {
  return normalizeIfoodText(order?.externalData?.customer?.phone?.localizer)
    || normalizeIfoodText(getIfoodMindiMetadata(order)?.customer?.phoneLocalizer)
    || normalizeIfoodText(order?.externalData?.phone?.localizer)
    || normalizeIfoodText(order?.externalData?.delivery?.localizer);
}

function formatIfoodDateTime(value: unknown): string | null {
  const rawValue = normalizeIfoodText(value);
  if (!rawValue) return null;
  const date = new Date(rawValue);
  if (Number.isNaN(date.getTime())) return rawValue;
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

function formatIfoodOrderTypeLabel(value: unknown): string | null {
  const normalized = normalizeIfoodText(value)?.toUpperCase();
  if (!normalized) return null;
  if (normalized === "DELIVERY") return "Entrega";
  if (normalized === "TAKEOUT") return "Retirada";
  if (["DINE_IN", "INDOOR"].includes(normalized)) return "Consumo no local";
  return normalized;
}

function formatIfoodPaymentMethodLabel(method: unknown): string {
  const normalized = normalizeIfoodText(method)?.toUpperCase() || "";
  if (normalized.includes("CASH") || normalized.includes("DINHEIRO")) return "Dinheiro";
  if (normalized.includes("PIX")) return "PIX";
  if (normalized.includes("CREDIT")) return "Cartão de crédito";
  if (normalized.includes("DEBIT")) return "Cartão de débito";
  if (normalized.includes("MEAL") || normalized.includes("VOUCHER")) return "Vale/benefício";
  if (normalized.includes("BOLETO")) return "Boleto";
  return normalizeIfoodText(method) || "Pagamento iFood";
}

function getIfoodPaymentDisplays(order: any): IfoodPaymentDisplay[] {
  const externalData = order?.externalData || {};
  const mindiPayments = getIfoodMindiMetadata(order)?.payments;
  const rawPayments = Array.isArray(mindiPayments)
    ? mindiPayments
    : Array.isArray(externalData?.payments?.methods)
      ? externalData.payments.methods
      : [];

  return rawPayments.map((payment: any): IfoodPaymentDisplay => ({
    label: formatIfoodPaymentMethodLabel(payment?.method || payment?.type),
    typeLabel: payment?.prepaid ? "Pago online" : "Pagamento na entrega/retirada",
    valueInCents: typeof payment?.valueInCents === "number"
      ? payment.valueInCents
      : (typeof payment?.value === "number" ? payment.value : null),
    prepaid: Boolean(payment?.prepaid),
    cardBrand: normalizeIfoodText(payment?.cardBrand) || normalizeIfoodText(payment?.card?.brand),
    changeForInCents: typeof payment?.changeForInCents === "number"
      ? payment.changeForInCents
      : (typeof payment?.changeFor === "number" ? payment.changeFor : null),
  }));
}

function getIfoodCancellationRequest(order: any): { reason: string; code: string | null; receivedAt: string | null } | null {
  const request = order?.externalData?._cancellationRequest;
  if (!request) return null;
  return {
    reason: normalizeIfoodText(request?.reason) || "Solicitação do cliente",
    code: normalizeIfoodText(request?.code),
    receivedAt: formatIfoodDateTime(request?.receivedAt),
  };
}

// Componente para buscar e exibir motivos de cancelamento do iFood
function IfoodCancellationReasons({ externalId, selectedCode, onSelect }: {
  externalId: string | null;
  selectedCode: string;
  onSelect: (code: string, description: string) => void;
}) {
  const { data: reasons, isLoading, error } = trpc.ifood.getCancellationReasons.useQuery(
    { externalId: externalId || '' },
    { enabled: !!externalId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando motivos do iFood...
      </div>
    );
  }

  if (error || !reasons || reasons.length === 0) {
    // Fallback: motivos padrão do iFood
    const fallbackReasons = [
      { cancelCodeId: '501', description: 'Problemas de sistema na loja' },
      { cancelCodeId: '502', description: 'Pedido duplicado' },
      { cancelCodeId: '503', description: 'Item indisponível' },
      { cancelCodeId: '504', description: 'Restaurante fechado' },
      { cancelCodeId: '505', description: 'Endereço não atendido' },
      { cancelCodeId: '506', description: 'Suspeita de golpe ou trote' },
      { cancelCodeId: '507', description: 'Tempo de preparo muito alto' },
      { cancelCodeId: '508', description: 'Área de risco' },
    ];
    return (
      <div className="space-y-2">
        <p className="text-xs text-amber-600 mb-2">Motivos padrão (não foi possível carregar do iFood)</p>
        <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto">
          {fallbackReasons.map((reason) => (
            <button
              key={reason.cancelCodeId}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors",
                selectedCode === reason.cancelCodeId
                  ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-300 font-medium"
                  : "border-border hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/20"
              )}
              onClick={() => onSelect(reason.cancelCodeId, reason.description)}
            >
              {reason.description}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto">
      {reasons.map((reason: any) => (
        <button
          key={reason.cancelCodeId || reason.code}
          type="button"
          className={cn(
            "w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors",
            selectedCode === (reason.cancelCodeId || reason.code)
              ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-300 font-medium"
              : "border-border hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/20"
          )}
          onClick={() => onSelect(reason.cancelCodeId || reason.code, reason.description || reason.cancelDescription)}
        >
          {reason.description || reason.cancelDescription}
        </button>
      ))}
    </div>
  );
}

// Animation constants for motion.div order cards
const ORDER_CARD_INITIAL = { opacity: 0, y: 10, scale: 0.98 } as const;
const ORDER_CARD_ANIMATE = { opacity: 1, y: 0, scale: 1 } as const;
const ORDER_CARD_EXIT = { opacity: 0, y: -8, scale: 0.98 } as const;
const ORDER_CARD_TRANSITION = {
  layout: { type: "spring", stiffness: 500, damping: 35 },
  opacity: { duration: 0.2, ease: "easeInOut" },
  y: { duration: 0.2, ease: "easeOut" },
  scale: { duration: 0.15, ease: "easeOut" },
} as const;

// Configuração das colunas Kanban
const kanbanColumns = [
  {
    id: "new" as OrderStatus,
    title: "Novos",
    color: "blue",
    borderColor: "border-t-blue-500",
    iconBg: "bg-blue-100 dark:bg-blue-950/50",
    iconColor: "text-blue-600",
    dotColor: "bg-blue-500",
    placeholderBorder: "border-blue-300 dark:border-blue-800",
    placeholderBg: "bg-blue-50 dark:bg-blue-950/30",
    placeholderText: "text-blue-500",
    tabBg: "bg-blue-100 dark:bg-blue-950/50",
    tabText: "text-blue-700 dark:text-blue-300",
    tabBorder: "border-blue-200 dark:border-blue-800",
    badgeBg: "bg-blue-500",
    icon: Clock,
  },
  {
    id: "preparing" as OrderStatus,
    title: "Preparo",
    color: "red",
    borderColor: "border-t-red-500",
    iconBg: "bg-red-100 dark:bg-red-950/50",
    iconColor: "text-red-500",
    dotColor: "bg-red-500",
    placeholderBorder: "border-red-300 dark:border-red-500",
    placeholderBg: "bg-red-50/50 dark:bg-red-950/30",
    placeholderText: "text-red-500",
    tabBg: "bg-red-100 dark:bg-red-950/50",
    tabText: "text-red-500 dark:text-red-300",
    tabBorder: "border-red-200 dark:border-red-500",
    badgeBg: "bg-red-500",
    icon: ChefHat,
  },
  {
    id: "ready" as OrderStatus,
    title: "Prontos",
    color: "emerald",
    borderColor: "border-t-emerald-500",
    iconBg: "bg-emerald-100 dark:bg-emerald-950/50",
    iconColor: "text-emerald-600",
    dotColor: "bg-emerald-500",
    placeholderBorder: "border-emerald-300 dark:border-emerald-800",
    placeholderBg: "bg-emerald-50/50 dark:bg-emerald-950/30",
    placeholderText: "text-emerald-500",
    tabBg: "bg-emerald-100 dark:bg-emerald-950/50",
    tabText: "text-emerald-700 dark:text-emerald-300",
    tabBorder: "border-emerald-200 dark:border-emerald-800",
    badgeBg: "bg-emerald-500",
    icon: Package,
  },
  {
    id: "completed" as OrderStatus,
    title: "Completos",
    color: "gray",
    borderColor: "border-t-muted-foreground/50",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    dotColor: "bg-muted-foreground/50",
    placeholderBorder: "border-border",
    placeholderBg: "bg-muted/50",
    placeholderText: "text-muted-foreground",
    tabBg: "bg-gray-200 dark:bg-gray-800",
    tabText: "text-gray-700 dark:text-gray-300",
    tabBorder: "border-gray-300 dark:border-gray-700",
    badgeBg: "bg-gray-400",
    icon: CheckCircle2,
  },
  {
    id: "cancelled" as OrderStatus,
    title: "Cancelados",
    color: "red",
    borderColor: "border-t-red-500",
    iconBg: "bg-red-100 dark:bg-red-950/50",
    iconColor: "text-red-500",
    dotColor: "bg-red-500",
    placeholderBorder: "border-red-300 dark:border-red-500",
    placeholderBg: "bg-red-50 dark:bg-red-950/30",
    placeholderText: "text-red-500",
    tabBg: "bg-red-100 dark:bg-red-950/50",
    tabText: "text-red-500 dark:text-red-300",
    tabBorder: "border-red-200 dark:border-red-500",
    badgeBg: "bg-red-500",
    icon: XCircle,
  },
];

const statusConfig: Record<OrderStatus, { 
  label: string; 
  variant: "success" | "warning" | "error" | "info" | "default";
  icon: typeof Clock;
  color: string;
  bgColor: string;
  badgeBg: string;
  badgeText: string;
}> = {
  pending_confirmation: { label: "Aguardando pagamento", variant: "warning", icon: Loader2, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950/30", badgeBg: "#f59e0b", badgeText: "#ffffff" },
  new: { label: "Novo", variant: "info", icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30", badgeBg: "#3b82f6", badgeText: "#ffffff" },
  preparing: { label: "Preparando", variant: "warning", icon: ChefHat, color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950/30", badgeBg: "#ef4444", badgeText: "#ffffff" },
  ready: { label: "Pronto", variant: "success", icon: Package, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", badgeBg: "#059669", badgeText: "#ffffff" },
  out_for_delivery: { label: "Em entrega", variant: "info", icon: Bike, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30", badgeBg: "#ea580c", badgeText: "#ffffff" },
  completed: { label: "Finalizado", variant: "default", icon: CheckCircle, color: "text-muted-foreground", bgColor: "bg-muted", badgeBg: "#6b7280", badgeText: "#ffffff" },
  cancelled: { label: "Cancelado", variant: "error", icon: XCircle, color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950/30", badgeBg: "#ef4444", badgeText: "#ffffff" },
};

const paymentMethodLabels: Record<string, { label: string; icon: typeof CreditCard }> = {
  cash: { label: "Dinheiro", icon: Banknote },
  card: { label: "Cartão", icon: CreditCard },
  pix: { label: "Pix", icon: QrCode },
  pix_online: { label: "Pix Online", icon: QrCode },
  card_online: { label: "Cartão Online", icon: CreditCard },
};

type EditableDeliveryType = "delivery" | "pickup" | "dine_in";
type EditablePaymentMethod = "cash" | "card" | "pix" | "pix_online" | "card_online";

type OrderDetailsEditForm = {
  deliveryType: EditableDeliveryType;
  paymentMethod: EditablePaymentMethod;
  deliveryFee: string;
  changeAmount: string;
  deliveryNeighborhoodFeeId: string;
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  reference: string;
};

type OrderAddressFormFields = Pick<OrderDetailsEditForm, "street" | "number" | "neighborhood" | "complement" | "reference">;

type OrderCustomerEditForm = {
  customerName: string;
  customerPhone: string;
};

type PendingPixWhatsappOrder = {
  id: number;
  orderNumber: string;
  transactionId?: string | null;
  total?: number;
  qrCodeBase64?: string | null;
  createdAt?: string;
  status?: string;
};

type EditableNeighborhoodFeeOption = {
  id: number;
  neighborhood: string;
  fee: string | number;
  pinned?: boolean | null;
};

const editableDeliveryTypeLabels: Record<EditableDeliveryType, string> = {
  delivery: "Entrega",
  pickup: "Retirada",
  dine_in: "Consumo no local",
};

const editableDeliveryTypes: EditableDeliveryType[] = ["delivery", "pickup", "dine_in"];
const onlinePaymentMethods = new Set<EditablePaymentMethod>(["pix_online", "card_online"]);
const editableOrderDetailStatuses = new Set<OrderStatus>(["new", "preparing", "ready", "out_for_delivery"]);
const editableOrderDetailSources = new Set(["internal", "pdv"]);

const normalizeEditableDeliveryType = (value: unknown): EditableDeliveryType => {
  return editableDeliveryTypes.includes(value as EditableDeliveryType) ? (value as EditableDeliveryType) : "delivery";
};

const normalizeEditablePaymentMethod = (value: unknown): EditablePaymentMethod => {
  return Object.keys(paymentMethodLabels).includes(String(value)) ? (value as EditablePaymentMethod) : "cash";
};

const formatMoneyForInput = (value: number): string => value.toLocaleString("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const toMoneyInput = (value: unknown): string => {
  const numericValue = Number(String(value ?? "0").trim().replace(",", "."));
  if (!Number.isFinite(numericValue) || numericValue <= 0) return "";
  return formatMoneyForInput(numericValue);
};

const normalizeMoneyInputValue = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const cents = Number.parseInt(digits, 10);
  return formatMoneyForInput(cents / 100);
};

const parseMoneyInput = (value: string): number | null => {
  const trimmed = value.replace(/\s/g, "");
  if (!trimmed) return null;
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const numericValue = Number(normalized);
  if (!Number.isFinite(numericValue) || numericValue < 0) return null;
  return Math.round(numericValue * 100) / 100;
};

const getEmptyOrderAddressForm = (): OrderAddressFormFields => ({
  street: "",
  number: "",
  neighborhood: "",
  complement: "",
  reference: "",
});

const parseOrderAddressForEdit = (address: unknown): OrderAddressFormFields => {
  const emptyAddress = getEmptyOrderAddressForm();
  const rawAddress = String(address ?? "").trim();
  if (!rawAddress) return emptyAddress;

  let remainingAddress = rawAddress.replace(/\s+/g, " ").trim();
  let reference = "";

  const referencePatterns = [
    /\s*\(Ref:\s*([^)]*)\)\s*$/i,
    /\s*-\s*Ref:\s*(.+)\s*$/i,
    /\s*,?\s*Ref:\s*(.+)\s*$/i,
  ];

  for (const pattern of referencePatterns) {
    const match = remainingAddress.match(pattern);
    if (match) {
      reference = String(match[1] ?? "").trim();
      remainingAddress = remainingAddress.replace(pattern, "").trim();
      break;
    }
  }

  const [mainPartRaw, ...dashPartsRaw] = remainingAddress.split(/\s+-\s+/);
  const mainPart = String(mainPartRaw ?? "").trim();
  const dashParts = dashPartsRaw.map((part) => part.trim()).filter(Boolean);
  const commaParts = mainPart.split(",").map((part) => part.trim()).filter(Boolean);

  let street = "";
  let number = "";
  let neighborhood = "";
  let complement = "";

  if (commaParts.length >= 3) {
    street = commaParts[0];
    number = commaParts[1];
    neighborhood = commaParts.slice(2).join(", ");
  } else if (commaParts.length >= 2) {
    street = commaParts[0];
    number = commaParts.slice(1).join(", ");
  } else {
    street = mainPart;
  }

  if (dashParts.length > 0) {
    if (neighborhood) {
      complement = dashParts.join(" - ");
    } else if (dashParts.length === 1) {
      neighborhood = dashParts[0];
    } else {
      complement = dashParts.slice(0, -1).join(" - ");
      neighborhood = dashParts[dashParts.length - 1];
    }
  }

  return {
    street,
    number,
    neighborhood,
    complement,
    reference,
  };
};

const buildCustomerAddressFromForm = (form: OrderDetailsEditForm): string => {
  const street = form.street.trim();
  const number = form.number.trim();
  const neighborhood = form.neighborhood.trim();
  const complement = form.complement.trim();
  const reference = form.reference.trim();

  let customerAddress = `${street}, ${number}`;
  if (complement) customerAddress += ` - ${complement}`;
  if (neighborhood) customerAddress += ` - ${neighborhood}`;
  if (reference) customerAddress += ` (Ref: ${reference})`;

  return customerAddress;
};

const IFOOD_DELIVERY_CONFIRMATION_URL = "https://confirmacao-entrega-propria.ifood.com.br/";

const IFOOD_LOGISTICS_STATUS_LABELS: Record<string, string> = {
  ASSIGN_DRIVER: "Entregador iFood atribuído",
  GOING_TO_ORIGIN: "Entregador a caminho da loja",
  ARRIVED_AT_ORIGIN: "Entregador chegou à loja",
  COLLECTED: "Pedido coletado pelo entregador",
  GOING_TO_DESTINATION: "Entregador a caminho do cliente",
  ARRIVED_AT_DESTINATION: "Entregador chegou ao destino",
  DELIVERY_DROP_CODE_REQUESTED: "Código de entrega solicitado",
  CONCLUDED: "Pedido concluído no iFood",
};

function normalizeIfoodText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getIfoodDeliveredBy(order: any): string | null {
  const deliveredBy = normalizeIfoodText(order?.externalData?.delivery?.deliveredBy)
    || normalizeIfoodText(order?.externalData?.delivery?.delivered_by);
  return deliveredBy ? deliveredBy.toUpperCase() : null;
}

function isIfoodOrder(order: any): boolean {
  return order?.source === "ifood" || Boolean(order?.externalData?.merchant?.id);
}

function isIfoodMarketplaceDelivery(order: any): boolean {
  return isIfoodOrder(order)
    && order?.deliveryType === "delivery"
    && getIfoodDeliveredBy(order) === "IFOOD";
}

function isIfoodMerchantDelivery(order: any): boolean {
  return isIfoodOrder(order)
    && order?.deliveryType === "delivery"
    && !isIfoodMarketplaceDelivery(order);
}

function getIfoodDriverInfo(order: any): { driverName: string | null; driverPhone: string | null } {
  return {
    driverName: normalizeIfoodText(order?.externalData?._driverInfo?.driverName),
    driverPhone: normalizeIfoodText(order?.externalData?._driverInfo?.driverPhone),
  };
}

function getIfoodLogisticsStatusLabel(order: any): string | null {
  const externalStatus = normalizeIfoodText(order?.externalStatus);
  if (!externalStatus) return null;
  return IFOOD_LOGISTICS_STATUS_LABELS[externalStatus] || null;
}

function shouldValidateIfoodDeliveryCode(order: any): boolean {
  return isIfoodMerchantDelivery(order)
    && order?.status === "out_for_delivery"
    && Boolean(order?.externalId)
    && order?.externalData?._deliveryCodeRequested === true;
}

function getIfoodDeliveryConfirmationInfo(order: any): { url: string; localizer: string | null; displayId: string | null } | null {
  if (!order || !isIfoodMerchantDelivery(order)) return null;

  const orderType = normalizeIfoodText(order.externalData?.orderType) || normalizeIfoodText(order.orderType);
  const isDelivery = orderType === "DELIVERY" || order.deliveryType === "delivery";
  if (!isDelivery) return null;

  const localizer = normalizeIfoodText(order.externalData?.customer?.phone?.localizer)
    || normalizeIfoodText(order.externalData?.phone?.localizer)
    || normalizeIfoodText(order.externalData?.delivery?.localizer);
  const displayId = normalizeIfoodText(order.externalDisplayId)
    || normalizeIfoodText(order.externalData?.displayId)
    || normalizeIfoodText(order.externalData?.display_id)
    || normalizeIfoodText(order.orderNumber);

  return { url: IFOOD_DELIVERY_CONFIRMATION_URL, localizer, displayId };
}

function buildIfoodDeliveryConfirmationShareText(info: { url: string; localizer: string | null; displayId: string | null }): string {
  return [
    "Confirmação de entrega *iFood* pendente",
    "",
    `*Link:* ${info.url}`,
    "",
    `Localizador do pedido: ${info.localizer || "não informado pelo iFood"}`,
    info.displayId ? `Código/Pedido iFood: *${info.displayId}*` : null,
    "",
    "Peça ao cliente o *código de confirmação* no final da entrega e informe junto com o localizador.",
  ].filter((line): line is string => line !== null).join("\n");
}

// Helper: calcular início do dia no timezone do restaurante
function getTodayStartInTimezone(tz: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = formatter.format(now);
  const [year, month, day] = todayStr.split('-').map(Number);
  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'shortOffset',
  });
  const parts = utcFormatter.formatToParts(now);
  const tzOffset = parts.find(p => p.type === 'timeZoneName')?.value || '';
  const offsetMatch = tzOffset.match(/GMT([+-]?)(\d{1,2})(?::(\d{2}))?/);
  let offsetMinutes = 0;
  if (offsetMatch) {
    const sign = offsetMatch[1] === '-' ? -1 : 1;
    const hours = parseInt(offsetMatch[2] || '0');
    const mins = parseInt(offsetMatch[3] || '0');
    offsetMinutes = sign * (hours * 60 + mins);
  }
  const todayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60 * 1000);
  return todayStart;
}

export default function Pedidos() {
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery(undefined, { staleTime: 60000 });
  const hasOnlinePixPaymentEnabled = Boolean(
    (establishment as any)?.paytimeEnabled || (establishment as any)?.onlinePaymentEnabled
  );
  // Timezone e início do dia para filtro de pedidos
  const restaurantTimezone = (establishment as any)?.timezone || 'America/Sao_Paulo';
  const todayStart = getTodayStartInTimezone(restaurantTimezone);
  const configuredPaymentMethods = useMemo<EditablePaymentMethod[]>(() => {
    const methods: EditablePaymentMethod[] = [];
    if (establishment?.acceptsCash) methods.push("cash");
    if (establishment?.acceptsCard) methods.push("card");
    if (establishment?.acceptsPix) methods.push("pix");
    return methods;
  }, [establishment?.acceptsCash, establishment?.acceptsCard, establishment?.acceptsPix]);
  const configuredPaymentMethodSet = useMemo(() => new Set(configuredPaymentMethods), [configuredPaymentMethods]);

  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [pendingPixWhatsappOrder, setPendingPixWhatsappOrder] = useState<PendingPixWhatsappOrder | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem('pixPendingOrder');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (!parsed?.orderNumber) return null;
      return {
        id: Number(parsed.id || 0),
        orderNumber: String(parsed.orderNumber),
        transactionId: parsed.transactionId,
        total: typeof parsed.total === 'number' ? parsed.total : undefined,
        qrCodeBase64: parsed.qrCodeBase64,
        createdAt: parsed.createdAt,
        status: parsed.status || 'PENDING',
      };
    } catch {
      sessionStorage.removeItem('pixPendingOrder');
      return null;
    }
  });
  const [showPixWhatsappChargeButton, setShowPixWhatsappChargeButton] = useState(false);
  const [isPollingPixWhatsappStatus, setIsPollingPixWhatsappStatus] = useState(false);

  // Detectar query param ?order=ID para abrir sidebar automaticamente (vindo do Dashboard)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderParam = params.get('order');
    if (orderParam) {
      const orderId = parseInt(orderParam, 10);
      if (!isNaN(orderId)) {
        setSelectedOrder(orderId);
      }
      // Limpar o query param da URL sem recarregar
      window.history.replaceState({}, '', window.location.pathname);
    }
    // Abrir modal de conexão WhatsApp automaticamente (vindo do onboarding)
    const connectWa = params.get('connectWhatsapp');
    if (connectWa === 'true') {
      setQrCodeModalOpen(true);
      setIsPollingQrCode(true);
      // Limpar o query param da URL sem recarregar
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [ifoodCancellationCode, setIfoodCancellationCode] = useState("");
  const [orderToCancelIsIfood, setOrderToCancelIsIfood] = useState(false);
  const [orderToCancelExternalId, setOrderToCancelExternalId] = useState<string | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearColumnTarget, setClearColumnTarget] = useState<OrderStatus | null>(null);
  // Estado para controlar expansão das colunas no mobile (acordeão)
  const [expandedColumns, setExpandedColumns] = useState<Set<OrderStatus>>(() => new Set<OrderStatus>(["new"]));
  // Estado para controlar limpeza manual visual das colunas (sem apagar do banco)
  // Persistido no localStorage para sobreviver ao refresh
  // Com reset diário: se o timestamp salvo for de um dia anterior, resetar
  const [manuallyClearedColumns, setManuallyClearedColumns] = useState<Set<OrderStatus>>(() => {
    try {
      const stored = localStorage.getItem('clearedColumns');
      if (stored) {
        const parsed = JSON.parse(stored);
        const clearedAt = new Date(parsed.timestamp || parsed.clearedAt?.completed || parsed.clearedAt?.cancelled || Date.now());
        const now = new Date();
        // Se o timestamp salvo for de um dia diferente, resetar
        if (clearedAt.toDateString() !== now.toDateString()) {
          localStorage.removeItem('clearedColumns');
          return new Set();
        }
        return new Set(parsed.columns as OrderStatus[]);
      }
    } catch {}
    return new Set();
  });
  // Estado para controlar loading do WhatsApp
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  // Estado para o modal de QR Code do WhatsApp
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [isPollingQrCode, setIsPollingQrCode] = useState(false);
  // Estado para rastrear qual pedido está com loading de ação
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);
  // Estado para validação do código de confirmação de entrega própria iFood
  const [ifoodDeliveryCodeInput, setIfoodDeliveryCodeInput] = useState("");
  const [ifoodDeliveryCodeOrderId, setIfoodDeliveryCodeOrderId] = useState<number | null>(null);
  // Estado para alternar entre visualização kanban e lista compacta
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(() => {
    try {
      const saved = localStorage.getItem('pedidos_viewMode') as 'kanban' | 'list' | null;
      if (saved) return saved;
      // Mobile padrão = kanban, Desktop padrão = lista
      return window.innerWidth < 768 ? 'kanban' : 'list';
    } catch { return window.innerWidth < 768 ? 'kanban' : 'list'; }
  });
  // Rastreia se o usuário selecionou manualmente o modo de visualização
  const [userManuallySelected, setUserManuallySelected] = useState(() => {
    try {
      return localStorage.getItem('pedidos_viewMode_manual') === 'true';
    } catch { return false; }
  });
  // Auto-switch: em desktop com tela estreita (ex: sidebar aberta), trocar kanban para lista automaticamente
  // Não afeta mobile (< 768px). Só atua em desktop (>= 768px) com largura < 1280px.
  useEffect(() => {
    if (userManuallySelected) return; // respeita escolha manual do usuário
    const handleResize = () => {
      const w = window.innerWidth;
      // Só atua em desktop (>= 768px)
      if (w >= 768) {
        if (w < 1280 && viewMode === 'kanban') {
          setViewMode('list');
        } else if (w >= 1280 && viewMode === 'list') {
          // Restaura kanban quando a tela fica grande novamente (apenas se não foi seleção manual)
          const saved = localStorage.getItem('pedidos_viewMode') as 'kanban' | 'list' | null;
          if (!saved || saved === 'kanban') {
            setViewMode('kanban');
          }
        }
      }
    };
    handleResize(); // verificar no mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [userManuallySelected, viewMode]);
  // Estado para filtro de status na lista compacta
  const [listStatusFilter, setListStatusFilter] = useState<OrderStatus | 'all'>('all');
  // Estado para o modal informativo de WhatsApp
  const [whatsappInfoModalOpen, setWhatsappInfoModalOpen] = useState(false);
  const [whatsappModalSeen, setWhatsappModalSeen] = usePreference('whatsapp_info_modal_seen');
  const [, navigate] = useLocation();

  // Estado para modal de onboarding contextual ao mudar status do pedido
  const [statusOnboardingModal, setStatusOnboardingModal] = useState<{
    open: boolean;
    statusType: 'preparing' | 'ready' | 'completed' | null;
    orderId: number | null;
    dontShowAgain: boolean;
  }>({ open: false, statusType: null, orderId: null, dontShowAgain: false });

  // Estado para modal informativo do entregador
  const [driverInfoModalOpen, setDriverInfoModalOpen] = useState(false);
  const [driverInfoOrderId, setDriverInfoOrderId] = useState<number | null>(null);

  // ===== EDIÇÃO DE PEDIDO =====
  const [editingOrder, setEditingOrder] = useState(false);
  const [editingOrderDetails, setEditingOrderDetails] = useState(false);
  const [editingOrderCustomer, setEditingOrderCustomer] = useState(false);
  const [orderCustomerForm, setOrderCustomerForm] = useState<OrderCustomerEditForm>({
    customerName: "",
    customerPhone: "",
  });
  const [orderDetailsForm, setOrderDetailsForm] = useState<OrderDetailsEditForm>({
    deliveryType: "delivery",
    paymentMethod: "cash",
    deliveryFee: "",
    changeAmount: "",
    deliveryNeighborhoodFeeId: "",
    ...getEmptyOrderAddressForm(),
  });
  const [addItemSearch, setAddItemSearch] = useState("");
  const [addItemExpanded, setAddItemExpanded] = useState(false);
  const addItemSearchRef = useRef<HTMLInputElement>(null);

  // Painel de complementos inline no Sheet (lado a lado)
  const [complementModalProduct, setComplementModalProduct] = useState<{
    id: number;
    name: string;
    price: string;
    images: string[] | null;
  } | null>(null);
  const [selectedComplements, setSelectedComplements] = useState<Map<number, Map<number, number>>>(new Map());
  const [complementQuantity, setComplementQuantity] = useState(1);

  // ===== EDIÇÃO DE NOMES DOS STATUS =====
  const [editingStatusLabel, setEditingStatusLabel] = useState<OrderStatus | null>(null);
  const [editingStatusValue, setEditingStatusValue] = useState("");
  const defaultStatusLabels: Record<string, string> = {
    new: "Novos",
    preparing: "Preparo",
    ready: "Prontos",
    completed: "Completos",
    cancelled: "Cancelados",
  };
  const customStatusLabels = establishment?.customStatusLabels as Record<string, string> | null | undefined;
  const getStatusLabel = useCallback((statusId: string) => {
    return customStatusLabels?.[statusId] || defaultStatusLabels[statusId] || statusId;
  }, [customStatusLabels]);
  const updateStatusLabelMutation = trpc.establishment.update.useMutation({
    onSuccess: (_data, variables) => {
      utils.establishment.get.setData(undefined, (old) => {
        if (!old) return old;
        return { ...old, ...variables };
      });
      toast.success("Título atualizado!");
    },
    onError: (err) => { console.error('[StatusLabel] Erro:', err); toast.error("Erro ao atualizar título: " + (err?.message || 'desconhecido')); },
  });
  const handleSaveStatusLabel = (statusId: OrderStatus) => {
    if (!establishment) return;
    const trimmed = editingStatusValue.trim();
    if (!trimmed) {
      toast.error("O título não pode ficar vazio");
      return;
    }
    const newLabels = { ...(customStatusLabels || {}), [statusId]: trimmed };
    updateStatusLabelMutation.mutate({ id: establishment.id, customStatusLabels: newLabels });
    setEditingStatusLabel(null);
  };
  const handleRestoreStatusLabel = (statusId: OrderStatus) => {
    if (!establishment) return;
    const newLabels = { ...(customStatusLabels || {}) };
    delete newLabels[statusId];
    const hasLabels = Object.keys(newLabels).length > 0;
    updateStatusLabelMutation.mutate({ id: establishment.id, customStatusLabels: hasLabels ? newLabels : null });
    toast.success("Título restaurado!");
  };

  // Resetar modo de edição ao trocar de pedido
  useEffect(() => {
    setEditingOrder(false);
    setAddItemExpanded(false);
    setAddItemSearch("");
    setComplementModalProduct(null);
    setShowPixWhatsappChargeButton(false);
  }, [selectedOrder]);

  // Carrossel de mensagens do modal WhatsApp (estabilizado com useMemo)


  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // All hooks MUST be called before any early return
  const utils = trpc.useUtils();

  // Auto-accept orders - dropdown de configurações
  const [showOrderSettingsDropdown, setShowOrderSettingsDropdown] = useState(false);
  const autoAcceptOrders = establishment?.autoAcceptOrders ?? false;
  const updateAutoAcceptMutation = trpc.establishment.update.useMutation({
    onSuccess: (_data, variables) => {
      utils.establishment.get.setData(undefined, (old) => {
        if (!old) return old;
        return { ...old, ...variables };
      });
      toast.success(variables.autoAcceptOrders 
        ? "Pedidos serão aceitos automaticamente" 
        : "Aceitação automática desativada");
    },
    onError: () => toast.error("Erro ao atualizar configuração"),
  });
  
  // Query para status do WhatsApp (com polling quando modal está aberto)
  const { data: whatsappStatus, refetch: refetchWhatsappStatus, isLoading: isWhatsappLoading, isFetched: isWhatsappFetched } = trpc.whatsapp.getStatus.useQuery(undefined, {
    refetchInterval: isPollingQrCode ? 3000 : 60000,
  });
  
  // Query para configurações do WhatsApp (notificações ativas)
  const { data: whatsappConfig } = trpc.whatsapp.getConfig.useQuery(undefined, { staleTime: 120000 });

  // Mutation para conectar WhatsApp (gera QR Code)
  const connectWhatsapp = trpc.whatsapp.connect.useMutation({
    onSuccess: (data) => {
      if (data.qrcode) {
        toast.success("QR Code gerado! Escaneie com seu WhatsApp.");
        setIsPollingQrCode(true);
      } else if (data.status === 'connected') {
        toast.success("WhatsApp já está conectado!");
        setQrCodeModalOpen(false);
      }
      refetchWhatsappStatus();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao conectar WhatsApp");
    },
  });
  
  // Mutation para desconectar WhatsApp
  const disconnectWhatsapp = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => {
      toast.success("WhatsApp desconectado com sucesso");
      setIsPollingQrCode(false);
      refetchWhatsappStatus();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desconectar WhatsApp");
    },
  });
  
  // Parar polling quando conectado e atualizar checklist de onboarding
  useEffect(() => {
    if (whatsappStatus?.status === 'connected' && isPollingQrCode) {
      setIsPollingQrCode(false);
      setQrCodeModalOpen(false);
      toast.success("WhatsApp conectado com sucesso!");
      // Invalidar o checklist de onboarding para que o passo "Conectar WhatsApp" seja marcado imediatamente
      utils.dashboard.onboardingChecklist.invalidate();
    }
  }, [whatsappStatus?.status, isPollingQrCode, utils]);

  // Modal informativo: exibir APENAS uma vez para novos usuários que nunca conectaram WhatsApp
  useEffect(() => {
    if (!isWhatsappFetched || isWhatsappLoading) return;
    
    // Se WhatsApp está conectado, nunca mostrar o modal e marcar como visto permanentemente
    if (whatsappStatus?.status === 'connected') {
      setWhatsappModalSeen('true');
      setWhatsappInfoModalOpen(false);
      return;
    }
    
    // Verificar se já foi dispensado permanentemente (banco de dados)
    if (whatsappModalSeen === 'true') return;
    
    // Mostrar modal apenas para novos usuários que nunca viram
    setWhatsappInfoModalOpen(true);
  }, [isWhatsappFetched, isWhatsappLoading, whatsappStatus?.status]);

  // Listener para abrir o modal de conexao do WhatsApp (disparado pelo banner)
  useEffect(() => {
    const handleOpenWhatsappModal = () => {
      setQrCodeModalOpen(true);
      connectWhatsapp.mutate();
      setIsPollingQrCode(true);
    };

    window.addEventListener('open-whatsapp-modal', handleOpenWhatsappModal);
    return () => {
      window.removeEventListener('open-whatsapp-modal', handleOpenWhatsappModal);
    };
  }, [connectWhatsapp]);
  
  // Query para buscar todos os pedidos
  const { data: allOrdersData, refetch: refetchAll, isLoading } = trpc.orders.list.useQuery(
    { 
      establishmentId: establishmentId ?? 0,
    },
    { 
      enabled: !!establishmentId && establishmentId > 0,
      refetchInterval: false,
    }
  );

  // Handlers para eventos SSE — Optimistic Update Híbrido
  // 1. Insere o pedido imediatamente no cache (zero delay visual)
  // 2. Invalida em background para substituir pelos dados completos do DB
  const handleNewOrder = useCallback((order: unknown) => {
    
    if (order && typeof order === 'object' && 'id' in order) {
      try {
        const normalized = normalizeSSEOrder(order as any);
        // Optimistic: inserir no cache imediatamente
        utils.orders.list.setData(
          { establishmentId: establishmentId ?? 0 },
          ((old: any) => {
            if (!old) return old;
            const updatedOrders = insertOrderIntoList(old.orders as any[], normalized);
            return { ...old, orders: updatedOrders };
          }) as any
        );
        console.log("[Pedidos] Optimistic update: pedido", normalized.orderNumber, "inserido no cache");
      } catch (e) {
        console.error("[Pedidos] Erro no optimistic update:", e);
      }
    }
    // Background: refetch para substituir pelos dados completos do DB (sem flicker)
    refetchAll();
    // Toast agora é disparado globalmente pelo AdminLayout via evento 'new-order-notification'
    // Não duplicar aqui
  }, [refetchAll, utils, establishmentId]);

  const handleOrderUpdate = useCallback(() => {
    refetchAll();
  }, [refetchAll]);

  const handleSSEConnected = useCallback(() => {
    console.log("[Pedidos] SSE reconectado - refazendo fetch dos pedidos");
    refetchAll();
  }, [refetchAll]);

  const handleSSEDisconnected = useCallback(() => {
    console.log("[Pedidos] SSE desconectado - ativando fallback de polling");
    refetchAll();
  }, [refetchAll]);

  // Hook SSE para receber pedidos em tempo real
  const { status: sseStatus, isConnected: sseConnected } = useOrdersSSE({
    establishmentId: establishmentId ?? undefined,
    onNewOrder: handleNewOrder,
    onOrderUpdate: handleOrderUpdate,
    onConnected: handleSSEConnected,
    onDisconnected: handleSSEDisconnected,
    enabled: !!establishmentId && establishmentId > 0,
  });

  // Fallback: polling a cada 30 segundos se SSE não estiver conectado
  useEffect(() => {
    if (!establishmentId || sseConnected) return;
    
    const interval = setInterval(() => {
      console.log("[Pedidos] Polling fallback - SSE não conectado");
      refetchAll();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [establishmentId, sseConnected, refetchAll]);

  const allOrders = allOrdersData?.orders || [];

  const { data: orderDetails, isLoading: orderDetailsLoading, isFetching: orderDetailsFetching } = trpc.orders.get.useQuery(
    { id: selectedOrder! },
    { enabled: !!selectedOrder }
  );

  // Query para buscar configurações de impressão (para saber o método favorito)
  const { data: printerSettings } = trpc.printer.getSettings.useQuery(
    { establishmentId: establishmentId ?? 0 },
    { enabled: !!establishmentId && establishmentId > 0, staleTime: 60000 }
  );

  // Query para verificar se existem entregadores ativos (fluxo inteligente de entrega)
  const { data: activeDriversList } = trpc.driver.listActive.useQuery(
    undefined,
    { enabled: !!establishmentId && establishmentId > 0, staleTime: 30000 }
  );
  const hasActiveDrivers = (activeDriversList?.length ?? 0) > 0;

  const { data: neighborhoodFeesData } = trpc.neighborhoodFees.list.useQuery(
    { establishmentId: establishmentId ?? 0 },
    { enabled: !!establishmentId && establishmentId > 0 && establishment?.deliveryFeeType === "byNeighborhood", staleTime: 120000 }
  );

  const neighborhoodFeeOptions = useMemo<EditableNeighborhoodFeeOption[]>(() => (
    ((neighborhoodFeesData ?? []) as EditableNeighborhoodFeeOption[])
      .filter((fee) => String(fee.neighborhood ?? "").trim().length > 0)
      .sort((a, b) => {
        const pinnedDiff = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
        if (pinnedDiff !== 0) return pinnedDiff;
        return String(a.neighborhood).localeCompare(String(b.neighborhood), "pt-BR");
      })
  ), [neighborhoodFeesData]);

  const getNeighborhoodFeeById = useCallback((feeId: string) => (
    neighborhoodFeeOptions.find((fee) => String(fee.id) === feeId)
  ), [neighborhoodFeeOptions]);

  const getNeighborhoodFeeIdByAmount = useCallback((feeValue: unknown) => {
    const targetFee = parseMoneyInput(toMoneyInput(feeValue));
    if (targetFee === null) return "";
    const matchingFee = neighborhoodFeeOptions.find((fee) => parseMoneyInput(toMoneyInput(fee.fee)) === targetFee);
    return matchingFee ? String(matchingFee.id) : "";
  }, [neighborhoodFeeOptions]);

  // Mutation para atualizar método de impressão favorito
  const reprintMutation = trpc.printer.reprintOrder.useMutation({
    onSuccess: (data) => {
      toast.success("Pedido enviado para impressão", {
        description: `Enviado para ${data.connections} impressora(s) conectada(s).`,
      });
    },
    onError: (error) => {
      toast.error("Erro ao reimprimir", {
        description: error.message,
      });
    },
  });

  const updatePrintMethodMutation = trpc.printer.saveSettings.useMutation({
    onSuccess: () => {
      utils.printer.getSettings.invalidate();
      toast.success("Método de impressão favorito atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar método de impressão");
    },
  });

  // Função para alternar o método de impressão favorito
  const handleToggleFavoritePrintMethod = (method: 'normal' | 'automatic') => {
    console.log('[Favorito] Clicou para mudar para:', method);
    console.log('[Favorito] establishmentId:', establishmentId);
    console.log('[Favorito] printerSettings atual:', printerSettings);
    if (!establishmentId) {
      console.log('[Favorito] Sem establishmentId, retornando');
      return;
    }
    console.log('[Favorito] Chamando mutation...');
    updatePrintMethodMutation.mutate({
      establishmentId,
      defaultPrintMethod: method,
    });
  };

  // Verificar se o usuário tem API Key gerada (Mindi Printer conectado)
  const hasMindiPrinterApiKey = !!printerSettings?.printerApiKey;

  // Hook para gerenciar contagem de pedidos novos na sidebar
  const { decrementCount } = useNewOrders();

  const validateIfoodDeliveryCodeMutation = trpc.ifood.validateDeliveryCode.useMutation({
    onSuccess: (result) => {
      if (result?.valid) {
        toast.success("Código iFood validado. Pedido concluído.");
        setIfoodDeliveryCodeInput("");
        setIfoodDeliveryCodeOrderId(null);
        utils.orders.get.invalidate({ id: selectedOrder! });
        utils.orders.list.invalidate();
      } else {
        toast.error("Código iFood inválido. Confira o código informado pelo cliente.");
      }
    },
    onError: (err) => {
      const errorMessage = err?.message || "Erro ao validar código iFood";
      toast.error(errorMessage.length > 140 ? errorMessage.substring(0, 140) + "..." : errorMessage);
    },
  });

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onMutate: async (variables) => {
      console.log("[Pedidos] Optimistic update iniciado", { orderId: variables.id, newStatus: variables.status });
      
      await utils.orders.list.cancel();
      
      const previousAllOrders = utils.orders.list.getData({ establishmentId: establishmentId ?? 0 });
      
      utils.orders.list.setData(
        { establishmentId: establishmentId ?? 0 },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            orders: old.orders.map(order => 
              order.id === variables.id 
                ? { ...order, status: variables.status, cancellationReason: variables.cancellationReason || order.cancellationReason }
                : order
            ),
          };
        }
      );
      
      // Decrementar badge se estava como "new"
      const order = previousAllOrders?.orders?.find(o => o.id === variables.id);
      if (order?.status === "new" && variables.status !== "new") {
        decrementCount();
      }
      
      return { previousAllOrders };
    },
    onError: (err, variables, context) => {
      console.error("[Pedidos] Erro ao atualizar status:", err);
      if (context?.previousAllOrders) {
        utils.orders.list.setData(
          { establishmentId: establishmentId ?? 0 },
          context.previousAllOrders
        );
      }
      const errorMessage = err?.message || "Erro ao atualizar status do pedido";
      toast.error(errorMessage.length > 100 ? errorMessage.substring(0, 100) + '...' : errorMessage);
    },
    onSettled: () => {
      utils.orders.list.invalidate();
    },
    onSuccess: (result: any, variables) => {
      // Interceptar resposta de múltiplos entregadores no aceite (on_accepted)
      if (result?.action === 'choose_driver_on_accept' && result?.drivers?.length > 0) {
        setDriverModalOrderId(result.orderId);
        setDriverModalDrivers(result.drivers);
        setDriverModalContext('accept');
        setDriverModalOpen(true);
        toast.info("Selecione o entregador para este pedido");
        return;
      }
      const statusLabels: Record<string, string> = {
        preparing: "Pedido aceito e em preparo!",
        ready: "Pedido pronto para entrega!",
        completed: "Pedido finalizado!",
        cancelled: "Pedido cancelado.",
      };
      toast.success(statusLabels[variables.status] || "Status atualizado!");
      // Mostrar aviso se cancelamento no iFood falhou
      if (result?.ifoodWarning) {
        toast.warning(result.ifoodWarning, { duration: 8000 });
      }
    },
  });

  // ===== MUTATIONS DE EDIÇÃO DE PEDIDO =====
  const searchProductsQuery = trpc.orders.searchProducts.useQuery(
    { establishmentId: establishmentId ?? 0, search: addItemSearch },
    { enabled: !!establishmentId && addItemSearch.trim().length >= 1 && editingOrder && addItemExpanded }
  );

  const updateItemQtyMutation = trpc.orders.updateItemQuantity.useMutation({
    onSuccess: () => {
      utils.orders.get.invalidate({ id: selectedOrder! });
      utils.orders.list.invalidate();
    },
    onError: () => toast.error("Erro ao atualizar quantidade"),
  });

  const removeItemMutation = trpc.orders.removeItem.useMutation({
    onSuccess: () => {
      utils.orders.get.invalidate({ id: selectedOrder! });
      utils.orders.list.invalidate();
      toast.success("Item removido do pedido");
    },
    onError: () => toast.error("Erro ao remover item"),
  });

  const addItemMutation = trpc.orders.addItem.useMutation({
    onSuccess: (data) => {
      utils.orders.get.invalidate({ id: selectedOrder! });
      utils.orders.list.invalidate();
      toast.success(`${(data.item as any).productName} adicionado ao pedido`);
      setAddItemSearch("");
      // Fechar painel de complementos se estava aberto
      setComplementModalProduct(null);
      setSelectedComplements(new Map());
      setComplementQuantity(1);
    },
    onError: () => toast.error("Erro ao adicionar item"),
  });

  const updateOrderDetailsMutation = trpc.orders.updateOrderDetails.useMutation({
    onSuccess: (_data, variables) => {
      utils.orders.get.invalidate({ id: variables.orderId });
      utils.orders.list.invalidate();
      setEditingOrderDetails(false);
      const canOfferPixCharge = hasOnlinePixPaymentEnabled
        && variables.paymentMethod === "pix"
        && !pendingPixWhatsappOrder
        && selectedOrder === variables.orderId;
      setShowPixWhatsappChargeButton(canOfferPixCharge);
      toast.success(canOfferPixCharge
        ? "Entrega e pagamento atualizados. Você já pode enviar a cobrança PIX."
        : "Entrega e pagamento atualizados");
    },
    onError: (err) => {
      const errorMessage = err?.message || "Erro ao atualizar entrega e pagamento";
      toast.error(errorMessage.length > 140 ? errorMessage.substring(0, 140) + "..." : errorMessage);
    },
  });

  const sendExistingOrderPixWhatsappChargeMutation = trpc.orders.sendExistingOrderPixWhatsappCharge.useMutation({
    onSuccess: (data) => {
      toast.success("Cobrança PIX enviada pelo WhatsApp!", {
        description: `Pedido ${data.orderNumber} aguardando pagamento`,
      });
      const pendingPixOrder: PendingPixWhatsappOrder = {
        id: data.id,
        orderNumber: data.orderNumber,
        transactionId: data.transactionId,
        total: Number(data.amountCents || 0) / 100,
        qrCodeBase64: data.qrCodeBase64,
        createdAt: new Date().toISOString(),
        status: 'PENDING',
      };
      setPendingPixWhatsappOrder(pendingPixOrder);
      setShowPixWhatsappChargeButton(false);
      try {
        sessionStorage.setItem('pixPendingOrder', JSON.stringify(pendingPixOrder));
      } catch { /* ignore */ }
      window.dispatchEvent(new CustomEvent('pixPendingUpdate', {
        detail: {
          total: Number(data.amountCents || 0) / 100,
          orderNumber: data.orderNumber,
          orderId: data.id,
          id: data.id,
          transactionId: data.transactionId,
          status: 'PENDING',
        },
      }));
      utils.orders.get.invalidate({ id: data.id });
      utils.orders.list.invalidate();
    },
    onError: (err) => {
      const errorMessage = err?.message || "Erro ao enviar cobrança PIX pelo WhatsApp";
      toast.error(errorMessage.length > 140 ? errorMessage.substring(0, 140) + "..." : errorMessage);
    },
  });

  const updateOrderCustomerMutation = trpc.orders.updateOrderCustomer.useMutation({
    onSuccess: (_data, variables) => {
      utils.orders.get.invalidate({ id: variables.orderId });
      utils.orders.list.invalidate();
      setEditingOrderCustomer(false);
      toast.success("Cliente atualizado");
    },
    onError: (err) => {
      const errorMessage = err?.message || "Erro ao atualizar cliente";
      toast.error(errorMessage.length > 140 ? errorMessage.substring(0, 140) + "..." : errorMessage);
    },
  });

  useEffect(() => {
    if (!pendingPixWhatsappOrder?.id || !pendingPixWhatsappOrder.transactionId) return;
    if (pendingPixWhatsappOrder.status && pendingPixWhatsappOrder.status !== 'PENDING') return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const pollPixStatus = async () => {
      if (cancelled) return;
      let shouldContinuePolling = true;
      setIsPollingPixWhatsappStatus(true);
      try {
        const result = await utils.paytime.checkPixStatus.fetch({
          orderId: pendingPixWhatsappOrder.id,
          transactionId: pendingPixWhatsappOrder.transactionId!,
        });

        if (cancelled) return;

        if (result.isPaid || result.status === 'APPROVED') {
          shouldContinuePolling = false;
          setPendingPixWhatsappOrder(null);
          setShowPixWhatsappChargeButton(false);
          try {
            sessionStorage.removeItem('pixPendingOrder');
          } catch { /* ignore */ }
          window.dispatchEvent(new CustomEvent('pixPendingUpdate', { detail: null }));
          toast.success('Pagamento PIX confirmado!', {
            description: `Pedido #${pendingPixWhatsappOrder.orderNumber} foi liberado para preparo.`,
          });
          utils.orders.get.invalidate({ id: pendingPixWhatsappOrder.id });
          utils.orders.list.invalidate();
          utils.product.list.invalidate();
          return;
        }

        if (result.status === 'CANCELLED' || result.status === 'FAILED' || result.status === 'EXPIRED') {
          shouldContinuePolling = false;
          const updatedOrder = { ...pendingPixWhatsappOrder, status: result.status };
          setPendingPixWhatsappOrder(updatedOrder);
          try {
            sessionStorage.setItem('pixPendingOrder', JSON.stringify(updatedOrder));
          } catch { /* ignore */ }
          toast.error('Cobrança PIX não foi concluída', {
            description: `Status retornado: ${result.status}.`,
          });
          return;
        }
      } catch (error) {
        console.warn('[Pedidos] Erro ao verificar status PIX WhatsApp:', error);
      } finally {
        if (!cancelled) {
          setIsPollingPixWhatsappStatus(false);
          if (shouldContinuePolling) {
            timeoutId = setTimeout(pollPixStatus, 5000);
          }
        }
      }
    };

    pollPixStatus();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      setIsPollingPixWhatsappStatus(false);
    };
  }, [pendingPixWhatsappOrder?.id, pendingPixWhatsappOrder?.transactionId, pendingPixWhatsappOrder?.status, utils]);

  useEffect(() => {
    if (!orderDetails || editingOrderDetails) return;
    setOrderDetailsForm({
      deliveryType: normalizeEditableDeliveryType(orderDetails.deliveryType),
      paymentMethod: normalizeEditablePaymentMethod(orderDetails.paymentMethod),
      deliveryFee: toMoneyInput(orderDetails.deliveryFee),
      changeAmount: toMoneyInput((orderDetails as any).changeAmount),
      deliveryNeighborhoodFeeId: getNeighborhoodFeeIdByAmount(orderDetails.deliveryFee),
      ...parseOrderAddressForEdit(orderDetails.customerAddress),
    });
  }, [
    orderDetails?.id,
    orderDetails?.deliveryType,
    orderDetails?.paymentMethod,
    orderDetails?.deliveryFee,
    orderDetails?.customerAddress,
    (orderDetails as any)?.changeAmount,
    editingOrderDetails,
    getNeighborhoodFeeIdByAmount,
  ]);

  useEffect(() => {
    if (!orderDetails || editingOrderCustomer) return;
    setOrderCustomerForm({
      customerName: String(orderDetails.customerName ?? ""),
      customerPhone: String(orderDetails.customerPhone ?? ""),
    });
  }, [
    orderDetails?.id,
    orderDetails?.customerName,
    orderDetails?.customerPhone,
    editingOrderCustomer,
  ]);

  const canEditOrderDetails = !!orderDetails
    && editableOrderDetailStatuses.has(orderDetails.status as OrderStatus)
    && editableOrderDetailSources.has(String((orderDetails as any).source ?? "internal"));
  const isOnlinePaymentOrder = !!orderDetails && onlinePaymentMethods.has(normalizeEditablePaymentMethod(orderDetails.paymentMethod));

  useEffect(() => {
    if (editingOrderDetails && !canEditOrderDetails) {
      setEditingOrderDetails(false);
    }
  }, [canEditOrderDetails, editingOrderDetails]);

  useEffect(() => {
    if (editingOrderCustomer && !canEditOrderDetails) {
      setEditingOrderCustomer(false);
    }
  }, [canEditOrderDetails, editingOrderCustomer]);

  const handleStartOrderCustomerEdit = () => {
    if (!orderDetails || !canEditOrderDetails) return;
    setOrderCustomerForm({
      customerName: String(orderDetails.customerName ?? ""),
      customerPhone: String(orderDetails.customerPhone ?? ""),
    });
    setEditingOrderCustomer(true);
  };

  const handleCancelOrderCustomerEdit = () => {
    if (orderDetails) {
      setOrderCustomerForm({
        customerName: String(orderDetails.customerName ?? ""),
        customerPhone: String(orderDetails.customerPhone ?? ""),
      });
    }
    setEditingOrderCustomer(false);
  };

  const handleSaveOrderCustomer = () => {
    if (!orderDetails) return;
    if (!canEditOrderDetails) {
      toast.error("Este pedido não permite edição manual do cliente.");
      return;
    }

    const customerName = orderCustomerForm.customerName.trim();
    const customerPhone = orderCustomerForm.customerPhone.trim();

    if (!customerName) {
      toast.error("Informe o nome do cliente.");
      return;
    }

    updateOrderCustomerMutation.mutate({
      orderId: orderDetails.id,
      customerName,
      customerPhone: customerPhone || null,
    });
  };

  const handleStartOrderDetailsEdit = () => {
    if (!orderDetails || !canEditOrderDetails) return;
    const currentPaymentMethod = normalizeEditablePaymentMethod(orderDetails.paymentMethod);
    const nextPaymentMethod = isOnlinePaymentOrder
      ? currentPaymentMethod
      : (configuredPaymentMethodSet.has(currentPaymentMethod) ? currentPaymentMethod : configuredPaymentMethods[0]);

    if (!isOnlinePaymentOrder && !nextPaymentMethod) {
      toast.error("Configure pelo menos uma forma de pagamento antes de editar o pedido.");
      return;
    }

    setOrderDetailsForm({
      deliveryType: normalizeEditableDeliveryType(orderDetails.deliveryType),
      paymentMethod: nextPaymentMethod,
      deliveryFee: toMoneyInput(orderDetails.deliveryFee),
      changeAmount: toMoneyInput((orderDetails as any).changeAmount),
      deliveryNeighborhoodFeeId: getNeighborhoodFeeIdByAmount(orderDetails.deliveryFee),
      ...parseOrderAddressForEdit(orderDetails.customerAddress),
    });
    setEditingOrderDetails(true);
  };

  const handleCancelOrderDetailsEdit = () => {
    if (orderDetails) {
      setOrderDetailsForm({
        deliveryType: normalizeEditableDeliveryType(orderDetails.deliveryType),
        paymentMethod: normalizeEditablePaymentMethod(orderDetails.paymentMethod),
        deliveryFee: toMoneyInput(orderDetails.deliveryFee),
        changeAmount: toMoneyInput((orderDetails as any).changeAmount),
        deliveryNeighborhoodFeeId: getNeighborhoodFeeIdByAmount(orderDetails.deliveryFee),
        ...parseOrderAddressForEdit(orderDetails.customerAddress),
      });
    }
    setEditingOrderDetails(false);
  };

  useEffect(() => {
    if (!editingOrderDetails) return;

    setOrderDetailsForm((prev) => {
      if (prev.deliveryType !== "delivery") {
        if (!prev.deliveryFee && !prev.deliveryNeighborhoodFeeId) return prev;
        return { ...prev, deliveryFee: "", deliveryNeighborhoodFeeId: "" };
      }

      const deliveryFeeType = establishment?.deliveryFeeType ?? "free";

      if (deliveryFeeType === "fixed") {
        const nextFee = toMoneyInput(establishment?.deliveryFeeFixed) || "0,00";
        if (prev.deliveryFee === nextFee && !prev.deliveryNeighborhoodFeeId) return prev;
        return { ...prev, deliveryFee: nextFee, deliveryNeighborhoodFeeId: "" };
      }

      if (deliveryFeeType === "free") {
        if (prev.deliveryFee === "0,00" && !prev.deliveryNeighborhoodFeeId) return prev;
        return { ...prev, deliveryFee: "0,00", deliveryNeighborhoodFeeId: "" };
      }

      if (deliveryFeeType === "byNeighborhood") {
        const nextNeighborhoodFeeId = prev.deliveryNeighborhoodFeeId || getNeighborhoodFeeIdByAmount(prev.deliveryFee);
        const selectedFee = getNeighborhoodFeeById(nextNeighborhoodFeeId);
        const nextFee = selectedFee ? toMoneyInput(selectedFee.fee) : prev.deliveryFee;
        const nextNeighborhood = selectedFee?.neighborhood ?? prev.neighborhood;
        if (
          prev.deliveryNeighborhoodFeeId === nextNeighborhoodFeeId
          && prev.deliveryFee === nextFee
          && prev.neighborhood === nextNeighborhood
        ) return prev;
        return {
          ...prev,
          deliveryNeighborhoodFeeId: nextNeighborhoodFeeId,
          deliveryFee: nextFee,
          neighborhood: nextNeighborhood,
        };
      }

      return prev;
    });
  }, [
    editingOrderDetails,
    establishment?.deliveryFeeType,
    establishment?.deliveryFeeFixed,
    orderDetailsForm.deliveryType,
    getNeighborhoodFeeById,
    getNeighborhoodFeeIdByAmount,
  ]);

  const handleSaveOrderDetails = () => {
    if (!orderDetails) return;
    if (!canEditOrderDetails) {
      toast.error("Este pedido não permite edição manual de entrega e pagamento.");
      return;
    }

    const deliveryFeeType = establishment?.deliveryFeeType ?? "free";
    const selectedNeighborhoodFee = getNeighborhoodFeeById(orderDetailsForm.deliveryNeighborhoodFeeId);

    if (orderDetailsForm.deliveryType === "delivery" && deliveryFeeType === "byNeighborhood" && !selectedNeighborhoodFee) {
      toast.error("Selecione o bairro para aplicar a taxa de entrega correta.");
      return;
    }

    const deliveryFee = orderDetailsForm.deliveryType !== "delivery"
      ? 0
      : deliveryFeeType === "fixed"
        ? (parseMoneyInput(toMoneyInput(establishment?.deliveryFeeFixed)) ?? 0)
        : deliveryFeeType === "free"
          ? 0
          : deliveryFeeType === "byNeighborhood" && selectedNeighborhoodFee
            ? (parseMoneyInput(toMoneyInput(selectedNeighborhoodFee.fee)) ?? 0)
            : (parseMoneyInput(orderDetailsForm.deliveryFee) ?? 0);
    const changeAmount = parseMoneyInput(orderDetailsForm.changeAmount);
    const subtotal = Number(orderDetails.subtotal) || 0;
    const discount = Number(orderDetails.discount) || 0;
    const nextTotal = Math.max(0, subtotal + (orderDetailsForm.deliveryType === "delivery" ? deliveryFee : 0) - discount);

    const addressForm = orderDetailsForm.deliveryType === "delivery" && deliveryFeeType === "byNeighborhood" && selectedNeighborhoodFee
      ? { ...orderDetailsForm, neighborhood: selectedNeighborhoodFee.neighborhood }
      : orderDetailsForm;

    if (
      orderDetailsForm.deliveryType === "delivery"
      && (!addressForm.street.trim() || !addressForm.number.trim() || !addressForm.neighborhood.trim())
    ) {
      toast.error("Preencha rua, número e bairro para salvar o pedido como entrega.");
      return;
    }

    const customerAddress = orderDetailsForm.deliveryType === "delivery" ? buildCustomerAddressFromForm(addressForm) : "";

    if (!isOnlinePaymentOrder && !configuredPaymentMethodSet.has(orderDetailsForm.paymentMethod)) {
      toast.error("Esta forma de pagamento não está habilitada nas configurações do estabelecimento.");
      return;
    }

    if (orderDetailsForm.paymentMethod === "cash" && changeAmount !== null && changeAmount > 0 && changeAmount < nextTotal) {
      toast.error("O troco para deve ser maior ou igual ao total do pedido.");
      return;
    }

    updateOrderDetailsMutation.mutate({
      orderId: orderDetails.id,
      deliveryType: orderDetailsForm.deliveryType,
      paymentMethod: orderDetailsForm.paymentMethod,
      deliveryFee: orderDetailsForm.deliveryType === "delivery" ? deliveryFee : null,
      changeAmount: orderDetailsForm.paymentMethod === "cash" ? changeAmount : null,
      customerAddress,
    });
  };

  const isSelectedOrderPendingPixWhatsapp = Boolean(
    pendingPixWhatsappOrder?.id && orderDetails?.id && pendingPixWhatsappOrder.id === orderDetails.id && pendingPixWhatsappOrder.status === 'PENDING'
  );

  const shouldShowPixWhatsappChargeButton = Boolean(
    orderDetails
    && hasOnlinePixPaymentEnabled
    && normalizeEditablePaymentMethod(orderDetails.paymentMethod) === "pix"
    && showPixWhatsappChargeButton
    && !isSelectedOrderPendingPixWhatsapp
    && editableOrderDetailStatuses.has(orderDetails.status as OrderStatus)
  );

  const handleSendPixWhatsappCharge = () => {
    if (!orderDetails) return;
    if (!hasOnlinePixPaymentEnabled) {
      toast.error("Pix online/Celcoin precisa estar ativo para enviar cobrança PIX via WhatsApp.");
      return;
    }
    if (!String(orderDetails.customerPhone || '').replace(/\D/g, '')) {
      toast.error("Informe o telefone do cliente para enviar a cobrança pelo WhatsApp.");
      return;
    }
    sendExistingOrderPixWhatsappChargeMutation.mutate({ orderId: orderDetails.id });
  };

  const handleCancelPendingPixWhatsappOrder = () => {
    if (!pendingPixWhatsappOrder?.id || updateStatusMutation.isPending) return;
    updateStatusMutation.mutate({
      id: pendingPixWhatsappOrder.id,
      status: 'cancelled',
      cancellationReason: 'Cliente desistiu do pagamento PIX via WhatsApp',
    });
    setPendingPixWhatsappOrder(null);
    setShowPixWhatsappChargeButton(false);
    try {
      sessionStorage.removeItem('pixPendingOrder');
    } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('pixPendingUpdate', { detail: null }));
  };

  // Query de complementos do produto selecionado para o modal
  const complementsQuery = trpc.orders.getProductComplements.useQuery(
    { productId: complementModalProduct?.id ?? 0 },
    { enabled: !!complementModalProduct?.id }
  );

  // Handler para clicar num produto na busca
  const handleProductClick = (product: { id: number; name: string; price: string; images: string[] | null; complementCount?: number; isCombo?: boolean | null }) => {
    const hasComplements = (product.complementCount && Number(product.complementCount) > 0) || product.isCombo;
    if (hasComplements) {
      // Abrir painel de complementos inline no Sheet
      setComplementModalProduct({ id: product.id, name: product.name, price: product.price, images: product.images });
      setSelectedComplements(new Map());
      setComplementQuantity(1);
    } else {
      // Adicionar diretamente
      if (!orderDetails) return;
      addItemMutation.mutate({
        orderId: orderDetails.id,
        productId: product.id,
        quantity: 1,
      });
    }
  };

  // Handler para confirmar adição com complementos
  const handleAddWithComplements = () => {
    if (!orderDetails || !complementModalProduct) return;
    const groups = (complementsQuery.data || []) as ComplementGroup[];
    if (!areRequiredGroupsFilled(groups, selectedComplements)) {
      toast.error("Selecione todos os complementos obrigatórios");
      return;
    }
    const getPrice = (item: ComplementItem) => Number(item.price);
    const complementsList = collectSelectedComplements(groups, selectedComplements, getPrice);
    addItemMutation.mutate({
      orderId: orderDetails.id,
      productId: complementModalProduct.id,
      quantity: complementQuantity,
      complements: complementsList.map(c => ({ name: c.name, price: Number(c.price), quantity: c.quantity })),
    });
  };

  // Função para imprimir pedido - usa iframe oculto para não abrir nova janela
  // Usa a mesma API de recibo que a aba de recibo para garantir consistência
  const handlePrintOrder = () => {
    if (!orderDetails) return;
    
    const receiptUrl = `${window.location.origin}/api/print/receipt/${orderDetails.id}`;
    
    // Criar iframe oculto para impressão
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.src = receiptUrl;
    
    document.body.appendChild(iframe);
    
    // Aguardar o iframe carregar e chamar print
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Remover iframe após impressão (com delay para garantir que o diálogo de impressão abriu)
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    };
  };

  // Função para imprimir via API térmica
  const handlePrintThermal = async (orderId: number) => {
    try {
      const response = await fetch(`/api/print/order/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        toast.success("Pedido enviado para impressão térmica!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Erro ao enviar para impressão");
      }
    } catch (error) {
      toast.error("Erro ao conectar com a impressora");
    }
  };

  // Função para imprimir via Multi Printer
  const handlePrintMultiPrinter = async (orderId: number) => {
    // Detectar se é Android
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (!isAndroid) {
      toast.info("Para impressão em múltiplas impressoras, use um dispositivo Android com o app Multi Printer Network Print Service.");
      return;
    }
    
    try {
      // Buscar deep link do servidor
      const response = await fetch(`${window.location.origin}/api/print/multiprinter-sectors/${orderId}`);
      const data = await response.json();
      
      if (data.success && data.deepLink) {
        // Abrir o deep link para o app Multi Printer
        window.location.href = data.deepLink;
        toast.success(`Enviando para ${data.printers.length} impressora(s)...`);
      } else {
        toast.error(data.error || "Erro ao gerar link de impressão");
      }
    } catch (error) {
      console.error("Erro ao imprimir em múltiplas impressoras:", error);
      toast.error("Erro ao conectar com o servidor");
    }
  };

  // Função para imprimir direto (sem abrir detalhes)
  // Usa iframe oculto para não abrir nova aba - abre direto o diálogo de impressão
  const handlePrintOrderDirect = async (orderId: number) => {
    try {
      const receiptUrl = `${window.location.origin}/api/print/receipt/${orderId}`;
      
      // Criar iframe oculto para impressão
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = receiptUrl;
      
      document.body.appendChild(iframe);
      
      // Aguardar o iframe carregar e chamar print
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          // Remover iframe após impressão (com delay para garantir que o diálogo de impressão abriu)
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      };
    } catch (error) {
      toast.error("Erro ao imprimir pedido");
    }
  };

  // Função antiga mantida para referência (não utilizada)
  const handlePrintOrderDirectOld = async (orderId: number) => {
    try {
      const orderData = allOrders.find(o => o.id === orderId);
      if (!orderData) {
        toast.error("Pedido não encontrado");
        return;
      }
      
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (!printWindow) {
        toast.error("Não foi possível abrir a janela de impressão.");
        return;
      }
      
      const itemsHtml = orderData.items?.map((item: any) => {
        const complementsHtml = item.complements && item.complements.length > 0
          ? item.complements.map((c: any) => {
              const qty = c.quantity || 1;
              const price = Number(c.price || 0);
              const totalPrice = price * qty;
              const priceStr = totalPrice > 0 ? ` R$ ${totalPrice.toFixed(2).replace('.', ',')}` : '';
              const qtyStr = qty > 1 ? `${qty}x ` : '';
              return `<div class="item-complement">↳ ${qtyStr}${c.name}${priceStr}</div>`;
            }).join('')
          : '';
        return `
          <div class="item">
            <div class="item-header">
              <span class="item-qty">${item.quantity}x ${item.productName.toUpperCase()}</span>
              <span class="item-price">R$ ${Number(item.totalPrice).toFixed(2).replace('.', ',')}</span>
            </div>
            ${complementsHtml}
            ${item.notes ? `<div class="item-obs">Obs: ${item.notes}</div>` : ''}
          </div>
        `;
      }).join('') || '';
      
      const discount = orderData.discount ? Number(orderData.discount) : 0;
      const deliveryBadge = orderData.deliveryType === 'delivery' ? (orderData.status === 'completed' ? 'ENTREGUE' : 'ENTREGA') : orderData.deliveryType === 'dine_in' ? 'CONSUMO LOCAL' : 'RETIRADA';
      const deliveryText = orderData.deliveryType === 'delivery' 
        ? `Entrega: ${orderData.customerAddress || 'Endereço não informado'}` 
        : orderData.deliveryType === 'dine_in'
        ? 'Consumo no local: Cliente irá consumir no estabelecimento'
        : 'Retirada: Cliente irá retirar no estabelecimento';
      
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pedido ${orderData.orderNumber?.startsWith('#') ? orderData.orderNumber : `#${orderData.orderNumber}`}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 13px; padding: 15px; max-width: 320px; margin: 0 auto; background: #fff; color: #333; }
            .receipt { background: #fff; padding: 5px; }
            .logo { text-align: center; padding-bottom: 15px; margin-bottom: 10px; }
            .logo h1 { font-size: 20px; font-weight: bold; margin: 0; }
            .logo p { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-top: 3px; }
            .order-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
            .order-header h2 { font-size: 16px; font-weight: bold; margin: 0; }
            .badge { background: #333; color: #fff; padding: 4px 10px; font-size: 10px; font-weight: bold; border-radius: 3px; }
            .order-date { font-size: 11px; color: #666; margin-bottom: 12px; display: flex; align-items: center; gap: 5px; }
            .divider-dashed { border: none; border-top: 1px dashed #ccc; margin: 12px 0; }
            .item { margin-bottom: 8px; }
            .item-header { display: flex; justify-content: space-between; font-weight: 500; font-size: 13px; }
            .item-obs { font-size: 11px; color: #666; margin-top: 2px; padding-left: 5px; }
            .item-complement { font-size: 11px; color: #555; margin-top: 2px; padding-left: 10px; }
            .totals { margin: 12px 0; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
            .total-highlight { background: #333; color: #fff; padding: 8px 12px; display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 8px; }
            .info-card { border: 1px solid #ddd; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; }
            .info-card-row { display: flex; justify-content: space-between; align-items: center; }
            .info-card-label { font-size: 12px; color: #666; display: flex; align-items: center; gap: 6px; }
            .info-card-value { font-size: 13px; font-weight: 500; }
            .info-card-text { font-size: 12px; color: #444; margin-top: 2px; }
            .footer { text-align: center; margin-top: 20px; padding-top: 10px; }
            .footer p { font-size: 11px; color: #666; line-height: 1.5; }
            @media print { body { padding: 5px; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="logo">
              <h1>${establishment?.name || 'Cardápio'}</h1>
              <p>Sistema de Pedidos</p>
            </div>
            
            <div class="order-header">
              <h2>Pedido ${orderData.orderNumber?.startsWith('#') ? orderData.orderNumber : `#${orderData.orderNumber}`}</h2>
              <span class="badge">${deliveryBadge}</span>
            </div>
            <div class="order-date">
              📅 ${format(new Date(orderData.createdAt), "dd/MM/yyyy")}, ${format(new Date(orderData.createdAt), "HH:mm")}
            </div>
            
            <hr class="divider-dashed">
            
            <div class="items">${itemsHtml}</div>
            
            <hr class="divider-dashed">
            
            <div class="totals">
              <div class="total-row"><span>Subtotal:</span><span>R$ ${Number(orderData.subtotal).toFixed(2).replace('.', ',')}</span></div>
              ${orderData.couponCode ? `<div class="total-row"><span>Cupom:</span><span>${orderData.couponCode}</span></div>` : ''}
              ${discount > 0 ? `<div class="total-row"><span>Desconto:</span><span>- R$ ${discount.toFixed(2).replace('.', ',')}</span></div>` : ''}
              ${Number(orderData.deliveryFee) > 0 ? `<div class="total-row"><span>Taxa entrega:</span><span>R$ ${Number(orderData.deliveryFee).toFixed(2).replace('.', ',')}</span></div>` : ''}
            </div>
            
            <div class="total-highlight">
              <span>TOTAL:</span>
              <span>R$ ${Number(orderData.total).toFixed(2).replace('.', ',')}</span>
            </div>
            
            <div style="margin-top: 15px;">
              <div class="info-card">
                <div class="info-card-text">${deliveryText}</div>
              </div>
              
              <div class="info-card">
                <div class="info-card-row">
                  ${orderData.paymentMethod === 'card_online' 
                    ? `<span class="info-card-label">💰 Pagamento confirmado \u2013 Cart\u00e3o online</span>`
                    : `<span class="info-card-label">💰 Pagamento</span>
                       <span class="info-card-value">${(paymentMethodLabels[orderData.paymentMethod]?.label || orderData.paymentMethod).toUpperCase()}</span>`
                  }
                </div>
              </div>
              
              <div class="info-card">
                <div class="info-card-row">
                  <span class="info-card-label">☆ Cliente</span>
                  <span class="info-card-value">${orderData.customerName || 'Não informado'} - ${orderData.customerPhone || ''}</span>
                </div>
              </div>
            </div>
            
            ${orderData.notes ? `<div class="info-card" style="margin-top: 10px;"><div class="info-card-label">📝 Observações</div><div class="info-card-text">${orderData.notes}</div></div>` : ''}
            
            <div class="footer">
              <p>Pedido realizado via Cardápio Admin<br>manus.space</p>
            </div>
          </div>
          <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
        </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
    } catch (error) {
      toast.error("Erro ao imprimir pedido");
    }
  };

  // Nota: Removido bloqueio para usuários sem estabelecimento - agora a página de Pedidos mostra normalmente

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  // Preferências de onboarding de status (persistidas no banco)
  const [preparingDismissed, setPreparingDismissed] = usePreference('onboarding_modal_dismissed_preparing', establishmentId);
  const [readyDismissed, setReadyDismissed] = usePreference('onboarding_modal_dismissed_ready', establishmentId);
  const [completedDismissed, setCompletedDismissed] = usePreference('onboarding_modal_dismissed_completed', establishmentId);

  // Helper: verificar se o modal de onboarding de status já foi dispensado
  const isStatusOnboardingDismissed = (statusType: 'preparing' | 'ready' | 'completed'): boolean => {
    if (!establishmentId) return true;
    if (statusType === 'preparing') return preparingDismissed === 'true';
    if (statusType === 'ready') return readyDismissed === 'true';
    if (statusType === 'completed') return completedDismissed === 'true';
    return false;
  };

  // Helper: verificar se a notificação correspondente está ativa
  const isNotificationActive = (statusType: 'preparing' | 'ready' | 'completed'): boolean => {
    if (!whatsappConfig) return false;
    if (whatsappStatus?.status !== 'connected') return false;
    switch (statusType) {
      case 'preparing': return whatsappConfig.notifyOnPreparing ?? true;
      case 'ready': return whatsappConfig.notifyOnReady ?? true;
      case 'completed': return whatsappConfig.notifyOnCompleted ?? false;
      default: return false;
    }
  };

  // Helper: salvar preferência de "não mostrar novamente"
  const dismissStatusOnboarding = (statusType: 'preparing' | 'ready' | 'completed') => {
    if (!establishmentId) return;
    if (statusType === 'preparing') setPreparingDismissed('true');
    if (statusType === 'ready') setReadyDismissed('true');
    if (statusType === 'completed') setCompletedDismissed('true');
  };

  // Executar a mudança de status real (chamado após o modal ou diretamente)
  const executeStatusUpdate = (orderId: number, newStatus: MutableOrderStatus) => {
    const order = allOrders.find((o: any) => o.id === orderId) || (orderDetails?.id === orderId ? orderDetails : null);

    if (newStatus === "completed" && shouldValidateIfoodDeliveryCode(order as any)) {
      const code = ifoodDeliveryCodeOrderId === orderId ? ifoodDeliveryCodeInput.trim() : "";
      setIfoodDeliveryCodeOrderId(orderId);

      if (!code) {
        toast.info("Informe o código de confirmação iFood para concluir esta entrega.");
        return;
      }

      setLoadingOrderId(orderId);
      validateIfoodDeliveryCodeMutation.mutate(
        { orderId, externalId: String((order as any).externalId), code },
        {
          onSettled: () => {
            setLoadingOrderId(null);
          },
        }
      );
      return;
    }

    // Smart driver assignment: intercept when marking as "ready" for DELIVERY orders only
    if (newStatus === "ready") {
      const order = allOrders.find((o: any) => o.id === orderId);
      const isDeliveryOrder = order?.deliveryType === 'delivery';

      if (isDeliveryOrder) {
        setLoadingOrderId(orderId);
        markReadyAndAssignMutation.mutate(
          { orderId },
          {
            onSettled: () => {
              setLoadingOrderId(null);
            },
          }
        );
        return;
      }
    }

    setLoadingOrderId(orderId);
    updateStatusMutation.mutate(
      { id: orderId, status: newStatus },
      {
        onSettled: () => {
          setLoadingOrderId(null);
        },
      }
    );
    
    if (newStatus === "preparing") {
      const printMethod = printerSettings?.defaultPrintMethod || 'normal';
      
      if (printMethod === 'automatic') {
        toast.success("📦 Pedido aceito!", {
          description: "Impressão automática enviada para o Mindi Printer.",
          duration: 4000,
        });
      } else {
        toast.success("📦 Pedido aceito!", {
          description: "Abrindo tela de impressão...",
          duration: 4000,
        });
        
        setTimeout(() => {
          handlePrintOrderDirect(orderId);
        }, 300);
      }
    }
  };

  const handleStatusUpdate = (orderId: number, newStatus: MutableOrderStatus) => {
    // Verificar se devemos mostrar o modal de onboarding contextual
    const statusType = newStatus as 'preparing' | 'ready' | 'completed';
    const order = allOrders.find((o: OrderItem) => o.id === orderId);
    const isIfoodOrder = (order as any)?.source === 'ifood' || Boolean((order as any)?.externalData?.merchant?.id);
    
    // Se existem entregadores e o pedido é delivery, pular o modal de "Pronto"
    // O entregador controla o fluxo via WhatsApp
    if (statusType === 'ready' && hasActiveDrivers) {
      if (order?.deliveryType === 'delivery') {
        // Executar diretamente sem modal
        executeStatusUpdate(orderId, newStatus);
        return;
      }
    }

    // Pedidos iFood não devem exibir o preview/onboarding de WhatsApp ao mudar status.
    // O fluxo do marketplace já trata as comunicações próprias; mantemos o modal apenas para pedidos não-iFood.
    if (isIfoodOrder && (statusType === 'preparing' || statusType === 'ready' || statusType === 'completed')) {
      executeStatusUpdate(orderId, newStatus);
      return;
    }
    
    if (
      (statusType === 'preparing' || statusType === 'ready' || statusType === 'completed') &&
      isNotificationActive(statusType) &&
      !isStatusOnboardingDismissed(statusType)
    ) {
      // Mostrar modal informativo antes de executar a ação
      setStatusOnboardingModal({
        open: true,
        statusType,
        orderId,
        dontShowAgain: false,
      });
      return;
    }

    // Sem modal: executar diretamente
    executeStatusUpdate(orderId, newStatus);
  };

  // Handler para confirmar ação no modal de onboarding
  const handleStatusOnboardingConfirm = () => {
    const { statusType, orderId, dontShowAgain } = statusOnboardingModal;
    if (!statusType || !orderId) return;

    // Salvar preferência se marcou "não mostrar novamente"
    if (dontShowAgain) {
      dismissStatusOnboarding(statusType);
    }

    // Fechar modal
    setStatusOnboardingModal({ open: false, statusType: null, orderId: null, dontShowAgain: false });

    // Executar a ação
    executeStatusUpdate(orderId, statusType);
  };

  const handleCancelOrder = () => {
    if (orderToCancel) {
      updateStatusMutation.mutate(
        { 
          id: orderToCancel, 
          status: "cancelled", 
          cancellationReason: cancellationReason || undefined,
          ifoodCancellationCode: orderToCancelIsIfood ? ifoodCancellationCode || undefined : undefined,
        },
        {
          onSuccess: () => {
            setCancelDialogOpen(false);
            setOrderToCancel(null);
            setCancellationReason("");
            setIfoodCancellationCode("");
            setOrderToCancelIsIfood(false);
            setOrderToCancelExternalId(null);
          },
        }
      );
    }
  };

  // Driver assignment states
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [driverModalOrderId, setDriverModalOrderId] = useState<number | null>(null);
  const [driverModalDrivers, setDriverModalDrivers] = useState<Array<{ id: number; name: string; whatsapp: string }>>([]);
  const [assigningDriverId, setAssigningDriverId] = useState<number | null>(null);
  // Context: 'accept' = modal opened on order accept (on_accepted), 'ready' = modal opened on mark ready
  const [driverModalContext, setDriverModalContext] = useState<'accept' | 'ready'>('ready');

  // Mutation for assigning driver on accept (doesn't change order status)
  const assignDriverOnAcceptMutation = trpc.driver.assignToOrder.useMutation({
    onSuccess: (result) => {
      toast.success("Entregador atribuído!" + (result.whatsappSent ? " Notificação enviada via WhatsApp." : ""));
      setDriverModalOpen(false);
      setDriverModalOrderId(null);
      setAssigningDriverId(null);
      setDriverModalContext('ready');
      utils.orders.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atribuir entregador");
      setAssigningDriverId(null);
    },
  });

  // Smart driver assignment mutation
  const markReadyAndAssignMutation = trpc.orders.markReadyAndAssign.useMutation({
    onSuccess: (result: any, variables) => {
      if (result.action === 'marked_ready') {
        // No active drivers, just marked as ready
        toast.success("Pedido pronto para entrega!");
      } else if (result.action === 'choose_driver') {
        // Multiple drivers, show modal
        setDriverModalOrderId(variables.orderId);
        setDriverModalDrivers(result.drivers || []);
        setDriverModalOpen(true);
        toast.info("Selecione o entregador para este pedido");
      } else if (result.action === 'ifood_delivery') {
        toast.success("Pedido pronto. Aguarde o entregador iFood no fluxo logístico do marketplace.");
      } else if (result.action === 'assigned') {
        // Auto-assigned or manually selected
        let msg = "Pedido em entrega!";
        if (result.customerNotified) {
          msg += " Notificação enviada ao cliente.";
        } else if (result.whatsappSent) {
          msg += " Notificação enviada ao entregador.";
        }
        toast.success(msg);
        setDriverModalOpen(false);
        setDriverModalOrderId(null);
        setAssigningDriverId(null);
      }
      // Mostrar warning se sincronização com iFood falhou
      if (result?.ifoodWarning) {
        toast.warning(`Sincronização iFood: ${result.ifoodWarning}`, { duration: 8000 });
      }
      utils.orders.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atribuir entregador");
      setAssigningDriverId(null);
    },
  });

  const getNextAction = (status: OrderStatus, order?: OrderItem): { label: string; newStatus: MutableOrderStatus; disabled?: boolean; driverControlled?: boolean } | null => {
    switch (status) {
      case "new":
        return { label: "Aceitar", newStatus: "preparing" };
      case "preparing":
        return { label: "Despachar", newStatus: "ready" };
      case "ready":
      case "out_for_delivery": {
        const isIfoodOrder = (order as any)?.source === 'ifood' || Boolean((order as any)?.externalData?.merchant?.id);

        // Se existem entregadores e o pedido é delivery, o entregador controla a finalização.
        // Para pedidos iFood, não usamos a modal/fluxo informativo de entregador via WhatsApp,
        // pois o marketplace tem fluxo próprio de entrega e confirmação.
        if (hasActiveDrivers && order?.deliveryType === 'delivery' && !isIfoodOrder) {
          // Se o pedido está em entrega há mais de 1 hora, permitir que o dono finalize diretamente
          const orderAgeMs = Date.now() - new Date(order.updatedAt || order.createdAt).getTime();
          const ONE_HOUR_MS = 60 * 60 * 1000;
          if (status === 'out_for_delivery' && orderAgeMs > ONE_HOUR_MS) {
            return { label: "Finalizar", newStatus: "completed" };
          }
          return { label: "Entregador", newStatus: "completed", disabled: true, driverControlled: true };
        }
        if (shouldValidateIfoodDeliveryCode(order as any)) {
          return { label: "Validar código", newStatus: "completed" };
        }
        return { label: "Finalizar", newStatus: "completed" };
      }
      default:
        return null;
    }
  };

  // Função para toggle de expansão das colunas no mobile
  const toggleColumnExpansion = (columnId: OrderStatus) => {
    setExpandedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };


  // Busca global
  const { searchQuery: globalSearch } = useSearch();

  // Filtrar pedidos pela busca global (número do pedido, nome do cliente)
  const filteredOrders = useMemo(() => {
    if (!allOrders || !globalSearch.trim()) return allOrders;
    const term = globalSearch.toLowerCase().trim();
    return allOrders.filter((o: typeof allOrders[number]) =>
      (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
      (o.customerName && o.customerName.toLowerCase().includes(term)) ||
      (o.customerPhone && o.customerPhone.includes(term))
    );
  }, [allOrders, globalSearch]);

  // Estado para guardar o timestamp de quando cada coluna foi limpa manualmente
  // Com reset diário: se o timestamp salvo for de um dia anterior, limpar
  const [clearTimestamps, setClearTimestamps] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('clearedColumns');
      if (stored) {
        const parsed = JSON.parse(stored);
        const clearedAt = new Date(parsed.timestamp || parsed.clearedAt?.completed || parsed.clearedAt?.cancelled || Date.now());
        const now = new Date();
        // Se o timestamp salvo for de um dia diferente, resetar
        if (clearedAt.toDateString() !== now.toDateString()) {
          localStorage.removeItem('clearedColumns');
          return {};
        }
        return parsed.clearedAt || {};
      }
    } catch {}
    return {};
  });

  // Agrupar pedidos por status para o Kanban
  type OrderItem = typeof allOrders[number];
  const ordersByStatus = useMemo<Record<string, OrderItem[]>>(() => ({
    new: filteredOrders?.filter((o: OrderItem) => o.status === "new") ?? [],
    preparing: filteredOrders?.filter((o: OrderItem) => o.status === "preparing") ?? [],
    ready: filteredOrders?.filter((o: OrderItem) => o.status === "ready" || o.status === "out_for_delivery") ?? [],
    completed: filteredOrders?.filter((o: OrderItem) => {
      if (o.status !== "completed") return false;
      const orderTime = new Date(o.updatedAt || o.createdAt);
      // Filtro diário: só mostrar pedidos de hoje
      if (orderTime < todayStart) return false;
      // Limpeza manual: esconder pedidos anteriores ao timestamp de limpeza
      if (clearTimestamps.completed) {
        const clearedAt = new Date(clearTimestamps.completed);
        if (orderTime <= clearedAt) return false;
      }
      return true;
    }) ?? [],
    cancelled: filteredOrders?.filter((o: OrderItem) => {
      if (o.status !== "cancelled") return false;
      const orderTime = new Date(o.updatedAt || o.createdAt);
      // Filtro diário: só mostrar pedidos de hoje
      if (orderTime < todayStart) return false;
      // Limpeza manual: esconder pedidos anteriores ao timestamp de limpeza
      if (clearTimestamps.cancelled) {
        const clearedAt = new Date(clearTimestamps.cancelled);
        if (orderTime <= clearedAt) return false;
      }
      return true;
    }) ?? [],
  }), [filteredOrders, clearTimestamps, todayStart]);


  // === PAGINAÇÃO ===
  const KANBAN_PAGE_SIZE = 50;
  const LIST_PAGE_SIZE = 40;
  // Página atual por coluna no Kanban (apenas completed/cancelled)
  const [kanbanPage, setKanbanPage] = useState<Record<string, number>>({ completed: 0, cancelled: 0 });
  // Página atual na visualização de lista
  const [listPage, setListPage] = useState(0);

  // Reset de página ao mudar filtro de lista
  useEffect(() => { setListPage(0); }, [listStatusFilter]);

  // Handler para limpeza manual de coluna (persiste no localStorage)
  const handleManualClear = (columnId: OrderStatus) => {
    const now = new Date().toISOString();
    setClearTimestamps(prev => {
      const next = { ...prev, [columnId]: now };
      // Persistir no localStorage
      try {
        localStorage.setItem('clearedColumns', JSON.stringify({
          clearedAt: next,
          timestamp: now,
        }));
      } catch {}
      return next;
    });
    // Manter compatibilidade com manuallyClearedColumns para o estado visual
    setManuallyClearedColumns(prev => {
      const next = new Set(prev);
      next.add(columnId);
      return next;
    });
    toast.success(columnId === "completed" ? "Pedidos completos limpos" : "Pedidos cancelados limpos");
  };

  // Reset diário automático: verificar a cada 60s se o dia mudou
  useEffect(() => {
    if (manuallyClearedColumns.size === 0) return;
    const checkReset = () => {
      try {
        const stored = localStorage.getItem('clearedColumns');
        if (stored) {
          const parsed = JSON.parse(stored);
          const clearedAt = new Date(parsed.timestamp);
          if (clearedAt < todayStart) {
            localStorage.removeItem('clearedColumns');
            setManuallyClearedColumns(new Set());
            setClearTimestamps({});
          }
        }
      } catch {}
    };
    checkReset();
    const interval = setInterval(checkReset, 60000);
    return () => clearInterval(interval);
  }, [todayStart, manuallyClearedColumns.size]);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Pedidos"
          description="Gerencie os pedidos do seu estabelecimento"
          icon={<ClipboardList className="h-6 w-6 text-blue-600" />}
        />
        {/* Toggle Kanban/Lista + WhatsApp Status */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Botão de configurações de pedidos */}
          <div className="relative">
            <button
              onClick={() => setShowOrderSettingsDropdown(!showOrderSettingsDropdown)}
              className={cn(
                "flex items-center justify-center w-[42px] h-[42px] rounded-lg border text-xs font-medium transition-colors",
                autoAcceptOrders
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
            {showOrderSettingsDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowOrderSettingsDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-card rounded-xl shadow-lg border border-border p-4 w-72">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className={cn(
                        "p-2 rounded-lg shrink-0 transition-colors",
                        autoAcceptOrders ? "bg-emerald-100" : "bg-muted/50"
                      )}>
                        <CheckCircle className={cn("h-4 w-4", autoAcceptOrders ? "text-emerald-600" : "text-muted-foreground")} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Aceitar automaticamente</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Pedidos entram direto como "Em preparo"</p>
                      </div>
                    </div>
                    <Switch
                      checked={autoAcceptOrders}
                      onCheckedChange={(checked) => {
                        if (establishment) {
                          updateAutoAcceptMutation.mutate({ id: establishment.id, autoAcceptOrders: checked });
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Toggle de visualização */}
          <SlidingTabs
            options={[
              { value: 'kanban' as const, label: <span className="flex items-center gap-1.5"><LayoutGrid className="h-3.5 w-3.5" />Kanban</span> },
              { value: 'list' as const, label: <span className="flex items-center gap-1.5"><List className="h-3.5 w-3.5" />Lista</span> },
            ]}
            value={viewMode}
            onChange={(v) => { setViewMode(v); localStorage.setItem('pedidos_viewMode', v); setUserManuallySelected(true); localStorage.setItem('pedidos_viewMode_manual', 'true'); }}
            className="rounded-xl"
          />
          {/* Modelo 16: Mindi Barra Status */}
          <div className={cn(
            "inline-flex items-center overflow-hidden rounded-xl border bg-white dark:bg-gray-900 h-[42px]",
            !isWhatsappFetched || isWhatsappLoading
              ? "border-gray-300 dark:border-gray-600"
              : whatsappStatus?.status === 'connected'
                ? "border-green-200 dark:border-green-800"
                : "border-red-200 dark:border-red-500"
          )}>
            {/* Barra lateral com ícone WhatsApp */}
            <div className={cn(
              "px-2.5 py-2 flex items-center justify-center self-stretch",
              !isWhatsappFetched || isWhatsappLoading
                ? "bg-gray-400"
                : whatsappStatus?.status === 'connected'
                  ? "bg-green-500"
                  : "bg-red-500"
            )}>
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            {/* Status com Tooltip */}
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5",
                    !isWhatsappFetched || isWhatsappLoading
                      ? "cursor-default"
                      : whatsappStatus?.status === 'connected'
                        ? "cursor-default"
                        : "cursor-pointer hover:bg-muted/50 transition-colors"
                  )}
                  onClick={() => {
                    if (isWhatsappFetched && !isWhatsappLoading && whatsappStatus?.status !== 'connected') {
                      setQrCodeModalOpen(true);
                      connectWhatsapp.mutate();
                    }
                  }}
                >
                  {!isWhatsappFetched || isWhatsappLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Verificando...</span>
                    </>
                  ) : whatsappStatus?.status === 'connected' ? (
                    <>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Conectado</span>
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Conectar</span>
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {whatsappStatus?.status === 'connected' && whatsappStatus?.phone ? (
                  <p>Número conectado:<br/><strong>{whatsappStatus.phone.replace(/^55(\d{2})(\d{5})(\d{4})$/, '+55 $1 $2-$3').replace(/^55(\d{2})(\d{4})(\d{4})$/, '+55 $1 $2-$3')}</strong></p>
                ) : (
                  <p>Clique para conectar via QR Code</p>
                )}
              </TooltipContent>
            </Tooltip>
            {/* Botão de desconectar - apenas quando conectado */}
            {isWhatsappFetched && !isWhatsappLoading && whatsappStatus?.status === 'connected' && (
              <>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center px-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-red-100 dark:hover:bg-red-950/30 text-red-500"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja desconectar o WhatsApp?')) {
                            disconnectWhatsapp.mutate();
                          }
                        }}
                        disabled={disconnectWhatsapp.isPending}
                      >
                        <Link2Off className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Desconectar WhatsApp</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:h-[calc(100vh-200px)]">
        {kanbanColumns.map((column) => {
          const columnOrders = ordersByStatus[column.id];
          const Icon = column.icon;
          const isExpanded = expandedColumns.has(column.id);
          
          return (
            <div 
              key={column.id}
              className={cn(
                "bg-card rounded-2xl flex flex-col overflow-hidden border border-border/50 border-t-4",
                column.borderColor,
                // Card de Cancelados: visível apenas no mobile
                column.id === "cancelled" && "md:hidden"
              )}
            >
              {/* Column Header - clicável no mobile para expandir/minimizar */}
              <div 
                className="px-5 py-5 flex items-start justify-between gap-2 cursor-pointer md:cursor-default select-none"
                onClick={() => toggleColumnExpansion(column.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    {/* Ícone de 3 pontinhos para editar título (apenas PREPARO, PRONTOS, COMPLETOS) */}
                    {column.id !== "new" && column.id !== "cancelled" ? (
                      editingStatusLabel === column.id ? (
                        <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editingStatusValue}
                            onChange={(e) => setEditingStatusValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveStatusLabel(column.id);
                              if (e.key === 'Escape') setEditingStatusLabel(null);
                            }}
                            className="h-7 text-sm font-semibold uppercase tracking-wide px-2 py-0"
                            maxLength={20}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveStatusLabel(column.id)}
                            className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
                          >
                            <Check className="h-4 w-4 text-emerald-500" />
                          </button>
                          <button
                            onClick={() => setEditingStatusLabel(null)}
                            className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-0.5 -ml-1 rounded hover:bg-muted/80 transition-colors cursor-pointer"
                              >
                                <MoreVertical className="h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="min-w-[160px]">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingStatusValue(getStatusLabel(column.id));
                                  setEditingStatusLabel(column.id);
                                }}
                                className="cursor-pointer"
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar título
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestoreStatusLabel(column.id);
                                }}
                                className="cursor-pointer"
                                disabled={!customStatusLabels?.[column.id]}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Restaurar título
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <h3 className="font-semibold text-base">{getStatusLabel(column.id)}</h3>
                        </>
                      )
                    ) : (
                      <h3 className="font-semibold text-base">{column.id === "new" ? column.title : getStatusLabel(column.id)}</h3>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={cn("w-2 h-2 rounded-full", column.dotColor)} />
                    <span className="text-2xl font-bold tracking-tight">{columnOrders.length}</span>
                    <span className="text-xs text-muted-foreground">ativos</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(column.id === "completed" || column.id === "cancelled") && columnOrders.length > 0 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setClearColumnTarget(column.id);
                              setClearConfirmOpen(true);
                            }}
                            className={cn(
                              "relative p-2.5 rounded-lg shrink-0 transition-transform duration-200 hover:scale-110 active:scale-95 cursor-pointer",
                              column.iconBg,
                              "hover:opacity-80 hover:shadow-md"
                            )}
                          >
                            {/* Efeito pulse atrás do botão - apenas para cancelados */}
                            {column.id === "cancelled" && <span className="absolute inset-0 rounded-lg bg-red-400/30" style={{ animationDuration: "2s" }} />}
                            <Eraser className={cn("h-5 w-5 relative z-10", column.iconColor)} />
                            {/* Badge com contador */}
                            <span className="absolute -top-1.5 -right-1.5 z-20 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm">
                              {columnOrders.length}
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[200px] text-center">
                          <p className="text-xs">Limpar pedidos do status "{column.id === "completed" ? "Completos" : "Cancelados"}"</p>
                        </TooltipContent>
                      </Tooltip>
                  ) : (
                    <div className={cn("p-2.5 rounded-lg shrink-0", column.iconBg)}>
                      <Icon className={cn("h-5 w-5", column.iconColor)} />
                    </div>
                  )}
                  {/* Seta de expansão - visível apenas no mobile */}
                  <ChevronDown className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-200 md:hidden",
                    isExpanded && "rotate-180"
                  )} />
                </div>
              </div>

              {/* Column Content - colapsável no mobile */}
              <div className={cn(
                "flex-1 overflow-y-auto px-3 pb-3 space-y-3 transition-colors duration-200",
                // No mobile: esconde se não expandido
                !isExpanded && "max-h-0 pb-0 overflow-hidden md:max-h-none md:pb-3 md:overflow-y-auto"
              )}>
                {isLoading ? (
                  // Loading skeleton
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-card rounded-xl p-4 shadow-sm">
                        <div className="skeleton h-4 w-20 rounded mb-2" />
                        <div className="skeleton h-3 w-full rounded mb-1" />
                        <div className="skeleton h-3 w-2/3 rounded" />
                      </div>
                    ))}
                  </div>
                ) : columnOrders.length > 0 ? (
                  // Order cards with animations
                  <>
                  <AnimatePresence mode="popLayout" initial={false}>
                  {(() => {
                    // Paginar apenas colunas completed/cancelled
                    const needsPagination = (column.id === 'completed' || column.id === 'cancelled') && columnOrders.length > KANBAN_PAGE_SIZE;
                    const page = kanbanPage[column.id] || 0;
                    const displayOrders = needsPagination
                      ? columnOrders.slice(page * KANBAN_PAGE_SIZE, (page + 1) * KANBAN_PAGE_SIZE)
                      : columnOrders;
                    return displayOrders.map((order: OrderItem) => {
                    // Na coluna "Prontos", usar sempre a cor verde da coluna (ready) em vez da cor individual do status
                    const displayStatus = column.id === 'ready' ? 'ready' : order.status;
                    const config = statusConfig[displayStatus as OrderStatus];
                    const nextAction = getNextAction(order.status as OrderStatus, order);
                    const PaymentIcon = paymentMethodLabels[order.paymentMethod]?.icon || CreditCard;

                    return (
                      <motion.div
                        key={order.id}
                        layout
                        initial={ORDER_CARD_INITIAL}
                        animate={ORDER_CARD_ANIMATE}
                        exit={ORDER_CARD_EXIT}
                        transition={ORDER_CARD_TRANSITION}
                        className="relative"
                      >
                        {/* Aba iFood atrás do card - como elemento irmão */}
                        {(order as any).source === 'ifood' && (
                          <div className="flex justify-end" style={{paddingRight: '12px', marginBottom: '-6px'}}>
                             <div className="animate-delivery-pulse bg-red-500 text-white text-[10px] font-bold flex items-center justify-center overflow-hidden" style={{borderRadius: '8px 8px 0 0', paddingLeft: '14px', paddingRight: '14px', height: '22px', paddingBottom: '4px', position: 'relative'}}>
                               <span>via iFood</span>
                             </div>
                          </div>
                        )}
                        <div className={"bg-card rounded-xl border border-border/50 shadow-soft hover:shadow-elevated transition-shadow duration-200 relative overflow-hidden"} style={{height: '136px'}}>

                        {/* Header colorido com ícone - estilo original */}
                        <div className={cn("px-3 py-2 flex items-center justify-between rounded-t-xl relative z-10", config.bgColor)} style={{height: '48px'}}>
                          <div className="flex items-center gap-2 xl:gap-3 min-w-0">
                            <div className={cn("p-1.5 rounded-full bg-card/90 shadow-sm shrink-0", config.color)}>
                              <config.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className={cn("font-bold text-sm", config.color)}>
                                  {order.orderNumber?.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`}
                                </span>

                              </div>
                              <span className={cn("py-0.5 font-bold uppercase tracking-wide w-fit", order.deliveryType === "delivery" && column.id !== 'completed' && "")} style={{borderRadius: '5px', fontSize: '8px', height: '16px', paddingRight: '5px', paddingLeft: '5px', color: config.badgeText, backgroundColor: config.badgeBg}}>
                                {order.deliveryType === "delivery" ? (order.status === 'out_for_delivery' ? "Em Rota" : column.id === 'completed' ? "Entregue" : "Entrega") : order.deliveryType === "dine_in" ? "Consumo" : "Retirada"}
                              </span>
                            </div>
                          </div>
                          <div className={cn("flex items-center gap-1 text-xs font-medium shrink-0", config.color)}>
                            <Clock className="h-3.5 w-3.5" />
                            {(() => {
                              const diffMs = Date.now() - new Date(order.createdAt).getTime();
                              const diffMins = Math.floor(diffMs / 60000);
                              const diffHours = Math.floor(diffMins / 60);
                              if (diffMins < 1) return 'agora';
                              if (diffMins < 60) return `${diffMins} min`;
                              return `${diffHours}h`;
                            })()}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="px-3 relative z-10" style={{height: '83px', paddingTop: '9px', paddingBottom: '9px'}}>

                          {/* Linha compacta com todas as informações */}
                          <div className="flex items-center justify-between gap-1.5 xl:gap-2">
                            <div className="flex items-center gap-1.5 xl:gap-2 min-w-0 flex-1 overflow-hidden">
                              {/* Nome do cliente */}
                              {order.customerName && (
                                <span className="font-semibold text-sm truncate max-w-[60px] lg:max-w-[80px] xl:max-w-[120px]">
                                  {order.customerName}
                                </span>
                              )}
                              
                              {/* Separador */}
                              {order.customerName && (
                                <span className="text-muted-foreground/50">•</span>
                              )}
                              
                              {/* Ícone e método de pagamento */}
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <PaymentIcon className="h-3.5 w-3.5 shrink-0" />
                                <span className="hidden xl:inline truncate">{paymentMethodLabels[order.paymentMethod]?.label}</span>
                              </span>
                              

                            </div>
                            
                            {/* Valor total */}
                            <span className="text-sm xl:text-base font-bold text-primary whitespace-nowrap shrink-0">
                              {formatCurrency(order.total)}
                            </span>
                          </div>

                          {/* Actions - Botões completos */}
                          <div className="flex gap-1 xl:gap-1.5 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 rounded-lg border-border/50 hover:bg-accent text-xs"
                              onClick={() => setSelectedOrder(order.id)}
                            >
                              <span className="hidden xl:inline">Ver detalhes</span>
                              <span className="xl:hidden">Detalhes</span>
                            </Button>
                            {nextAction && (
                              nextAction.driverControlled ? (
                                <div
                                  className="flex-1 h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-sm cursor-pointer hover:opacity-90 transition-opacity text-white" style={{ backgroundColor: '#059669' }}
                                  onClick={() => { setDriverInfoOrderId(order.id); setDriverInfoModalOpen(true); }}
                                >
                                  <Bike className="h-3.5 w-3.5 xl:hidden shrink-0" />
                                  <span className="hidden xl:inline">Entregador</span>
                                  <span className="xl:hidden">Entreg.</span>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  className="flex-1 h-8 rounded-lg shadow-sm text-xs hover:opacity-90"
                                  style={{ backgroundColor: config.badgeBg, color: config.badgeText }}
                                  onClick={() => handleStatusUpdate(order.id, nextAction.newStatus)}
                                  disabled={loadingOrderId !== null}
                                >
                                  {loadingOrderId === order.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    nextAction.label
                                  )}
                                </Button>
                              )
                            )}
                            {order.status !== "completed" && order.status !== "cancelled" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                                onClick={() => {
                                  setOrderToCancel(order.id);
                                  setOrderToCancelIsIfood((order as any).source === 'ifood');
                                  setOrderToCancelExternalId((order as any).externalId || null);
                                  setIfoodCancellationCode("");
                                  setCancelDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        </div>

                      </motion.div>
                    );
                  });
                  })()}
                  </AnimatePresence>
                  {/* Paginação Kanban para completed/cancelled */}
                  {(column.id === 'completed' || column.id === 'cancelled') && columnOrders.length > KANBAN_PAGE_SIZE && (
                    <div className="flex items-center justify-between px-2 py-2 mt-2 bg-muted/50 rounded-lg">
                      <button
                        disabled={(kanbanPage[column.id] || 0) === 0}
                        onClick={() => setKanbanPage(prev => ({ ...prev, [column.id]: (prev[column.id] || 0) - 1 }))}
                        className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {(kanbanPage[column.id] || 0) * KANBAN_PAGE_SIZE + 1}-{Math.min(((kanbanPage[column.id] || 0) + 1) * KANBAN_PAGE_SIZE, columnOrders.length)} de {columnOrders.length}
                      </span>
                      <button
                        disabled={((kanbanPage[column.id] || 0) + 1) * KANBAN_PAGE_SIZE >= columnOrders.length}
                        onClick={() => setKanbanPage(prev => ({ ...prev, [column.id]: (prev[column.id] || 0) + 1 }))}
                        className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  </>
                ) : (
                  // Empty state placeholder - informativo, não clicável
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-default select-none min-h-[140px]",
                      column.placeholderBorder,
                      column.placeholderBg
                    )} style={{height: '135px'}}
                  >
                    {column.id === "new" ? (
                      // Coluna Novos: ícone de loading animado
                      <>
                        <Loader2 className="h-8 w-8 text-blue-400 mb-2 animate-spin" />
                        <span className="text-sm text-blue-500">Aguardando pedidos…</span>
                      </>
                    ) : column.id === "preparing" ? (
                      // Coluna Preparo: ícone de chef
                      <>
                        <ChefHat className="h-8 w-8 text-red-300 mb-2" />
                        <span className="text-sm text-red-400">Nenhum pedido em preparo</span>
                      </>
                    ) : column.id === "ready" ? (
                      // Coluna Prontos: ícone de pacote
                      <>
                        <Package className="h-8 w-8 text-emerald-300 mb-2" />
                        <span className="text-sm text-emerald-400">Nenhum pedido pronto</span>
                      </>
                    ) : (
                      // Coluna Completos: ícone de check
                      <>
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
                        <span className="text-sm text-muted-foreground">Nenhum pedido finalizado</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      ) : (
      /* Lista Compacta */
      <div className="space-y-4">
        {/* Filtros de status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setListStatusFilter('all')}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors border",
              listStatusFilter === 'all' ? "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700" : "bg-card border-border text-muted-foreground hover:text-foreground"
            )}
          >
            Todos
            <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-semibold bg-gray-500 text-white">
              {(ordersByStatus.new?.length || 0) + (ordersByStatus.preparing?.length || 0) + (ordersByStatus.ready?.length || 0) + (ordersByStatus.completed?.length || 0) + (ordersByStatus.cancelled?.length || 0)}
            </span>
          </button>
          {kanbanColumns.map((col) => {
            const count = ordersByStatus[col.id]?.length || 0;
            return (
              <button
                key={col.id}
                onClick={() => setListStatusFilter(col.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors border",
                  listStatusFilter === col.id ? `${col.tabBg} ${col.tabText} ${col.tabBorder}` : "bg-card border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn("w-2.5 h-2.5 rounded-full", col.dotColor)} />
                {col.id === "new" || col.id === "cancelled" ? col.title : getStatusLabel(col.id)}
                <span className={cn("min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-semibold text-white", col.badgeBg)}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tabela compacta */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          {/* Header da tabela */}
          <div className="grid grid-cols-[100px_1fr_70px_140px_110px_120px_120px_150px] gap-3 px-5 py-3.5 bg-muted/50 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Status</span>
            <span>Pedido</span>
            <span>Tempo</span>
            <span>Cliente</span>
            <span>Tipo</span>
            <span>Pagamento</span>
            <span className="text-right">Valor</span>
            <span className="text-right">Ações</span>
          </div>

          {/* Linhas */}
          <div className="divide-y divide-border/30">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[100px_1fr_70px_140px_110px_120px_120px_150px] gap-3 px-5 py-3.5 items-center">
                  <div className="skeleton h-5 w-20 rounded" />
                  <div className="skeleton h-4 w-24 rounded" />
                  <div className="skeleton h-4 w-12 rounded" />
                  <div className="skeleton h-4 w-20 rounded" />
                  <div className="skeleton h-4 w-16 rounded" />
                  <div className="skeleton h-4 w-16 rounded" />
                  <div className="skeleton h-4 w-16 rounded ml-auto" />
                  <div className="skeleton h-7 w-20 rounded ml-auto" />
                </div>
              ))
            ) : (() => {
              const listOrders = listStatusFilter === 'all'
                ? [...(ordersByStatus.new || []), ...(ordersByStatus.preparing || []), ...(ordersByStatus.ready || []), ...(ordersByStatus.completed || []), ...(ordersByStatus.cancelled || [])]
                : ordersByStatus[listStatusFilter] || [];

              if (listOrders.length === 0) {
                return (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <Inbox className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum pedido encontrado</p>
                  </div>
                );
              }

              const totalPages = Math.ceil(listOrders.length / LIST_PAGE_SIZE);
              const paginatedOrders = listOrders.slice(listPage * LIST_PAGE_SIZE, (listPage + 1) * LIST_PAGE_SIZE);

              return paginatedOrders.map((order: OrderItem) => {
                const config = statusConfig[order.status as OrderStatus];
                const nextAction = getNextAction(order.status as OrderStatus, order);
                const PaymentIcon = paymentMethodLabels[order.paymentMethod]?.icon || CreditCard;
                const diffMs = Date.now() - new Date(order.createdAt).getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                const timeStr = diffMins < 1 ? 'agora' : diffMins < 60 ? `${diffMins} min` : `${diffHours}h`;

                return (
                  <div
                    key={order.id}
                    className="grid grid-cols-[100px_1fr_70px_140px_110px_120px_120px_150px] gap-3 px-5 py-3.5 items-center hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order.id)}
                  >
                    {/* Status badge */}
                    <span
                      className="inline-flex items-center justify-center py-1.5 px-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: config.badgeBg, color: config.badgeText }}
                    >
                      {config.label}
                    </span>

                    {/* Pedido info */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn("font-bold text-base", config.color)}>
                        {order.orderNumber?.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`}
                      </span>
                      {(order as any).source === 'ifood' && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-lg">iFood</span>
                      )}
                    </div>

                    {/* Tempo */}
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {timeStr}
                    </span>

                    {/* Cliente */}
                    <span className="text-sm font-medium truncate">{order.customerName || '—'}</span>

                    {/* Tipo de entrega */}
                    <span
                      className="inline-flex items-center justify-center py-0.5 font-bold uppercase tracking-wide w-fit"
                      style={{ borderRadius: '5px', fontSize: '9px', height: '18px', paddingRight: '6px', paddingLeft: '6px', color: config.badgeText, backgroundColor: config.badgeBg }}
                    >
                      {order.deliveryType === 'delivery' ? (order.status === 'out_for_delivery' ? 'Em Rota' : order.status === 'completed' ? 'Entregue' : 'Entrega') : order.deliveryType === 'dine_in' ? 'Consumo' : 'Retirada'}
                    </span>

                    {/* Pagamento */}
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <PaymentIcon className="h-4 w-4" />
                      {paymentMethodLabels[order.paymentMethod]?.label || order.paymentMethod}
                    </span>

                    {/* Valor */}
                    <span className="text-base font-bold text-primary text-right">{formatCurrency(order.total)}</span>

                    {/* Ações */}
                    <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                      {nextAction && (
                        nextAction.driverControlled ? (
                          <div
                            className="h-8 px-4 rounded-lg text-xs font-semibold flex items-center justify-center shadow-sm cursor-pointer hover:opacity-90 transition-opacity text-white" style={{ backgroundColor: '#059669' }}
                            onClick={() => { setDriverInfoOrderId(order.id); setDriverInfoModalOpen(true); }}
                          >
                            Entregador
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="h-8 px-4 rounded-lg text-xs font-semibold shadow-sm hover:opacity-90"
                            style={{ backgroundColor: config.badgeBg, color: config.badgeText }}
                            onClick={() => handleStatusUpdate(order.id, nextAction.newStatus)}
                            disabled={loadingOrderId !== null}
                          >
                            {loadingOrderId === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              nextAction.label
                            )}
                          </Button>
                        )
                      )}
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                          onClick={() => {
                            setOrderToCancel(order.id);
                            setOrderToCancelIsIfood((order as any).source === 'ifood');
                            setOrderToCancelExternalId((order as any).externalId || null);
                            setIfoodCancellationCode("");
                            setCancelDialogOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          {/* Paginação da Lista */}
          {(() => {
            const listOrders = listStatusFilter === 'all'
              ? [...(ordersByStatus.new || []), ...(ordersByStatus.preparing || []), ...(ordersByStatus.ready || []), ...(ordersByStatus.completed || []), ...(ordersByStatus.cancelled || [])]
              : ordersByStatus[listStatusFilter] || [];
            const totalPages = Math.ceil(listOrders.length / LIST_PAGE_SIZE);
            if (totalPages <= 1) return null;
            return (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 bg-muted/30">
                <span className="text-sm text-muted-foreground">
                  {listPage * LIST_PAGE_SIZE + 1}-{Math.min((listPage + 1) * LIST_PAGE_SIZE, listOrders.length)} de {listOrders.length} pedidos
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={listPage === 0}
                    onClick={() => setListPage(p => p - 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </button>
                  <span className="text-sm font-medium text-muted-foreground">
                    {listPage + 1} / {totalPages}
                  </span>
                  <button
                    disabled={listPage >= totalPages - 1}
                    onClick={() => setListPage(p => p + 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Próxima <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      )}

      {/* Order Details Sidebar */}
      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent side="right" className={`w-full p-0 overflow-hidden flex flex-row transition-all duration-300 ${complementModalProduct ? 'sm:max-w-[900px]' : 'sm:max-w-md'}`} hideCloseButton>
          {/* Painel de complementos inline - aparece à esquerda */}
          {complementModalProduct && (
            <div className="w-full sm:w-[420px] shrink-0 border-r border-border/50 flex flex-col bg-background overflow-hidden">
              {/* Header do painel de complementos */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <div>
                  <h3 className="text-lg font-bold">{complementModalProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">Selecione os complementos para adicionar ao pedido</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { setComplementModalProduct(null); setSelectedComplements(new Map()); setComplementQuantity(1); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {/* Conteúdo scrollável */}
              <div className="flex-1 overflow-y-auto">
                {complementsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Carregando complementos...</span>
                  </div>
                ) : complementsQuery.data && (complementsQuery.data as any[]).length > 0 ? (
                  <ComplementGroups
                    groups={(complementsQuery.data as any[]).map(g => ({
                      id: g.id,
                      name: g.name,
                      minQuantity: g.minQuantity ?? 0,
                      maxQuantity: g.maxQuantity ?? 1,
                      isRequired: g.isRequired ?? false,
                      items: (g.items || []).map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        price: String(item.price ?? '0'),
                        priceMode: item.priceMode,
                        imageUrl: item.imageUrl || null,
                        description: item.description || undefined,
                        badgeText: item.badgeText || undefined,
                      })),
                    }))}
                    selectedComplements={selectedComplements}
                    onSelectedComplementsChange={setSelectedComplements}
                    getPrice={(item) => Number(item.price)}
                    formatPrice={(value) => formatCurrency(value)}
                    idPrefix="order-complement"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <span className="text-sm">Nenhum complemento disponível</span>
                  </div>
                )}
              </div>
              {/* Footer com quantidade e botão */}
              <div className="border-t border-border px-5 py-4 bg-background">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Quantidade:</span>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setComplementQuantity(Math.max(1, complementQuantity - 1))} disabled={complementQuantity <= 1}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-base font-semibold w-6 text-center">{complementQuantity}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setComplementQuantity(complementQuantity + 1)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {(() => {
                  const groups = (complementsQuery.data || []) as ComplementGroup[];
                  const getPrice = (item: ComplementItem) => Number(item.price);
                  const complementsTotal = calculateComplementsTotal(groups, selectedComplements, getPrice);
                  const basePrice = Number(complementModalProduct?.price || 0);
                  const totalPrice = (basePrice + complementsTotal) * complementQuantity;
                  const allFilled = areRequiredGroupsFilled(groups, selectedComplements);
                  return (
                    <Button
                      className="w-full h-11 rounded-xl font-semibold text-base gap-2"
                      disabled={!allFilled || addItemMutation.isPending}
                      onClick={handleAddWithComplements}
                    >
                      {addItemMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Adicionar {"\u2022"} {formatCurrency(totalPrice)}
                        </>
                      )}
                    </Button>
                  );
                })()}
              </div>
            </div>
          )}
          {/* Conteúdo principal dos detalhes do pedido */}
          <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-lg">Detalhes do Pedido</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={handlePrintOrder}>
                  <div className="flex items-center">
                    <Printer className="h-4 w-4 mr-2" />
                    <span className="text-sm">Impressão Normal</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavoritePrintMethod('normal');
                    }}
                    className="p-1 hover:bg-accent-foreground/10 rounded"
                    title="Definir como impressão padrão. Ao marcar como favorito, essa opção será usada automaticamente ao clicar em Aceitar pedido."
                  >
                    <Star 
                      className={cn(
                        "h-4 w-4 transition-colors",
                        printerSettings?.defaultPrintMethod === 'normal' 
                          ? "fill-amber-500 text-amber-500" 
                          : "text-amber-500"
                      )} 
                    />
                  </button>
                </div>
                {hasMindiPrinterApiKey && (
                  <div className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={() => {
                    if (!selectedOrder || !establishment?.id) return;
                    reprintMutation.mutate({ orderId: selectedOrder, establishmentId: establishment.id });
                  }}>
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <Wifi className="h-4 w-4 mr-2 text-emerald-500" />
                        <span className="text-sm">Impressão Automática</span>
                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium">Mindi</span>
                      </div>
                      <span className="text-[11px] text-gray-400 ml-6">Reenviar para impressora</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavoritePrintMethod('automatic');
                      }}
                      className="p-1 hover:bg-accent-foreground/10 rounded"
                      title="Definir como impressão padrão. Ao marcar como favorito, o pedido será impresso automaticamente via Mindi Printer e a tela de impressão não abrirá ao aceitar."
                    >
                      <Star 
                        className={cn(
                          "h-4 w-4 transition-colors",
                          printerSettings?.defaultPrintMethod === 'automatic' 
                            ? "fill-amber-500 text-amber-500" 
                            : "text-amber-500"
                        )} 
                      />
                    </button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {(orderDetailsLoading || orderDetailsFetching) && !orderDetails && (
            <div className="overflow-y-auto flex-1 p-6 space-y-6 animate-in fade-in duration-200">
              {/* Skeleton: Order ID and Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="skeleton h-6 w-40 rounded" />
                  <div className="skeleton h-4 w-56 rounded" />
                </div>
                <div className="skeleton h-7 w-24 rounded-lg" />
              </div>

              {/* Skeleton: Status Timeline */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="flex items-center gap-3">
                  <div className="skeleton h-8 w-8 rounded-full" />
                  <div className="skeleton h-4 w-48 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="skeleton h-8 w-8 rounded-full" />
                  <div className="skeleton h-4 w-40 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="skeleton h-8 w-8 rounded-full" />
                  <div className="skeleton h-4 w-36 rounded" />
                </div>
              </div>

              {/* Skeleton: Customer Info */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="flex items-center gap-3">
                  <div className="skeleton h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <div className="skeleton h-4 w-36 rounded" />
                    <div className="skeleton h-3 w-28 rounded" />
                  </div>
                </div>
              </div>

              {/* Skeleton: Order Items */}
              <div className="space-y-3">
                <div className="skeleton h-4 w-24 rounded" />
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="skeleton h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-4 w-40 rounded" />
                      <div className="skeleton h-3 w-24 rounded" />
                    </div>
                    <div className="skeleton h-4 w-16 rounded" />
                  </div>
                ))}
              </div>

              {/* Skeleton: Payment Summary */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <div className="skeleton h-4 w-20 rounded" />
                  <div className="skeleton h-4 w-16 rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="skeleton h-4 w-28 rounded" />
                  <div className="skeleton h-4 w-16 rounded" />
                </div>
                <div className="border-t border-border/50 pt-2 flex justify-between">
                  <div className="skeleton h-5 w-12 rounded" />
                  <div className="skeleton h-5 w-20 rounded" />
                </div>
              </div>
            </div>
          )}

          {orderDetails && (
            <div className="overflow-y-auto flex-1">
              {/* Order ID and Actions */}
              <div className="px-6 py-4 bg-muted/20 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Pedido {orderDetails.orderNumber?.startsWith('#') ? orderDetails.orderNumber : `#${orderDetails.orderNumber}`}</h2>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(orderDetails.createdAt), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                  </p>
                  {/* Código de coleta iFood */}
                  {(orderDetails as any).source === 'ifood' && (orderDetails as any).externalDisplayId && (
                    <p className="text-sm font-bold text-red-500 mt-1">
                      Código de Coleta: {(orderDetails as any).externalDisplayId}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Badge iFood */}
                  {(orderDetails as any).source === 'ifood' && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg shadow-sm">
                      iFood
                    </span>
                  )}
                  <StatusBadge variant={statusConfig[orderDetails.status as OrderStatus]?.variant}>
                    {statusConfig[orderDetails.status as OrderStatus]?.label}
                  </StatusBadge>
                </div>
              </div>

              {/* Info Cards - Layout Vertical */}
              <div className="px-6 py-4 space-y-4">
                {/* Customer Info */}
                <div className={`relative border rounded-xl overflow-hidden ${editingOrderCustomer ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20' : 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30'}`}>
                  {canEditOrderDetails && (
                    <button
                      className={`w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                        editingOrderCustomer
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-800/50'
                          : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/70'
                      }`}
                      onClick={editingOrderCustomer ? handleSaveOrderCustomer : handleStartOrderCustomerEdit}
                      disabled={updateOrderCustomerMutation.isPending}
                      title={editingOrderCustomer ? "Concluir edição" : "Editar cliente"}
                    >
                      {updateOrderCustomerMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Edit className="h-3.5 w-3.5" />
                      )}
                      {editingOrderCustomer ? "Concluir edição" : "Editar cliente"}
                    </button>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h4 className="font-semibold text-base">Informações do Cliente</h4>
                      {editingOrderCustomer && (
                        <button
                          type="button"
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          onClick={handleCancelOrderCustomerEdit}
                          disabled={updateOrderCustomerMutation.isPending}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>

                    {editingOrderCustomer ? (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-sm text-muted-foreground">Nome do cliente *</label>
                          <Input
                            value={orderCustomerForm.customerName}
                            onChange={(event) => setOrderCustomerForm((prev) => ({ ...prev, customerName: event.target.value }))}
                            placeholder="Nome do cliente"
                            disabled={updateOrderCustomerMutation.isPending}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm text-muted-foreground">Telefone</label>
                          <Input
                            value={orderCustomerForm.customerPhone}
                            onChange={(event) => setOrderCustomerForm((prev) => ({ ...prev, customerPhone: event.target.value }))}
                            placeholder="Telefone do cliente"
                            inputMode="tel"
                            disabled={updateOrderCustomerMutation.isPending}
                            className="h-10"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                              {orderDetails.customerName?.charAt(0) || "C"}
                            </span>
                            <span className="font-medium truncate">{orderDetails.customerName || "Cliente"}</span>
                          </div>
                          {orderDetails.customerPhone && (
                            <span className="text-muted-foreground shrink-0">{orderDetails.customerPhone}</span>
                          )}
                        </div>
                        {orderDetails.customerPhone && !isIfoodOrder(orderDetails) && (
                          <div className="flex gap-2 mt-3">
                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => window.open(`tel:${orderDetails.customerPhone}`)}>
                              <Phone className="h-3.5 w-3.5" />
                              Ligar
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                              onClick={() => {
                                let phone = orderDetails.customerPhone?.replace(/\D/g, '');
                                if (phone && !phone.startsWith('55')) {
                                  phone = '55' + phone;
                                }

                                // Montar mensagem completa com itens do pedido
                                const orderNumber = orderDetails.orderNumber?.startsWith('#') ? orderDetails.orderNumber : `#${orderDetails.orderNumber}`;

                                // Formatar itens com complementos
                                const itemsText = orderDetails.items?.map(item => {
                                  let itemLine = `${item.quantity}x ${item.productName}`;
                                  // Adicionar complementos se houver
                                  if (item.complements && item.complements.length > 0) {
                                    const complementsText = item.complements.map((c: any) => {
                                      const qty = c.quantity || 1;
                                      return qty > 1 ? `  ↳ ${qty}x ${c.name}` : `  ↳ ${c.name}`;
                                    }).join('\n');
                                    itemLine += '\n' + complementsText;
                                  }
                                  return itemLine;
                                }).join('\n') || '';

                                // Formatar valor total
                                const totalFormatted = `R$ ${Number(orderDetails.total).toFixed(2).replace('.', ',')}`;

                                // Montar mensagem completa
                                const message = `Olá ${orderDetails.customerName || ''}! Sobre seu pedido ${orderNumber}:\n\n*Itens:*\n${itemsText}\n\n*Total:* ${totalFormatted}`;

                                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                              }}
                            >
                              <img src="/icons8-whatsapp.svg" alt="WhatsApp" className="h-4 w-4" />
                              Mensagem
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className={`relative border rounded-xl overflow-hidden ${editingOrder ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20' : 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30'}`}>
                  {/* Barra de edição no topo do card - oculta para pedidos iFood (iFood não permite edição) */}
                  {orderDetails.status !== 'completed' && orderDetails.status !== 'cancelled' && (orderDetails as any).source !== 'ifood' && (
                    <button
                      className={`w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium transition-colors cursor-pointer ${
editingOrder
                           ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-800/50'
                           : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/70'
                      }`}
                      onClick={() => {
                        setEditingOrder(!editingOrder);
                        if (editingOrder) {
                          setAddItemExpanded(false);
                          setAddItemSearch("");
                        }
                      }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      {editingOrder ? "Concluir edição" : "Editar itens do pedido"}
                    </button>
                  )}
                  <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-base">Itens do Pedido</h4>
                  </div>
                  <div className="space-y-3">
                    {orderDetails.items?.map((item, index) => (
                      <div key={index} className="border-b border-border/30 pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-medium text-sm flex-1">{item.productName}</span>
                          <div className="flex items-center gap-2">
                            {editingOrder && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  disabled={item.quantity <= 1 || updateItemQtyMutation.isPending}
                                  onClick={() => updateItemQtyMutation.mutate({
                                    itemId: (item as any).id,
                                    quantity: item.quantity - 1,
                                    orderId: orderDetails.id,
                                  })}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-xs font-semibold w-5 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  disabled={updateItemQtyMutation.isPending}
                                  onClick={() => updateItemQtyMutation.mutate({
                                    itemId: (item as any).id,
                                    quantity: item.quantity + 1,
                                    orderId: orderDetails.id,
                                  })}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            <span className="font-semibold text-sm">{formatCurrency(item.totalPrice)}</span>
                            {editingOrder && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                disabled={removeItemMutation.isPending}
                                onClick={() => {
                                  if (orderDetails.items && orderDetails.items.length <= 1) {
                                    toast.error("O pedido precisa ter pelo menos 1 item");
                                    return;
                                  }
                                  removeItemMutation.mutate({
                                    itemId: (item as any).id,
                                    orderId: orderDetails.id,
                                  });
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {/* Complementos do item */}
                        {item.complements && item.complements.length > 0 && (
                          <div className="mt-1.5 pl-2 border-l-2 border-primary/30">
                            {item.complements.map((complement: { name: string; price: number; quantity?: number; isIncluded?: boolean; groupType?: "complement" | "included" }, compIndex: number) => {
                              const qty = complement.quantity || 1;
                              const totalPrice = complement.price * qty;
                              const isIncluded = complement.isIncluded || complement.groupType === "included";
                              return (
                                <div key={compIndex} className="flex justify-between text-xs text-muted-foreground">
                                  <span className="text-foreground/70">↳ {isIncluded ? 'Incluso: ' : ''}{qty > 1 ? `${qty}x ` : ''}{complement.name}</span>
                                  {isIncluded ? (
                                    <span className="text-foreground/70">Incluso</span>
                                  ) : totalPrice > 0 ? (
                                    <span className="text-foreground/70">{formatCurrency(totalPrice)}</span>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {(Number(item.unitPrice) > 0 || item.notes) && (
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{item.notes || ""}</span>
                            {Number(item.unitPrice) > 0 && !editingOrder && (
                              <span>{formatCurrency(item.unitPrice)} x {item.quantity}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Seção expansível para adicionar novos itens */}
                  {editingOrder && (
                    <div className="mt-4 pt-4 border-t border-amber-300/50 dark:border-amber-700/50">
                      {!addItemExpanded ? (
                        <Button
                          variant="outline"
                          className="w-full border-dashed border-amber-400 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-950/50 gap-2"
                          onClick={() => {
                            setAddItemExpanded(true);
                            setTimeout(() => addItemSearchRef.current?.focus(), 100);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Adicionar Item
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <input
                                ref={addItemSearchRef}
                                type="text"
                                placeholder="Buscar produto do cardápio..."
                                value={addItemSearch}
                                onChange={(e) => setAddItemSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 text-xs"
                              onClick={() => {
                                setAddItemExpanded(false);
                                setAddItemSearch("");
                              }}
                            >
                              Fechar
                            </Button>
                          </div>

                          {/* Resultados da busca */}
                          {addItemSearch.trim().length >= 1 && (
                            <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-background">
                              {searchProductsQuery.isLoading ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  <span className="ml-2 text-xs text-muted-foreground">Buscando...</span>
                                </div>
                              ) : searchProductsQuery.data && searchProductsQuery.data.length > 0 ? (
                                <div className="divide-y divide-border">
                                  {searchProductsQuery.data.map((product) => (
                                    <button
                                      key={product.id}
                                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                                      disabled={addItemMutation.isPending}
                                      onClick={() => handleProductClick(product as any)}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        {product.images && product.images.length > 0 ? (
                                          <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="h-8 w-8 rounded-md object-cover"
                                          />
                                        ) : (
                                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                                            <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                                          </div>
                                        )}
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium">{product.name}</span>
                                          {((product as any).complementCount > 0 || (product as any).isCombo) && (
                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Com complementos</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-primary">{formatCurrency(product.price)}</span>
                                        <Plus className="h-4 w-4 text-primary" />
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              ) : addItemSearch.trim().length >= 1 ? (
                                <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                                  <Search className="h-5 w-5 mb-1 opacity-50" />
                                  <span className="text-xs">Nenhum produto encontrado</span>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {(() => {
                    const effectiveDeliveryType = editingOrderDetails ? orderDetailsForm.deliveryType : normalizeEditableDeliveryType(orderDetails.deliveryType);
                    const effectiveDeliveryFee = editingOrderDetails
                      ? (effectiveDeliveryType === "delivery" ? (parseMoneyInput(orderDetailsForm.deliveryFee) ?? 0) : 0)
                      : Number(orderDetails.deliveryFee) || 0;
                    const effectiveTotal = editingOrderDetails
                      ? Math.max(0, (Number(orderDetails.subtotal) || 0) + effectiveDeliveryFee - (Number(orderDetails.discount) || 0))
                      : Number(orderDetails.total) || 0;

                    return (
                      <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                        <h5 className="font-medium text-sm mb-2">Detalhes do Preço</h5>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span className="font-medium">{formatCurrency(orderDetails.subtotal)}</span>
                        </div>
                        {effectiveDeliveryFee > 0 && effectiveDeliveryType !== 'dine_in' && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Taxa de Entrega:</span>
                            <span className="font-medium">{formatCurrency(effectiveDeliveryFee)}</span>
                          </div>
                        )}
                        {orderDetails.couponCode && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Cupom Aplicado:</span>
                            <span className="font-medium text-emerald-600">{orderDetails.couponCode}</span>
                          </div>
                        )}
                        {Number(orderDetails.discount) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Desconto:</span>
                            <span className="font-medium text-red-500">-{formatCurrency(orderDetails.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Taxa da Plataforma:</span>
                          <span className="font-medium">Grátis</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border/50">
                          <span className="font-bold text-primary">Total:</span>
                          <span className="font-bold text-primary">{formatCurrency(effectiveTotal)}</span>
                        </div>
                        {editingOrderDetails && (
                          <p className="text-[11px] text-muted-foreground">
                            O total é recalculado automaticamente com base na taxa de entrega informada.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                  </div>
                </div>

                {/* Delivery & Payment Info - Unified Card */}
                {(() => {
                  const currentPaymentMethod = normalizeEditablePaymentMethod(orderDetails.paymentMethod);
                  const effectiveDeliveryType = editingOrderDetails ? orderDetailsForm.deliveryType : normalizeEditableDeliveryType(orderDetails.deliveryType);
                  const effectivePaymentMethod = editingOrderDetails ? orderDetailsForm.paymentMethod : currentPaymentMethod;
                  const effectiveDeliveryFee = editingOrderDetails
                    ? (effectiveDeliveryType === "delivery" ? (parseMoneyInput(orderDetailsForm.deliveryFee) ?? 0) : 0)
                    : Number(orderDetails.deliveryFee) || 0;
                  const effectiveChangeAmount = editingOrderDetails ? (parseMoneyInput(orderDetailsForm.changeAmount) ?? 0) : Number((orderDetails as any).changeAmount) || 0;
                  const effectiveTotal = editingOrderDetails
                    ? Math.max(0, (Number(orderDetails.subtotal) || 0) + effectiveDeliveryFee - (Number(orderDetails.discount) || 0))
                    : Number(orderDetails.total) || 0;
                  const changeToReturn = effectivePaymentMethod === "cash" && effectiveChangeAmount > 0
                    ? Math.max(0, effectiveChangeAmount - effectiveTotal)
                    : 0;
                  const paymentOptions = isOnlinePaymentOrder ? [currentPaymentMethod] : configuredPaymentMethods;

                  return (
                    <div className={`relative border rounded-xl overflow-hidden ${editingOrderDetails ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20' : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30'}`}>
                      {canEditOrderDetails && (
                        <button
                          type="button"
                          className={`w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                            editingOrderDetails
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-800/50'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-200 dark:hover:bg-emerald-800/60'
                          }`}
                          onClick={editingOrderDetails ? handleSaveOrderDetails : handleStartOrderDetailsEdit}
                          disabled={updateOrderDetailsMutation.isPending}
                          title={editingOrderDetails ? "Concluir edição" : "Editar entrega e pagamento"}
                        >
                          {updateOrderDetailsMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Edit className="h-3.5 w-3.5" />
                          )}
                          {editingOrderDetails ? "Concluir edição" : "Editar entrega e pagamento"}
                        </button>
                      )}

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-semibold text-base">{effectiveDeliveryType === 'dine_in' ? 'Consumo e Pagamento' : 'Entrega e Pagamento'}</h4>
                              <Tooltip delayDuration={150}>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-900/60 dark:hover:text-emerald-100"
                                    aria-label="Informações sobre edição de entrega e pagamento"
                                  >
                                    <Info className="h-3.5 w-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="start" className="max-w-[260px] text-xs leading-relaxed">
                                  Ajuste apenas pedidos internos ainda em andamento. Pedidos externos e pagamentos online ficam protegidos.
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                          {editingOrderDetails && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={handleCancelOrderDetailsEdit}
                              disabled={updateOrderDetailsMutation.isPending}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>

                        {editingOrderDetails ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 gap-3">
                            <label className="space-y-1.5 text-sm">
                              <span className="text-muted-foreground">Tipo de atendimento</span>
                              <select
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                                value={orderDetailsForm.deliveryType}
                                onChange={(event) => {
                                  const nextDeliveryType = normalizeEditableDeliveryType(event.target.value);
                                  setOrderDetailsForm((prev) => ({
                                    ...prev,
                                    deliveryType: nextDeliveryType,
                                    deliveryFee: nextDeliveryType === "delivery" ? prev.deliveryFee : "",
                                    deliveryNeighborhoodFeeId: nextDeliveryType === "delivery" ? prev.deliveryNeighborhoodFeeId : "",
                                  }));
                                }}
                                disabled={updateOrderDetailsMutation.isPending}
                              >
                                {editableDeliveryTypes.map((type) => (
                                  <option key={type} value={type}>{editableDeliveryTypeLabels[type]}</option>
                                ))}
                              </select>
                            </label>
                            <label className="space-y-1.5 text-sm">
                              <span className="text-muted-foreground">Forma de pagamento</span>
                              <select
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                                value={orderDetailsForm.paymentMethod}
                                onChange={(event) => setOrderDetailsForm((prev) => ({
                                  ...prev,
                                  paymentMethod: normalizeEditablePaymentMethod(event.target.value),
                                  changeAmount: event.target.value === "cash" ? prev.changeAmount : "",
                                }))}
                                disabled={updateOrderDetailsMutation.isPending || isOnlinePaymentOrder}
                              >
                                {paymentOptions.map((method) => (
                                  <option key={method} value={method}>{paymentMethodLabels[method]?.label || method}</option>
                                ))}
                                {!isOnlinePaymentOrder && paymentOptions.length === 0 && (
                                  <option value="" disabled>Nenhuma forma configurada</option>
                                )}
                              </select>
                            </label>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            {orderDetailsForm.deliveryType === "delivery" && (
                              <>
                                {establishment?.deliveryFeeType === "byNeighborhood" && (
                                  <label className="space-y-1.5 text-sm">
                                    <span className="text-muted-foreground">Bairro da entrega</span>
                                    <select
                                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                                      value={orderDetailsForm.deliveryNeighborhoodFeeId}
                                      onChange={(event) => {
                                        const selectedFee = getNeighborhoodFeeById(event.target.value);
                                        setOrderDetailsForm((prev) => ({
                                          ...prev,
                                          deliveryNeighborhoodFeeId: event.target.value,
                                          deliveryFee: selectedFee ? toMoneyInput(selectedFee.fee) : "",
                                          neighborhood: selectedFee?.neighborhood ?? "",
                                        }));
                                      }}
                                      disabled={updateOrderDetailsMutation.isPending || neighborhoodFeeOptions.length === 0}
                                    >
                                      <option value="">Selecione o bairro</option>
                                      {neighborhoodFeeOptions.map((fee) => (
                                        <option key={fee.id} value={fee.id}>
                                          {fee.neighborhood} — {formatCurrency(parseMoneyInput(toMoneyInput(fee.fee)) ?? 0)}
                                        </option>
                                      ))}
                                    </select>
                                    {neighborhoodFeeOptions.length === 0 && (
                                      <span className="block text-xs text-amber-700 dark:text-amber-300">
                                        Nenhum bairro com taxa foi cadastrado nas configurações do estabelecimento.
                                      </span>
                                    )}
                                  </label>
                                )}
                                <label className="space-y-1.5 text-sm">
                                  <span className="text-muted-foreground">Taxa de entrega</span>
                                  <Input
                                    inputMode="decimal"
                                    placeholder="0,00"
                                    value={orderDetailsForm.deliveryFee}
                                    onChange={(event) => setOrderDetailsForm((prev) => ({
                                      ...prev,
                                      deliveryFee: normalizeMoneyInputValue(event.target.value),
                                      deliveryNeighborhoodFeeId: establishment?.deliveryFeeType === "byNeighborhood" ? "" : prev.deliveryNeighborhoodFeeId,
                                    }))}
                                    disabled={updateOrderDetailsMutation.isPending || ["fixed", "free", "byNeighborhood"].includes(String(establishment?.deliveryFeeType ?? "free"))}
                                  />
                                  {establishment?.deliveryFeeType === "fixed" && (
                                    <span className="block text-xs text-muted-foreground">Taxa fixa definida nas configurações do estabelecimento.</span>
                                  )}
                                  {establishment?.deliveryFeeType === "byNeighborhood" && (
                                    <span className="block text-xs text-muted-foreground">A taxa é preenchida automaticamente pelo bairro selecionado.</span>
                                  )}
                                </label>

                                <div className="rounded-lg border border-emerald-100 bg-background/70 p-3 space-y-3 dark:border-emerald-900/60">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">Endereço de entrega</p>
                                    <p className="text-xs text-muted-foreground">Preencha ou corrija o endereço que será salvo no pedido.</p>
                                  </div>
                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
                                    <label className="space-y-1.5 text-sm">
                                      <span className="text-muted-foreground">Rua *</span>
                                      <Input
                                        placeholder="Nome da rua"
                                        value={orderDetailsForm.street}
                                        onChange={(event) => setOrderDetailsForm((prev) => ({ ...prev, street: event.target.value }))}
                                        disabled={updateOrderDetailsMutation.isPending}
                                      />
                                    </label>
                                    <label className="space-y-1.5 text-sm">
                                      <span className="text-muted-foreground">Número *</span>
                                      <Input
                                        placeholder="Nº"
                                        value={orderDetailsForm.number}
                                        onChange={(event) => setOrderDetailsForm((prev) => ({ ...prev, number: event.target.value }))}
                                        disabled={updateOrderDetailsMutation.isPending}
                                      />
                                    </label>
                                  </div>
                                  {establishment?.deliveryFeeType === "byNeighborhood" ? (
                                    <p className="text-xs text-muted-foreground">
                                      O bairro do endereço será preenchido pelo campo <strong>Bairro da entrega</strong> acima.
                                    </p>
                                  ) : (
                                    <label className="space-y-1.5 text-sm">
                                      <span className="text-muted-foreground">Bairro *</span>
                                      <Input
                                        placeholder="Bairro"
                                        value={orderDetailsForm.neighborhood}
                                        onChange={(event) => setOrderDetailsForm((prev) => ({ ...prev, neighborhood: event.target.value }))}
                                        disabled={updateOrderDetailsMutation.isPending}
                                      />
                                    </label>
                                  )}
                                  <label className="space-y-1.5 text-sm">
                                    <span className="text-muted-foreground">Complemento</span>
                                    <Input
                                      placeholder="Apartamento, bloco, casa, etc."
                                      value={orderDetailsForm.complement}
                                      onChange={(event) => setOrderDetailsForm((prev) => ({ ...prev, complement: event.target.value }))}
                                      disabled={updateOrderDetailsMutation.isPending}
                                    />
                                  </label>
                                  <label className="space-y-1.5 text-sm">
                                    <span className="text-muted-foreground">Ponto de referência</span>
                                    <Input
                                      placeholder="Ex.: perto da praça"
                                      value={orderDetailsForm.reference}
                                      onChange={(event) => setOrderDetailsForm((prev) => ({ ...prev, reference: event.target.value }))}
                                      disabled={updateOrderDetailsMutation.isPending}
                                    />
                                  </label>
                                </div>
                              </>
                            )}
                            {orderDetailsForm.paymentMethod === "cash" && (
                              <label className="space-y-1.5 text-sm">
                                <span className="text-muted-foreground">Troco para</span>
                                <Input
                                  inputMode="decimal"
                                  placeholder="Opcional"
                                  value={orderDetailsForm.changeAmount}
                                  onChange={(event) => setOrderDetailsForm((prev) => ({ ...prev, changeAmount: normalizeMoneyInputValue(event.target.value) }))}
                                  disabled={updateOrderDetailsMutation.isPending}
                                />
                              </label>
                            )}
                          </div>

                          {isOnlinePaymentOrder && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                              A forma de pagamento online deste pedido é preservada e não pode ser alterada manualmente.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tipo:</span>
                            <span className="font-medium">{editableDeliveryTypeLabels[effectiveDeliveryType]}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Método:</span>
                            <span className="font-medium">{paymentMethodLabels[effectivePaymentMethod]?.label || effectivePaymentMethod}</span>
                          </div>
                          {/* Bandeira do cartão - apenas para pedidos iFood */}
                          {(orderDetails as any).source === 'ifood' && (orderDetails as any).externalData?.payments?.methods?.[0]?.card?.brand && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Bandeira:</span>
                              <span className="font-medium">{(orderDetails as any).externalData.payments.methods[0].card.brand}</span>
                            </div>
                          )}
                          {/* Valor do troco - para pagamento em dinheiro */}
                          {effectivePaymentMethod === 'cash' && effectiveChangeAmount > 0 && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Troco para:</span>
                                <span className="font-medium">{formatCurrency(effectiveChangeAmount)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Troco a devolver:</span>
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(changeToReturn)}</span>
                              </div>
                            </>
                          )}
                          {orderDetails.customerAddress && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Endereço:</span>
                              <span className="font-medium text-right max-w-[180px]">{orderDetails.customerAddress}</span>
                            </div>
                          )}

                          {shouldShowPixWhatsappChargeButton && (
                            <div className="pt-3 mt-3 border-t border-border/60 space-y-2">
                              <p className="text-xs text-muted-foreground">
                                Pagamento alterado para PIX. Envie a cobrança online pelo WhatsApp para o cliente pagar antes da finalização automática.
                              </p>
                              <Button
                                onClick={handleSendPixWhatsappCharge}
                                disabled={sendExistingOrderPixWhatsappChargeMutation.isPending}
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                              >
                                {sendExistingOrderPixWhatsappChargeMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enviando cobrança...
                                  </>
                                ) : (
                                  <>
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Enviar Cobrança via WhatsApp
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                          {isSelectedOrderPendingPixWhatsapp && (
                            <div className="pt-3 mt-3 border-t border-border/60 space-y-3 text-center">
                              <div className="flex items-center justify-center gap-2 text-green-600">
                                <Loader2 className="animate-spin h-5 w-5" />
                                <span className="font-semibold">Aguardando pagamento...</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Cobrança PIX enviada via WhatsApp. O pedido será finalizado automaticamente após o pagamento.
                                {isPollingPixWhatsappStatus ? " Verificando confirmação..." : ""}
                              </p>
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleCancelPendingPixWhatsappOrder}
                                disabled={updateStatusMutation.isPending}
                              >
                                {updateStatusMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Ban className="h-4 w-4 mr-2" />
                                )}
                                Cancelar Pedido
                              </Button>
                            </div>
                          )}
                          {/* CPF/CNPJ do cliente - apenas para pedidos iFood */}
                          {(orderDetails as any).source === 'ifood' && (orderDetails as any).externalData?.customer?.documentNumber && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">CPF/CNPJ:</span>
                              <span className="font-medium">{(orderDetails as any).externalData.customer.documentNumber}</span>
                            </div>
                          )}
                        </div>
                      )}
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const ifoodDeliveryConfirmation = getIfoodDeliveryConfirmationInfo(orderDetails as any);
                  if (!ifoodDeliveryConfirmation) return null;
                  const shareText = buildIfoodDeliveryConfirmationShareText(ifoodDeliveryConfirmation);
                  return (
                    <div className="border border-red-200 dark:border-red-500 bg-red-50/70 dark:bg-red-950/30 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">Confirmação de entrega pendente</h4>
                          <p className="text-sm text-muted-foreground">
                            Envie o link pro entregador e evite cancelamentos por pedido não entregue.
                          </p>
                          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                            <div className="rounded-lg bg-white/80 dark:bg-red-950/40 border border-red-100 dark:border-red-500 px-3 py-2">
                              <span className="block text-xs text-muted-foreground">Localizador do pedido</span>
                              <span className="font-semibold text-red-500 dark:text-red-300">{ifoodDeliveryConfirmation.localizer || "Não informado pelo iFood"}</span>
                            </div>
                            {ifoodDeliveryConfirmation.displayId && (
                              <div className="rounded-lg bg-white/80 dark:bg-red-950/40 border border-red-100 dark:border-red-500 px-3 py-2">
                                <span className="block text-xs text-muted-foreground">Código/Pedido iFood</span>
                                <span className="font-semibold text-red-500 dark:text-red-300">{ifoodDeliveryConfirmation.displayId}</span>
                              </div>
                            )}
                          </div>
                          {shouldValidateIfoodDeliveryCode(orderDetails as any) && (
                            <div className="mt-4 rounded-lg border border-red-200 bg-white/80 p-3 dark:border-red-500 dark:bg-red-950/40">
                              <label className="text-xs font-medium text-muted-foreground" htmlFor="ifood-delivery-code">
                                Código de confirmação informado pelo cliente
                              </label>
                              <div className="mt-2 flex gap-2">
                                <Input
                                  id="ifood-delivery-code"
                                  value={ifoodDeliveryCodeOrderId === orderDetails.id ? ifoodDeliveryCodeInput : ""}
                                  onChange={(event) => {
                                    setIfoodDeliveryCodeOrderId(orderDetails.id);
                                    setIfoodDeliveryCodeInput(event.target.value.replace(/\s/g, ""));
                                  }}
                                  placeholder="Digite o código"
                                  maxLength={12}
                                  className="bg-white dark:bg-background"
                                />
                                <Button
                                  type="button"
                                  className="bg-red-500 text-white hover:bg-red-600"
                                  disabled={validateIfoodDeliveryCodeMutation.isPending || loadingOrderId === orderDetails.id}
                                  onClick={() => executeStatusUpdate(orderDetails.id, "completed")}
                                >
                                  {validateIfoodDeliveryCodeMutation.isPending || loadingOrderId === orderDetails.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <p className="mt-2 text-xs text-muted-foreground">
                                O pedido só será concluído depois que a API do iFood confirmar este código.
                              </p>
                            </div>
                          )}
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="border-red-200 bg-white text-red-500 hover:bg-red-50 hover:text-red-500 dark:border-red-500 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(ifoodDeliveryConfirmation.url);
                                  toast.success("Link de confirmação iFood copiado");
                                } catch {
                                  toast.error("Não foi possível copiar o link");
                                }
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar link
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="border-red-200 bg-white text-red-500 hover:bg-red-50 hover:text-red-500 dark:border-red-500 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950"
                              onClick={() => {
                                window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
                              }}
                            >
                              <Share2 className="mr-2 h-4 w-4" />
                              Compartilhar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  if (!isIfoodMarketplaceDelivery(orderDetails as any)) return null;
                  const driverInfo = getIfoodDriverInfo(orderDetails as any);
                  const logisticsStatus = getIfoodLogisticsStatusLabel(orderDetails as any);
                  return (
                    <div className="border border-blue-200 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Bike className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-300" />
                        <div className="min-w-0 flex-1 space-y-3">
                          <div>
                            <h4 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">Entrega com entregador iFood</h4>
                            <p className="text-sm text-muted-foreground">
                              Este pedido não usa despacho MERCHANT nem entregador local. Acompanhe a coleta e o trajeto pelo fluxo logístico do iFood.
                            </p>
                          </div>
                          <div className="grid gap-2 text-sm sm:grid-cols-2">
                            <div className="rounded-lg bg-white/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-500 px-3 py-2">
                              <span className="block text-xs text-muted-foreground">Status logístico</span>
                              <span className="font-semibold text-blue-700 dark:text-blue-200">{logisticsStatus || "Aguardando atualização do iFood"}</span>
                            </div>
                            <div className="rounded-lg bg-white/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-500 px-3 py-2">
                              <span className="block text-xs text-muted-foreground">Entregador</span>
                              <span className="font-semibold text-blue-700 dark:text-blue-200">{driverInfo.driverName || "Ainda não informado"}</span>
                              {driverInfo.driverPhone && <span className="block text-xs text-muted-foreground">{driverInfo.driverPhone}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Informações Adicionais do iFood */}
                {(orderDetails as any).source === 'ifood' && (() => {
                  const externalData = (orderDetails as any).externalData || {};
                  const mindiMeta = getIfoodMindiMetadata(orderDetails as any);
                  const ifoodBenefits = getIfoodBenefitDisplays(orderDetails as any);
                  const ifoodPayments = getIfoodPaymentDisplays(orderDetails as any);
                  const customerDocument = getIfoodCustomerDocument(orderDetails as any);
                  const phoneLocalizer = getIfoodPhoneLocalizer(orderDetails as any);
                  const orderTypeLabel = formatIfoodOrderTypeLabel(externalData?.orderType || mindiMeta?.orderType);
                  const scheduledStart = formatIfoodDateTime(externalData?.schedule?.deliveryDateTimeStart || mindiMeta?.scheduledStart);
                  const scheduledEnd = formatIfoodDateTime(externalData?.schedule?.deliveryDateTimeEnd || mindiMeta?.scheduledEnd);
                  const takeoutDateTime = formatIfoodDateTime(externalData?.takeout?.takeoutDateTime || mindiMeta?.takeoutDateTime);
                  const cancellationRequest = getIfoodCancellationRequest(orderDetails as any);

                  return (
                    <div className="border border-red-200 dark:border-red-500 bg-red-50/50 dark:bg-red-950/30 rounded-xl p-4">
                      <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">iFood</span>
                        Informações do Pedido
                      </h4>
                      <div className="space-y-3">
                        {cancellationRequest && (
                          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm dark:border-amber-500 dark:bg-amber-950/30">
                            <span className="block font-semibold text-amber-800 dark:text-amber-200">Solicitação de cancelamento recebida</span>
                            <span className="block text-amber-700 dark:text-amber-300">Motivo: {cancellationRequest.reason}</span>
                            {(cancellationRequest.code || cancellationRequest.receivedAt) && (
                              <span className="block text-xs text-muted-foreground">
                                {cancellationRequest.code ? `Código: ${cancellationRequest.code}` : null}
                                {cancellationRequest.code && cancellationRequest.receivedAt ? " · " : null}
                                {cancellationRequest.receivedAt ? `Recebida em ${cancellationRequest.receivedAt}` : null}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="grid gap-2 text-sm sm:grid-cols-2">
                          {(externalData?.orderTiming || mindiMeta?.orderTiming) && (
                            <div className="rounded-lg bg-white/60 dark:bg-red-950/20 px-2 py-1">
                              <span className="block text-xs text-muted-foreground">Tempo do pedido</span>
                              <span className="font-medium">{(externalData?.orderTiming || mindiMeta?.orderTiming) === 'SCHEDULED' ? 'Agendado' : 'Imediato'}</span>
                            </div>
                          )}
                          {orderTypeLabel && (
                            <div className="rounded-lg bg-white/60 dark:bg-red-950/20 px-2 py-1">
                              <span className="block text-xs text-muted-foreground">Modalidade iFood</span>
                              <span className="font-medium">{orderTypeLabel}</span>
                            </div>
                          )}
                          {(orderDetails as any).externalStatus && (
                            <div className="rounded-lg bg-white/60 dark:bg-red-950/20 px-2 py-1">
                              <span className="block text-xs text-muted-foreground">Status iFood</span>
                              <span className="font-medium">{getIfoodLogisticsStatusLabel(orderDetails as any) || (orderDetails as any).externalStatus}</span>
                            </div>
                          )}
                          {customerDocument && (
                            <div className="rounded-lg bg-white/60 dark:bg-red-950/20 px-2 py-1">
                              <span className="block text-xs text-muted-foreground">CPF/CNPJ</span>
                              <span className="font-medium">{customerDocument}</span>
                            </div>
                          )}
                          {phoneLocalizer && (
                            <div className="rounded-lg bg-white/60 dark:bg-red-950/20 px-2 py-1">
                              <span className="block text-xs text-muted-foreground">Localizador do telefone</span>
                              <span className="font-medium">{phoneLocalizer}</span>
                            </div>
                          )}
                          {scheduledStart && (
                            <div className="rounded-lg bg-white/60 dark:bg-red-950/20 px-2 py-1 sm:col-span-2">
                              <span className="block text-xs text-muted-foreground">Janela agendada</span>
                              <span className="font-medium text-amber-700 dark:text-amber-300">
                                {scheduledStart}{scheduledEnd ? ` até ${scheduledEnd}` : ""}
                              </span>
                            </div>
                          )}
                          {takeoutDateTime && (
                            <div className="rounded-lg bg-white/60 dark:bg-red-950/20 px-2 py-1 sm:col-span-2">
                              <span className="block text-xs text-muted-foreground">Retirada prevista</span>
                              <span className="font-medium text-amber-700 dark:text-amber-300">{takeoutDateTime}</span>
                            </div>
                          )}
                        </div>

                        {ifoodPayments.length > 0 && (
                          <div className="space-y-1 text-sm">
                            <span className="text-muted-foreground block">Pagamentos iFood:</span>
                            {ifoodPayments.map((payment, index) => (
                              <div key={`${payment.label}-${index}`} className="rounded-lg bg-white/60 dark:bg-red-950/20 px-2 py-1">
                                <div className="flex justify-between gap-3">
                                  <span className="text-muted-foreground truncate">
                                    {payment.label}{payment.cardBrand ? ` · ${payment.cardBrand}` : ""}
                                  </span>
                                  <span className="font-medium text-right">
                                    {payment.valueInCents !== null ? formatCurrency(payment.valueInCents / 100) : "Valor não informado"}
                                  </span>
                                </div>
                                <div className="mt-0.5 flex justify-between gap-3 text-xs text-muted-foreground">
                                  <span>{payment.typeLabel}</span>
                                  {payment.changeForInCents !== null && <span>Troco para {formatCurrency(payment.changeForInCents / 100)}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {ifoodBenefits.length > 0 && (
                          <div className="space-y-1 text-sm">
                            <span className="text-muted-foreground block">Descontos e responsáveis:</span>
                            {ifoodBenefits.map((benefit, index) => (
                              <div key={`${benefit.description}-${index}`} className="flex justify-between gap-3 rounded-lg bg-white/60 dark:bg-red-950/20 px-2 py-1">
                                <span className="text-muted-foreground truncate">{benefit.description}</span>
                                <span className="font-medium text-red-600 dark:text-red-300 text-right">
                                  {benefit.sponsorLabels.join(" + ")}: -{formatCurrency(benefit.valueInCents / 100)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {(externalData?.delivery?.observations || externalData?.extraInfo) && (
                          <div className="text-sm">
                            <span className="text-muted-foreground block mb-1">Observações iFood:</span>
                            <span className="font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30 px-2 py-1 rounded block whitespace-pre-wrap">
                              {[externalData?.extraInfo, externalData?.delivery?.observations].filter(Boolean).join("\n")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Status Timeline */}
                <div className="border border-border/50 rounded-xl p-4">
                  <h4 className="font-semibold text-base mb-4">Status do Pedido</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          orderDetails.status !== "cancelled" ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                        )}>
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <div className="w-0.5 h-8 bg-border/50" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Pedido Recebido</p>
                        <p className="text-xs text-muted-foreground">Pedido criado no sistema</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          ["preparing", "ready", "completed"].includes(orderDetails.status) ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                        )}>
                          <ChefHat className="h-4 w-4" />
                        </div>
                        <div className="w-0.5 h-8 bg-border/50" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Em Preparo</p>
                        <p className="text-xs text-muted-foreground">Pedido sendo preparado</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          ["ready", "completed"].includes(orderDetails.status) ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                        )}>
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="w-0.5 h-8 bg-border/50" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Pronto</p>
                        <p className="text-xs text-muted-foreground">Pedido pronto para entrega/retirada</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          orderDetails.status === "completed" ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                        )}>
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Finalizado</p>
                        <p className="text-xs text-muted-foreground">Pedido entregue ao cliente</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {orderDetails.notes && (
                <div className="px-6 py-4">
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-400 mb-2">Observações</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">{orderDetails.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          </div>{/* Fim do conteúdo principal */}
        </SheetContent>
      </Sheet>

      {/* Extracted Modal Components */}
      <CancelOrderDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        orderToCancel={orderToCancel}
        orderToCancelIsIfood={orderToCancelIsIfood}
        orderToCancelExternalId={orderToCancelExternalId}
        cancellationReason={cancellationReason}
        setCancellationReason={setCancellationReason}
        ifoodCancellationCode={ifoodCancellationCode}
        setIfoodCancellationCode={setIfoodCancellationCode}
        onConfirm={handleCancelOrder}
        isPending={updateStatusMutation.isPending}
      />
      <ClearOrdersDialog
        open={clearConfirmOpen}
        onOpenChange={setClearConfirmOpen}
        clearColumnTarget={clearColumnTarget}
        onConfirm={() => {
          if (clearColumnTarget) handleManualClear(clearColumnTarget);
          setClearConfirmOpen(false);
          setClearColumnTarget(null);
        }}
      />
      <QrCodeModal
        open={qrCodeModalOpen}
        onOpenChange={(open) => {
          setQrCodeModalOpen(open);
          if (!open) setIsPollingQrCode(false);
        }}
        qrcode={connectWhatsapp.data?.qrcode || whatsappStatus?.qrcode}
        onRefresh={() => connectWhatsapp.mutate()}
        isRefreshing={connectWhatsapp.isPending}
      />
      <WhatsappInfoModal
        open={whatsappInfoModalOpen}
        onOpenChange={setWhatsappInfoModalOpen}
        establishmentName={establishment?.name || 'Seu Estabelecimento'}
        onDismiss={() => setWhatsappModalSeen('true')}
        onConnect={() => {
          connectWhatsapp.mutate();
          setQrCodeModalOpen(true);
          setIsPollingQrCode(true);
        }}
      />
      <DriverAssignModal
        open={driverModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDriverModalOpen(false);
            setDriverModalOrderId(null);
            setAssigningDriverId(null);
          }
        }}
        orderId={driverModalOrderId}
        drivers={driverModalDrivers}
        assigningDriverId={assigningDriverId}
        context={driverModalContext}
        onAssign={(driverId) => {
          if (!driverModalOrderId) return;
          setAssigningDriverId(driverId);
          if (driverModalContext === 'accept') {
            assignDriverOnAcceptMutation.mutate({
              orderId: driverModalOrderId,
              driverId,
            });
          } else {
            markReadyAndAssignMutation.mutate({
              orderId: driverModalOrderId,
              driverId,
            });
          }
        }}
      />
      <StatusOnboardingModal
        modal={statusOnboardingModal}
        setModal={setStatusOnboardingModal}
        establishment={establishment}
        whatsappConfig={whatsappConfig}
        allOrders={allOrders}
        onConfirm={handleStatusOnboardingConfirm}
        onDismissAndExecute={(statusType, orderId) => {
          dismissStatusOnboarding(statusType);
          setStatusOnboardingModal({ open: false, statusType: null, orderId: null, dontShowAgain: false });
          executeStatusUpdate(orderId, statusType);
        }}
      />
      <DriverInfoModal
        open={driverInfoModalOpen}
        onOpenChange={(open) => {
          setDriverInfoModalOpen(open);
          if (!open) setDriverInfoOrderId(null);
        }}
        orderId={driverInfoOrderId}
        onFinalize={(orderId) => {
          executeStatusUpdate(orderId, "completed");
          setDriverInfoModalOpen(false);
          setDriverInfoOrderId(null);
          toast.success("Pedido finalizado pelo atendente!");
        }}
        loadingOrderId={loadingOrderId}
      />
      </div>
    </AdminLayout>
  );
}
