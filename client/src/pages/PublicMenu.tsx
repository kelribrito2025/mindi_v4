import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { createSafeRandomId } from "@/lib/safeRandomId";
import { getThumbUrl } from "../../../shared/imageUtils";
import { hasAutomaticOrderNotifications } from "../../../shared/planLimits";
import { BlurImage } from "@/components/BlurImage";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { orderSSE, statusMap } from "@/lib/orderSSE";
import {
  Search,
  Home,
  ClipboardList,
  User,
  MapPin,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Store,
  Utensils,
  Menu,
  Star,
  StarHalf,
  ShoppingBag,
  Ticket,
  Clock,
  X,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  Info,
  Share2,
  Minus,
  Plus,
  Trash2,
  Phone,
  Package,
  MessageCircle,
  CheckCircle,
  XCircle,
  Bike,
  Copy,
  Loader2,
  Eye,
  RefreshCw,
  UtensilsCrossed,
  Gift,
  Heart,
  RotateCcw,
  Check,
  Zap,
  CalendarClock,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Percent,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MenuSpotlight } from "@/components/MenuSpotlight";
import { PublicChatWidget } from "@/components/PublicChatWidget";
import StoryViewer from "@/components/StoryViewer";
import { useMenuSSE } from "@/hooks/useMenuSSE";
import { ComplementGroups } from "@/components/ComplementGroups";
import {
  DeliveryAddressPicker,
  type DeliveryAddressData,
} from "@/components/DeliveryAddressPicker";
import { FreeDeliveryCelebration } from "@/components/FreeDeliveryCelebration";
import { LoyaltyIntroSheet, LoyaltyLoginForm, LoyaltyRegisterForm, LoyaltyCardView } from "@/components/public-menu/LoyaltyComponents";
import { CashbackIntroSheet, CashbackLoginForm, CashbackRegisterForm, CashbackWalletView } from "@/components/public-menu/CashbackComponents";
import { ProductCard, MenuSkeleton } from "@/components/public-menu/MenuComponents";

// Tipo do item do carrinho
type CartItem = {
  productId: number;
  name: string;
  price: string;
  quantity: number;
  observation: string;
  image: string | null;
  complements: Array<{
    id: number;
    name: string;
    price: string;
    quantity: number;
    isIncluded?: boolean;
    groupType?: "complement" | "included";
  }>;
};

// Função helper para calcular preço do complemento baseado no contexto
function getComplementPrice(
  item: {
    price: string | number;
    priceMode?: string;
    freeOnDelivery?: boolean;
    freeOnPickup?: boolean;
    freeOnDineIn?: boolean;
  },
  deliveryType: "delivery" | "pickup" | "dine_in"
): number {
  // Se priceMode é 'free' global, sempre grátis
  if (item.priceMode === "free") {
    // Verificar gratuidade por contexto
    if (deliveryType === "delivery" && item.freeOnDelivery) return 0;
    if (deliveryType === "pickup" && item.freeOnPickup) return 0;
    if (deliveryType === "dine_in" && item.freeOnDineIn) return 0;
    // Se nenhum contexto marcado, é grátis em todos (comportamento original)
    if (!item.freeOnDelivery && !item.freeOnPickup && !item.freeOnDineIn)
      return 0;
    // Se tem contextos marcados mas o atual não é um deles, cobra normal
    return Number(item.price);
  }
  return Number(item.price);
}

// Função para obter a chave do localStorage baseada no slug
const getCartStorageKey = (slug: string) => `cart_${slug}`;

// Função para carregar o carrinho do localStorage
const loadCartFromStorage = (slug: string): CartItem[] => {
  try {
    const stored = localStorage.getItem(getCartStorageKey(slug));
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao carregar carrinho do localStorage:", e);
  }
  return [];
};

// Função para salvar o carrinho no localStorage
const saveCartToStorage = (slug: string, cart: CartItem[]) => {
  try {
    localStorage.setItem(getCartStorageKey(slug), JSON.stringify(cart));
  } catch (e) {
    console.error("Erro ao salvar carrinho no localStorage:", e);
  }
};

const REVIEW_DISMISS_DURATION_MS = 15 * 24 * 60 * 60 * 1000;
const isReviewDismissedForPeriod = (key: string): boolean => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return false;
    const dismissedUntil = Number(raw);
    if (
      Number.isFinite(dismissedUntil) === false ||
      dismissedUntil <= Date.now()
    ) {
      localStorage.removeItem(key);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};
const dismissReviewForFifteenDays = (key: string): void => {
  try {
    localStorage.setItem(key, String(Date.now() + REVIEW_DISMISS_DURATION_MS));
  } catch {
    // Se localStorage falhar, apenas não persiste o adiamento.
  }
};

// Função para limpar o carrinho do localStorage
const clearCartFromStorage = (slug: string) => {
  try {
    localStorage.removeItem(getCartStorageKey(slug));
  } catch (e) {
    console.error("Erro ao limpar carrinho do localStorage:", e);
  }
};

// Lista de palavras ofensivas para filtro de avaliações
const OFFENSIVE_WORDS = [
  "merda",
  "bosta",
  "lixo",
  "porra",
  "caralho",
  "foda",
  "fodase",
  "fodasse",
  "puta",
  "putaria",
  "arrombado",
  "arrombada",
  "cuzao",
  "cuzão",
  "cu",
  "viado",
  "viada",
  "bicha",
  "vagabundo",
  "vagabunda",
  "desgraca",
  "desgraça",
  "filhadaputa",
  "filhodaputa",
  "fdp",
  "vsf",
  "vtnc",
  "pqp",
  "tnc",
  "idiota",
  "imbecil",
  "retardado",
  "retardada",
  "otario",
  "otário",
  "otaria",
  "babaca",
  "corno",
  "corna",
  "piranha",
  "safado",
  "safada",
  "nojento",
  "nojenta",
  "podre",
  "porco",
  "porca",
  "burro",
  "burra",
  "estupido",
  "estúpido",
  "estupida",
  "estúpida",
  "inutil",
  "inútil",
  "ridiculo",
  "ridículo",
  "palhaço",
  "palhaco",
  "maldito",
  "maldita",
  "desgraçado",
  "desgracado",
  "lazarento",
  "lazarenta",
  "peste",
  "praga",
];

// Filtra links e palavrões antes de salvar/exibir comentários de avaliação.
function filterReviewComment(comment: string): string {
  if (!comment) return "";
  let filtered = comment;

  filtered = filtered.replace(/https?:\/\/[^\s]+/gi, "****");
  filtered = filtered.replace(/www\.[^\s]+/gi, "****");
  filtered = filtered.replace(
    /[^\s]+\.(com|com\.br|net|org|io|me|app|dev|site|online|store|shop|link|info|biz|co)(\/[^\s]*)?/gi,
    "****"
  );

  for (const word of OFFENSIVE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    filtered = filtered.replace(regex, "****");
  }

  return filtered.trim();
}

// Função para obter a chave do localStorage de pedidos baseada no establishmentId
const getOrdersStorageKey = (establishmentId: number) =>
  `orders_${establishmentId}`;

// Tipo de pedido do usuário
type UserOrder = {
  id: string;
  orderId?: number; // ID único do banco de dados (para tracking sem colisão)
  date: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
    complements: Array<{ name: string; price: string; quantity: number }>;
  }>;
  total: string;
  subtotal?: string;
  deliveryFee?: string;
  discount?: string;
  status: "sent" | "accepted" | "delivering" | "delivered" | "cancelled";
  deliveryType: "pickup" | "delivery" | "dine_in";
  paymentMethod:
    | "cash"
    | "card"
    | "pix"
    | "pix_online"
    | "card_online"
    | "online";
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    complement: string;
    reference: string;
  };
  customerName: string;
  customerPhone: string;
  observation: string;
};

// Função para carregar pedidos do localStorage por establishmentId
const loadOrdersFromStorage = (establishmentId: number): UserOrder[] => {
  try {
    const stored = localStorage.getItem(getOrdersStorageKey(establishmentId));
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao carregar pedidos do localStorage:", e);
  }
  return [];
};

// Função para salvar pedidos no localStorage por establishmentId
const saveOrdersToStorage = (establishmentId: number, orders: UserOrder[]) => {
  try {
    localStorage.setItem(
      getOrdersStorageKey(establishmentId),
      JSON.stringify(orders)
    );
  } catch (e) {
    console.error("Erro ao salvar pedidos no localStorage:", e);
  }
};

function getStartingComplementPrice(product: {
  price: string | number;
  minComplementPrice?: string | number | null;
}): number | null {
  if (Number(product.price) > 0) return null;
  const minComplementPrice = Number(product.minComplementPrice);
  return Number.isFinite(minComplementPrice) && minComplementPrice > 0
    ? minComplementPrice
    : null;
}

// Componente para descrição expansível com "Ver mais / Ver menos"
function ExpandableDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [truncatedText, setTruncatedText] = useState("");
  const [needsClamp, setNeedsClamp] = useState(false);
  const measureRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Usa um elemento oculto para medir quantos caracteres cabem em 3 linhas
    const container = measureRef.current;
    const hidden = hiddenRef.current;
    if (!container || !hidden) return;

    // Configura o container de medição
    const style = window.getComputedStyle(container);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const maxHeight = lineHeight * 3 + 2; // 3 linhas com margem

    // Mede o texto completo
    hidden.textContent = text;
    const fullHeight = hidden.offsetHeight;

    if (fullHeight <= maxHeight) {
      setNeedsClamp(false);
      setTruncatedText(text);
      return;
    }

    setNeedsClamp(true);

    // Busca binária para encontrar o ponto de truncamento
    // Reserva espaço para "... Ver mais" (~12 caracteres)
    const suffix = "... ";
    let low = 0;
    let high = text.length;
    let best = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      hidden.textContent = text.slice(0, mid) + suffix + "Ver mais";
      if (hidden.offsetHeight <= maxHeight) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    // Ajusta para não cortar no meio de uma palavra
    let cutPoint = best;
    while (cutPoint > 0 && text[cutPoint] !== " " && text[cutPoint] !== ".") {
      cutPoint--;
    }
    if (cutPoint === 0) cutPoint = best; // fallback

    setTruncatedText(text.slice(0, cutPoint).trimEnd());
  }, [text]);

  return (
    <div className="relative">
      {/* Elemento oculto para medição */}
      <div
        ref={measureRef}
        className="text-sm leading-relaxed absolute invisible pointer-events-none"
        style={{ width: "100%", top: 0, left: 0 }}
        aria-hidden="true"
      >
        <span ref={hiddenRef} />
      </div>

      {/* Texto visível */}
      <p
        className={`text-sm text-gray-600 leading-relaxed ${needsClamp ? "cursor-pointer" : ""}`}
        onClick={() => needsClamp && setIsExpanded(prev => !prev)}
      >
        {isExpanded || !needsClamp ? (
          <>
            {text}
            {needsClamp && (
              <>
                {" "}
                <span className="text-xs font-medium text-red-500 hover:text-red-500 transition-colors inline whitespace-nowrap">
                  Ver menos
                </span>
              </>
            )}
          </>
        ) : (
          <>
            {truncatedText}...{" "}
            <span className="text-xs font-medium text-red-500 hover:text-red-500 transition-colors inline whitespace-nowrap">
              Ver mais
            </span>
          </>
        )}
      </p>
    </div>
  );
}

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSocialDropdown, setShowSocialDropdown] = useState(false);
  const [showRatingTooltip, setShowRatingTooltip] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number;
    name: string;
    description: string | null;
    price: string;
    promotionalPrice?: string | null;
    minComplementPrice?: string | number | null;
    images: string[] | null;
    hasStock: boolean;
    availableStock?: number | null;
    outOfStock?: boolean;
    categoryId?: number | null;
  } | null>(null);
  const [isClosingProductModal, setIsClosingProductModal] = useState(false);
  const [showProductShareDropdown, setShowProductShareDropdown] =
    useState(false);
  const productDeepLinkHandledRef = useRef<string | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productObservation, setProductObservation] = useState("");
  const [expandedCartItem, setExpandedCartItem] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Inicializar do localStorage se houver dados salvos
    if (slug) {
      return loadCartFromStorage(slug);
    }
    return [];
  });
  // Map<groupId, Map<itemId, quantity>>
  const [selectedComplements, setSelectedComplements] = useState<
    Map<number, Map<number, number>>
  >(new Map());
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: number;
    code: string;
    discount: number;
    type: "percentage" | "fixed";
    value: number;
    loyaltyCardId?: number;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Footer typewriter
  const FOOTER_NICHES = [
    "restaurante?",
    "hamburgueria?",
    "pizzaria?",
    "açaiteria?",
    "doceria?",
    "cafeteria?",
    "marmitaria?",
    "restaurante japonês?",
    "confeitaria?",
    "creperia?",
    "esfiharia?",
  ];
  const [footerWordIndex, setFooterWordIndex] = useState(0);
  const [footerText, setFooterText] = useState("");
  const [footerDeleting, setFooterDeleting] = useState(false);
  const [footerCursor, setFooterCursor] = useState(true);

  // Blinking cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setFooterCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  // Typewriter effect
  useEffect(() => {
    const currentWord = FOOTER_NICHES[footerWordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!footerDeleting) {
      if (footerText.length < currentWord.length) {
        timeout = setTimeout(() => {
          setFooterText(currentWord.slice(0, footerText.length + 1));
        }, 100 + Math.random() * 50);
      } else {
        timeout = setTimeout(() => setFooterDeleting(true), 2000);
      }
    } else {
      if (footerText.length > 0) {
        timeout = setTimeout(() => {
          setFooterText(currentWord.slice(0, footerText.length - 1));
        }, 60);
      } else {
        setFooterDeleting(false);
        setFooterWordIndex((prev) => (prev + 1) % FOOTER_NICHES.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [footerText, footerDeleting, footerWordIndex]);

  // Estados para o fluxo de finalização de pedido
  const [checkoutStep, setCheckoutStep] = useState(0); // 0 = fechado, 1-4 = modais
  const [orderObservation, setOrderObservation] = useState("");
  const [deliveryType, setDeliveryType] = useState<
    "pickup" | "delivery" | "dine_in"
  >("pickup");
  const [deliveryTypeChosen, setDeliveryTypeChosen] = useState(false); // Se o usuário já escolheu o tipo de entrega
  const [showDeliveryTypeModal, setShowDeliveryTypeModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<{
    id: number;
    name: string;
    description: string | null;
    price: string;
    promotionalPrice?: string | null;
    minComplementPrice?: string | number | null;
    images: string[] | null;
    hasStock: boolean;
    availableStock: number | null;
    outOfStock: boolean;
  } | null>(null);
  const [priceChangeAlert, setPriceChangeAlert] = useState<Array<{
    name: string;
    oldPrice: number;
    newPrice: number;
  }> | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "pix" | "pix_online" | "card_online" | null
  >(null);
  const paymentSectionRef = useRef<HTMLDivElement>(null);
  const [paymentError, setPaymentError] = useState(false);
  const [showCardOptions, setShowCardOptions] = useState(false);
  const [changeAmount, setChangeAmount] = useState("");
  const [changeAmountError, setChangeAmountError] = useState<string | null>(
    null
  );
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddressData>({
    street: "",
    number: "",
    neighborhood: "",
    complement: "",
    reference: "",
    lat: "",
    lng: "",
  });
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
  });
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [whatsAppConfirmationPending, setWhatsAppConfirmationPending] =
    useState(false);
  const [pendingWhatsAppOrderUrl, setPendingWhatsAppOrderUrl] = useState<
    string | null
  >(null);

  // PIX Online (Paytime) states
  const [pixOnlineEmv, setPixOnlineEmv] = useState<string | null>(null);
  const [pixOnlineTransactionId, setPixOnlineTransactionId] = useState<
    string | null
  >(null);
  const [pixOnlineStatus, setPixOnlineStatus] = useState<
    "idle" | "waiting" | "confirmed" | "expired"
  >("idle");
  const [pixOnlineOrderId, setPixOnlineOrderId] = useState<number | null>(null);
  const [pixCodeCopied, setPixCodeCopied] = useState(false);
  const [manualPixKeyCopied, setManualPixKeyCopied] = useState(false);
  // Smart Checkout (Cartão Paytime) states
  const [cardPaymentStatus, setCardPaymentStatus] = useState<
    "idle" | "filling" | "processing" | "antifraud" | "confirmed" | "failed"
  >("idle");
  const [cardPaymentOrderId, setCardPaymentOrderId] = useState<number | null>(
    null
  );
  const [cardPaymentTransactionId, setCardPaymentTransactionId] = useState<
    string | null
  >(null);
  const [cardAntifraudId, setCardAntifraudId] = useState<string | null>(null);
  const [cardAntifraudSession, setCardAntifraudSession] = useState<
    string | null
  >(null);
  const [cardFormData, setCardFormData] = useState({
    holderName: "",
    holderDocument: "",
    cardNumber: "",
    expirationMonth: "",
    expirationYear: "",
    securityCode: "",
    // Dados do cliente para antifraude
    firstName: "",
    lastName: "",
    document: "",
    phone: "",
    email: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [cardFormErrors, setCardFormErrors] = useState<Record<string, string>>(
    {}
  );
  const [installments, setInstallments] = useState(1);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(
    null
  );
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showMobileBag, setShowMobileBag] = useState(false);
  const [showFreeDeliveryConfetti, setShowFreeDeliveryConfetti] =
    useState(false);
  const prevFreeDeliveryAchievedRef = useRef(false);
  const [bagAutoOpenEnabled, setBagAutoOpenEnabled] = useState(true); // Controla se a sacola deve abrir automaticamente
  // Estados de agendamento
  const [isScheduling, setIsScheduling] = useState(false); // Se o fluxo é de agendamento
  const [scheduledDate, setScheduledDate] = useState<string>(""); // Data selecionada YYYY-MM-DD
  const [scheduledTime, setScheduledTime] = useState<string>(""); // Hora selecionada HH:MM
  const [orderStatus, setOrderStatus] = useState<
    "sent" | "accepted" | "delivering" | "delivered" | "cancelled"
  >("sent");
  const [cancellationReasonDisplay, setCancellationReasonDisplay] = useState<
    string | null
  >(null);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMenuSpotlight, setShowMenuSpotlight] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const desktopPedidosButtonRef = useRef<HTMLButtonElement>(null);

  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(
    new Set()
  );
  // Track canReview status per order in history: { orderId: { checked: boolean, canReview: boolean } }
  const [historyCanReview, setHistoryCanReview] = useState<
    Record<string, { checked: boolean; canReview: boolean }>
  >({});
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [currentOrderNumber, setCurrentOrderNumber] = useState<string | null>(
    null
  );
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const [selectedComplementImage, setSelectedComplementImage] = useState<
    string | null
  >(null);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [canReviewChecked, setCanReviewChecked] = useState(false);
  const [canReview, setCanReview] = useState(true);
  const [proactiveReviewOrder, setProactiveReviewOrder] = useState<{
    id: number;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
  } | null>(null);
  const proactiveReviewCheckedRef = useRef(false);

  // Estados para taxa por bairro
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<{
    name: string;
    fee: string;
  } | null>(null);
  const [showNeighborhoodModal, setShowNeighborhoodModal] = useState(false);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");
  const [isNeighborhoodButtonHovered, setIsNeighborhoodButtonHovered] =
    useState(false);
  const [reopenBagAfterNeighborhood, setReopenBagAfterNeighborhood] =
    useState(false);
  const [showNoNeighborhoodTooltipSelect, setShowNoNeighborhoodTooltipSelect] =
    useState(false);
  const [
    showNoNeighborhoodTooltipAdvance,
    setShowNoNeighborhoodTooltipAdvance,
  ] = useState(false);

  // Estados para taxa por raio (km)
  const [radiusFeeCalculated, setRadiusFeeCalculated] = useState<{
    fee: string;
    distanceKm: number;
    distanceText: string;
    durationText: string;
  } | null>(null);
  const [radiusFeeOutOfRange, setRadiusFeeOutOfRange] = useState(false);
  const [radiusFeeLoading, setRadiusFeeLoading] = useState(false);

  // Estados do sistema de fidelidade
  const [showLoyaltyIntroSheet, setShowLoyaltyIntroSheet] = useState(false);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [loyaltyStep, setLoyaltyStep] = useState<"login" | "register" | "card">(
    "login"
  );
  const [loyaltyPhone, setLoyaltyPhone] = useState("");
  const [loyaltyPassword, setLoyaltyPassword] = useState("");
  const [loyaltyName, setLoyaltyName] = useState("");
  const [loyaltyError, setLoyaltyError] = useState("");
  const [isLoyaltyLoggedIn, setIsLoyaltyLoggedIn] = useState(false);
  const [showCouponAppliedModal, setShowCouponAppliedModal] = useState(false);
  const [appliedCouponInfo, setAppliedCouponInfo] = useState<{
    code: string;
    type: string;
    value: number;
  } | null>(null);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);

  // Estados do sistema de cashback
  const [showCashbackIntroSheet, setShowCashbackIntroSheet] = useState(false);
  const [showCashbackModal, setShowCashbackModal] = useState(false);
  const [cashbackStep, setCashbackStep] = useState<
    "login" | "register" | "wallet"
  >("login");
  const [cashbackPhone, setCashbackPhone] = useState("");
  const [cashbackPassword, setCashbackPassword] = useState("");
  const [cashbackName, setCashbackName] = useState("");
  const [cashbackError, setCashbackError] = useState("");
  const [isCashbackLoggedIn, setIsCashbackLoggedIn] = useState(false);
  const [useCashbackInOrder, setUseCashbackInOrder] = useState(false);
  const [cashbackAmountToUse, setCashbackAmountToUse] = useState("0");
  const [showCashbackCheckoutSheet, setShowCashbackCheckoutSheet] =
    useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [allStoriesViewed, setAllStoriesViewed] = useState(false);
  const [storyInitialIndex, setStoryInitialIndex] = useState(0);
  // Rastreamento de analytics: qual story originou a ação atual
  const [storySource, setStorySource] = useState<{
    storyId: number;
    establishmentId: number;
  } | null>(null);
  const recordStoryEventMutation = trpc.publicStories.recordEvent.useMutation();

  // Helper para obter IDs vistos do localStorage
  const getViewedStoryIds = useCallback((estId: number): number[] => {
    try {
      const key = `mindi_stories_viewed_${estId}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  // Helper para salvar um story como visto no localStorage
  const markStoryAsViewed = useCallback(
    (estId: number, storyId: number) => {
      try {
        const key = `mindi_stories_viewed_${estId}`;
        const viewed = getViewedStoryIds(estId);
        if (!viewed.includes(storyId)) {
          viewed.push(storyId);
          localStorage.setItem(key, JSON.stringify(viewed));
        }
      } catch {}
    },
    [getViewedStoryIds]
  );

  const userOrdersRef = useRef<typeof userOrders>([]);
  const socialDropdownRef = useRef<HTMLDivElement>(null);
  const productShareDropdownRef = useRef<HTMLDivElement>(null);
  const ratingTooltipRef = useRef<HTMLDivElement>(null);
  const categoriesNavRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const categoryButtonRefs = useRef<{
    [key: number]: HTMLButtonElement | null;
  }>({});
  const neighborhoodDropdownRef = useRef<HTMLDivElement>(null);

  // Utils do TRPC para chamadas imperativas
  const trpcUtils = trpc.useUtils();

  const publicChatActiveOrderIds = useMemo(() => {
    return userOrders
      .filter(order => {
        const status = String(order.status || "").toLowerCase();
        if (status === "cancelled") return false;
        if (status === "delivered" || status === "completed") {
          const orderTimestamp = order.date
            ? new Date(order.date).getTime()
            : 0;
          return orderTimestamp > Date.now() - 60 * 60 * 1000;
        }
        return true;
      })
      .map(order => Number(order.orderId))
      .filter(orderId => Number.isFinite(orderId) && orderId > 0);
  }, [userOrders]);

  const { data, isLoading, error } = trpc.publicMenu.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  // Query para buscar horários de funcionamento
  const { data: businessHoursData } = trpc.publicMenu.getBusinessHours.useQuery(
    { establishmentId: data?.establishment?.id || 0 },
    { enabled: !!data?.establishment?.id, staleTime: 300000 }
  );

  // Query para buscar configurações de agendamento
  const { data: schedulingConfig } = trpc.scheduling.getPublicConfig.useQuery(
    { slug: slug || "" },
    { enabled: !!slug, staleTime: 300000 }
  );

  // Query para buscar horários de funcionamento (para agendamento)
  const { data: schedulingBusinessHours } =
    trpc.scheduling.getPublicBusinessHours.useQuery(
      { slug: slug || "" },
      { enabled: !!slug && !!schedulingConfig?.schedulingEnabled }
    );

  // SSE para receber atualizações em tempo real do menu (stories, produtos, etc.)
  useMenuSSE({
    slug,
    establishmentId: data?.establishment?.id,
    enabled: !!slug && !!data?.establishment?.id,
  });

  // Query para verificar se há stories ativos
  const { data: storiesStatus } = trpc.publicStories.hasActive.useQuery(
    { establishmentId: data?.establishment?.id || 0 },
    { enabled: !!data?.establishment?.id, staleTime: 60000 }
  );

  // Verificar se todos os stories já foram vistos (via localStorage com comparação de IDs)
  useEffect(() => {
    if (!storiesStatus?.hasStories || !data?.establishment?.id) return;
    try {
      const viewedIds = getViewedStoryIds(data.establishment.id);
      if (viewedIds.length > 0 && storiesStatus.storyIds) {
        const activeIds = storiesStatus.storyIds;
        // Verificar se TODOS os IDs ativos estão nos IDs vistos
        const allViewed = activeIds.every((id: number) =>
          viewedIds.includes(id)
        );
        setAllStoriesViewed(allViewed);
      } else {
        setAllStoriesViewed(false);
      }
    } catch {
      setAllStoriesViewed(false);
    }
  }, [
    storiesStatus,
    data?.establishment?.id,
    showStoryViewer,
    getViewedStoryIds,
  ]);

  // Query para buscar stories ativos (lazy - só quando abrir o viewer)
  const { data: activeStories, refetch: refetchStories } =
    trpc.publicStories.getActive.useQuery(
      { establishmentId: data?.establishment?.id || 0 },
      { enabled: false }
    );

  // Query para buscar complementos do produto selecionado
  const { data: productComplements } =
    trpc.publicMenu.getProductComplements.useQuery(
      { productId: selectedProduct?.id || 0 },
      { enabled: !!selectedProduct?.id }
    );

  // Query para buscar opcoes de troca dos itens inclusos
  const { data: productSubstitutions } =
    trpc.substitution.listByProduct.useQuery(
      { productId: selectedProduct?.id || 0 },
      { enabled: !!selectedProduct?.id }
    );
  // State para trocas selecionadas: Map<complementItemId, substitutionId>
  const [selectedSubstitutions, setSelectedSubstitutions] = useState<Map<number, number>>(new Map());

  // Abrir automaticamente o modal de produto quando o link público vier com ?produto=ID
  useEffect(() => {
    if (!data?.products?.length) return;
    const params = new URLSearchParams(window.location.search);
    const productParam = params.get("produto");
    if (!productParam || productDeepLinkHandledRef.current === productParam)
      return;

    const productId = Number(productParam);
    if (!Number.isFinite(productId)) return;

    const product = data.products.find((item: any) => item.id === productId);
    if (!product || (product as any).outOfStock) return;

    const establishment = data.establishment;
    if (establishment?.allowsDelivery) {
      setDeliveryType("delivery");
    } else if (establishment?.allowsPickup) {
      setDeliveryType("pickup");
    } else if (establishment?.allowsDineIn) {
      setDeliveryType("dine_in");
    }

    productDeepLinkHandledRef.current = productParam;
    setDeliveryTypeChosen(true);
    setShowDeliveryTypeModal(false);
    setPendingProduct(null);
    setModalImageIndex(0);
    setSelectedProduct(product);
    setProductQuantity(1);
    setProductObservation("");
    setSelectedComplements(new Map());
    setSelectedSubstitutions(new Map());
    setSelectedComplementImage(null);
    setShowProductShareDropdown(false);
  }, [data?.products, data?.establishment]);

  // Fechar o menu de compartilhamento do produto ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productShareDropdownRef.current &&
        !productShareDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProductShareDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getProductShareLink = useCallback(
    (productId: number) => {
      const basePath = slug ? `/menu/${slug}` : window.location.pathname;
      return `${window.location.origin}${basePath}?produto=${productId}`;
    },
    [slug]
  );

  const shareProductLink = useCallback(
    async (platform: "copy" | "whatsapp" | "facebook") => {
      if (!selectedProduct) return;

      const link = getProductShareLink(selectedProduct.id);
      const message = `Confira ${selectedProduct.name} no cardápio: ${link}`;

      if (platform === "copy") {
        try {
          await navigator.clipboard.writeText(link);
          toast.success("Link do produto copiado!");
        } catch {
          toast.error("Não foi possível copiar o link.");
        }
        setShowProductShareDropdown(false);
        return;
      }

      if (platform === "whatsapp") {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(message)}`,
          "_blank",
          "noopener,noreferrer"
        );
        setShowProductShareDropdown(false);
        return;
      }

      if (platform === "facebook") {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
          "_blank",
          "noopener,noreferrer"
        );
        setShowProductShareDropdown(false);
      }
    },
    [selectedProduct, getProductShareLink]
  );

  // IDs únicos de complementos no carrinho (estável com useMemo)
  const cartComplementIds = useMemo(() => {
    const ids = new Set<number>();
    cart.forEach(item => item.complements.forEach(c => ids.add(c.id)));
    return Array.from(ids).sort();
  }, [cart]);

  // IDs de produtos e categorias no carrinho para upsell suggestions
  const cartProductIds = useMemo(() => {
    return Array.from(new Set(cart.map(item => item.productId)));
  }, [cart]);

  const cartCategoryIds = useMemo(() => {
    if (!data?.products) return [];
    const categoryIds = new Set<number>();
    cart.forEach(item => {
      const product = data.products.find((p: any) => p.id === item.productId);
      if (product?.categoryId) categoryIds.add(product.categoryId);
    });
    return Array.from(categoryIds);
  }, [cart, data?.products]);

  // Query para buscar sugestões de upsell (ativada no step 2 do checkout)
  const { data: upsellSuggestions } =
    trpc.publicMenu.getUpsellSuggestions.useQuery(
      {
        establishmentId: data?.establishment?.id || 0,
        cartProductIds,
        cartCategoryIds,
        limit: 7,
      },
      {
        enabled:
          !!data?.establishment?.id && checkoutStep === 2 && cart.length > 0,
        staleTime: 30000,
      }
    );

  // Query para buscar info completa dos complementos no carrinho (priceMode, freeOn*)
  const { data: cartComplementsInfo } =
    trpc.publicMenu.getComplementItemsInfo.useQuery(
      { ids: cartComplementIds },
      { enabled: cartComplementIds.length > 0 }
    );

  // Função para mudar tipo de entrega no checkout com verificação de preço
  const handleDeliveryTypeChange = useCallback(
    (newType: "delivery" | "pickup" | "dine_in") => {
      if (newType === deliveryType) return;

      // Verificar se algum complemento no carrinho tem preço diferente no novo contexto
      if (cartComplementsInfo && cartComplementsInfo.length > 0) {
        const changes: Array<{
          name: string;
          oldPrice: number;
          newPrice: number;
        }> = [];

        cart.forEach(item => {
          item.complements.forEach(cartComplement => {
            if (cartComplement.isIncluded || cartComplement.groupType === "included") {
              return;
            }

            const fullInfo = cartComplementsInfo.find(
              ci => ci.id === cartComplement.id
            );
            if (fullInfo) {
              const oldPrice = getComplementPrice(fullInfo, deliveryType);
              const newPrice = getComplementPrice(fullInfo, newType);
              if (oldPrice !== newPrice) {
                // Verificar se já não foi adicionado (mesmo complemento em itens diferentes)
                if (
                  !changes.find(
                    c =>
                      c.name === fullInfo.name &&
                      c.oldPrice === oldPrice &&
                      c.newPrice === newPrice
                  )
                ) {
                  changes.push({ name: fullInfo.name, oldPrice, newPrice });
                }
              }
            }
          });
        });

        if (changes.length > 0) {
          // Atualizar os preços dos complementos no carrinho
          setCart(prev =>
            prev.map(item => ({
              ...item,
              complements: item.complements.map(c => {
                if (c.isIncluded || c.groupType === "included") {
                  return { ...c, price: "0" };
                }

                const fullInfo = cartComplementsInfo.find(ci => ci.id === c.id);
                if (fullInfo) {
                  const newPrice = getComplementPrice(fullInfo, newType);
                  return { ...c, price: String(newPrice) };
                }
                return c;
              }),
            }))
          );

          setPriceChangeAlert(changes);
          // Auto-dismiss após 8 segundos
          setTimeout(() => setPriceChangeAlert(null), 8000);
        }
      }

      setDeliveryType(newType);
      if (newType !== "delivery") {
        setSelectedNeighborhood(null);
      }
      // Abrir modal de seleção de bairro automaticamente ao selecionar delivery quando taxa é por bairro
      // Só abre se há bairros configurados para evitar bloquear scroll sem modal visível
      if (
        newType === "delivery" &&
        data?.establishment?.deliveryFeeType === "byNeighborhood" &&
        !selectedNeighborhood &&
        neighborhoodFeesData &&
        neighborhoodFeesData.length > 0
      ) {
        setShowNeighborhoodModal(true);
      }
    },
    [
      deliveryType,
      cart,
      cartComplementsInfo,
      data?.establishment,
      selectedNeighborhood,
    ]
  );

  // Mutation para criar avaliação
  const createReviewMutation = trpc.publicMenu.createReview.useMutation({
    onSuccess: () => {
      // Invalidar query de reviews para atualizar a lista
      if (data?.establishment) {
        reviewsQuery.refetch();
      }
    },
  });

  // Query para buscar avaliações do estabelecimento
  const reviewsQuery = trpc.publicMenu.getReviews.useQuery(
    { establishmentId: data?.establishment?.id || 0 },
    { enabled: !!data?.establishment?.id, staleTime: 120000 }
  );

  // Query para verificar se fidelidade está ativa
  const { data: loyaltyEnabled } = trpc.loyalty.isEnabled.useQuery(
    { establishmentId: data?.establishment?.id || 0 },
    { enabled: !!data?.establishment?.id, staleTime: 300000 }
  );

  // Query para verificar se cashback está ativo
  const { data: cashbackEnabled } = trpc.cashback.isEnabled.useQuery(
    { establishmentId: data?.establishment?.id || 0 },
    { enabled: !!data?.establishment?.id, staleTime: 300000 }
  );

  // Query para buscar saldo de cashback do cliente
  const cashbackBalanceQuery = trpc.cashback.getBalance.useQuery(
    { establishmentId: data?.establishment?.id || 0, phone: cashbackPhone },
    {
      enabled:
        !!data?.establishment?.id && isCashbackLoggedIn && !!cashbackPhone,
    }
  );

  // Query para buscar histórico de transações de cashback
  const cashbackTransactionsQuery = trpc.cashback.getTransactions.useQuery(
    {
      establishmentId: data?.establishment?.id || 0,
      phone: cashbackPhone,
      limit: 30,
    },
    {
      enabled:
        !!data?.establishment?.id &&
        isCashbackLoggedIn &&
        !!cashbackPhone &&
        showCashbackModal &&
        cashbackStep === "wallet",
    }
  );

  // Mutation para registrar sessão de visualização do cardápio
  const registerSessionMutation = trpc.menuViews.registerSession.useMutation();

  // Forçar tema claro no menu público - isolar do tema do admin
  const { forceTheme } = useTheme();
  useEffect(() => {
    // Forçar tema claro enquanto o menu público estiver montado
    forceTheme("light");
    return () => {
      // Restaurar tema do admin ao sair do menu público
      forceTheme(null);
    };
  }, [forceTheme]);

  // Registrar sessão quando o cardápio é carregado
  useEffect(() => {
    if (data?.establishment?.id) {
      // Gerar ou recuperar session_id do localStorage
      let sessionId = localStorage.getItem("menu_session_id");
      if (!sessionId) {
        sessionId = createSafeRandomId("menu");
        localStorage.setItem("menu_session_id", sessionId);
      }

      // Registrar a sessão
      registerSessionMutation.mutate({
        sessionId,
        establishmentId: data.establishment.id,
      });
    }
  }, [data?.establishment?.id]);

  // Polling do status de pagamento PIX Online (Paytime)
  useEffect(() => {
    if (pixOnlineStatus !== "waiting" || !pixOnlineOrderId) return;

    const pollInterval = setInterval(async () => {
      try {
        const result = await trpcUtils.paytime.checkPaymentStatus.fetch({
          orderId: pixOnlineOrderId,
        });
        if (result.status === "APPROVED") {
          setPixOnlineStatus("confirmed");
          setOrderSent(true);
          setOrderStatus("sent");

          // Limpar sacola e estados após pagamento confirmado
          setCart([]);
          if (slug) {
            clearCartFromStorage(slug);
          }

          // Invalidar cache do menu para atualizar disponibilidade dos produtos (estoque)
          trpcUtils.publicMenu.getBySlug.invalidate({ slug: slug || "" });
          setOrderObservation("");
          setAppliedCoupon(null);
          setChangeAmount("");
          setChangeAmountError(null);

          clearInterval(pollInterval);
        } else if (
          result.status === "EXPIRED" ||
          result.status === "CANCELLED"
        ) {
          setPixOnlineStatus("expired");
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Erro ao verificar status do pagamento PIX:", error);
      }
    }, 4000); // Verificar a cada 4 segundos

    // Timeout de 15 minutos
    const timeout = setTimeout(
      () => {
        setPixOnlineStatus("expired");
        clearInterval(pollInterval);
      },
      15 * 60 * 1000
    );

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [pixOnlineStatus, pixOnlineOrderId]);

  // Sync body data-threeds-active attribute when 3DS antifraud is active
  // This disables pointer-events on #root so Cardinal Commerce 3DS iframe is clickable
  useEffect(() => {
    if (cardPaymentStatus === "antifraud") {
      document.body.setAttribute("data-threeds-active", "true");
    } else {
      document.body.removeAttribute("data-threeds-active");
    }
    return () => {
      document.body.removeAttribute("data-threeds-active");
    };
  }, [cardPaymentStatus]);

  // Polling do status de pagamento CARTÃO Online (Paytime)
  useEffect(() => {
    if (cardPaymentStatus !== "processing" && cardPaymentStatus !== "antifraud")
      return;
    if (!cardPaymentOrderId) return;

    const pollInterval = setInterval(async () => {
      try {
        const result = await trpcUtils.paytime.checkPaymentStatus.fetch({
          orderId: cardPaymentOrderId,
        });
        if (result.status === "APPROVED") {
          setCardPaymentStatus("confirmed");
          setOrderSent(true);
          setOrderStatus("sent");

          // Limpar sacola e estados após pagamento confirmado
          setCart([]);
          if (slug) {
            clearCartFromStorage(slug);
          }

          // Invalidar cache do menu para atualizar disponibilidade dos produtos (estoque)
          trpcUtils.publicMenu.getBySlug.invalidate({ slug: slug || "" });
          setOrderObservation("");
          setAppliedCoupon(null);
          setChangeAmount("");
          setChangeAmountError(null);

          clearInterval(pollInterval);
        } else if (result.status === "FAILED") {
          setCardPaymentStatus("failed");
          setOrderError(
            "Pagamento recusado. Verifique os dados do cartão e tente novamente."
          );
          clearInterval(pollInterval);
        } else if (
          result.status === "CANCELLED" ||
          result.status === "EXPIRED"
        ) {
          setCardPaymentStatus("failed");
          setOrderError("Pagamento cancelado ou expirado.");
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Erro ao verificar status do pagamento CARTÃO:", error);
      }
    }, 4000); // Verificar a cada 4 segundos

    // Timeout de 5 minutos
    const timeout = setTimeout(
      () => {
        if (
          cardPaymentStatus === "processing" ||
          cardPaymentStatus === "antifraud"
        ) {
          setCardPaymentStatus("failed");
          setOrderError(
            "Tempo limite para pagamento excedido. Tente novamente."
          );
        }
        clearInterval(pollInterval);
      },
      5 * 60 * 1000
    );

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [cardPaymentStatus, cardPaymentOrderId]);

  // Query para buscar taxas por bairro
  const { data: neighborhoodFeesData } =
    trpc.publicMenu.getNeighborhoodFees.useQuery(
      { establishmentId: data?.establishment?.id || 0 },
      {
        enabled:
          !!data?.establishment?.id &&
          data?.establishment?.deliveryFeeType === "byNeighborhood",
        staleTime: 300000,
      }
    );

  // Query para calcular taxa por raio quando o cliente tem lat/lng
  const radiusFeeQuery = trpc.publicMenu.calculateDeliveryFeeByRadius.useQuery(
    {
      establishmentId: data?.establishment?.id || 0,
      customerLat: deliveryAddress.lat || "",
      customerLng: deliveryAddress.lng || "",
    },
    {
      enabled:
        !!data?.establishment?.id &&
        data?.establishment?.deliveryFeeType === "byRadius" &&
        !!deliveryAddress.lat &&
        !!deliveryAddress.lng,
      retry: false,
    }
  );

  // Atualizar estado do raio quando a query retorna
  useEffect(() => {
    if (
      data?.establishment?.deliveryFeeType !== "byRadius" ||
      !deliveryAddress.lat ||
      !deliveryAddress.lng
    ) {
      setRadiusFeeCalculated(null);
      setRadiusFeeOutOfRange(false);
      setRadiusFeeLoading(false);
      return;
    }

    if (radiusFeeQuery.data) {
      if (radiusFeeQuery.data.outOfRange) {
        setRadiusFeeOutOfRange(true);
        setRadiusFeeCalculated(null);
      } else {
        setRadiusFeeOutOfRange(false);
        setRadiusFeeCalculated({
          fee: radiusFeeQuery.data.fee!,
          distanceKm: radiusFeeQuery.data.distanceKm,
          distanceText: radiusFeeQuery.data.distanceText,
          durationText: radiusFeeQuery.data.durationText,
        });
      }
    }

    if (radiusFeeQuery.isError) {
      setRadiusFeeOutOfRange(false);
      setRadiusFeeCalculated(null);
    }

    setRadiusFeeLoading(radiusFeeQuery.isLoading);
  }, [
    data?.establishment?.deliveryFeeType,
    deliveryAddress.lat,
    deliveryAddress.lng,
    radiusFeeQuery.data,
    radiusFeeQuery.isLoading,
    radiusFeeQuery.isError,
  ]);

  // Query para buscar cartão de fidelidade do cliente
  const loyaltyCardQuery = trpc.loyalty.getCustomerCard.useQuery(
    { establishmentId: data?.establishment?.id || 0, phone: loyaltyPhone },
    {
      enabled: !!data?.establishment?.id && isLoyaltyLoggedIn && !!loyaltyPhone,
    }
  );

  // Mutation para login no cartão fidelidade
  const loyaltyLoginMutation = trpc.loyalty.customerLogin.useMutation({
    onSuccess: () => {
      setIsLoyaltyLoggedIn(true);
      setLoyaltyStep("card");
      setLoyaltyError("");
      // Salvar telefone no localStorage
      localStorage.setItem(
        "loyaltyPhone_" + data?.establishment?.id,
        loyaltyPhone
      );
    },
    onError: error => {
      setLoyaltyError(error.message);
    },
  });

  // Mutation para cadastro no cartão fidelidade
  const loyaltyRegisterMutation = trpc.loyalty.customerRegister.useMutation({
    onSuccess: () => {
      setIsLoyaltyLoggedIn(true);
      setLoyaltyStep("card");
      setLoyaltyError("");
      // Salvar telefone no localStorage
      localStorage.setItem(
        "loyaltyPhone_" + data?.establishment?.id,
        loyaltyPhone
      );
    },
    onError: error => {
      setLoyaltyError(error.message);
    },
  });

  // Mutation para login no cashback (reutiliza o mesmo sistema de login do fidelidade)
  const cashbackLoginMutation = trpc.loyalty.customerLogin.useMutation({
    onSuccess: () => {
      setIsCashbackLoggedIn(true);
      setCashbackStep("wallet");
      setCashbackError("");
      localStorage.setItem(
        "cashbackPhone_" + data?.establishment?.id,
        cashbackPhone
      );
    },
    onError: error => {
      setCashbackError(error.message);
    },
  });

  // Mutation para cadastro no cashback
  const cashbackRegisterMutation = trpc.loyalty.customerRegister.useMutation({
    onSuccess: () => {
      setIsCashbackLoggedIn(true);
      setCashbackStep("wallet");
      setCashbackError("");
      localStorage.setItem(
        "cashbackPhone_" + data?.establishment?.id,
        cashbackPhone
      );
    },
    onError: error => {
      setCashbackError(error.message);
    },
  });

  // Manter ref de userOrders sincronizada
  useEffect(() => {
    userOrdersRef.current = userOrders;
  }, [userOrders]);

  // Sincronizar carrinho com localStorage sempre que mudar
  useEffect(() => {
    if (slug && cart.length > 0) {
      saveCartToStorage(slug, cart);
    } else if (slug && cart.length === 0) {
      // Se o carrinho está vazio, remover do localStorage
      clearCartFromStorage(slug);
    }
  }, [cart, slug]);

  // Confetti para entrega grátis - ver useEffect abaixo de getFreeDeliveryProgress

  // Fechar sacola mobile automaticamente quando o carrinho fica vazio
  useEffect(() => {
    if (cart.length === 0 && showMobileBag) {
      setShowMobileBag(false);
    }
  }, [cart.length, showMobileBag]);

  // Carregar dados de fidelidade do localStorage
  useEffect(() => {
    if (data?.establishment?.id) {
      const savedPhone = localStorage.getItem(
        "loyaltyPhone_" + data.establishment.id
      );
      if (savedPhone) {
        setLoyaltyPhone(savedPhone);
        setIsLoyaltyLoggedIn(true);
        setLoyaltyStep("card");
      }
    }
  }, [data?.establishment?.id]);

  const getLoyaltyIntroViewedKey = useCallback(() => {
    const establishmentKey = data?.establishment?.id || slug || "public-menu";
    return `loyaltyIntroViewed_${establishmentKey}`;
  }, [data?.establishment?.id, slug]);

  const openLoyaltyFlow = useCallback(() => {
    setLoyaltyError("");
    setShowLoyaltyIntroSheet(false);

    if (isLoyaltyLoggedIn) {
      setShowLoyaltyModal(true);
      setLoyaltyStep("card");
      loyaltyCardQuery.refetch();
      return;
    }

    const hasAlreadySeenIntro = localStorage.getItem(getLoyaltyIntroViewedKey()) === "true";

    if (hasAlreadySeenIntro) {
      setShowLoyaltyModal(true);
      setLoyaltyStep("register");
      return;
    }

    setShowLoyaltyModal(false);
    setShowLoyaltyIntroSheet(true);
  }, [getLoyaltyIntroViewedKey, isLoyaltyLoggedIn, loyaltyCardQuery]);

  const continueFromLoyaltyIntro = useCallback(() => {
    localStorage.setItem(getLoyaltyIntroViewedKey(), "true");
    setShowLoyaltyIntroSheet(false);
    setShowLoyaltyModal(true);
    setLoyaltyStep("register");
    setLoyaltyError("");
  }, [getLoyaltyIntroViewedKey]);
  
  // Carregar dados de cashback do localStorage
  useEffect(() => {
    if (data?.establishment?.id) {
      const savedPhone = localStorage.getItem(
        "cashbackPhone_" + data.establishment.id
      );
      if (savedPhone) {
        setCashbackPhone(savedPhone);
        setIsCashbackLoggedIn(true);
        setCashbackStep("wallet");
      }
    }
  }, [data?.establishment?.id]);

  // Definir deliveryType inicial baseado nas opções disponíveis
  useEffect(() => {
    if (data?.establishment) {
      const options = [
        data.establishment.allowsDelivery,
        data.establishment.allowsPickup,
        data.establishment.allowsDineIn,
      ].filter(Boolean).length;

      // Selecionar a primeira opção disponível - priorizar delivery
      if (data.establishment.allowsDelivery) {
        setDeliveryType("delivery");
      } else if (data.establishment.allowsPickup) {
        setDeliveryType("pickup");
      } else if (data.establishment.allowsDineIn) {
        setDeliveryType("dine_in");
      }

      // Se só tem 1 opção, marcar como já escolhido automaticamente
      if (options <= 1) {
        setDeliveryTypeChosen(true);
      }
    }
  }, [data?.establishment?.id]);

  // Mutation para criar pedido
  const createOrderMutation = trpc.publicMenu.createOrder.useMutation({
    onSuccess: result => {
      // Salvar endereço e dados do cliente no localStorage
      if (deliveryType === "delivery") {
        localStorage.setItem(
          "savedDeliveryAddress",
          JSON.stringify(deliveryAddress)
        );
      }
      localStorage.setItem("savedCustomerInfo", JSON.stringify(customerInfo));

      // Criar novo pedido para o histórico local
      // Para pagamentos online (PIX QR Code / Cartão Online), o status inicial é "sent" mas o pedido
      // só será realmente enviado ao restaurante após confirmação do pagamento
      const isOnlinePaymentMethod =
        paymentMethod === "pix_online" || paymentMethod === "card_online";
      const shouldWaitForWhatsAppConfirmation =
        isLitePlan && !isOnlinePaymentMethod;
      // Calcular subtotal, taxa de entrega e total real para o histórico local.
      const orderSubtotal = cart.reduce((sum, item) => {
        const itemTotal = parseFloat(item.price) * item.quantity;
        const complementsTotal =
          item.complements.reduce(
            (s, c) => s + parseFloat(c.price) * (c.quantity || 1),
            0
          ) * item.quantity;
        return sum + itemTotal + complementsTotal;
      }, 0);
      const orderDeliveryFee =
        deliveryType === "delivery" ? getDeliveryFee(orderSubtotal) : 0;
      const orderDiscount = appliedCoupon?.discount || 0;
      const orderCardFee = (paymentMethod === "card_online" && (establishment as any)?.paytimeCardFeePassthrough !== false) ? 0.99 : 0;
      const orderTotal = Math.max(
        0,
        orderSubtotal - orderDiscount + orderDeliveryFee + orderCardFee
      );
      const newOrder = {
        id: result.orderNumber,
        orderId: result.orderId, // ID único do banco (para tracking sem colisão com reset diário)
        date: new Date().toISOString(),
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          complements: item.complements.map(c => ({
            name: c.name,
            price: c.price,
            quantity: c.quantity || 1,
          })),
        })),
        total: orderTotal.toFixed(2),
        subtotal: orderSubtotal.toFixed(2),
        deliveryFee: orderDeliveryFee.toFixed(2),
        discount: orderDiscount.toFixed(2),
        status: "sent" as const,
        deliveryType,
        paymentMethod: paymentMethod!,
        address: deliveryType === "delivery" ? deliveryAddress : undefined,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        observation: orderObservation,
      };

      // Salvar no localStorage (por establishmentId)
      const establishmentId = data?.establishment?.id;
      if (establishmentId) {
        const existingOrders = loadOrdersFromStorage(establishmentId);
        // Verificar se é o primeiro pedido do cliente neste estabelecimento
        const isFirstOrder = existingOrders.length === 0;
        const updatedOrders = [newOrder, ...existingOrders];
        saveOrdersToStorage(establishmentId, updatedOrders);
        setUserOrders(updatedOrders);

        // Mostrar spotlight do menu após o primeiro pedido (com delay para o modal de sucesso aparecer primeiro)
        const spotlightShownKey = `menu_spotlight_shown_${establishmentId}`;
        if (isFirstOrder && !localStorage.getItem(spotlightShownKey)) {
          localStorage.setItem(spotlightShownKey, "true");
          // O spotlight será ativado quando o cliente fechar o modal de sucesso (clicar em "Acompanhar pedido")
          // Usamos um flag para saber que deve mostrar
          localStorage.setItem(
            `menu_spotlight_pending_${establishmentId}`,
            "true"
          );
        }
      }
      setSelectedOrderId(newOrder.id);
      // Usar orderId para tracking SSE (evita colisão com reset diário)
      setCurrentOrderNumber(result.orderId.toString());
      // Salvar o número visual do pedido para exibição na tela de sucesso
      setCreatedOrderNumber(result.orderNumber);
      // Iniciar tracking SSE usando orderId (único, sem colisão com reset diário)
      const trackingId = result.orderId.toString();
      orderSSE.trackOrder(trackingId, update => {
        console.log(
          "[PublicMenu] Atualização SSE recebida (novo pedido):",
          update
        );
        const newStatus = statusMap[update.status] || "sent";

        // Atualizar o pedido no estado local (match por orderId)
        setUserOrders(prevOrders => {
          const newOrders = prevOrders.map(order => {
            if (
              order.orderId === update.id ||
              order.id === update.orderNumber
            ) {
              return { ...order, status: newStatus };
            }
            return order;
          });
          // Salvar no localStorage por establishmentId
          if (data?.establishment?.id) {
            saveOrdersToStorage(data.establishment.id, newOrders);
          }
          return newOrders;
        });

        // Se o pedido foi entregue (completed), atualizar o cartão fidelidade
        if (update.status === "completed" && isLoyaltyLoggedIn) {
          console.log(
            "[PublicMenu] Pedido entregue - atualizando cartão fidelidade"
          );
          loyaltyCardQuery.refetch();
        }

        // Se o modal de tracking está aberto para este pedido, atualizar diretamente
        // Usa refs para evitar problemas de closure
        const currentTrackingId = currentOrderNumberRef.current;
        console.log(
          "[PublicMenu] Modal aberto:",
          showTrackingModalRef.current,
          "Tracking ID atual:",
          currentTrackingId,
          "Pedido atualizado orderId:",
          update.id
        );
        if (
          showTrackingModalRef.current &&
          (currentTrackingId === trackingId ||
            currentTrackingId === update.orderNumber)
        ) {
          console.log(
            "[PublicMenu] Atualizando orderStatus no modal para:",
            newStatus
          );
          setOrderStatus(newStatus);
          if (update.cancellationReason) {
            setCancellationReasonDisplay(update.cancellationReason);
          }
        }
      });

      // Rastrear order_completed se veio de um story
      try {
        const storyCartSource = sessionStorage.getItem(
          "mindi_story_cart_source"
        );
        if (storyCartSource) {
          const source = JSON.parse(storyCartSource);
          const orderTotal = cart.reduce((sum, item) => {
            const itemTotal = parseFloat(item.price) * item.quantity;
            const complementsTotal =
              item.complements.reduce(
                (s, c) => s + parseFloat(c.price) * (c.quantity || 1),
                0
              ) * item.quantity;
            return sum + itemTotal + complementsTotal;
          }, 0);
          recordStoryEventMutation.mutate({
            storyId: source.storyId,
            establishmentId: source.establishmentId,
            eventType: "order_completed",
            orderId: result.orderId,
            orderValue: orderTotal.toFixed(2),
            sessionId:
              sessionStorage.getItem("mindi_story_session") || undefined,
          });
          sessionStorage.removeItem("mindi_story_cart_source");
        }
      } catch {}

      // Para pagamentos online (PIX QR Code / Cartão Online), NÃO marcar como enviado ainda.
      // O pedido só será marcado como "enviado" após o pagamento ser confirmado.
      // Isso permite que o modal mostre o QR Code PIX ou formulário de cartão primeiro.
      // IMPORTANTE: Para pagamentos online, manter isSendingOrder=true até o QR Code/formulário estar pronto
      if (!isOnlinePaymentMethod && !shouldWaitForWhatsAppConfirmation) {
        setIsSendingOrder(false);
        setOrderSent(true);
        setOrderStatus("sent");

        // Limpar sacola e resetar estados apenas para pagamentos offline
        setCart([]);
        if (slug) {
          clearCartFromStorage(slug);
        }

        // Invalidar cache do menu para atualizar disponibilidade dos produtos (estoque)
        trpcUtils.publicMenu.getBySlug.invalidate({ slug: slug || "" });
        setOrderObservation("");
        setAppliedCoupon(null);
        setChangeAmount("");
        setChangeAmountError(null);
      }
    },
    onError: (error: any) => {
      console.error("Erro ao enviar pedido:", error);
      setIsSendingOrder(false);

      // Extrair mensagem de erro detalhada
      let errorMessage = "Erro ao enviar pedido. Por favor, tente novamente.";

      if (error?.message) {
        if (error.message.includes("fechado")) {
          errorMessage =
            "O estabelecimento está fechado no momento. Não é possível realizar pedidos.";
          // Recarregar dados do estabelecimento para atualizar o status
          trpcUtils.publicMenu.getBySlug.invalidate({ slug: slug || "" });
        } else if (error.message.includes("Network")) {
          errorMessage =
            "Erro de conexão. Verifique sua internet e tente novamente.";
        } else if (error.message.includes("timeout")) {
          errorMessage =
            "O servidor demorou muito para responder. Tente novamente.";
        } else if (
          error.message.includes("validation") ||
          error.message.includes("required")
        ) {
          errorMessage =
            "Dados inválidos. Verifique se todos os campos estão preenchidos corretamente.";
        } else {
          errorMessage = `Erro: ${error.message}`;
        }
      }

      // Log detalhado para debug
      console.error("Detalhes do erro:", {
        message: error?.message,
        code: error?.data?.code,
        httpStatus: error?.data?.httpStatus,
        path: error?.data?.path,
      });

      // Exibir erro no modal em vez de alert
      setOrderError(errorMessage);
    },
  });

  // Mutation para criar pagamento PIX Online via Paytime
  const createPixPaymentMutation = trpc.paytime.createPixPayment.useMutation({
    onSuccess: result => {
      setIsSendingOrder(false);
      setPixOnlineEmv(result.emv ?? null);
      setPixOnlineTransactionId(result.transactionId);
      setPixOnlineStatus("waiting");
    },
    onError: (error: any) => {
      console.error("Erro ao criar pagamento PIX:", error);
      setIsSendingOrder(false);
      let errorMessage = "Erro ao gerar QR Code PIX. Tente novamente.";
      if (error?.message) {
        errorMessage = error.message;
      }
      setOrderError(errorMessage);
    },
  });

  // Mutation para criar pagamento com cartão via Paytime (Smart Checkout)
  const createCardPaymentMutation = trpc.paytime.createCardPayment.useMutation({
    onSuccess: (result, variables) => {
      const currentOrderId = variables.orderId; // Usar orderId das variables para evitar stale closure
      setCardPaymentTransactionId(result.transactionId);

      if (
        result.needsAntifraud &&
        result.antifraudId &&
        result.antifraudSession
      ) {
        // Antifraude requerido - executar SDK 3DS PagSeguro
        setCardAntifraudId(result.antifraudId);
        setCardAntifraudSession(result.antifraudSession);
        setCardPaymentStatus("antifraud");

        // Executar 3DS automaticamente
        try {
          const PagSeguro = (window as any).PagSeguro;
          if (!PagSeguro) {
            console.error("SDK PagSeguro não carregado");
            // SDK não carregou - mostrar erro ao usuário
            setCardPaymentStatus("failed");
            setIsSendingOrder(false);
            setOrderError(
              "Erro ao carregar verificação de segurança. Recarregue a página e tente novamente."
            );
            return;
          }

          // Usar o ambiente retornado pelo backend (baseado na PAYTIME_BASE_URL)
          // Isso garante que frontend e backend usem o mesmo ambiente (SANDBOX ou PROD)
          const sdkEnv = result.sdkEnv || "SANDBOX";
          console.log(
            "[3DS] Ambiente SDK:",
            sdkEnv,
            "hostname:",
            window.location.hostname
          );
          console.log("[3DS] Session:", result.antifraudSession);
          console.log("[3DS] AntifraudId:", result.antifraudId);
          PagSeguro.setUp({
            session: result.antifraudSession,
            env: sdkEnv,
          });

          // Montar payload 3DS
          const nameParts = cardFormData.holderName.trim().split(/\s+/);
          const phoneClean = customerInfo.phone.replace(/\D/g, "");
          const phoneArea = phoneClean.substring(0, 2);
          const phoneNumber = phoneClean.substring(2);

          // Calcular total em centavos
          const subtotal3ds = cart.reduce((sum: number, item: any) => {
            const itemTotal = parseFloat(item.price) * item.quantity;
            const complementsTotal =
              item.complements.reduce(
                (s: number, c: any) =>
                  s + parseFloat(c.price) * (c.quantity || 1),
                0
              ) * item.quantity;
            return sum + itemTotal + complementsTotal;
          }, 0);
          const deliveryFee3ds =
            deliveryType === "delivery" ? getDeliveryFee(subtotal3ds) : 0;
          const discount3ds = appliedCoupon?.discount || 0;
          const total3ds = Math.max(
            0,
            subtotal3ds - discount3ds + deliveryFee3ds
          );
          const amountCents3ds = Math.round(total3ds * 100);

          const threeDsRequest = {
            data: {
              customer: {
                name: cardFormData.holderName,
                email: cardFormData.email || "cliente@email.com",
                phones: [
                  {
                    country: "55",
                    area: phoneArea || "11",
                    number: phoneNumber || "999999999",
                    type: "MOBILE",
                  },
                  {
                    country: "55",
                    area: phoneArea || "11",
                    number: phoneNumber || "999999999",
                    type: "HOME",
                  },
                  {
                    country: "55",
                    area: phoneArea || "11",
                    number: phoneNumber || "999999999",
                    type: "BUSINESS",
                  },
                ],
              },
              paymentMethod: {
                type: "CREDIT_CARD",
                installments: installments,
                card: {
                  number: cardFormData.cardNumber.replace(/\s/g, ""),
                  expMonth: cardFormData.expirationMonth.padStart(2, "0"),
                  expYear:
                    cardFormData.expirationYear.length === 2
                      ? "20" + cardFormData.expirationYear
                      : cardFormData.expirationYear,
                  holder: {
                    name: cardFormData.holderName,
                  },
                },
              },
              amount: {
                value: amountCents3ds,
                currency: "BRL",
              },
              billingAddress: {
                street: "Rua Teste",
                number: "100",
                complement: "Apto 1",
                regionCode: "SP",
                country: "BRA",
                city: "Sao Paulo",
                postalCode: "01001000",
              },
              shippingAddress: {
                street: "Rua Teste",
                number: "100",
                complement: "Apto 1",
                regionCode: "SP",
                country: "BRA",
                city: "Sao Paulo",
                postalCode: "01001000",
              },
              dataOnly: false,
            },
          };

          console.log(
            "[3DS] Iniciando autenticação 3DS...",
            JSON.stringify(threeDsRequest, null, 2)
          );
          PagSeguro.authenticate3DS(threeDsRequest)
            .then((threeDsResult: any) => {
              console.log(
                "[3DS] Resultado completo:",
                JSON.stringify(threeDsResult)
              );
              const threeDsStatus =
                threeDsResult?.status || "AUTH_FLOW_COMPLETED";
              const authStatus =
                threeDsResult?.authenticationStatus || "AUTHENTICATED";
              // O SDK retorna um 'id' que é DIFERENTE do antifraudId da Paytime
              // Este id do SDK é o que deve ser enviado no body do antifraud-auth
              const threeDsSdkId = threeDsResult?.id || null;
              console.log(
                "[3DS] SDK id:",
                threeDsSdkId,
                "status:",
                threeDsStatus,
                "authStatus:",
                authStatus
              );

              if (threeDsStatus === "CHANGE_PAYMENT_METHOD") {
                // Cartão rejeitado pelo 3DS
                setCardPaymentStatus("failed");
                setOrderError(
                  "Cartão não aceito. Por favor, use outro cartão."
                );
                return;
              }

              // Enviar resultado ao backend (AUTH_FLOW_COMPLETED ou AUTH_NOT_SUPPORTED)
              // IMPORTANTE: threeDsSdkId é o id gerado pelo SDK PagSeguro, usado no body do antifraud-auth
              confirmAntifraudMutation.mutate({
                orderId: currentOrderId,
                transactionId: result.transactionId,
                antifraudId: result.antifraudId!,
                threeDsStatus,
                authenticationStatus: authStatus,
                threeDsSdkId: threeDsSdkId || undefined,
              });
            })
            .catch((err: any) => {
              console.error("[3DS] Erro:", err);
              console.error(
                "[3DS] Erro detalhes:",
                JSON.stringify(err, Object.getOwnPropertyNames(err))
              );
              // Verificar se o erro tem detail com mensagem específica
              const errDetail = err?.detail?.message || err?.message || "";
              console.error("[3DS] Erro detail:", errDetail);

              // Se o SDK retornou erro, mostrar mensagem clara ao usuário
              // Não tentar confirmar sem 3DS pois a Paytime rejeita sem o id do SDK
              setCardPaymentStatus("failed");
              setIsSendingOrder(false);
              if (errDetail.includes("Invalid request parameters")) {
                setOrderError(
                  "Erro na verificação de segurança do cartão. Verifique os dados do cartão e tente novamente."
                );
              } else {
                setOrderError(
                  "Erro na verificação de segurança. Tente novamente ou use outro método de pagamento."
                );
              }
            });
        } catch (err) {
          console.error("[3DS] Erro ao iniciar 3DS:", err);
          // SDK não conseguiu iniciar - mostrar erro ao usuário
          setCardPaymentStatus("failed");
          setIsSendingOrder(false);
          setOrderError(
            "Erro ao iniciar verificação de segurança. Tente novamente ou use outro método de pagamento."
          );
        }
      } else if (result.status === "PAID") {
        // Pagamento aprovado diretamente
        setCardPaymentStatus("confirmed");
        setOrderSent(true);
        setOrderStatus("sent");
        // Limpar sacola e estados após pagamento confirmado
        setCart([]);
        if (slug) {
          clearCartFromStorage(slug);
        }
        // Invalidar cache do menu para atualizar disponibilidade dos produtos (estoque)
        trpcUtils.publicMenu.getBySlug.invalidate({ slug: slug || "" });
        setOrderObservation("");
        setAppliedCoupon(null);
        setChangeAmount("");
        setChangeAmountError(null);
      } else {
        // Pagamento pendente - iniciar polling
        setCardPaymentStatus("processing");
      }
    },
    onError: (error: any) => {
      console.error("Erro ao criar pagamento com cartão:", error);
      setIsSendingOrder(false);
      setCardPaymentStatus("failed");
      let errorMessage =
        "Erro ao processar pagamento com cartão. Tente novamente.";
      if (error?.message) {
        errorMessage = error.message;
      }
      setOrderError(errorMessage);
    },
  });

  // Mutation para confirmar antifraude (3DS)
  const confirmAntifraudMutation = trpc.paytime.confirmAntifraud.useMutation({
    onSuccess: result => {
      console.log("[3DS] confirmAntifraud resultado:", JSON.stringify(result));
      if (result.status === "PAID") {
        setCardPaymentStatus("confirmed");
        setOrderSent(true);
        setOrderStatus("sent");
        // Limpar sacola e estados após pagamento confirmado
        setCart([]);
        if (slug) {
          clearCartFromStorage(slug);
        }
        // Invalidar cache do menu para atualizar disponibilidade dos produtos (estoque)
        trpcUtils.publicMenu.getBySlug.invalidate({ slug: slug || "" });
        setOrderObservation("");
        setAppliedCoupon(null);
        setChangeAmount("");
        setChangeAmountError(null);
      } else if (result.status === "FAILED") {
        setCardPaymentStatus("failed");
        setOrderError("Pagamento não aprovado após verificação de segurança.");
      } else {
        // Pendente - aguardar webhook
        setCardPaymentStatus("processing");
      }
    },
    onError: (error: any) => {
      console.error("[3DS] Erro na confirmação antifraude:", error);
      console.error("[3DS] Erro detalhes:", error?.message, error?.data);
      // Mudar para processing para iniciar polling (pode ser confirmado via webhook)
      setCardPaymentStatus("processing");
    },
  });

  // Query para buscar pedidos pelo telefone
  const { data: phoneOrders, refetch: refetchPhoneOrders } =
    trpc.publicMenu.getOrdersByPhone.useQuery(
      {
        phone: customerInfo.phone,
        establishmentId: data?.establishment?.id || 0,
      },
      { enabled: false } // Só busca quando chamado manualmente
    );

  // Determinar o orderId numérico para buscar no servidor
  // currentOrderNumber pode ser orderId (novo) ou orderNumber (legado)
  const currentOrderIdForQuery = (() => {
    if (!currentOrderNumber) return 0;
    // Se é um número puro, é orderId
    const parsed = parseInt(currentOrderNumber, 10);
    if (
      !isNaN(parsed) &&
      parsed > 0 &&
      !currentOrderNumber.startsWith("#") &&
      !currentOrderNumber.startsWith("P")
    ) {
      return parsed;
    }
    // Se é orderNumber visual (ex: #P1, P1), buscar o orderId do userOrders
    const order = userOrders.find(o => o.id === currentOrderNumber);
    return order?.orderId || 0;
  })();

  // Query para buscar status do pedido atual usando orderId (único, sem colisão)
  // Não usa polling - atualizações vem via SSE ou sincronização manual
  const { data: currentOrderData, refetch: refetchOrderStatus } =
    trpc.publicMenu.getOrderById.useQuery(
      { orderId: currentOrderIdForQuery },
      {
        enabled: currentOrderIdForQuery > 0 && showTrackingModal,
        refetchOnMount: true, // Buscar ao montar
        staleTime: 30000, // Considerar dados válidos por 30 segundos
      }
    );

  // Forçar refetch quando o modal abrir e inicializar orderStatus com o status do pedido selecionado
  useEffect(() => {
    if (showTrackingModal && currentOrderNumber) {
      // Inicializar orderStatus com o status do pedido selecionado do userOrders
      // Buscar por orderId (numérico) ou por id (orderNumber visual)
      const selectedOrder = userOrders.find(
        o =>
          o.orderId?.toString() === currentOrderNumber ||
          o.id === currentOrderNumber
      );
      if (selectedOrder) {
        setOrderStatus(selectedOrder.status);
        // Limpar motivo de cancelamento se não for cancelado
        if (selectedOrder.status !== "cancelled") {
          setCancellationReasonDisplay(null);
        }
      }
      // Buscar status atualizado do servidor
      refetchOrderStatus();
    }
  }, [showTrackingModal, currentOrderNumber]);

  // *** LISTENER SSE DEDICADO PARA O MODAL DE TRACKING ***
  // Este useEffect registra um callback específico quando o modal está aberto
  // O callback atualiza diretamente o orderStatus sem depender de refs ou closures
  // O cleanup remove o callback quando o modal fecha
  useEffect(() => {
    // Só registrar listener se o modal estiver aberto e tiver um pedido selecionado
    if (!showTrackingModal || !currentOrderNumber) {
      return;
    }

    console.log(
      "[PublicMenu] Modal aberto - registrando listener SSE dedicado para:",
      currentOrderNumber
    );

    // Callback dedicado para o modal de tracking
    // Este callback é criado DENTRO do useEffect, então sempre terá acesso aos valores atuais
    const modalStatusCallback = (update: {
      id?: number;
      orderNumber: string;
      status: string;
      cancellationReason?: string;
    }) => {
      console.log(
        "[PublicMenu] [Modal Listener] Atualização SSE recebida:",
        update
      );

      // Verificar se a atualização é para o pedido que está sendo visualizado
      // Comparar por orderId (novo) ou orderNumber (legado)
      const updateOrderId = update.id ? update.id.toString() : "";
      if (
        updateOrderId === currentOrderNumber ||
        update.orderNumber === currentOrderNumber
      ) {
        const newStatus = statusMap[update.status] || "sent";
        console.log(
          "[PublicMenu] [Modal Listener] Atualizando orderStatus para:",
          newStatus
        );

        // Atualizar o status do modal diretamente
        setOrderStatus(newStatus);

        // Atualizar motivo de cancelamento se houver
        if (update.cancellationReason) {
          setCancellationReasonDisplay(update.cancellationReason);
        }
      }
    };

    // Registrar o callback usando o novo método addCallback
    // Isso adiciona o callback SEM substituir os existentes
    const removeCallback = orderSSE.addCallback(
      currentOrderNumber,
      modalStatusCallback
    );

    // Cleanup: remover o callback quando o modal fechar ou o pedido mudar
    return () => {
      console.log(
        "[PublicMenu] Modal fechado - removendo listener SSE dedicado para:",
        currentOrderNumber
      );
      removeCallback();
    };
  }, [showTrackingModal, currentOrderNumber]); // Dependências mínimas para evitar re-registros desnecessários

  // Sincronizar orderStatus quando userOrders muda e o modal está aberto
  // Isso garante que atualizações SSE reflitam no modal imediatamente
  // Usa setOrderStatus com callback para evitar problemas de closure com orderStatus
  useEffect(() => {
    if (showTrackingModal && currentOrderNumber) {
      // Buscar por orderId (numérico) ou por id (orderNumber visual)
      const selectedOrder = userOrders.find(
        o =>
          o.orderId?.toString() === currentOrderNumber ||
          o.id === currentOrderNumber
      );
      if (selectedOrder) {
        // Usar callback para comparar com o valor atual e evitar problemas de stale closure
        setOrderStatus(prevStatus => {
          if (prevStatus !== selectedOrder.status) {
            console.log(
              "[PublicMenu] Sincronizando orderStatus com userOrders:",
              selectedOrder.status,
              "(anterior:",
              prevStatus,
              ")"
            );
            if (selectedOrder.status === "cancelled") {
              // Buscar motivo de cancelamento do servidor se necessário
              refetchOrderStatus();
            }
            return selectedOrder.status;
          }
          return prevStatus;
        });
      }
    }
  }, [userOrders, showTrackingModal, currentOrderNumber, refetchOrderStatus]);

  // Atualizar o status do pedido quando os dados mudarem
  useEffect(() => {
    if (currentOrderData?.status && selectedOrderId) {
      const statusMap: Record<
        string,
        "sent" | "accepted" | "delivering" | "delivered" | "cancelled"
      > = {
        new: "sent",
        preparing: "accepted",
        ready: "delivering",
        completed: "delivered",
        cancelled: "cancelled",
      };
      const mappedStatus = statusMap[currentOrderData.status] || "sent";
      if (mappedStatus !== orderStatus) {
        setOrderStatus(mappedStatus);
      }

      // Salvar o motivo de cancelamento se houver
      if (
        currentOrderData.status === "cancelled" &&
        (currentOrderData as any).cancellationReason
      ) {
        setCancellationReasonDisplay(
          (currentOrderData as any).cancellationReason
        );
      } else {
        setCancellationReasonDisplay(null);
      }

      // Atualizar o status do pedido no localStorage e no estado
      setUserOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order =>
          order.orderId?.toString() === selectedOrderId ||
          order.id === selectedOrderId
            ? { ...order, status: mappedStatus }
            : order
        );
        // Salvar no localStorage por establishmentId
        if (data?.establishment?.id) {
          saveOrdersToStorage(data.establishment.id, updatedOrders);
        }
        return updatedOrders;
      });

      // Não precisa mais resetar canReviewCheckingRef aqui
      // O useEffect de canReview agora usa orderStatus como dependência
    }
  }, [currentOrderData?.status, selectedOrderId]);

  // Ref para controlar se já verificamos canReview para este pedido
  const canReviewCheckingRef = useRef<string | null>(null);

  // Verificar canReview quando:
  // 1. O pedido selecionado mudar
  // 2. O status do pedido mudar para 'delivered'
  // Usa uma chave única (orderId + establishmentId + status) para evitar chamadas duplicadas
  useEffect(() => {
    // Se não tem pedido selecionado, resetar
    if (!selectedOrderId) {
      setCanReviewChecked(false);
      setCanReview(true);
      canReviewCheckingRef.current = null;
      return;
    }

    // Se não tem establishmentId ainda, aguardar
    if (!data?.establishment?.id) {
      return;
    }

    // Se o status atual não é 'delivered', não precisa verificar
    // Usa orderStatus do estado (mais confiável que a ref)
    if (orderStatus !== "delivered") {
      setCanReviewChecked(false);
      setCanReview(true);
      return;
    }

    // Criar chave única para este pedido + estabelecimento + status delivered
    const checkKey = `${selectedOrderId}_${data.establishment.id}_delivered`;

    // Se já verificou este pedido com status delivered, não fazer nada
    if (canReviewCheckingRef.current === checkKey) {
      return;
    }

    // Buscar o pedido selecionado usando a ref - buscar por orderId ou orderNumber visual
    const selectedOrder = userOrdersRef.current.find(
      o => o.orderId?.toString() === selectedOrderId || o.id === selectedOrderId
    );

    // Se não tem telefone do cliente, não pode verificar
    if (!selectedOrder?.customerPhone) {
      setCanReviewChecked(true);
      setCanReview(true); // Permitir avaliar se não conseguir verificar
      return;
    }

    // Marcar que estamos verificando este pedido
    canReviewCheckingRef.current = checkKey;
    setCanReviewChecked(false);
    setCanReview(true); // Mostrar botão enquanto verifica (otimista)

    // Enviar telefone original para a API - a normalização é feita no backend
    // Verificar no backend se pode avaliar
    // tRPC espera o input no formato { json: { ... } }
    const url = `/api/trpc/publicMenu.canReview?input=${encodeURIComponent(
      JSON.stringify({
        json: {
          establishmentId: data.establishment.id,
          customerPhone: selectedOrder.customerPhone,
        },
      })
    )}`;

    console.log("[canReview] Verificando se pode avaliar:", {
      establishmentId: data.establishment.id,
      customerPhone: selectedOrder.customerPhone,
    });

    fetch(url)
      .then(res => res.json())
      .then(result => {
        console.log("[canReview] Resposta da API:", result);

        // Verificar se ainda é o mesmo pedido
        if (canReviewCheckingRef.current !== checkKey) {
          console.log("[canReview] Pedido mudou, ignorando resposta");
          return;
        }

        // Tentar extrair canReview de diferentes estruturas de resposta
        let canReviewValue = true; // Default: permitir avaliar

        // tRPC com superjson retorna: result.result.data.json.canReview
        if (result?.result?.data?.json?.canReview !== undefined) {
          canReviewValue = result.result.data.json.canReview;
          console.log(
            "[canReview] Encontrado em result.result.data.json.canReview"
          );
        } else if (result?.result?.data?.canReview !== undefined) {
          canReviewValue = result.result.data.canReview;
          console.log("[canReview] Encontrado em result.result.data.canReview");
        } else if (result?.data?.json?.canReview !== undefined) {
          canReviewValue = result.data.json.canReview;
          console.log("[canReview] Encontrado em result.data.json.canReview");
        } else if (result?.data?.canReview !== undefined) {
          canReviewValue = result.data.canReview;
          console.log("[canReview] Encontrado em result.data.canReview");
        } else if (result?.canReview !== undefined) {
          canReviewValue = result.canReview;
          console.log("[canReview] Encontrado em result.canReview");
        } else {
          console.log(
            "[canReview] Estrutura de resposta não reconhecida, permitindo avaliar"
          );
        }

        console.log("[canReview] Valor final canReview:", canReviewValue);
        setCanReview(canReviewValue);
        setCanReviewChecked(true);
      })
      .catch(err => {
        console.error("[canReview] Erro ao verificar se pode avaliar:", err);
        if (canReviewCheckingRef.current === checkKey) {
          setCanReviewChecked(true);
          setCanReview(true); // Em caso de erro, permitir avaliar
        }
      });
  }, [selectedOrderId, data?.establishment?.id, orderStatus]); // Adicionado orderStatus para verificar quando mudar para delivered

  // Set first category as active when data loads
  useEffect(() => {
    if (
      data?.categories &&
      data.categories.length > 0 &&
      activeCategory === null
    ) {
      setActiveCategory(data.categories[0].id);
    }
  }, [data?.categories, activeCategory]);

  // Carregar pedidos salvos do localStorage (por establishmentId)
  useEffect(() => {
    if (data?.establishment?.id) {
      const savedOrders = loadOrdersFromStorage(data.establishment.id);
      setUserOrders(savedOrders);
    }
  }, [data?.establishment?.id]);

  // Sincronizar status dos pedidos quando o modal Meus Pedidos é aberto
  // E também periodicamente enquanto o modal estiver aberto
  useEffect(() => {
    const syncOrderStatuses = async () => {
      if (
        !showOrdersModal ||
        !data?.establishment?.id ||
        userOrders.length === 0
      )
        return;

      const localStatusMap: Record<
        string,
        "sent" | "accepted" | "delivering" | "delivered" | "cancelled"
      > = {
        new: "sent",
        preparing: "accepted",
        ready: "delivering",
        completed: "delivered",
        cancelled: "cancelled",
      };

      // Buscar status atualizado de cada pedido em andamento
      const ordersToUpdate = userOrders.filter(
        o => o.status !== "delivered" && o.status !== "cancelled"
      );

      if (ordersToUpdate.length === 0) return;

      try {
        const updatedOrders = await Promise.all(
          ordersToUpdate.map(async order => {
            try {
              // Usar orderId (sem colisão) quando disponível, fallback para orderNumber (legado)
              const response = order.orderId
                ? await trpcUtils.client.publicMenu.getOrderById.query({
                    orderId: order.orderId,
                  })
                : await trpcUtils.client.publicMenu.getOrderByNumber.query({
                    orderNumber: order.id,
                    establishmentId: data.establishment.id,
                  });

              if (response?.status) {
                const newStatus =
                  localStatusMap[response.status] || order.status;
                return { ...order, status: newStatus };
              }
              return order;
            } catch {
              return order;
            }
          })
        );

        // Atualizar o estado com os novos status
        setUserOrders(prevOrders => {
          const newOrders = prevOrders.map(order => {
            const updated = updatedOrders.find(u => u.id === order.id);
            return updated || order;
          });
          // Salvar no localStorage por establishmentId
          if (data?.establishment?.id) {
            saveOrdersToStorage(data.establishment.id, newOrders);
          }
          return newOrders;
        });
      } catch (e) {
        console.error("Erro ao sincronizar status dos pedidos:", e);
      }
    };

    // Sincronizar imediatamente ao abrir o modal
    syncOrderStatuses();

    // Sincronizar a cada 30 segundos enquanto o modal estiver aberto
    // Intervalo maior para evitar rate limiting
    let intervalId: NodeJS.Timeout | null = null;
    if (showOrdersModal) {
      intervalId = setInterval(syncOrderStatuses, 30000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [showOrdersModal, data?.establishment?.id]);

  // Refs para o currentOrderNumber e showTrackingModal (usados pelo callback SSE)
  const currentOrderNumberRef = useRef<string | null>(null);
  const showTrackingModalRef = useRef<boolean>(false);

  // Atualizar refs quando os estados mudarem
  useEffect(() => {
    currentOrderNumberRef.current = currentOrderNumber;
  }, [currentOrderNumber]);

  useEffect(() => {
    showTrackingModalRef.current = showTrackingModal;
  }, [showTrackingModal]);

  // Atualizar callbacks SSE quando showTrackingModal ou currentOrderNumber mudar
  // Isso garante que os callbacks sempre usem os valores mais recentes das refs
  useEffect(() => {
    if (currentOrderNumber && userOrders.length > 0) {
      const handleStatusUpdate = (update: {
        orderNumber: string;
        status: string;
        cancellationReason?: string;
      }) => {
        console.log(
          "[PublicMenu] Atualização SSE recebida (callback atualizado):",
          update
        );
        const newStatus = statusMap[update.status] || "sent";

        // Atualizar o pedido no estado local
        setUserOrders(prevOrders => {
          const newOrders = prevOrders.map(order => {
            if (order.id === update.orderNumber) {
              return { ...order, status: newStatus };
            }
            return order;
          });
          // Salvar no localStorage por establishmentId
          if (data?.establishment?.id) {
            saveOrdersToStorage(data.establishment.id, newOrders);
          }
          return newOrders;
        });

        // Se o modal de tracking está aberto para este pedido, atualizar diretamente
        console.log(
          "[PublicMenu] Modal aberto:",
          showTrackingModalRef.current,
          "Pedido atual:",
          currentOrderNumberRef.current,
          "Pedido atualizado:",
          update.orderNumber
        );
        if (
          showTrackingModalRef.current &&
          currentOrderNumberRef.current === update.orderNumber
        ) {
          console.log(
            "[PublicMenu] Atualizando orderStatus no modal para:",
            newStatus
          );
          setOrderStatus(newStatus);
          if (update.cancellationReason) {
            setCancellationReasonDisplay(update.cancellationReason);
          }
        }
      };

      // Atualizar o callback para o pedido atual
      orderSSE.updateCallback(currentOrderNumber, handleStatusUpdate);
    }
  }, [showTrackingModal, currentOrderNumber]);

  // Inicializar SSE singleton para pedidos ativos existentes (ao carregar a página)
  // Isso garante que pedidos feitos anteriormente continuem sendo monitorados
  // Usa um estado separado para controlar se já inicializou o SSE
  const [sseInitialized, setSseInitialized] = useState(false);

  useEffect(() => {
    // Só inicializar SSE após os pedidos serem carregados do localStorage
    // e apenas uma vez
    if (sseInitialized || userOrders.length === 0) {
      return;
    }

    // Pegar os orderNumbers dos pedidos em andamento
    const activeOrders = userOrders.filter(
      o => o.status !== "delivered" && o.status !== "cancelled"
    );

    // Se não tem pedidos em andamento, marcar como inicializado mas não conectar
    if (activeOrders.length === 0) {
      setSseInitialized(true);
      return;
    }

    console.log(
      `[PublicMenu] Inicializando SSE para ${activeOrders.length} pedidos ativos`
    );
    setSseInitialized(true);

    // Callback para atualizações de status
    const handleStatusUpdate = (update: {
      id?: number;
      orderNumber: string;
      status: string;
      cancellationReason?: string;
    }) => {
      console.log("[PublicMenu] Atualização SSE recebida:", update);
      const newStatus = statusMap[update.status] || "sent";
      const updateOrderId = update.id ? update.id.toString() : "";

      // Atualizar o pedido no estado local - buscar por orderId ou orderNumber
      setUserOrders(prevOrders => {
        const newOrders = prevOrders.map(order => {
          if (
            order.orderId?.toString() === updateOrderId ||
            order.id === update.orderNumber
          ) {
            return { ...order, status: newStatus };
          }
          return order;
        });
        // Salvar no localStorage por establishmentId
        if (data?.establishment?.id) {
          saveOrdersToStorage(data.establishment.id, newOrders);
        }
        return newOrders;
      });

      // Se o pedido foi entregue (completed), atualizar o cartão fidelidade
      if (update.status === "completed" && isLoyaltyLoggedIn) {
        console.log(
          "[PublicMenu] Pedido entregue - atualizando cartão fidelidade"
        );
        loyaltyCardQuery.refetch();
      }

      // Se o modal de tracking está aberto para este pedido, atualizar diretamente
      // Usa refs para evitar problemas de closure
      const currentRef = currentOrderNumberRef.current;
      console.log(
        "[PublicMenu] Modal aberto:",
        showTrackingModalRef.current,
        "Pedido atual:",
        currentRef,
        "Pedido atualizado: orderId=",
        updateOrderId,
        "orderNumber=",
        update.orderNumber
      );
      if (
        showTrackingModalRef.current &&
        (currentRef === updateOrderId || currentRef === update.orderNumber)
      ) {
        console.log(
          "[PublicMenu] Atualizando orderStatus no modal para:",
          newStatus
        );
        setOrderStatus(newStatus);
        if (update.cancellationReason) {
          setCancellationReasonDisplay(update.cancellationReason);
        }
      }
    };

    // Registrar cada pedido ativo no SSE singleton usando orderId (sem colisão com reset diário)
    // O singleton garante que apenas UMA conexão seja aberta
    activeOrders.forEach(order => {
      const trackingId = order.orderId ? order.orderId.toString() : order.id;
      orderSSE.trackOrder(trackingId, handleStatusUpdate);
    });

    // Cleanup: remover pedidos do tracking quando o componente desmontar
    return () => {
      activeOrders.forEach(order => {
        const trackingId = order.orderId ? order.orderId.toString() : order.id;
        orderSSE.untrackOrder(trackingId);
      });
    };
  }, [userOrders.length, sseInitialized]); // Executar quando pedidos forem carregados do localStorage

  // Efeito separado para adicionar novos pedidos ao SSE quando userOrders muda
  useEffect(() => {
    if (!sseInitialized) return;

    const activeOrders = userOrders.filter(
      o => o.status !== "delivered" && o.status !== "cancelled"
    );

    // Callback para atualizações de status
    const handleStatusUpdate = (update: {
      id?: number;
      orderNumber: string;
      status: string;
      cancellationReason?: string;
    }) => {
      console.log("[PublicMenu] Atualização SSE recebida:", update);
      const newStatus = statusMap[update.status] || "sent";
      const updateOrderId = update.id ? update.id.toString() : "";

      // Atualizar o pedido no estado local - buscar por orderId ou orderNumber
      setUserOrders(prevOrders => {
        const newOrders = prevOrders.map(order => {
          if (
            order.orderId?.toString() === updateOrderId ||
            order.id === update.orderNumber
          ) {
            return { ...order, status: newStatus };
          }
          return order;
        });
        // Salvar no localStorage por establishmentId
        if (data?.establishment?.id) {
          saveOrdersToStorage(data.establishment.id, newOrders);
        }
        return newOrders;
      });

      // Se o pedido foi entregue (completed), atualizar o cartão fidelidade
      if (update.status === "completed" && isLoyaltyLoggedIn) {
        console.log(
          "[PublicMenu] Pedido entregue - atualizando cartão fidelidade"
        );
        loyaltyCardQuery.refetch();
      }

      // Se o modal de tracking está aberto para este pedido, atualizar diretamente
      const currentRef = currentOrderNumberRef.current;
      if (
        showTrackingModalRef.current &&
        (currentRef === updateOrderId || currentRef === update.orderNumber)
      ) {
        console.log(
          "[PublicMenu] Atualizando orderStatus no modal para:",
          newStatus
        );
        setOrderStatus(newStatus);
        if (update.cancellationReason) {
          setCancellationReasonDisplay(update.cancellationReason);
        }
      }
    };

    // Registrar cada pedido ativo no SSE singleton usando orderId (sem colisão com reset diário)
    activeOrders.forEach(order => {
      // Atualizar callback para garantir que use os valores mais recentes
      const trackingId = order.orderId ? order.orderId.toString() : order.id;
      orderSSE.updateCallback(trackingId, handleStatusUpdate);
    });

    // NÃO fazer cleanup aqui - o cleanup só deve acontecer quando o componente desmontar
  }, [userOrders, sseInitialized]);

  // Carregar endereço salvo do localStorage
  useEffect(() => {
    const savedAddress = localStorage.getItem("savedDeliveryAddress");
    if (savedAddress) {
      try {
        const parsed = JSON.parse(savedAddress);
        setDeliveryAddress(parsed);
      } catch (e) {
        console.error("Erro ao carregar endereço salvo:", e);
      }
    }
    const savedCustomer = localStorage.getItem("savedCustomerInfo");
    if (savedCustomer) {
      try {
        const parsed = JSON.parse(savedCustomer);
        setCustomerInfo(parsed);
      } catch (e) {
        console.error("Erro ao carregar dados do cliente:", e);
      }
    }
  }, []);

  // Sincronizar selectedNeighborhood.name com deliveryAddress.neighborhood
  // Garante que quando o bairro é selecionado no modal (byNeighborhood),
  // o deliveryAddress.neighborhood é sempre atualizado, evitando dessincronização
  useEffect(() => {
    if (selectedNeighborhood) {
      setDeliveryAddress(prev => {
        if (prev.neighborhood !== selectedNeighborhood.name) {
          return { ...prev, neighborhood: selectedNeighborhood.name };
        }
        return prev;
      });
    }
  }, [selectedNeighborhood]);

  // Close social dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        socialDropdownRef.current &&
        !socialDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSocialDropdown(false);
      }
      if (
        ratingTooltipRef.current &&
        !ratingTooltipRef.current.contains(event.target as Node)
      ) {
        setShowRatingTooltip(false);
      }
      // Removido - modal fecha pelo backdrop
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Modal proativo de avaliação: verifica pedido entregue pendente ao entrar no cardápio.
  // Ao dispensar, a decisão vale apenas para a sessão atual.
  useEffect(() => {
    if (proactiveReviewCheckedRef.current) return;
    if (!data?.establishment?.id) return;
    const establishmentPlanType = data?.establishment?.planType;
    if (
      data?.establishment?.reviewsEnabled === false ||
      establishmentPlanType === "free" ||
      establishmentPlanType === "lite" ||
      establishmentPlanType === "trial"
    )
      return;

    const savedCustomer = localStorage.getItem("savedCustomerInfo");
    if (!savedCustomer) return;

    let phone = "";
    try {
      const parsed = JSON.parse(savedCustomer);
      phone = parsed.phone || "";
    } catch {
      return;
    }

    if (!phone || phone.replace(/\D/g, "").length < 10) return;

    const dismissedKey = `review_dismissed_${data.establishment.id}_${phone}`;
    if (isReviewDismissedForPeriod(dismissedKey)) return;

    proactiveReviewCheckedRef.current = true;

    const url = `/api/trpc/publicMenu.pendingReview?input=${encodeURIComponent(
      JSON.stringify({
        json: {
          establishmentId: data.establishment.id,
          customerPhone: phone,
        },
      })
    )}`;

    fetch(url)
      .then(res => res.json())
      .then(result => {
        const payload =
          result?.result?.data?.json ||
          result?.result?.data ||
          result?.data?.json ||
          result?.data ||
          result;
        if (payload?.hasPendingReview && payload?.order) {
          setTimeout(() => {
            setProactiveReviewOrder(payload.order);
            setShowRatingModal(true);
          }, 3000);
        }
      })
      .catch(err => {
        console.error("[proactiveReview] Error checking pending review:", err);
      });
  }, [
    data?.establishment?.id,
    data?.establishment?.reviewsEnabled,
    data?.establishment?.planType,
  ]);

  // Bloquear scroll do body quando modais estão abertos
  // Usa overflow:hidden no html+body sem position:fixed para evitar flash/reflow
  const isBodyLockedRef = useRef(false);

  useEffect(() => {
    const isAnyModalOpen =
      showOrdersModal ||
      showTrackingModal ||
      showMobileBag ||
      checkoutStep > 0 ||
      showInfoModal ||
      showCouponModal ||
      showReviewsModal ||
      showRatingModal ||
      selectedProduct !== null ||
      showFullscreenImage ||
      showNavigationModal ||
      showLoyaltyIntroSheet ||
      showCashbackIntroSheet ||
      showLoyaltyModal ||
      showNeighborhoodModal ||
      showMobileMenu ||
      showDeliveryTypeModal ||
      showMenuSpotlight;

    if (isAnyModalOpen && !isBodyLockedRef.current) {
      isBodyLockedRef.current = true;
      // Calcular largura da scrollbar para evitar shift de layout
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else if (!isAnyModalOpen && isBodyLockedRef.current) {
      isBodyLockedRef.current = false;
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
  }, [
    showOrdersModal,
    showTrackingModal,
    showMobileBag,
    checkoutStep,
    showInfoModal,
    showCouponModal,
    showReviewsModal,
    showRatingModal,
    selectedProduct,
    showFullscreenImage,
    showNavigationModal,
    showLoyaltyIntroSheet,
    showCashbackIntroSheet,
    showLoyaltyModal,
    showNeighborhoodModal,
    showMobileMenu,
    showDeliveryTypeModal,
    showMenuSpotlight,
  ]);

  // Auto-play Fade Crossfade para carrossel de imagens do modal de produto
  useEffect(() => {
    if (!selectedProduct) return;
    const images = selectedProduct.images || [];
    if (images.length <= 1) return;
    // Resetar pausa ao abrir modal
    (window as any).__carouselPaused = false;
    const interval = setInterval(() => {
      if ((window as any).__carouselPaused) return;
      setModalImageIndex(prev => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [selectedProduct]);

  // Scroll the category nav to show the active category button
  const scrollCategoryNavToActive = useCallback((categoryId: number) => {
    const button = categoryButtonRefs.current[categoryId];
    const nav = categoriesNavRef.current;
    if (button && nav) {
      const buttonRect = button.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();

      // Check if button is outside visible area
      if (buttonRect.left < navRect.left || buttonRect.right > navRect.right) {
        button.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, []);

  // Handle scroll to detect which category is in view
  useEffect(() => {
    if (!data?.categories || data.categories.length === 0) return;

    const handleScroll = () => {
      if (isScrolling) return; // Don't update during programmatic scroll

      const headerOffset = 140; // Height of sticky header + category nav

      let currentCategory: number | null = null;

      for (const category of data.categories) {
        const element = categoryRefs.current[category.id];
        if (element) {
          const rect = element.getBoundingClientRect();
          // Check if the top of the category section is above the middle of the viewport
          if (rect.top <= headerOffset + 100) {
            currentCategory = category.id;
          }
        }
      }

      if (currentCategory && currentCategory !== activeCategory) {
        setActiveCategory(currentCategory);
        scrollCategoryNavToActive(currentCategory);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [
    data?.categories,
    activeCategory,
    isScrolling,
    scrollCategoryNavToActive,
  ]);

  // Fechar modal de produto com animação slide-down
  const closeProductModal = useCallback(() => {
    setIsClosingProductModal(true);
    setTimeout(() => {
      setSelectedProduct(null);
      setSelectedComplementImage(null);
      setIsClosingProductModal(false);
    }, 300);
  }, []);

  const scrollToCategory = (categoryId: number) => {
    setIsScrolling(true);
    setActiveCategory(categoryId);
    scrollCategoryNavToActive(categoryId);

    const element = categoryRefs.current[categoryId];
    if (element) {
      const headerOffset = 130; // Height of sticky header + category nav
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }

    // Reset scrolling flag after animation completes
    setTimeout(() => {
      setIsScrolling(false);
    }, 800);
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return numPrice.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Função para normalizar texto removendo acentos
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Filter products by search query (ignoring accents) with priority sorting
  const filterProducts = (products: NonNullable<typeof data>["products"]) => {
    if (!searchQuery.trim()) return products;
    const normalizedQuery = normalizeText(searchQuery);

    // Filter products that match the query
    const filtered = products.filter(
      (p: (typeof products)[number]) =>
        normalizeText(p.name).includes(normalizedQuery) ||
        (p.description &&
          normalizeText(p.description).includes(normalizedQuery))
    );

    // Sort by relevance: 1º name starts with query, 2º name contains query, 3º description contains query
    return filtered.sort(
      (a: (typeof products)[number], b: (typeof products)[number]) => {
        const aNameNorm = normalizeText(a.name);
        const bNameNorm = normalizeText(b.name);

        const aStartsWith = aNameNorm.startsWith(normalizedQuery);
        const bStartsWith = bNameNorm.startsWith(normalizedQuery);
        const aNameContains = aNameNorm.includes(normalizedQuery);
        const bNameContains = bNameNorm.includes(normalizedQuery);

        // Priority 1: Name starts with query
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        // Priority 2: Name contains query (but doesn't start with)
        if (aNameContains && !bNameContains) return -1;
        if (!aNameContains && bNameContains) return 1;

        // Priority 3: Only description contains query (keep original order)
        return 0;
      }
    );
  };

  // Confetti é gerenciado pelo componente Confetti (mesmo efeito do WelcomeChecklist)

  // ===== HOOKS MOVIDOS PARA ANTES DOS EARLY RETURNS (React exige hooks em ordem fixa) =====
  // Calcular subtotal do carrinho (usado para confetti de frete grátis)
  const currentCartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const complementsTotal = item.complements.reduce(
        (cSum, c) => cSum + Number(c.price) * (c.quantity || 1),
        0
      );
      return sum + (parseFloat(item.price) + complementsTotal) * item.quantity;
    }, 0);
  }, [cart]);

  // Calcular se frete grátis foi atingido (precisa de data/establishment)
  const currentFreeDeliveryAchieved = useMemo(() => {
    if (!data) return false;
    // Só considerar frete grátis atingido quando tipo de entrega é delivery
    if (deliveryType !== "delivery") return false;
    const est = data.establishment as any;
    if (!est?.freeDeliveryEnabled || !est?.freeDeliveryMinValue) return false;
    const minValue = parseFloat(String(est.freeDeliveryMinValue));
    if (minValue <= 0) return false;
    if (est.deliveryFeeType === "free") return false;
    return currentCartSubtotal >= minValue;
  }, [currentCartSubtotal, data, deliveryType]);

  // Disparar confetti quando entrega grátis é desbloqueada (transição false→true)
  useEffect(() => {
    const achieved = currentFreeDeliveryAchieved;
    const wasAchieved = prevFreeDeliveryAchievedRef.current;
    prevFreeDeliveryAchievedRef.current = achieved;

    if (achieved && !wasAchieved) {
      setShowFreeDeliveryConfetti(true);
    }
  }, [currentFreeDeliveryAchieved]);

  // Confetti só dispara na transição false→true do threshold (não ao reabrir sacola)
  // ===== FIM DOS HOOKS MOVIDOS =====

  if (isLoading) {
    return <MenuSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Cardápio não encontrado
          </h2>
          <p className="text-gray-500">
            O restaurante que você procura não existe ou foi removido.
          </p>
        </div>
      </div>
    );
  }

  // Verificar se o trial expirou - bloquear menu público
  if (data.trialBlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
            <Store className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Cardápio Temporariamente Indisponível
          </h2>
          <p className="text-gray-500 leading-relaxed">
            {data.establishment?.name ? (
              <>
                {data.establishment.name} está com o cardápio temporariamente
                indisponível. Por favor, tente novamente mais tarde.
              </>
            ) : (
              <>
                Este cardápio está temporariamente indisponível. Por favor,
                tente novamente mais tarde.
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  const { establishment, categories: allCategories, products } = data;
  const currentPlanType = String(establishment.planType || "").toLowerCase();
  const isLitePlan =
    currentPlanType === "lite" ||
    currentPlanType === "starter" ||
    currentPlanType === "trial" ||
    currentPlanType === "free";
  const canShowPublicChat = hasAutomaticOrderNotifications(currentPlanType) && establishment.publicChatEnabled !== false;
  const showPublicReviews = establishment.reviewsEnabled !== false && !isLitePlan;
  const filteredProducts = filterProducts(products);

  // Helper: formatar mensagem WhatsApp para plano Lite
  const formatPrintableReceiptUrl = (receiptUrl?: string | null) => {
    if (!receiptUrl) return null;
    return receiptUrl.replace(/^https?:\/\//i, "");
  };

  // Gerar emojis em runtime evita qualquer dependência da codificação do ficheiro/bundle.
  const orderEmoji = String.fromCodePoint(0x1f6d2);
  const receiptEmoji = String.fromCodePoint(0x1f9fe);

  const buildWhatsAppUrl = (rawPhone: string, message: string) => {
    const phone = rawPhone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const url = new URL(`https://wa.me/${fullPhone}`);
    url.searchParams.set("text", message);
    return url.toString();
  };

  const buildWhatsAppMessage = (receiptUrl?: string | null) => {
    const lines: string[] = [];
    lines.push(`${orderEmoji} *Novo Pedido - ${establishment.name}*`);
    lines.push("");
    lines.push(`*Cliente:* ${customerInfo.name}`);
    // Tipo de entrega
    const deliveryLabel =
      deliveryType === "pickup"
        ? "Retirada no local"
        : deliveryType === "dine_in"
          ? "Consumir no local"
          : "Entrega";
    lines.push(
      `*${deliveryLabel === "Entrega" ? "Entrega" : "Tipo"}:* ${deliveryLabel}`
    );
    // Endereço se delivery
    if (deliveryType === "delivery" && deliveryAddress.street) {
      const addr = `${deliveryAddress.street}, ${deliveryAddress.number}${deliveryAddress.complement ? ` - ${deliveryAddress.complement}` : ""}, ${deliveryAddress.neighborhood}${deliveryAddress.reference ? ` (Ref: ${deliveryAddress.reference})` : ""}`;
      lines.push(`*Endere\u00e7o:* ${addr}`);
    }
    // Pagamento
    const payLabel =
      paymentMethod === "cash"
        ? "Dinheiro"
        : paymentMethod === "card"
          ? "Cartão"
          : paymentMethod === "pix"
            ? "Pix"
            : paymentMethod === "card_online"
              ? "Cartão Online"
              : paymentMethod === "pix_online"
                ? "Pix QR Code"
                : "Não informado";
    lines.push(`*Pagamento:* ${payLabel}`);
                        {paymentMethod === "card_online" && (establishment as any)?.paytimeCardFeePassthrough !== false && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            Inclui taxa de processamento de R$ 0,99
                          </p>
                        )}
    if (paymentMethod === "cash" && changeAmount) {
      lines.push(`*Troco para:* R$ ${changeAmount}`);
    }
    lines.push("");
    lines.push("*--- Itens ---*");
    lines.push("");
    // Itens do carrinho
    cart.forEach(item => {
      const itemTotal =
        (parseFloat(item.price) +
          item.complements.reduce(
            (s, c) => s + parseFloat(c.price) * (c.quantity || 1),
            0
          )) *
        item.quantity;
      lines.push(
        `${item.quantity}x ${item.name} \u2014 ${formatPrice(itemTotal)}`
      );
      // Complementos
      item.complements.forEach(c => {
        const cTotal = parseFloat(c.price) * (c.quantity || 1);
        if (cTotal > 0) {
          lines.push(
            `  ↳ ${c.quantity > 1 ? c.quantity + "x " : ""}${c.name} (${formatPrice(cTotal)})`
          );
        } else {
          lines.push(`  ↳ ${c.quantity > 1 ? c.quantity + "x " : ""}${c.name}`);
        }
      });
      // Observação do item
      if (item.observation) {
        lines.push(`  _Obs: ${item.observation}_`);
      }
      lines.push("");
    });
    // Subtotal
    const subtotal = cart.reduce((sum, item) => {
      const itemTotal = parseFloat(item.price) * item.quantity;
      const complementsTotal =
        item.complements.reduce(
          (s, c) => s + parseFloat(c.price) * (c.quantity || 1),
          0
        ) * item.quantity;
      return sum + itemTotal + complementsTotal;
    }, 0);
    lines.push(`*Subtotal:* ${formatPrice(subtotal)}`);
    // Taxa de entrega
    if (deliveryType === "delivery") {
      const fee = getDeliveryFee(subtotal);
      lines.push(
        `*Taxa de entrega:* ${fee > 0 ? formatPrice(fee) : "Gr\u00e1tis"}`
      );
    }
    // Cupom
    if (appliedCoupon) {
      lines.push(
        `*Cupom ${appliedCoupon.code}:* -${formatPrice(appliedCoupon.discount)}`
      );
    }
    // Total
    const deliveryFeeValue =
      deliveryType === "delivery" ? getDeliveryFee(subtotal) : 0;
    const discount = appliedCoupon?.discount || 0;
    const total = Math.max(0, subtotal - discount + deliveryFeeValue);
    lines.push(`*Total: ${formatPrice(total)}*`);
    // Observação geral
    if (orderObservation) {
      lines.push("");
      lines.push(`*Observa\u00e7\u00e3o:* ${orderObservation}`);
    }
    // Recibo imprimível gerado pelo backend após a criação do pedido
    const printableReceiptUrl = formatPrintableReceiptUrl(receiptUrl);
    if (printableReceiptUrl) {
      lines.push("");
      lines.push(`${receiptEmoji} ${printableReceiptUrl}`);
    }
    return lines.join("\n");
  };

  // Helper: abrir WhatsApp com mensagem formatada (plano Lite)
  const sendOrderViaWhatsApp = () => {
    const message = buildWhatsAppMessage();
    const phone = establishment.whatsapp || "";
    window.open(buildWhatsAppUrl(phone, message), "_blank");
  };

  const askWhatsAppSendConfirmation = (whatsAppUrl: string) => {
    setPendingWhatsAppOrderUrl(whatsAppUrl);
    setWhatsAppConfirmationPending(true);
    setOrderSent(false);
    setIsSendingOrder(false);
  };

  const confirmWhatsAppOrderSent = () => {
    setWhatsAppConfirmationPending(false);
    setPendingWhatsAppOrderUrl(null);
    setOrderSent(true);
    setOrderStatus("sent");
    setIsSendingOrder(false);
    setCart([]);
    if (slug) {
      clearCartFromStorage(slug);
    }
    trpcUtils.publicMenu.getBySlug.invalidate({ slug: slug || "" });
    setOrderObservation("");
    setAppliedCoupon(null);
    setChangeAmount("");
    setChangeAmountError(null);
  };

  const retryWhatsAppOrderSend = () => {
    setWhatsAppConfirmationPending(false);
    setOrderSent(false);
    setIsSendingOrder(false);
  };

  // Helper: calcular taxa de entrega base (sem considerar freeDelivery)
  const getBaseDeliveryFee = () => {
    if (deliveryType === "pickup" || deliveryType === "dine_in") return 0;
    if (establishment.deliveryFeeType === "free") return 0;
    if (establishment.deliveryFeeType === "fixed")
      return Number(establishment.deliveryFeeFixed || 0);
    if (establishment.deliveryFeeType === "byRadius") {
      if (radiusFeeCalculated) return Number(radiusFeeCalculated.fee);
      return 0;
    }
    if (selectedNeighborhood) return Number(selectedNeighborhood.fee);
    return 0;
  };

  // Helper: calcular taxa de entrega REAL para exibição nos botões de opção
  // (ignora o deliveryType selecionado, sempre calcula como se fosse delivery)
  const getRealDeliveryFee = (subtotal: number) => {
    if (establishment.deliveryFeeType === "free") return 0;
    let baseFee = 0;
    if (establishment.deliveryFeeType === "fixed")
      baseFee = Number(establishment.deliveryFeeFixed || 0);
    else if (
      establishment.deliveryFeeType === "byRadius" &&
      radiusFeeCalculated
    )
      baseFee = Number(radiusFeeCalculated.fee);
    else if (selectedNeighborhood) baseFee = Number(selectedNeighborhood.fee);
    if (baseFee === 0) return 0;
    // Verificar frete grátis acima de valor mínimo
    if (
      (establishment as any).freeDeliveryEnabled &&
      (establishment as any).freeDeliveryMinValue
    ) {
      const minValue = parseFloat(
        String((establishment as any).freeDeliveryMinValue)
      );
      if (minValue > 0 && subtotal >= minValue) return 0;
    }
    return baseFee;
  };

  // Helper: calcular taxa de entrega final (considerando freeDelivery)
  const getDeliveryFee = (subtotal: number) => {
    const baseFee = getBaseDeliveryFee();
    if (baseFee === 0) return 0;
    // Verificar frete grátis acima de valor mínimo
    if (
      (establishment as any).freeDeliveryEnabled &&
      (establishment as any).freeDeliveryMinValue
    ) {
      const minValue = parseFloat(
        String((establishment as any).freeDeliveryMinValue)
      );
      if (minValue > 0 && subtotal >= minValue) return 0;
    }
    return baseFee;
  };

  // Helper: dados para barra de progresso do frete grátis
  const getFreeDeliveryProgress = (subtotal: number) => {
    const est = establishment as any;
    if (!est.freeDeliveryEnabled || !est.freeDeliveryMinValue) return null;
    const minValue = parseFloat(String(est.freeDeliveryMinValue));
    if (minValue <= 0) return null;
    // Só mostrar barra de progresso de frete grátis quando tipo de entrega é delivery
    if (deliveryType !== "delivery") return null;
    // Não mostrar se o tipo de entrega já é grátis por padrão
    if (establishment.deliveryFeeType === "free") return null;
    let baseFee = getBaseDeliveryFee();
    // Para byNeighborhood sem bairro selecionado, usar deliveryFeeFixed como fallback
    // para que o texto "Você economizou" ainda apareça
    if (
      baseFee === 0 &&
      establishment.deliveryFeeType === "byNeighborhood" &&
      !selectedNeighborhood
    ) {
      baseFee = Number(establishment.deliveryFeeFixed || 0);
      // Se não tem deliveryFeeFixed, usar a menor taxa de bairro como estimativa
      if (
        baseFee === 0 &&
        neighborhoodFeesData &&
        neighborhoodFeesData.length > 0
      ) {
        baseFee = Math.min(
          ...neighborhoodFeesData.map((n: any) => Number(n.fee))
        );
      }
    }
    const progress = Math.min(100, (subtotal / minValue) * 100);
    const remaining = Math.max(0, minValue - subtotal);
    const achieved = subtotal >= minValue;
    return { progress, remaining, achieved, minValue, baseFee };
  };

  // (Hooks de confetti movidos para antes dos early returns - ver acima)

  const getProductsByCategory = (categoryId: number) => {
    return filteredProducts.filter(
      (p: (typeof filteredProducts)[number]) => p.categoryId === categoryId
    );
  };

  // Filtrar categorias: apenas ativas E com pelo menos 1 produto ativo
  const categories = allCategories.filter(
    (category: (typeof allCategories)[number]) => {
      // Categoria precisa estar ativa
      if (category.isActive === false) return false;

      // Categoria precisa ter pelo menos 1 produto ativo (visível no menu)
      const activeProducts = filteredProducts.filter(
        (p: (typeof filteredProducts)[number]) =>
          p.categoryId === category.id && p.status === "active"
      );
      return activeProducts.length > 0;
    }
  );

  // Usar status calculado pelo servidor (fonte de verdade)
  // Isso garante que frontend e backend usem exatamente a mesma lógica
  // evitando discrepâncias de timezone entre navegador e servidor
  const isOpen = (establishment as any).computedIsOpen ?? establishment.isOpen;
  const isForcedClosed =
    (establishment as any).computedManuallyClosed ??
    establishment.manuallyClosed ??
    false;

  // Get opening hours text - usar dados calculados pelo servidor quando disponíveis
  const computedNextOpening = (establishment as any).computedNextOpeningTime;
  const computedScheduledClosure = (establishment as any)
    .computedScheduledClosure;
  const computedScheduledClosureReason = (establishment as any)
    .computedScheduledClosureReason;

  const getOpeningText = () => {
    if (isOpen) return null;

    // Se temos nextOpeningTime calculado pelo servidor, usar como fonte de verdade
    // Isso já considera fechamentos programados corretamente
    if (computedNextOpening) {
      const dayNames = [
        "Domingo",
        "Segunda",
        "Terça",
        "Quarta",
        "Quinta",
        "Sexta",
        "Sábado",
      ];
      const next = computedNextOpening;
      let prefix = "Fechado";
      if (computedScheduledClosure && computedScheduledClosureReason) {
        prefix = `Fechado (${computedScheduledClosureReason})`;
      }
      if (next.isToday) {
        return `${prefix} – Abriremos hoje às ${next.openTime}`;
      } else if (next.isTomorrow) {
        return `${prefix} – Abriremos amanhã às ${next.openTime}`;
      } else {
        return `${prefix} – Abriremos ${dayNames[next.dayOfWeek]} às ${next.openTime}`;
      }
    }

    // Fallback: cálculo local caso o servidor não tenha retornado computedNextOpeningTime
    if (!businessHoursData || businessHoursData.length === 0) {
      return "Fechado no momento";
    }

    // Usar timezone de Brasília para cálculos
    const now = new Date();
    const brasiliaDate = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
    );
    const currentDay = brasiliaDate.getDay();
    const currentTime =
      brasiliaDate.getHours() * 60 + brasiliaDate.getMinutes();

    const todayHours = businessHoursData.find(h => h.dayOfWeek === currentDay);

    if (todayHours?.isActive && todayHours.openTime) {
      const [openHour, openMin] = todayHours.openTime.split(":").map(Number);
      const openTimeMinutes = openHour * 60 + openMin;

      if (currentTime < openTimeMinutes) {
        return `Fechado – Abriremos hoje às ${todayHours.openTime}`;
      }
    }

    for (let i = 1; i <= 7; i++) {
      const nextDay = (currentDay + i) % 7;
      const nextDayHours = businessHoursData.find(h => h.dayOfWeek === nextDay);

      if (nextDayHours?.isActive && nextDayHours.openTime) {
        if (i === 1) {
          return `Fechado hoje – Abriremos amanhã às ${nextDayHours.openTime}`;
        }
        const dayNames = [
          "Domingo",
          "Segunda",
          "Terça",
          "Quarta",
          "Quinta",
          "Sexta",
          "Sábado",
        ];
        return `Fechado – Abriremos ${dayNames[nextDay]} às ${nextDayHours.openTime}`;
      }
    }

    return "Fechado no momento";
  };

  // Get service types
  const getServiceTypes = () => {
    const hasDelivery = establishment.allowsDelivery;
    const hasPickup = establishment.allowsPickup;

    if (hasDelivery && hasPickup) {
      return "Delivery e Retirada";
    } else if (hasDelivery) {
      return "Somente Delivery";
    } else if (hasPickup) {
      return "Somente Retirada";
    }
    return "";
  };

  // Determina se deve mostrar ícone de moto ou caixa
  const isDeliveryOnly = () => establishment.allowsDelivery;
  const isPickupOnly = () =>
    !establishment.allowsDelivery && establishment.allowsPickup;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Background de ícones de comida - cor baseada em menuBackgroundHue */}
      <div
        className="fixed inset-0 opacity-[0.19] pointer-events-none z-0"
        style={{
          backgroundImage: `url('${data?.establishment?.menuBackgroundHue === 270 ? "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/static-assets/bg_purple.webp" : "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/chat-bg-option3-dXq5isMUuMCqTpaKJbbZwr.webp"}')`,
          backgroundSize: "400px auto",
          backgroundRepeat: "repeat",
        }}
      />
      {/* Story Viewer Fullscreen */}
      {showStoryViewer &&
        activeStories &&
        activeStories.length > 0 &&
        establishment && (
          <StoryViewer
            stories={activeStories.map(s => ({
              ...s,
              createdAt: String(s.createdAt),
              expiresAt: String(s.expiresAt),
              promoExpiresAt: s.promoExpiresAt
                ? String(s.promoExpiresAt)
                : null,
            }))}
            initialIndex={storyInitialIndex}
            onStoryViewed={storyId => {
              // Salvar cada story individualmente no localStorage
              if (establishment?.id) {
                markStoryAsViewed(establishment.id, storyId);
              }
            }}
            onAllViewed={() => {
              // Quando todos foram vistos, atualizar estado da borda
              setAllStoriesViewed(true);
            }}
            restaurantName={establishment.name}
            restaurantLogo={establishment.logo}
            onClose={() => setShowStoryViewer(false)}
            onProductAction={productId => {
              // Fechar o story viewer primeiro
              setShowStoryViewer(false);
              // Guardar referência do story para analytics
              const currentStoryIdx = storyInitialIndex;
              const currentStory = activeStories?.[currentStoryIdx];
              if (currentStory && establishment) {
                setStorySource({
                  storyId: currentStory.id,
                  establishmentId: establishment.id,
                });
              }
              // Aguardar o story viewer desmontar completamente antes de abrir o modal do produto
              setTimeout(() => {
                const product = products.find(
                  (p: (typeof products)[number]) => p.id === productId
                );
                if (product) {
                  setModalImageIndex(0);
                  setSelectedProduct({
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    promotionalPrice: product.promotionalPrice,
                    minComplementPrice: (product as any).minComplementPrice ?? null,
                    images: product.images,
                    hasStock: product.hasStock,
                    availableStock: (product as any).availableStock ?? null,
                    outOfStock: product.outOfStock ?? false,
                    categoryId: (product as any).categoryId ?? null,
                  });
                  setProductQuantity(1);
                  setProductObservation("");
                }
              }, 350);
            }}
          />
        )}

      {/* CSS para animação Wave Ring do story */}
      <style>{`
        @keyframes waveAnim {
          0% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -420; opacity: 0.3; }
        }
        .story-wave-ring {
          position: absolute;
          top: -6px;
          left: -6px;
          width: calc(100% + 12px);
          height: calc(100% + 12px);
          border-radius: 50%;
          pointer-events: none;
        }
        .story-wave-ring circle {
          fill: none;
          stroke-width: 3;
          stroke-linecap: round;
        }
        .story-wave-ring .wave1 {
          stroke: #f09433;
          stroke-dasharray: 40 380;
          animation: waveAnim 2.5s ease-in-out infinite;
        }
        .story-wave-ring .wave2 {
          stroke: #dc2743;
          stroke-dasharray: 40 380;
          animation: waveAnim 2.5s ease-in-out infinite 0.4s;
        }
        .story-wave-ring .wave3 {
          stroke: #bc1888;
          stroke-dasharray: 40 380;
          animation: waveAnim 2.5s ease-in-out infinite 0.8s;
        }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50" style={{ willChange: "transform", transform: "translateZ(0)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 pr-0">
          <div className="flex items-center gap-4">
            {/* Logo Mindi do menu público */}
            <a
              href="https://mindi.com.br"
              aria-label="Ir para mindi.com.br"
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: "35.5px", height: "35.5px" }}
            >
              <img
                src="/assets/mindi-menu-icon-red.png"
                alt="Mindi"
                className="block h-full w-full object-contain"
                width={36}
                height={36}
                loading="eager"
                decoding="async"
              />
            </a>

            {/* Search Bar */}
            <div className="flex-1 min-w-[180px] max-w-xl relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar no cardápio"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() =>
                    setTimeout(() => setIsSearchFocused(false), 200)
                  }
                  className="w-full pl-10 pr-8 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-colors placeholder:text-gray-400"
                  style={{ height: "37px" }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
                    aria-label="Limpar busca"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Dropdown de pré-visualização da busca */}
              {isSearchFocused &&
                searchQuery.trim() &&
                filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-[60] p-2 space-y-1">
                    {filteredProducts
                      .slice(0, 10)
                      .map((product: (typeof filteredProducts)[number]) => (
                        <button
                          key={product.id}
                          onClick={() => {
                            if ((product as any).outOfStock) return;
                            const productData = {
                              id: product.id,
                              name: product.name,
                              description: product.description,
                              price: product.price,
                              promotionalPrice: product.promotionalPrice,
                              minComplementPrice:
                                (product as any).minComplementPrice ?? null,
                              images: product.images,
                              hasStock: product.hasStock,
                              availableStock:
                                (product as any).availableStock ?? null,
                              outOfStock: (product as any).outOfStock ?? false,
                              categoryId: (product as any).categoryId ?? null,
                            };
                            // Se há múltiplas opções de entrega e ainda não escolheu, abrir modal primeiro
                            if (!deliveryTypeChosen && data?.establishment) {
                              const options = [
                                data.establishment.allowsDelivery,
                                data.establishment.allowsPickup,
                                data.establishment.allowsDineIn,
                              ].filter(Boolean).length;
                              if (options > 1) {
                                setPendingProduct(productData);
                                setShowDeliveryTypeModal(true);
                                setSearchQuery("");
                                setIsSearchFocused(false);
                                return;
                              }
                            }
                            setModalImageIndex(0);
                            setSelectedProduct(productData);
                            setSearchQuery("");
                            setIsSearchFocused(false);
                          }}
                          className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left bg-white rounded-lg border border-gray-100 border-l-[3px] border-l-red-500"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {product.name}
                            </p>
                            {product.description && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {product.description}
                              </p>
                            )}
                          </div>
                          {Number(product.price) > 0 ? (
                            <div className="flex-shrink-0 text-sm font-semibold text-red-500">
                              {formatPrice(product.price)}
                            </div>
                          ) : (() => {
                            const startingComplementPrice =
                              getStartingComplementPrice(product as any);
                            return startingComplementPrice ? (
                              <div className="flex-shrink-0 text-sm font-semibold text-red-500">
                                A partir de {formatPrice(startingComplementPrice)}
                              </div>
                            ) : null;
                          })()}
                        </button>
                      ))}
                    {filteredProducts.length > 10 && (
                      <div className="px-4 py-2 text-center text-xs text-gray-500 bg-gray-50 rounded-lg">
                        +{filteredProducts.length - 10} outros resultados
                      </div>
                    )}
                  </div>
                )}

              {/* Mensagem de nenhum resultado */}
              {isSearchFocused &&
                searchQuery.trim() &&
                filteredProducts.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-[60]">
                    <p className="text-sm text-gray-500 text-center">
                      Nenhum produto encontrado
                    </p>
                  </div>
                )}
            </div>

            {/* Spacer to push navigation to the right edge - hidden on mobile */}
            <div className="hidden md:flex flex-1" />

            {/* Navigation Menu - aligned to right edge of cover image */}
            <nav className="hidden md:flex items-center gap-6 pr-4">
              {!isLitePlan && cashbackEnabled?.enabled && (
                <button
                  className="flex items-center gap-1.5 text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors"
                  onClick={() => {
                    if (!isCashbackLoggedIn) {
                      setShowCashbackIntroSheet(true);
                      setShowCashbackModal(false);
                      setCashbackStep("login");
                    } else {
                      setShowCashbackModal(true);
                      setCashbackStep("wallet");
                      cashbackBalanceQuery.refetch();
                    }
                  }}
                >
                  <Wallet className="h-4 w-4" />
                  <span>Minha Carteira</span>
                </button>
              )}
              {!isLitePlan && (
                <button
                  ref={desktopPedidosButtonRef}
                  className="flex items-center gap-1.5 text-gray-600 font-medium text-sm hover:text-gray-900 transition-colors relative pr-3"
                  onClick={() => setShowOrdersModal(true)}
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>Pedidos</span>
                  {userOrders.filter(
                    o => o.status !== "delivered" && o.status !== "cancelled"
                  ).length > 0 && (
                    <span className="absolute -top-1.5 -right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {
                        userOrders.filter(
                          o =>
                            o.status !== "delivered" && o.status !== "cancelled"
                        ).length
                      }
                    </span>
                  )}
                </button>
              )}
              {cart.length > 0 && (
                <button
                  className="flex items-center gap-1.5 text-gray-600 font-medium text-sm hover:text-gray-900 transition-colors relative pr-3"
                  onClick={() => setShowMobileBag(true)}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Sacola</span>
                  <span className="absolute -top-1.5 -right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              ref={mobileMenuButtonRef}
              aria-label="Abrir menu"
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 mr-4 relative z-[201]"
              onClick={() => setShowMobileMenu(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="max-w-7xl mx-auto px-4 pt-4 relative z-[1]">
        <div className="relative h-36 md:h-48 lg:h-56 rounded-2xl overflow-hidden bg-gray-200">
          {establishment.coverImage ? (
            <BlurImage
              src={establishment.coverImage}
              blurDataUrl={establishment.coverBlur}
              alt={`Cardápio ${establishment.name}${establishment.city ? ` em ${establishment.city}` : ""} - Delivery e Pedidos Online`}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center">
              <UtensilsCrossed className="h-16 w-16 text-red-500/30" />
            </div>
          )}
        </div>
      </div>

      {/* Restaurant Info Block */}
      <div className="max-w-7xl mx-auto px-4 relative z-[1]">
        <div className="relative -mt-16 md:-mt-20 flex flex-col md:flex-row md:items-end gap-4 pb-4">
          {/* Badge de Entrega/Retirada - Aba de pasta atrás do card (mobile) */}
          {getServiceTypes() && (
            <div
              className="md:hidden absolute top-[116px] right-4 z-0"
              style={{
                marginTop: "-29px",
                marginRight: "-2px",
                paddingRight: "0px",
              }}
            >
              {/* Aba principal - fica atrás do card com efeito pulsante */}
              <div
                className="animate-delivery-pulse bg-red-500 text-white font-bold rounded-t-xl shadow-md flex items-center gap-1.5"
                style={{
                  fontSize: "11px",
                  paddingTop: "0px",
                  paddingRight: "14px",
                  paddingBottom: "10px",
                  paddingLeft: "10px",
                  marginTop: "21px",
                  height: "33px",
                  borderRadius: "12px",
                }}
              >
                {isPickupOnly() ? (
                  <Package className="h-3.5 w-3.5" />
                ) : (
                  <Bike className="h-3.5 w-3.5 animate-bike-ride" />
                )}
                {getServiceTypes()}
                {/* Separador e Tempo de Entrega */}
                {establishment.deliveryTimeEnabled &&
                  establishment.deliveryTimeMin &&
                  establishment.deliveryTimeMax && (
                    <>
                      <span className="mx-1 opacity-60">|</span>
                      <Clock className="h-3 w-3" />
                      <span>
                        {establishment.deliveryTimeMin}-
                        {establishment.deliveryTimeMax}min
                      </span>
                    </>
                  )}
                {/* Separador e Pedido Mínimo */}
                {establishment.minimumOrderEnabled &&
                  establishment.minimumOrderValue &&
                  Number(establishment.minimumOrderValue) > 0 && (
                    <>
                      <span className="mx-1 opacity-60">|</span>
                      <ShoppingBag className="h-3 w-3" />
                      <span>
                        R${Number(establishment.minimumOrderValue).toFixed(0)}
                      </span>
                    </>
                  )}
              </div>
            </div>
          )}
          {/* Profile Image with Note Balloon */}
          <div className="relative z-10 ml-4 md:ml-6">
            {/* Balão de Nota - exibe sempre que existir nota ativa */}
            {establishment.publicNote && (
              <div className="absolute -top-14 md:-top-16 left-0 z-20 animate-float-balloon">
                <div className="relative">
                  {/* Balão estilo bolha com estilo personalizado */}
                  <div
                    className={cn(
                      "rounded-[20px] px-3 py-1.5 max-w-[140px] md:max-w-[160px] overflow-hidden",
                      (!establishment.noteStyle ||
                        establishment.noteStyle === "default") &&
                        "bg-white border border-gray-200",
                      establishment.noteStyle === "sunset" &&
                        "bg-gradient-to-r from-orange-400 to-pink-500",
                      establishment.noteStyle === "ocean" &&
                        "bg-gradient-to-r from-cyan-400 to-blue-500",
                      establishment.noteStyle === "forest" &&
                        "bg-gradient-to-r from-green-400 to-emerald-500",
                      establishment.noteStyle === "purple" &&
                        "bg-gradient-to-r from-purple-400 to-pink-500",
                      establishment.noteStyle === "fire" &&
                        "bg-gradient-to-r from-red-500 to-orange-500",
                      establishment.noteStyle === "gold" &&
                        "bg-gradient-to-r from-yellow-400 to-amber-500",
                      establishment.noteStyle === "night" &&
                        "bg-gradient-to-r from-gray-700 to-gray-900",
                      establishment.noteStyle === "candy" &&
                        "bg-gradient-to-r from-pink-400 to-rose-400",
                      establishment.noteStyle === "mint" &&
                        "bg-gradient-to-r from-teal-400 to-cyan-400",
                      establishment.noteStyle === "peach" &&
                        "bg-gradient-to-r from-orange-300 to-rose-300",
                      establishment.noteStyle === "royal" &&
                        "bg-gradient-to-r from-indigo-500 to-purple-600",
                      establishment.noteStyle === "acai" &&
                        "bg-gradient-to-r from-purple-600 to-purple-900"
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs text-center leading-tight break-words",
                        !establishment.noteStyle ||
                          establishment.noteStyle === "default"
                          ? "text-gray-700"
                          : establishment.noteStyle === "peach"
                            ? "text-gray-800"
                            : "text-white"
                      )}
                    >
                      {establishment.publicNote}
                    </p>
                  </div>
                  {/* Bico do balão em formato de balão de pensamento - círculo maior à esquerda, menor à direita */}
                  <div
                    className={cn(
                      "absolute -bottom-2.5 left-4 w-3.5 h-3.5 rounded-full",
                      (!establishment.noteStyle ||
                        establishment.noteStyle === "default") &&
                        "bg-white border border-gray-200",
                      establishment.noteStyle === "sunset" && "bg-pink-500",
                      establishment.noteStyle === "ocean" && "bg-blue-500",
                      establishment.noteStyle === "forest" && "bg-emerald-500",
                      establishment.noteStyle === "purple" && "bg-pink-500",
                      establishment.noteStyle === "fire" && "bg-orange-500",
                      establishment.noteStyle === "gold" && "bg-amber-500",
                      establishment.noteStyle === "night" && "bg-gray-900",
                      establishment.noteStyle === "candy" && "bg-rose-400",
                      establishment.noteStyle === "mint" && "bg-cyan-400",
                      establishment.noteStyle === "peach" && "bg-rose-300",
                      establishment.noteStyle === "royal" && "bg-purple-600",
                      establishment.noteStyle === "acai" && "bg-purple-900"
                    )}
                  ></div>
                  <div
                    className={cn(
                      "absolute -bottom-5 left-7 w-2 h-2 rounded-full",
                      (!establishment.noteStyle ||
                        establishment.noteStyle === "default") &&
                        "bg-white border border-gray-200",
                      establishment.noteStyle === "sunset" && "bg-pink-500",
                      establishment.noteStyle === "ocean" && "bg-blue-500",
                      establishment.noteStyle === "forest" && "bg-emerald-500",
                      establishment.noteStyle === "purple" && "bg-pink-500",
                      establishment.noteStyle === "fire" && "bg-orange-500",
                      establishment.noteStyle === "gold" && "bg-amber-500",
                      establishment.noteStyle === "night" && "bg-gray-900",
                      establishment.noteStyle === "candy" && "bg-rose-400",
                      establishment.noteStyle === "mint" && "bg-cyan-400",
                      establishment.noteStyle === "peach" && "bg-rose-300",
                      establishment.noteStyle === "royal" && "bg-purple-600",
                      establishment.noteStyle === "acai" && "bg-purple-900"
                    )}
                  ></div>
                </div>
              </div>
            )}

            {/* Logo com borda degradê Instagram quando há stories */}
            {storiesStatus?.hasStories ? (
              <button
                onClick={async () => {
                  const result = await refetchStories();
                  // Calcular o primeiro story não visto
                  let startIndex = 0;
                  if (result.data && data?.establishment?.id) {
                    try {
                      const viewedIds = getViewedStoryIds(
                        data.establishment.id
                      );
                      if (viewedIds.length > 0) {
                        const firstUnviewedIdx = result.data.findIndex(
                          s => !viewedIds.includes(s.id)
                        );
                        if (firstUnviewedIdx >= 0) {
                          startIndex = firstUnviewedIdx;
                        }
                      }
                    } catch {}
                  }
                  setStoryInitialIndex(startIndex);
                  setShowStoryViewer(true);
                }}
                className="relative cursor-pointer group"
              >
                {!allStoriesViewed && (
                  <svg className="story-wave-ring" viewBox="0 0 144 144">
                    <circle className="wave1" cx="72" cy="72" r="69" />
                    <circle className="wave2" cx="72" cy="72" r="69" />
                    <circle className="wave3" cx="72" cy="72" r="69" />
                  </svg>
                )}
                <div
                  className="h-28 w-28 md:h-36 md:w-36 rounded-full p-[3.5px]"
                  style={{
                    background: allStoriesViewed
                      ? "linear-gradient(45deg, #d1d5db, #9ca3af, #d1d5db)"
                      : "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white bg-white">
                    {establishment.logo ? (
                      <BlurImage
                        src={establishment.logo}
                        blurDataUrl={establishment.logoBlur}
                        alt={establishment.name}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover"
                        responsive
                        sizes="(max-width: 768px) 112px, 144px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center">
                        <UtensilsCrossed className="h-12 w-12 md:h-16 md:w-16 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ) : establishment.logo ? (
              <BlurImage
                src={establishment.logo}
                blurDataUrl={establishment.logoBlur}
                alt={establishment.name}
                containerClassName="h-28 w-28 md:h-36 md:w-36 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden"
                className="w-full h-full object-cover"
                responsive
                sizes="(max-width: 768px) 112px, 144px"
              />
            ) : (
              <div className="h-28 w-28 md:h-36 md:w-36 rounded-full bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center border-4 border-white shadow-lg">
                <UtensilsCrossed className="h-12 w-12 md:h-16 md:w-16 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div
            className="flex-1 bg-white rounded-xl p-4 md:p-5 shadow-sm md:ml-4 relative z-[45]"
            style={{ paddingBottom: "4px" }}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="flex-1">
                {/* Restaurant Name, Rating and Share */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1 min-w-0">
                    <div className="overflow-hidden max-w-[180px] md:max-w-none">
                      <h1
                        className={`text-xl md:text-2xl font-bold text-gray-900 whitespace-nowrap ${
                          (establishment.name?.length || 0) > 20
                            ? "animate-marquee-name"
                            : ""
                        }`}
                      >
                        {establishment.name}
                      </h1>
                    </div>
                    {showPublicReviews ? (
                      <div
                        className="relative flex-shrink-0"
                        ref={ratingTooltipRef}
                      >
                        <button
                          onClick={() => setShowReviewsModal(true)}
                          className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 transition-colors hover:bg-gray-100 cursor-pointer"
                        >
                          {/* Ícone de estrela */}
                          <Star className="h-4 w-4 md:h-4.5 md:w-4.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-[13px] md:text-sm font-semibold text-gray-800">
                            {establishment.rating
                              ? Number(establishment.rating).toFixed(1)
                              : "0.0"}
                          </span>
                          {/* Quantidade de avaliações - abreviado no mobile quando nome é longo */}
                          {(establishment.name?.length || 0) > 20 ? (
                            <>
                              <span className="text-[13px] md:text-sm text-gray-500 md:hidden">
                                ({establishment.reviewCount || 0})
                              </span>
                              <span className="text-[13px] md:text-sm text-gray-500 hidden md:inline">
                                ({`${establishment.reviewCount || 0} ${(establishment.reviewCount || 0) === 1 ? "avaliação" : "avaliações"}`})
                              </span>
                            </>
                          ) : (
                            <span className="text-[13px] md:text-sm text-gray-500">
                              ({`${establishment.reviewCount || 0} ${(establishment.reviewCount || 0) === 1 ? "avaliação" : "avaliações"}`})
                            </span>
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowInfoModal(true)}
                        className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-gray-600 hover:text-red-500 font-medium transition-colors flex-shrink-0"
                      >
                        <Info
                          className="h-4 w-4"
                          style={{ width: "14px", height: "14px" }}
                        />
                        Informações
                      </button>
                    )}
                  </div>
                  {/* Botão Compartilhar - sempre na mesma linha */}
                  <button
                    onClick={() => {
                      // Use public V3 menu route for sharing so copied links open the customer menu directly.
                      // This keeps WhatsApp/Facebook previews on the canonical public URL.
                      const shareUrl = `${window.location.origin}/menu/${slug}`;
                      if (navigator.share) {
                        navigator.share({
                          title: establishment.name,
                          text: `Confira o cardápio de ${establishment.name}`,
                          url: shareUrl,
                        });
                      } else {
                        navigator.clipboard.writeText(shareUrl);
                        alert("Link copiado!");
                      }
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                    title="Compartilhar"
                    aria-label="Compartilhar cardápio"
                  >
                    <Share2 className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Address and More Info */}
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  {establishment.street && (
                    <>
                      <button
                        onClick={() => setShowNavigationModal(true)}
                        className="flex items-center gap-1 min-w-0 flex-shrink hover:text-red-500 transition-colors cursor-pointer group"
                        title="Ver opções de navegação"
                      >
                        <MapPin className="h-3.5 w-3.5 text-gray-500 flex-shrink-0 group-hover:text-red-500" />
                        <span
                          className={cn(
                            "truncate underline-offset-2 group-hover:underline",
                            isLitePlan
                              ? "max-w-[260px] sm:max-w-[520px] md:max-w-[620px] lg:max-w-none"
                              : "max-w-[180px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-none"
                          )}
                        >
                          {establishment.street}
                          {establishment.number && `, ${establishment.number}`}
                          {establishment.neighborhood &&
                            ` - ${establishment.neighborhood}`}
                          {establishment.city && ` - ${establishment.city}`}
                        </span>
                      </button>
                      {!isLitePlan && (
                        <span className="text-gray-400 flex-shrink-0">•</span>
                      )}
                    </>
                  )}
                  {!isLitePlan && (
                    <button
                      onClick={() => setShowInfoModal(true)}
                      className="flex items-center gap-1 text-gray-600 hover:text-red-500 font-medium transition-colors flex-shrink-0"
                    >
                      <Info
                        className="h-4 w-4"
                        style={{ width: "14px", height: "14px" }}
                      />
                      Informações
                    </button>
                  )}
                </div>

                {/* Status and Service Types */}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {/* Open/Closed Status */}
                  {isOpen ? (
                    <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                      </span>
                      Aberto agora
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-red-500 font-medium text-sm">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                      {getOpeningText()}
                    </span>
                  )}

                  {/* Tempo de Entrega - apenas desktop */}
                  {establishment.deliveryTimeEnabled &&
                    establishment.deliveryTimeMin &&
                    establishment.deliveryTimeMax && (
                      <span
                        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200"
                        style={{
                          paddingRight: "9px",
                          paddingLeft: "8px",
                          paddingTop: "3px",
                          paddingBottom: "3px",
                          height: "21px",
                          borderRadius: "8px",
                        }}
                      >
                        <Clock className="h-3 w-3" />
                        {establishment.deliveryTimeMin} -{" "}
                        {establishment.deliveryTimeMax} min
                      </span>
                    )}

                  {/* Pedido Mínimo - apenas desktop */}
                  {establishment.minimumOrderEnabled &&
                    establishment.minimumOrderValue &&
                    Number(establishment.minimumOrderValue) > 0 && (
                      <span
                        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg border border-amber-200"
                        style={{
                          paddingRight: "9px",
                          paddingLeft: "8px",
                          paddingTop: "3px",
                          paddingBottom: "3px",
                          height: "21px",
                          borderRadius: "8px",
                        }}
                      >
                        <ShoppingBag className="h-3 w-3" />
                        R${" "}
                        {Number(establishment.minimumOrderValue)
                          .toFixed(2)
                          .replace(".", ",")}
                      </span>
                    )}

                  {/* Service Types Badge - apenas desktop (mobile usa badge flutuante) */}
                  {getServiceTypes() && (
                    <span
                      className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg border border-gray-200"
                      style={{
                        paddingRight: "9px",
                        paddingLeft: "8px",
                        paddingTop: "3px",
                        paddingBottom: "3px",
                        height: "21px",
                        borderRadius: "8px",
                      }}
                    >
                      {isPickupOnly() ? (
                        <Package className="h-3 w-3" />
                      ) : (
                        <Bike className="h-3 w-3 animate-bike-ride" />
                      )}
                      {getServiceTypes()}
                    </span>
                  )}
                </div>

                {/* Ícones de Redes Sociais */}
                {(establishment.whatsapp ||
                  establishment.instagram ||
                  (!isLitePlan &&
                    loyaltyEnabled?.enabled &&
                    !cashbackEnabled?.enabled) ||
                  (!isLitePlan && cashbackEnabled?.enabled)) && (
                  <div className="flex items-center gap-2 mt-1 pt-1.5 pb-1 border-t border-gray-100">
                    {establishment.instagram && (
                      <a
                        href={`https://instagram.com/${establishment.instagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-[35px] h-[35px] rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors"
                        title="Instagram"
                      >
                        <svg
                          className="h-4 w-4 text-pink-500"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                    )}
                    {establishment.whatsapp && (
                      <a
                        href={`https://wa.me/55${establishment.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-[35px] h-[35px] rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                        title="WhatsApp"
                      >
                        <svg
                          className="h-4 w-4 text-green-500"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </a>
                    )}
                    {!isLitePlan &&
                      loyaltyEnabled?.enabled &&
                      !cashbackEnabled?.enabled &&
                      (establishment.whatsapp || establishment.instagram) && (
                        <div className="w-px h-5 bg-gray-200 mx-0.5 md:hidden" />
                      )}
                    {!isLitePlan &&
                      loyaltyEnabled?.enabled &&
                      !cashbackEnabled?.enabled && (
                        <button
                          onClick={openLoyaltyFlow}
                          className="relative flex items-center justify-center w-[35px] h-[35px] rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                          title="Programa de Fidelidade"
                        >
                          <span className="absolute inset-0 animate-ping rounded-lg bg-red-400/20" />
                          <Heart className="h-4 w-4 text-red-500 relative z-10" />
                        </button>
                      )}
                    {!isLitePlan &&
                      cashbackEnabled?.enabled &&
                      (establishment.whatsapp || establishment.instagram) && (
                        <div className="w-px h-5 bg-gray-200 mx-0.5 md:hidden" />
                      )}
                    {!isLitePlan && cashbackEnabled?.enabled && (
                      <button
                        onClick={() => {
                          if (!isCashbackLoggedIn) {
                            setShowCashbackIntroSheet(true);
                            setShowCashbackModal(false);
                            setCashbackStep("login");
                          } else {
                            setShowCashbackModal(true);
                            setCashbackStep("wallet");
                            cashbackBalanceQuery.refetch();
                          }
                        }}
                        className="flex md:hidden items-center justify-center w-[35px] h-[35px] rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                        title="Minha Carteira"
                      >
                        <Wallet className="h-4 w-4 text-blue-500 animate-coin-drop" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Navigation */}
      {categories.length > 0 && (
        <div className="bg-white border-y sticky top-[60px] z-40">
          <div className="max-w-7xl mx-auto px-3 relative">
            {/* Left Arrow - Desktop only - positioned just outside the categories area */}
            <button
              className="hidden md:flex absolute -left-8 top-1/2 -translate-y-1/2 z-10 w-[29px] h-[29px] rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-400 hover:text-gray-600 hover:shadow-lg transition-[colors,box-shadow] cursor-pointer"
              onClick={() => {
                if (categoriesNavRef.current) {
                  categoriesNavRef.current.scrollBy({
                    left: -200,
                    behavior: "smooth",
                  });
                }
              }}
              title="Categorias anteriores"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Menu Icon */}
              <button
                className="p-1.5 text-gray-500 hover:text-gray-700 flex-shrink-0"
                onClick={() => setShowCategoriesModal(true)}
              >
                <Menu className="h-[18px] w-[18px]" />
              </button>

              {/* Categories */}
              <div
                ref={categoriesNavRef}
                className="flex gap-0.5 overflow-x-auto scrollbar-hide py-2.5"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {categories.map((category: (typeof categories)[number]) => (
                  <button
                    key={category.id}
                    ref={el => {
                      categoryButtonRefs.current[category.id] = el;
                    }}
                    onClick={() => scrollToCategory(category.id)}
                    className={`px-3.5 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors duration-200 rounded-lg ${
                      activeCategory === category.id
                        ? "text-red-500 bg-red-50 border-b-2 border-red-500"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {category.name.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Arrow - Desktop only - positioned just outside the categories area */}
            <button
              className="hidden md:flex absolute -right-8 top-1/2 -translate-y-1/2 z-10 w-[29px] h-[29px] rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-400 hover:text-gray-600 hover:shadow-lg transition-[colors,box-shadow] cursor-pointer"
              onClick={() => {
                if (categoriesNavRef.current) {
                  categoriesNavRef.current.scrollBy({
                    left: 200,
                    behavior: "smooth",
                  });
                }
              }}
              title="Mais categorias"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Products */}
      <main className="max-w-7xl mx-auto px-4 py-4 relative z-[1]">
        <div className="flex gap-6">
          {/* Products List */}
          <div className="flex-1">
            {searchQuery && filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  Nenhum produto encontrado para "{searchQuery}"
                </p>
              </div>
            ) : (
              categories.map((category: (typeof categories)[number]) => {
                const categoryProducts = getProductsByCategory(category.id);
                if (categoryProducts.length === 0) return null;

                return (
                  <div
                    key={category.id}
                    ref={el => {
                      categoryRefs.current[category.id] = el;
                    }}
                    className="mb-5 scroll-mt-32"
                  >
                    <h2 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide flex items-center gap-2.5 pb-2 border-b-2 border-red-100">
                      <span className="w-1 h-6 rounded-sm" style={{background: 'linear-gradient(180deg, #e53935, #ff8a80)'}}></span>
                      {category.name}
                    </h2>

                    <div className="grid gap-2">
                      {categoryProducts.map(
                        (product: (typeof categoryProducts)[number]) => (
                          <div
                            key={product.id}
                            onClick={() => {
                              if (product.outOfStock) {
                                return; // Produto sem estoque - bloqueado
                              }
                              // Se há múltiplas opções de entrega e ainda não escolheu, abrir modal primeiro
                              if (!deliveryTypeChosen && data?.establishment) {
                                const options = [
                                  data.establishment.allowsDelivery,
                                  data.establishment.allowsPickup,
                                  data.establishment.allowsDineIn,
                                ].filter(Boolean).length;
                                if (options > 1) {
                                  setPendingProduct({
                                    id: product.id,
                                    name: product.name,
                                    description: product.description,
                                    price: product.price,
                                    promotionalPrice: product.promotionalPrice,
                                    minComplementPrice:
                                      (product as any).minComplementPrice ?? null,
                                    images: product.images,
                                    hasStock: product.hasStock,
                                    availableStock:
                                      (product as any).availableStock ?? null,
                                    outOfStock: product.outOfStock ?? false,
                                    categoryId: (product as any).categoryId ?? null,
                                  });
                                  setShowDeliveryTypeModal(true);
                                  return;
                                }
                              }
                              setModalImageIndex(0);
                              setSelectedProduct(product);
                              setProductQuantity(1);
                              setProductObservation("");
                            }}
                          >
                            <ProductCard
                              product={product}
                              formatPrice={formatPrice}
                              cashbackPercent={
                                cashbackEnabled?.enabled &&
                                Number(cashbackEnabled?.percent) > 0
                                  ? cashbackEnabled?.applyMode === "all" ||
                                    (cashbackEnabled?.applyMode ===
                                      "categories" &&
                                      cashbackEnabled?.categoryIds?.includes(
                                        product.categoryId as number
                                      ))
                                    ? Number(cashbackEnabled.percent)
                                    : undefined
                                  : undefined
                              }
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {filteredProducts.length === 0 && !searchQuery && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  Nenhum produto disponível no momento.
                </p>
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-[140px]">
              {/* Taxa de entrega - reflete configuração do restaurante e tipo de entrega selecionado */}
              <div
                className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 border-l-[3px] border-l-red-400"
                style={{ minHeight: "78px", borderRadius: "12px" }}
              >
                <div className="flex min-h-full">
                  {/* Conteúdo */}
                  <div className="flex-1 px-4 py-3 flex items-center justify-between gap-2">
                    {/* Ícone e texto */}
                    <div className="flex items-center gap-3">
                      {/* Ícone com badge */}
                      <div className="relative">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center bg-red-100">
                          {deliveryType === "pickup" ? (
                            <Store className="h-5 w-5 text-red-500" />
                          ) : deliveryType === "dine_in" ? (
                            <UtensilsCrossed className="h-5 w-5 text-red-500" />
                          ) : (
                            <Bike className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        {establishment.deliveryFeeType === "free" &&
                          deliveryType === "delivery" && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-red-500">
                              <span className="text-white text-xs font-bold">
                                0
                              </span>
                            </div>
                          )}
                      </div>
                      {/* Texto */}
                      <div>
                        <span className="text-sm text-gray-500 block">
                          {deliveryType === "pickup"
                            ? "Retirar no local"
                            : deliveryType === "dine_in"
                              ? "Consumir no local"
                              : establishment.deliveryFeeType === "free"
                                ? "Taxa de entrega"
                                : establishment.deliveryFeeType === "fixed"
                                  ? "Taxa de entrega"
                                  : "Taxa por bairro"}
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {(() => {
                            // Para retirada ou consumo no local, sempre Grátis
                            if (
                              deliveryType === "pickup" ||
                              deliveryType === "dine_in"
                            )
                              return "Grátis";
                            const infoSubtotal = cart.reduce((sum, item) => {
                              const ct = item.complements.reduce(
                                (s, c) =>
                                  s + parseFloat(c.price) * (c.quantity || 1),
                                0
                              );
                              return (
                                sum +
                                (parseFloat(item.price) + ct) * item.quantity
                              );
                            }, 0);
                            // Para byNeighborhood sem bairro: mostrar "A calcular" (getDeliveryFee retorna 0 mas NÃO é grátis)
                            if (
                              establishment.deliveryFeeType ===
                                "byNeighborhood" &&
                              !selectedNeighborhood
                            )
                              return "A calcular";
                            // Para byRadius sem endereço com lat/lng: mostrar "A calcular"
                            if (
                              establishment.deliveryFeeType === "byRadius" &&
                              !radiusFeeCalculated
                            ) {
                              if (radiusFeeOutOfRange) return "Fora da área";
                              if (radiusFeeLoading) return "Calculando...";
                              return "A calcular";
                            }
                            // Usar getRealDeliveryFee para sempre mostrar a taxa real de delivery
                            const infoFee = getRealDeliveryFee(infoSubtotal);
                            if (establishment.deliveryFeeType === "free")
                              return "Grátis";
                            // Para byNeighborhood: só mostrar Grátis se freeDeliveryEnabled e threshold atingido
                            if (
                              establishment.deliveryFeeType === "byNeighborhood"
                            ) {
                              const est = establishment as any;
                              if (
                                est.freeDeliveryEnabled &&
                                est.freeDeliveryMinValue
                              ) {
                                const minVal = parseFloat(
                                  String(est.freeDeliveryMinValue)
                                );
                                if (minVal > 0 && infoSubtotal >= minVal)
                                  return "Grátis";
                              }
                              // Se tem bairro selecionado e taxa é 0 (bairro com taxa grátis), mostrar Grátis
                              if (selectedNeighborhood && infoFee === 0)
                                return "Grátis";
                              return formatPrice(infoFee);
                            }
                            if (infoFee === 0) return "Grátis";
                            return formatPrice(infoFee);
                          })()}
                        </span>
                      </div>
                    </div>
                    {/* Badge/Botão de ação — lógica unificada para evitar duplicação */}
                    {(() => {
                      // Para retirada ou consumo no local, sempre mostrar badge Grátis
                      if (
                        deliveryType === "pickup" ||
                        deliveryType === "dine_in"
                      ) {
                        return (
                          <button className="px-5 py-2 bg-red-500 hover:bg-red-500 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-[colors,box-shadow] flex items-center gap-1.5 flex-shrink-0">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Grátis
                          </button>
                        );
                      }
                      const badgeSubtotal = cart.reduce((sum, item) => {
                        const ct = item.complements.reduce(
                          (s, c) => s + parseFloat(c.price) * (c.quantity || 1),
                          0
                        );
                        return (
                          sum + (parseFloat(item.price) + ct) * item.quantity
                        );
                      }, 0);
                      // Verificar se é grátis por threshold (só quando deliveryType é delivery)
                      let isFreeByThreshold = false;
                      if (
                        establishment.deliveryFeeType !== "free" &&
                        deliveryType === "delivery"
                      ) {
                        if (
                          establishment.deliveryFeeType === "byNeighborhood"
                        ) {
                          const est = establishment as any;
                          if (
                            est.freeDeliveryEnabled &&
                            est.freeDeliveryMinValue
                          ) {
                            const minVal = parseFloat(
                              String(est.freeDeliveryMinValue)
                            );
                            isFreeByThreshold =
                              minVal > 0 && badgeSubtotal >= minVal;
                          }
                        } else {
                          const badgeFee = getRealDeliveryFee(badgeSubtotal);
                          isFreeByThreshold = badgeFee === 0;
                        }
                      }
                      // 1) Se é grátis (tipo free ou threshold atingido) → badge Grátis
                      if (
                        establishment.deliveryFeeType === "free" ||
                        isFreeByThreshold
                      ) {
                        return (
                          <button className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-colors flex items-center gap-1.5 flex-shrink-0">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Grátis
                          </button>
                        );
                      }
                      // 2) Se é fixed com valor → badge Fixo
                      if (
                        establishment.deliveryFeeType === "fixed" &&
                        establishment.deliveryFeeFixed
                      ) {
                        return (
                          <span
                            className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-xl flex-shrink-0"
                            style={{
                              paddingTop: "6px",
                              paddingBottom: "0px",
                              height: "36px",
                            }}
                          >
                            Fixo
                          </span>
                        );
                      }
                      // 3) Se é byNeighborhood e NÃO grátis → botão Selecionar/Alterar
                      if (establishment.deliveryFeeType === "byNeighborhood") {
                        const hasNeighborhoods =
                          neighborhoodFeesData &&
                          neighborhoodFeesData.length > 0;
                        return (
                          <div
                            ref={neighborhoodDropdownRef}
                            className="relative flex-shrink-0"
                          >
                            <button
                              onClick={() => {
                                if (!hasNeighborhoods) {
                                  setShowNoNeighborhoodTooltipSelect(true);
                                  setTimeout(
                                    () =>
                                      setShowNoNeighborhoodTooltipSelect(false),
                                    4000
                                  );
                                  return;
                                }
                                setShowNeighborhoodModal(
                                  !showNeighborhoodModal
                                );
                              }}
                              className="px-3 py-1.5 bg-red-500 hover:bg-red-500 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-[colors,box-shadow] flex items-center gap-1.5"
                            >
                              {selectedNeighborhood ? (
                                <>
                                  Alterar{" "}
                                  <ChevronDown
                                    className={`h-3.5 w-3.5 transition-transform ${showNeighborhoodModal ? "rotate-180" : ""}`}
                                  />
                                </>
                              ) : (
                                <>
                                  Selecionar{" "}
                                  <ChevronDown
                                    className={`h-3.5 w-3.5 transition-transform ${showNeighborhoodModal ? "rotate-180" : ""}`}
                                  />
                                </>
                              )}
                            </button>
                            {showNoNeighborhoodTooltipSelect && (
                              <div className="absolute top-full mt-2 right-0 z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                                <span>
                                  Nenhum bairro configurado pelo estabelecimento
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      // 4) Se é byRadius → mostrar distância calculada ou "A calcular"
                      if (establishment.deliveryFeeType === "byRadius") {
                        if (radiusFeeLoading) {
                          return (
                            <span className="px-3 py-1.5 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg flex-shrink-0">
                              Calculando...
                            </span>
                          );
                        }
                        if (radiusFeeOutOfRange) {
                          return (
                            <span className="px-3 py-1.5 bg-red-100 text-red-500 text-sm font-semibold rounded-lg flex-shrink-0">
                              Fora da área
                            </span>
                          );
                        }
                        if (radiusFeeCalculated) {
                          return (
                            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg flex-shrink-0">
                              {radiusFeeCalculated.distanceKm} km
                            </span>
                          );
                        }
                        return (
                          <span className="px-3 py-1.5 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg flex-shrink-0">
                            A calcular
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>

              {/* Sua sacola */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-bold text-gray-900 mb-4">Sua sacola</h3>

                {/* Empty cart state */}
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-400 font-medium">Sacola vazia</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cart.map((item, index) => {
                      const complementsTotal = item.complements.reduce(
                        (sum, c) => sum + Number(c.price),
                        0
                      );
                      const itemTotal =
                        (Number(item.price) + complementsTotal) * item.quantity;
                      // Buscar estoque disponível do produto
                      const productData = products.find(
                        (p: (typeof products)[number]) =>
                          p.id === item.productId
                      );
                      const availableStock = productData?.hasStock
                        ? (productData as any).availableStock
                        : null;
                      const totalOfProductInCart = cart
                        .filter(ci => ci.productId === item.productId)
                        .reduce((sum, ci) => sum + ci.quantity, 0);
                      const canIncrement =
                        availableStock == null ||
                        totalOfProductInCart < availableStock;
                      return (
                        <div
                          key={index}
                          className="pb-3 border-b border-gray-100 last:border-0 group cursor-pointer"
                          onClick={() =>
                            setExpandedCartItem(
                              expandedCartItem === index ? null : index
                            )
                          }
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <p className="font-medium text-gray-900 text-sm truncate flex-1">
                                {item.quantity}x {item.name}
                              </p>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {itemTotal > 0 && (
                                  <span className="text-sm font-semibold text-red-500">
                                    {formatPrice(itemTotal)}
                                  </span>
                                )}
                                <ChevronDown
                                  className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${expandedCartItem === index ? "rotate-180" : ""}`}
                                />
                              </div>
                            </div>
                            {item.complements.length > 0 && (
                              <div className="mt-0.5">
                                {item.complements.map(c => (
                                  <div
                                    key={c.id}
                                    className="flex justify-between items-center text-[11px]"
                                  >
                                    <span className="text-gray-500">
                                      + {c.name}
                                    </span>
                                    <span className="text-red-500 font-medium">
                                      {formatPrice(c.price)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {item.observation && (
                              <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                                Obs: {item.observation}
                              </p>
                            )}
                            {/* Controles de quantidade - visível apenas quando expandido */}
                            {expandedCartItem === index && (
                              <div
                                className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-gray-200"
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    if (item.quantity <= 1) {
                                      setCart(prev =>
                                        prev.filter((_, i) => i !== index)
                                      );
                                      setExpandedCartItem(null);
                                    } else {
                                      setCart(prev =>
                                        prev.map((ci, i) =>
                                          i === index
                                            ? {
                                                ...ci,
                                                quantity: ci.quantity - 1,
                                              }
                                            : ci
                                        )
                                      );
                                    }
                                  }}
                                  className="w-[1.92rem] h-[1.92rem] flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                  aria-label={
                                    item.quantity <= 1
                                      ? "Remover item"
                                      : "Diminuir quantidade"
                                  }
                                >
                                  {item.quantity <= 1 ? (
                                    <Trash2 className="h-[0.84rem] w-[0.84rem] text-red-500" />
                                  ) : (
                                    <Minus className="h-[0.84rem] w-[0.84rem]" />
                                  )}
                                </button>
                                <span className="text-sm font-semibold text-gray-900 min-w-[20px] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    if (!canIncrement) return;
                                    setCart(prev =>
                                      prev.map((ci, i) =>
                                        i === index
                                          ? { ...ci, quantity: ci.quantity + 1 }
                                          : ci
                                      )
                                    );
                                  }}
                                  disabled={!canIncrement}
                                  className={`w-[1.68rem] h-[1.68rem] flex items-center justify-center rounded-full border transition-colors ${
                                    canIncrement
                                      ? "border-red-500 text-red-500 hover:bg-red-50 active:bg-red-100"
                                      : "border-gray-200 text-gray-300 cursor-not-allowed"
                                  }`}
                                  aria-label="Aumentar quantidade"
                                >
                                  <Plus className="h-[0.84rem] w-[0.84rem]" />
                                </button>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setCart(prev =>
                                      prev.filter((_, i) => i !== index)
                                    );
                                    setExpandedCartItem(null);
                                  }}
                                  className="ml-auto p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                  title="Remover item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                {availableStock != null && !canIncrement && (
                                  <span className="text-[10px] text-orange-500">
                                    Máx. atingido
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-dashed border-gray-200 my-4" />

                {/* Totals */}
                {(() => {
                  const subtotal = cart.reduce((sum, item) => {
                    const complementsTotal = item.complements.reduce(
                      (cSum, c) => cSum + Number(c.price) * (c.quantity || 1),
                      0
                    );
                    return (
                      sum +
                      (Number(item.price) + complementsTotal) * item.quantity
                    );
                  }, 0);
                  const discount = appliedCoupon?.discount || 0;
                  const deliveryFeeValue = getDeliveryFee(subtotal);
                  const freeDeliveryInfo = getFreeDeliveryProgress(subtotal);
                  const cardOnlineFee = (paymentMethod === "card_online" && (establishment as any)?.paytimeCardFeePassthrough !== false) ? 0.99 : 0;
                  const total = Math.max(
                    0,
                    subtotal - discount + deliveryFeeValue + cardOnlineFee
                  );
                  return (
                    <div className="space-y-2">
                      {/* Barra de progresso frete grátis - Desktop */}
                      {freeDeliveryInfo && cart.length > 0 && (
                        <div
                          data-delivery-card
                          className={`p-2 rounded-xl border text-[0.90em] ${freeDeliveryInfo.achieved ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}
                        >
                          <FreeDeliveryCelebration
                            active={showFreeDeliveryConfetti}
                            onComplete={() =>
                              setShowFreeDeliveryConfetti(false)
                            }
                          />
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`text-xs font-semibold ${freeDeliveryInfo.achieved ? "text-green-700" : "text-amber-700"}`}
                            >
                              {freeDeliveryInfo.achieved ? (
                                <span className="flex items-center gap-1 shimmer-text-green">
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Entrega grátis desbloqueada!
                                </span>
                              ) : (
                                <span className="shimmer-text">{`Falta ${formatPrice(freeDeliveryInfo.remaining)} para entrega grátis`}</span>
                              )}
                            </span>
                            {!freeDeliveryInfo.achieved && (
                              <span className="text-xs text-amber-500">
                                {Math.round(freeDeliveryInfo.progress)}%
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-colors duration-500 ${freeDeliveryInfo.achieved ? "bg-green-500" : "bg-amber-500"}`}
                              style={{ width: `${freeDeliveryInfo.progress}%` }}
                            />
                          </div>
                          {freeDeliveryInfo.achieved &&
                            freeDeliveryInfo.baseFee > 0 && (
                              <p className="text-xs text-green-600 mt-1">
                                Você economizou{" "}
                                {formatPrice(freeDeliveryInfo.baseFee)} na
                                entrega!
                              </p>
                            )}
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-600">
                          {formatPrice(subtotal)}
                        </span>
                      </div>
                      {deliveryType === "delivery" && (
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-gray-600">Taxa de entrega</span>
                          {(establishment.deliveryFeeType ===
                            "byNeighborhood" &&
                            !selectedNeighborhood) ||
                          (establishment.deliveryFeeType === "byRadius" &&
                            !radiusFeeCalculated) ? (
                            <span className="text-gray-400 text-xs italic">
                              {radiusFeeOutOfRange
                                ? "Fora da área"
                                : radiusFeeLoading
                                  ? "Calculando..."
                                  : "A calcular"}
                            </span>
                          ) : deliveryFeeValue === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 font-bold rounded-lg text-xs">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Grátis!
                            </span>
                          ) : (
                            <span className="text-gray-600">
                              {formatPrice(deliveryFeeValue)}
                            </span>
                          )}
                        </div>
                      )}
                      {deliveryType === "pickup" && (
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-gray-600">
                            Retirar no local
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 font-bold rounded-lg text-xs">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Grátis!
                          </span>
                        </div>
                      )}
                      {deliveryType === "dine_in" && (
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-gray-600">
                            Consumir no local
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 font-bold rounded-lg text-xs">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Grátis!
                          </span>
                        </div>
                      )}
                      {appliedCoupon && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600 flex items-center gap-1">
                            <Ticket className="h-3.5 w-3.5" />
                            Cupom {appliedCoupon.code}
                          </span>
                          <span className="text-green-600">
                            -{formatPrice(discount)}
                          </span>
                        </div>
                      )}
                      {cardOnlineFee > 0 && (
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-amber-600 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                            Taxa cartão online
                          </span>
                          <span className="text-amber-600">{formatPrice(cardOnlineFee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-base pt-2">
                        <span className="text-gray-900">Total</span>
                        <span className="text-gray-900">
                          {formatPrice(total)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Alerta de Pedido Mínimo - Desktop */}
                {(() => {
                  const subtotalDesktop = cart.reduce((sum, item) => {
                    const complementsTotal = item.complements.reduce(
                      (cSum, c) => cSum + Number(c.price) * (c.quantity || 1),
                      0
                    );
                    return (
                      sum +
                      (Number(item.price) + complementsTotal) * item.quantity
                    );
                  }, 0);
                  const minOrderValue = Number(
                    establishment?.minimumOrderValue || 0
                  );
                  const minOrderEnabled =
                    establishment?.minimumOrderEnabled || false;
                  const isBelowMinimum =
                    minOrderEnabled && subtotalDesktop < minOrderValue;
                  const amountNeeded = minOrderValue - subtotalDesktop;

                  return isBelowMinimum && cart.length > 0 ? (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start gap-2">
                        <ShoppingBag className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-500 text-sm">
                            Pedido mínimo: {formatPrice(minOrderValue)}
                          </p>
                          <p className="text-xs text-red-500 mt-0.5">
                            Faltam {formatPrice(amountNeeded)} para atingir o
                            mínimo
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Cupom */}
                {appliedCoupon ? (
                  <div className="w-full flex items-center justify-between mt-4 py-3 border-t border-gray-100 -mx-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Ticket className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-green-700 text-sm">
                          Cupom aplicado!
                        </p>
                        <p className="text-xs text-green-600">
                          {appliedCoupon.code} -{" "}
                          {appliedCoupon.type === "percentage"
                            ? `${appliedCoupon.value}% de desconto`
                            : `R$ ${appliedCoupon.value.toFixed(2).replace(".", ",")} de desconto`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode("");
                      }}
                      className="p-2 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowCouponModal(true);
                      setCouponError("");
                    }}
                    className="w-full flex items-center justify-between mt-4 py-3 border-t border-gray-100 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Ticket className="h-5 w-5 text-gray-500" />
                      <div className="text-left">
                        <p className="font-medium text-gray-800 text-sm">
                          Tem um cupom?
                        </p>
                        <p className="text-xs text-gray-400">
                          Clique e insira o código
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                )}

                {/* Button - Desktop */}
                {(() => {
                  const subtotalBtn = cart.reduce((sum, item) => {
                    const complementsTotal = item.complements.reduce(
                      (cSum, c) => cSum + Number(c.price) * (c.quantity || 1),
                      0
                    );
                    return (
                      sum +
                      (Number(item.price) + complementsTotal) * item.quantity
                    );
                  }, 0);
                  const minOrderValueBtn = Number(
                    establishment?.minimumOrderValue || 0
                  );
                  const minOrderEnabledBtn =
                    establishment?.minimumOrderEnabled || false;
                  const isBelowMinBtn =
                    minOrderEnabledBtn && subtotalBtn < minOrderValueBtn;

                  // Verificar se precisa selecionar bairro
                  const needsNeighborhoodSelection =
                    deliveryType === "delivery" &&
                    establishment?.deliveryFeeType === "byNeighborhood" &&
                    !selectedNeighborhood;
                  const hasNoNeighborhoodsConfigured =
                    establishment?.deliveryFeeType === "byNeighborhood" &&
                    (!neighborhoodFeesData ||
                      neighborhoodFeesData.length === 0);

                  return (
                    <div className="relative">
                      <button
                        disabled={
                          isLitePlan
                            ? cart.length === 0
                            : cart.length === 0 || !isOpen || isBelowMinBtn
                        }
                        onClick={() => {
                          if (isLitePlan) {
                            if (cart.length > 0) {
                              setOrderSent(false);
                              setOrderError(null);
                              setCreatedOrderNumber(null);
                              setWhatsAppConfirmationPending(false);
                              setPendingWhatsAppOrderUrl(null);
                              setCheckoutStep(1); // Lite: step 1 = Resumo
                            }
                            return;
                          }
                          if (cart.length > 0 && isOpen && !isBelowMinBtn) {
                            // Validar seleção de bairro se necessário
                            if (needsNeighborhoodSelection) {
                              if (hasNoNeighborhoodsConfigured) {
                                setShowNoNeighborhoodTooltipAdvance(true);
                                setTimeout(
                                  () =>
                                    setShowNoNeighborhoodTooltipAdvance(false),
                                  4000
                                );
                                return;
                              }
                              setReopenBagAfterNeighborhood(true);
                              setShowNeighborhoodModal(true);
                              return;
                            }
                            setOrderSent(false);
                            setOrderError(null);
                            setCreatedOrderNumber(null);
                            setCheckoutStep(1);
                          }
                        }}
                        className={`w-full mt-4 py-3.5 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                          isLitePlan
                            ? cart.length === 0
                              ? "bg-red-400/80 text-white cursor-not-allowed"
                              : "bg-green-500 hover:bg-green-600 text-white"
                            : !isOpen
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : cart.length === 0
                                ? "bg-red-400/80 text-white cursor-not-allowed"
                                : isBelowMinBtn
                                  ? "border-2 border-red-500 text-red-500 bg-white hover:bg-red-50"
                                  : "bg-red-500 hover:bg-red-500 text-white"
                        }`}
                      >
                        {isLitePlan ? (
                          cart.length === 0 ? (
                            "Sacola vazia"
                          ) : (
                            <>
                              <MessageCircle className="h-5 w-5" />
                              Enviar via WhatsApp
                            </>
                          )
                        ) : !isOpen ? (
                          <>
                            <Clock className="h-5 w-5" />
                            Restaurante Fechado
                          </>
                        ) : cart.length === 0 ? (
                          "Sacola vazia"
                        ) : isBelowMinBtn ? (
                          <>
                            <Plus className="h-5 w-5" />
                            Adicionar mais itens
                          </>
                        ) : (
                          "Avançar"
                        )}
                      </button>
                      {showNoNeighborhoodTooltipAdvance &&
                        hasNoNeighborhoodsConfigured && (
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-1 duration-200">
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            <span>
                              O estabelecimento não configurou bairros de
                              entrega
                            </span>
                          </div>
                        )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* SEO Text Section - visível para crawlers, discreto para usuários */}
      {establishment && (
        <section className="py-6 px-4 relative z-[1]">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              ❤️ {establishment.name} — Cardápio Digital e Delivery
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-2">
              Confira o cardápio completo de{" "}
              <strong>{establishment.name}</strong>
              {establishment.city ? ` em ${establishment.city}` : ""}
              {establishment.state ? `/${establishment.state}` : ""}. Faça seu
              pedido online com entrega rápida e prática.
              {establishment.street
                ? ` Localizado em ${establishment.street}${establishment.number ? `, ${establishment.number}` : ""}${establishment.neighborhood ? ` — ${establishment.neighborhood}` : ""}.`
                : ""}
            </p>
            {categories && categories.length > 0 && (
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong>Categorias disponíveis:</strong>{" "}
                {categories
                  .map((c: (typeof categories)[number]) => c.name)
                  .join(" • ")}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Cardápio digital com pedidos online, delivery e retirada.
              {establishment.deliveryEnabled ? " Entrega disponível." : ""}
              {establishment.pickupEnabled ? " Retirada no local." : ""}
              {establishment.dineInEnabled ? " Consumo no local." : ""}
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer
        className="border-t border-red-200 bg-gradient-to-r from-red-500 to-red-500 py-4 mt-8 relative z-[1]"
        style={{ paddingTop: "10px", paddingBottom: "10px" }}
      >
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-white">
          <div className="flex items-center justify-center gap-2">
            <Store className="h-4 w-4 text-white/90 shrink-0" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-medium text-white/90 whitespace-nowrap">
              Dono de{" "}
              <span className="inline-block">
                {footerText}
                <span
                  className={`inline-block w-[3px] h-[0.85em] bg-white ml-0.5 align-middle rounded-sm transition-opacity duration-100 ${
                    footerCursor ? "opacity-100" : "opacity-0"
                  }`}
                />
              </span>
            </span>
            <a
              href="https://mindi.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 sm:px-4 py-1 bg-white text-red-500 rounded-[10px] text-xs sm:text-sm font-bold hover:scale-110 transition-transform duration-300 shadow-lg shadow-white/50 whitespace-nowrap"
              style={{
                paddingTop: "2px",
                paddingBottom: "2px",
                minWidth: "140px",
                height: "25px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                animation:
                  "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, glow 2s ease-in-out infinite alternate",
                boxShadow: "0 0 15px rgba(255, 255, 255, 0.6)",
              }}
            >
              Criar cardápio grátis
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Bar - Sacola (aparece apenas quando tem itens) */}
      {(() => {
        const cartTotalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartSubtotal = cart.reduce((sum, item) => {
          const complementsTotal = item.complements.reduce(
            (s, c) => s + parseFloat(c.price) * (c.quantity || 1),
            0
          );
          return (
            sum + (parseFloat(item.price) + complementsTotal) * item.quantity
          );
        }, 0);
        const hasItems = cart.length > 0;

        // Info de entrega
        let deliveryLabel = "";
        const freeDelInfo = getFreeDeliveryProgress(cartSubtotal);
        if (freeDelInfo?.achieved) {
          deliveryLabel = "Entrega grátis!";
        } else if (establishment.deliveryFeeType === "free") {
          deliveryLabel = "Entrega Grátis";
        } else if (
          establishment.deliveryFeeType === "fixed" &&
          establishment.deliveryFeeFixed
        ) {
          deliveryLabel = freeDelInfo
            ? `Falta ${formatPrice(freeDelInfo.remaining)} p/ entrega grátis`
            : `Taxa de entrega: R$ ${Number(establishment.deliveryFeeFixed).toFixed(2).replace(".", ",")}`;
        } else if (establishment.deliveryFeeType === "byNeighborhood") {
          deliveryLabel =
            freeDelInfo && !freeDelInfo.achieved
              ? `Falta ${formatPrice(freeDelInfo.remaining)} p/ entrega grátis`
              : "Total sem entrega";
        }

        return (
          <>
            <nav
              className={`md:hidden fixed bottom-0 left-0 right-0 bg-red-500 z-50 transition-transform duration-300 ease-out ${
                hasItems ? "translate-y-0" : "translate-y-full"
              }`}
              style={{
                boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
                maxHeight: "68px",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ height: "56px" }}
              >
                {/* Lado esquerdo - Valor + Quantidade + Info entrega */}
                <div className="flex flex-col">
                  {deliveryLabel && (
                    <span
                      className={`text-white/80 text-[11px] font-medium leading-tight ${deliveryLabel.includes("Falta") ? "shimmer-text" : ""}`}
                    >
                      {deliveryLabel}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-lg leading-tight">
                      R$ {cartSubtotal.toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-white/70 text-xs">
                      / {cartTotalQty} {cartTotalQty === 1 ? "item" : "itens"}
                    </span>
                  </div>
                </div>

                {/* Lado direito - Bot\u00e3o Ver sacola */}
                <button
                  onClick={() => setShowMobileBag(true)}
                  className="flex items-center gap-2 bg-white text-red-500 font-bold px-5 py-2.5 rounded-xl shadow-md hover:bg-gray-50 active:scale-95 transition-transform"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span className="text-sm">Ver sacola</span>
                </button>
              </div>
            </nav>

            {/* Bottom padding for mobile nav - s\u00f3 quando tem itens */}
            {hasItems && <div className="md:hidden h-[68px]" />}
          </>
        );
      })()}

      {/* Modal Mais Informações */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={() => setShowInfoModal(false)}
          />

          {/* Modal Content - Bottom Sheet no mobile */}
          <div className="relative bg-gray-200 rounded-t-[30px] overflow-hidden md:rounded-[30px] shadow-2xl w-full md:max-w-md md:mx-4 max-h-[80vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            {/* Header - estilo vermelho */}
            <div
 className="sticky top-0 bg-gradient-to-r from-red-500 to-red-500 px-5 overflow-hidden z-10 flex items-center"
              style={{
                height: "67px",
                paddingTop: "12px",
                paddingBottom: "12px",
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Info className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Informações
                    </h2>
                    <p className="text-sm text-white/80">
                      Sobre o estabelecimento
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div
              className="p-6 space-y-6"
              style={{ backgroundColor: "#ffffff" }}
            >
              {/* Horários de Funcionamento */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold text-gray-900">
                    Horários de Funcionamento
                  </h3>
                </div>
                <div className="space-y-2">
                  {(() => {
                    const dayNames = [
                      "Domingo",
                      "Segunda-feira",
                      "Terça-feira",
                      "Quarta-feira",
                      "Quinta-feira",
                      "Sexta-feira",
                      "Sábado",
                    ];
                    const shortDayNames = [
                      "Domingo",
                      "Segunda",
                      "Terça",
                      "Quarta",
                      "Quinta",
                      "Sexta",
                      "Sábado",
                    ];
                    const orderedDays = [1, 2, 3, 4, 5, 6, 0]; // Seg a Dom

                    if (!businessHoursData || businessHoursData.length === 0) {
                      return (
                        <p className="text-sm text-gray-500 py-2">
                          Horários não configurados
                        </p>
                      );
                    }

                    // Agrupar dias consecutivos com mesmo horário
                    const dayHours = orderedDays.map(dayIndex => {
                      const dayData = businessHoursData.find(
                        (h: any) => h.dayOfWeek === dayIndex
                      );
                      const hours =
                        dayData &&
                        dayData.isActive &&
                        dayData.openTime &&
                        dayData.closeTime
                          ? `${dayData.openTime} às ${dayData.closeTime}`
                          : "Fechado";
                      return { dayIndex, hours };
                    });

                    const groups: {
                      startDay: number;
                      endDay: number;
                      hours: string;
                      dayIndices: number[];
                    }[] = [];
                    let currentGroup = {
                      startDay: dayHours[0].dayIndex,
                      endDay: dayHours[0].dayIndex,
                      hours: dayHours[0].hours,
                      dayIndices: [dayHours[0].dayIndex],
                    };

                    for (let i = 1; i < dayHours.length; i++) {
                      if (dayHours[i].hours === currentGroup.hours) {
                        currentGroup.endDay = dayHours[i].dayIndex;
                        currentGroup.dayIndices.push(dayHours[i].dayIndex);
                      } else {
                        groups.push(currentGroup);
                        currentGroup = {
                          startDay: dayHours[i].dayIndex,
                          endDay: dayHours[i].dayIndex,
                          hours: dayHours[i].hours,
                          dayIndices: [dayHours[i].dayIndex],
                        };
                      }
                    }
                    groups.push(currentGroup);

                    return groups.map((group, idx) => {
                      const label =
                        group.dayIndices.length === 1
                          ? dayNames[group.startDay]
                          : group.dayIndices.length === 7
                            ? "Todos os dias"
                            : `${shortDayNames[group.startDay]} a ${shortDayNames[group.endDay]}`;
                      const today = new Date().getDay();
                      const includestoday = group.dayIndices.includes(today);
                      return (
                        <ScheduleRow
                          key={idx}
                          day={label}
                          hours={group.hours}
                          dayIndex={includestoday ? today : -1}
                        />
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Formas de Pagamento */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold text-gray-900">
                    Formas de Pagamento
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {establishment.acceptsCash && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Banknote className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-700">Dinheiro</span>
                    </div>
                  )}
                  {establishment.acceptsCard && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <span className="text-sm text-gray-700">Cartão</span>
                    </div>
                  )}
                  {establishment.acceptsPix && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <QrCode className="h-5 w-5 text-teal-600" />
                      <span className="text-sm text-gray-700">Pix</span>
                    </div>
                  )}
                  {establishment.acceptsBoleto && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-600" />
                      <span className="text-sm text-gray-700">Boleto</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Item ao Carrinho */}
      {selectedProduct && (
        <div
          className={`fixed inset-0 z-[110] flex items-end md:items-center md:justify-center transition-opacity duration-300 ${isClosingProductModal ? "opacity-0" : "opacity-100"}`}
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-slate-900/45 backdrop-blur-sm transition-opacity duration-300 ${isClosingProductModal ? "opacity-0" : "opacity-100"}`}
            onClick={closeProductModal}
          />

          {/* Modal Content - Bottom Sheet no mobile */}
          <div
            className={`relative bg-white rounded-t-[30px] overflow-hidden md:rounded-[30px] shadow-2xl w-full md:max-w-md md:mx-4 max-h-[80vh] overflow-hidden flex flex-col transition-transform duration-300 ease-out ${isClosingProductModal ? "translate-y-full md:translate-y-0 md:scale-95 md:opacity-0" : "animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300"}`}
            style={{ touchAction: "pan-y" }}
          >
            {/* Imagem do Produto ou Complemento Selecionado - Fade Crossfade Carousel */}
            {(() => {
              // Determinar qual imagem exibir: complemento selecionado ou produto
              const productImages = selectedProduct.images || [];
              const currentModalImage =
                productImages[modalImageIndex] || productImages[0];
              const displayImage = selectedComplementImage || currentModalImage;
              const isComplementImage = !!selectedComplementImage;
              const hasMultipleImages =
                !isComplementImage && productImages.length > 1;

              if (displayImage) {
                return (
                  <div
                    className="relative w-full flex-shrink-0 overflow-hidden"
                    style={{ height: "215px" }}
                    onMouseEnter={() => {
                      (window as any).__carouselPaused = true;
                    }}
                    onMouseLeave={() => {
                      (window as any).__carouselPaused = false;
                    }}
                    onTouchStart={() => {
                      (window as any).__carouselPaused = true;
                    }}
                    onTouchEnd={() => {
                      setTimeout(() => {
                        (window as any).__carouselPaused = false;
                      }, 2000);
                    }}
                  >
                    {/* Fade Crossfade: empilhar todas as imagens e controlar opacidade */}
                    {hasMultipleImages ? (
                      productImages.map((img: string, idx: number) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${selectedProduct.name} ${idx + 1}`}
                          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                          style={{
                            opacity: idx === modalImageIndex ? 1 : 0,
                            transition: "opacity 600ms ease-in-out",
                            zIndex: idx === modalImageIndex ? 1 : 0,
                          }}
                          onClick={() => {
                            setFullscreenImageIndex(modalImageIndex);
                            setShowFullscreenImage(true);
                          }}
                        />
                      ))
                    ) : (
                      <img
                        src={displayImage}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => {
                          if (!isComplementImage) {
                            setFullscreenImageIndex(modalImageIndex);
                            setShowFullscreenImage(true);
                          }
                        }}
                      />
                    )}

                    {/* Overlay de toque para fullscreen (apenas para imagem do produto) */}
                    {!isComplementImage && (
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        style={{ zIndex: 2 }}
                        onClick={() => {
                          setFullscreenImageIndex(modalImageIndex);
                          setShowFullscreenImage(true);
                        }}
                      >
                        <div className="bg-white/80 rounded-full p-3 shadow-lg">
                          <Eye className="h-6 w-6 text-gray-700" />
                        </div>
                      </div>
                    )}

                    {/* Dots indicadores - apenas quando há mais de 1 foto */}
                    {hasMultipleImages && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                        {productImages.map((_: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={e => {
                              e.stopPropagation();
                              setModalImageIndex(idx);
                            }}
                            className={`rounded-full transition-colors duration-300 ${
                              idx === modalImageIndex
                                ? "w-6 h-2 bg-white shadow-md"
                                : "w-2 h-2 bg-white/60 hover:bg-white/80"
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                      <div ref={productShareDropdownRef} className="relative">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setShowProductShareDropdown(prev => !prev);
                          }}
                          className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                          title="Compartilhar produto"
                          aria-label="Compartilhar produto"
                        >
                          <Share2 className="h-5 w-5 text-gray-700" />
                        </button>

                        {showProductShareDropdown && (
                          <div className="absolute right-0 top-11 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                shareProductLink("whatsapp");
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <MessageCircle className="h-4 w-4 text-green-600" />
                              WhatsApp
                            </button>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                shareProductLink("facebook");
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Share2 className="h-4 w-4 text-blue-600" />
                              Facebook
                            </button>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                shareProductLink("copy");
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Copy className="h-4 w-4 text-gray-600" />
                              Copiar link
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={closeProductModal}
                        className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                        aria-label="Fechar modal do produto"
                      >
                        <X className="h-5 w-5 text-gray-700" />
                      </button>
                    </div>
                  </div>
                );
              }

              // Placeholder quando não há imagem
              return (
                <div
                  className="relative w-full flex-shrink-0 bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center overflow-hidden"
                  style={{ height: "180px" }}
                >
                  <UtensilsCrossed className="h-16 w-16 md:h-20 md:w-20 text-white/80 animate-placeholder-pulse" />

                  <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                    <div ref={productShareDropdownRef} className="relative">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setShowProductShareDropdown(prev => !prev);
                        }}
                        className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                        title="Compartilhar produto"
                        aria-label="Compartilhar produto"
                      >
                        <Share2 className="h-5 w-5 text-gray-700" />
                      </button>

                      {showProductShareDropdown && (
                        <div className="absolute right-0 top-11 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              shareProductLink("whatsapp");
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <MessageCircle className="h-4 w-4 text-green-600" />
                            WhatsApp
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              shareProductLink("facebook");
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Share2 className="h-4 w-4 text-blue-600" />
                            Facebook
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              shareProductLink("copy");
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Copy className="h-4 w-4 text-gray-600" />
                            Copiar link
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={closeProductModal}
                      className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                      aria-label="Fechar modal do produto"
                    >
                      <X className="h-5 w-5 text-gray-700" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Header sem imagem - removido, agora usa placeholder */}
            {false && (
              <div
                className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between"
                style={{ height: "49px" }}
              >
                <h2 className="text-lg font-bold text-gray-900">
                  Adicionar Item
                </h2>
                <button
                  onClick={closeProductModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            )}

            {/* Body */}
            <div
              ref={modalScrollRef}
              className="flex-1 overflow-y-auto overscroll-contain space-y-0 pb-3 bg-white"
            >
              {/* Título, Preço e Descrição - dentro do scroll mas com z-index para ficar acima */}
              <div className="p-4 sm:p-5 md:p-6 pb-2 space-y-3 sm:space-y-4 relative z-30 bg-white">
                {/* Título e Preço */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedProduct.name}
                  </h3>
                  {Number(selectedProduct.price) > 0 ? (
                    selectedProduct.promotionalPrice &&
                    Number(selectedProduct.promotionalPrice) > 0 &&
                    Number(selectedProduct.promotionalPrice) <
                      Number(selectedProduct.price) ? (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-lg font-bold text-red-500">
                          {formatPrice(selectedProduct.promotionalPrice)}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(selectedProduct.price)}
                        </span>
                        <span className="relative overflow-hidden text-xs font-bold text-white bg-emerald-500 rounded px-1.5 py-0.5">
                          <span className="relative z-10">
                            -
                            {Math.round(
                              (1 -
                                Number(selectedProduct.promotionalPrice) /
                                  Number(selectedProduct.price)) *
                                100
                            )}
                            %
                          </span>
                          <span className="absolute inset-0 animate-[banner-shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        </span>
                        {cashbackEnabled?.enabled && Number(cashbackEnabled?.percent) > 0 &&
                          (cashbackEnabled?.applyMode === "all" ||
                           (cashbackEnabled?.applyMode === "categories" &&
                            cashbackEnabled?.categoryIds?.includes((selectedProduct as any)?.categoryId as number))) && (
                          <span className="text-xs font-medium text-emerald-600">
                            +{formatPrice((Number(selectedProduct.promotionalPrice) * Number(cashbackEnabled.percent) / 100).toFixed(2))} cashback
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-lg font-semibold text-red-500">
                          {formatPrice(selectedProduct.price)}
                        </p>
                        {cashbackEnabled?.enabled && Number(cashbackEnabled?.percent) > 0 &&
                          (cashbackEnabled?.applyMode === "all" ||
                           (cashbackEnabled?.applyMode === "categories" &&
                            cashbackEnabled?.categoryIds?.includes((selectedProduct as any)?.categoryId as number))) && (
                          <span className="text-xs font-medium text-emerald-600">
                            +{formatPrice((Number(selectedProduct.price) * Number(cashbackEnabled.percent) / 100).toFixed(2))} cashback
                          </span>
                        )}
                      </div>
                    )
                  ) : (() => {
                    const startingComplementPrice =
                      getStartingComplementPrice(selectedProduct);
                    return startingComplementPrice ? (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-lg font-semibold text-red-500">
                          A partir de {formatPrice(startingComplementPrice)}
                        </p>
                        {cashbackEnabled?.enabled && Number(cashbackEnabled?.percent) > 0 &&
                          (cashbackEnabled?.applyMode === "all" ||
                           (cashbackEnabled?.applyMode === "categories" &&
                            cashbackEnabled?.categoryIds?.includes((selectedProduct as any)?.categoryId as number))) && (
                          <span className="text-xs font-medium text-emerald-600">
                            +{formatPrice((Number(startingComplementPrice) * Number(cashbackEnabled.percent) / 100).toFixed(2))} cashback
                          </span>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Descrição */}
                {selectedProduct.description && (
                  <ExpandableDescription text={selectedProduct.description} />
                )}
              </div>

              {/* Grupos de Complementos */}
              {productComplements && productComplements.length > 0 && (
                <div className="px-4 sm:px-5 md:px-6">
                  <ComplementGroups
                    groups={productComplements as any}
                    selectedComplements={selectedComplements}
                    onSelectedComplementsChange={updater =>
                      setSelectedComplements(updater)
                    }
                    getPrice={item => getComplementPrice(item, deliveryType)}
                    formatPrice={formatPrice}
                    onComplementImageChange={setSelectedComplementImage}
                    selectedComplementImage={selectedComplementImage}
                    idPrefix="complement"
                    hideBlockedGroups={true}
                    stickyHeaderMode="desktop-only"
                    substitutions={productSubstitutions}
                    selectedSubstitutions={selectedSubstitutions}
                    onSelectedSubstitutionsChange={setSelectedSubstitutions}
                  />
                </div>
              )}

              {/* Campo de Observação - sempre visível */}
              <div data-observation-field className="p-4 sm:p-5 md:p-6 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <MessageCircle
                      className="h-4 w-4 text-gray-500"
                      fill="currentColor"
                    />
                    Alguma observação?
                  </label>
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      productObservation.length >= 150
                        ? "text-red-500 font-bold"
                        : productObservation.length >= 130
                          ? "text-red-400"
                          : productObservation.length >= 110
                            ? "text-orange-400"
                            : "text-gray-400"
                    }`}
                  >
                    {productObservation.length}/150
                  </span>
                </div>
                <textarea
                  value={productObservation}
                  onChange={e => {
                    if (e.target.value.length <= 150) {
                      setProductObservation(e.target.value);
                      // Auto-resize: reset height then set to scrollHeight
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }
                  }}
                  onFocus={e => {
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  placeholder="Ex: tirar a cebola, maionese à parte etc."
                  rows={1}
                  maxLength={150}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none overflow-hidden transition-all ${
                    productObservation.length >= 130
                      ? "border-red-300"
                      : "border-gray-200"
                  }`}
                  style={{ minHeight: "40px" }}
                />
              </div>
            </div>

            {/* Footer - Quantidade e Adicionar */}
            <div className="border-t p-4 bg-white flex items-center gap-4 flex-shrink-0">
              {/* Controle de Quantidade - ocultar quando restaurante fechado */}
              {isOpen && (() => {
                // Calcular quantidade já no carrinho para este produto
                const alreadyInCart = cart
                  .filter(item => item.productId === selectedProduct.id)
                  .reduce((sum, item) => sum + item.quantity, 0);
                const maxAvailable =
                  selectedProduct.availableStock != null
                    ? Math.max(
                        0,
                        selectedProduct.availableStock - alreadyInCart
                      )
                    : Infinity;
                const canIncrease = productQuantity < maxAvailable;

                return (
                  <div className="flex items-center gap-2 bg-gray-100 rounded-full px-1.5 py-1">
                    <button
                      onClick={() =>
                        setProductQuantity(Math.max(1, productQuantity - 1))
                      }
                      className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">
                      {productQuantity}
                    </span>
                    <button
                      onClick={() => {
                        if (canIncrease) {
                          setProductQuantity(productQuantity + 1);
                        }
                      }}
                      disabled={!canIncrease}
                      className={`w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center transition-colors ${canIncrease ? "hover:bg-gray-50 active:bg-gray-100" : "opacity-40 cursor-not-allowed"}`}
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                );
              })()}
              {/* Botão Adicionar */}
              {(() => {
                // Calcular preço total com complementos (considerando quantidade)
                let complementsTotal = 0;
                const selectedComplementsList: Array<{
                  id: number;
                  name: string;
                  price: string;
                  quantity: number;
                  isIncluded?: boolean;
                  groupType?: "complement" | "included";
                }> = [];

                if (productComplements) {
                  productComplements.forEach(group => {
                    if ((group as any).groupType === "included") {
                      group.items.forEach(item => {
                        // Verificar se tem troca selecionada
                        const subId = selectedSubstitutions?.get(item.id);
                        if (subId && productSubstitutions) {
                          const itemSubs = productSubstitutions.find(s => s.complementItemId === item.id);
                          const sub = itemSubs?.substitutions.find(s => s.id === subId);
                          if (sub) {
                            const subPrice = sub.additionalPrice / 100;
                            complementsTotal += subPrice;
                            selectedComplementsList.push({
                              id: item.id,
                              name: `${item.name} → ${sub.name}`,
                              price: String(subPrice),
                              quantity: 1,
                              isIncluded: true,
                              groupType: "included",
                            });
                            return;
                          }
                        }
                        selectedComplementsList.push({
                          id: item.id,
                          name: item.name,
                          price: "0",
                          quantity: 1,
                          isIncluded: true,
                          groupType: "included",
                        });
                      });
                      return;
                    }

                    const selectedInGroup = selectedComplements.get(group.id);
                    if (selectedInGroup) {
                      group.items.forEach(item => {
                        const qty = selectedInGroup.get(item.id);
                        if (qty && qty > 0) {
                          // Considerar priceMode e contexto de gratuidade
                          const itemPrice = getComplementPrice(
                            item,
                            deliveryType
                          );
                          complementsTotal += itemPrice * qty;
                          selectedComplementsList.push({
                            id: item.id,
                            name: item.name,
                            price: String(itemPrice),
                            quantity: qty,
                          });
                        }
                      });
                    }
                  });
                }

                const effectivePrice =
                  selectedProduct.promotionalPrice &&
                  Number(selectedProduct.promotionalPrice) > 0 &&
                  Number(selectedProduct.promotionalPrice) <
                    Number(selectedProduct.price)
                    ? Number(selectedProduct.promotionalPrice)
                    : Number(selectedProduct.price);
                const unitPrice = effectivePrice + complementsTotal;
                const totalPrice = unitPrice * productQuantity;

                // Verificar se grupos obrigatórios estão preenchidos
                let requiredGroupsMet = true;
                if (productComplements) {
                  productComplements.forEach(group => {
                    if ((group as any).groupType === "included") return;
                    if (group.minQuantity > 0) {
                      const selectedInGroup = selectedComplements.get(group.id);
                      // Contar total de itens selecionados no grupo
                      const selectedCount = selectedInGroup
                        ? Array.from(selectedInGroup.values()).reduce(
                            (a, b) => a + b,
                            0
                          )
                        : 0;
                      if (selectedCount < group.minQuantity) {
                        requiredGroupsMet = false;
                      }
                    }
                  });
                }

                // Verificar se a loja está aberta
                const isStoreOpen = isOpen;

                // Verificar se item tem preço zero e nenhum complemento selecionado
                const hasZeroPrice = effectivePrice === 0;
                const hasSelectedComplements =
                  selectedComplementsList.length > 0;
                const canAddZeroPriceItem =
                  !hasZeroPrice || hasSelectedComplements;

                // Verificar se produto está sem estoque
                const isOutOfStock =
                  (selectedProduct as any).outOfStock === true;

                // Verificar limite de estoque
                const alreadyInCartForAdd = cart
                  .filter(item => item.productId === selectedProduct.id)
                  .reduce((sum, item) => sum + item.quantity, 0);
                const maxAvailableForAdd =
                  selectedProduct.availableStock != null
                    ? Math.max(
                        0,
                        selectedProduct.availableStock - alreadyInCartForAdd
                      )
                    : Infinity;
                const exceedsStock = productQuantity > maxAvailableForAdd;

                const canAddToCart =
                  requiredGroupsMet &&
                  isStoreOpen &&
                  canAddZeroPriceItem &&
                  !isOutOfStock &&
                  !exceedsStock;

                return (
                  <button
                    onClick={() => {
                      if (!isStoreOpen) return;
                      if (exceedsStock) return;

                      const newItem = {
                        productId: selectedProduct.id,
                        name: selectedProduct.name,
                        price: String(effectivePrice),
                        quantity: productQuantity,
                        observation: productObservation,
                        image: selectedProduct.images?.[0] || null,
                        complements: selectedComplementsList,
                      };

                      // Verificar se é o primeiro item (sacola vazia) para abrir automaticamente
                      const wasCartEmpty = cart.length === 0;

                      setCart(prev => {
                        // Validar estoque antes de adicionar
                        const currentInCart = prev
                          .filter(item => item.productId === selectedProduct.id)
                          .reduce((sum, item) => sum + item.quantity, 0);
                        if (
                          selectedProduct.availableStock != null &&
                          currentInCart + productQuantity >
                            selectedProduct.availableStock
                        ) {
                          return prev; // Não adicionar se exceder estoque
                        }

                        // Para itens com complementos, sempre adiciona como novo item
                        if (selectedComplementsList.length > 0) {
                          return [...prev, newItem];
                        }

                        const existingIndex = prev.findIndex(
                          item =>
                            item.productId === newItem.productId &&
                            item.observation === newItem.observation &&
                            item.complements.length === 0
                        );

                        if (existingIndex >= 0) {
                          const updated = [...prev];
                          updated[existingIndex].quantity += newItem.quantity;
                          return updated;
                        }

                        return [...prev, newItem];
                      });

                      // Abrir sacola automaticamente apenas no primeiro item quando auto-open está habilitado
                      if (wasCartEmpty && bagAutoOpenEnabled) {
                        setShowMobileBag(true);
                      }

                      // Rastrear add_to_cart se veio de um story
                      if (storySource) {
                        recordStoryEventMutation.mutate({
                          storyId: storySource.storyId,
                          establishmentId: storySource.establishmentId,
                          eventType: "add_to_cart",
                          productId: selectedProduct.id,
                          sessionId:
                            sessionStorage.getItem("mindi_story_session") ||
                            undefined,
                        });
                        // Persistir no sessionStorage para rastrear order_completed
                        try {
                          sessionStorage.setItem(
                            "mindi_story_cart_source",
                            JSON.stringify(storySource)
                          );
                        } catch {}
                      }

                      // Animar fechamento e limpar seleções
                      setIsClosingProductModal(true);
                      setTimeout(() => {
                        setSelectedComplements(new Map());
                        setSelectedSubstitutions(new Map());
                        setProductObservation("");
                        setProductQuantity(1);
                        setSelectedComplementImage(null);
                        setSelectedProduct(null);
                        setStorySource(null);
                        setIsClosingProductModal(false);
                      }, 300);
                    }}
                    disabled={!canAddToCart}
                    className={`flex-1 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                      canAddToCart
                        ? "bg-red-500 hover:bg-red-500 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isOutOfStock ? (
                      <>
                        <span>Indisponível</span>
                      </>
                    ) : !isStoreOpen ? (
                      <>
                        <Clock className="h-5 w-5" />
                        <span>Restaurante Fechado</span>
                      </>
                    ) : hasZeroPrice && !hasSelectedComplements ? (
                      <>
                        <span>Escolha uma opção</span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="hidden xs:inline">Adicionar</span>
                          <span>{formatPrice(totalPrice)}</span>
                        </div>
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modais de Finalização de Pedido */}
      {checkoutStep > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center"
          style={{ touchAction: "none", overscrollBehavior: "contain" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onTouchMove={e => e.preventDefault()}
          />

          {/* Modal de Checkout Unificado - Bottom Sheet no mobile */}
          <div
            className="relative bg-white w-full md:w-[480px] md:max-w-lg rounded-t-[30px] overflow-hidden md:rounded-[30px] shadow-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 overscroll-contain"
            style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
          >
            {/* Header com Título - estilo vermelho */}
            <div
 className="flex-shrink-0 bg-gradient-to-r from-red-500 to-red-500 px-5 overflow-hidden flex items-center"
              style={{
                height: "67px",
                paddingTop: "12px",
                paddingBottom: "12px",
              }}
            >
              {/* Título e Botão Fechar */}
              <div className="flex items-center justify-between h-full w-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {isLitePlan ? (
                        <>
                          {checkoutStep === 1 && "Entrega e Pagamento"}
                          {checkoutStep === 2 && "Resumo do Pedido"}
                          {checkoutStep === 3 && "Seus Dados"}
                          {checkoutStep === 4 && "Confirma\u00e7\u00e3o"}
                        </>
                      ) : (
                        <>
                          {checkoutStep === 1 && "Entrega e Pagamento"}
                          {checkoutStep === 2 && "Resumo do Pedido"}
                          {isScheduling && checkoutStep === 3 && "Agendamento"}
                          {((!isScheduling && checkoutStep === 3) ||
                            (isScheduling && checkoutStep === 4)) &&
                            "Seus Dados"}
                          {((!isScheduling && checkoutStep === 4) ||
                            (isScheduling && checkoutStep === 5)) &&
                            "Confirma\u00e7\u00e3o"}
                        </>
                      )}
                    </h2>
                    <p className="text-sm text-white/80">
                      {isLitePlan ? (
                        <>
                          {checkoutStep === 1 && "Escolha como receber"}
                          {checkoutStep === 2 && "Confira seus itens"}
                          {checkoutStep === 3 && "Preencha seu nome"}
                          {checkoutStep === 4 && "Envie via WhatsApp"}
                        </>
                      ) : (
                        <>
                          {checkoutStep === 1 && "Escolha como receber"}
                          {checkoutStep === 2 && "Confira seus itens"}
                          {isScheduling &&
                            checkoutStep === 3 &&
                            "Escolha data e hor\u00e1rio"}
                          {((!isScheduling && checkoutStep === 3) ||
                            (isScheduling && checkoutStep === 4)) &&
                            "Preencha suas informa\u00e7\u00f5es"}
                          {((!isScheduling && checkoutStep === 4) ||
                            (isScheduling && checkoutStep === 5)) &&
                            "Envie seu pedido"}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCheckoutStep(0);
                    // Reset all order states when closing checkout
                    setOrderSent(false);
                    setOrderError(null);
                    setPixOnlineStatus("idle");
                    setPixOnlineEmv(null);
                    setPixOnlineTransactionId(null);
                    setPixOnlineOrderId(null);
                    setCardPaymentStatus("idle");
                    setCardPaymentOrderId(null);
                    setCardPaymentTransactionId(null);
                    setCardAntifraudId(null);
                    setCardAntifraudSession(null);
                    setCreatedOrderNumber(null);
                    setIsSendingOrder(false);
                    setWhatsAppConfirmationPending(false);
                    setPendingWhatsAppOrderUrl(null);
                  }}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Indicador de Progresso */}
            {(() => {
              const totalSteps = isLitePlan ? 4 : isScheduling ? 5 : 4;
              const stepLabels = isLitePlan
                ? ["Entrega", "Resumo", "Dados", "Enviar"]
                : isScheduling
                  ? ["Entrega", "Resumo", "Agendar", "Dados", "Enviar"]
                  : ["Entrega", "Resumo", "Dados", "Enviar"];
              return (
                <div className="flex-shrink-0 bg-white px-6 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map(
                      step => (
                        <div key={step} className="flex items-center">
                          <button
                            onClick={() =>
                              step < checkoutStep && setCheckoutStep(step)
                            }
                            disabled={step >= checkoutStep}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                              checkoutStep >= step
                                ? "bg-red-500 text-white"
                                : "bg-gray-200 text-gray-500"
                            } ${step < checkoutStep ? "cursor-pointer hover:ring-2 hover:ring-red-300" : ""}`}
                          >
                            {checkoutStep > step ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              step
                            )}
                          </button>
                          {step < totalSteps && (
                            <div
                              className={`${isScheduling ? "w-8 sm:w-10" : "w-12 sm:w-16"} h-1 mx-1 rounded transition-colors ${
                                checkoutStep > step
                                  ? "bg-red-500"
                                  : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>
                      )
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] sm:text-xs text-gray-500">
                    {stepLabels.map((label, i) => (
                      <span
                        key={label}
                        className={
                          checkoutStep >= i + 1
                            ? "text-red-500 font-medium"
                            : ""
                        }
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Modal 1 - Entrega e Pagamento */}
            {checkoutStep === 1 && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6 bg-white">
                  {/* Forma de Entrega */}
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                      <Bike className="h-4 w-4 text-red-500" />
                      Forma de entrega
                    </h3>
                    <div className="space-y-2">
                      {/* Opção: Delivery */}
                      {establishment.allowsDelivery && (
                        <button
                          type="button"
                          onClick={() => handleDeliveryTypeChange("delivery")}
                          className={`w-full flex items-center justify-between p-4 border rounded-xl transition-colors ${
                            deliveryType === "delivery"
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Bike
                              className={`h-5 w-5 ${deliveryType === "delivery" ? "text-red-500" : "text-gray-400"}`}
                            />
                            <div className="text-left">
                              <span className="font-medium text-gray-800">
                                Taxa de entrega
                              </span>
                              {(() => {
                                const checkoutSubtotal = cart.reduce(
                                  (sum, item) => {
                                    const ct = item.complements.reduce(
                                      (s, c) =>
                                        s +
                                        parseFloat(c.price) * (c.quantity || 1),
                                      0
                                    );
                                    return (
                                      sum +
                                      (parseFloat(item.price) + ct) *
                                        item.quantity
                                    );
                                  },
                                  0
                                );
                                // Para byRadius sem cálculo: mostrar "A calcular"
                                if (
                                  establishment.deliveryFeeType ===
                                    "byRadius" &&
                                  !radiusFeeCalculated
                                ) {
                                  if (radiusFeeOutOfRange)
                                    return (
                                      <span className="ml-2 text-sm text-red-500 font-medium">
                                        Fora da área
                                      </span>
                                    );
                                  if (radiusFeeLoading)
                                    return (
                                      <span className="ml-2 text-sm text-gray-400 italic">
                                        Calculando...
                                      </span>
                                    );
                                  return (
                                    <span className="ml-2 text-sm text-gray-400 italic">
                                      A calcular
                                    </span>
                                  );
                                }
                                // Para byNeighborhood sem bairro: mostrar "A calcular" primeiro
                                if (
                                  establishment.deliveryFeeType ===
                                    "byNeighborhood" &&
                                  !selectedNeighborhood
                                ) {
                                  // Verificar se freeDelivery por threshold está atingido
                                  const est = establishment as any;
                                  if (
                                    est.freeDeliveryEnabled &&
                                    est.freeDeliveryMinValue
                                  ) {
                                    const minVal = parseFloat(
                                      String(est.freeDeliveryMinValue)
                                    );
                                    if (
                                      minVal > 0 &&
                                      checkoutSubtotal >= minVal
                                    ) {
                                      return (
                                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 font-bold rounded-lg text-xs">
                                          <svg
                                            className="w-3 h-3"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                          Grátis!
                                        </span>
                                      );
                                    }
                                  }
                                  return (
                                    <span className="ml-2 text-sm text-gray-400 italic">
                                      A calcular
                                    </span>
                                  );
                                }
                                // Usar getRealDeliveryFee para sempre mostrar a taxa real de delivery
                                // independentemente do deliveryType selecionado (pickup/dine_in)
                                const fee =
                                  getRealDeliveryFee(checkoutSubtotal);
                                if (
                                  establishment.deliveryFeeType === "free" ||
                                  fee === 0
                                ) {
                                  return (
                                    <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 font-bold rounded-lg text-xs">
                                      <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      Grátis!
                                    </span>
                                  );
                                }
                                return (
                                  <span className="ml-2 text-sm text-red-500 font-semibold">
                                    {formatPrice(fee)}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              deliveryType === "delivery"
                                ? "border-red-500 bg-red-500"
                                : "border-gray-300"
                            }`}
                          >
                            {deliveryType === "delivery" && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </button>
                      )}

                      {/* Opção: Retirar no local */}
                      {establishment.allowsPickup && (
                        <button
                          type="button"
                          onClick={() => handleDeliveryTypeChange("pickup")}
                          className={`w-full flex items-center justify-between p-4 border rounded-xl transition-colors ${
                            deliveryType === "pickup"
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Package
                              className={`h-5 w-5 ${deliveryType === "pickup" ? "text-red-500" : "text-gray-400"}`}
                            />
                            <div className="text-left">
                              <span className="font-medium text-gray-800">
                                Retirar no local
                              </span>
                              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 font-bold rounded-lg text-xs">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Grátis!
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              deliveryType === "pickup"
                                ? "border-red-500 bg-red-500"
                                : "border-gray-300"
                            }`}
                          >
                            {deliveryType === "pickup" && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </button>
                      )}

                      {/* Opção: Consumir no local */}
                      {establishment.allowsDineIn && (
                        <button
                          type="button"
                          onClick={() => handleDeliveryTypeChange("dine_in")}
                          className={`w-full flex items-center justify-between p-4 border rounded-xl transition-colors ${
                            deliveryType === "dine_in"
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <UtensilsCrossed
                              className={`h-5 w-5 ${deliveryType === "dine_in" ? "text-red-500" : "text-gray-400"}`}
                            />
                            <div className="text-left">
                              <span className="font-medium text-gray-800">
                                Consumir no local
                              </span>
                              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 font-bold rounded-lg text-xs">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Grátis!
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              deliveryType === "dine_in"
                                ? "border-red-500 bg-red-500"
                                : "border-gray-300"
                            }`}
                          >
                            {deliveryType === "dine_in" && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Mensagem informativa para Consumir no local */}
                    {deliveryType === "dine_in" && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <div>
                            <p className="text-sm text-amber-800 font-medium">
                              Não garantimos disponibilidade de mesas.
                            </p>
                            <p className="text-xs text-amber-700 mt-0.5">
                              Verifique antes com nosso atendimento no{" "}
                              {establishment.whatsapp ? (
                                <a
                                  href={`https://wa.me/55${establishment.whatsapp.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-green-600 hover:text-green-700 underline"
                                >
                                  WhatsApp
                                </a>
                              ) : (
                                <span className="font-medium">WhatsApp</span>
                              )}
                              .
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Alerta de mudança de preço de complementos */}
                    {priceChangeAlert && priceChangeAlert.length > 0 && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-amber-800 font-medium">
                              Preços atualizados na sacola
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                              Ao mudar a forma de entrega, alguns complementos
                              tiveram o preço ajustado:
                            </p>
                            <ul className="mt-1.5 space-y-1">
                              {priceChangeAlert.map((change, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-amber-700 flex items-center gap-1"
                                >
                                  <span className="font-medium">
                                    {change.name}:
                                  </span>
                                  {change.oldPrice === 0 ? (
                                    <>
                                      <span className="line-through text-green-600">
                                        Grátis
                                      </span>{" "}
                                      <span className="text-red-500">
                                        → R${" "}
                                        {change.newPrice
                                          .toFixed(2)
                                          .replace(".", ",")}
                                      </span>
                                    </>
                                  ) : change.newPrice === 0 ? (
                                    <>
                                      <span className="line-through">
                                        R${" "}
                                        {change.oldPrice
                                          .toFixed(2)
                                          .replace(".", ",")}
                                      </span>{" "}
                                      <span className="text-green-600 font-semibold">
                                        → Grátis!
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="line-through">
                                        R${" "}
                                        {change.oldPrice
                                          .toFixed(2)
                                          .replace(".", ",")}
                                      </span>{" "}
                                      <span>
                                        → R${" "}
                                        {change.newPrice
                                          .toFixed(2)
                                          .replace(".", ",")}
                                      </span>
                                    </>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <button
                            onClick={() => setPriceChangeAlert(null)}
                            className="p-0.5 text-amber-400 hover:text-amber-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Campos de Endereço com Autocomplete e GPS */}
                    {deliveryType === "delivery" && (
                      <DeliveryAddressPicker
                        address={deliveryAddress}
                        onAddressChange={setDeliveryAddress}
                        isByNeighborhood={
                          establishment.deliveryFeeType === "byNeighborhood"
                        }
                        isByRadius={
                          establishment.deliveryFeeType === "byRadius"
                        }
                        neighborhoodSelector={
                          establishment.deliveryFeeType === "byNeighborhood" ? (
                            selectedNeighborhood ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700">
                                  {selectedNeighborhood.name}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReopenBagAfterNeighborhood(true);
                                    setCheckoutStep(0);
                                    setShowNeighborhoodModal(true);
                                  }}
                                  className="px-3 py-2.5 text-red-500 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
                                >
                                  Alterar bairro
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setReopenBagAfterNeighborhood(true);
                                  setCheckoutStep(0);
                                  setShowNeighborhoodModal(true);
                                }}
                                className="w-full px-3 py-2.5 border border-red-300 bg-red-50 rounded-lg text-sm text-red-500 font-medium text-left hover:bg-red-100 transition-colors"
                              >
                                Selecionar bairro
                              </button>
                            )
                          ) : undefined
                        }
                      />
                    )}
                  </div>

                  {/* Forma de Pagamento */}
                  <div ref={paymentSectionRef}>
                    <h3
                      className={`font-semibold text-sm mb-3 flex items-center gap-2 ${paymentError ? "text-red-500" : "text-gray-800"}`}
                    >
                      <CreditCard
                        className={`h-4 w-4 ${paymentError ? "text-red-500" : "text-red-500"}`}
                      />
                      Forma de pagamento
                      {paymentError && (
                        <span className="text-xs font-normal text-red-500 ml-1">
                          — Selecione uma opção
                        </span>
                      )}
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod("cash");
                            setPaymentError(false);
                          }}
                          className={`w-full flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${
                            paymentMethod === "cash"
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Banknote
                              className={`h-5 w-5 ${paymentMethod === "cash" ? "text-red-500" : "text-gray-400"}`}
                            />
                            <span className="font-medium text-gray-800">
                              Dinheiro
                            </span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === "cash"
                                ? "border-red-500 bg-red-500"
                                : "border-gray-300"
                            }`}
                          >
                            {paymentMethod === "cash" && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </button>
                        {/* Campo de Troco (logo abaixo de Dinheiro) */}
                        {paymentMethod === "cash" && (
                          <div className="mt-2 p-4 bg-gray-50 rounded-xl ml-7">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Precisa de troco para quanto?
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={changeAmount}
                                onChange={e => {
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    ""
                                  );
                                  if (value) {
                                    const formatted = (
                                      Number(value) / 100
                                    ).toLocaleString("pt-BR", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    });
                                    setChangeAmount(formatted);

                                    // Validar se o valor do troco é maior que o total
                                    const numericValue = Number(value) / 100;
                                    // Calcular total do carrinho para validação
                                    const cartTotal =
                                      cart.reduce((sum, item) => {
                                        const itemTotal =
                                          parseFloat(item.price) *
                                          item.quantity;
                                        const complementsTotal =
                                          item.complements.reduce(
                                            (s, c) =>
                                              s +
                                              parseFloat(c.price) *
                                                (c.quantity || 1),
                                            0
                                          ) * item.quantity;
                                        return (
                                          sum + itemTotal + complementsTotal
                                        );
                                      }, 0) - (appliedCoupon?.discount || 0);

                                    if (
                                      numericValue > 0 &&
                                      numericValue <= cartTotal
                                    ) {
                                      setChangeAmountError(
                                        "O valor do troco deve ser maior que o total do pedido (R$ " +
                                          cartTotal
                                            .toFixed(2)
                                            .replace(".", ",") +
                                          ")"
                                      );
                                    } else {
                                      setChangeAmountError(null);
                                    }
                                  } else {
                                    setChangeAmount("");
                                    setChangeAmountError(null);
                                  }
                                }}
                                placeholder="0,00"
                                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                                  changeAmountError
                                    ? "border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50"
                                    : "border-gray-200 focus:ring-red-500/20 focus:border-red-500"
                                }`}
                              />
                              {changeAmountError && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <svg
                                    className="h-5 w-5 text-red-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            {changeAmountError && (
                              <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                  />
                                </svg>
                                {changeAmountError}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              Deixe em branco se não precisar de troco
                            </p>

                            {/* Botões de atalho de valores - dinâmicos baseados no total do pedido */}
                            <div className="mt-3 flex gap-2">
                              {(() => {
                                const subtotal = cart.reduce((sum, item) => {
                                  const itemTotal =
                                    parseFloat(item.price) * item.quantity;
                                  const complementsTotal =
                                    item.complements.reduce(
                                      (s, c) =>
                                        s +
                                        parseFloat(c.price) * (c.quantity || 1),
                                      0
                                    ) * item.quantity;
                                  return sum + itemTotal + complementsTotal;
                                }, 0);
                                const discount = appliedCoupon?.discount || 0;
                                const deliveryFeeValue =
                                  getDeliveryFee(subtotal);
                                const cartTotal = Math.max(
                                  0,
                                  subtotal - discount + deliveryFeeValue
                                );
                                // Primeira sugestão: arredondar para cima ao próximo múltiplo de 10
                                const base = Math.ceil(cartTotal / 10) * 10;
                                // Se o total já é redondo, base === cartTotal, senão é o próximo múltiplo de 10
                                const suggestions = [
                                  base,
                                  base + 10,
                                  base + 20,
                                ].filter((v, i, arr) => arr.indexOf(v) === i);
                                return suggestions;
                              })().map(value => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => {
                                    const formatted = value.toLocaleString(
                                      "pt-BR",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    );
                                    setChangeAmount(formatted);

                                    // Validar se o valor do troco é maior que o total
                                    const cartTotal =
                                      cart.reduce((sum, item) => {
                                        const itemTotal =
                                          parseFloat(item.price) *
                                          item.quantity;
                                        const complementsTotal =
                                          item.complements.reduce(
                                            (s, c) =>
                                              s +
                                              parseFloat(c.price) *
                                                (c.quantity || 1),
                                            0
                                          ) * item.quantity;
                                        return (
                                          sum + itemTotal + complementsTotal
                                        );
                                      }, 0) - (appliedCoupon?.discount || 0);

                                    if (value > 0 && value <= cartTotal) {
                                      setChangeAmountError(
                                        "O valor do troco deve ser maior que o total do pedido (R$ " +
                                          cartTotal
                                            .toFixed(2)
                                            .replace(".", ",") +
                                          ")"
                                      );
                                    } else {
                                      setChangeAmountError(null);
                                    }
                                  }}
                                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                                    changeAmount ===
                                    value.toLocaleString("pt-BR", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                      ? "bg-red-500 text-white border border-red-500"
                                      : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                  }`}
                                >
                                  R$ {value}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Cartão - com dropdown quando pagamento com cartão online ativo (Paytime) */}
                      {establishment.paytimeCardEnabled ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => setShowCardOptions(!showCardOptions)}
                            className={`w-full flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${
                              paymentMethod === "card" ||
                              paymentMethod === "card_online"
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <CreditCard
                                className={`h-5 w-5 ${paymentMethod === "card" || paymentMethod === "card_online" ? "text-red-500" : "text-gray-400"}`}
                              />
                              <span className="font-medium text-gray-800">
                                Cartão
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {(paymentMethod === "card" ||
                                paymentMethod === "card_online") && (
                                <div className="w-5 h-5 rounded-full border-2 border-red-500 bg-red-500 flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                              <ChevronDown
                                className={`h-4 w-4 text-gray-400 transition-transform ${showCardOptions ? "rotate-180" : ""}`}
                              />
                            </div>
                          </button>
                          {showCardOptions && (
                            <div className="mt-2 ml-4 space-y-2">
                              {/* Opção: Trazer maquininha */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentMethod("card");
                                  setPaymentError(false);
                                }}
                                className={`w-full flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${
                                  paymentMethod === "card"
                                    ? "border-red-500 bg-red-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <CreditCard
                                    className={`h-4 w-4 ${paymentMethod === "card" ? "text-red-500" : "text-gray-400"}`}
                                  />
                                  <span className="font-medium text-gray-800 text-sm">
                                    Trazer maquininha
                                  </span>
                                </div>
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    paymentMethod === "card"
                                      ? "border-red-500 bg-red-500"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {paymentMethod === "card" && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </div>
                              </button>
                              {/* Opção: Pagar online */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentMethod("card_online");
                                  setPaymentError(false);
                                }}
                                className={`w-full flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${
                                  paymentMethod === "card_online"
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <svg
                                    className={`h-4 w-4 ${paymentMethod === "card_online" ? "text-blue-600" : "text-gray-400"}`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <rect
                                      x="1"
                                      y="4"
                                      width="22"
                                      height="16"
                                      rx="2"
                                      ry="2"
                                    />
                                    <line x1="1" y1="10" x2="23" y2="10" />
                                  </svg>
                                  <div className="text-left">
                                    <span className="font-medium text-gray-800 text-sm">
                                      Pagar online
                                    </span>
                                    <span className="block text-xs text-blue-600">
                                      Pagamento seguro com cartão
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <svg
                                    className="h-4 w-4 text-blue-500"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                  </svg>
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                      paymentMethod === "card_online"
                                        ? "border-blue-500 bg-blue-500"
                                        : "border-gray-300"
                                    }`}
                                  >
                                    {paymentMethod === "card_online" && (
                                      <Check className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod("card");
                            setPaymentError(false);
                          }}
                          className={`w-full flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${
                            paymentMethod === "card"
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <CreditCard
                              className={`h-5 w-5 ${paymentMethod === "card" ? "text-red-500" : "text-gray-400"}`}
                            />
                            <span className="font-medium text-gray-800">
                              Cartão
                            </span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === "card"
                                ? "border-red-500 bg-red-500"
                                : "border-gray-300"
                            }`}
                          >
                            {paymentMethod === "card" && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </button>
                      )}
                      {/* PIX - direto como Pix QR Code quando Paytime ativo, ou Pix manual quando não */}
                      {establishment.paytimeEnabled ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod("pix_online");
                            setPaymentError(false);
                          }}
                          className={`w-full flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${
                            paymentMethod === "pix_online"
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <QrCode
                              className={`h-5 w-5 ${paymentMethod === "pix_online" ? "text-red-500" : "text-gray-400"}`}
                            />
                            <div className="text-left">
                              <span className="font-medium text-gray-800">
                                Pix QR Code - Online
                              </span>
                              <span className="block text-xs text-red-500">
                                Pague agora com QR Code
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-4 w-4 text-red-500"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                paymentMethod === "pix_online"
                                  ? "border-red-500 bg-red-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {paymentMethod === "pix_online" && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod("pix");
                            setPaymentError(false);
                          }}
                          className={`w-full flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${
                            paymentMethod === "pix"
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <QrCode
                              className={`h-5 w-5 ${paymentMethod === "pix" ? "text-red-500" : "text-gray-400"}`}
                            />
                            <span className="font-medium text-gray-800">
                              Pix
                            </span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === "pix"
                                ? "border-red-500 bg-red-500"
                                : "border-gray-300"
                            }`}
                          >
                            {paymentMethod === "pix" && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Chave Pix (manual) */}
                    {paymentMethod === "pix" && establishment.pixKey && (
                      <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-xl">
                        <p className="text-sm text-teal-700 font-medium mb-2">
                          Chave Pix do estabelecimento
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-white px-3 py-2 rounded-lg text-sm text-gray-800 border border-teal-200 break-all">
                            {establishment.pixKey}
                          </code>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  establishment.pixKey || ""
                                );
                                setManualPixKeyCopied(true);
                                window.setTimeout(() => {
                                  setManualPixKeyCopied(false);
                                }, 2000);
                              } catch (error) {
                                console.warn("Não foi possível copiar a chave Pix:", error);
                              }
                            }}
                            className="flex-shrink-0 min-w-[44px] px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors inline-flex items-center justify-center gap-1.5"
                            title={manualPixKeyCopied ? "Chave Pix copiada" : "Copiar chave Pix"}
                          >
                            {manualPixKeyCopied ? (
                              <>
                                <Check className="h-4 w-4" />
                                <span className="text-xs font-semibold">Copiado</span>
                              </>
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-teal-600 mt-2">
                          Copie a chave para realizar o pagamento via Pix.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer with Cashback wallet icon */}
                <div className="flex-shrink-0 border-t px-6 py-4">
                  {(() => {
                    const needsNeighborhood =
                      establishment?.deliveryFeeType === "byNeighborhood" &&
                      deliveryType === "delivery";
                    const isNeighborhoodValid =
                      !needsNeighborhood || selectedNeighborhood !== null;
                    const needsRadius =
                      establishment?.deliveryFeeType === "byRadius" &&
                      deliveryType === "delivery";
                    const isRadiusValid =
                      !needsRadius ||
                      (!!radiusFeeCalculated && !radiusFeeOutOfRange);
                    const isAddressValid =
                      (deliveryType === "pickup" ||
                        deliveryType === "dine_in" ||
                        (deliveryAddress.street.trim() !== "" &&
                          deliveryAddress.number.trim() !== "" &&
                          (needsNeighborhood
                            ? selectedNeighborhood !== null
                            : needsRadius
                              ? (!!deliveryAddress.lat &&
                                  !!deliveryAddress.lng) ||
                                !!radiusFeeCalculated
                              : deliveryAddress.neighborhood.trim() !== ""))) &&
                      isNeighborhoodValid &&
                      isRadiusValid;
                    return (
                      <div className="flex items-center gap-3">
                        {/* Wallet icon for cashback */}
                        {cashbackEnabled?.enabled && (
                          <button
                            onClick={() => setShowCashbackCheckoutSheet(true)}
                            className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 hover:bg-red-100 transition-colors flex-shrink-0"
                          >
                            <Wallet className="h-5 w-5 text-red-500" />
                            {useCashbackInOrder &&
                              Number(cashbackAmountToUse) > 0 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                              )}
                          </button>
                        )}
                        {needsRadius && radiusFeeOutOfRange && (
                          <div className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200">
                              <MapPin className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <span className="text-xs text-red-500 font-medium">
                                Infelizmente não entregamos nessa região
                              </span>
                            </div>
                            <button
                              disabled
                              className="w-full py-3.5 font-semibold rounded-xl bg-gray-300 text-gray-500 cursor-not-allowed"
                            >
                              Fora da área de entrega
                            </button>
                          </div>
                        )}
                        {!(needsRadius && radiusFeeOutOfRange) && (
                          <button
                            onClick={() => {
                              if (!isAddressValid) {
                                if (!isNeighborhoodValid) {
                                  setReopenBagAfterNeighborhood(true);
                                  setCheckoutStep(0);
                                  setShowNeighborhoodModal(true);
                                  return;
                                }
                                if (needsRadius && !isRadiusValid) {
                                  if (radiusFeeLoading) {
                                    alert(
                                      "Aguarde o cálculo da taxa de entrega..."
                                    );
                                  } else {
                                    alert(
                                      "Não foi possível calcular a taxa de entrega. Por favor, selecione seu endereço usando a busca de endereço."
                                    );
                                  }
                                  return;
                                }
                                alert(
                                  "Por favor, preencha todos os campos obrigatórios do endereço (Rua, Número e Bairro)."
                                );
                                return;
                              }
                              if (!paymentMethod) {
                                setPaymentError(true);
                                paymentSectionRef.current?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                                return;
                              }
                              setPaymentError(false);
                              setCheckoutStep(2);
                            }}
                            className={`flex-1 py-3.5 font-semibold rounded-xl transition-colors ${
                              isAddressValid
                                ? "bg-red-500 hover:bg-red-500 text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            Próximo
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Modal 2 - Resumo do Pedido (step 2 para todos) */}
            {checkoutStep === 2 && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-5 bg-white">
                  {/* Itens */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-red-500" />
                      </div>
                      <h3 className="font-bold text-gray-900">Itens</h3>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      {cart.map((item, index) => (
                        <div
                          key={index}
                          className="text-sm border-l-4 border-red-500 pl-3 py-1 rounded-r-lg"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-gray-800 font-medium">
                              {item.quantity}x {item.name}
                            </span>
                            {Number(item.price) * item.quantity > 0 && (
                              <span className="text-red-500 font-semibold ml-2">
                                {formatPrice(
                                  Number(item.price) * item.quantity
                                )}
                              </span>
                            )}
                          </div>
                          {item.complements.length > 0 && (
                            <div className="mt-1">
                              {item.complements.map((c, cIdx) => (
                                <div
                                  key={cIdx}
                                  className="flex justify-between items-center text-xs"
                                >
                                  <span className="text-gray-500">
                                    {c.isIncluded || c.groupType === "included"
                                      ? "Incluso: "
                                      : "+ "}
                                    {(c.quantity || 1) > 1
                                      ? `${c.quantity}x `
                                      : ""}
                                    {c.name}
                                  </span>
                                  <span className="text-red-500 font-medium">
                                    {c.isIncluded || c.groupType === "included"
                                      ? "Incluso"
                                      : formatPrice(
                                          parseFloat(c.price) * (c.quantity || 1)
                                        )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {item.observation && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Obs: {item.observation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sugestões de Upsell */}
                  {upsellSuggestions && upsellSuggestions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                          <Gift className="h-5 w-5 text-amber-500" />
                        </div>
                        <h3 className="font-bold text-gray-900">
                          Que tal adicionar?
                        </h3>
                      </div>
                      <div className="relative">
                        <div
                          className="space-y-2 overflow-y-auto"
                          style={{ maxHeight: "260px" }}
                          onScroll={e => {
                            const el = e.currentTarget;
                            const fadeEl =
                              el.nextElementSibling as HTMLElement | null;
                            if (fadeEl) {
                              const isAtBottom =
                                el.scrollHeight -
                                  el.scrollTop -
                                  el.clientHeight <
                                8;
                              fadeEl.style.opacity = isAtBottom ? "0" : "1";
                            }
                          }}
                          ref={el => {
                            if (el) {
                              const hasScroll =
                                el.scrollHeight > el.clientHeight;
                              const fadeEl =
                                el.nextElementSibling as HTMLElement | null;
                              if (fadeEl)
                                fadeEl.style.opacity = hasScroll ? "1" : "0";
                            }
                          }}
                        >
                          {upsellSuggestions.map((product: any) => (
                            <div
                              key={product.id}
                              className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-lg p-2.5"
                            >
                              {product.images?.[0] ? (
                                <div className="w-9 h-9 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                                  <img
                                    src={getThumbUrl(product.images[0])}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-md bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0">
                                  <UtensilsCrossed className="h-4 w-4 text-gray-300" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-800 line-clamp-1">
                                  {product.name}
                                </p>
                              </div>
                              {Number(product.price) > 0 ? (
                                <span className="text-xs font-bold text-red-500 whitespace-nowrap flex-shrink-0">
                                  {formatPrice(product.price)}
                                </span>
                              ) : (() => {
                                const startingComplementPrice =
                                  getStartingComplementPrice(product);
                                return startingComplementPrice ? (
                                  <span className="text-xs font-bold text-red-500 whitespace-nowrap flex-shrink-0">
                                    A partir de {formatPrice(startingComplementPrice)}
                                  </span>
                                ) : null;
                              })()}
                              <button
                                onClick={() => {
                                  // Se o produto tem complementos (combo ou complementGroups), abrir modal de detalhes
                                  if (
                                    product.isCombo ||
                                    product.hasComplements
                                  ) {
                                    setModalImageIndex(0);
                                    setSelectedProduct({
                                      id: product.id,
                                      name: product.name,
                                      description: product.description,
                                      price: product.price,
                                      promotionalPrice:
                                        product.promotionalPrice,
                                      minComplementPrice:
                                        (product as any).minComplementPrice ?? null,
                                      images: product.images,
                                      hasStock: product.hasStock,
                                      availableStock:
                                        (product as any).availableStock ?? null,
                                      outOfStock:
                                        (product as any).outOfStock ?? false,
                                      categoryId: (product as any).categoryId ?? null,
                                    });
                                    setProductQuantity(1);
                                    setProductObservation("");
                                    return;
                                  }
                                  // Produto sem complementos: adicionar direto ao carrinho
                                  const quickEffectivePrice =
                                    product.promotionalPrice &&
                                    Number(product.promotionalPrice) > 0 &&
                                    Number(product.promotionalPrice) <
                                      Number(product.price)
                                      ? product.promotionalPrice
                                      : product.price;
                                  const newItem: CartItem = {
                                    productId: product.id,
                                    name: product.name,
                                    price: quickEffectivePrice,
                                    quantity: 1,
                                    observation: "",
                                    image: product.images?.[0] || null,
                                    complements: [],
                                  };
                                  setCart(prev => {
                                    const existing = prev.findIndex(
                                      item =>
                                        item.productId === product.id &&
                                        item.complements.length === 0 &&
                                        !item.observation
                                    );
                                    if (existing >= 0) {
                                      const updated = [...prev];
                                      updated[existing] = {
                                        ...updated[existing],
                                        quantity:
                                          updated[existing].quantity + 1,
                                      };
                                      return updated;
                                    }
                                    return [...prev, newItem];
                                  });
                                  toast.success(`${product.name} adicionado!`);
                                }}
                                className="w-7 h-7 flex items-center justify-center bg-red-500 hover:bg-red-500 text-white rounded-full transition-colors flex-shrink-0"
                                aria-label={`Adicionar ${product.name}`}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        {/* Fade gradiente indicando mais itens abaixo */}
                        <div
                          className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 rounded-b-lg transition-opacity duration-300"
                          style={{
                            background:
                              "linear-gradient(to bottom, transparent, rgba(239,68,68,0.25))",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Entrega */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        {deliveryType === "pickup" ? (
                          <Store className="h-5 w-5 text-blue-500" />
                        ) : deliveryType === "dine_in" ? (
                          <UtensilsCrossed className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Bike className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900">Entrega</h3>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="border-l-4 border-red-500 pl-3 py-1">
                        <p className="text-sm text-gray-800 font-medium">
                          {deliveryType === "pickup"
                            ? "Retirar no local"
                            : deliveryType === "dine_in"
                              ? "Consumir no local"
                              : "Entrega"}
                        </p>
                        {deliveryType === "delivery" &&
                          deliveryAddress.street && (
                            <p className="text-sm text-gray-500 mt-1">
                              {deliveryAddress.street}, {deliveryAddress.number}
                              {deliveryAddress.complement &&
                                ` - ${deliveryAddress.complement}`}
                              <br />
                              {deliveryAddress.neighborhood}
                              {deliveryAddress.reference && (
                                <>
                                  <br />
                                  Ref: {deliveryAddress.reference}
                                </>
                              )}
                            </p>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Pagamento */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                        {paymentMethod === "pix" ? (
                          <QrCode className="h-5 w-5 text-green-500" />
                        ) : paymentMethod === "cash" ? (
                          <Banknote className="h-5 w-5 text-green-500" />
                        ) : (
                          <CreditCard className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900">Pagamento</h3>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="border-l-4 border-red-500 pl-3 py-1">
                        <p className="text-sm text-gray-800 font-medium">
                          {paymentMethod === "cash"
                            ? "Dinheiro"
                            : paymentMethod === "card"
                              ? "Cartão"
                              : paymentMethod === "card_online"
                                ? "Cartão Online"
                                : "Pix"}
                        </p>
                        {paymentMethod === "card_online" && (establishment as any)?.paytimeCardFeePassthrough !== false && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            Inclui taxa de processamento de R$ 0,99
                          </p>
                        )}
                        {paymentMethod === "cash" && changeAmount && (
                          <p className="text-sm text-gray-500 mt-1">
                            Troco para: R$ {changeAmount}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                    {(() => {
                      const subtotal = cart.reduce((sum, item) => {
                        const complementsTotal = item.complements.reduce(
                          (cSum, c) =>
                            cSum + Number(c.price) * (c.quantity || 1),
                          0
                        );
                        return (
                          sum +
                          (Number(item.price) + complementsTotal) *
                            item.quantity
                        );
                      }, 0);
                      const discount = appliedCoupon?.discount || 0;
                      const deliveryFeeValue = getDeliveryFee(subtotal);
                      const cashbackDiscount = useCashbackInOrder
                        ? parseFloat(cashbackAmountToUse)
                        : 0;
                      const cardOnlineFee = (paymentMethod === "card_online" && (establishment as any)?.paytimeCardFeePassthrough !== false) ? 0.99 : 0;
                      const total = Math.max(
                        0,
                        subtotal -
                          discount +
                          deliveryFeeValue -
                          cashbackDiscount +
                          cardOnlineFee
                      );
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-600">
                              {formatPrice(subtotal)}
                            </span>
                          </div>
                          {deliveryType === "delivery" && (
                            <div className="flex justify-between text-sm items-center">
                              <span className="text-gray-600">
                                Taxa de entrega
                              </span>
                              {(establishment.deliveryFeeType ===
                                "byNeighborhood" &&
                                !selectedNeighborhood) ||
                              (establishment.deliveryFeeType === "byRadius" &&
                                !radiusFeeCalculated) ? (
                                <span className="text-gray-400 text-xs italic">
                                  {radiusFeeOutOfRange
                                    ? "Fora da área"
                                    : radiusFeeLoading
                                      ? "Calculando..."
                                      : "A calcular"}
                                </span>
                              ) : deliveryFeeValue === 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 font-bold rounded-lg text-xs">
                                  <svg
                                    className="w-3 h-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Grátis!
                                </span>
                              ) : (
                                <span className="text-gray-600">
                                  {formatPrice(deliveryFeeValue)}
                                </span>
                              )}
                            </div>
                          )}
                          {deliveryType === "pickup" && (
                            <div className="flex justify-between text-sm items-center">
                              <span className="text-gray-600">
                                Retirar no local
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 font-bold rounded-lg text-xs">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Grátis!
                              </span>
                            </div>
                          )}
                          {deliveryType === "dine_in" && (
                            <div className="flex justify-between text-sm items-center">
                              <span className="text-gray-600">
                                Consumir no local
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 font-bold rounded-lg text-xs">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Grátis!
                              </span>
                            </div>
                          )}
                          {appliedCoupon && (
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600 flex items-center gap-1">
                                <Ticket className="h-3.5 w-3.5" />
                                Cupom {appliedCoupon.code}
                              </span>
                              <span className="text-green-600">
                                -{formatPrice(discount)}
                              </span>
                            </div>
                          )}
                          {useCashbackInOrder && cashbackDiscount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-600 flex items-center gap-1">
                                <Wallet className="h-3.5 w-3.5" />
                                Cashback
                              </span>
                              <span className="text-blue-600">
                                -{formatPrice(cashbackDiscount)}
                              </span>
                            </div>
                          )}
                          {cardOnlineFee > 0 && (
                            <div className="flex justify-between text-sm items-center">
                              <span className="text-amber-600 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                                Taxa cartão online
                              </span>
                              <span className="text-amber-600">{formatPrice(cardOnlineFee)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-lg pt-2">
                            <span className="text-gray-900">Total</span>
                            <span className="text-red-500">
                              {formatPrice(total)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCheckoutStep(1)}
                      className="flex items-center justify-center py-3.5 border-2 border-red-500 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      style={{ width: "15%", minWidth: "48px" }}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {!isLitePlan && schedulingConfig?.schedulingEnabled && (
                      <button
                        onClick={() => {
                          setIsScheduling(true);
                          setCheckoutStep(3); // Vai para o step de agendamento
                        }}
                        className="flex items-center justify-center gap-1 py-3.5 px-2 bg-white border-2 border-red-500 text-red-500 hover:bg-red-50 font-semibold rounded-xl transition-colors"
                        style={{ width: "15%", minWidth: "48px" }}
                        title="Agendar pedido"
                      >
                        <CalendarClock className="h-5 w-5 flex-shrink-0" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (isLitePlan) {
                          setCheckoutStep(3); // Lite: step 3 = Dados
                        } else {
                          setIsScheduling(false);
                          setScheduledDate("");
                          setScheduledTime("");
                          setCheckoutStep(3); // Vai para Dados (step 3 sem agendamento)
                        }
                      }}
                      className="flex-1 py-3.5 bg-red-500 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal 3 - Agendamento (só aparece quando isScheduling) */}
            {isScheduling && checkoutStep === 3 && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6 bg-white">
                  {/* Seletor de Data */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <CalendarClock className="h-5 w-5 text-red-500" />
                      Escolha a data
                    </h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                      {(() => {
                        const days: {
                          date: string;
                          dayName: string;
                          dayNum: string;
                          monthName: string;
                        }[] = [];
                        const maxDays =
                          schedulingConfig?.schedulingMaxDays || 7;
                        const minAdvanceMin =
                          schedulingConfig?.schedulingMinAdvance || 60;
                        const now = new Date();
                        const weekDays = [
                          "Dom",
                          "Seg",
                          "Ter",
                          "Qua",
                          "Qui",
                          "Sex",
                          "Sáb",
                        ];
                        const months = [
                          "Jan",
                          "Fev",
                          "Mar",
                          "Abr",
                          "Mai",
                          "Jun",
                          "Jul",
                          "Ago",
                          "Set",
                          "Out",
                          "Nov",
                          "Dez",
                        ];

                        for (let i = 0; i <= maxDays; i++) {
                          const d = new Date(now);
                          d.setDate(d.getDate() + i);
                          const dayOfWeek = d.getDay(); // 0=Dom, 6=Sab

                          // Verificar se o dia tem horário de funcionamento
                          const bh = schedulingBusinessHours?.find(
                            (h: any) => h.dayOfWeek === dayOfWeek
                          );
                          if (!bh || !bh.isActive) continue;

                          // Para hoje, verificar se ainda há horários disponíveis
                          if (i === 0) {
                            const closeTime = bh.closeTime
                              ?.split(":")
                              .map(Number) || [22, 0];
                            const closeDate = new Date(now);
                            closeDate.setHours(
                              closeTime[0],
                              closeTime[1],
                              0,
                              0
                            );
                            const minTime = new Date(
                              now.getTime() + minAdvanceMin * 60000
                            );
                            if (minTime >= closeDate) continue; // Hoje já não tem horário
                          }

                          const yyyy = d.getFullYear();
                          const mm = String(d.getMonth() + 1).padStart(2, "0");
                          const dd = String(d.getDate()).padStart(2, "0");
                          days.push({
                            date: `${yyyy}-${mm}-${dd}`,
                            dayName:
                              i === 0
                                ? "Hoje"
                                : i === 1
                                  ? "Amanhã"
                                  : weekDays[dayOfWeek],
                            dayNum: String(d.getDate()),
                            monthName: months[d.getMonth()],
                          });
                        }

                        if (days.length === 0) {
                          return (
                            <p className="text-sm text-gray-500">
                              Nenhum dia disponível para agendamento.
                            </p>
                          );
                        }

                        return days.map(day => (
                          <button
                            key={day.date}
                            onClick={() => {
                              setScheduledDate(day.date);
                              setScheduledTime("");
                            }}
                            className={`flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[80px] rounded-xl border-2 transition-colors ${
                              scheduledDate === day.date
                                ? "border-red-500 bg-red-50 text-red-500"
                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            <span className="text-[10px] font-medium uppercase">
                              {day.dayName}
                            </span>
                            <span className="text-xl font-bold">
                              {day.dayNum}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {day.monthName}
                            </span>
                          </button>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Seletor de Horário */}
                  {scheduledDate && (
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-red-500" />
                        Escolha o horário
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        {(() => {
                          const now = new Date();
                          const interval =
                            schedulingConfig?.schedulingInterval || 30;
                          const minAdvanceMin =
                            schedulingConfig?.schedulingMinAdvance || 60;
                          const selectedDayOfWeek = new Date(
                            scheduledDate + "T12:00:00"
                          ).getDay();
                          const bh = schedulingBusinessHours?.find(
                            (h: any) => h.dayOfWeek === selectedDayOfWeek
                          );

                          if (
                            !bh ||
                            !bh.isActive ||
                            !bh.openTime ||
                            !bh.closeTime
                          ) {
                            return (
                              <p className="text-sm text-gray-500 col-span-4">
                                Sem horários disponíveis.
                              </p>
                            );
                          }

                          const [openH, openM] = bh.openTime
                            .split(":")
                            .map(Number);
                          const [closeH, closeM] = bh.closeTime
                            .split(":")
                            .map(Number);
                          const slots: string[] = [];
                          let h = openH,
                            m = openM;

                          while (h < closeH || (h === closeH && m <= closeM)) {
                            const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

                            // Para hoje, não permitir horários passados + antecedência mínima
                            const isToday =
                              scheduledDate ===
                              `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                            if (isToday) {
                              const slotTime = new Date(now);
                              slotTime.setHours(h, m, 0, 0);
                              const minTime = new Date(
                                now.getTime() + minAdvanceMin * 60000
                              );
                              if (slotTime < minTime) {
                                m += interval;
                                if (m >= 60) {
                                  h += Math.floor(m / 60);
                                  m = m % 60;
                                }
                                continue;
                              }
                            }

                            slots.push(timeStr);
                            m += interval;
                            if (m >= 60) {
                              h += Math.floor(m / 60);
                              m = m % 60;
                            }
                          }

                          if (slots.length === 0) {
                            return (
                              <p className="text-sm text-gray-500 col-span-4">
                                Nenhum horário disponível para esta data.
                              </p>
                            );
                          }

                          return slots.map(slot => (
                            <button
                              key={slot}
                              onClick={() => setScheduledTime(slot)}
                              className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-colors ${
                                scheduledTime === slot
                                  ? "border-red-500 bg-red-50 text-red-500"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                              }`}
                            >
                              {slot}
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Resumo do agendamento selecionado */}
                  {scheduledDate && scheduledTime && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <CalendarClock className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-red-500">
                            Pedido agendado para:
                          </p>
                          <p className="text-base font-bold text-red-500">
                            {(() => {
                              const [y, mo, d] = scheduledDate.split("-");
                              return `${d}/${mo} às ${scheduledTime}`;
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCheckoutStep(2)}
                      className="flex items-center justify-center py-3.5 border-2 border-red-500 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      style={{ width: "15%", minWidth: "48px" }}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCheckoutStep(4)}
                      disabled={!scheduledDate || !scheduledTime}
                      className={`flex-1 py-3.5 font-semibold rounded-xl transition-colors ${
                        scheduledDate && scheduledTime
                          ? "bg-red-500 hover:bg-red-500 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal 3/4 - Identificação do Cliente (step 3 no Lite) */}
            {((isLitePlan && checkoutStep === 3) ||
              (!isLitePlan && !isScheduling && checkoutStep === 3) ||
              (!isLitePlan && isScheduling && checkoutStep === 4)) && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4 bg-white">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={e =>
                        setCustomerInfo({
                          ...customerInfo,
                          name: e.target.value,
                        })
                      }
                      placeholder="Digite seu nome"
                      maxLength={15}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                    <div className="flex justify-end mt-1">
                      <span
                        className={`text-xs ${15 - customerInfo.name.length <= 0 ? "text-red-500 font-medium" : "text-gray-400"}`}
                      >
                        {15 - customerInfo.name.length} restantes
                      </span>
                    </div>
                  </div>
                  {!isLitePlan && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      <input
                        type="text"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={16}
                        value={(() => {
                          // Formatar para exibição: (DDD) 9 9999-9999
                          const digits = customerInfo.phone.replace(/\D/g, "");
                          if (digits.length === 0) return "";
                          if (digits.length <= 2) return `(${digits}`;
                          if (digits.length <= 3)
                            return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                          if (digits.length <= 7)
                            return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
                          if (digits.length <= 11)
                            return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
                          return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
                        })()}
                        onChange={e => {
                          // Extrair apenas números e limitar a 11 dígitos (DDD + 9 dígitos)
                          const digits = e.target.value.replace(/\D/g, "");
                          if (digits.length <= 11) {
                            setCustomerInfo({ ...customerInfo, phone: digits });
                          }
                        }}
                        placeholder="(62) 9 8765-4321"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                      {customerInfo.phone.replace(/\D/g, "").length > 0 &&
                        customerInfo.phone.replace(/\D/g, "").length < 11 && (
                          <p className="text-xs text-red-500 mt-1">
                            Preencha o telefone completo com DDD
                          </p>
                        )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCheckoutStep(isLitePlan ? 2 : isScheduling ? 3 : 2)
                      }
                      className="flex items-center justify-center py-3.5 border-2 border-red-500 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      style={{ width: "15%", minWidth: "48px" }}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        // Reset all order states before entering confirmation step
                        setOrderSent(false);
                        setOrderError(null);
                        setPixOnlineStatus("idle");
                        setPixOnlineEmv(null);
                        setPixOnlineTransactionId(null);
                        setPixOnlineOrderId(null);
                        setCardPaymentStatus("idle");
                        setCardPaymentOrderId(null);
                        setCardPaymentTransactionId(null);
                        setCardAntifraudId(null);
                        setCardAntifraudSession(null);
                        setCreatedOrderNumber(null);
                        setIsSendingOrder(false);
                        setCheckoutStep(isLitePlan ? 4 : isScheduling ? 5 : 4);
                      }}
                      disabled={
                        isLitePlan
                          ? !customerInfo.name
                          : !customerInfo.name ||
                            customerInfo.phone.replace(/\D/g, "").length < 11
                      }
                      className={`flex-1 py-3.5 font-semibold rounded-xl transition-colors ${
                        (
                          isLitePlan
                            ? customerInfo.name
                            : customerInfo.name &&
                              customerInfo.phone.replace(/\D/g, "").length >= 11
                        )
                          ? "bg-red-500 hover:bg-red-500 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal 4/5 - Confirmação Final (step 4 no Lite) */}
            {((isLitePlan && checkoutStep === 4) ||
              (!isLitePlan && !isScheduling && checkoutStep === 4) ||
              (!isLitePlan && isScheduling && checkoutStep === 5)) && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Body */}
                <div
                  className={`overflow-y-auto overscroll-contain p-6 ${!orderSent && cardPaymentStatus === "idle" ? "flex-1" : ""} ${cardPaymentStatus === "filling" || cardPaymentStatus === "antifraud" ? "flex-1" : ""}`}
                >
                  {orderError &&
                  cardPaymentStatus !== "failed" &&
                  cardPaymentStatus !== "filling" ? (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="h-10 w-10 text-red-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-red-500 mb-4">
                        Não foi possível enviar o pedido
                      </h3>
                      <p className="text-gray-600">{orderError}</p>
                    </div>
                  ) : pixOnlineStatus === "waiting" ? (
                    /* Estado: Aguardando pagamento PIX Online */
                    <div className="text-center py-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <QrCode className="h-6 w-6 text-green-600 flex-shrink-0" />
                        Escaneie o QR Code para pagar
                      </h3>
                      <p className="text-gray-500 text-sm mb-4">
                        Abra o app do seu banco e escaneie o código abaixo.
                      </p>
                      {pixOnlineEmv && (
                        <div className="flex flex-col items-center gap-4">
                          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixOnlineEmv)}`}
                              alt="QR Code PIX"
                              className="w-[220px] h-[220px]"
                            />
                          </div>
                          <div className="w-full">
                            <p className="text-xs text-gray-400 mb-2">
                              Ou copie o código PIX:
                            </p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-xs text-gray-600 border border-gray-200 break-all max-h-16 overflow-y-auto">
                                {pixOnlineEmv}
                              </code>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(pixOnlineEmv);
                                  setPixCodeCopied(true);
                                  if (navigator.vibrate) navigator.vibrate(50);
                                  setTimeout(
                                    () => setPixCodeCopied(false),
                                    2000
                                  );
                                }}
                                className={`flex-shrink-0 p-2 text-white rounded-lg transition-colors ${
                                  pixCodeCopied
                                    ? "bg-green-500"
                                    : "bg-primary hover:bg-primary/90"
                                }`}
                              >
                                {pixCodeCopied ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <svg
                              className="animate-spin h-4 w-4 text-green-500"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Aguardando confirmação do pagamento...
                          </div>
                        </div>
                      )}
                    </div>
                  ) : pixOnlineStatus === "expired" ? (
                    /* Estado: PIX Online expirado */
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="h-10 w-10 text-amber-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-amber-600 mb-2">
                        PIX expirado
                      </h3>
                      <p className="text-gray-500 text-sm mb-6">
                        O tempo para pagamento via PIX expirou. Você pode tentar
                        novamente.
                      </p>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => {
                            setPixOnlineStatus("idle");
                            setPixOnlineEmv(null);
                            setPixOnlineTransactionId(null);
                            setPixOnlineOrderId(null);
                          }}
                          className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <QrCode className="h-5 w-5" />
                          Tentar novamente
                        </button>
                        <button
                          onClick={() => {
                            setPixOnlineStatus("idle");
                            setPixOnlineEmv(null);
                            setPixOnlineTransactionId(null);
                            setPixOnlineOrderId(null);
                            setCheckoutStep(1);
                          }}
                          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                        >
                          Alterar forma de pagamento
                        </button>
                      </div>
                    </div>
                  ) : cardPaymentStatus === "filling" ? (
                    /* Estado: Formulário de cartão Paytime */
                    <div className="py-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            Dados do Cartão
                          </h3>
                          <p className="text-xs text-gray-500">
                            Pagamento seguro - seus dados não são armazenados
                          </p>
                        </div>
                        {import.meta.env.DEV && (
                          <button
                            type="button"
                            onClick={() => {
                              setCardFormData({
                                holderName: "TESTE SILVA",
                                holderDocument: "12345678909",
                                cardNumber: "5200000000001005",
                                expirationMonth: "12",
                                expirationYear: "2026",
                                securityCode: "123",
                                firstName: "Teste",
                                lastName: "Silva",
                                document: "12345678909",
                                phone: "11999999999",
                                email: "teste@teste.com",
                                street: "Rua Teste",
                                number: "100",
                                complement: "Apto 1",
                                neighborhood: "Centro",
                                city: "São Paulo",
                                state: "SP",
                                zipCode: "01001000",
                              });
                              setCardFormErrors({});
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition-colors whitespace-nowrap"
                            title="Preencher com dados de teste Paytime"
                          >
                            <svg
                              className="h-3 w-3"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M15 4V2" />
                              <path d="M15 16v-2" />
                              <path d="M8 9h2" />
                              <path d="M20 9h2" />
                              <path d="M17.8 11.8 19 13" />
                              <path d="M15 9h.01" />
                              <path d="M17.8 6.2 19 5" />
                              <path d="m3 21 9-9" />
                              <path d="M12.2 6.2 11 5" />
                            </svg>
                            Auto
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {/* Número do Cartão */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Número do Cartão
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={19}
                            value={cardFormData.cardNumber.replace(
                              /(\d{4})(?=\d)/g,
                              "$1 "
                            )}
                            onChange={e => {
                              const digits = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 16);
                              setCardFormData(prev => ({
                                ...prev,
                                cardNumber: digits,
                              }));
                              setCardFormErrors(prev => ({
                                ...prev,
                                cardNumber: "",
                              }));
                            }}
                            placeholder="0000 0000 0000 0000"
                            className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${cardFormErrors.cardNumber ? "border-red-300" : "border-gray-200"}`}
                          />
                          {cardFormErrors.cardNumber && (
                            <p className="text-xs text-red-500 mt-1">
                              {cardFormErrors.cardNumber}
                            </p>
                          )}
                        </div>

                        {/* Nome do Titular */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Nome no Cartão
                          </label>
                          <input
                            type="text"
                            value={cardFormData.holderName}
                            onChange={e => {
                              setCardFormData(prev => ({
                                ...prev,
                                holderName: e.target.value.toUpperCase(),
                              }));
                              setCardFormErrors(prev => ({
                                ...prev,
                                holderName: "",
                              }));
                            }}
                            placeholder="NOME COMO NO CARTÃO"
                            className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${cardFormErrors.holderName ? "border-red-300" : "border-gray-200"}`}
                          />
                          {cardFormErrors.holderName && (
                            <p className="text-xs text-red-500 mt-1">
                              {cardFormErrors.holderName}
                            </p>
                          )}
                        </div>

                        {/* Validade e CVV */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Mês
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={2}
                              value={cardFormData.expirationMonth}
                              onChange={e => {
                                const v = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 2);
                                setCardFormData(prev => ({
                                  ...prev,
                                  expirationMonth: v,
                                }));
                                setCardFormErrors(prev => ({
                                  ...prev,
                                  expiration: "",
                                }));
                              }}
                              placeholder="MM"
                              className={`w-full px-3 py-2.5 border rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${cardFormErrors.expiration ? "border-red-300" : "border-gray-200"}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Ano
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={4}
                              value={cardFormData.expirationYear}
                              onChange={e => {
                                const v = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 4);
                                setCardFormData(prev => ({
                                  ...prev,
                                  expirationYear: v,
                                }));
                                setCardFormErrors(prev => ({
                                  ...prev,
                                  expiration: "",
                                }));
                              }}
                              placeholder="AAAA"
                              className={`w-full px-3 py-2.5 border rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${cardFormErrors.expiration ? "border-red-300" : "border-gray-200"}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              CVV
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={4}
                              value={cardFormData.securityCode}
                              onChange={e => {
                                const v = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 4);
                                setCardFormData(prev => ({
                                  ...prev,
                                  securityCode: v,
                                }));
                                setCardFormErrors(prev => ({
                                  ...prev,
                                  securityCode: "",
                                }));
                              }}
                              placeholder="123"
                              className={`w-full px-3 py-2.5 border rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${cardFormErrors.securityCode ? "border-red-300" : "border-gray-200"}`}
                            />
                          </div>
                          {cardFormErrors.expiration && (
                            <p className="text-xs text-red-500 col-span-3">
                              {cardFormErrors.expiration}
                            </p>
                          )}
                          {cardFormErrors.securityCode && (
                            <p className="text-xs text-red-500 col-span-3">
                              {cardFormErrors.securityCode}
                            </p>
                          )}
                        </div>

                        {/* CPF do Titular */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            CPF do Titular
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={14}
                            value={(() => {
                              const d = cardFormData.holderDocument.replace(
                                /\D/g,
                                ""
                              );
                              if (d.length <= 3) return d;
                              if (d.length <= 6)
                                return `${d.slice(0, 3)}.${d.slice(3)}`;
                              if (d.length <= 9)
                                return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
                              return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
                            })()}
                            onChange={e => {
                              const digits = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 11);
                              setCardFormData(prev => ({
                                ...prev,
                                holderDocument: digits,
                                document: digits,
                              }));
                              setCardFormErrors(prev => ({
                                ...prev,
                                holderDocument: "",
                              }));
                            }}
                            placeholder="000.000.000-00"
                            className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${cardFormErrors.holderDocument ? "border-red-300" : "border-gray-200"}`}
                          />
                          {cardFormErrors.holderDocument && (
                            <p className="text-xs text-red-500 mt-1">
                              {cardFormErrors.holderDocument}
                            </p>
                          )}
                        </div>

                        {/* E-mail removido - não necessário para pagamento */}

                        {/* Endereço de cobrança removido - enviado automaticamente com valores fixos no payload 3DS */}

                        {/* Parcelas - fixo à vista */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Parcelas
                          </label>
                          <div className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700">
                            1x (À vista)
                          </div>
                        </div>

                        {/* Botão Pagar */}
                        <button
                          onClick={() => {
                            // Validar formulário
                            const errors: Record<string, string> = {};
                            if (
                              !cardFormData.cardNumber ||
                              cardFormData.cardNumber.length < 13
                            )
                              errors.cardNumber = "Número do cartão inválido";
                            if (
                              !cardFormData.holderName ||
                              cardFormData.holderName.length < 3
                            )
                              errors.holderName =
                                "Nome do titular é obrigatório";
                            const month = parseInt(
                              cardFormData.expirationMonth
                            );
                            const year = parseInt(cardFormData.expirationYear);
                            if (
                              !month ||
                              month < 1 ||
                              month > 12 ||
                              !year ||
                              year < 2024
                            )
                              errors.expiration = "Data de validade inválida";
                            if (
                              !cardFormData.securityCode ||
                              cardFormData.securityCode.length < 3
                            )
                              errors.securityCode = "CVV inválido";
                            if (
                              !cardFormData.holderDocument ||
                              cardFormData.holderDocument.length < 11
                            )
                              errors.holderDocument = "CPF inválido";
                            // Endereço removido - valores fixos enviados automaticamente

                            if (Object.keys(errors).length > 0) {
                              setCardFormErrors(errors);
                              return;
                            }

                            setCardPaymentStatus("processing");

                            // Separar nome em primeiro e último
                            const nameParts = cardFormData.holderName
                              .trim()
                              .split(/\s+/);
                            const firstName = nameParts[0] || "";
                            const lastName = nameParts.slice(1).join(" ") || "";

                            createCardPaymentMutation.mutate({
                              orderId: cardPaymentOrderId!,
                              establishmentId: establishment.id,
                              card: {
                                holderName: cardFormData.holderName,
                                holderDocument: cardFormData.holderDocument,
                                cardNumber: cardFormData.cardNumber,
                                expirationMonth: parseInt(
                                  cardFormData.expirationMonth
                                ),
                                expirationYear: parseInt(
                                  cardFormData.expirationYear
                                ),
                                securityCode: cardFormData.securityCode,
                              },
                              customer: {
                                firstName,
                                lastName,
                                document: cardFormData.holderDocument,
                                phone: customerInfo.phone,
                                email: cardFormData.email || undefined,
                                address: {
                                  street: "Rua Teste",
                                  number: "100",
                                  complement: "Apto 1",
                                  neighborhood: "Centro",
                                  city: "Sao Paulo",
                                  state: "SP",
                                  zipCode: "01001000",
                                },
                              },
                              installments,
                            });
                          }}
                          disabled={createCardPaymentMutation.isPending}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {createCardPaymentMutation.isPending ? (
                            <>
                              <svg
                                className="animate-spin h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Processando...
                            </>
                          ) : (
                            <>
                              <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              </svg>
                              Pagar com Cartão
                            </>
                          )}
                        </button>

                        <p className="text-xs text-gray-400 text-center">
                          <svg
                            className="inline h-3 w-3 mr-1"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          Seus dados são criptografados e processados de forma
                          segura
                        </p>
                      </div>
                    </div>
                  ) : cardPaymentStatus === "processing" ? (
                    /* Estado: Processando pagamento com cartão */
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg
                          className="animate-spin h-10 w-10 text-blue-500"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Processando pagamento
                      </h3>
                      <p className="text-gray-500 text-sm mb-4">
                        Aguarde enquanto verificamos seu pagamento com cartão...
                      </p>
                    </div>
                  ) : cardPaymentStatus === "antifraud" ? (
                    /* Estado: Autenticação 3DS em andamento (automática via SDK PagSeguro) */
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg
                          className="animate-spin h-10 w-10 text-blue-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Verificando segurança
                      </h3>
                      <p className="text-gray-500 text-sm mb-4">
                        Aguarde enquanto verificamos a segurança do seu
                        cartão...
                      </p>
                      <p className="text-gray-400 text-xs">
                        Uma janela de confirmação do seu banco pode aparecer.
                        Complete a verificação para finalizar o pagamento.
                      </p>
                    </div>
                  ) : cardPaymentStatus === "failed" ? (
                    /* Estado: Pagamento com cartão falhou */
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="h-10 w-10 text-red-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-red-500 mb-2">
                        Pagamento não aprovado
                      </h3>
                      <p className="text-gray-500 text-sm mb-6">
                        {orderError ||
                          "Não foi possível processar o pagamento. Verifique os dados do cartão e tente novamente."}
                      </p>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => {
                            setCardPaymentStatus("filling");
                            setOrderError(null);
                          }}
                          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <CreditCard className="h-5 w-5" />
                          Tentar novamente
                        </button>
                        <button
                          onClick={() => {
                            setCardPaymentStatus("idle");
                            setCardPaymentOrderId(null);
                            setCardPaymentTransactionId(null);
                            setOrderError(null);
                            setCheckoutStep(1);
                          }}
                          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                        >
                          Alterar forma de pagamento
                        </button>
                      </div>
                    </div>
                  ) : whatsAppConfirmationPending && isLitePlan ? (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageCircle className="h-10 w-10 text-green-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        Você enviou o pedido no WhatsApp?
                      </h3>
                      <p className="text-gray-500 text-sm max-w-sm mx-auto">
                        Confirme se a mensagem foi realmente enviada para o WhatsApp do restaurante. Assim o estabelecimento poderá receber e preparar seu pedido.
                      </p>
                    </div>
                  ) : !orderSent ? (
                    <div className="text-center py-8">
                      {isSendingOrder ? (
                        /* Estado: Enviando pedido / Processando pagamento online */
                        <>
                          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg
                              className="animate-spin h-10 w-10 text-green-500"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            {paymentMethod === "pix_online" ||
                            paymentMethod === "card_online"
                              ? "Processando pagamento..."
                              : "Enviando pedido..."}
                          </h3>
                          <p className="text-gray-500 text-sm">
                            {paymentMethod === "pix_online" ||
                            paymentMethod === "card_online"
                              ? "Aguarde enquanto geramos o código de pagamento."
                              : "Aguarde enquanto enviamos seu pedido ao restaurante."}
                          </p>
                        </>
                      ) : (
                        /* Estado: Quase lá - pedido pronto para envio */
                        <>
                          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="h-10 w-10 text-green-500" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            Quase lá, {customerInfo.name.split(" ")[0]}!
                          </h3>
                          <p className="text-gray-500 text-sm">
                            Após o envio, o restaurante irá confirmar seu
                            pedido. Você será notificado em seguida.
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-green-600 mb-2">
                        {isScheduling
                          ? "Pedido agendado com sucesso!"
                          : pixOnlineStatus === "confirmed" ||
                              cardPaymentStatus === "confirmed"
                            ? "Pagamento confirmado!"
                            : "Pedido enviado com sucesso!"}
                      </h3>
                      {(createdOrderNumber || selectedOrderId) && (
                        <p className="text-xl font-semibold text-gray-800 mb-4">
                          Número do pedido:{" "}
                          <span className="text-primary">
                            {createdOrderNumber || selectedOrderId}
                          </span>
                        </p>
                      )}
                      {isScheduling && scheduledDate && scheduledTime && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 inline-flex items-center gap-2">
                          <CalendarClock className="h-5 w-5 text-red-500" />
                          <span className="text-sm font-semibold text-red-500">
                            Agendado para{" "}
                            {scheduledDate
                              .split("-")
                              .reverse()
                              .slice(0, 2)
                              .join("/")}{" "}
                            às {scheduledTime}
                          </span>
                        </div>
                      )}
                      <p className="text-gray-600">
                        {isLitePlan
                          ? "Seu pedido foi enviado via WhatsApp. O restaurante irá responder em breve."
                          : isScheduling
                            ? "Seu pedido foi agendado e será preparado no horário escolhido."
                            : pixOnlineStatus === "confirmed"
                              ? "Pagamento PIX confirmado! Seu pedido foi enviado ao restaurante."
                              : cardPaymentStatus === "confirmed"
                                ? "Pagamento com cartão confirmado! Seu pedido foi enviado ao restaurante."
                                : "Seu pedido foi recebido e está sendo processado."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {orderSent ? (
                  <div className="flex-shrink-0 border-t px-6 py-4 relative">
                    <button
                      onClick={() => {
                        setCheckoutStep(0);
                        if (!isLitePlan) setShowTrackingModal(true);
                        // Reset all order states
                        setOrderSent(false);
                        setOrderError(null);
                        setPixOnlineStatus("idle");
                        setPixOnlineEmv(null);
                        setPixOnlineTransactionId(null);
                        setPixOnlineOrderId(null);
                        setCardPaymentStatus("idle");
                        setCardPaymentOrderId(null);
                        setCardPaymentTransactionId(null);
                        setCardAntifraudId(null);
                        setCardAntifraudSession(null);
                        setCreatedOrderNumber(null);
                        setIsSendingOrder(false);
                        setWhatsAppConfirmationPending(false);
                        setPendingWhatsAppOrderUrl(null);

                        // Verificar se deve mostrar o spotlight do menu (primeiro pedido)
                        const estId = data?.establishment?.id;
                        if (estId) {
                          const pendingKey = `menu_spotlight_pending_${estId}`;
                          if (localStorage.getItem(pendingKey)) {
                            localStorage.removeItem(pendingKey);
                            // Mostrar spotlight com delay para o tracking modal abrir primeiro
                            setTimeout(() => {
                              setShowTrackingModal(false);
                              setTimeout(() => setShowMenuSpotlight(true), 300);
                            }, 2000);
                          }
                        }
                      }}
                      className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl transition-colors hover:bg-primary/90 flex items-center justify-center gap-2"
                    >
                      {isLitePlan ? (
                        <>
                          <ChevronLeft className="h-5 w-5" />
                          Voltar ao cardápio
                        </>
                      ) : (
                        <>
                          <Package className="h-5 w-5" />
                          Acompanhar pedido
                        </>
                      )}
                    </button>
                  </div>
                ) : whatsAppConfirmationPending && isLitePlan ? (
                  <div className="flex-shrink-0 border-t px-6 py-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={retryWhatsAppOrderSend}
                        className="py-3.5 border-2 border-red-500 text-red-500 hover:bg-red-50 font-semibold rounded-xl transition-colors"
                      >
                        Não
                      </button>
                      <button
                        onClick={confirmWhatsAppOrderSent}
                        className="py-3.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors"
                      >
                        Sim
                      </button>
                    </div>
                  </div>
                ) : pixOnlineStatus === "waiting" ? (
                  <div className="flex-shrink-0 border-t px-6 py-4">
                    <button
                      onClick={() => {
                        setPixOnlineStatus("idle");
                        setPixOnlineEmv(null);
                        setPixOnlineTransactionId(null);
                        setPixOnlineOrderId(null);
                        setCheckoutStep(1);
                      }}
                      className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                    >
                      Alterar forma de pagamento
                    </button>
                  </div>
                ) : pixOnlineStatus ===
                  "expired" ? null /* PIX expirado - botões estão no body */ : cardPaymentStatus ===
                    "filling" ||
                  cardPaymentStatus === "processing" ||
                  cardPaymentStatus === "antifraud" ||
                  cardPaymentStatus ===
                    "failed" ? null /* Formulário de cartão / estados de cartão estão no body */ : (
                  <div className="flex-shrink-0 border-t px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setWhatsAppConfirmationPending(false);
                          setPendingWhatsAppOrderUrl(null);
                          setCheckoutStep(isLitePlan ? 3 : isScheduling ? 4 : 3);
                        }}
                        className="flex items-center justify-center py-3.5 border-2 border-red-500 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        style={{ width: "15%", minWidth: "48px" }}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (isSendingOrder || !establishment) return;

                          // Plano Lite: registrar pedido no banco + enviar via WhatsApp
                          if (isLitePlan) {
                            if (pendingWhatsAppOrderUrl) {
                              window.open(pendingWhatsAppOrderUrl, "_blank");
                              setWhatsAppConfirmationPending(true);
                              return;
                            }

                            const whatsappNumber =
                              establishment.whatsapp?.replace(/\D/g, "") || "";
                            if (!whatsappNumber) {
                              setOrderError(
                                "N\u00famero de WhatsApp do restaurante n\u00e3o configurado."
                              );
                              return;
                            }

                            // Calcular valores do pedido
                            const liteSubtotal = cart.reduce((sum, item) => {
                              const itemTotal =
                                parseFloat(item.price) * item.quantity;
                              const complementsTotal =
                                item.complements.reduce(
                                  (s, c) =>
                                    s + parseFloat(c.price) * (c.quantity || 1),
                                  0
                                ) * item.quantity;
                              return sum + itemTotal + complementsTotal;
                            }, 0);
                            const liteDiscount = appliedCoupon?.discount || 0;
                            const liteDeliveryFee =
                              deliveryType === "delivery"
                                ? getDeliveryFee(liteSubtotal)
                                : 0;
                            const liteTotal = Math.max(
                              0,
                              liteSubtotal - liteDiscount + liteDeliveryFee
                            );
                            const liteFullAddress =
                              deliveryType === "delivery"
                                ? `${deliveryAddress.street}, ${deliveryAddress.number}${deliveryAddress.complement ? ` - ${deliveryAddress.complement}` : ""}, ${deliveryAddress.neighborhood}${deliveryAddress.reference ? ` (Ref: ${deliveryAddress.reference})` : ""}`
                                : undefined;
                            const liteOrderItems = cart.map(item => ({
                              productId: item.productId,
                              productName: item.name,
                              quantity: item.quantity,
                              unitPrice: item.price,
                              totalPrice: (
                                (parseFloat(item.price) +
                                  item.complements.reduce(
                                    (s, c) =>
                                      s +
                                      parseFloat(c.price) * (c.quantity || 1),
                                    0
                                  )) *
                                item.quantity
                              ).toFixed(2),
                              complements: item.complements.map(c => ({
                                name: c.name,
                                price: c.isIncluded || c.groupType === "included" ? 0 : parseFloat(c.price),
                                quantity: c.quantity || 1,
                                isIncluded: c.isIncluded || c.groupType === "included" || undefined,
                                groupType: c.groupType,
                              })),
                              notes: item.observation || undefined,
                            }));

                            setIsSendingOrder(true);

                            // Registrar pedido no banco com status completed
                            createOrderMutation.mutate(
                              {
                                establishmentId: establishment.id,
                                customerName: customerInfo.name,
                                customerPhone: customerInfo.phone || "",
                                customerAddress: liteFullAddress,
                                customerLat: deliveryAddress.lat || undefined,
                                customerLng: deliveryAddress.lng || undefined,
                                deliveryType,
                                paymentMethod: paymentMethod || "cash",
                                subtotal: liteSubtotal.toFixed(2),
                                deliveryFee: liteDeliveryFee.toFixed(2),
                                discount: liteDiscount.toFixed(2),
                                total: liteTotal.toFixed(2),
                                notes: orderObservation || undefined,
                                changeAmount:
                                  paymentMethod === "cash" && changeAmount
                                    ? changeAmount
                                        .replace(/\./g, "")
                                        .replace(",", ".")
                                    : undefined,
                                couponCode: appliedCoupon?.code || undefined,
                                couponId: appliedCoupon?.id || undefined,
                                loyaltyCardId:
                                  appliedCoupon?.loyaltyCardId || undefined,
                                isWhatsappLite: true,
                                items: liteOrderItems,
                              },
                              {
                                onSuccess: result => {
                                  // Pedido salvo no banco — agora abrir WhatsApp com link de recibo imprimível quando disponível
                                  const receiptUrl = (result as { receiptUrl?: string } | undefined)?.receiptUrl;
                                  const message = buildWhatsAppMessage(receiptUrl);
                                  const whatsAppUrl = buildWhatsAppUrl(whatsappNumber, message);
                                  window.open(whatsAppUrl, "_blank");
                                  askWhatsAppSendConfirmation(whatsAppUrl);
                                },
                                onError: error => {
                                  console.error(
                                    "[Lite] Erro ao registrar pedido:",
                                    error
                                  );
                                  // Mesmo com erro no banco, abrir WhatsApp para não bloquear o cliente
                                  const message = buildWhatsAppMessage();
                                  const whatsAppUrl = buildWhatsAppUrl(whatsappNumber, message);
                                  window.open(whatsAppUrl, "_blank");
                                  askWhatsAppSendConfirmation(whatsAppUrl);
                                },
                              }
                            );
                            return;
                          }

                          if (!isOpen) return;

                          // Validar valor do troco antes de enviar
                          if (paymentMethod === "cash" && changeAmount) {
                            const changeValue = parseFloat(
                              changeAmount.replace(/\./g, "").replace(",", ".")
                            );
                            const orderTotal =
                              cart.reduce((sum, item) => {
                                const itemTotal =
                                  parseFloat(item.price) * item.quantity;
                                const complementsTotal =
                                  item.complements.reduce(
                                    (s, c) =>
                                      s +
                                      parseFloat(c.price) * (c.quantity || 1),
                                    0
                                  ) * item.quantity;
                                return sum + itemTotal + complementsTotal;
                              }, 0) - (appliedCoupon?.discount || 0);

                            if (changeValue <= orderTotal) {
                              setChangeAmountError(
                                "O valor do troco deve ser maior que o total do pedido (R$ " +
                                  orderTotal.toFixed(2).replace(".", ",") +
                                  ")"
                              );
                              return;
                            }
                          }

                          setIsSendingOrder(true);
                          {
                            // Calcular totais
                            const subtotal = cart.reduce((sum, item) => {
                              const itemTotal =
                                parseFloat(item.price) * item.quantity;
                              const complementsTotal =
                                item.complements.reduce(
                                  (s, c) =>
                                    s + parseFloat(c.price) * (c.quantity || 1),
                                  0
                                ) * item.quantity;
                              return sum + itemTotal + complementsTotal;
                            }, 0);

                            // Calcular desconto do cupom
                            const discount = appliedCoupon?.discount || 0;

                            // Calcular taxa de entrega (apenas para delivery, não para pickup ou dine_in)
                            const deliveryFeeValue = getDeliveryFee(subtotal);
                            const cashbackDisc = useCashbackInOrder
                              ? parseFloat(cashbackAmountToUse)
                              : 0;
                            const total = Math.max(
                              0,
                              subtotal -
                                discount +
                                deliveryFeeValue -
                                cashbackDisc
                            );

                            // Montar endereço completo
                            const fullAddress =
                              deliveryType === "delivery"
                                ? `${deliveryAddress.street}, ${deliveryAddress.number}${deliveryAddress.complement ? ` - ${deliveryAddress.complement}` : ""}, ${deliveryAddress.neighborhood}${deliveryAddress.reference ? ` (Ref: ${deliveryAddress.reference})` : ""}`
                                : null;

                            // Dados comuns do pedido
                            const orderItems = cart.map(item => ({
                              productId: item.productId,
                              productName: item.name,
                              quantity: item.quantity,
                              unitPrice: item.price,
                              totalPrice: (
                                (parseFloat(item.price) +
                                  item.complements.reduce(
                                    (s, c) =>
                                      s +
                                      parseFloat(c.price) * (c.quantity || 1),
                                    0
                                  )) *
                                item.quantity
                              ).toFixed(2),
                              complements: item.complements.map(c => ({
                                name: c.name,
                                price: c.isIncluded || c.groupType === "included" ? 0 : parseFloat(c.price),
                                quantity: c.quantity || 1,
                                isIncluded: c.isIncluded || c.groupType === "included" || undefined,
                                groupType: c.groupType,
                              })),
                              notes: item.observation || undefined,
                            }));

                            if (paymentMethod === "pix_online") {
                              // Pagamento PIX Online via Paytime - criar pedido com status pending_confirmation, depois gerar QR Code
                              // O pedido só será enviado ao restaurante após confirmação do pagamento
                              createOrderMutation.mutate(
                                {
                                  establishmentId: establishment.id,
                                  customerName: customerInfo.name,
                                  customerPhone: customerInfo.phone,
                                  customerAddress: fullAddress || undefined,
                                  customerLat: deliveryAddress.lat || undefined,
                                  customerLng: deliveryAddress.lng || undefined,
                                  deliveryType,
                                  paymentMethod: "pix_online",
                                  subtotal: subtotal.toFixed(2),
                                  deliveryFee: deliveryFeeValue.toFixed(2),
                                  discount: discount.toFixed(2),
                                  total: total.toFixed(2),
                                  notes: orderObservation || undefined,
                                  couponCode: appliedCoupon?.code || undefined,
                                  couponId: appliedCoupon?.id || undefined,
                                  loyaltyCardId:
                                    appliedCoupon?.loyaltyCardId || undefined,
                                  ...(useCashbackInOrder && cashbackDisc > 0
                                    ? {
                                        cashbackAmount: cashbackDisc.toFixed(2),
                                        cashbackCustomerPhone: cashbackPhone,
                                      }
                                    : {}),
                                  items: orderItems,
                                  ...(isScheduling &&
                                  scheduledDate &&
                                  scheduledTime
                                    ? {
                                        isScheduled: true,
                                        scheduledAt: `${scheduledDate}T${scheduledTime}:00`,
                                      }
                                    : {}),
                                },
                                {
                                  onSuccess: (result: any) => {
                                    // Pedido criado com status pending_confirmation, agora gerar QR Code PIX
                                    const orderId = result.orderId || result.id;
                                    setPixOnlineOrderId(orderId);
                                    setCreatedOrderNumber(result.orderNumber);
                                    createPixPaymentMutation.mutate({
                                      orderId: orderId,
                                      establishmentId: establishment.id,
                                    });
                                  },
                                }
                              );
                            } else if (paymentMethod === "card_online") {
                              if (establishment.paytimeCardEnabled) {
                                // Smart Checkout Paytime - criar pedido com status pending_confirmation, depois processar cartão
                                // O pedido só será enviado ao restaurante após confirmação do pagamento
                                createOrderMutation.mutate(
                                  {
                                    establishmentId: establishment.id,
                                    customerName: customerInfo.name,
                                    customerPhone: customerInfo.phone,
                                    customerAddress: fullAddress || undefined,
                                    customerLat:
                                      deliveryAddress.lat || undefined,
                                    customerLng:
                                      deliveryAddress.lng || undefined,
                                    deliveryType,
                                    paymentMethod: "card_online",
                                    subtotal: subtotal.toFixed(2),
                                    deliveryFee: deliveryFeeValue.toFixed(2),
                                    discount: discount.toFixed(2),
                                    total: total.toFixed(2),
                                    notes: orderObservation || undefined,
                                    couponCode:
                                      appliedCoupon?.code || undefined,
                                    couponId: appliedCoupon?.id || undefined,
                                    loyaltyCardId:
                                      appliedCoupon?.loyaltyCardId || undefined,
                                    ...(useCashbackInOrder && cashbackDisc > 0
                                      ? {
                                          cashbackAmount:
                                            cashbackDisc.toFixed(2),
                                          cashbackCustomerPhone: cashbackPhone,
                                        }
                                      : {}),
                                    items: orderItems,
                                    ...(isScheduling &&
                                    scheduledDate &&
                                    scheduledTime
                                      ? {
                                          isScheduled: true,
                                          scheduledAt: `${scheduledDate}T${scheduledTime}:00`,
                                        }
                                      : {}),
                                  },
                                  {
                                    onSuccess: (result: any) => {
                                      // Pedido criado - agora processar pagamento com cartão
                                      const orderId =
                                        result.orderId || result.id;
                                      setCardPaymentOrderId(orderId);
                                      setCreatedOrderNumber(result.orderNumber);
                                      setIsSendingOrder(false);
                                      setCardPaymentStatus("filling"); // Mostrar formulário de cartão
                                    },
                                  }
                                );
                              }
                            } else {
                              // Pedido normal (dinheiro, cartão na entrega, pix)
                              createOrderMutation.mutate({
                                establishmentId: establishment.id,
                                customerName: customerInfo.name,
                                customerPhone: customerInfo.phone,
                                customerAddress: fullAddress || undefined,
                                customerLat: deliveryAddress.lat || undefined,
                                customerLng: deliveryAddress.lng || undefined,
                                deliveryType,
                                paymentMethod: paymentMethod!,
                                subtotal: subtotal.toFixed(2),
                                deliveryFee: deliveryFeeValue.toFixed(2),
                                discount: discount.toFixed(2),
                                total: total.toFixed(2),
                                notes: orderObservation || undefined,
                                changeAmount:
                                  paymentMethod === "cash" && changeAmount
                                    ? changeAmount
                                        .replace(/\./g, "")
                                        .replace(",", ".")
                                    : undefined,
                                couponCode: appliedCoupon?.code || undefined,
                                couponId: appliedCoupon?.id || undefined,
                                loyaltyCardId:
                                  appliedCoupon?.loyaltyCardId || undefined,
                                ...(useCashbackInOrder && cashbackDisc > 0
                                  ? {
                                      cashbackAmount: cashbackDisc.toFixed(2),
                                      cashbackCustomerPhone: cashbackPhone,
                                    }
                                  : {}),
                                items: orderItems,
                                ...(isScheduling &&
                                scheduledDate &&
                                scheduledTime
                                  ? {
                                      isScheduled: true,
                                      scheduledAt: `${scheduledDate}T${scheduledTime}:00`,
                                    }
                                  : {}),
                              });
                            }
                          }
                        }}
                        disabled={
                          isLitePlan
                            ? isSendingOrder
                            : isSendingOrder ||
                              !isOpen ||
                              !!changeAmountError ||
                              (establishment?.deliveryFeeType === "byRadius" &&
                                deliveryType === "delivery" &&
                                radiusFeeOutOfRange)
                        }
                        className={`flex-1 py-3.5 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                          isLitePlan
                            ? isSendingOrder
                              ? "bg-green-500/80 cursor-wait text-white"
                              : "bg-green-500 hover:bg-green-600 text-white"
                            : !isOpen
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : changeAmountError
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : isSendingOrder
                                  ? "bg-red-400 cursor-not-allowed"
                                  : "bg-red-500 hover:bg-red-500"
                        } ${!isLitePlan && isOpen && !changeAmountError ? "text-white" : ""}`}
                      >
                        {(() => {
                          const btnSubtotal = cart.reduce((sum, item) => {
                            const itemTotal =
                              parseFloat(item.price) * item.quantity;
                            const compTotal =
                              item.complements.reduce(
                                (s, c) =>
                                  s + parseFloat(c.price) * (c.quantity || 1),
                                0
                              ) * item.quantity;
                            return sum + itemTotal + compTotal;
                          }, 0);
                          const btnDiscount = appliedCoupon?.discount || 0;
                          const btnDeliveryFee =
                            deliveryType === "delivery"
                              ? getDeliveryFee(btnSubtotal)
                              : 0;
                          const btnCashbackDisc = useCashbackInOrder
                            ? parseFloat(cashbackAmountToUse)
                            : 0;
                          const btnTotal = Math.max(
                            0,
                            btnSubtotal -
                              btnDiscount +
                              btnDeliveryFee -
                              btnCashbackDisc
                          );
                          const totalStr = formatPrice(btnTotal);

                          if (isLitePlan)
                            return (
                              <>
                                {isSendingOrder ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <MessageCircle className="h-5 w-5" />
                                )}
                                Enviar via WhatsApp · {totalStr}
                              </>
                            );
                          if (!isOpen)
                            return (
                              <>
                                <Clock className="h-5 w-5" />
                                Restaurante Fechado
                              </>
                            );
                          if (isSendingOrder)
                            return (
                              <>
                                <svg
                                  className="animate-spin h-5 w-5 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                {paymentMethod === "card_online" ||
                                paymentMethod === "pix_online"
                                  ? "Processando..."
                                  : "Enviando..."}
                              </>
                            );
                          if (paymentMethod === "pix_online")
                            return (
                              <>
                                <QrCode className="h-5 w-5" />
                                Pagar com PIX · {totalStr}
                              </>
                            );
                          if (paymentMethod === "card_online")
                            return (
                              <>
                                <CreditCard className="h-5 w-5" />
                                Pagar online · {totalStr}
                              </>
                            );
                          return <>Enviar pedido · {totalStr}</>;
                        })()}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Cupom */}
      {showCouponModal && (
        <div className="fixed inset-0 z-[110] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={() => setShowCouponModal(false)}
          />

          {/* Modal Content - Bottom Sheet no mobile */}
          <div className="relative bg-gray-200 rounded-t-[30px] overflow-hidden md:rounded-[30px] shadow-2xl w-full md:max-w-md md:mx-4 max-h-[80vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            {/* Header - estilo vermelho */}
            <div
 className="sticky top-0 bg-gradient-to-r from-red-500 to-red-500 px-5 overflow-hidden z-10 flex items-center"
              style={{
                height: "67px",
                paddingTop: "12px",
                paddingBottom: "12px",
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Ticket className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Aplicar Cupom
                    </h2>
                    <p className="text-sm text-white/80">
                      Insira seu código de desconto
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCouponModal(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6" style={{ backgroundColor: "#ffffff" }}>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError("");
                  }}
                  placeholder="Digite o código do cupom"
                  className="w-full sm:flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 uppercase"
                  disabled={isValidatingCoupon}
                />
                <button
                  onClick={async () => {
                    if (cart.length === 0) {
                      setCouponError(
                        "Adicione os itens na sacola para aplicar o cupom."
                      );
                      return;
                    }
                    if (!couponCode.trim()) {
                      setCouponError("Digite o código do cupom.");
                      return;
                    }
                    if (!data?.establishment?.id) {
                      setCouponError("Erro ao identificar o estabelecimento.");
                      return;
                    }

                    setIsValidatingCoupon(true);
                    setCouponError("");

                    try {
                      // Calcular subtotal
                      const subtotal = cart.reduce((sum, item) => {
                        const complementsTotal = item.complements.reduce(
                          (cSum, c) =>
                            cSum + Number(c.price) * (c.quantity || 1),
                          0
                        );
                        return (
                          sum +
                          (Number(item.price) + complementsTotal) *
                            item.quantity
                        );
                      }, 0);

                      // Validar cupom via API (tRPC espera input com chave "json")
                      const response = await fetch(
                        `/api/trpc/publicMenu.validateCoupon?input=${encodeURIComponent(
                          JSON.stringify({
                            json: {
                              establishmentId: data.establishment.id,
                              code: couponCode.toUpperCase(),
                              orderValue: subtotal,
                              deliveryType:
                                deliveryType === "pickup"
                                  ? "pickup"
                                  : "delivery",
                            },
                          })
                        )}`
                      ).then(res => res.json());

                      const result = response.result?.data?.json;

                      if (result?.valid && result?.coupon) {
                        setAppliedCoupon({
                          id: result.coupon.id,
                          code: result.coupon.code,
                          discount: result.discount,
                          type: result.coupon.type,
                          value: Number(result.coupon.value),
                        });
                        setShowCouponModal(false);
                      } else {
                        setCouponError(result?.error || "Cupom inválido.");
                      }
                    } catch (error) {
                      setCouponError("Erro ao validar cupom. Tente novamente.");
                    } finally {
                      setIsValidatingCoupon(false);
                    }
                  }}
                  disabled={isValidatingCoupon}
                  className="w-full sm:w-auto px-6 py-3 bg-red-500 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidatingCoupon ? "Validando..." : "Aplicar cupom"}
                </button>
              </div>

              {/* Mensagem de erro */}
              {couponError && (
                <p className="mt-3 text-sm text-red-500 font-medium">
                  {couponError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Acompanhamento do Pedido */}
      {/* Modal da Sacola */}
      {showMobileBag && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={() => setShowMobileBag(false)}
          />

          {/* Modal */}
          <div className="relative bg-white w-full md:w-[480px] md:max-w-lg rounded-t-[30px] overflow-hidden md:rounded-[30px] shadow-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 overflow-hidden">
            {/* Header - estilo vermelho */}
            <div
 className="flex-shrink-0 bg-gradient-to-r from-red-500 to-red-500 px-5 flex items-center justify-between overflow-hidden overflow-hidden"
              style={{
                paddingTop: "12px",
                paddingBottom: "12px",
                height: "67px",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <ShoppingBag className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">
                    Sua Sacola
                  </h2>
                  <p className="text-xs text-white/80">
                    {cart.length} {cart.length === 1 ? "item" : "itens"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileBag(false)}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Body */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain p-4"
              style={{ backgroundColor: "#ffffff" }}
            >
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Sua sacola está vazia</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Adicione itens do cardápio
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, index) => {
                    const complementsTotalMobile = item.complements.reduce(
                      (sum, c) => sum + parseFloat(c.price) * (c.quantity || 1),
                      0
                    );
                    const itemTotalMobile =
                      (parseFloat(item.price) + complementsTotalMobile) *
                      item.quantity;
                    // Buscar estoque disponível do produto
                    const productDataMobile = products.find(
                      (p: (typeof products)[number]) => p.id === item.productId
                    );
                    const availableStockMobile = productDataMobile?.hasStock
                      ? (productDataMobile as any).availableStock
                      : null;
                    const totalOfProductInCartMobile = cart
                      .filter(ci => ci.productId === item.productId)
                      .reduce((sum, ci) => sum + ci.quantity, 0);
                    const canIncrementMobile =
                      availableStockMobile == null ||
                      totalOfProductInCartMobile < availableStockMobile;
                    return (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg border-l-[3px] border-red-500 cursor-pointer"
                        onClick={() =>
                          setExpandedCartItem(
                            expandedCartItem === index ? null : index
                          )
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900 text-sm">
                                {item.quantity}x {item.name}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {itemTotalMobile > 0 && (
                                  <span className="text-red-500 font-semibold text-sm">
                                    {formatPrice(itemTotalMobile)}
                                  </span>
                                )}
                                <ChevronDown
                                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${expandedCartItem === index ? "rotate-180" : ""}`}
                                />
                              </div>
                            </div>
                            {item.complements.length > 0 && (
                              <div className="mt-0.5">
                                {item.complements.map((c, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="flex justify-between items-center text-[11px]"
                                  >
                                    <span className="text-gray-500">
                                      +{" "}
                                      {(c.quantity || 1) > 1
                                        ? `${c.quantity}x `
                                        : ""}
                                      {c.name}
                                    </span>
                                    <span className="text-red-500 font-medium">
                                      {formatPrice(
                                        parseFloat(c.price) * (c.quantity || 1)
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {item.observation && (
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                Obs: {item.observation}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Controles de quantidade - visível apenas quando expandido */}
                        {expandedCartItem === index && (
                          <div
                            className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200"
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  if (item.quantity <= 1) {
                                    setCart(prev =>
                                      prev.filter((_, i) => i !== index)
                                    );
                                    setExpandedCartItem(null);
                                  } else {
                                    setCart(prev =>
                                      prev.map((ci, i) =>
                                        i === index
                                          ? { ...ci, quantity: ci.quantity - 1 }
                                          : ci
                                      )
                                    );
                                  }
                                }}
                                className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                aria-label={
                                  item.quantity <= 1
                                    ? "Remover item"
                                    : "Diminuir quantidade"
                                }
                              >
                                {item.quantity <= 1 ? (
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Minus className="h-4 w-4" />
                                )}
                              </button>
                              <span className="text-sm font-bold text-gray-900 min-w-[20px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  if (!canIncrementMobile) return;
                                  setCart(prev =>
                                    prev.map((ci, i) =>
                                      i === index
                                        ? { ...ci, quantity: ci.quantity + 1 }
                                        : ci
                                    )
                                  );
                                }}
                                disabled={!canIncrementMobile}
                                className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors ${
                                  canIncrementMobile
                                    ? "border-red-500 text-red-500 hover:bg-red-50 active:bg-red-100"
                                    : "border-gray-200 text-gray-300 cursor-not-allowed"
                                }`}
                                aria-label="Aumentar quantidade"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            {availableStockMobile != null &&
                              !canIncrementMobile && (
                                <span className="text-[10px] text-orange-500 font-medium">
                                  Estoque máximo
                                </span>
                              )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="flex-shrink-0 border-t p-4 space-y-3 bg-white">
                {(() => {
                  const subtotal = cart.reduce((sum, item) => {
                    const itemTotal = parseFloat(item.price) * item.quantity;
                    const complementsTotal =
                      item.complements.reduce(
                        (s, c) => s + parseFloat(c.price) * (c.quantity || 1),
                        0
                      ) * item.quantity;
                    return sum + itemTotal + complementsTotal;
                  }, 0);
                  const discount = appliedCoupon?.discount || 0;
                  const total = Math.max(0, subtotal - discount);
                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">
                          R$ {subtotal.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600 flex items-center gap-1">
                            <Ticket className="h-3.5 w-3.5" />
                            Cupom {appliedCoupon.code}
                          </span>
                          <span className="text-green-600">
                            -R$ {discount.toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span className="text-red-500">
                          R$ {total.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </>
                  );
                })()}

                {/* Barra de progresso frete grátis - Mobile */}
                {(() => {
                  const subtotal = cart.reduce((sum, item) => {
                    const itemTotal = parseFloat(item.price) * item.quantity;
                    const complementsTotal =
                      item.complements.reduce(
                        (s, c) => s + parseFloat(c.price) * (c.quantity || 1),
                        0
                      ) * item.quantity;
                    return sum + itemTotal + complementsTotal;
                  }, 0);
                  const freeDeliveryInfo = getFreeDeliveryProgress(subtotal);
                  if (!freeDeliveryInfo || cart.length === 0) return null;
                  return (
                    <div
                      data-delivery-card
                      className={`w-full p-2 rounded-xl border text-[0.90em] ${freeDeliveryInfo.achieved ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}
                    >
                      <FreeDeliveryCelebration
                        active={showFreeDeliveryConfetti}
                        onComplete={() => setShowFreeDeliveryConfetti(false)}
                      />
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-xs font-semibold ${freeDeliveryInfo.achieved ? "text-green-700" : "text-amber-700"}`}
                        >
                          {freeDeliveryInfo.achieved ? (
                            <span className="flex items-center gap-1 shimmer-text-green">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Entrega grátis desbloqueada!
                            </span>
                          ) : (
                            <span className="shimmer-text">{`Falta ${formatPrice(freeDeliveryInfo.remaining)} para entrega grátis`}</span>
                          )}
                        </span>
                        {!freeDeliveryInfo.achieved && (
                          <span className="text-xs text-amber-500">
                            {Math.round(freeDeliveryInfo.progress)}%
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-colors duration-500 ${freeDeliveryInfo.achieved ? "bg-green-500" : "bg-amber-500"}`}
                          style={{ width: `${freeDeliveryInfo.progress}%` }}
                        />
                      </div>
                      {freeDeliveryInfo.achieved &&
                        freeDeliveryInfo.baseFee > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            Você economizou{" "}
                            {formatPrice(freeDeliveryInfo.baseFee)} na entrega!
                          </p>
                        )}
                    </div>
                  );
                })()}

                {/* Alerta de Pedido Mínimo */}
                {(() => {
                  const subtotal = cart.reduce((sum, item) => {
                    const itemTotal = parseFloat(item.price) * item.quantity;
                    const complementsTotal =
                      item.complements.reduce(
                        (s, c) => s + parseFloat(c.price) * (c.quantity || 1),
                        0
                      ) * item.quantity;
                    return sum + itemTotal + complementsTotal;
                  }, 0);
                  const discount = appliedCoupon?.discount || 0;
                  const deliveryFee = getDeliveryFee(subtotal);
                  const total = Math.max(0, subtotal - discount + deliveryFee);
                  const minOrderValue =
                    establishment?.minimumOrderEnabled &&
                    establishment?.minimumOrderValue
                      ? Number(establishment.minimumOrderValue)
                      : 0;
                  const isBelowMinOrder =
                    minOrderValue > 0 && total < minOrderValue;
                  const amountMissing = minOrderValue - total;

                  return (
                    <>
                      {/* Alerta de Pedido Mínimo - cor vermelha */}
                      {isBelowMinOrder && (
                        <div className="w-full p-3 bg-red-50 border border-red-200 rounded-xl">
                          <div className="flex items-center gap-2 text-red-500">
                            <ShoppingBag className="h-4 w-4" />
                            <span className="font-semibold text-sm">
                              Pedido mínimo: R${" "}
                              {minOrderValue.toFixed(2).replace(".", ",")}
                            </span>
                          </div>
                          <p className="text-xs text-red-500 mt-1 ml-6">
                            Faltam R${" "}
                            {amountMissing.toFixed(2).replace(".", ",")} para
                            atingir o mínimo
                          </p>
                        </div>
                      )}

                      {/* Cupom */}
                      {appliedCoupon ? (
                        <div className="w-full flex items-center justify-between py-3 border-t border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Ticket className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-green-700 text-sm">
                                Cupom aplicado!
                              </p>
                              <p className="text-xs text-green-600">
                                {appliedCoupon.code} -{" "}
                                {appliedCoupon.type === "percentage"
                                  ? `${appliedCoupon.value}% de desconto`
                                  : `R$ ${appliedCoupon.value.toFixed(2).replace(".", ",")} de desconto`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setAppliedCoupon(null);
                              setCouponCode("");
                            }}
                            className="p-2 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setShowCouponModal(true);
                            setCouponError("");
                          }}
                          className="w-full flex items-center justify-between py-3 border-t border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Ticket className="h-5 w-5 text-gray-500" />
                            <div className="text-left">
                              <p className="font-medium text-gray-800 text-sm">
                                Tem um cupom?
                              </p>
                              <p className="text-xs text-gray-400">
                                Clique e insira o código
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </button>
                      )}

                      {/* Botão Adicionar mais itens - só mostra quando NÃO está abaixo do mínimo */}
                      {!isBelowMinOrder && (
                        <button
                          onClick={() => {
                            setShowMobileBag(false);
                            setBagAutoOpenEnabled(false);
                          }}
                          className="w-full py-3 font-semibold rounded-xl transition-colors border-2 border-red-500 text-red-500 hover:bg-red-50 flex items-center justify-center gap-2"
                        >
                          <Plus className="h-5 w-5" />
                          Adicionar mais itens
                        </button>
                      )}

                      {/* Botão Finalizar pedido / Adicionar mais itens (quando abaixo do mínimo) */}
                      {isBelowMinOrder ? (
                        <button
                          onClick={() => {
                            setShowMobileBag(false);
                            setBagAutoOpenEnabled(false);
                          }}
                          className="w-full py-3.5 font-semibold rounded-xl transition-colors border-2 border-red-500 text-red-500 hover:bg-red-50 flex items-center justify-center gap-2"
                        >
                          <Plus className="h-5 w-5" />
                          Adicionar mais itens
                        </button>
                      ) : (
                        (() => {
                          const hasNoNeighborhoodsMobile =
                            establishment?.deliveryFeeType ===
                              "byNeighborhood" &&
                            (!neighborhoodFeesData ||
                              neighborhoodFeesData.length === 0);
                          return (
                            <div className="relative">
                              <button
                                onClick={() => {
                                  if (!isOpen) return;
                                  // Bloquear se fora da área de entrega por raio
                                  if (
                                    deliveryType === "delivery" &&
                                    establishment?.deliveryFeeType ===
                                      "byRadius" &&
                                    radiusFeeOutOfRange
                                  ) {
                                    return;
                                  }
                                  // Validar seleção de bairro se necessário
                                  if (
                                    deliveryType === "delivery" &&
                                    establishment?.deliveryFeeType ===
                                      "byNeighborhood" &&
                                    !selectedNeighborhood
                                  ) {
                                    if (hasNoNeighborhoodsMobile) {
                                      setShowNoNeighborhoodTooltipAdvance(true);
                                      setTimeout(
                                        () =>
                                          setShowNoNeighborhoodTooltipAdvance(
                                            false
                                          ),
                                        4000
                                      );
                                      return;
                                    }
                                    setShowMobileBag(false);
                                    setReopenBagAfterNeighborhood(true);
                                    setShowNeighborhoodModal(true);
                                    return;
                                  }
                                  setShowMobileBag(false);
                                  setOrderSent(false);
                                  setOrderError(null);
                                  setCreatedOrderNumber(null);
                                  setCheckoutStep(1);
                                }}
                                disabled={
                                  !isOpen ||
                                  (deliveryType === "delivery" &&
                                    establishment?.deliveryFeeType ===
                                      "byRadius" &&
                                    radiusFeeOutOfRange)
                                }
                                className={`w-full py-3.5 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                                  !isOpen ||
                                  (deliveryType === "delivery" &&
                                    establishment?.deliveryFeeType ===
                                      "byRadius" &&
                                    radiusFeeOutOfRange)
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-red-500 hover:bg-red-500 text-white"
                                }`}
                              >
                                {!isOpen ? (
                                  <>
                                    <Clock className="h-5 w-5" />
                                    Restaurante Fechado
                                  </>
                                ) : deliveryType === "delivery" &&
                                  establishment?.deliveryFeeType ===
                                    "byRadius" &&
                                  radiusFeeOutOfRange ? (
                                  "Fora da área de entrega"
                                ) : (
                                  "Avançar"
                                )}
                              </button>
                              {showNoNeighborhoodTooltipAdvance &&
                                hasNoNeighborhoodsMobile && (
                                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-1 duration-200">
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                                    <span>
                                      O estabelecimento não configurou bairros
                                      de entrega
                                    </span>
                                  </div>
                                )}
                            </div>
                          );
                        })()
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Pedidos */}
      {showOrdersModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center">
          {/* Backdrop - clique para fechar */}
          <div
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={() => setShowOrdersModal(false)}
          />

          {/* Modal - Bottom Sheet no mobile com altura máxima de 80% */}
          <div className="relative bg-gray-200 rounded-t-[30px] overflow-hidden md:rounded-[30px] shadow-2xl w-full md:max-w-md md:mx-4 max-h-[80vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            {/* Header - estilo Conferência do Pedido */}
            <div
 className="sticky top-0 bg-gradient-to-r from-red-500 to-red-500 px-5 overflow-hidden z-10 flex items-center"
              style={{
                height: "67px",
                paddingTop: "12px",
                paddingBottom: "12px",
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <ClipboardList className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Meus Pedidos
                    </h2>
                    <p className="text-sm text-white/80">
                      Acompanhe seus pedidos
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOrdersModal(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div
              className="p-4 space-y-4"
              style={{ backgroundColor: "#ffffff" }}
            >
              {userOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Nenhum pedido ainda
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Seus pedidos aparecerão aqui após você fazer o primeiro
                    pedido.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pedidos em andamento */}
                  {userOrders.filter(
                    o => o.status !== "delivered" && o.status !== "cancelled"
                  ).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                        Em andamento
                      </h3>
                      <div className="space-y-3">
                        {userOrders
                          .filter(
                            o =>
                              o.status !== "delivered" &&
                              o.status !== "cancelled"
                          )
                          .map(order => (
                            <div
                              key={order.id}
                              className="bg-white border-l-4 border-l-green-500 border border-gray-200 rounded-lg overflow-hidden"
                            >
                              {/* Header compacto */}
                              <div
                                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => {
                                  setExpandedOrderIds(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(order.id)) {
                                      newSet.delete(order.id);
                                    } else {
                                      newSet.add(order.id);
                                    }
                                    return newSet;
                                  });
                                }}
                              >
                                <div className="flex items-center gap-6 flex-1">
                                  <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                                      Pedido
                                    </span>
                                    <p className="font-bold text-gray-900">
                                      {order.id}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                                      Status
                                    </span>
                                    <p
                                      className={`font-medium ${
                                        order.status === "sent"
                                          ? "text-yellow-600"
                                          : order.status === "accepted"
                                            ? "text-blue-600"
                                            : order.status === "delivering"
                                              ? "text-purple-600"
                                              : "text-green-600"
                                      }`}
                                    >
                                      {order.status === "sent"
                                        ? "Enviado"
                                        : order.status === "accepted"
                                          ? "Aceito"
                                          : order.status === "delivering"
                                            ? order.deliveryType === "pickup"
                                              ? "Finalizado"
                                              : "Em entrega"
                                            : "Entregue"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                                      Data/Hora
                                    </span>
                                    <p className="text-gray-700">
                                      {new Date(order.date).toLocaleDateString(
                                        "pt-BR",
                                        { day: "2-digit", month: "2-digit" }
                                      )}{" "}
                                      {new Date(order.date).toLocaleTimeString(
                                        "pt-BR",
                                        { hour: "2-digit", minute: "2-digit" }
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                                      Total
                                    </span>
                                    <p className="font-bold text-green-600">
                                      R$ {order.total.replace(".", ",")}
                                    </p>
                                  </div>
                                </div>
                                <ChevronDown
                                  className={`h-5 w-5 text-gray-400 transition-transform ${expandedOrderIds.has(order.id) ? "rotate-180" : ""}`}
                                />
                              </div>

                              {/* Dropdown de itens */}
                              {expandedOrderIds.has(order.id) && (
                                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Itens do pedido
                                  </h4>
                                  <div className="space-y-2">
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-gray-700">
                                            {item.quantity}x {item.name}
                                          </span>
                                          {parseFloat(item.price) *
                                            item.quantity >
                                            0 && (
                                            <span className="text-gray-600">
                                              R${" "}
                                              {(
                                                parseFloat(item.price) *
                                                item.quantity
                                              )
                                                .toFixed(2)
                                                .replace(".", ",")}
                                            </span>
                                          )}
                                        </div>
                                        {item.complements &&
                                          item.complements.length > 0 && (
                                            <div className="mt-0.5 ml-4">
                                              {item.complements.map(
                                                (c: any, cIdx: number) => (
                                                  <div
                                                    key={cIdx}
                                                    className="flex justify-between text-xs text-gray-500"
                                                  >
                                                    <span>+ {c.name}</span>
                                                    {parseFloat(c.price) >
                                                      0 && (
                                                      <span>
                                                        + R${" "}
                                                        {parseFloat(c.price)
                                                          .toFixed(2)
                                                          .replace(".", ",")}
                                                      </span>
                                                    )}
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    ))}
                                  </div>
                                  {/* Detalhes do preço */}
                                  {(order.deliveryFee || order.discount) && (
                                    <div className="mt-3 pt-2 border-t border-gray-200 space-y-1">
                                      {order.subtotal && (
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-500">
                                            Subtotal
                                          </span>
                                          <span className="text-gray-700">
                                            R${" "}
                                            {parseFloat(order.subtotal)
                                              .toFixed(2)
                                              .replace(".", ",")}
                                          </span>
                                        </div>
                                      )}
                                      {order.deliveryFee &&
                                        parseFloat(order.deliveryFee) > 0 && (
                                          <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">
                                              Taxa de entrega
                                            </span>
                                            <span className="text-gray-700">
                                              R${" "}
                                              {parseFloat(order.deliveryFee)
                                                .toFixed(2)
                                                .replace(".", ",")}
                                            </span>
                                          </div>
                                        )}
                                      {order.discount &&
                                        parseFloat(order.discount) > 0 && (
                                          <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">
                                              Desconto
                                            </span>
                                            <span className="text-green-600">
                                              - R${" "}
                                              {parseFloat(order.discount)
                                                .toFixed(2)
                                                .replace(".", ",")}
                                            </span>
                                          </div>
                                        )}
                                      <div className="flex justify-between text-sm font-bold pt-1">
                                        <span className="text-gray-700">
                                          Total
                                        </span>
                                        <span className="text-green-600">
                                          R${" "}
                                          {parseFloat(order.total)
                                            .toFixed(2)
                                            .replace(".", ",")}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedOrderId(order.id);
                                      // Usar orderId para tracking (evita colisão com reset diário)
                                      setCurrentOrderNumber(
                                        order.orderId
                                          ? order.orderId.toString()
                                          : order.id
                                      );
                                      setShowOrdersModal(false);
                                      setShowTrackingModal(true);
                                    }}
                                    className="mt-3 w-full py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Clock className="h-4 w-4" />
                                    Acompanhar pedido
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Histórico de pedidos (entregues e cancelados) */}
                  {userOrders.filter(
                    o => o.status === "delivered" || o.status === "cancelled"
                  ).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Histórico
                      </h3>
                      <div className="space-y-3">
                        {userOrders
                          .filter(
                            o =>
                              o.status === "delivered" ||
                              o.status === "cancelled"
                          )
                          .map(order => (
                            <div
                              key={order.id}
                              className={`bg-white border-l-4 ${order.status === "cancelled" ? "border-l-red-500" : "border-l-green-500"} border border-gray-200 rounded-lg overflow-hidden`}
                            >
                              {/* Header compacto */}
                              <div
                                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => {
                                  setExpandedOrderIds(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(order.id)) {
                                      newSet.delete(order.id);
                                    } else {
                                      newSet.add(order.id);
                                      // Check canReview when expanding a delivered order
                                      if (
                                        order.status === "delivered" &&
                                        showPublicReviews &&
                                        !historyCanReview[order.id]?.checked
                                      ) {
                                        setHistoryCanReview(prev => ({
                                          ...prev,
                                          [order.id]: {
                                            checked: false,
                                            canReview: true,
                                          },
                                        }));
                                        const checkUrl = `/api/trpc/publicMenu.canReview?input=${encodeURIComponent(
                                          JSON.stringify({
                                            json: {
                                              establishmentId: establishment.id,
                                              customerPhone:
                                                order.customerPhone,
                                            },
                                          })
                                        )}`;
                                        fetch(checkUrl)
                                          .then(res => res.json())
                                          .then(result => {
                                            let val = true;
                                            if (
                                              result?.result?.data?.json
                                                ?.canReview !== undefined
                                            )
                                              val =
                                                result.result.data.json
                                                  .canReview;
                                            else if (
                                              result?.result?.data
                                                ?.canReview !== undefined
                                            )
                                              val =
                                                result.result.data.canReview;
                                            else if (
                                              result?.data?.json?.canReview !==
                                              undefined
                                            )
                                              val = result.data.json.canReview;
                                            else if (
                                              result?.data?.canReview !==
                                              undefined
                                            )
                                              val = result.data.canReview;
                                            else if (
                                              result?.canReview !== undefined
                                            )
                                              val = result.canReview;
                                            setHistoryCanReview(prev => ({
                                              ...prev,
                                              [order.id]: {
                                                checked: true,
                                                canReview: val,
                                              },
                                            }));
                                          })
                                          .catch(() => {
                                            setHistoryCanReview(prev => ({
                                              ...prev,
                                              [order.id]: {
                                                checked: true,
                                                canReview: true,
                                              },
                                            }));
                                          });
                                      }
                                    }
                                    return newSet;
                                  });
                                }}
                              >
                                <div className="flex items-center gap-6 flex-1">
                                  <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                                      Pedido
                                    </span>
                                    <p className="font-bold text-gray-900">
                                      {order.id}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                                      Status
                                    </span>
                                    <p
                                      className={`font-medium ${order.status === "cancelled" ? "text-red-500" : "text-green-600"}`}
                                    >
                                      {order.status === "cancelled"
                                        ? "Cancelado"
                                        : "Entregue"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                                      Data/Hora
                                    </span>
                                    <p className="text-gray-700">
                                      {new Date(order.date).toLocaleDateString(
                                        "pt-BR",
                                        { day: "2-digit", month: "2-digit" }
                                      )}{" "}
                                      {new Date(order.date).toLocaleTimeString(
                                        "pt-BR",
                                        { hour: "2-digit", minute: "2-digit" }
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                                      Total
                                    </span>
                                    <p className="font-bold text-green-600">
                                      R$ {order.total.replace(".", ",")}
                                    </p>
                                  </div>
                                </div>
                                <ChevronDown
                                  className={`h-5 w-5 text-gray-400 transition-transform ${expandedOrderIds.has(order.id) ? "rotate-180" : ""}`}
                                />
                              </div>

                              {/* Dropdown de itens */}
                              {expandedOrderIds.has(order.id) && (
                                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Itens do pedido
                                  </h4>
                                  <div className="space-y-2">
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-gray-700">
                                            {item.quantity}x {item.name}
                                          </span>
                                          {parseFloat(item.price) *
                                            item.quantity >
                                            0 && (
                                            <span className="text-gray-600">
                                              R${" "}
                                              {(
                                                parseFloat(item.price) *
                                                item.quantity
                                              )
                                                .toFixed(2)
                                                .replace(".", ",")}
                                            </span>
                                          )}
                                        </div>
                                        {item.complements &&
                                          item.complements.length > 0 && (
                                            <div className="mt-0.5 ml-4">
                                              {item.complements.map(
                                                (c: any, cIdx: number) => (
                                                  <div
                                                    key={cIdx}
                                                    className="flex justify-between text-xs text-gray-500"
                                                  >
                                                    <span>+ {c.name}</span>
                                                    {parseFloat(c.price) >
                                                      0 && (
                                                      <span>
                                                        + R${" "}
                                                        {parseFloat(c.price)
                                                          .toFixed(2)
                                                          .replace(".", ",")}
                                                      </span>
                                                    )}
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    ))}
                                  </div>
                                  {/* Detalhes do preço */}
                                  {(order.deliveryFee || order.discount) && (
                                    <div className="mt-3 pt-2 border-t border-gray-200 space-y-1">
                                      {order.subtotal && (
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-500">
                                            Subtotal
                                          </span>
                                          <span className="text-gray-700">
                                            R${" "}
                                            {parseFloat(order.subtotal)
                                              .toFixed(2)
                                              .replace(".", ",")}
                                          </span>
                                        </div>
                                      )}
                                      {order.deliveryFee &&
                                        parseFloat(order.deliveryFee) > 0 && (
                                          <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">
                                              Taxa de entrega
                                            </span>
                                            <span className="text-gray-700">
                                              R${" "}
                                              {parseFloat(order.deliveryFee)
                                                .toFixed(2)
                                                .replace(".", ",")}
                                            </span>
                                          </div>
                                        )}
                                      {order.discount &&
                                        parseFloat(order.discount) > 0 && (
                                          <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">
                                              Desconto
                                            </span>
                                            <span className="text-green-600">
                                              - R${" "}
                                              {parseFloat(order.discount)
                                                .toFixed(2)
                                                .replace(".", ",")}
                                            </span>
                                          </div>
                                        )}
                                      <div className="flex justify-between text-sm font-bold pt-1">
                                        <span className="text-gray-700">
                                          Total
                                        </span>
                                        <span className="text-green-600">
                                          R${" "}
                                          {parseFloat(order.total)
                                            .toFixed(2)
                                            .replace(".", ",")}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {/* Botão Avaliar restaurante - só para pedidos entregues, se reviews habilitadas e pode avaliar */}
                                  {order.status === "delivered" &&
                                    showPublicReviews && (
                                      <>
                                        {historyCanReview[order.id]?.checked &&
                                          historyCanReview[order.id]
                                            ?.canReview && (
                                            <button
                                              onClick={() => {
                                                setSelectedOrderId(
                                                  order.orderId
                                                    ? order.orderId.toString()
                                                    : order.id
                                                );
                                                setShowOrdersModal(false);
                                                setShowRatingModal(true);
                                              }}
                                              className="mt-3 w-full py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-500 transition-colors flex items-center justify-center gap-2"
                                            >
                                              <Star className="h-4 w-4" />
                                              Avaliar restaurante
                                            </button>
                                          )}
                                        {historyCanReview[order.id]?.checked &&
                                          !historyCanReview[order.id]
                                            ?.canReview && (
                                            <div className="mt-3 text-center py-2 px-4 bg-gray-100 rounded-lg">
                                              <p className="text-xs text-gray-500">
                                                Você já avaliou este restaurante
                                                nos últimos 30 dias.
                                              </p>
                                            </div>
                                          )}
                                        {!historyCanReview[order.id]
                                          ?.checked && (
                                          <div className="mt-3 text-center py-2 px-4 bg-gray-100 rounded-lg">
                                            <p className="text-xs text-gray-400">
                                              Verificando avaliação...
                                            </p>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  {/* Botão Pedir novamente - para todos os pedidos do histórico */}
                                  <button
                                    onClick={() => {
                                      // Adicionar itens do pedido à sacola
                                      const newCartItems = order.items.map(
                                        item => ({
                                          productId: 0,
                                          name: item.name,
                                          price: item.price,
                                          quantity: item.quantity,
                                          observation: "",
                                          image: null,
                                          complements: item.complements.map(
                                            (c, idx) => ({
                                              id: idx,
                                              name: c.name,
                                              price: c.price,
                                              quantity: c.quantity || 1,
                                            })
                                          ),
                                        })
                                      );
                                      setCart(newCartItems);

                                      // Preencher dados do pedido anterior
                                      setDeliveryType(order.deliveryType);
                                      // Mapear 'online' para 'pix' já que 'online' não é uma opção selecionável
                                      const mappedPayment =
                                        order.paymentMethod === "online"
                                          ? "pix"
                                          : order.paymentMethod;
                                      setPaymentMethod(mappedPayment);
                                      setCustomerInfo({
                                        name: order.customerName,
                                        phone: order.customerPhone,
                                      });
                                      setOrderObservation(
                                        order.observation || ""
                                      );

                                      // Preencher endereço se for delivery
                                      if (
                                        order.deliveryType === "delivery" &&
                                        order.address
                                      ) {
                                        setDeliveryAddress({
                                          street: order.address.street || "",
                                          number: order.address.number || "",
                                          neighborhood:
                                            order.address.neighborhood || "",
                                          complement:
                                            order.address.complement || "",
                                          reference:
                                            order.address.reference || "",
                                        });
                                      }

                                      setShowOrdersModal(false);
                                      // Resetar estados de pedido anterior
                                      setOrderSent(false);
                                      setOrderError(null);
                                      setCreatedOrderNumber(null);
                                      setCheckoutStep(1);
                                    }}
                                    className="mt-3 w-full py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                    Pedir novamente
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showTrackingModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" />

          {/* Modal Content - Bottom Sheet no mobile */}
          <div
            className={`relative bg-white w-full md:w-[480px] md:max-w-md rounded-t-[30px] overflow-hidden md:rounded-[30px] shadow-2xl max-h-[80vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300`}
          >
            {/* Header - estilo vermelho */}
            <div
 className="sticky top-0 bg-gradient-to-r from-red-500 to-red-500 px-5 overflow-hidden z-10 flex items-center"
              style={{
                height: "67px",
                paddingTop: "12px",
                paddingBottom: "12px",
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Acompanhar Pedido
                      {(() => {
                        // Exibir o número visual do pedido (ex: #P1) e não o orderId numérico
                        if (!selectedOrderId) return "";
                        // Se selectedOrderId já é visual (começa com # ou P), usar diretamente
                        if (
                          selectedOrderId.startsWith("#") ||
                          selectedOrderId.startsWith("P")
                        ) {
                          return ` ${selectedOrderId.startsWith("#") ? selectedOrderId : "#" + selectedOrderId}`;
                        }
                        // Se é orderId numérico, buscar o orderNumber visual do currentOrderData ou userOrders
                        const visualOrder =
                          currentOrderData?.orderNumber ||
                          userOrders.find(
                            o => o.orderId?.toString() === selectedOrderId
                          )?.id;
                        return visualOrder
                          ? ` ${visualOrder.startsWith("#") ? visualOrder : "#" + visualOrder}`
                          : "";
                      })()}
                    </h2>
                    <p className="text-sm text-white/80">
                      Acompanhe o status em tempo real
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Body - Timeline ou Cancelado */}
            <div className="p-6" style={{ backgroundColor: "#ffffff" }}>
              {orderStatus === "cancelled" ? (
                /* Exibição de Pedido Cancelado */
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <X className="h-10 w-10 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-500 mb-4">
                    Pedido Cancelado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Infelizmente seu pedido foi cancelado pelo restaurante.
                  </p>
                  {cancellationReasonDisplay && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
                      <p className="text-sm font-semibold text-red-500 mb-1">
                        Motivo do cancelamento:
                      </p>
                      <p className="text-sm text-red-500">
                        {cancellationReasonDisplay}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  {/* Linha vertical conectando os status */}
                  <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200" />

                  {/* Status: Enviado */}
                  <div className="relative flex items-start gap-4 pb-8">
                    <div
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        orderStatus === "sent"
                          ? "bg-primary text-white"
                          : ["accepted", "delivering", "delivered"].includes(
                                orderStatus
                              )
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="pt-2">
                      <h4
                        className={`font-semibold ${
                          orderStatus === "sent"
                            ? "text-primary"
                            : ["accepted", "delivering", "delivered"].includes(
                                  orderStatus
                                )
                              ? "text-green-600"
                              : "text-gray-400"
                        }`}
                      >
                        Enviado
                      </h4>
                      <p className="text-sm text-gray-500">
                        Seu pedido foi recebido
                      </p>
                    </div>
                  </div>

                  {/* Status: Aceito */}
                  <div className="relative flex items-start gap-4 pb-8">
                    <div
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        orderStatus === "accepted"
                          ? "bg-primary text-white"
                          : ["delivering", "delivered"].includes(orderStatus)
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div className="pt-2">
                      <h4
                        className={`font-semibold ${
                          orderStatus === "accepted"
                            ? "text-primary"
                            : ["delivering", "delivered"].includes(orderStatus)
                              ? "text-green-600"
                              : "text-gray-400"
                        }`}
                      >
                        Pedido aceito
                      </h4>
                      <p className="text-sm text-gray-500">
                        Iniciamos o preparo do seu pedido.
                      </p>
                    </div>
                  </div>

                  {/* Status: Saiu para entrega / Pedido Finalizado (retirada) */}
                  {(() => {
                    const selectedOrder = userOrders.find(
                      o => o.id === selectedOrderId
                    );
                    const isPickup = selectedOrder?.deliveryType === "pickup";
                    // Para retirada: quando status é 'delivering' (ready no backend), mostrar como finalizado em verde
                    const isPickupReady =
                      isPickup &&
                      (orderStatus === "delivering" ||
                        orderStatus === "delivered");
                    return (
                      <div className="relative flex items-start gap-4 pb-8">
                        {/* Ícone com animação especial para status 'delivering' (Saiu para entrega) - apenas para delivery */}
                        {orderStatus === "delivering" && !isPickup ? (
                          <div className="relative z-10 w-10 h-10 flex items-center justify-center flex-shrink-0">
                            <Bike className="w-8 h-8 text-violet-600 animate-bounce" />
                            <div className="absolute inset-0 animate-ping flex items-center justify-center">
                              <Bike className="w-8 h-8 text-violet-400 opacity-75" />
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isPickupReady || orderStatus === "delivered"
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            {isPickup ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <Bike className="h-5 w-5" />
                            )}
                          </div>
                        )}
                        <div className="pt-2">
                          <h4
                            className={`font-semibold ${
                              isPickupReady
                                ? "text-green-600"
                                : orderStatus === "delivering"
                                  ? "text-violet-600"
                                  : orderStatus === "delivered"
                                    ? "text-green-600"
                                    : "text-gray-400"
                            }`}
                          >
                            {isPickup
                              ? "Pedido Finalizado"
                              : "Saiu para entrega"}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {isPickup
                              ? "Tudo certo! Seu pedido já está disponível para retirada."
                              : "Seu pedido está a caminho"}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Status: Entregue */}
                  <div className="relative flex items-start gap-4">
                    <div
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        orderStatus === "delivered"
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div className="pt-2">
                      <h4
                        className={`font-semibold ${
                          orderStatus === "delivered"
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        Entregue
                      </h4>
                      <p className="text-sm text-gray-500">
                        Pedido entregue com sucesso
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="border-t px-6 py-4 space-y-3 relative"
              style={{ backgroundColor: "#ffffff" }}
            >
              {/* Botão Avaliar restaurante - só aparece quando status for entregue E pode avaliar (30 dias) E verificação já terminou */}
              {orderStatus === "delivered" &&
                canReview &&
                canReviewChecked &&
                showPublicReviews && (
                  <button
                    onClick={() => {
                      setShowRatingModal(true);
                    }}
                    className="w-full py-3.5 bg-red-500 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Star className="h-5 w-5" />
                    Avaliar restaurante
                  </button>
                )}
              {/* Loading enquanto verifica se pode avaliar */}
              {orderStatus === "delivered" && !canReviewChecked && (
                <div className="text-center py-2 px-4 bg-gray-100 rounded-xl">
                  <p className="text-sm text-gray-500">Verificando...</p>
                </div>
              )}
              {/* Mensagem quando já avaliou nos últimos 30 dias */}
              {orderStatus === "delivered" &&
                !canReview &&
                canReviewChecked && (
                  <div className="text-center py-2 px-4 bg-gray-100 rounded-xl">
                    <p className="text-sm text-gray-600">
                      Você já avaliou este restaurante nos últimos 30 dias.
                    </p>
                  </div>
                )}
              <button
                onClick={() => {
                  setShowTrackingModal(false);
                  setOrderSent(false);
                  setCart([]);
                  // Limpar também o localStorage
                  if (slug) {
                    clearCartFromStorage(slug);
                  }
                  setOrderObservation("");
                  setDeliveryType("pickup");
                  setPaymentMethod(null);
                  setChangeAmount("");
                }}
                className="w-full py-3.5 font-semibold rounded-xl transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Avaliação do Restaurante */}
      {showRatingModal && showPublicReviews && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (!ratingSuccess) {
                setShowRatingModal(false);
                setRatingValue(0);
                setRatingHover(0);
                setRatingComment("");
              }
            }}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            {ratingSuccess ? (
              /* Tela de Sucesso */
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Avaliação enviada!
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Obrigado por avaliar. Sua opinião é muito importante para nós!
                </p>
                <button
                  onClick={() => {
                    setShowRatingModal(false);
                    setRatingSuccess(false);
                    setRatingValue(0);
                    setRatingHover(0);
                    setRatingComment("");
                  }}
                  className="w-full py-3 bg-red-500 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Fechar
                </button>
              </div>
            ) : (
              /* Formulário de Avaliação */
              <>
                {/* Header */}
                <div className="border-b px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <h2 className="text-lg font-bold text-gray-900">
                      {proactiveReviewOrder
                        ? "Avalie seu pedido"
                        : "Avaliar restaurante"}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      if (proactiveReviewOrder && data?.establishment?.id) {
                        dismissReviewForFifteenDays(
                          `review_dismissed_${data.establishment.id}_${proactiveReviewOrder.customerPhone}`
                        );
                        setProactiveReviewOrder(null);
                      }
                      setShowRatingModal(false);
                      setRatingValue(0);
                      setRatingHover(0);
                      setRatingComment("");
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6" style={{ backgroundColor: "#ffffff" }}>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {proactiveReviewOrder
                        ? "Como foi sua experiência com o último pedido?"
                        : "Como foi sua experiência?"}
                    </h3>
                    <p className="text-gray-500 text-sm mb-6">
                      Sua avaliação ajuda outros clientes e o restaurante a
                      melhorar.
                    </p>

                    {/* Sistema de estrelas */}
                    <div className="flex justify-center gap-2 mb-6">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingValue(star)}
                          onMouseEnter={() => setRatingHover(star)}
                          onMouseLeave={() => setRatingHover(0)}
                          className="p-1 transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star
                            className={`h-10 w-10 transition-colors ${
                              star <= (ratingHover || ratingValue)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    {/* Texto indicando a nota selecionada */}
                    {ratingValue > 0 && (
                      <p className="text-sm font-medium text-gray-700 mb-4">
                        {ratingValue === 1 && "Muito ruim"}
                        {ratingValue === 2 && "Ruim"}
                        {ratingValue === 3 && "Regular"}
                        {ratingValue === 4 && "Bom"}
                        {ratingValue === 5 && "Excelente!"}
                      </p>
                    )}

                    {/* Campo de comentário */}
                    <div className="text-left">
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <MessageCircle className="h-4 w-4 text-gray-500" />
                          Deixe um comentário (opcional)
                        </label>
                        <span
                          className={`text-xs ${ratingComment.length > 130 ? "text-red-500 font-medium" : "text-gray-400"}`}
                        >
                          {ratingComment.length}/140
                        </span>
                      </div>
                      <textarea
                        value={ratingComment}
                        onChange={e => {
                          if (e.target.value.length <= 140) {
                            setRatingComment(e.target.value);
                          }
                        }}
                        maxLength={140}
                        placeholder="Conte como foi sua experiência com o restaurante..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t px-6 py-4 flex gap-3">
                  <button
                    onClick={() => {
                      if (proactiveReviewOrder && data?.establishment?.id) {
                        dismissReviewForFifteenDays(
                          `review_dismissed_${data.establishment.id}_${proactiveReviewOrder.customerPhone}`
                        );
                        setProactiveReviewOrder(null);
                      }
                      setShowRatingModal(false);
                      setRatingValue(0);
                      setRatingHover(0);
                      setRatingComment("");
                    }}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                  >
                    Avaliar depois
                  </button>
                  <button
                    onClick={async () => {
                      if (!establishment || ratingValue === 0) return;
                      // Usar o telefone do pedido proativo, do pedido selecionado ou do cliente salvo
                      const selectedOrder = userOrders.find(
                        o => o.id === selectedOrderId
                      );
                      const phoneToUse =
                        proactiveReviewOrder?.customerPhone ||
                        selectedOrder?.customerPhone ||
                        customerInfo.phone ||
                        "";
                      const nameToUse =
                        proactiveReviewOrder?.customerName ||
                        selectedOrder?.customerName ||
                        customerInfo.name ||
                        "Cliente";

                      if (!phoneToUse) {
                        alert(
                          "Telefone não encontrado. Não é possível enviar avaliação."
                        );
                        return;
                      }

                      try {
                        const filteredComment =
                          filterReviewComment(ratingComment);
                        await createReviewMutation.mutateAsync({
                          establishmentId: establishment.id,
                          customerName: nameToUse,
                          customerPhone: phoneToUse,
                          orderId:
                            proactiveReviewOrder?.id ||
                            (selectedOrderId
                              ? Number(selectedOrderId)
                              : undefined),
                          rating: ratingValue,
                          comment: filteredComment || undefined,
                        });
                        setRatingSuccess(true);
                        // Após sucesso, atualizar canReview para false
                        setCanReview(false);
                        setProactiveReviewOrder(null);
                      } catch (error: any) {
                        console.error("Erro ao enviar avaliação:", error);
                        // Verificar se é erro de já ter avaliado
                        const errorMessage = error?.message || "";
                        if (
                          errorMessage.includes("30 dias") ||
                          errorMessage.includes("já avaliou")
                        ) {
                          alert(
                            "Você já avaliou este restaurante nos últimos 30 dias."
                          );
                          setCanReview(false);
                          setShowRatingModal(false);
                        } else {
                          alert("Erro ao enviar avaliação. Tente novamente.");
                        }
                      }
                    }}
                    disabled={
                      ratingValue === 0 || createReviewMutation.isPending
                    }
                    className={`flex-1 py-3 font-semibold rounded-xl transition-colors ${
                      ratingValue === 0 || createReviewMutation.isPending
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-500 text-white"
                    }`}
                  >
                    {createReviewMutation.isPending
                      ? "Enviando..."
                      : "Enviar avaliação"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Avaliações do Restaurante */}
      {/* Modal de Imagem em Tela Cheia */}
      {showFullscreenImage &&
        selectedProduct?.images &&
        selectedProduct.images.length > 0 && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
            onClick={() => setShowFullscreenImage(false)}
          >
            {/* Botão Fechar */}
            <button
              onClick={() => setShowFullscreenImage(false)}
              className="absolute top-4 right-4 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Setas de Navegação - Esquerda */}
            {selectedProduct.images.length > 1 && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  setFullscreenImageIndex(prev =>
                    prev === 0 ? selectedProduct.images!.length - 1 : prev - 1
                  );
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
            )}

            {/* Setas de Navegação - Direita */}
            {selectedProduct.images.length > 1 && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  setFullscreenImageIndex(prev =>
                    prev === selectedProduct.images!.length - 1 ? 0 : prev + 1
                  );
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            )}

            {/* Imagem Principal com suporte a swipe */}
            <div
              className="w-full h-full flex items-center justify-center"
              onClick={e => e.stopPropagation()}
              onTouchStart={e => {
                const touch = e.touches[0];
                (e.currentTarget as HTMLElement).dataset.touchStartX =
                  touch.clientX.toString();
              }}
              onTouchEnd={e => {
                const touchStartX = parseFloat(
                  (e.currentTarget as HTMLElement).dataset.touchStartX || "0"
                );
                const touchEndX = e.changedTouches[0].clientX;
                const diff = touchStartX - touchEndX;

                if (
                  Math.abs(diff) > 50 &&
                  selectedProduct.images &&
                  selectedProduct.images.length > 1
                ) {
                  if (diff > 0) {
                    // Swipe para esquerda - próxima imagem
                    setFullscreenImageIndex(prev =>
                      prev === selectedProduct.images!.length - 1 ? 0 : prev + 1
                    );
                  } else {
                    // Swipe para direita - imagem anterior
                    setFullscreenImageIndex(prev =>
                      prev === 0 ? selectedProduct.images!.length - 1 : prev - 1
                    );
                  }
                }
              }}
            >
              <img
                src={selectedProduct.images[fullscreenImageIndex]}
                alt={`${selectedProduct.name} - Foto ${fullscreenImageIndex + 1}`}
                className="max-w-full max-h-full object-contain p-4 select-none"
                draggable={false}
              />
            </div>

            {/* Contador de Fotos no canto inferior direito */}
            {selectedProduct.images.length > 1 && (
              <div className="absolute bottom-6 right-6 bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                {fullscreenImageIndex + 1} / {selectedProduct.images.length}
              </div>
            )}

            {/* Indicadores de Paginação (pontos) */}
            {selectedProduct.images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {selectedProduct.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={e => {
                      e.stopPropagation();
                      setFullscreenImageIndex(index);
                    }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      index === fullscreenImageIndex
                        ? "bg-white w-6"
                        : "bg-white/50 hover:bg-white/70"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Dica de arrastar (apenas no mobile quando há múltiplas fotos) */}
            {selectedProduct.images.length > 1 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-white/60 text-xs md:hidden">
                Arraste para ver mais fotos
              </div>
            )}
          </div>
        )}

      {showReviewsModal &&
        establishment &&
        showPublicReviews && (
          <div className="fixed inset-0 z-[110] flex items-end md:items-center md:justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
              onClick={() => setShowReviewsModal(false)}
            />

            {/* Modal Content - Bottom Sheet no mobile */}
            <div className="relative bg-gray-200 rounded-t-[30px] overflow-hidden md:rounded-[30px] shadow-2xl w-full md:max-w-lg md:mx-4 max-h-[80vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
              {/* Header - estilo vermelho */}
              <div
 className="sticky top-0 bg-gradient-to-r from-red-500 to-red-500 px-5 overflow-hidden z-10 flex items-center"
                style={{
                  height: "67px",
                  paddingTop: "12px",
                  paddingBottom: "12px",
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      <Star className="h-4 w-4 text-white fill-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Avaliações
                      </h2>
                      <p className="text-sm text-white/80">
                        {establishment.rating
                          ? Number(establishment.rating).toFixed(1)
                          : "0.0"}{" "}
                        • {establishment.reviewCount || 0} avaliações
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReviewsModal(false)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Body - Lista de Avaliações */}
              <div
                className="p-4 space-y-4"
                style={{ backgroundColor: "#ffffff" }}
              >
                {reviewsQuery.isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : reviewsQuery.data && reviewsQuery.data.length > 0 ? (
                  <div className="space-y-4">
                    {reviewsQuery.data.map(review => (
                      <div
                        key={review.id}
                        className="border-b pb-4 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-red-500 font-semibold text-sm">
                              {review.customerName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* Nome e Data */}
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-semibold text-gray-900 truncate">
                                {review.customerName}
                              </span>
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {new Date(review.createdAt).toLocaleDateString(
                                  "pt-BR"
                                )}
                              </span>
                            </div>
                            {/* Estrelas */}
                            <div className="flex items-center gap-0.5 mb-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            {/* Comentário */}
                            {review.comment && (
                              <p className="text-sm text-gray-600">
                                {filterReviewComment(review.comment)}
                              </p>
                            )}
                            {/* Resposta do restaurante */}
                            {review.responseText && (
                              <div className="mt-3 ml-2 pl-3 border-l-2 border-red-200 bg-red-50/50 rounded-r-lg py-2 pr-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-red-500 font-bold text-[10px]">
                                      {establishment?.name
                                        ?.charAt(0)
                                        ?.toUpperCase() || "R"}
                                    </span>
                                  </div>
                                  <span className="text-xs font-semibold text-red-500">
                                    {establishment?.name || "Restaurante"}
                                  </span>
                                  {review.responseDate && (
                                    <span className="text-[10px] text-gray-400 ml-auto">
                                      {new Date(
                                        review.responseDate
                                      ).toLocaleDateString("pt-BR")}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                  {review.responseText}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      Nenhuma avaliação ainda
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Seja o primeiro a avaliar!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Modal de Navegação - Bottom Sheet */}
      {showNavigationModal && establishment && (
        <div
          className="fixed inset-0 z-[110] flex items-end md:items-center md:justify-center"
          onTouchMove={e => e.stopPropagation()}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={() => setShowNavigationModal(false)}
          />

          {/* Modal Content - Bottom Sheet Style */}
          <div className="relative bg-white w-full md:max-w-md md:mx-4 md:rounded-[30px] rounded-t-[30px] overflow-hidden shadow-2xl max-h-[80vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            {/* Header - estilo vermelho */}
            <div
 className="sticky top-0 bg-gradient-to-r from-red-500 to-red-500 px-5 overflow-hidden z-10 flex items-center"
              style={{
                height: "67px",
                paddingTop: "12px",
                paddingBottom: "12px",
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Como Chegar
                    </h2>
                    <p className="text-sm text-white/80 truncate max-w-[250px]">
                      {establishment.street}
                      {establishment.number && `, ${establishment.number}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNavigationModal(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Endereço Completo */}
            <div
              className="p-4 border-b"
              style={{ backgroundColor: "#ffffff" }}
            >
              <p className="text-sm text-gray-700">
                {establishment.street}
                {establishment.number && `, ${establishment.number}`}
                {establishment.neighborhood &&
                  ` - ${establishment.neighborhood}`}
                {establishment.city && `, ${establishment.city}`}
                {establishment.state && ` - ${establishment.state}`}
              </p>
            </div>

            {/* Opções de Navegação */}
            <div
              className="p-4 space-y-3"
              style={{ backgroundColor: "#ffffff" }}
            >
              <p className="text-sm font-medium text-gray-500 mb-3">
                Abrir com:
              </p>

              {/* Google Maps */}
              <a
                href={
                  establishment.latitude && establishment.longitude
                    ? `https://www.google.com/maps/dir/?api=1&destination=${establishment.latitude},${establishment.longitude}`
                    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        [
                          establishment.street,
                          establishment.number,
                          establishment.neighborhood,
                          establishment.city,
                          establishment.state,
                        ]
                          .filter(Boolean)
                          .join(", ")
                      )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
                onClick={() => setShowNavigationModal(false)}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/google-maps-icon_e960da6f.png"
                    alt="Google Maps"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Google Maps</p>
                  <p className="text-sm text-gray-500">Navegar com rotas</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </a>

              {/* Waze */}
              <a
                href={
                  establishment.latitude && establishment.longitude
                    ? `https://waze.com/ul?ll=${establishment.latitude},${establishment.longitude}&navigate=yes`
                    : `https://waze.com/ul?q=${encodeURIComponent(
                        [
                          establishment.street,
                          establishment.number,
                          establishment.neighborhood,
                          establishment.city,
                          establishment.state,
                        ]
                          .filter(Boolean)
                          .join(", ")
                      )}&navigate=yes`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
                onClick={() => setShowNavigationModal(false)}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                  <img
                    src="/assets/waze-icon.png"
                    alt="Waze"
                    className="w-full h-full object-cover scale-[1.18]"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Waze</p>
                  <p className="text-sm text-gray-500">
                    Navegar com trânsito em tempo real
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </a>

              {/* Apple Maps (apenas iOS) */}
              <a
                href={
                  establishment.latitude && establishment.longitude
                    ? `maps://maps.apple.com/?daddr=${establishment.latitude},${establishment.longitude}`
                    : `maps://maps.apple.com/?daddr=${encodeURIComponent(
                        [
                          establishment.street,
                          establishment.number,
                          establishment.neighborhood,
                          establishment.city,
                          establishment.state,
                        ]
                          .filter(Boolean)
                          .join(", ")
                      )}`
                }
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
                onClick={() => setShowNavigationModal(false)}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/apple-maps-icon_12f2f145.png"
                    alt="Apple Maps"
                    className="w-full h-full object-cover scale-[1.18]"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Apple Maps</p>
                  <p className="text-sm text-gray-500">
                    Disponível em dispositivos Apple
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </a>
            </div>

            {/* Botão Copiar Endereço */}
            <div
              className="p-4 border-t"
              style={{ backgroundColor: "#ffffff" }}
            >
              <button
                onClick={() => {
                  const fullAddress = [
                    establishment.street,
                    establishment.number,
                    establishment.neighborhood,
                    establishment.city,
                    establishment.state,
                  ]
                    .filter(Boolean)
                    .join(", ");
                  navigator.clipboard.writeText(fullAddress);
                  // Feedback visual
                  const btn = document.getElementById("copy-address-btn");
                  if (btn) {
                    btn.textContent = "Endereço copiado!";
                    setTimeout(() => {
                      btn.textContent = "Copiar endereço";
                    }, 2000);
                  }
                }}
                id="copy-address-btn"
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copiar endereço
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom sheet introdutório do Programa de Fidelidade */}
      {showLoyaltyIntroSheet && (
        <LoyaltyIntroSheet
          onClose={() => setShowLoyaltyIntroSheet(false)}
          onContinue={continueFromLoyaltyIntro}
        />
      )}

      {/* Bottom sheet introdutório do Programa de Cashback */}
      {showCashbackIntroSheet && (
        <CashbackIntroSheet
          onClose={() => setShowCashbackIntroSheet(false)}
          onContinue={() => {
            setShowCashbackIntroSheet(false);
            setShowCashbackModal(true);
            setCashbackStep("login");
            setCashbackError("");
          }}
        />
      )}

      {/* Modal de Fidelidade */}
      {showLoyaltyModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={() => setShowLoyaltyModal(false)}
          />

          {/* Modal Content - Bottom Sheet no mobile */}
          <div
            className="relative bg-gray-200 rounded-t-[30px] overflow-hidden md:rounded-[30px] shadow-2xl w-full md:max-w-md md:mx-4 max-h-[75vh] md:max-h-[80vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300"
            style={{ touchAction: "pan-y" }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-[50] bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between overflow-hidden shadow-sm"
              style={{ height: "68px" }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <Heart className="h-5 w-5 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Cartão Fidelidade
                </h2>
              </div>
              <button
                onClick={() => setShowLoyaltyModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div
              className="p-4 space-y-4"
              style={{ backgroundColor: "#ffffff" }}
            >
              {loyaltyStep === "login" && (
                <LoyaltyLoginForm
                  phone={loyaltyPhone}
                  setPhone={setLoyaltyPhone}
                  password={loyaltyPassword}
                  setPassword={setLoyaltyPassword}
                  error={loyaltyError}
                  isLoading={loyaltyLoginMutation.isPending}
                  onLogin={() => {
                    if (
                      loyaltyPhone.length >= 10 &&
                      loyaltyPassword.length === 4
                    ) {
                      loyaltyLoginMutation.mutate({
                        establishmentId: data?.establishment?.id || 0,
                        phone: loyaltyPhone,
                        password4: loyaltyPassword,
                      });
                    }
                  }}
                  onRegister={() => {
                    setLoyaltyStep("register");
                    setLoyaltyError("");
                  }}
                />
              )}

              {loyaltyStep === "register" && (
                <LoyaltyRegisterForm
                  phone={loyaltyPhone}
                  setPhone={setLoyaltyPhone}
                  password={loyaltyPassword}
                  setPassword={setLoyaltyPassword}
                  name={loyaltyName}
                  setName={setLoyaltyName}
                  error={loyaltyError}
                  isLoading={loyaltyRegisterMutation.isPending}
                  onRegister={() => {
                    if (
                      loyaltyPhone.length >= 10 &&
                      loyaltyPassword.length === 4
                    ) {
                      loyaltyRegisterMutation.mutate({
                        establishmentId: data?.establishment?.id || 0,
                        phone: loyaltyPhone,
                        password4: loyaltyPassword,
                        name: loyaltyName || undefined,
                      });
                    }
                  }}
                  onBack={() => {
                    setLoyaltyStep("login");
                    setLoyaltyError("");
                  }}
                />
              )}

              {loyaltyStep === "card" && isLoyaltyLoggedIn && (
                <LoyaltyCardView
                  establishmentName={data?.establishment?.name || ""}
                  establishmentId={data?.establishment?.id || 0}
                  customerPhone={loyaltyPhone}
                  customerPassword={loyaltyPassword}
                  cardData={loyaltyCardQuery.data}
                  stampsRequired={loyaltyEnabled?.stampsRequired || 6}
                  isLoading={loyaltyCardQuery.isLoading}
                  isModalOpen={showLoyaltyModal}
                  onCouponViewed={() => {
                    // Recarregar dados do cartão após resetar carimbos
                    loyaltyCardQuery.refetch();
                  }}
                  onLogout={() => {
                    setIsLoyaltyLoggedIn(false);
                    setLoyaltyPhone("");
                    setLoyaltyPassword("");
                    setLoyaltyStep("login");
                    localStorage.removeItem(
                      "loyaltyPhone_" + data?.establishment?.id
                    );
                  }}
                  onApplyCoupon={(
                    couponCode,
                    couponType,
                    couponValue,
                    loyaltyCardId
                  ) => {
                    // Calcular o desconto baseado no tipo de cupom
                    const subtotal = cart.reduce((sum, item) => {
                      const complementsTotal = item.complements.reduce(
                        (cSum, c) => cSum + Number(c.price) * (c.quantity || 1),
                        0
                      );
                      return (
                        sum +
                        (Number(item.price) + complementsTotal) * item.quantity
                      );
                    }, 0);

                    let discount = 0;
                    const value = Number(couponValue);

                    if (couponType === "percentage") {
                      discount = (subtotal * value) / 100;
                    } else if (couponType === "fixed") {
                      discount = value;
                    } else if (couponType === "free_delivery") {
                      // Frete grátis - desconto será aplicado na taxa de entrega
                      discount = 0; // Por enquanto, taxa de entrega é 0
                    }

                    // Aplicar o cupom com o loyaltyCardId para consumir após o pedido
                    setAppliedCoupon({
                      id: 0, // ID será validado no backend ao finalizar pedido
                      code: couponCode,
                      discount: discount,
                      type: couponType as "percentage" | "fixed",
                      value: value,
                      loyaltyCardId: loyaltyCardId,
                    });

                    // Salvar info do cupom para o modal de confirmação
                    setAppliedCouponInfo({
                      code: couponCode,
                      type: couponType,
                      value: value,
                    });

                    // Fechar modal de fidelidade e mostrar confirmação
                    setShowLoyaltyModal(false);
                    setShowCouponAppliedModal(true);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet Cashback no Checkout */}
      {showCashbackCheckoutSheet && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center">
          <div
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={() => setShowCashbackCheckoutSheet(false)}
          />
          <div className="relative bg-white w-full md:w-[420px] rounded-t-[30px] overflow-hidden md:rounded-[30px] shadow-2xl max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div
 className="sticky top-0 bg-red-500 overflow-hidden overflow-hidden px-5 flex items-center justify-between"
              style={{
                height: "67px",
                paddingTop: "12px",
                paddingBottom: "12px",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Usar Cashback</h3>
                  <p className="text-xs text-white/80">
                    Aplique seu saldo neste pedido
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCashbackCheckoutSheet(false)}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
            {/* Content */}
            <div className="px-6 py-5">
              {isCashbackLoggedIn &&
              cashbackBalanceQuery.data &&
              Number(cashbackBalanceQuery.data.balance) > 0 ? (
                <div className="space-y-4">
                  <div className="bg-red-50 rounded-xl p-4">
                    <p className="text-sm text-red-500 font-medium">
                      Saldo disponível
                    </p>
                    <p className="text-2xl font-bold text-red-500 mt-1">
                      R${" "}
                      {parseFloat(cashbackBalanceQuery.data.balance)
                        .toFixed(2)
                        .replace(".", ",")}
                    </p>
                  </div>
                  <label className="flex items-center justify-between bg-gray-50 rounded-xl p-4 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="font-medium text-gray-800">
                        Usar saldo neste pedido
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={useCashbackInOrder}
                      onChange={e => {
                        setUseCashbackInOrder(e.target.checked);
                        if (e.target.checked) {
                          const balance = parseFloat(
                            cashbackBalanceQuery.data?.balance || "0"
                          );
                          const subtotal = cart.reduce((sum, item) => {
                            const complementsTotal = item.complements.reduce(
                              (cSum, c) =>
                                cSum + Number(c.price) * (c.quantity || 1),
                              0
                            );
                            return (
                              sum +
                              (Number(item.price) + complementsTotal) *
                                item.quantity
                            );
                          }, 0);
                          const deliveryFeeVal = getDeliveryFee(subtotal);
                          const couponDiscount = appliedCoupon
                            ? appliedCoupon.discount
                            : 0;
                          const totalBeforeCashback = Math.max(
                            0,
                            subtotal + deliveryFeeVal - couponDiscount
                          );
                          const amountToUse = Math.min(
                            balance,
                            totalBeforeCashback
                          );
                          setCashbackAmountToUse(amountToUse.toFixed(2));
                        } else {
                          setCashbackAmountToUse("0");
                        }
                      }}
                      className="w-5 h-5 text-red-500 rounded focus:ring-red-500 accent-red-600"
                    />
                  </label>
                  {useCashbackInOrder && Number(cashbackAmountToUse) > 0 && (
                    <div className="flex items-center justify-between bg-green-50 rounded-xl p-4">
                      <span className="text-green-700 font-medium">
                        Desconto cashback
                      </span>
                      <span className="text-lg font-bold text-green-700">
                        - R${" "}
                        {parseFloat(cashbackAmountToUse)
                          .toFixed(2)
                          .replace(".", ",")}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setShowCashbackCheckoutSheet(false)}
                    className="w-full py-3.5 bg-red-500 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors"
                  >
                    Confirmar
                  </button>
                </div>
              ) : isCashbackLoggedIn &&
                cashbackBalanceQuery.data &&
                Number(cashbackBalanceQuery.data.balance) === 0 ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Wallet className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">
                    Você ainda não possui saldo de cashback.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Ganhe {cashbackEnabled?.percent || 0}% a cada pedido
                    concluído!
                  </p>
                  <button
                    onClick={() => setShowCashbackCheckoutSheet(false)}
                    className="mt-4 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <Wallet className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-gray-700 font-medium mb-2">
                    Entre para usar seu cashback
                  </p>
                  <p className="text-sm text-gray-400 mb-5">
                    Faça login para verificar seu saldo e aplicar desconto.
                  </p>
                  <button
                    onClick={() => {
                      setShowCashbackCheckoutSheet(false);
                      setShowCashbackModal(true);
                      setCashbackStep("login");
                    }}
                    className="w-full py-3.5 bg-red-500 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors"
                  >
                    Entrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Minha Carteira (Cashback) */}
      {showCashbackModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={() => setShowCashbackModal(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full md:w-[420px] md:max-h-[80vh] bg-white md:rounded-[30px] rounded-t-[30px] overflow-hidden shadow-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div
              className="flex items-center justify-between p-4 border-b border-gray-100"
              style={{ backgroundColor: "#ffffff" }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Minha Carteira
                </h2>
              </div>
              <button
                onClick={() => setShowCashbackModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div
              className="p-4 space-y-4 overflow-y-auto"
              style={{ backgroundColor: "#ffffff" }}
            >
              {cashbackStep === "login" && (
                <CashbackLoginForm
                  phone={cashbackPhone}
                  setPhone={setCashbackPhone}
                  password={cashbackPassword}
                  setPassword={setCashbackPassword}
                  error={cashbackError}
                  isLoading={cashbackLoginMutation.isPending}
                  onLogin={() => {
                    if (
                      cashbackPhone.length >= 10 &&
                      cashbackPassword.length === 4
                    ) {
                      cashbackLoginMutation.mutate({
                        establishmentId: data?.establishment?.id || 0,
                        phone: cashbackPhone,
                        password4: cashbackPassword,
                      });
                    }
                  }}
                  onGoToRegister={() => {
                    setCashbackStep("register");
                    setCashbackError("");
                  }}
                />
              )}

              {cashbackStep === "register" && (
                <CashbackRegisterForm
                  phone={cashbackPhone}
                  setPhone={setCashbackPhone}
                  password={cashbackPassword}
                  setPassword={setCashbackPassword}
                  name={cashbackName}
                  setName={setCashbackName}
                  error={cashbackError}
                  isLoading={cashbackRegisterMutation.isPending}
                  onRegister={() => {
                    if (
                      cashbackPhone.length >= 10 &&
                      cashbackPassword.length === 4
                    ) {
                      cashbackRegisterMutation.mutate({
                        establishmentId: data?.establishment?.id || 0,
                        phone: cashbackPhone,
                        password4: cashbackPassword,
                        name: cashbackName || undefined,
                      });
                    }
                  }}
                  onGoToLogin={() => {
                    setCashbackStep("login");
                    setCashbackError("");
                  }}
                />
              )}

              {cashbackStep === "wallet" && isCashbackLoggedIn && (
                <CashbackWalletView
                  balance={cashbackBalanceQuery.data}
                  transactions={cashbackTransactionsQuery.data || []}
                  isLoading={cashbackBalanceQuery.isLoading}
                  cashbackPercent={Number(cashbackEnabled?.percent || 0)}
                  onLogout={() => {
                    setIsCashbackLoggedIn(false);
                    setCashbackPhone("");
                    setCashbackPassword("");
                    setCashbackStep("login");
                    localStorage.removeItem(
                      "cashbackPhone_" + data?.establishment?.id
                    );
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Bottom Sheet de Confirmação de Cupom Aplicado */}
      {showCouponAppliedModal && appliedCouponInfo && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          onClick={() => setShowCouponAppliedModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-300" />

          {/* Bottom Sheet */}
          <div
            className="relative w-full max-w-lg bg-white rounded-t-[30px] md:rounded-[30px] shadow-2xl animate-in slide-in-from-bottom duration-400 ease-out"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Content */}
            <div className="px-6 pb-8 pt-2">
              {/* Success Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Cupom aplicado!
              </h3>

              {/* Coupon Info */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="h-5 w-5 text-emerald-600" />
                  <span className="font-mono font-bold text-lg text-emerald-700">
                    {appliedCouponInfo.code}
                  </span>
                </div>
                <p className="text-center text-emerald-600 font-medium">
                  {appliedCouponInfo.type === "percentage"
                    ? `${appliedCouponInfo.value}% de desconto`
                    : appliedCouponInfo.type === "fixed"
                      ? `R$ ${appliedCouponInfo.value.toFixed(2)} de desconto`
                      : "Entrega grátis"}
                </p>
              </div>

              {/* Description */}
              <p className="text-gray-500 text-center text-sm mb-6">
                Seu desconto foi adicionado à sacola. Adicione itens e finalize
                seu pedido para aproveitar!
              </p>

              {/* Button */}
              <button
                onClick={() => setShowCouponAppliedModal(false)}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl transition-[colors,box-shadow] shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-5 w-5" />
                Continuar comprando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção do Tipo de Entrega (aparece ao clicar num produto pela primeira vez) */}
      {showDeliveryTypeModal && data?.establishment && (
        <div className="fixed inset-0 z-[110] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={() => setShowDeliveryTypeModal(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-t-[30px] overflow-hidden md:rounded-[30px] shadow-2xl w-full md:max-w-md md:mx-4 overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            {/* Header - estilo vermelho igual ao modal de bairro */}
            <div
 className="sticky top-0 bg-gradient-to-r from-red-500 to-red-500 px-5 overflow-hidden z-10 flex items-center"
              style={{
                height: "67px",
                paddingTop: "12px",
                paddingBottom: "12px",
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <ShoppingBag className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Como deseja receber?
                    </h2>
                    <p className="text-sm text-white/80">
                      Escolha antes de montar seu pedido
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeliveryTypeModal(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Opções - compacto com ícones menores, descrições e badge Grátis */}
            <div className="p-4 space-y-2.5">
              {data.establishment.allowsDelivery && (
                <button
                  onClick={() => {
                    setDeliveryType("delivery");
                    setDeliveryTypeChosen(true);
                    setShowDeliveryTypeModal(false);
                    if (
                      data?.establishment?.deliveryFeeType ===
                        "byNeighborhood" &&
                      !selectedNeighborhood &&
                      neighborhoodFeesData &&
                      neighborhoodFeesData.length > 0
                    ) {
                      // Precisa selecionar bairro primeiro — NÃO abrir modal de produto agora
                      // pendingProduct continua salvo e será aberto após selecionar o bairro
                      setShowNeighborhoodModal(true);
                    } else if (pendingProduct) {
                      setModalImageIndex(0);
                      setSelectedProduct(pendingProduct);
                      setProductQuantity(1);
                      setProductObservation("");
                      setPendingProduct(null);
                    }
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-left rounded-xl flex items-center gap-3 transition-colors border",
                    deliveryType === "delivery"
                      ? "bg-red-50 border-red-300 shadow-sm"
                      : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      deliveryType === "delivery" ? "bg-red-100" : "bg-gray-100"
                    )}
                  >
                    <Bike
                      className={cn(
                        "h-5 w-5",
                        deliveryType === "delivery"
                          ? "text-red-500"
                          : "text-gray-500"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-800 text-sm">
                      Delivery
                    </span>
                    <p className="text-xs text-gray-500">
                      Receba no seu endereço
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </button>
              )}

              {data.establishment.allowsPickup && (
                <button
                  onClick={() => {
                    setDeliveryType("pickup");
                    setDeliveryTypeChosen(true);
                    setShowDeliveryTypeModal(false);
                    if (pendingProduct) {
                      setModalImageIndex(0);
                      setSelectedProduct(pendingProduct);
                      setProductQuantity(1);
                      setProductObservation("");
                      setPendingProduct(null);
                    }
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-left rounded-xl flex items-center gap-3 transition-colors border",
                    deliveryType === "pickup"
                      ? "bg-green-50 border-green-300 shadow-sm"
                      : "bg-white border-gray-200 hover:bg-green-50 hover:border-green-300"
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      deliveryType === "pickup" ? "bg-green-100" : "bg-gray-100"
                    )}
                  >
                    <Package
                      className={cn(
                        "h-5 w-5",
                        deliveryType === "pickup"
                          ? "text-green-500"
                          : "text-gray-500"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-800 text-sm">
                      Retirar no local
                    </span>
                    <p className="text-xs text-gray-500">
                      Retire no estabelecimento
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Grátis
                  </span>
                </button>
              )}

              {data.establishment.allowsDineIn && (
                <button
                  onClick={() => {
                    setDeliveryType("dine_in");
                    setDeliveryTypeChosen(true);
                    setShowDeliveryTypeModal(false);
                    if (pendingProduct) {
                      setModalImageIndex(0);
                      setSelectedProduct(pendingProduct);
                      setProductQuantity(1);
                      setProductObservation("");
                      setPendingProduct(null);
                    }
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-left rounded-xl flex items-center gap-3 transition-colors border",
                    deliveryType === "dine_in"
                      ? "bg-blue-50 border-blue-300 shadow-sm"
                      : "bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      deliveryType === "dine_in" ? "bg-blue-100" : "bg-gray-100"
                    )}
                  >
                    <UtensilsCrossed
                      className={cn(
                        "h-5 w-5",
                        deliveryType === "dine_in"
                          ? "text-blue-500"
                          : "text-gray-500"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-800 text-sm">
                      Consumir no local
                    </span>
                    <p className="text-xs text-gray-500">
                      Coma no estabelecimento
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Grátis
                  </span>
                </button>
              )}
            </div>

            {/* Footer */}
            <div
              className="border-t px-6 py-4"
              style={{ backgroundColor: "#ffffff" }}
            >
              <p className="text-xs text-gray-400 text-center">
                Você poderá alterar depois no checkout
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Bairro */}
      {showNeighborhoodModal &&
        neighborhoodFeesData &&
        neighborhoodFeesData.length > 0 && (
          <div
            className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center"
            onTouchMove={e => {
              // Permitir scroll apenas dentro da lista de bairros
              const target = e.target as HTMLElement;
              const scrollableParent = target.closest(
                '[data-neighborhood-scrollable="true"]'
              );
              if (!scrollableParent) {
                e.preventDefault();
              }
            }}
          >
            {/* Backdrop - clique para fechar */}
            <div
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
              onClick={() => setShowNeighborhoodModal(false)}
            />

            {/* Modal - Bottom Sheet no mobile, aumentado 20% no desktop */}
            <div
              className="relative bg-gray-200 rounded-t-[30px] overflow-hidden md:rounded-[30px] shadow-2xl w-full md:max-w-[520px] md:mx-4 max-h-[80vh] overflow-hidden overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 flex flex-col"
              style={{ touchAction: "pan-y" }}
            >
              {/* Header - estilo vermelho, mesma altura do modal da sacola */}
              <div
 className="flex-shrink-0 bg-gradient-to-r from-red-500 to-red-500 px-5 flex items-center justify-between overflow-hidden overflow-hidden"
                style={{
                  paddingTop: "12px",
                  paddingBottom: "12px",
                  height: "67px",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1.5 bg-white/20 rounded-lg flex-shrink-0">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-white leading-tight truncate">
                      Selecione seu Bairro
                    </h2>
                    <p className="text-xs text-white/80">Área de entrega</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNeighborhoodModal(false)}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Fechar seleção de bairro"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Campo de Busca */}
              <div className="px-5 py-4 bg-white border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar bairro..."
                    value={neighborhoodSearch || ""}
                    onChange={e => setNeighborhoodSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder:text-gray-400"
                  />
                  {neighborhoodSearch && (
                    <button
                      onClick={() => setNeighborhoodSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* Opções Fixas - Retirar no Local e Consumir no Local */}
              {(establishment.allowsPickup || establishment.allowsDineIn) && (
                <div className="px-5 pt-3 pb-2 bg-white border-b border-gray-200">
                  <div className="flex flex-col md:flex-row gap-2">
                    {/* Opção Retirar no Local */}
                    {establishment.allowsPickup && (
                      <button
                        onClick={() => {
                          setSelectedNeighborhood(null);
                          setDeliveryType("pickup");
                          setDeliveryTypeChosen(true);
                          setShowNeighborhoodModal(false);
                          setNeighborhoodSearch("");
                          // Abrir produto pendente se houver
                          if (pendingProduct) {
                            setTimeout(() => {
                              setModalImageIndex(0);
                              setSelectedProduct(pendingProduct);
                              setProductQuantity(1);
                              setProductObservation("");
                              setPendingProduct(null);
                            }, 150);
                          }
                          if (reopenBagAfterNeighborhood) {
                            setReopenBagAfterNeighborhood(false);
                            setTimeout(() => {
                              if (checkoutStep === 0) {
                                setCheckoutStep(1);
                              } else {
                                setShowMobileBag(true);
                              }
                            }, 100);
                          }
                        }}
                        className={cn(
                          "flex-1 px-4 py-2.5 text-left rounded-lg flex items-center justify-between transition-colors border-2",
                          deliveryType === "pickup" && !selectedNeighborhood
                            ? "bg-green-50 border-green-400 shadow-sm"
                            : "bg-gray-50 border-gray-200 hover:bg-green-50 hover:border-green-300"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                              deliveryType === "pickup" && !selectedNeighborhood
                                ? "border-green-500 bg-green-500"
                                : "border-gray-300"
                            )}
                          >
                            {deliveryType === "pickup" &&
                              !selectedNeighborhood && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                          </div>
                          <span className="font-medium text-gray-800 text-sm">
                            Retirar no local
                          </span>
                        </div>
                        <span className="text-green-600 font-bold text-sm">
                          Grátis
                        </span>
                      </button>
                    )}

                    {/* Opção Consumir no Local */}
                    {establishment.allowsDineIn && (
                      <button
                        onClick={() => {
                          setSelectedNeighborhood(null);
                          setDeliveryType("dine_in");
                          setDeliveryTypeChosen(true);
                          setShowNeighborhoodModal(false);
                          setNeighborhoodSearch("");
                          // Abrir produto pendente se houver
                          if (pendingProduct) {
                            setTimeout(() => {
                              setModalImageIndex(0);
                              setSelectedProduct(pendingProduct);
                              setProductQuantity(1);
                              setProductObservation("");
                              setPendingProduct(null);
                            }, 150);
                          }
                          if (reopenBagAfterNeighborhood) {
                            setReopenBagAfterNeighborhood(false);
                            setTimeout(() => {
                              if (checkoutStep === 0) {
                                setCheckoutStep(1);
                              } else {
                                setShowMobileBag(true);
                              }
                            }, 100);
                          }
                        }}
                        className={cn(
                          "flex-1 px-4 py-2.5 text-left rounded-lg flex items-center justify-between transition-colors border-2",
                          deliveryType === "dine_in" && !selectedNeighborhood
                            ? "bg-blue-50 border-blue-400 shadow-sm"
                            : "bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                              deliveryType === "dine_in" &&
                                !selectedNeighborhood
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300"
                            )}
                          >
                            {deliveryType === "dine_in" &&
                              !selectedNeighborhood && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                          </div>
                          <span className="font-medium text-gray-800 text-sm">
                            Consumir no local
                          </span>
                        </div>
                        <span className="text-blue-600 font-bold text-sm">
                          Grátis
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Separador com texto */}
              {(establishment.allowsPickup || establishment.allowsDineIn) && (
                <div className="px-5 py-2 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-gray-400 text-xs font-medium uppercase">
                      ou escolha um bairro para entrega
                    </span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                </div>
              )}

              {/* Body - Lista de Bairros */}
              <div
                className="p-5 space-y-2 overflow-y-auto flex-1 overscroll-contain"
                style={{
                  backgroundColor: "#ffffff",
                  // No mobile: altura para ~4 opções compactas, alinhadas ao tamanho de "Retirar no local"
                  // No desktop: altura maior
                  maxHeight: window.innerWidth < 768 ? "240px" : "350px",
                  WebkitOverflowScrolling: "touch",
                }}
                data-neighborhood-scrollable="true"
              >
                {(() => {
                  const filteredNeighborhoods = neighborhoodFeesData
                    .filter(item =>
                      item.neighborhood
                        .toLowerCase()
                        .includes((neighborhoodSearch || "").toLowerCase())
                    )
                    .sort((a, b) => {
                      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
                        return a.pinned ? -1 : 1;
                      }

                      return a.neighborhood.localeCompare(b.neighborhood, "pt-BR", {
                        sensitivity: "base",
                      });
                    });

                  if (filteredNeighborhoods.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500 font-medium">
                          Nenhum bairro encontrado
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          Tente buscar por outro nome
                        </p>
                      </div>
                    );
                  }

                  return filteredNeighborhoods.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedNeighborhood({
                          name: item.neighborhood,
                          fee: item.fee,
                        });
                        setShowNeighborhoodModal(false);
                        setNeighborhoodSearch("");
                        // Preencher o bairro no endereço de entrega
                        setDeliveryAddress(prev => ({
                          ...prev,
                          neighborhood: item.neighborhood,
                        }));
                        // Selecionar automaticamente a opção de entrega já que o usuário escolheu um bairro
                        setDeliveryType("delivery");
                        // Abrir produto pendente se houver (veio do clique em item sem bairro selecionado)
                        if (pendingProduct) {
                          setTimeout(() => {
                            setModalImageIndex(0);
                            setSelectedProduct(pendingProduct);
                            setProductQuantity(1);
                            setProductObservation("");
                            setPendingProduct(null);
                          }, 150);
                        }
                        // Reabrir a sacola ou checkout se veio do botão Alterar bairro
                        if (reopenBagAfterNeighborhood) {
                          setReopenBagAfterNeighborhood(false);
                          setTimeout(() => {
                            // Se estava no checkout (step 1), voltar para lá
                            if (checkoutStep === 0) {
                              setCheckoutStep(1);
                            } else {
                              setShowMobileBag(true);
                            }
                          }, 100);
                        }
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left rounded-lg flex items-center justify-between transition-colors border-2",
                        selectedNeighborhood?.name === item.neighborhood
                          ? "bg-red-50 border-red-300 shadow-sm"
                          : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                            selectedNeighborhood?.name === item.neighborhood
                              ? "border-red-500 bg-red-500"
                              : "border-gray-300"
                          )}
                        >
                          {selectedNeighborhood?.name === item.neighborhood && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className="font-medium text-gray-800 text-sm truncate">
                          {item.neighborhood}
                        </span>
                      </div>
                      {Number(item.fee) === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-50 border border-red-200 text-red-500 font-semibold text-sm flex-shrink-0">
                          <Check className="h-3 w-3" />
                          Grátis
                        </span>
                      ) : (
                        <span className="text-red-500 font-semibold text-sm flex-shrink-0">
                          R$ {Number(item.fee).toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </button>
                  ));
                })()}
              </div>

              {/* Footer */}
              <div
                className="border-t px-6 py-5"
                style={{ backgroundColor: "#ffffff" }}
              >
                <button
                  onClick={() => {
                    setShowNeighborhoodModal(false);
                    setNeighborhoodSearch("");
                  }}
                  className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-base"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Modal de Categorias - Bottom Sheet no mobile, Modal centralizado no desktop */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={() => {
              setShowCategoriesModal(false);
              setCategorySearch("");
            }}
          />

          {/* Modal Content - Bottom Sheet no mobile (80% da tela), Modal centralizado no desktop */}
          <div
            className="relative bg-gray-200 rounded-t-[30px] overflow-hidden md:rounded-[30px] shadow-2xl w-full md:max-w-md md:mx-4 overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300"
            style={{
              height: "min(80vh, 600px)",
              maxHeight: "80vh",
              touchAction: "pan-y",
            }}
          >
            {/* Header - estilo vermelho */}
            <div
              className="sticky top-0 z-[50] bg-gradient-to-r from-red-500 to-red-500 px-5 overflow-hidden flex items-center"
              style={{
                height: "67px",
                paddingTop: "12px",
                paddingBottom: "12px",
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Menu className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Categorias</h2>
                    <p className="text-sm text-white/80">
                      Navegue pelo cardápio
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCategoriesModal(false);
                    setCategorySearch("");
                  }}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Campo de Busca */}
            <div className="px-4 py-3 bg-white border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar categoria..."
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
                  >
                    <X className="h-3 w-3 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Categorias */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-2"
              style={{
                backgroundColor: "#ffffff",
                maxHeight: "calc(80vh - 68px - 60px)",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {(() => {
                const filteredCategories = categories.filter(
                  (cat: (typeof categories)[number]) =>
                    cat.name
                      .toLowerCase()
                      .includes(categorySearch.toLowerCase())
                );

                if (filteredCategories.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        Nenhuma categoria encontrada
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Tente buscar por outro nome
                      </p>
                    </div>
                  );
                }

                return filteredCategories.map(
                  (category: (typeof filteredCategories)[number]) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        scrollToCategory(category.id);
                        setShowCategoriesModal(false);
                        setCategorySearch("");
                      }}
                      className={cn(
                        "w-full px-4 py-3.5 text-left rounded-xl flex items-center justify-between transition-colors border",
                        activeCategory === category.id
                          ? "bg-red-50 border-red-300 shadow-sm"
                          : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            activeCategory === category.id
                              ? "bg-red-500"
                              : "bg-gray-300"
                          )}
                        />
                        <span
                          className={cn(
                            "font-medium",
                            activeCategory === category.id
                              ? "text-red-500"
                              : "text-gray-700"
                          )}
                        >
                          {category.name}
                        </span>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4",
                          activeCategory === category.id
                            ? "text-red-400"
                            : "text-gray-400"
                        )}
                      />
                    </button>
                  )
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Drawer - desliza da direita */}
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            {/* Header */}
            <div
              className="bg-gradient-to-r from-red-500 to-red-500 px-5 flex items-center justify-between"
              style={{
                height: "67px",
                paddingTop: "12px",
                paddingBottom: "12px",
              }}
            >
              <span className="text-white font-bold text-lg">Menu</span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-2">
              {/* Pedidos */}
              {!isLitePlan && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowOrdersModal(true);
                    }}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors relative"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50">
                      <ClipboardList className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-semibold text-gray-900">
                        Meus Pedidos
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Acompanhe seus pedidos
                      </p>
                    </div>
                    {userOrders.filter(
                      o => o.status !== "delivered" && o.status !== "cancelled"
                    ).length > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {
                          userOrders.filter(
                            o =>
                              o.status !== "delivered" &&
                              o.status !== "cancelled"
                          ).length
                        }
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              )}

              {/* Fidelidade (se habilitado) - escondido no Lite */}
              {!isLitePlan &&
                loyaltyEnabled?.enabled &&
                !cashbackEnabled?.enabled && (
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      openLoyaltyFlow();
                    }}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="relative w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                      <span className="absolute inset-0 animate-ping rounded-xl bg-red-400/20" />
                      <Heart className="h-5 w-5 text-red-500 relative z-10" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-semibold text-gray-900">
                        Fidelidade
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Programa de fidelidade
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              {!isLitePlan && cashbackEnabled?.enabled && (
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowCashbackModal(true);
                    if (!isCashbackLoggedIn) {
                      setCashbackStep("login");
                    } else {
                      setCashbackStep("wallet");
                      cashbackBalanceQuery.refetch();
                    }
                  }}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Wallet className="h-5 w-5 text-blue-500 animate-wallet-tilt" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-gray-900">
                      Minha Carteira
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Saldo de cashback
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Menu Spotlight Overlay - aparece após o primeiro pedido */}
      {data?.establishment?.id && canShowPublicChat && (
        <PublicChatWidget
          establishmentId={data.establishment.id}
          customerPhone={customerInfo.phone || ""}
          customerName={customerInfo.name || ""}
          activeOrderIds={publicChatActiveOrderIds}
          isCartBarVisible={cart.length > 0}
        />
      )}

      {showMenuSpotlight && (
        <MenuSpotlight
          targetRef={
            window.innerWidth >= 768
              ? desktopPedidosButtonRef
              : mobileMenuButtonRef
          }
          onDismiss={() => setShowMenuSpotlight(false)}
          onOpenMenu={() => {
            setShowMenuSpotlight(false);
            if (window.innerWidth >= 768) {
              // Desktop: abrir modal de pedidos diretamente
              setShowOrdersModal(true);
            } else {
              // Mobile: abrir menu lateral
              setShowMobileMenu(true);
            }
          }}
          reviewsEnabled={showPublicReviews}
          loyaltyEnabled={!!loyaltyEnabled?.enabled}
          cashbackEnabled={!!cashbackEnabled?.enabled}
        />
      )}
    </div>
  );
}

// Componente para linha de horário com destaque para o dia atual
function ScheduleRow({
  day,
  hours,
  dayIndex,
}: {
  day: string;
  hours: string;
  dayIndex: number;
}) {
  const today = new Date().getDay();
  const isToday = today === dayIndex;

  return (
    <div
      className={`flex justify-between items-center py-2.5 px-3 rounded-lg transition-colors ${
        isToday ? "bg-red-50 border border-red-200" : "hover:bg-gray-50"
      }`}
    >
      <span
        className={`font-medium ${isToday ? "text-red-500" : "text-gray-700"}`}
      >
        {day}
        {isToday && (
          <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-lg">
            Hoje
          </span>
        )}
      </span>
      <span
        className={`text-sm ${isToday ? "text-red-500 font-semibold" : "text-gray-500"}`}
      >
        {hours}
      </span>
    </div>
  );
}
