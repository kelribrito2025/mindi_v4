import { AdminLayout, getCollaboratorSession, HREF_TO_PERMISSION } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { getThumbUrl } from "../../../shared/imageUtils";
import { BlurImage } from "@/components/BlurImage";
import { ComplementGroups } from "@/components/ComplementGroups";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/useMobile";
import { useSearch } from "@/contexts/SearchContext";
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Bike, 
  Plus, 
  Minus, 
  Trash2, 
  X,
  Share2,
  Clock,
  Search,
  Image as ImageIcon,
  Eye,
  Menu,
  Check,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  List,
  Pencil,
  ChevronDown,
  CreditCard,
  Banknote,
  QrCode,
  Copy,
  MapPin,
  ChevronUp,
  Ticket,
  Wallet,
  DollarSign,
  Star,
  Undo2,
  User,
  Loader2,
  Save,
  MessageCircle,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

// Tipos
type OrderType = "mesa" | "retirada" | "entrega";
type PaymentMethodType = "cash" | "card" | "pix" | null;

// Função helper para calcular preço do complemento baseado no contexto (PDV)
function getComplementPricePDV(
  item: { price: string | number; priceMode?: string; freeOnDelivery?: boolean; freeOnPickup?: boolean; freeOnDineIn?: boolean },
  orderType: OrderType
): number {
  const deliveryTypeMap: Record<OrderType, 'delivery' | 'pickup' | 'dine_in'> = {
    mesa: 'dine_in', retirada: 'pickup', entrega: 'delivery'
  };
  const ctx = deliveryTypeMap[orderType];
  if (item.priceMode === 'free') {
    if (ctx === 'delivery' && item.freeOnDelivery) return 0;
    if (ctx === 'pickup' && item.freeOnPickup) return 0;
    if (ctx === 'dine_in' && item.freeOnDineIn) return 0;
    if (!item.freeOnDelivery && !item.freeOnPickup && !item.freeOnDineIn) return 0;
    return Number(item.price);
  }
  return Number(item.price);
}

type CartItem = {
  productId: number;
  name: string;
  price: string;
  quantity: number;
  observation: string;
  image: string | null;
  complements: Array<{ id: number; name: string; price: string; quantity: number }>;
};

type PendingPixOrderSnapshot = {
  orderType: OrderType;
  cart: CartItem[];
  deliveryAddress: {
    name: string;
    phone: string;
    street: string;
    number: string;
    neighborhood: string;
    complement: string;
    reference: string;
  };
  pickupClientName: string;
  pickupClientPhone: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  total: number;
  paymentMethod: PaymentMethodType;
  receivedAmount: string;
  changeAmount: string;
};

type PendingPixWhatsappOrder = {
  id: number;
  orderNumber: string;
  transactionId?: string;
  total?: number;
  qrCodeBase64?: string;
  createdAt?: string;
  status?: 'PENDING' | 'APPROVED' | 'CANCELLED' | 'FAILED' | 'EXPIRED';
  snapshot?: PendingPixOrderSnapshot;
};

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  promotionalPrice?: string | null;
  minComplementPrice?: string | number | null;
  images: string[] | null;
  status: 'active' | 'paused' | 'archived';
  hasStock: boolean;
  stockQuantity: number | null;
  availableStock?: number | null;
  outOfStock?: boolean;
  categoryId: number | null;
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

type Category = {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export default function PDV() {
  const [, setLocation] = useLocation();
  const { data: establishment } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  const hasOnlinePixPaymentEnabled = Boolean(
    establishment?.paytimeEnabled || establishment?.onlinePaymentEnabled
  );
  const pendingPixOrderSnapshotRef = useRef<PendingPixOrderSnapshot | null>(null);

  // Buscar categorias e produtos
  const { data: categories, isLoading: categoriesLoading } = trpc.category.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  const { data: products, isLoading: productsLoading } = trpc.product.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Query para buscar configurações de impressão (para saber o método favorito)
  const { data: printerSettings } = trpc.printer.getSettings.useQuery(
    { establishmentId: establishmentId ?? 0 },
    { enabled: !!establishmentId && establishmentId > 0 }
  );

  // Função para imprimir pedido (Impressão Normal) - usa iframe oculto para não abrir nova aba
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
      console.error("Erro ao imprimir pedido:", error);
    }
  };

  // Função para imprimir em múltiplas impressoras (Android)
  const handlePrintMultiPrinter = async (orderId: number) => {
    try {
      const response = await fetch(`${window.location.origin}/api/print/multiprinter-sectors/${orderId}`);
      const data = await response.json();
      
      if (data.success && data.deepLink) {
        window.location.href = data.deepLink;
      }
    } catch (error) {
      console.error("Erro ao imprimir em múltiplas impressoras:", error);
    }
  };

  // Função para imprimir usando o método favorito
  const handlePrintWithFavoriteMethod = async (orderId: number) => {
    const printMethod = printerSettings?.defaultPrintMethod || 'normal';
    
    if (printMethod === 'automatic') {
      // Impressão automática via Mindi Printer - não faz nada no frontend
      return;
    } else {
      await handlePrintOrderDirect(orderId);
    }
  };

  const trpcUtils = trpc.useUtils();

  // Mutation para criar pedido
  const createOrderMutation = trpc.order.create.useMutation({
    onSuccess: (data) => {
      toast.success("Pedido criado com sucesso!", {
        description: `Pedido ${data.orderNumber} criado e em preparação`,
      });
      
      // Salvar/atualizar dados do cliente PDV
      if (establishmentId) {
        const phone = orderType === "retirada" 
          ? pickupClientPhone.replace(/\D/g, "") 
          : deliveryAddress.phone.replace(/\D/g, "");
        const name = orderType === "retirada" ? pickupClientName : deliveryAddress.name;
        
        if (phone && phone.length >= 8) {
          pdvCustomerUpsertMutation.mutate({
            establishmentId,
            phone,
            name: name || undefined,
            ...(orderType === "entrega" ? {
              street: deliveryAddress.street || undefined,
              number: deliveryAddress.number || undefined,
              complement: deliveryAddress.complement || undefined,
              neighborhood: deliveryAddress.neighborhood || undefined,
              reference: deliveryAddress.reference || undefined,
            } : {}),
          });
        }
      }
      
      // Imprimir pedido automaticamente usando o método favorito
      if (data.id) {
        handlePrintWithFavoriteMethod(data.id);
      }
      
      clearCart();
      // Manter na página do PDV para continuar atendendo
    },
    onError: (error) => {
      toast.error("Erro ao criar pedido", {
        description: error.message,
      });
    },
  });

  // Mutation para criar pedido com cobrança PIX enviada por WhatsApp
  const createPixWhatsappOrderMutation = trpc.order.createWithPixWhatsapp.useMutation({
    onSuccess: (data) => {
      toast.success("Cobrança PIX enviada pelo WhatsApp!", {
        description: `Pedido ${data.orderNumber} aguardando pagamento`,
      });
      const pendingSnapshot = pendingPixOrderSnapshotRef.current || undefined;
      const pendingPixOrder: PendingPixWhatsappOrder = {
        id: data.id,
        orderNumber: data.orderNumber,
        transactionId: data.transactionId,
        total: Number(data.amountCents || 0) / 100,
        qrCodeBase64: data.qrCodeBase64,
        createdAt: new Date().toISOString(),
        status: 'PENDING' as const,
        snapshot: pendingSnapshot,
      };
      setPendingPixWhatsappOrder(pendingPixOrder);
      try {
        sessionStorage.setItem('pixPendingOrder', JSON.stringify(pendingPixOrder));
      } catch (e) { /* ignore */ }
      window.dispatchEvent(new CustomEvent('pixPendingUpdate', {
        detail: {
          total: Number(data.amountCents || 0) / 100,
          orderNumber: data.orderNumber,
          orderId: data.id,
          id: data.id,
          transactionId: data.transactionId,
          status: 'PENDING',
          snapshot: pendingSnapshot,
        },
      }));
      setShowConfirmationModal(false);
      setShowPixWhatsappPendingModal(true);
      clearCart(false);
      pendingPixOrderSnapshotRef.current = null;
    },
    onError: (error) => {
      window.dispatchEvent(new CustomEvent('pixPendingUpdate', { detail: null }));
      toast.error("Erro ao enviar cobrança PIX pelo WhatsApp", {
        description: error.message,
      });
    },
  });

  const cancelPixWhatsappOrderMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Pedido cancelado com sucesso");
      setPendingPixWhatsappOrder(null);
      setShowPixWhatsappPendingModal(false);
      setShowConfirmationModal(false);
      try {
        sessionStorage.removeItem('pixPendingOrder');
      } catch { /* ignore */ }
      window.dispatchEvent(new CustomEvent('pixPendingUpdate', { detail: null }));
      trpcUtils.orders.list.invalidate();
      trpcUtils.order.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao cancelar pedido", {
        description: error.message,
      });
    },
  });

  // Estados
  const [orderType, setOrderType] = useState<OrderType>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('pdv_orderType');
      if (saved === 'mesa' || saved === 'retirada' || saved === 'entrega') return saved;
    }
    return "mesa";
  });
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [pdvViewMode, setPdvViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pdv_viewMode');
      if (saved === 'grid' || saved === 'list') return saved;
    }
    return 'list';
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('pdv_cart');
        if (saved) return JSON.parse(saved);
      } catch (e) { /* ignore */ }
    }
    return [];
  });
  const { searchQuery: globalSearch } = useSearch();
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  // Combinar busca global (topbar) com busca local do PDV
  const searchQuery = globalSearch || localSearchQuery;
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productObservation, setProductObservation] = useState("");
  // Campo de mesa removido - agora usamos a página de Mesas
  // Map<groupId, Map<itemId, quantity>>
  const [selectedComplements, setSelectedComplements] = useState<Map<number, Map<number, number>>>(new Map());
  const [isClosingProductModal, setIsClosingProductModal] = useState(false);
  const [showProductShareDropdown, setShowProductShareDropdown] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const productShareDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedComplementImage, setSelectedComplementImage] = useState<string | null>(null);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [expandedCartItem, setExpandedCartItem] = useState<number | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<{index: number; item: CartItem} | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  
  // Estados para entrega
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('pdv_deliveryAddress');
        if (saved) return JSON.parse(saved);
      } catch (e) { /* ignore */ }
    }
    return { name: "", phone: "", street: "", number: "", neighborhood: "", complement: "", reference: "", customerId: null as number | null };
  });

  // PDV Customer - busca automática por telefone
  const [pdvCustomerFound, setPdvCustomerFound] = useState(false);
  // Inicializa os refs com os telefones já salvos em sessão para não repetir o toast ao remontar o PDV.
  const deliveryToastShownForRef = useRef<string | null>((() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('pdv_deliveryAddress');
        if (saved) {
          const parsed = JSON.parse(saved);
          const digits = (parsed.phone || '').replace(/\D/g, '');
          if (digits.length >= 10) return digits;
        }
      } catch { /* ignore */ }
    }
    return null;
  })());
  const pickupToastShownForRef = useRef<string | null>((() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('pdv_pickupPhone');
        if (saved) {
          const digits = saved.replace(/\D/g, '');
          if (digits.length >= 10) return digits;
        }
      } catch { /* ignore */ }
    }
    return null;
  })());
  // Sidebar de edição de cliente
  const [showEditCustomerSheet, setShowEditCustomerSheet] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState({ name: "", phone: "", originalPhone: "", customerId: null as number | null, street: "", number: "", neighborhood: "", complement: "", reference: "" });
  const [editCustomerShowNeighborhoodList, setEditCustomerShowNeighborhoodList] = useState(false);
  const [editCustomerNeighborhoodSearch, setEditCustomerNeighborhoodSearch] = useState("");
  // Autocomplete de nome de cliente
  const [showNameAutocomplete, setShowNameAutocomplete] = useState(false);
  const [showPickupNameAutocomplete, setShowPickupNameAutocomplete] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const pickupNameInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const pickupAutocompleteRef = useRef<HTMLDivElement>(null);
  // Autocomplete de telefone de cliente
  const [showPhoneAutocomplete, setShowPhoneAutocomplete] = useState(false);
  const [showPickupPhoneAutocomplete, setShowPickupPhoneAutocomplete] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const pickupPhoneInputRef = useRef<HTMLInputElement>(null);
  const phoneAutocompleteRef = useRef<HTMLDivElement>(null);
  const pickupPhoneAutocompleteRef = useRef<HTMLDivElement>(null);
  const pdvCustomerUpsertMutation = trpc.pdvCustomer.upsert.useMutation();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('pdv_paymentMethod');
      if (saved === 'cash' || saved === 'card' || saved === 'pix') return saved;
    }
    return "cash";
  });
  const [changeAmount, setChangeAmount] = useState("");
  const [showDeliverySidebar, setShowDeliverySidebar] = useState(false);
  const [showNeighborhoodSelector, setShowNeighborhoodSelector] = useState(false);
  const [pdvNeighborhoodSearch, setPdvNeighborhoodSearch] = useState("");
  const [selectedNeighborhoodFee, setSelectedNeighborhoodFee] = useState<{id: number; neighborhood: string; fee: string} | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('pdv_neighborhoodFee');
        if (saved) return JSON.parse(saved);
      } catch (e) { /* ignore */ }
    }
    return null;
  });

  // Estados para sidebar de pagamento (Retirada)
  const [showPaymentSidebar, setShowPaymentSidebar] = useState(false);
  const [selectedPaymentInSidebar, setSelectedPaymentInSidebar] = useState<PaymentMethodType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pdv_favorite_payment_method');
      return (saved as PaymentMethodType) || "cash";
    }
    return "cash";
  });
  const [receivedAmount, setReceivedAmount] = useState("");
  const [pickupClientName, setPickupClientName] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('pdv_pickupName') || "";
    return "";
  });
  const [pickupClientPhone, setPickupClientPhone] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('pdv_pickupPhone') || "";
    return "";
  });
  
  // Estado para forma de pagamento favorita (salva no localStorage)
  const [favoritePaymentMethod, setFavoritePaymentMethod] = useState<PaymentMethodType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pdv_favorite_payment_method');
      return (saved as PaymentMethodType) || null;
    }
    return null;
  });
  
  // Função para definir forma de pagamento favorita
  const handleSetFavoritePayment = (method: PaymentMethodType) => {
    if (favoritePaymentMethod === method) {
      // Se já é favorito, remove
      setFavoritePaymentMethod(null);
      localStorage.removeItem('pdv_favorite_payment_method');
      toast.success('Favorito removido');
    } else {
      // Define como favorito
      setFavoritePaymentMethod(method);
      if (method) {
        localStorage.setItem('pdv_favorite_payment_method', method);
        toast.success('Forma de pagamento favorita definida!');
      }
    }
  };

  // Estados para cupom
  const [showCouponField, setShowCouponField] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string; discount: number; couponId: number} | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Persistir carrinho no sessionStorage para não perder ao navegar
  useEffect(() => {
    try {
      sessionStorage.setItem('pdv_cart', JSON.stringify(cart));
    } catch (e) { /* ignore */ }
  }, [cart]);

  // Persistir tipo de pedido no sessionStorage
  useEffect(() => {
    sessionStorage.setItem('pdv_orderType', orderType);
  }, [orderType]);

  // Persistir dados de entrega no sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('pdv_deliveryAddress', JSON.stringify(deliveryAddress));
    } catch (e) { /* ignore */ }
  }, [deliveryAddress]);

  // Persistir dados de retirada no sessionStorage
  useEffect(() => {
    sessionStorage.setItem('pdv_pickupName', pickupClientName);
  }, [pickupClientName]);
  useEffect(() => {
    sessionStorage.setItem('pdv_pickupPhone', pickupClientPhone);
  }, [pickupClientPhone]);

  // Persistir forma de pagamento no sessionStorage
  useEffect(() => {
    sessionStorage.setItem('pdv_paymentMethod', paymentMethod || '');
  }, [paymentMethod]);

  // Persistir taxa de bairro selecionada no sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('pdv_neighborhoodFee', selectedNeighborhoodFee ? JSON.stringify(selectedNeighborhoodFee) : '');
    } catch (e) { /* ignore */ }
  }, [selectedNeighborhoodFee]);

  // Estados para limpar/desfazer
  const [clearedCart, setClearedCart] = useState<CartItem[] | null>(null);
  
  // Estado para modal de conferência do pedido
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isClosingOrder, setIsClosingOrder] = useState(false);
  const [showPixWhatsappPendingModal, setShowPixWhatsappPendingModal] = useState(false);
  const [isPollingPixWhatsappStatus, setIsPollingPixWhatsappStatus] = useState(false);
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
          snapshot: parsed.snapshot,
        };

    } catch {
      sessionStorage.removeItem('pixPendingOrder');
      return null;
    }
  });

  useEffect(() => {
    const openPixConfirmation = () => {
      let pendingOrder = pendingPixWhatsappOrder;
      if (!pendingOrder) {
        try {
          const stored = sessionStorage.getItem('pixPendingOrder');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.orderNumber) {
              pendingOrder = {
                id: Number(parsed.id || 0),
                orderNumber: String(parsed.orderNumber),
                transactionId: parsed.transactionId,
                total: typeof parsed.total === 'number' ? parsed.total : undefined,
                qrCodeBase64: parsed.qrCodeBase64,
                createdAt: parsed.createdAt,
                status: parsed.status || 'PENDING',
                snapshot: parsed.snapshot,
              };
              setPendingPixWhatsappOrder(pendingOrder);
            }
          }
        } catch {
          sessionStorage.removeItem('pixPendingOrder');
        }
      }

      if (pendingOrder) {
        setShowPixWhatsappPendingModal(true);
      }
    };

    window.addEventListener('pixOpenConfirmation', openPixConfirmation);

    try {
      if (sessionStorage.getItem('pixOpenConfirmationAfterNavigation') === '1') {
        sessionStorage.removeItem('pixOpenConfirmationAfterNavigation');
        window.setTimeout(openPixConfirmation, 150);
      }
    } catch {
      // Ignora indisponibilidade pontual do sessionStorage.
    }

    return () => window.removeEventListener('pixOpenConfirmation', openPixConfirmation);
  }, [pendingPixWhatsappOrder]);

  // Query para buscar taxas por bairro
  const { data: neighborhoodFees } = trpc.neighborhoodFees.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId && establishment?.deliveryFeeType === "byNeighborhood" }
  );

  // Debug: Monitorar mudanças no estado showDeliverySidebar
  useEffect(() => {
    console.log("[PDV] showDeliverySidebar changed to:", showDeliverySidebar);
  }, [showDeliverySidebar]);

  // Busca automática de cliente PDV por telefone (Entrega)
  const deliveryPhoneDigits = deliveryAddress.phone.replace(/\D/g, "");
  const { data: deliveryCustomer } = trpc.pdvCustomer.findByPhone.useQuery(
    { establishmentId: establishmentId!, phone: deliveryPhoneDigits },
    { enabled: !!establishmentId && deliveryPhoneDigits.length >= 10 && deliveryPhoneDigits.length <= 11 }
  );

  // Busca automática de cliente PDV por telefone (Retirada)
  const pickupPhoneDigits = pickupClientPhone.replace(/\D/g, "");
  const { data: pickupCustomer } = trpc.pdvCustomer.findByPhone.useQuery(
    { establishmentId: establishmentId!, phone: pickupPhoneDigits },
    { enabled: !!establishmentId && pickupPhoneDigits.length >= 10 && pickupPhoneDigits.length <= 11 }
  );

  // Busca de clientes por nome (autocomplete Entrega)
  const { data: deliveryNameResults } = trpc.pdvCustomer.searchByName.useQuery(
    { establishmentId: establishmentId!, name: deliveryAddress.name.trim() },
    { enabled: !!establishmentId && deliveryAddress.name.trim().length >= 2 && showNameAutocomplete }
  );

  // Busca de clientes por nome (autocomplete Retirada)
  const { data: pickupNameResults } = trpc.pdvCustomer.searchByName.useQuery(
    { establishmentId: establishmentId!, name: pickupClientName.trim() },
    { enabled: !!establishmentId && pickupClientName.trim().length >= 2 && showPickupNameAutocomplete }
  );

  // Busca de clientes por telefone (autocomplete Entrega)
  const deliveryPhoneSearchDigits = deliveryAddress.phone.replace(/\D/g, '');
  const { data: deliveryPhoneResults } = trpc.pdvCustomer.searchByPhone.useQuery(
    { establishmentId: establishmentId!, phone: deliveryPhoneSearchDigits },
    { enabled: !!establishmentId && deliveryPhoneSearchDigits.length >= 3 && showPhoneAutocomplete }
  );

  // Busca de clientes por telefone (autocomplete Retirada)
  const pickupPhoneSearchDigits = pickupClientPhone.replace(/\D/g, '');
  const { data: pickupPhoneResults } = trpc.pdvCustomer.searchByPhone.useQuery(
    { establishmentId: establishmentId!, phone: pickupPhoneSearchDigits },
    { enabled: !!establishmentId && pickupPhoneSearchDigits.length >= 3 && showPickupPhoneAutocomplete }
  );

  // Fechar autocomplete ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node) &&
          nameInputRef.current && !nameInputRef.current.contains(e.target as Node)) {
        setShowNameAutocomplete(false);
      }
      if (pickupAutocompleteRef.current && !pickupAutocompleteRef.current.contains(e.target as Node) &&
          pickupNameInputRef.current && !pickupNameInputRef.current.contains(e.target as Node)) {
        setShowPickupNameAutocomplete(false);
      }
      if (phoneAutocompleteRef.current && !phoneAutocompleteRef.current.contains(e.target as Node) &&
          phoneInputRef.current && !phoneInputRef.current.contains(e.target as Node)) {
        setShowPhoneAutocomplete(false);
      }
      if (pickupPhoneAutocompleteRef.current && !pickupPhoneAutocompleteRef.current.contains(e.target as Node) &&
          pickupPhoneInputRef.current && !pickupPhoneInputRef.current.contains(e.target as Node)) {
        setShowPickupPhoneAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper: formatar telefone brasileiro (remove prefixo 55 se presente)
  const formatBrazilPhone = useCallback((phone: string) => {
    let digits = phone.replace(/\D/g, '');
    // Remover prefixo 55 (código do Brasil) se presente
    if (digits.length >= 12 && digits.startsWith('55')) {
      digits = digits.slice(2);
    }
    if (digits.length === 11) {
      return `(${digits.slice(0,2)}) ${digits.slice(2,3)} ${digits.slice(3,7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
      return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
    }
    return phone;
  }, []);

  // Helper: selecionar cliente do autocomplete (Entrega)
  const selectDeliveryCustomer = useCallback((customer: { id?: number; name: string | null; phone: string; street: string | null; number: string | null; complement: string | null; neighborhood: string | null; reference: string | null }) => {
    const formattedPhone = formatBrazilPhone(customer.phone || '');
    setDeliveryAddress({
      name: customer.name || '',
      phone: formattedPhone,
      street: customer.street || '',
      number: customer.number || '',
      complement: customer.complement || '',
      neighborhood: customer.neighborhood || '',
      reference: customer.reference || '',
      customerId: customer.id || null,
    });
    setShowNameAutocomplete(false);
    setPdvCustomerFound(true);
    // Auto-selecionar bairro/taxa se o cliente tem bairro cadastrado e o tipo é byNeighborhood
    if (customer.neighborhood && neighborhoodFees && neighborhoodFees.length > 0) {
      const customerNeighborhood = (customer.neighborhood || '').toLowerCase().trim();
      // Tentar match exato primeiro, depois parcial (contains)
      const matchingFee = neighborhoodFees.find(
        (fee) => fee.neighborhood.toLowerCase().trim() === customerNeighborhood
      ) || neighborhoodFees.find(
        (fee) => customerNeighborhood.includes(fee.neighborhood.toLowerCase().trim()) || fee.neighborhood.toLowerCase().trim().includes(customerNeighborhood)
      );
      if (matchingFee) {
        setSelectedNeighborhoodFee(matchingFee);
        setShowNeighborhoodSelector(false);
      }
    }
    toast.success('Cliente selecionado!', { description: customer.name || 'Dados preenchidos', duration: 2000 });
  }, [neighborhoodFees]);

  // Helper: selecionar cliente do autocomplete (Retirada)
  const selectPickupCustomer = useCallback((customer: { name: string | null; phone: string }) => {
    setPickupClientName(customer.name || '');
    const formattedPhone = formatBrazilPhone(customer.phone || '');
    setPickupClientPhone(formattedPhone);
    setShowPickupNameAutocomplete(false);
    setPdvCustomerFound(true);
    toast.success('Cliente selecionado!', { description: customer.name || 'Dados preenchidos', duration: 2000 });
  }, []);

  // Preencher dados do cliente automaticamente (Entrega)
  useEffect(() => {
    if (deliveryCustomer && deliveryPhoneDigits.length >= 10) {
      setPdvCustomerFound(true);
      setDeliveryAddress((prev: { name: string; phone: string; street: string; number: string; neighborhood: string; complement: string; reference: string; customerId: number | null }) => ({
        ...prev,
        name: prev.name || deliveryCustomer.name || "",
        street: prev.street || deliveryCustomer.street || "",
        number: prev.number || deliveryCustomer.number || "",
        complement: prev.complement || deliveryCustomer.complement || "",
        neighborhood: prev.neighborhood || deliveryCustomer.neighborhood || "",
        reference: prev.reference || deliveryCustomer.reference || "",
        customerId: (deliveryCustomer as any).id || prev.customerId,
      }));
      // Auto-selecionar bairro/taxa se o cliente tem bairro cadastrado
      if (deliveryCustomer.neighborhood && neighborhoodFees && neighborhoodFees.length > 0) {
        const customerNeighborhood = (deliveryCustomer.neighborhood || '').toLowerCase().trim();
        // Tentar match exato primeiro, depois parcial (contains)
        const matchingFee = neighborhoodFees.find(
          (fee) => fee.neighborhood.toLowerCase().trim() === customerNeighborhood
        ) || neighborhoodFees.find(
          (fee) => customerNeighborhood.includes(fee.neighborhood.toLowerCase().trim()) || fee.neighborhood.toLowerCase().trim().includes(customerNeighborhood)
        );
        if (matchingFee) {
          setSelectedNeighborhoodFee(matchingFee);
          setShowNeighborhoodSelector(false);
        }
      }
      if (deliveryToastShownForRef.current !== deliveryPhoneDigits) {
        toast.success("Cliente encontrado!", { description: deliveryCustomer.name || "Dados preenchidos automaticamente", duration: 2000 });
        deliveryToastShownForRef.current = deliveryPhoneDigits;
      }
    }
  }, [deliveryCustomer, neighborhoodFees, deliveryPhoneDigits]);

  // Preencher dados do cliente automaticamente (Retirada)
  useEffect(() => {
    if (pickupCustomer && pickupPhoneDigits.length >= 10) {
      setPdvCustomerFound(true);
      if (!pickupClientName && pickupCustomer.name) {
        setPickupClientName(pickupCustomer.name);
      }
      if (pickupToastShownForRef.current !== pickupPhoneDigits) {
        toast.success("Cliente encontrado!", { description: pickupCustomer.name || "Dados preenchidos automaticamente", duration: 2000 });
        pickupToastShownForRef.current = pickupPhoneDigits;
      }
    }
  }, [pickupCustomer, pickupPhoneDigits, pickupClientName]);

  // Estados para drag horizontal na barra de categorias
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Query para buscar complementos do produto selecionado
  const { data: productComplements } = trpc.publicMenu.getProductComplements.useQuery(
    { productId: selectedProduct?.id || 0 },
    { enabled: !!selectedProduct?.id }
  );

  // Filtrar produtos
  const productsList = products?.products || [];
  // Normalizar texto removendo acentos para busca
  const normalizeText = (text: string) =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredProducts = useMemo(() => productsList.filter((product) => {
    if (product.status !== 'active') return false;
    if (selectedCategory && product.categoryId !== selectedCategory) return false;
    if (searchQuery) {
      const query = normalizeText(searchQuery);
      return (
        normalizeText(product.name).includes(query) ||
        (product.description ? normalizeText(product.description).includes(query) : false)
      );
    }
    return true;
  }) || [], [productsList, selectedCategory, searchQuery]);

  // Ordenar categorias (apenas ativas)
  const sortedCategories = useMemo(() => categories?.filter(c => c.isActive).slice().sort((a, b) => a.sortOrder - b.sortOrder) || [], [categories]);

  // Pré-computar contagem de produtos por categoria
  const categoryCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    productsList.forEach(p => {
      if (p.status === 'active' && p.categoryId != null) {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [productsList]);

  // Verificar se produto tem complementos
  const hasComplements = (productId: number) => {
    // Verificamos se o produto tem grupos de complementos
    // Como não temos essa info no produto, vamos sempre abrir o modal
    return true;
  };

  // Funções de drag horizontal na barra de categorias
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!categoriesContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - categoriesContainerRef.current.offsetLeft);
    setScrollLeft(categoriesContainerRef.current.scrollLeft);
  };

  // Usar useEffect para adicionar listeners no document quando estiver arrastando
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !categoriesContainerRef.current) return;
      e.preventDefault();
      const x = e.pageX - categoriesContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2; // Velocidade do scroll
      categoriesContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, startX, scrollLeft]);

  // Detectar overflow nas categorias
  useEffect(() => {
    const checkOverflow = () => {
      if (categoriesContainerRef.current) {
        const { scrollWidth, clientWidth } = categoriesContainerRef.current;
        setHasOverflow(scrollWidth > clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [sortedCategories]);

  // Funções do carrinho
  const addToCart = (product: Product, quantity: number, observation: string, complements: Array<{ id: number; name: string; price: string; quantity: number }>) => {
    // Para itens com complementos, sempre adiciona como novo item
    if (complements.length > 0) {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          observation,
          image: product.images?.[0] || null,
          complements,
        },
      ]);
    } else {
      const existingIndex = cart.findIndex(
        (item) => item.productId === product.id && 
                 item.observation === observation &&
                 item.complements.length === 0
      );

      if (existingIndex >= 0) {
        const newCart = [...cart];
        newCart[existingIndex].quantity += quantity;
        setCart(newCart);
      } else {
        setCart([
          ...cart,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            observation,
            image: product.images?.[0] || null,
            complements: [],
          },
        ]);
      }
    }

    // Limpar seleções
    setSelectedProduct(null);
    setProductQuantity(1);
    setProductObservation("");
    setSelectedComplements(new Map());
    setSelectedComplementImage(null);
    toast.success(`${product.name} adicionado ao pedido`);
  };

  const updateCartItemQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  const removeCartItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const clearCart = (preserveUndo = true) => {
    // Salvar itens atuais para possível desfazer, exceto quando o pedido já foi enviado como cobrança pendente.
    if (preserveUndo && cart.length > 0) {
      setClearedCart([...cart]);
    } else if (!preserveUndo) {
      setClearedCart(null);
    }
    setCart([]);
    setPaymentMethod(null);
    setDeliveryAddress({
      name: "",
      phone: "",
      street: "",
      number: "",
      neighborhood: "",
      complement: "",
      reference: "",
      customerId: null,
    });
    setSelectedNeighborhoodFee(null);
    setChangeAmount("");
    // Limpar dados de retirada
    setPickupClientName("");
    setPickupClientPhone("");
    // Limpar estado de cliente PDV encontrado
    setPdvCustomerFound(false);
    // Limpar cupom
    setShowCouponField(false);
    setCouponCode("");
    setAppliedCoupon(null);
  };

  // Função para desfazer a limpeza
  const undoClearCart = () => {
    if (clearedCart) {
      setCart(clearedCart);
      setClearedCart(null);
      toast.success("Itens restaurados!");
    }
  };

  // Calcular total (memoizado)
  const calculateTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const itemPrice = parseFloat(item.price);
      const complementsPrice = item.complements.reduce(
        (sum, comp) => sum + parseFloat(comp.price) * comp.quantity,
        0
      );
      return total + (itemPrice + complementsPrice) * item.quantity;
    }, 0);
  }, [cart]);

  // Calcular taxa de entrega centralizada no PDV (suporta grátis, fixa e por bairro)
  const pdvDeliveryFee = useMemo(() => {
    if (orderType !== "entrega") return 0;
    if (!establishment) return 0;

    if (establishment.freeDeliveryEnabled && establishment.freeDeliveryMinValue) {
      const minValue = Number(establishment.freeDeliveryMinValue);
      if (minValue > 0 && calculateTotal >= minValue) return 0;
    }

    if (establishment.deliveryFeeType === "free") return 0;
    if (establishment.deliveryFeeType === "fixed") {
      return Number(establishment.deliveryFeeFixed || 0);
    }
    if (establishment.deliveryFeeType === "byNeighborhood" && selectedNeighborhoodFee) {
      return parseFloat(selectedNeighborhoodFee.fee);
    }
    return 0;
  }, [orderType, establishment, selectedNeighborhoodFee, calculateTotal]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Gerar número do pedido
  const generateOrderNumber = () => {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6);
    return `${timestamp}`;
  };

  // Handler para o botão principal (Pagamento ou Finalizar Pedido)
  const handleMainButtonClick = () => {
    if (cart.length === 0) {
      toast.error("Adicione itens ao pedido");
      return;
    }

    // Para Mesa (Consumo): se não tem forma de pagamento, abre sidebar de pagamento
    if (orderType === "mesa" && !paymentMethod) {
      setShowPaymentSidebar(true);
      return;
    }

    // Para Retirada: se não tem forma de pagamento, abre sidebar de pagamento
    if (orderType === "retirada" && !paymentMethod) {
      setShowPaymentSidebar(true);
      return;
    }

    // Para Entrega: verificar endereço
    if (orderType === "entrega" && (!deliveryAddress.street || !deliveryAddress.number || !deliveryAddress.neighborhood)) {
      toast.error("Preencha os dados de entrega");
      setShowDeliverySidebar(true);
      return;
    }

    // Abrir modal de conferência do pedido
    setShowConfirmationModal(true);
  };

  const buildPdvOrderPayload = (overrides: Record<string, any> = {}) => {
    if (!establishmentId) return null;

    const orderNumber = generateOrderNumber();
    const subtotal = calculateTotal;
    const deliveryFee = pdvDeliveryFee;
    const discount = appliedCoupon?.discount || 0;
    const total = subtotal + deliveryFee - discount;

    const deliveryTypeMap: Record<OrderType, "delivery" | "pickup" | "dine_in"> = {
      mesa: "dine_in",
      retirada: "pickup",
      entrega: "delivery",
    };

    let customerAddress = "";
    if (orderType === "entrega") {
      customerAddress = `${deliveryAddress.street}, ${deliveryAddress.number}`;
      if (deliveryAddress.complement) customerAddress += ` - ${deliveryAddress.complement}`;
      customerAddress += ` - ${deliveryAddress.neighborhood}`;
      if (deliveryAddress.reference) customerAddress += ` (Ref: ${deliveryAddress.reference})`;
    }

    const changeValue = changeAmount || receivedAmount;

    return {
      establishmentId,
      orderNumber,
      customerName: orderType === "retirada" ? (pickupClientName || "Cliente PDV") : (deliveryAddress.name || "Cliente PDV"),
      customerPhone: orderType === "retirada" ? (pickupClientPhone.replace(/\D/g, "") || "") : (deliveryAddress.phone || ""),
      customerAddress,
      deliveryType: deliveryTypeMap[orderType],
      paymentMethod: paymentMethod || "cash",
      subtotal: subtotal.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      discount: discount.toFixed(2),
      couponCode: appliedCoupon?.code || undefined,
      couponId: appliedCoupon?.couponId || undefined,
      total: Math.max(0, total).toFixed(2),
      changeAmount: paymentMethod === "cash" && changeValue ? changeValue.replace(",", ".") : undefined,
      changeFor: paymentMethod === "cash" && changeValue ? changeValue.replace(",", ".") : undefined,
      notes: undefined,
      status: "preparing",
      source: "pdv",
      deliveryAddress: orderType === "entrega" ? {
        street: deliveryAddress.street,
        number: deliveryAddress.number,
        complement: deliveryAddress.complement || undefined,
        neighborhood: deliveryAddress.neighborhood,
        reference: deliveryAddress.reference || undefined,
      } : undefined,
      items: cart.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        price: item.price,
        totalPrice: ((parseFloat(item.price) + item.complements.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0)) * item.quantity).toFixed(2),
        complements: item.complements.map(c => ({
          complementId: c.id,
          name: c.name,
          price: parseFloat(c.price),
          quantity: c.quantity,
        })),
        notes: item.observation || undefined,
      })),
      ...overrides,
    };
  };

  // Criar pedido no banco de dados
  const createOrder = () => {
    const payload = buildPdvOrderPayload();
    if (!payload) {
      toast.error("Estabelecimento não encontrado");
      return;
    }
    createOrderMutation.mutate(payload as any);
  };

  const createPendingPixOrderSnapshot = (): PendingPixOrderSnapshot => ({
    orderType,
    cart: cart.map(item => ({
      ...item,
      complements: item.complements.map(comp => ({ ...comp })),
    })),
    deliveryAddress: {
      name: deliveryAddress.name,
      phone: deliveryAddress.phone,
      street: deliveryAddress.street,
      number: deliveryAddress.number,
      neighborhood: deliveryAddress.neighborhood,
      complement: deliveryAddress.complement,
      reference: deliveryAddress.reference,
    },
    pickupClientName,
    pickupClientPhone,
    subtotal: calculateTotal,
    deliveryFee: pdvDeliveryFee,
    discount: appliedCoupon?.discount || 0,
    couponCode: appliedCoupon?.code,
    total: Math.max(0, calculateTotal + pdvDeliveryFee  - (appliedCoupon?.discount || 0)),
    paymentMethod: "pix",
    receivedAmount,
    changeAmount,
  });

  const createPixWhatsappOrder = () => {
    const payload = buildPdvOrderPayload({ paymentMethod: "pix", status: "pending_payment" });
    if (!payload) {
      toast.error("Estabelecimento não encontrado");
      return;
    }
    const phoneDigits = String(payload.customerPhone || "").replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      toast.error("Informe o telefone do cliente para enviar a cobrança pelo WhatsApp");
      return;
    }
    pendingPixOrderSnapshotRef.current = createPendingPixOrderSnapshot();
    createPixWhatsappOrderMutation.mutate({ ...payload, customerPhone: phoneDigits } as any);
  };

  // Determinar texto e estado do botão principal
  const getMainButtonConfig = () => {
    // Para Mesa (Consumo): se não tem forma de pagamento, mostrar botão Pagamento
    if (orderType === "mesa" && !paymentMethod) {
      return {
        text: "Pagamento",
        icon: <Wallet className="h-5 w-5 mr-2" />,
        disabled: cart.length === 0
      };
    }
    // Para Retirada: se não tem forma de pagamento, mostrar botão Pagamento
    if (orderType === "retirada" && !paymentMethod) {
      return {
        text: "Pagamento",
        icon: <Wallet className="h-5 w-5 mr-2" />,
        disabled: cart.length === 0
      };
    }
    // Para Entrega: mostrar botão Avançar
    if (orderType === "entrega") {
      return {
        text: "Avançar",
        icon: null,
        disabled: cart.length === 0 || createOrderMutation.isPending
      };
    }
    // Após selecionar pagamento: mostrar Finalizar Pedido
    return {
      text: "Finalizar Pedido",
      icon: null,
      disabled: cart.length === 0 || createOrderMutation.isPending
    };
  };

  const mainButtonConfig = getMainButtonConfig();

  // Handler para selecionar forma de pagamento na sidebar
  const handleSelectPaymentMethod = (method: PaymentMethodType) => {
    setPaymentMethod(method);
    setShowPaymentSidebar(false);
  };

  // Adicionar item rapidamente (botão +): se não tem complementos, adiciona direto

  useEffect(() => {
    if (!pendingPixWhatsappOrder?.id || !pendingPixWhatsappOrder.transactionId) return;
    if (pendingPixWhatsappOrder.status && pendingPixWhatsappOrder.status !== 'PENDING') return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const clearPendingPixState = () => {
      setPendingPixWhatsappOrder(null);
      setShowPixWhatsappPendingModal(false);
      try {
        sessionStorage.removeItem('pixPendingOrder');
      } catch { /* ignore */ }
      window.dispatchEvent(new CustomEvent('pixPendingUpdate', { detail: null }));
    };

    const pollPixStatus = async () => {
      if (cancelled) return;
      let shouldContinuePolling = true;
      setIsPollingPixWhatsappStatus(true);
      try {
        const result = await trpcUtils.paytime.checkPixStatus.fetch({
          orderId: pendingPixWhatsappOrder.id,
          transactionId: pendingPixWhatsappOrder.transactionId!,
        });

        if (cancelled) return;

        if (result.isPaid || result.status === 'APPROVED') {
          shouldContinuePolling = false;
          const updatedOrder = { ...pendingPixWhatsappOrder, status: 'APPROVED' as const };
          setPendingPixWhatsappOrder(updatedOrder);
          setShowConfirmationModal(false);
          setShowPixWhatsappPendingModal(false);
          try {
            sessionStorage.removeItem('pixPendingOrder');
          } catch { /* ignore */ }
          window.dispatchEvent(new CustomEvent('pixPendingUpdate', { detail: null }));
          toast.success('Pagamento PIX confirmado!', {
            description: `Pedido #${pendingPixWhatsappOrder.orderNumber} foi liberado para preparo.`,
          });
          trpcUtils.order.list.invalidate();
          trpcUtils.product.list.invalidate();
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
        console.warn('[PDV] Erro ao verificar status PIX WhatsApp:', error);
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
  }, [pendingPixWhatsappOrder?.id, pendingPixWhatsappOrder?.transactionId, pendingPixWhatsappOrder?.status, trpcUtils]);
  const handleQuickAdd = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0)) return;
    
    try {
      const complements = await trpcUtils.publicMenu.getProductComplements.fetch({ productId: product.id });
      const hasComps = complements && complements.length > 0;
      
      if (hasComps) {
        handleProductClick(product);
      } else {
        addToCart(product, 1, '', []);
        toast.success(`${product.name} adicionado!`);
      }
    } catch {
      handleProductClick(product);
    }
  };

  // Handler para abrir modal de produto
  const handleProductClick = (product: Product) => {
    // Produto indisponível apenas quando tem controle de estoque ativo E quantidade = 0
    if (product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0)) return;
    setModalImageIndex(0);
    setFullscreenImageIndex(0);
    setShowFullscreenImage(false);
    setSelectedProduct(product);
    setProductQuantity(1);
    setProductObservation("");
    setSelectedComplements(new Map());
    setSelectedComplementImage(null);
    setShowProductShareDropdown(false);
    setIsEditingMode(false);
    setEditingCartItem(null);
  };

  // Handler para editar item do carrinho (abre o mesmo modal de detalhes)
  const handleEditCartItem = (index: number, item: CartItem) => {
    // Encontrar o produto original
    const product = productsList.find(p => p.id === item.productId);
    if (!product) {
      toast.error("Produto não encontrado");
      return;
    }

    // Primeiro, abrir o modal com o produto selecionado
    // Os complementos serão restaurados pelo useEffect quando productComplements carregar
    setModalImageIndex(0);
    setFullscreenImageIndex(0);
    setShowFullscreenImage(false);
    setSelectedProduct(product);
    setProductQuantity(item.quantity);
    setProductObservation(item.observation);
    setSelectedComplements(new Map()); // Será preenchido pelo useEffect
    setSelectedComplementImage(null);
    setShowProductShareDropdown(false);
    setIsEditingMode(true);
    setEditingCartItem({ index, item });
  };

  // useEffect para restaurar complementos quando editando um item do carrinho
  useEffect(() => {
    if (isEditingMode && editingCartItem && productComplements && productComplements.length > 0) {
      const complementsMap = new Map<number, Map<number, number>>();
      
      // Para cada complemento salvo no item do carrinho
      editingCartItem.item.complements.forEach(savedComp => {
        // Encontrar o grupo que contém esse complemento
        productComplements.forEach(group => {
          const foundItem = group.items.find(item => item.id === savedComp.id);
          if (foundItem) {
            // Adicionar ao mapa usando o groupId correto
            const currentGroupMap = complementsMap.get(group.id) || new Map<number, number>();
            currentGroupMap.set(savedComp.id, savedComp.quantity);
            complementsMap.set(group.id, currentGroupMap);
          }
        });
      });
      
      setSelectedComplements(complementsMap);
    }
  }, [isEditingMode, editingCartItem, productComplements]);

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
      const menuSlug = (establishment as any)?.menuSlug || (establishment as any)?.slug;
      const basePath = menuSlug ? `/menu/${menuSlug}` : window.location.pathname;
      return `${window.location.origin}${basePath}?produto=${productId}`;
    },
    [establishment]
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

  // Auto-play Fade Crossfade para carrossel de imagens do modal de produto
  useEffect(() => {
    if (!selectedProduct) return;
    const images = selectedProduct.images || [];
    if (images.length <= 1) return;

    (window as any).__carouselPaused = false;
    const interval = setInterval(() => {
      if ((window as any).__carouselPaused) return;
      setModalImageIndex(prev => (prev + 1) % images.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [selectedProduct]);

  // Fechar modal de produto com animação slide-down
  const closeProductModal = useCallback(() => {
    setIsClosingProductModal(true);
    setTimeout(() => {
      setSelectedProduct(null);
      setSelectedComplements(new Map());
      setProductObservation("");
      setProductQuantity(1);
      setSelectedComplementImage(null);
      setShowProductShareDropdown(false);
      setShowFullscreenImage(false);
      setFullscreenImageIndex(0);
      setModalImageIndex(0);
      setIsEditingMode(false);
      setEditingCartItem(null);
      setIsClosingProductModal(false);
    }, 300);
  }, []);

  // Obter formas de pagamento disponíveis do estabelecimento
  const getAvailablePaymentMethods = () => {
    const methods: Array<{ id: PaymentMethodType; name: string; description: string; icon: React.ReactNode }> = [];
    
    if (establishment?.acceptsCash) {
      methods.push({
        id: "cash",
        name: "Dinheiro",
        description: "Em espécie",
        icon: <Banknote className="h-5 w-5" />
      });
    }
    
    if (establishment?.acceptsCard) {
      methods.push({
        id: "card",
        name: "Cartão",
        description: "Débito ou Crédito",
        icon: <CreditCard className="h-5 w-5" />
      });
    }
    
    if (establishment?.acceptsPix) {
      methods.push({
        id: "pix",
        name: "Pix",
        description: "Instantâneo",
        icon: <QrCode className="h-5 w-5" />
      });
    }
    
    return methods;
  };

  const availablePaymentMethods = getAvailablePaymentMethods();

  const isMobile = useIsMobile();

  // Bloqueio mobile - PDV é otimizado para desktop/tablet
  if (isMobile) {
    return (
      <AdminLayout>
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-full rounded-t-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.03)]">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-blue-100 opacity-40 scale-125" />
                <div className="relative w-[42px] h-[42px] border-2 border-blue-400 rounded-full flex items-center justify-center bg-white shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                </div>
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-foreground">PDV Desktop</h3>
                <p className="text-[11px] text-muted-foreground">Aviso</p>
              </div>
            </div>

            {/* Message area */}
            <div className="flex items-center gap-2.5 rounded-[14px] p-3.5 mb-4" style={{"background": "linear-gradient(135deg, #eff6ff, #f0f9ff)"}}>
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
              </div>
              <span className="flex-1 text-xs font-medium text-gray-700">O PDV foi projetado para uso em computador ou tablet. Para uma melhor experiência, acesse pelo desktop.</span>
            </div>

            {/* Action */}
            <button
              onClick={() => {
                const cs = getCollaboratorSession();
                if (cs) {
                  const perms = cs.permissions || [];
                  // Find first permission that is NOT pdv (since we are leaving PDV)
                  const firstNonPdv = perms.find(p => p !== "pdv");
                  const route = firstNonPdv
                    ? Object.entries(HREF_TO_PERMISSION).find(([, v]) => v === firstNonPdv)?.[0] || "/"
                    : "/";
                  setLocation(route);
                } else {
                  setLocation("/");
                }
              }}
              className="w-full rounded-[20px] h-11 text-[13px] font-semibold bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              Voltar ao Painel
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] -m-6 overflow-hidden">
        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Coluna Esquerda - Produtos */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Barra de Categorias */}
            <div className="relative px-4 py-2 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                {/* Botão de Menu de Categorias - Fixo */}
                <button
                  onClick={() => setShowCategoriesModal(true)}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-card text-muted-foreground hover:bg-muted border border-border/50 transition-colors shrink-0 cursor-pointer"
                  title="Ver todas as categorias"
                >
                  <Menu className="h-5 w-5" />
                </button>
                {/* Área de categorias com drag */}
                <div 
                  ref={categoriesContainerRef}
                  className={cn(
                    "flex items-center gap-2 overflow-x-auto pr-12 scrollbar-hide select-none flex-1",
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                  )}
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  onMouseDown={handleMouseDown}
                >
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                    selectedCategory === null
                      ? "bg-red-500 text-white shadow-sm"
                      : "bg-card text-muted-foreground hover:bg-muted border border-border/50"
                  )}
                >
                  Todos
                  <span className={cn(
                    "absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-semibold",
                    selectedCategory === null ? "bg-white text-red-500" : "bg-red-500 text-white"
                  )} style={{marginTop: '6px'}}>
                    {Object.values(categoryCounts).reduce((a, b) => a + b, 0)}
                  </span>
                </button>
                {categoriesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-32" />
                  ))
                ) : (
                  sortedCategories.map((category) => {
                    const count = categoryCounts[category.id] || 0;
                    // Remover emojis do nome da categoria
                    const categoryNameWithoutEmoji = category.name.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+|[\u2600-\u27BF]/g, '').trim();
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={cn(
                          "relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                          selectedCategory === category.id
                            ? "bg-red-500 text-white shadow-sm"
                            : "bg-card text-muted-foreground hover:bg-muted border border-border/50"
                        )}
                      >
                        {categoryNameWithoutEmoji}
                        <span className={cn(
                          "absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-semibold",
                          selectedCategory === category.id ? "bg-white text-red-500" : "bg-red-500 text-white"
                        )} style={{marginTop: '6px'}}>
                          {count}
                        </span>
                      </button>
                    );
                  })
                )}
                </div>
              </div>
              {/* Indicador de mais categorias - Botão redondo com seta */}
              {hasOverflow && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center z-10">
                  <button
                    onClick={() => {
                      if (categoriesContainerRef.current) {
                        categoriesContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-border/50 shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:shadow-lg transition-[colors,box-shadow] cursor-pointer"
                    title="Mais categorias"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>


            {/* Grid/Lista de Produtos */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Contagem de produtos + Toggle Grid/Lista */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  {selectedCategory === null
                    ? `${Object.values(categoryCounts).reduce((a, b) => a + b, 0)} produtos`
                    : `${categoryCounts[selectedCategory] || 0} produtos em ${sortedCategories.find(c => c.id === selectedCategory)?.name.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+|[\u2600-\u27BF]/g, '').trim() || ''}`
                  }
                </p>
                <div className="flex items-center bg-muted rounded-lg p-0.5">
                  <button
                    onClick={() => { setPdvViewMode('grid'); localStorage.setItem('pdv_viewMode', 'grid'); }}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                      pdvViewMode === 'grid'
                        ? "bg-white dark:bg-gray-800 text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Visualização em grade"
                  >
                    <LayoutGrid className="h-[15px] w-[15px]" />
                    Grid
                  </button>
                  <button
                    onClick={() => { setPdvViewMode('list'); localStorage.setItem('pdv_viewMode', 'list'); }}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                      pdvViewMode === 'list'
                        ? "bg-white dark:bg-gray-800 text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Visualização em lista"
                  >
                    <List className="h-[15px] w-[15px]" />
                    Lista
                  </button>
                </div>
              </div>
              {productsLoading ? (
                pdvViewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="bg-card rounded-xl border border-border/50 overflow-hidden">
                        <Skeleton className="h-[84px]" />
                        <div className="p-3 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 bg-card rounded-lg border border-border/50 p-3">
                        <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))}
                  </div>
                )
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <UtensilsCrossed className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum produto encontrado</p>
                  <p className="text-sm">Tente ajustar os filtros ou busca</p>
                </div>
              ) : pdvViewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="bg-card rounded-xl border border-border/50 border-t-4 border-t-red-500 overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                    >
                      {/* Imagem */}
                      <div className="h-[84px] bg-gradient-to-br from-red-500 to-red-500 relative overflow-hidden">
                        {product.images?.[0] ? (
                          <BlurImage
                            src={product.images[0]}
                            blurDataUrl={(product as any).blurPlaceholder}
                            alt={product.name}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            responsive
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UtensilsCrossed className="h-12 w-12 text-white animate-placeholder-pulse" />
                          </div>
                        )}
                        {product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0) && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-sm font-medium px-3 py-1 bg-red-500 rounded-lg">
                              Indisponível
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3 flex flex-col h-[120px]">
                        <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">
                          {product.description || ''}
                        </p>
                        <div className="flex items-center justify-between mt-auto gap-2">
                          <span className="text-red-500 font-bold text-sm whitespace-nowrap">
                            {formatCurrency(parseFloat(product.price))}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 xl:px-3 text-xs border-red-200 dark:border-red-500 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                            onClick={(e) => handleQuickAdd(product, e)}
                            disabled={product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0)}
                          >
                            <Plus className="h-4 w-4" />
                            <span className="hidden xl:inline ml-1">Adicionar</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Modo Lista - estilo catálogo */
                <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                  <div className="divide-y divide-border/50">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        style={{ height: '60px' }}
                        className="flex items-center gap-3.5 p-3.5 hover:bg-muted/30 bg-card transition-colors cursor-pointer group"
                      >
                        {/* Imagem pequena arredondada */}
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-red-500 to-red-500 items-center justify-center overflow-hidden flex-shrink-0 relative flex">
                          {product.images?.[0] ? (
                            <BlurImage
                              src={product.images[0]}
                              blurDataUrl={(product as any).blurPlaceholder}
                              alt={product.name}
                              containerClassName="h-full w-full"
                              className="h-full w-full object-cover"
                              responsive
                              sizes="48px"
                            />
                          ) : (
                            <UtensilsCrossed className="h-5 w-5 text-white" />
                          )}
                          {product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0) && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-[8px] font-medium">Esgotado</span>
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold text-base truncate">{product.name}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-1">{product.description || ''}</p>
                        </div>
                        {/* Preço */}
                        <span className="text-sm font-medium text-red-500 flex-shrink-0">
                          {formatCurrency(parseFloat(product.price))}
                        </span>
                        {/* Botão Adicionar */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg text-xs font-medium px-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-500 shrink-0"
                          onClick={(e) => handleQuickAdd(product, e)}
                          disabled={product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0)}
                        >
                          <Plus className="h-4 w-4" />
                          Adicionar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita - Carrinho */}
          <div className="w-96 border-l border-border/50 bg-white dark:bg-card flex flex-col">
            {/* Header do Carrinho */}
            <div className="border-b border-border/50 bg-muted/40">
              {/* Título do Carrinho */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-foreground leading-tight">Carrinho</h3>
                      <p className="text-sm text-muted-foreground leading-tight mt-0.5">
                        {cart.length === 0
                          ? 'Adicione produtos para iniciar um pedido.'
                          : 'Revise os itens e escolha como o pedido será atendido.'}
                      </p>
                    </div>
                  </div>
                  {(() => {
                    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
                    return (
                      <span className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0",
                        totalItems > 0
                          ? "bg-red-500 text-white"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                      </span>
                    );
                  })()}
                </div>
              </div>
              {/* Tipo de Pedido - Pill selector com sliding animation */}
              <div className="relative flex items-center bg-background rounded-xl p-1 mx-4 mb-3">
                {/* Sliding pill indicator */}
                <div
                  className="absolute top-1 bottom-1 rounded-lg bg-red-500 shadow-sm transition-colors duration-300 ease-in-out"
                  style={{
                    width: 'calc((100% - 8px) / 3)',
                    left: orderType === "mesa"
                      ? '4px'
                      : orderType === "retirada"
                        ? 'calc((100% - 8px) / 3 + 4px)'
                        : 'calc(2 * (100% - 8px) / 3 + 4px)',
                  }}
                />
                <button
                  onClick={() => {
                    setOrderType("mesa");
                    setPaymentMethod(null);
                  }}
                  className={cn(
                    "relative z-10 flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-300 flex items-center justify-center gap-2",
                    orderType === "mesa"
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  Consumo
                </button>
                <button
                  onClick={() => {
                    setOrderType("retirada");
                    setPaymentMethod(null);
                  }}
                  className={cn(
                    "relative z-10 flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-300 flex items-center justify-center gap-2",
                    orderType === "retirada"
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Retirada
                </button>
                <button
                  onClick={() => {
                    console.log("[PDV] Clicou em Entrega");
                    setOrderType("entrega");
                    setPaymentMethod(null);
                    setShowDeliverySidebar(true);
                  }}
                  className={cn(
                    "relative z-10 flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-300 flex items-center justify-center gap-2",
                    orderType === "entrega"
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Bike className="w-4 h-4" />
                  Entrega
                </button>
              </div>


              {/* Campo de Mesa removido - agora usamos a página de Mesas */}

              {/* Indicador de forma de pagamento movido para o rodapé */}
            </div>

            {/* Lista de Itens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mb-4 opacity-30" />
                  <p className="text-sm font-medium">Nenhum item no pedido</p>
                  <p className="text-xs">Clique nos produtos para adicionar</p>
                </div>
              ) : (
                cart.map((item, index) => {
                  const isExpanded = expandedCartItem === index;
                  const itemTotal = (parseFloat(item.price) + 
                    item.complements.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0)
                  ) * item.quantity;
                  
                  return (
                    <div
                      key={`${item.productId}-${index}`}
                      className="bg-card rounded-xl border border-border shadow-sm border-l-4 border-l-red-500 overflow-hidden transition-all duration-200"
                      onMouseEnter={() => setExpandedCartItem(index)}
                      onMouseLeave={() => setExpandedCartItem(null)}
                    >
                      {/* Header - Título e Preço na mesma linha */}
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() => setExpandedCartItem(isExpanded ? null : index)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">
                            {item.quantity}x
                          </span>
                          <h4 className="font-semibold text-sm text-foreground truncate">
                            {item.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground whitespace-nowrap">
                            {formatCurrency(itemTotal)}
                          </span>
                          <ChevronDown className={cn(
                            "h-4 w-4 text-gray-400 transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )} />
                        </div>
                      </div>

                      {/* Dropdown com controles */}
                      <div className={cn(
                        "overflow-hidden transition-all duration-200 ease-in-out",
                        isExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                      )}>
                        <div className="px-3 pb-3 space-y-2 border-t border-border/50">
                          {/* Complementos */}
                          {item.complements.length > 0 && (
                            <div className="text-xs text-muted-foreground space-y-0.5 pt-2">
                              {item.complements.map((comp, i) => (
                                <div key={i} className="flex justify-between">
                                  <span>{comp.quantity}x {comp.name}</span>
                                  <span>+ {formatCurrency(parseFloat(comp.price) * comp.quantity)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {item.observation && (
                            <p className="text-xs text-muted-foreground line-clamp-1 pt-1">
                              Obs: {item.observation}
                            </p>
                          )}

                          {/* Controles de Quantidade e Ações */}
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); updateCartItemQuantity(index, -1); }}
                                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="text-sm font-semibold w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); updateCartItemQuantity(index, 1); }}
                                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditCartItem(index, item);
                                }}
                                className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors ml-2"
                                title="Editar item"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeCartItem(index); }}
                              className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-500 flex items-center justify-center transition-colors"
                              title="Remover item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer - Totais e Ações */}
            <div className="border-t border-border/50 bg-card p-4 space-y-4 shrink-0">
              {/* Totais */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(calculateTotal)}</span>
                </div>
                {/* Tipo de Pedido */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {orderType === "mesa" ? "Consumo no local" : orderType === "retirada" ? "Retirar no local" : "Entrega"}
                  </span>
                  <span className="font-medium text-green-600">
                    {orderType === "entrega" && pdvDeliveryFee > 0
                      ? `R$ ${pdvDeliveryFee.toFixed(2).replace(".", ",")}`
                      : "Grátis"}
                  </span>
                </div>
                {/* Desconto do Cupom */}
                {appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto ({appliedCoupon.code})</span>
                    <span className="font-medium text-green-600">-{formatCurrency(appliedCoupon.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-dashed pt-2">
                  <span>Total</span>
                  <span className="text-red-500">
                    {formatCurrency(
                      Math.max(0, calculateTotal + pdvDeliveryFee -
                      (appliedCoupon?.discount || 0))
                    )}
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2">
                {/* Botão de Cupom */}
                <Button
                  variant="outline"
                  className={cn("px-3", showCouponField && "border-red-500 bg-red-50 dark:bg-red-950/30")}
                  title="Adicionar cupom"
                  onClick={() => setShowCouponField(!showCouponField)}
                >
                  <Ticket className={cn("h-5 w-5", showCouponField ? "text-red-500" : "text-gray-500")} />
                </Button>
                {/* Botão de Forma de Pagamento - ao lado do cupom, mesmo estilo outline */}
                {(orderType === "mesa" || orderType === "retirada") && paymentMethod && (
                  <Button
                    variant="outline"
                    className="px-3"
                    onClick={() => setShowPaymentSidebar(true)}
                    title={paymentMethod === "cash" ? "Dinheiro" : paymentMethod === "card" ? "Cartão" : "Pix"}
                  >
                    {paymentMethod === "cash" && <Banknote className="h-5 w-5 text-red-500" />}
                    {paymentMethod === "card" && <CreditCard className="h-5 w-5 text-red-500" />}
                    {paymentMethod === "pix" && <QrCode className="h-5 w-5 text-red-500" />}
                  </Button>
                )}
                {/* Botão Limpar */}
                <Button
                  variant="outline"
                  className="px-3"
                  onClick={clearedCart ? undoClearCart : () => clearCart()}
                  disabled={cart.length === 0 && !clearedCart}
                  title={clearedCart ? "Desfazer" : "Limpar"}
                >
                  {clearedCart ? (
                    <Undo2 className="h-5 w-5" />
                  ) : (
                    <Trash2 className="h-5 w-5 text-gray-500" />
                  )}
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-500 text-white"
                  onClick={handleMainButtonClick}
                  disabled={mainButtonConfig.disabled}
                >
                  {mainButtonConfig.icon}
                  {createOrderMutation.isPending ? "Criando..." : mainButtonConfig.text}
                </Button>
              </div>

              {/* Campo de Cupom */}
              {showCouponField && (
                <div className="mt-3 flex gap-2">
                  {appliedCoupon ? (
                     <div className="flex-1 flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-green-600" />
                        <span className="text-green-700 font-medium">{appliedCoupon.code}</span>
                        <span className="text-green-600 text-sm">(-{formatCurrency(appliedCoupon.discount)})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-red-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode("");
                          toast.success("Cupom removido");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        placeholder="Código do cupom"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 rounded-xl"
                      />
                      <Button
                        variant="outline"
                        className="px-6 rounded-xl border-red-200 dark:border-red-500 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 dark:hover:text-red-300"
                        onClick={async () => {
                          if (!couponCode.trim()) {
                            toast.error("Digite o código do cupom");
                            return;
                          }
                          if (!establishmentId) {
                            toast.error("Estabelecimento não encontrado");
                            return;
                          }
                          
                          setIsValidatingCoupon(true);
                          try {
                            // Determinar o tipo de entrega para validação
                            const deliveryTypeMap: Record<OrderType, "delivery" | "pickup" | "self_service"> = {
                              mesa: "self_service",
                              retirada: "pickup",
                              entrega: "delivery"
                            };
                            
                            const response = await fetch(`/api/trpc/coupon.validate?input=${encodeURIComponent(JSON.stringify({
                              json: {
                                establishmentId,
                                code: couponCode.toUpperCase(),
                                orderValue: calculateTotal,
                                deliveryType: deliveryTypeMap[orderType]
                              }
                            }))}`).then(res => res.json());
                            
                            const result = response.result?.data?.json || response.result?.data;
                            
                            if (result?.valid && result?.coupon) {
                              toast.success(`Cupom ${couponCode} aplicado!`);
                              setAppliedCoupon({ 
                                code: couponCode.toUpperCase(), 
                                discount: result.discount,
                                couponId: result.coupon.id
                              });
                            } else {
                              toast.error(result?.error || "Cupom inválido");
                            }
                          } catch (error) {
                            console.error("Erro ao validar cupom:", error);
                            toast.error("Erro ao validar cupom");
                          } finally {
                            setIsValidatingCoupon(false);
                          }
                        }}
                        disabled={!couponCode.trim() || isValidatingCoupon}
                      >
                        {isValidatingCoupon ? "Validando..." : "Aplicar"}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Produto - mesmo código-base do Menu Público */}
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
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-red-500">
                          {formatCurrency(Number(selectedProduct.promotionalPrice))}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          {formatCurrency(Number(selectedProduct.price))}
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
                      </div>
                    ) : (
                      <p className="text-lg font-semibold text-red-500 mt-1">
                        {formatCurrency(Number(selectedProduct.price))}
                      </p>
                    )
                  ) : (() => {
                    const startingComplementPrice =
                      getStartingComplementPrice(selectedProduct);
                    return startingComplementPrice ? (
                      <p className="text-lg font-semibold text-red-500 mt-1">
                        A partir de {formatCurrency(startingComplementPrice)}
                      </p>
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
                    getPrice={item => getComplementPricePDV(item as any, orderType)}
                    formatPrice={formatCurrency}
                    onComplementImageChange={setSelectedComplementImage}
                    selectedComplementImage={selectedComplementImage}
                    idPrefix="complement"
                    hideBlockedGroups={true}
                    stickyHeaderMode="desktop-only"
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
              {/* Controle de Quantidade */}
              {(() => {
                // Calcular quantidade já no carrinho para este produto
                const alreadyInCart = cart
                  .filter(item => item.productId === selectedProduct.id)
                  .reduce((sum, item) => sum + item.quantity, 0);
                const stockLimit =
                  selectedProduct.availableStock ??
                  (selectedProduct.hasStock ? selectedProduct.stockQuantity : null);
                const maxAvailable =
                  stockLimit != null
                    ? Math.max(
                        0,
                        stockLimit - alreadyInCart
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
                          const itemPrice = getComplementPricePDV(
                            item as any,
                            orderType
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
                    const minimumQuantity = Number(group.minQuantity || 0);
                    if (minimumQuantity > 0 || (group as any).isRequired) {
                      const selectedInGroup = selectedComplements.get(group.id);
                      // Contar total de itens selecionados no grupo
                      const selectedCount = selectedInGroup
                        ? Array.from(selectedInGroup.values()).reduce(
                            (a, b) => a + b,
                            0
                          )
                        : 0;
                      if (selectedCount < Math.max(1, minimumQuantity)) {
                        requiredGroupsMet = false;
                      }
                    }
                  });
                }

                // No PDV o operador pode adicionar itens independentemente do horário público da loja
                const isStoreOpen = true;

                // Verificar se item tem preço zero e nenhum complemento selecionado
                const hasZeroPrice = effectivePrice === 0;
                const hasSelectedComplements =
                  selectedComplementsList.length > 0;
                const canAddZeroPriceItem =
                  !hasZeroPrice || hasSelectedComplements;

                // Verificar se produto está sem estoque
                const stockLimitForStatus =
                  selectedProduct.availableStock ??
                  (selectedProduct.hasStock ? selectedProduct.stockQuantity : null);
                const isOutOfStock =
                  (selectedProduct as any).outOfStock === true ||
                  (stockLimitForStatus != null && stockLimitForStatus <= 0);

                // Verificar limite de estoque
                const alreadyInCartForAdd = cart
                  .filter(item => item.productId === selectedProduct.id)
                  .reduce((sum, item) => sum + item.quantity, 0);
                const maxAvailableForAdd =
                  stockLimitForStatus != null
                    ? Math.max(
                        0,
                        stockLimitForStatus - alreadyInCartForAdd
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

                      if (isEditingMode && editingCartItem) {
                        // Modo de edição: atualizar item existente
                        const newCart = [...cart];
                        newCart[editingCartItem.index] = {
                          ...newCart[editingCartItem.index],
                          price: String(effectivePrice),
                          quantity: productQuantity,
                          observation: productObservation,
                          complements: selectedComplementsList,
                        };
                        setCart(newCart);
                        toast.success("Item atualizado!");

                        setIsClosingProductModal(true);
                        setTimeout(() => {
                          setSelectedComplements(new Map());
                          setProductObservation("");
                          setProductQuantity(1);
                          setSelectedComplementImage(null);
                          setSelectedProduct(null);
                          setShowProductShareDropdown(false);
                          setShowFullscreenImage(false);
                          setFullscreenImageIndex(0);
                          setModalImageIndex(0);
                          setIsEditingMode(false);
                          setEditingCartItem(null);
                          setIsClosingProductModal(false);
                        }, 300);
                      } else {
                        // Modo de adição: preservar lógica própria do carrinho do PDV
                        addToCart(
                          selectedProduct,
                          productQuantity,
                          productObservation,
                          selectedComplementsList
                        );
                      }
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
                        <ShoppingBag className="h-5 w-5" />
                        <span>Escolha uma opção</span>
                      </>
                    ) : isEditingMode ? (
                      <>
                        <Check className="h-5 w-5" />
                        <span className="hidden xs:inline">Atualizar</span>
                        <span>{formatCurrency(totalPrice)}</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden xs:inline">Adicionar</span>
                        <span>{formatCurrency(totalPrice)}</span>
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

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

      {/* Modal de Categorias */}
      {showCategoriesModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCategoriesModal(false)}
        >
          <div 
            className="bg-card rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h2 className="text-lg font-semibold text-foreground">Categorias</h2>
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            
            {/* Lista de Categorias */}
            <div className="overflow-y-auto max-h-[60vh]">
              {/* Opção Todos */}
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowCategoriesModal(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/30",
                  selectedCategory === null && "bg-red-50 dark:bg-red-950/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-medium text-foreground">Todos</span>
                  <span className="px-2 py-0.5 rounded-lg text-xs bg-muted text-muted-foreground">
                    {Object.values(categoryCounts).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
                {selectedCategory === null && (
                  <Check className="h-5 w-5 text-red-500" />
                )}
              </button>
              
              {/* Categorias */}
              {sortedCategories.map((category) => {
                const count = categoryCounts[category.id] || 0;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setShowCategoriesModal(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/30",
                      selectedCategory === category.id && "bg-red-50 dark:bg-red-950/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base font-medium text-foreground">{category.name}</span>
                      <span className="px-2 py-0.5 rounded-lg text-xs bg-muted text-muted-foreground">
                        {count}
                      </span>
                    </div>
                    {selectedCategory === category.id && (
                      <Check className="h-5 w-5 text-red-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar de Entrega usando Sheet do shadcn/ui */}
      <Sheet open={showDeliverySidebar} onOpenChange={(open) => { setShowDeliverySidebar(open); if (!open) setShowEditCustomerSheet(false); }}>
        <SheetContent side="right" className={`w-full p-0 overflow-hidden flex flex-row transition-all duration-300 ${showEditCustomerSheet ? 'sm:max-w-[742px]' : 'sm:max-w-[371px]'}`} hideCloseButton>
          <SheetTitle className="sr-only">Dados da Entrega</SheetTitle>
          <SheetDescription className="sr-only">Preencha os dados para entrega</SheetDescription>

          {/* Painel de Edição de Cliente inline - aparece à esquerda */}
          {showEditCustomerSheet && (
            <div className="w-full sm:w-[371px] shrink-0 border-r border-border/50 flex flex-col bg-background overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Editar Cliente</h2>
                      <p className="text-sm text-white/80">Atualize os dados do cliente</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditCustomerSheet(false)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-card">
                {/* Dados do Cliente */}
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-red-500" />
                    Dados do Cliente
                  </h3>
                  <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Nome <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="Nome do cliente"
                        value={editCustomerData.name}
                        onChange={(e) => setEditCustomerData({...editCustomerData, name: e.target.value})}
                        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Telefone <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="(00) 00000-0000"
                        value={editCustomerData.phone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                          let value = "";
                          if (digits.length === 0) {
                            value = "";
                          } else if (digits.length <= 2) {
                            value = `(${digits}`;
                          } else if (digits.length <= 3) {
                            value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                          } else if (digits.length <= 7) {
                            value = `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
                          } else {
                            value = `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
                          }
                          setEditCustomerData({...editCustomerData, phone: value});
                        }}
                        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Endereço de Entrega */}
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" />
                    Endereço de Entrega
                  </h3>
                  {establishment?.deliveryFeeType === "fixed" && pdvDeliveryFee > 0 && (
                    <div className="flex justify-end mr-4 -mb-[1px] relative z-0">
                      <div className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white rounded-t-lg text-xs font-medium">
                        Taxa fixa: R$ {pdvDeliveryFee.toFixed(2).replace(".", ",")}
                      </div>
                    </div>
                  )}
                  <div className={`relative z-10 space-y-3 p-4 bg-muted/50 ${establishment?.deliveryFeeType === "fixed" && pdvDeliveryFee > 0 ? "rounded-tl-xl rounded-b-xl rounded-tr-xl" : "rounded-xl"}`}>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Rua</label>
                        <input
                          type="text"
                          placeholder="Nome da rua"
                          value={editCustomerData.street}
                          onChange={(e) => setEditCustomerData({...editCustomerData, street: e.target.value})}
                          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Número</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          placeholder="Nº"
                          value={editCustomerData.number}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setEditCustomerData({...editCustomerData, number: value});
                          }}
                          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Bairro</label>
                      {establishment?.deliveryFeeType === "byNeighborhood" ? (
                        editCustomerShowNeighborhoodList ? (
                          /* Lista de bairros para seleção */
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 flex-shrink-0">
                                <MapPin className="h-3.5 w-3.5 text-red-500" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-foreground">Selecione o Bairro</p>
                                <p className="text-[10px] text-muted-foreground">Escolha o bairro para calcular a taxa</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => { setEditCustomerShowNeighborhoodList(false); setEditCustomerNeighborhoodSearch(""); }}
                                className="text-xs text-red-500 font-medium hover:underline"
                              >
                                Cancelar
                              </button>
                            </div>
                            {neighborhoodFees && neighborhoodFees.length > 3 && (
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                  placeholder="Buscar bairro..."
                                  value={editCustomerNeighborhoodSearch}
                                  onChange={(e) => setEditCustomerNeighborhoodSearch(e.target.value)}
                                  className="h-8 pl-8 rounded-lg text-xs"
                                />
                              </div>
                            )}
                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
                              {neighborhoodFees && neighborhoodFees.length > 0 ? (
                                (() => {
                                  const filtered = neighborhoodFees.filter((fee) =>
                                    !editCustomerNeighborhoodSearch || fee.neighborhood.toLowerCase().includes(editCustomerNeighborhoodSearch.toLowerCase())
                                  );
                                  return filtered.length > 0 ? (
                                    filtered.map((fee) => (
                                      <button
                                        key={fee.id}
                                        type="button"
                                        onClick={() => {
                                          setEditCustomerData({...editCustomerData, neighborhood: fee.neighborhood});
                                          setEditCustomerShowNeighborhoodList(false);
                                          setEditCustomerNeighborhoodSearch("");
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors text-xs ${
                                          editCustomerData.neighborhood === fee.neighborhood
                                            ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20'
                                            : 'border-border bg-card hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/20'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                            editCustomerData.neighborhood === fee.neighborhood ? 'border-red-500' : 'border-muted-foreground/40'
                                          }`}>
                                            {editCustomerData.neighborhood === fee.neighborhood && (
                                              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            )}
                                          </div>
                                          <span className="font-medium text-foreground">{fee.neighborhood}</span>
                                        </div>
                                        <span className="font-semibold text-red-500">
                                          R$ {parseFloat(fee.fee).toFixed(2).replace(".", ",")}
                                        </span>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="text-center py-3">
                                      <p className="text-xs text-muted-foreground">Nenhum bairro encontrado</p>
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="text-center py-3">
                                  <p className="text-xs text-muted-foreground">Nenhum bairro cadastrado</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Campo não-editável com botão Alterar */
                          <div className="flex items-center gap-2">
                            <div className="flex-1 px-3 py-2.5 border border-border rounded-lg text-sm bg-muted/50 text-foreground">
                              {editCustomerData.neighborhood || <span className="text-muted-foreground">Nenhum bairro</span>}
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditCustomerShowNeighborhoodList(true)}
                              className="px-3 py-2.5 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors whitespace-nowrap"
                            >
                              Alterar
                            </button>
                          </div>
                        )
                      ) : (
                        /* Campo editável normal para estabelecimentos sem taxa por bairro */
                        <input
                          type="text"
                          placeholder="Nome do bairro"
                          value={editCustomerData.neighborhood}
                          onChange={(e) => setEditCustomerData({...editCustomerData, neighborhood: e.target.value})}
                          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Complemento</label>
                      <input
                        type="text"
                        placeholder="Apto, bloco, etc."
                        value={editCustomerData.complement}
                        onChange={(e) => setEditCustomerData({...editCustomerData, complement: e.target.value})}
                        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Ponto de referência</label>
                      <input
                        type="text"
                        placeholder="Próximo a..."
                        value={editCustomerData.reference}
                        onChange={(e) => setEditCustomerData({...editCustomerData, reference: e.target.value})}
                        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border/50 bg-muted/30">
                <Button
                  onClick={() => {
                    const phoneDigits = editCustomerData.phone.replace(/\D/g, "");
                    if (!editCustomerData.name.trim()) {
                      toast.error('Preencha o nome do cliente');
                      return;
                    }
                    if (phoneDigits.length < 10) {
                      toast.error('Telefone inválido');
                      return;
                    }
                    const originalPhoneDigits = editCustomerData.originalPhone.replace(/\D/g, "");
                    pdvCustomerUpsertMutation.mutate({
                      establishmentId: establishmentId!,
                      phone: phoneDigits,
                      name: editCustomerData.name.trim(),
                      street: editCustomerData.street.trim() || undefined,
                      number: editCustomerData.number.trim() || undefined,
                      complement: editCustomerData.complement.trim() || undefined,
                      neighborhood: editCustomerData.neighborhood.trim() || undefined,
                      reference: editCustomerData.reference.trim() || undefined,
                      originalPhone: originalPhoneDigits,
                      customerId: editCustomerData.customerId ?? undefined,
                    }, {
                      onSuccess: () => {
                        setDeliveryAddress({
                          name: editCustomerData.name,
                          phone: editCustomerData.phone,
                          street: editCustomerData.street,
                          number: editCustomerData.number,
                          neighborhood: editCustomerData.neighborhood,
                          complement: editCustomerData.complement,
                          reference: editCustomerData.reference,
                          customerId: editCustomerData.customerId,
                        });
                        setShowEditCustomerSheet(false);
                        toast.success('Cliente atualizado com sucesso!');
                      },
                      onError: (err) => {
                        toast.error('Erro ao salvar cliente', { description: err.message });
                      },
                    });
                  }}
                  className="w-full bg-red-500 hover:bg-red-500 text-white py-3"
                  disabled={pdvCustomerUpsertMutation.isPending || !editCustomerData.name.trim()}
                >
                  {pdvCustomerUpsertMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Conteúdo principal da sidebar de entrega */}
          <div className="w-[371px] shrink-0 flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Bike className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Dados da Entrega</h2>
                  <p className="text-sm text-white/80">Preencha os dados para entrega</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeliverySidebar(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Conteúdo - Formulário de Entrega */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-card">
            {/* Formulário completo de entrega - sempre mostra dados do cliente primeiro */}
              <>
            {/* Seção de Dados do Cliente */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Dados do Cliente
                </h3>
                {pdvCustomerFound && deliveryAddress.phone && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditCustomerData({
                        name: deliveryAddress.name,
                        phone: deliveryAddress.phone,
                        originalPhone: deliveryAddress.phone,
                        customerId: deliveryAddress.customerId,
                        street: deliveryAddress.street,
                        number: deliveryAddress.number,
                        neighborhood: deliveryAddress.neighborhood,
                        complement: deliveryAddress.complement,
                        reference: deliveryAddress.reference,
                      });
                      setEditCustomerShowNeighborhoodList(false);
                      setEditCustomerNeighborhoodSearch("");
                      setShowEditCustomerSheet(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded-lg transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </button>
                )}
              </div>
              <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                <div className="relative">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Nome <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      ref={nameInputRef}
                      type="text"
                      placeholder="Buscar ou digitar nome do cliente"
                      value={deliveryAddress.name}
                      onChange={(e) => {
                        setDeliveryAddress({...deliveryAddress, name: e.target.value});
                        if (e.target.value.trim().length >= 2) {
                          setShowNameAutocomplete(true);
                        } else {
                          setShowNameAutocomplete(false);
                        }
                      }}
                      onFocus={() => {
                        if (deliveryAddress.name.trim().length >= 2) setShowNameAutocomplete(true);
                      }}
                      className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                  {/* Dropdown de autocomplete */}
                  {showNameAutocomplete && deliveryNameResults && deliveryNameResults.length > 0 && (
                    <div ref={autocompleteRef} className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                      <div className="max-h-[240px] overflow-y-auto">
                        {deliveryNameResults.map((customer) => {
                          const initials = (customer.name || 'C').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                          const displayPhone = formatBrazilPhone(customer.phone || '');
                          return (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => selectDeliveryCustomer(customer)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left border-b border-border/50 last:border-b-0"
                            >
                              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{initials}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{customer.name || 'Sem nome'}</p>
                                <p className="text-xs text-muted-foreground">{displayPhone || 'Sem telefone'}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Telefone</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      ref={phoneInputRef}
                      type="text"
                      placeholder="Buscar ou digitar telefone"
                      value={deliveryAddress.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                        let value = "";
                        if (digits.length === 0) {
                          value = "";
                        } else if (digits.length <= 2) {
                          value = `(${digits}`;
                        } else if (digits.length <= 3) {
                          value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                        } else if (digits.length <= 7) {
                          value = `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
                        } else {
                          value = `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
                        }
                        setDeliveryAddress({...deliveryAddress, phone: value});
                        if (digits.length >= 3) {
                          setShowPhoneAutocomplete(true);
                        } else {
                          setShowPhoneAutocomplete(false);
                        }
                      }}
                      onFocus={() => {
                        const digits = deliveryAddress.phone.replace(/\D/g, '');
                        if (digits.length >= 3) setShowPhoneAutocomplete(true);
                      }}
                      className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                  {/* Dropdown de autocomplete por telefone */}
                  {showPhoneAutocomplete && deliveryPhoneResults && deliveryPhoneResults.length > 0 && (
                    <div ref={phoneAutocompleteRef} className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                      <div className="max-h-[240px] overflow-y-auto">
                        {deliveryPhoneResults.map((customer) => {
                          const initials = (customer.name || 'C').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                          const displayPhone = formatBrazilPhone(customer.phone || '');
                          return (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => {
                                selectDeliveryCustomer(customer);
                                setShowPhoneAutocomplete(false);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left border-b border-border/50 last:border-b-0"
                            >
                              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{initials}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{customer.name || 'Sem nome'}</p>
                                <p className="text-xs text-muted-foreground">{displayPhone || 'Sem telefone'}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Seção de Endereço */}
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                Endereço de Entrega
              </h3>
              

              
              {establishment?.deliveryFeeType === "fixed" && pdvDeliveryFee > 0 && (
                <div className="flex justify-end mr-4 -mb-[1px] relative z-0">
                  <div className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white rounded-t-lg text-xs font-medium">
                    Taxa fixa: R$ {pdvDeliveryFee.toFixed(2).replace(".", ",")}
                  </div>
                </div>
              )}
              <div className={`relative z-10 space-y-3 p-4 bg-muted/50 ${establishment?.deliveryFeeType === "fixed" && pdvDeliveryFee > 0 ? "rounded-tl-xl rounded-b-xl rounded-tr-xl" : "rounded-xl"}`}>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Rua <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Nome da rua"
                      value={deliveryAddress.street}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Número <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="Nº"
                      value={deliveryAddress.number}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setDeliveryAddress({...deliveryAddress, number: value});
                      }}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Bairro <span className="text-red-500">*</span></label>
                  {establishment?.deliveryFeeType === "byNeighborhood" ? (
                    selectedNeighborhoodFee ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-3 py-2.5 border border-border rounded-lg text-sm bg-muted/50 text-foreground flex items-center justify-between">
                          <span>{selectedNeighborhoodFee.neighborhood}</span>
                          <span className="text-xs text-green-600 font-medium">R$ {parseFloat(selectedNeighborhoodFee.fee).toFixed(2).replace(".", ",")}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSelectedNeighborhoodFee(null); setShowNeighborhoodSelector(true); }}
                          className="px-3 py-2.5 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors whitespace-nowrap"
                        >
                          Alterar
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setShowNeighborhoodSelector(!showNeighborhoodSelector)}
                          className="w-full flex items-center justify-between px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground hover:border-red-300 transition-colors"
                        >
                          <span className="text-muted-foreground">Selecione o bairro...</span>
                          <MapPin className="h-4 w-4 text-red-500" />
                        </button>
                        {showNeighborhoodSelector && (
                          <div className="border border-border rounded-xl bg-card shadow-lg overflow-hidden">
                            {neighborhoodFees && neighborhoodFees.length > 3 && (
                              <div className="p-2 border-b border-border">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                  <Input
                                    placeholder="Buscar bairro..."
                                    value={pdvNeighborhoodSearch}
                                    onChange={(e) => setPdvNeighborhoodSearch(e.target.value)}
                                    className="h-8 pl-8 rounded-lg text-xs"
                                  />
                                </div>
                              </div>
                            )}
                            <div className="max-h-[200px] overflow-y-auto p-1">
                              {neighborhoodFees && neighborhoodFees.length > 0 ? (
                                (() => {
                                  const filtered = neighborhoodFees.filter((fee) =>
                                    !pdvNeighborhoodSearch || fee.neighborhood.toLowerCase().includes(pdvNeighborhoodSearch.toLowerCase())
                                  );
                                  return filtered.length > 0 ? (
                                    filtered.map((fee) => (
                                      <button
                                        key={fee.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedNeighborhoodFee(fee);
                                          setDeliveryAddress({...deliveryAddress, neighborhood: fee.neighborhood});
                                          setPdvNeighborhoodSearch("");
                                          setShowNeighborhoodSelector(false);
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors text-sm"
                                      >
                                        <span className="font-medium text-foreground">{fee.neighborhood}</span>
                                        <span className="font-semibold text-red-500 text-xs">
                                          R$ {parseFloat(fee.fee).toFixed(2).replace(".", ",")}
                                        </span>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="text-center py-3">
                                      <p className="text-xs text-muted-foreground">Nenhum bairro encontrado</p>
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="text-center py-3">
                                  <p className="text-xs text-muted-foreground">Nenhum bairro cadastrado</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <input
                      type="text"
                      placeholder="Nome do bairro"
                      value={deliveryAddress.neighborhood}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, neighborhood: e.target.value})}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Complemento</label>
                  <input
                    type="text"
                    placeholder="Apto, bloco, etc."
                    value={deliveryAddress.complement}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, complement: e.target.value})}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Ponto de referência</label>
                  <input
                    type="text"
                    placeholder="Próximo a..."
                    value={deliveryAddress.reference}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, reference: e.target.value})}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-border" />

            {/* Seção de Pagamento */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-foreground">
                <CreditCard className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold">Forma de Pagamento</h3>
              </div>
              
              <div className="space-y-2">
                {/* Dinheiro */}
                {establishment?.acceptsCash && (
                  <>
                    <button
                      onClick={() => setPaymentMethod("cash")}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors",
                        paymentMethod === "cash"
                          ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                          : "border-border hover:border-muted-foreground/30 bg-card"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        paymentMethod === "cash" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        <Banknote className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-medium",
                            paymentMethod === "cash" ? "text-red-500 dark:text-red-400" : "text-foreground"
                          )}>Dinheiro</p>
                          {favoritePaymentMethod === "cash" && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">Favorito</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Pagamento na entrega</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetFavoritePayment("cash");
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-transform hover:scale-110",
                          favoritePaymentMethod === "cash"
                            ? "text-amber-500"
                            : "text-gray-300 hover:text-amber-400"
                        )}
                        title={favoritePaymentMethod === "cash" ? "Remover favorito" : "Marcar como favorito"}
                      >
                        <Star className={cn("h-5 w-5", favoritePaymentMethod === "cash" && "fill-current")} />
                      </button>
                      {paymentMethod === "cash" && (
                        <Check className="h-5 w-5 text-red-500" />
                      )}
                    </button>

                    {/* Campo de Troco - aparece quando dinheiro está selecionado */}
                    {paymentMethod === "cash" && (
                      <div className="ml-4 p-3 bg-muted/50 rounded-xl border border-border">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Troco para quanto?</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={changeAmount}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Remove tudo que não é número
                              const numbers = value.replace(/\D/g, '');
                              // Converte para centavos e depois para reais
                              const cents = parseInt(numbers || '0', 10);
                              const reais = cents / 100;
                              // Formata com 2 casas decimais
                              const formatted = reais.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              });
                              setChangeAmount(formatted === '0,00' ? '' : formatted);
                            }}
                            className="pl-10 border-border focus:border-red-500 focus:ring-red-500/20"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Deixe em branco se não precisar de troco</p>
                      </div>
                    )}
                  </>
                )}

                {/* Cartão */}
                {establishment?.acceptsCard && (
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors",
                      paymentMethod === "card"
                        ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                        : "border-border hover:border-muted-foreground/30 bg-card"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg",
                      paymentMethod === "card" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "font-medium",
                          paymentMethod === "card" ? "text-red-500 dark:text-red-400" : "text-foreground"
                        )}>Cartão</p>
                        {favoritePaymentMethod === "card" && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">Favorito</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Débito ou Crédito na entrega</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetFavoritePayment("card");
                      }}
                      className={cn(
                        "p-2 rounded-lg transition-transform hover:scale-110",
                        favoritePaymentMethod === "card"
                          ? "text-amber-500"
                          : "text-gray-300 hover:text-amber-400"
                      )}
                      title={favoritePaymentMethod === "card" ? "Remover favorito" : "Marcar como favorito"}
                    >
                      <Star className={cn("h-5 w-5", favoritePaymentMethod === "card" && "fill-current")} />
                    </button>
                    {paymentMethod === "card" && (
                      <Check className="h-5 w-5 text-red-500" />
                    )}
                  </button>
                )}

                {/* Pix */}
                {establishment?.acceptsPix && (
                  <>
                    <button
                      onClick={() => setPaymentMethod("pix")}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors",
                          paymentMethod === "pix"
                          ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                          : "border-border hover:border-muted-foreground/30 bg-card"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        paymentMethod === "pix" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        <QrCode className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-medium",
                            paymentMethod === "pix" ? "text-red-500 dark:text-red-400" : "text-foreground"
                          )}>Pix</p>
                          {favoritePaymentMethod === "pix" && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">Favorito</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Instantâneo</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetFavoritePayment("pix");
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-transform hover:scale-110",
                          favoritePaymentMethod === "pix"
                            ? "text-amber-500"
                            : "text-gray-300 hover:text-amber-400"
                        )}
                        title={favoritePaymentMethod === "pix" ? "Remover favorito" : "Marcar como favorito"}
                      >
                        <Star className={cn("h-5 w-5", favoritePaymentMethod === "pix" && "fill-current")} />
                      </button>
                      {paymentMethod === "pix" && (
                        <Check className="h-5 w-5 text-red-500" />
                      )}
                    </button>

                    {/* Chave Pix manual - aparece apenas quando não há pagamento Pix online ativo */}
                    {paymentMethod === "pix" && establishment?.pixKey && !hasOnlinePixPaymentEnabled && (
                      <div className="ml-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-700">Chave Pix</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(establishment.pixKey || "");
                              toast.success("Chave Pix copiada!");
                            }}
                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                            Copiar
                          </button>
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-300 font-mono bg-card px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
                          {establishment.pixKey}
                        </p>
                        <p className="text-xs text-green-600 mt-2">Envie o comprovante ao entregador</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
              </>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-muted/30">
            <Button
              onClick={() => setShowDeliverySidebar(false)}
              className="w-full bg-red-500 hover:bg-red-500 text-white py-3"
              disabled={!deliveryAddress.street || !deliveryAddress.number || !deliveryAddress.neighborhood || !paymentMethod || (establishment?.deliveryFeeType === "byNeighborhood" && !selectedNeighborhoodFee)}
            >
              <Check className="h-5 w-5 mr-2" />
              Confirmar Dados
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Campos com * são obrigatórios
            </p>
          </div>
          </div>{/* Fim do conteúdo principal da sidebar de entrega */}
        </SheetContent>
      </Sheet>

      {/* Sidebar de Pagamento (para Retirada) */}
      <Sheet open={showPaymentSidebar} onOpenChange={(open) => {
        setShowPaymentSidebar(open);
        if (open) {
          // Ao abrir, pré-seleciona o favorito ou dinheiro como padrão
          setSelectedPaymentInSidebar(favoritePaymentMethod || "cash");
        } else {
          // Ao fechar, reseta para o favorito ou dinheiro
          setSelectedPaymentInSidebar(favoritePaymentMethod || "cash");
          setReceivedAmount("");
        }
      }}>
        <SheetContent side="right" className="w-[371px] sm:max-w-[371px] p-0 flex flex-col" hideCloseButton>
          <SheetTitle className="sr-only">Forma de Pagamento</SheetTitle>
          <SheetDescription className="sr-only">Selecione como o cliente vai pagar</SheetDescription>
          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Forma de Pagamento</h2>
                  <p className="text-sm text-white/80">Selecione como o cliente vai pagar</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentSidebar(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Conteúdo - Formas de Pagamento */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-card">
            {/* Dados do Cliente (Retirada) */}
            {orderType === "retirada" && (
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-red-500" />
                  Dados do Cliente
                </h3>
                <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10" />
                      <Input
                        ref={pickupNameInputRef}
                        type="text"
                        placeholder="Buscar ou digitar nome do cliente"
                        value={pickupClientName}
                        onChange={(e) => {
                          setPickupClientName(e.target.value);
                          if (e.target.value.trim().length >= 2) {
                            setShowPickupNameAutocomplete(true);
                          } else {
                            setShowPickupNameAutocomplete(false);
                          }
                        }}
                        onFocus={() => {
                          if (pickupClientName.trim().length >= 2) setShowPickupNameAutocomplete(true);
                        }}
                        className="w-full pl-9 bg-background border-border rounded-lg"
                      />
                    </div>
                    {/* Dropdown de autocomplete (Retirada) */}
                    {showPickupNameAutocomplete && pickupNameResults && pickupNameResults.length > 0 && (
                      <div ref={pickupAutocompleteRef} className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                        <div className="max-h-[240px] overflow-y-auto">
                          {pickupNameResults.map((customer) => {
                            const initials = (customer.name || 'C').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                            const displayPhone = formatBrazilPhone(customer.phone || '');
                            return (
                              <button
                                key={customer.id}
                                type="button"
                                onClick={() => selectPickupCustomer(customer)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left border-b border-border/50 last:border-b-0"
                              >
                                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">{initials}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{customer.name || 'Sem nome'}</p>
                                  <p className="text-xs text-muted-foreground">{displayPhone || 'Sem telefone'}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Telefone</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        ref={pickupPhoneInputRef}
                        type="text"
                        inputMode="numeric"
                        placeholder="Buscar ou digitar telefone"
                        value={pickupClientPhone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                          let value = "";
                          if (digits.length === 0) {
                            value = "";
                          } else if (digits.length <= 2) {
                            value = `(${digits}`;
                          } else if (digits.length <= 3) {
                            value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                          } else if (digits.length <= 7) {
                            value = `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
                          } else {
                            value = `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
                          }
                          setPickupClientPhone(value);
                          if (digits.length >= 3) {
                            setShowPickupPhoneAutocomplete(true);
                          } else {
                            setShowPickupPhoneAutocomplete(false);
                          }
                        }}
                        onFocus={() => {
                          const digits = pickupClientPhone.replace(/\D/g, '');
                          if (digits.length >= 3) setShowPickupPhoneAutocomplete(true);
                        }}
                        className="w-full pl-9 bg-background border-border rounded-lg"
                      />
                    </div>
                    {/* Dropdown de autocomplete por telefone (Retirada) */}
                    {showPickupPhoneAutocomplete && pickupPhoneResults && pickupPhoneResults.length > 0 && (
                      <div ref={pickupPhoneAutocompleteRef} className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                        <div className="max-h-[240px] overflow-y-auto">
                          {pickupPhoneResults.map((customer) => {
                            const initials = (customer.name || 'C').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                            const displayPhone = formatBrazilPhone(customer.phone || '');
                            return (
                              <button
                                key={customer.id}
                                type="button"
                                onClick={() => {
                                  selectPickupCustomer(customer);
                                  setShowPickupPhoneAutocomplete(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left border-b border-border/50 last:border-b-0"
                              >
                                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">{initials}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{customer.name || 'Sem nome'}</p>
                                  <p className="text-xs text-muted-foreground">{displayPhone || 'Sem telefone'}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Título da seção */}
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-red-500" />
                Formas de Pagamento
              </h3>
              <p className="text-xs text-muted-foreground">Selecione como o cliente vai pagar</p>
            </div>

            <div className="space-y-3">
              {availablePaymentMethods.length > 0 ? (
                availablePaymentMethods.map((method) => (
                  <div key={method.id}>
                    <button
                      onClick={() => {
                        if (method.id === "cash") {
                          setSelectedPaymentInSidebar(selectedPaymentInSidebar === "cash" ? null : "cash");
                          setReceivedAmount("");
                        } else {
                          handleSelectPaymentMethod(method.id);
                        }
                      }}
                      style={{ height: '67px', marginBottom: '8px' }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors",
                        selectedPaymentInSidebar === method.id
                          ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                          : "border-border bg-card hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/20"
                      )}
                    >
                      <div className={cn(
                        "p-3 rounded-xl",
                        selectedPaymentInSidebar === method.id
                          ? "bg-red-500 text-white"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {method.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-semibold text-base",
                            selectedPaymentInSidebar === method.id ? "text-red-500 dark:text-red-400" : "text-foreground"
                          )}>{method.name}</p>
                          {favoritePaymentMethod === method.id && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">Favorito</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetFavoritePayment(method.id);
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-transform hover:scale-110",
                          favoritePaymentMethod === method.id
                            ? "text-amber-500"
                            : "text-gray-300 hover:text-amber-400"
                        )}
                        title={favoritePaymentMethod === method.id ? "Remover favorito" : "Marcar como favorito"}
                      >
                        <Star className={cn("h-5 w-5", favoritePaymentMethod === method.id && "fill-current")} />
                      </button>
                      {selectedPaymentInSidebar === method.id ? (
                        <Check className="h-5 w-5 text-red-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {/* Campos de Troco - apenas para Dinheiro */}
                    {method.id === "cash" && selectedPaymentInSidebar === "cash" && (
                      <div className="mt-4 ml-2 space-y-3">
                        {/* Pergunta sobre valor recebido */}
                        <p className="text-sm text-muted-foreground">Qual valor recebido?</p>
                        
                        {/* Campo Valor Recebido */}
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="0,00"
                            value={receivedAmount}
                            onChange={(e) => {
                              // Remove tudo que não é número
                              const onlyNumbers = e.target.value.replace(/\D/g, "");
                              
                              // Se não tiver números, limpa o campo
                              if (!onlyNumbers) {
                                setReceivedAmount("");
                                return;
                              }
                              
                              // Converte para centavos e formata
                              const cents = parseInt(onlyNumbers, 10);
                              const formatted = (cents / 100).toFixed(2).replace(".", ",");
                              setReceivedAmount(formatted);
                            }}
                            className="w-full pl-10 text-lg bg-muted/50 border-border rounded-xl"
                          />
                        </div>
                        
                        <p className="text-xs text-muted-foreground">Deixe em branco se não precisar de troco</p>
                        
                        {/* Troco a Devolver - mostra em destaque quando valor recebido for digitado */}
                        {receivedAmount && parseFloat(receivedAmount.replace(",", ".")) > 0 && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg shadow-sm" style={{borderRadius: '16px'}}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-green-700">Troco a devolver</p>
                                <p className="text-2xl font-bold text-green-600 mt-0.5">
                                  {(() => {
                                    const totalValue = Math.max(0, calculateTotal + pdvDeliveryFee - (appliedCoupon?.discount || 0));
                                    const received = parseFloat(receivedAmount.replace(",", ".")) || 0;
                                    const change = received - totalValue;
                                    return formatCurrency(Math.max(0, change));
                                  })()}
                                </p>
                              </div>
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                            {(() => {
                              const totalValue = Math.max(0, calculateTotal + pdvDeliveryFee - (appliedCoupon?.discount || 0));
                              const received = parseFloat(receivedAmount.replace(",", ".")) || 0;
                              const change = received - totalValue;
                              if (change < 0) {
                                return (
                                  <p className="text-xs text-red-500 mt-2 font-medium">
                                    Valor insuficiente! Faltam {formatCurrency(Math.abs(change))}
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma forma de pagamento configurada</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Configure as formas de pagamento nas configurações</p>
                </div>
              )}
                        </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-card">
            <Button
              onClick={() => {
                if (selectedPaymentInSidebar) {
                  setPaymentMethod(selectedPaymentInSidebar);
                  if (selectedPaymentInSidebar === "cash" && receivedAmount) {
                    setChangeAmount(receivedAmount);
                  }
                }
                setShowPaymentSidebar(false);
                setSelectedPaymentInSidebar(favoritePaymentMethod || "cash");
                setReceivedAmount("");
              }}
              disabled={(!selectedPaymentInSidebar && availablePaymentMethods.length > 0) || (orderType === "retirada" && !pickupClientName.trim())}
              className="w-full py-3 bg-red-500 hover:bg-red-500 text-white"
            >
              {orderType === "retirada" && !pickupClientName.trim() ? "Preencha o nome do cliente" : "Continuar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sidebar de Conferência do Pedido */}
      <Sheet open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
        <SheetContent
          side="right"
          hideCloseButton={true}
          className="w-full sm:max-w-[371px] p-0 overflow-hidden flex flex-col h-full gap-0 z-[9999]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Conferência do Pedido</SheetTitle>
            <SheetDescription>Revise os dados e itens do pedido antes de finalizar.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Conferência do Pedido</h2>
                    <p className="text-sm text-white/80">
                      {orderType === "mesa" ? "Consumo no local" : 
                       orderType === "retirada" ? "Retirada" : "Entrega"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirmationModal(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Conteúdo do Recibo */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-card">
              {/* Tipo do Pedido */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipo:</span>
                <span className="px-4 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg">
                  {orderType === "mesa" ? "Consumo" : 
                   orderType === "retirada" ? "Retirada" : "Entrega"}
                </span>
              </div>

              {/* Dados de Entrega (se for entrega) */}
              {orderType === "entrega" && deliveryAddress.street && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-xs font-semibold text-foreground">Endereço de Entrega:</p>
                  <p className="text-sm">
                    {deliveryAddress.street}, {deliveryAddress.number}
                    {deliveryAddress.complement && ` - ${deliveryAddress.complement}`}
                  </p>
                  <p className="text-sm">{deliveryAddress.neighborhood}</p>
                  {deliveryAddress.reference && (
                    <p className="text-xs text-muted-foreground">Ref: {deliveryAddress.reference}</p>
                  )}
                  {deliveryAddress.name && (
                    <p className="text-xs text-muted-foreground mt-2">Cliente: {deliveryAddress.name}</p>
                  )}
                  {deliveryAddress.phone && (
                    <p className="text-xs text-muted-foreground">Tel: {deliveryAddress.phone}</p>
                  )}
                </div>
              )}

              {/* Lista de Itens */}
              {printerSettings?.showDividers !== false && (
                <div className="border-t border-dashed border-border" />
              )}
              
              <div className="space-y-2">
                {cart.map((item, index) => (
                  <div key={index} className="p-3 border border-border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {item.quantity}x {item.name}
                        </p>
                        {item.complements && item.complements.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {item.complements.map((comp, idx) => (
                              <p key={idx} className="text-xs text-muted-foreground pl-2">
                                + {comp.quantity}x {comp.name}
                                {parseFloat(comp.price) > 0 && (
                                  <span className="ml-1 text-muted-foreground/70">
                                    ({formatCurrency(parseFloat(comp.price) * comp.quantity)})
                                  </span>
                                )}
                              </p>
                            ))}
                          </div>
                        )}
                        {item.observation && (
                          <p className="text-xs text-muted-foreground mt-1 italic">Obs: {item.observation}</p>
                        )}
                      </div>
                      <p className="font-semibold text-sm">
                        {formatCurrency(
                          (parseFloat(item.price) + 
                            (item.complements?.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0) || 0)
                          ) * item.quantity
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {printerSettings?.showDividers !== false && (
                <div className="border-t border-dashed border-border" />
              )}

              {/* Totais */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateTotal)}</span>
                </div>
                
                {orderType === "entrega" && pdvDeliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Taxa de entrega:</span>
                    <span>{formatCurrency(pdvDeliveryFee)}</span>
                  </div>
                )}
                
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto ({appliedCoupon.code}):</span>
                    <span>-{formatCurrency(appliedCoupon.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                  <span>TOTAL:</span>
                  <span className="text-red-500">
                    {formatCurrency(
                      Math.max(0, calculateTotal + pdvDeliveryFee  -
                        (appliedCoupon?.discount || 0)
                      )
                    )}
                  </span>
                </div>
              </div>

              {/* Forma de Pagamento */}
              {paymentMethod && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pagamento:</span>
                    <span className="font-medium">
                      {paymentMethod === "cash" ? "Dinheiro" : 
                       paymentMethod === "card" ? "Cartão" : "PIX"}
                    </span>
                  </div>
                  {paymentMethod === "cash" && (changeAmount || receivedAmount) && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span>Valor recebido:</span>
                        <span>R$ {changeAmount || receivedAmount}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-green-600">
                        <span>Troco:</span>
                        <span>
                          {formatCurrency(
                            Math.max(0, 
                              parseFloat((changeAmount || receivedAmount).replace(",", ".")) - 
                              (calculateTotal + pdvDeliveryFee -
                                (appliedCoupon?.discount || 0)
                              )
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="p-4 border-t border-border/50 bg-muted/30 space-y-2">
              {pendingPixWhatsappOrder?.status === 'PENDING' && showPixWhatsappPendingModal ? (
                <div className="space-y-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span className="font-semibold">Aguardando pagamento...</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cobrança PIX enviada via WhatsApp. O pedido será finalizado automaticamente após o pagamento.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (!pendingPixWhatsappOrder.id || cancelPixWhatsappOrderMutation.isPending) return;
                      cancelPixWhatsappOrderMutation.mutate({
                        id: pendingPixWhatsappOrder.id,
                        status: 'cancelled',
                        cancellationReason: 'Cliente desistiu do pagamento PIX via WhatsApp',
                      });
                    }}
                    disabled={cancelPixWhatsappOrderMutation.isPending}
                  >
                    {cancelPixWhatsappOrderMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Ban className="h-4 w-4 mr-2" />
                    )}
                    Cancelar Pedido
                  </Button>
                </div>
              ) : (
                <>
                  {paymentMethod === "pix" && orderType !== "mesa" && (
                    <Button
                      onClick={createPixWhatsappOrder}
                      disabled={isClosingOrder || createOrderMutation.isPending || createPixWhatsappOrderMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                    >
                      {createPixWhatsappOrderMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Enviando cobrança...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="h-5 w-5 mr-2" />
                          Enviar Cobrança via WhatsApp
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setIsClosingOrder(true);
                      createOrder();
                      setShowConfirmationModal(false);
                      setIsClosingOrder(false);
                    }}
                    disabled={isClosingOrder || createOrderMutation.isPending || createPixWhatsappOrderMutation.isPending}
                    className="w-full bg-red-500 hover:bg-red-500 text-white py-3"
                  >
                    {isClosingOrder || createOrderMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Finalizando...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Confirmar e Finalizar Pedido
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Conferência do pedido com cobrança PIX em aberto */}
      <Sheet open={showPixWhatsappPendingModal && Boolean(pendingPixWhatsappOrder)} onOpenChange={setShowPixWhatsappPendingModal}>
        {pendingPixWhatsappOrder && (() => {
          const snapshot = pendingPixWhatsappOrder.snapshot;
          const snapshotCart = snapshot?.cart ?? [];
          const snapshotOrderType = snapshot?.orderType;
          const snapshotTotal = snapshot?.total ?? pendingPixWhatsappOrder.total ?? 0;
          const snapshotSubtotal = snapshot?.subtotal ?? Math.max(0, snapshotTotal - (snapshot?.deliveryFee || 0) + (snapshot?.discount || 0));
          const snapshotDeliveryFee = snapshot?.deliveryFee || 0;
          const snapshotDiscount = snapshot?.discount || 0;

          return (
          <SheetContent
            side="right"
            hideCloseButton={true}
            className="w-full sm:max-w-[371px] p-0 overflow-hidden flex flex-col h-full gap-0 z-[10000]"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Conferência do Pedido</SheetTitle>
              <SheetDescription>Aguardando confirmação de pagamento PIX.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Conferência do Pedido</h2>
                      <p className="text-sm text-white/80">
                        {snapshotOrderType === "mesa" ? "Consumo no local" :
                         snapshotOrderType === "retirada" ? "Retirada" :
                         snapshotOrderType === "entrega" ? "Entrega" :
                         `Pedido #${pendingPixWhatsappOrder.orderNumber}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPixWhatsappPendingModal(false)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tipo:</span>
                  <span className="px-4 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg">
                    {snapshotOrderType === "mesa" ? "Consumo" :
                     snapshotOrderType === "retirada" ? "Retirada" :
                     snapshotOrderType === "entrega" ? "Entrega" : "PIX"}
                  </span>
                </div>

                {snapshotOrderType === "entrega" && snapshot?.deliveryAddress?.street && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                    <p className="text-xs font-semibold text-foreground">Endereço de Entrega:</p>
                    <p className="text-sm">
                      {snapshot.deliveryAddress.street}, {snapshot.deliveryAddress.number}
                      {snapshot.deliveryAddress.complement && ` - ${snapshot.deliveryAddress.complement}`}
                    </p>
                    <p className="text-sm">{snapshot.deliveryAddress.neighborhood}</p>
                    {snapshot.deliveryAddress.reference && (
                      <p className="text-xs text-muted-foreground">Ref: {snapshot.deliveryAddress.reference}</p>
                    )}
                    {snapshot.deliveryAddress.name && (
                      <p className="text-xs text-muted-foreground mt-2">Cliente: {snapshot.deliveryAddress.name}</p>
                    )}
                    {snapshot.deliveryAddress.phone && (
                      <p className="text-xs text-muted-foreground">Tel: {snapshot.deliveryAddress.phone}</p>
                    )}
                  </div>
                )}

                {snapshotOrderType === "retirada" && (snapshot?.pickupClientName || snapshot?.pickupClientPhone) && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                    <p className="text-xs font-semibold text-foreground">Dados da Retirada:</p>
                    {snapshot.pickupClientName && <p className="text-sm">Cliente: {snapshot.pickupClientName}</p>}
                    {snapshot.pickupClientPhone && <p className="text-xs text-muted-foreground">Tel: {snapshot.pickupClientPhone}</p>}
                  </div>
                )}

                {printerSettings?.showDividers !== false && (
                  <div className="border-t border-dashed border-border" />
                )}

                <div className="space-y-2">
                  {snapshotCart.length > 0 ? (
                    snapshotCart.map((item, index) => (
                      <div key={index} className="p-3 border border-border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {item.quantity}x {item.name}
                            </p>
                            {item.complements && item.complements.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {item.complements.map((comp, idx) => (
                                  <p key={idx} className="text-xs text-muted-foreground pl-2">
                                    ↳ {comp.quantity}x {comp.name}
                                    {parseFloat(comp.price) > 0 && (
                                      <span className="ml-1 text-muted-foreground/70">
                                        ({formatCurrency(parseFloat(comp.price) * comp.quantity)})
                                      </span>
                                    )}
                                  </p>
                                ))}
                              </div>
                            )}
                            {item.observation && (
                              <p className="text-xs text-muted-foreground mt-1 italic">Obs: {item.observation}</p>
                            )}
                          </div>
                          <p className="font-semibold text-sm">
                            {formatCurrency((parseFloat(item.price) + (item.complements?.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0) || 0)) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 border border-dashed border-border rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Pedido #{pendingPixWhatsappOrder.orderNumber}</p>
                      <p className="text-xs text-muted-foreground/80 mt-1">Os itens deste pedido não estão mais disponíveis nesta sessão.</p>
                    </div>
                  )}
                </div>

                {printerSettings?.showDividers !== false && (
                  <div className="border-t border-dashed border-border" />
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(snapshotSubtotal)}</span>
                  </div>
                  {snapshotDeliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Taxa de entrega:</span>
                      <span>{formatCurrency(snapshotDeliveryFee)}</span>
                    </div>
                  )}
                  {snapshotDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto{snapshot?.couponCode ? ` (${snapshot.couponCode})` : ""}:</span>
                      <span>-{formatCurrency(snapshotDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                    <span>TOTAL:</span>
                    <span className="text-red-500">{formatCurrency(snapshotTotal)}</span>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pagamento:</span>
                    <span className="font-medium">PIX</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border/50 bg-muted/30 space-y-2">
                {pendingPixWhatsappOrder.status === 'APPROVED' ? (
                  <div className="space-y-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Check className="h-6 w-6" />
                      <span className="font-bold text-lg">Pagamento Confirmado!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Pedido finalizado com sucesso.</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Loader2 className="animate-spin h-5 w-5" />
                      <span className="font-semibold">Aguardando pagamento...</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cobrança PIX enviada via WhatsApp. O pedido será finalizado automaticamente após o pagamento.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (!pendingPixWhatsappOrder.id || cancelPixWhatsappOrderMutation.isPending) return;
                        cancelPixWhatsappOrderMutation.mutate({
                          id: pendingPixWhatsappOrder.id,
                          status: 'cancelled',
                          cancellationReason: 'Cliente desistiu do pagamento PIX via WhatsApp',
                        });
                      }}
                      disabled={cancelPixWhatsappOrderMutation.isPending}
                    >
                      {cancelPixWhatsappOrderMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Ban className="h-4 w-4 mr-2" />
                      )}
                      Cancelar Pedido
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
          );
        })()}
      </Sheet>
      
    </AdminLayout>
  );
}
