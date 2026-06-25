import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo, useRef } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  Clock,
  Receipt,
  ShoppingBag,
  UtensilsCrossed,
  Check,
  ClipboardList,
  Undo2,
  Eye,
  Printer,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Pencil,
  Scissors,
  Banknote,
  CreditCard,
  QrCode,
  DollarSign,
  Ticket,
  Eraser,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { TableHistoryMobile } from "@/components/TableHistorySidebar";

// Constante para persistência dos carrinhos
const CARTS_PER_TABLE_KEY = 'pdv-carts-per-table';

// Função helper para calcular preço do complemento no contexto de mesa (dine_in)
function getComplementPriceDineIn(
  item: { price: string | number; priceMode?: string; freeOnDelivery?: boolean; freeOnPickup?: boolean; freeOnDineIn?: boolean }
): number {
  if (item.priceMode === 'free') {
    if (item.freeOnDineIn) return 0;
    if (!item.freeOnDelivery && !item.freeOnPickup && !item.freeOnDineIn) return 0;
    return Number(item.price);
  }
  return Number(item.price);
}

// Tipos
type CartItem = {
  productId: number;
  name: string;
  price: string;
  quantity: number;
  observation: string;
  image: string | null;
  complements: Array<{ id: number; name: string; price: string; quantity: number }>;
};

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  images: string[] | null;
  status: 'active' | 'paused' | 'archived';
  hasStock: boolean;
  stockQuantity: number | null;
  categoryId: number | null;
};

interface MobilePDVModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number;
  tableId?: number;
  tabId?: number;
  occupiedAt?: Date | string | null;
  displayNumber?: string | null;
  onOrderCreated?: () => void;
  tabItemsCount?: number;
  tableTotal?: number;
  tableLabel?: string | null;
}

export function MobilePDVModal({
  isOpen,
  onClose,
  tableNumber,
  tableId,
  tabId,
  occupiedAt,
  displayNumber,
  onOrderCreated,
  tabItemsCount = 0,
  tableTotal = 0,
  tableLabel,
}: MobilePDVModalProps) {
  const tableDisplayName = displayNumber || tableNumber.toString();
  const { data: establishment } = trpc.establishment.get.useQuery();
  const establishmentId = establishment?.id ?? null;

  // Label (identificação) da mesa
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(tableLabel || '');
  const [displayLabel, setDisplayLabel] = useState(tableLabel || '');
  const labelInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const updateLabelMutation = trpc.tables.updateLabel.useMutation({
    onSuccess: () => {
      setDisplayLabel(labelValue.trim());
      utils.tables.list.invalidate();
      setIsEditingLabel(false);
    },
    onError: () => toast.error('Erro ao salvar identificação'),
  });

  useEffect(() => {
    setLabelValue(tableLabel || '');
    setDisplayLabel(tableLabel || '');
  }, [tableLabel]);

  // Buscar categorias e produtos
  const { data: categories } = trpc.category.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );
  const { data: products, isLoading: productsLoading } = trpc.product.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId, staleTime: 30_000 }
  );

  // Query para buscar configurações de impressão
  const { data: printerSettings } = trpc.printer.getSettings.useQuery(
    { establishmentId: establishmentId ?? 0 },
    { enabled: !!establishmentId && establishmentId > 0 }
  );

  // --- Carrinho por mesa ---
  const [cartsPerTable, setCartsPerTable] = useState<Record<number, CartItem[]>>(() => {
    try {
      const saved = localStorage.getItem(CARTS_PER_TABLE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const cart = useMemo(() => {
    if (!tableId) return [];
    return cartsPerTable[tableId] || [];
  }, [cartsPerTable, tableId]);

  const setCart = (updater: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    if (!tableId) return;
    setCartsPerTable(prev => {
      const currentCart = prev[tableId] || [];
      const newCart = typeof updater === 'function' ? updater(currentCart) : updater;
      const updated = { ...prev, [tableId]: newCart };
      try {
        localStorage.setItem(CARTS_PER_TABLE_KEY, JSON.stringify(updated));
        queueMicrotask(() => {
          window.dispatchEvent(new CustomEvent('cartsPerTableUpdated', { detail: updated }));
        });
      } catch {}
      return updated;
    });
  };

  // --- Estados ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productObservation, setProductObservation] = useState("");
  const [selectedComplements, setSelectedComplements] = useState<Map<number, Map<number, number>>>(new Map());
  const [selectedComplementImage, setSelectedComplementImage] = useState<string | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editingCartItem, setEditingCartItem] = useState<{ index: number; item: CartItem } | null>(null);
  const [expandedCartItem, setExpandedCartItem] = useState<number | null>(null);
  const [showCloseTableModal, setShowCloseTableModal] = useState(false);
  const [showCloseTypeModal, setShowCloseTypeModal] = useState(false);
  const [showPartialCloseModal, setShowPartialCloseModal] = useState(false);
  const [selectedPartialItems, setSelectedPartialItems] = useState<number[]>([]);
  const [partialPaymentMethod, setPartialPaymentMethod] = useState<string>('cash');
  const [showHistory, setShowHistory] = useState(false);
  const [showLoosePaymentModal, setShowLoosePaymentModal] = useState(false);
  const [loosePaymentAmount, setLoosePaymentAmount] = useState('');
  const [loosePaymentMethod, setLoosePaymentMethod] = useState<string>('cash');
  const [showCouponField, setShowCouponField] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string; discount: number} | null>(null);
  // Estado para forma de pagamento no fechamento completo
  const [fullClosePaymentMethod, setFullClosePaymentMethod] = useState<string>('cash');
  const [activeView, setActiveView] = useState<'items' | 'search'>('items');

  // Limpar/Desfazer
  const [clearedCart, setClearedCart] = useState<CartItem[] | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Comanda items
  const [expandedTabItemId, setExpandedTabItemId] = useState<number | null>(null);
  const [deleteConfirmItemId, setDeleteConfirmItemId] = useState<number | null>(null);
  const [deleteConfirmItemName, setDeleteConfirmItemName] = useState("");

  // Aba selecionada
  const [selectedTab, setSelectedTab] = useState<'consumo' | 'comanda'>('consumo');

  // Query para buscar itens da comanda
  const { data: tabData, refetch: refetchTabItems } = trpc.tabs.getByTable.useQuery(
    { tableId: tableId! },
    {
      enabled: !!tableId && selectedTab === 'comanda',
      refetchInterval: selectedTab === 'comanda' ? 5000 : false
    }
  );

  // Buscar complementos do produto selecionado
  const { data: productComplements } = trpc.publicMenu.getProductComplements.useQuery(
    { productId: selectedProduct?.id || 0 },
    { enabled: !!selectedProduct?.id }
  );

  // Listas processadas
  const productsList = products?.products || [];

  // Normalizar texto removendo acentos para busca
  const normalizeText = (text: string) =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // Filtrar produtos pela busca (ignora acentos)
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const normalizedQuery = normalizeText(searchQuery);
    return productsList.filter((p) => {
      if (p.status !== 'active') return false;
      return normalizeText(p.name).includes(normalizedQuery) ||
        (p.description && normalizeText(p.description).includes(normalizedQuery));
    });
  }, [productsList, searchQuery]);

  // --- Mutations ---
  const addTabItemsMutation = trpc.tabs.addItems.useMutation({
    onSuccess: () => {
      toast.success("Itens adicionados à comanda!");
      clearCartSilent();
      onOrderCreated?.();
    },
    onError: (error) => toast.error(error.message || "Erro ao adicionar itens"),
  });

  const openTableMutation = trpc.tables.open.useMutation({
    onSuccess: (data) => {
      addTabItemsMutation.mutate({
        tabId: data.tabId,
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: ((parseFloat(item.price) + item.complements.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0)) * item.quantity).toFixed(2),
          complements: item.complements.map(c => ({ name: c.name, price: parseFloat(c.price), quantity: c.quantity })),
          notes: item.observation || undefined
        }))
      });
    },
    onError: (error) => toast.error(error.message || "Erro ao abrir mesa"),
  });

  const requestBillMutation = trpc.tables.requestBill.useMutation({
    onSuccess: () => {
      toast.success("Conta solicitada! O caixa será notificado.");
      onClose();
    },
    onError: (error) => toast.error(error.message || "Erro ao solicitar conta"),
  });

  const closeTableMutation = trpc.tables.close.useMutation({
    onSuccess: () => {
      toast.success(`Mesa ${tableDisplayName} fechada com sucesso!`);
      clearCartSilent();
      onOrderCreated?.();
      onClose();
    },
    onError: (error) => toast.error(error.message || "Erro ao fechar mesa"),
  });

  const partialCloseMutation = trpc.tables.partialClose.useMutation({
    onSuccess: (data) => {
      if (data.remainingCount === 0) {
        toast.success(`Fechamento parcial concluído! Mesa liberada.`);
        clearCartSilent();
        onOrderCreated?.();
        onClose();
      } else {
        toast.success(`Fechamento parcial: R$ ${data.partialTotal} pago. ${data.remainingCount} item(ns) restante(s) na mesa.`);
        refetchTabItems();
      }
      utils.tables.list.invalidate();
      setShowPartialCloseModal(false);
      setSelectedPartialItems([]);
      setPartialPaymentMethod('cash');
    },
    onError: (error) => {
      toast.error(error.message || "Erro no fechamento parcial");
    }
  });

  // Mutation para pagamento avulso
  const loosePaymentMutation = trpc.tables.loosePayment.useMutation({
    onSuccess: (data) => {
      if (parseFloat(data.newBalance) <= 0) {
        toast.success(`Pagamento avulso de R$ ${parseFloat(loosePaymentAmount).toFixed(2)} registrado! Mesa liberada.`);
        clearCartSilent();
        onOrderCreated?.();
        onClose();
      } else {
        toast.success(`Pagamento avulso de R$ ${parseFloat(loosePaymentAmount).toFixed(2)} registrado! Saldo restante: R$ ${data.newBalance}`);
        refetchTabItems();
      }
      utils.tables.list.invalidate();
      utils.tables.getPaymentsTotal.invalidate();
      setShowLoosePaymentModal(false);
      setLoosePaymentAmount('');
      setLoosePaymentMethod('cash');
    },
    onError: (error) => {
      toast.error(error.message || "Erro no pagamento avulso");
    }
  });

  // Query para buscar total de pagamentos avulsos (sempre ativa quando há mesa)
  const { data: paymentsData } = trpc.tables.getPaymentsTotal.useQuery(
    { tableId: tableId! },
    { enabled: !!tableId }
  );

  // Calcular total de pagamentos avulsos já feitos
  const loosePaymentsTotal = paymentsData ? parseFloat(paymentsData.total) : 0;

  const updateTabItemMutation = trpc.tabs.updateItem.useMutation({
    onSuccess: () => refetchTabItems(),
    onError: (error) => toast.error(error.message || "Erro ao atualizar item"),
  });

  const cancelTabItemMutation = trpc.tabs.cancelItem.useMutation({
    onSuccess: () => {
      toast.success("Item removido da comanda!");
      setDeleteConfirmItemId(null);
      setDeleteConfirmItemName("");
      setExpandedTabItemId(null);
      refetchTabItems();
    },
    onError: (error) => toast.error(error.message || "Erro ao remover item"),
  });

  // --- Funções do carrinho ---
  const areComplementsEqual = (a: CartItem['complements'], b: CartItem['complements']): boolean => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort((x, y) => x.id - y.id);
    const sortedB = [...b].sort((x, y) => x.id - y.id);
    return sortedA.every((itemA, index) => {
      const itemB = sortedB[index];
      return itemA.id === itemB.id && itemA.quantity === itemB.quantity;
    });
  };

  const addToCart = (product: Product, quantity: number, observation: string, complements: CartItem['complements']) => {
    // Validar estoque antes de adicionar
    if (product.hasStock && product.stockQuantity != null) {
      const alreadyInCart = cart
        .filter(item => item.productId === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);
      if (alreadyInCart + quantity > product.stockQuantity) {
        const remaining = Math.max(0, product.stockQuantity - alreadyInCart);
        toast.error(`Estoque insuficiente: apenas ${remaining} unidade(s) disponível(is)`);
        return;
      }
    }
    
    setCart(prev => {
      const existingIndex = prev.findIndex(item =>
        item.productId === product.id &&
        item.observation === observation &&
        areComplementsEqual(item.complements, complements)
      );
      if (existingIndex !== -1) {
        return prev.map((item, index) =>
          index === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        observation,
        image: product.images?.[0] || null,
        complements
      }];
    });
  };

  const updateCartItem = (index: number, updates: Partial<CartItem>) => {
    setCart(prev => {
      const item = prev[index];
      if (updates.quantity && updates.quantity > (item?.quantity ?? 0)) {
        // Incrementando quantidade - verificar estoque
        const product = (products?.products || []).find((p: Product) => p.id === item?.productId);
        if (product && product.hasStock && product.stockQuantity != null) {
          const totalInCart = prev
            .filter(ci => ci.productId === product.id)
            .reduce((sum, ci) => sum + ci.quantity, 0);
          const newTotal = totalInCart - (item?.quantity ?? 0) + updates.quantity;
          if (newTotal > product.stockQuantity) {
            toast.error(`Estoque insuficiente: apenas ${product.stockQuantity} unidade(s) disponível(is)`);
            return prev;
          }
        }
      }
      return prev.map((item, i) => i === index ? { ...item, ...updates } : item);
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCartSilent = () => {
    setCart([]);
    setExpandedCartItem(null);
    setClearedCart(null);
    setUndoCountdown(0);
    if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null; }
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
  };

  const clearCart = () => {
    if (cart.length > 0) {
      setClearedCart([...cart]);
      setUndoCountdown(10);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        setUndoCountdown(prev => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
            setClearedCart(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    setCart([]);
    setExpandedCartItem(null);
  };

  const undoClearCart = () => {
    if (clearedCart) {
      if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null; }
      if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
      setCart(clearedCart);
      setClearedCart(null);
      setUndoCountdown(0);
      toast.success("Itens restaurados!");
    }
  };

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // --- Cálculos ---
  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const itemPrice = parseFloat(item.price);
      const complementsPrice = item.complements.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0);
      return total + (itemPrice + complementsPrice) * item.quantity;
    }, 0);
  };

  const calculateTabTotal = () => {
    if (!tabData?.items) return 0;
    return tabData.items
      .filter((item: any) => item.status !== 'cancelled')
      .reduce((total: number, item: any) => {
        const itemPrice = parseFloat(item.unitPrice || '0');
        const complementsPrice = item.complements?.reduce((sum: number, c: any) => sum + parseFloat(c.price || '0') * (c.quantity || 1), 0) || 0;
        return total + (itemPrice + complementsPrice) * item.quantity;
      }, 0);
  };

  const getDisplayTotal = () => {
    if (selectedTab === 'comanda') return calculateTabTotal();
    return calculateTotal();
  };

  // Utilidades tRPC para chamadas imperativas
  const trpcUtils = trpc.useUtils();

  // --- Handlers ---
  const handleProductClick = (product: Product) => {
    // Produto indisponível apenas quando tem controle de estoque ativo E quantidade = 0
    if (product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0)) { toast.error("Produto indisponível"); return; }
    // Dismiss mobile keyboard when opening product detail
    (document.activeElement as HTMLElement)?.blur();
    setSelectedProduct(product);
    setProductQuantity(1);
    setProductObservation("");
    setSelectedComplements(new Map());
    setSelectedComplementImage(null);
    setIsEditingMode(false);
    setEditingCartItem(null);
  };

  // Adicionar item rapidamente (botão +): se não tem complementos, adiciona direto
  const handleQuickAdd = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    // Produto indisponível apenas quando tem controle de estoque ativo E quantidade = 0
    if (product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0)) { toast.error("Produto indisponível"); return; }
    
    try {
      // Verificar se o produto tem complementos
      const complements = await trpcUtils.publicMenu.getProductComplements.fetch({ productId: product.id });
      
      // Filtrar por horário/dia (mesma lógica do backend já faz isso)
      const hasComplements = complements && complements.length > 0;
      
      if (hasComplements) {
        // Tem complementos: abrir modal de detalhes
        handleProductClick(product);
      } else {
        // Sem complementos: adicionar direto ao carrinho
        addToCart(product, 1, "", []);
        toast.success(`${product.name} adicionado!`);
      }
    } catch {
      // Em caso de erro, abrir modal de detalhes como fallback
      handleProductClick(product);
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    // Verificar complementos obrigatórios
    if (productComplements) {
      for (const group of productComplements) {
        if (group.minQuantity > 0) {
          const selectedInGroup = selectedComplements.get(group.id);
          const totalSelected = selectedInGroup
            ? Array.from(selectedInGroup.values()).reduce((a, b) => a + b, 0)
            : 0;
          if (totalSelected < group.minQuantity) {
            toast.error(`Selecione pelo menos ${group.minQuantity} item(ns) em "${group.name}"`);
            return;
          }
        }
      }
    }

    const complements: CartItem['complements'] = [];
    selectedComplements.forEach((itemMap, groupId) => {
      itemMap.forEach((qty, itemId) => {
        const group = productComplements?.find(g => g.id === groupId);
        const item = group?.items.find(i => i.id === itemId);
        if (item && qty > 0) {
          complements.push({ id: item.id, name: item.name, price: String(getComplementPriceDineIn(item)), quantity: qty });
        }
      });
    });

    if (isEditingMode && editingCartItem !== null) {
      updateCartItem(editingCartItem.index, { quantity: productQuantity, observation: productObservation, complements });
      toast.success("Item atualizado!");
    } else {
      addToCart(selectedProduct, productQuantity, productObservation, complements);
      toast.success("Item adicionado!");
    }

    setSelectedProduct(null);
    setSelectedComplementImage(null);
    setIsEditingMode(false);
    setEditingCartItem(null);
    setSearchQuery("");
    setActiveView('items');
  };

  const handleEditCartItem = (index: number, item: CartItem) => {
    const product = productsList.find(p => p.id === item.productId);
    if (!product) { toast.error("Produto não encontrado"); return; }
    setSelectedProduct(product);
    setProductQuantity(item.quantity);
    setProductObservation(item.observation);
    setSelectedComplements(new Map());
    setSelectedComplementImage(null);
    setIsEditingMode(true);
    setEditingCartItem({ index, item });
  };

  // Restaurar complementos ao editar
  useEffect(() => {
    if (isEditingMode && editingCartItem && productComplements && productComplements.length > 0) {
      const complementsMap = new Map<number, Map<number, number>>();
      editingCartItem.item.complements.forEach(savedComp => {
        productComplements.forEach(group => {
          const foundItem = group.items.find(item => item.id === savedComp.id);
          if (foundItem) {
            const currentGroupMap = complementsMap.get(group.id) || new Map<number, number>();
            currentGroupMap.set(savedComp.id, savedComp.quantity);
            complementsMap.set(group.id, currentGroupMap);
          }
        });
      });
      setSelectedComplements(complementsMap);
    }
  }, [isEditingMode, editingCartItem, productComplements]);

  // Imprimir recibo
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
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
      const response = await fetch(`/api/trpc/coupon.validate?input=${encodeURIComponent(JSON.stringify({
        json: {
          establishmentId,
          code: couponCode.toUpperCase(),
          orderValue: getDisplayTotal(),
          deliveryType: "self_service"
        }
      }))}`).then(res => res.json());
      const result = response.result?.data?.json || response.result?.data;
      if (result?.valid && result?.coupon) {
        toast.success(`Cupom ${couponCode.toUpperCase()} aplicado!`);
        setAppliedCoupon({ 
          code: couponCode.toUpperCase(), 
          discount: result.discount
        });
        setCouponCode('');
      } else {
        toast.error(result?.error || "Cupom inválido");
      }
    } catch (error) {
      console.error("Erro ao validar cupom:", error);
      toast.error("Erro ao validar cupom");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handlePrintTabReceipt = async () => {
    if (!tabId) return;
    const printMethod = printerSettings?.defaultPrintMethod || 'normal';
    if (printMethod === 'automatic') {
      // Impressão automática via Mindi Printer - não faz nada no frontend
      return;
    } else {
      try {
        const receiptUrl = `${window.location.origin}/api/print/tab-receipt/${tabId}`;
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
        iframe.src = receiptUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          setTimeout(() => { iframe.contentWindow?.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 500);
        };
      } catch (error) { console.error("Erro ao imprimir recibo:", error); }
    }
  };

  const handleConfirmCloseTable = async () => {
    if (!tableId || !tabId) return;
    await handlePrintTabReceipt();
    // Calcular saldo restante (total - pagamentos avulsos já feitos)
    const remainingBalance = Math.max(0, calculateTabTotal() - loosePaymentsTotal);
    closeTableMutation.mutate({ tableId, paymentMethod: fullClosePaymentMethod, paidAmount: remainingBalance, changeAmount: 0 });
    setShowCloseTableModal(false);
  };

  // Calcular total dos itens selecionados para fechamento parcial
  const calculatePartialTotal = () => {
    if (!tabData?.items) return 0;
    return tabData.items
      .filter((item: any) => item.status !== 'cancelled' && selectedPartialItems.includes(item.id))
      .reduce((total: number, item: any) => total + parseFloat(item.totalPrice || '0'), 0);
  };

  // Toggle seleção de item para fechamento parcial
  const togglePartialItem = (itemId: number) => {
    setSelectedPartialItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // Selecionar/deselecionar todos os itens
  const toggleAllPartialItems = () => {
    if (!tabData?.items) return;
    const activeItems = tabData.items.filter((item: any) => item.status !== 'cancelled');
    if (selectedPartialItems.length === activeItems.length) {
      setSelectedPartialItems([]);
    } else {
      setSelectedPartialItems(activeItems.map((item: any) => item.id));
    }
  };

  // Confirmar fechamento parcial
  const handleConfirmPartialClose = () => {
    if (!tableId || selectedPartialItems.length === 0) return;
    partialCloseMutation.mutate({
      tableId: tableId!,
      itemIds: selectedPartialItems,
      paymentMethod: partialPaymentMethod,
    });
  };

  // Confirmar pagamento avulso
  const handleConfirmLoosePayment = () => {
    const amount = parseFloat(loosePaymentAmount);
    if (!tableId || !amount || amount <= 0) return;
    loosePaymentMutation.mutate({
      tableId: tableId!,
      amount,
      paymentMethod: loosePaymentMethod,
    });
  };

  const handleFinishOrder = () => {
    if (selectedTab === 'comanda' && tabId && tabData?.items && tabData.items.filter((item: any) => item.status !== 'cancelled').length > 0) {
      // Mobile: solicitar conta (garçom pede fechamento ao caixa)
      if (tableId) {
        requestBillMutation.mutate({ tableId });
      }
      return;
    }
    if (cart.length === 0) { toast.error("Adicione itens ao pedido"); return; }
    if (tabId) {
      addTabItemsMutation.mutate({
        tabId,
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: ((parseFloat(item.price) + item.complements.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0)) * item.quantity).toFixed(2),
          complements: item.complements.map(c => ({ name: c.name, price: parseFloat(c.price), quantity: c.quantity })),
          notes: item.observation || undefined
        }))
      });
      return;
    }
    if (tableId) {
      openTableMutation.mutate({ tableId, guests: 1 });
      return;
    }
  };

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedProduct(null);
      setActiveView('items');
      setSearchFocused(false);
    }
  }, [isOpen]);

  // Resetar clearedCart quando trocar de mesa
  useEffect(() => {
    setClearedCart(null);
    setUndoCountdown(0);
    // Se a mesa não tem comanda (mesa livre), voltar para aba "consumo" (Mesa)
    if (!tabId) {
      setSelectedTab('consumo');
    }
  }, [tableId, tableNumber, tabId]);

  // Formatação de duração
  const formatDuration = (startTime: Date | string | null | undefined) => {
    if (!startTime) return "—";
    const start = typeof startTime === "string" ? new Date(startTime) : startTime;
    const diff = Date.now() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return minutes === 0 ? `${hours}h` : `${hours}h${minutes}`;
    return `${minutes}Min`;
  };

  // Contagem de itens da comanda
  const tabItemsActive = tabData?.items?.filter((item: any) => item.status !== 'cancelled') || [];
  const totalItemsCount = cart.length + tabItemsActive.length;

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Tela Cheia */}
      <div className="fixed inset-0 z-[71] md:hidden animate-in slide-in-from-bottom duration-300">
        <div className="bg-muted-foreground/20 flex flex-col w-full h-full overflow-hidden">

          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex flex-col gap-1" style={{ minHeight: '68px' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <UtensilsCrossed className="h-5 w-5 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-foreground">
                  Mesa {tableDisplayName}
                  {displayLabel && !isEditingLabel && (
                    <span className="text-muted-foreground font-normal"> | </span>
                  )}
                  {displayLabel && !isEditingLabel && (
                    <span className="text-amber-700 font-semibold">{displayLabel}</span>
                  )}
                  <span className="text-muted-foreground font-normal"> | </span>
                  <span className="text-red-500">{formatCurrency(selectedTab === 'comanda' && loosePaymentsTotal > 0 ? Math.max(0, getDisplayTotal() - loosePaymentsTotal) : getDisplayTotal())}</span>
                </h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            {/* Campo de identificação inline */}
            {tableId && (
              <div className="flex items-center gap-2 ml-12">
                {isEditingLabel ? (
                  <>
                    <input
                      ref={labelInputRef}
                      type="text"
                      value={labelValue}
                      onChange={(e) => setLabelValue(e.target.value.slice(0, 15))}
                      placeholder="Identificação..."
                      className="text-sm border border-border rounded px-2 py-0.5 w-32 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-red-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateLabelMutation.mutate({ id: tableId!, label: labelValue.trim() || null });
                        } else if (e.key === 'Escape') {
                          setLabelValue(displayLabel || '');
                          setIsEditingLabel(false);
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => updateLabelMutation.mutate({ id: tableId!, label: labelValue.trim() || null })}
                      className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setLabelValue(displayLabel || ''); setIsEditingLabel(false); }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setIsEditingLabel(true); setTimeout(() => labelInputRef.current?.focus(), 50); }}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    {displayLabel ? 'Editar identificação' : 'Adicionar identificação'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tabs: Consumo / Comanda */}
          {tabId && (
            <div className="flex border-b border-border bg-card">
              <button
                onClick={() => setSelectedTab('consumo')}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium transition-colors",
                  selectedTab === 'consumo'
                    ? "text-red-500 border-b-2 border-red-500"
                    : "text-muted-foreground"
                )}
              >
                Consumo {cart.length > 0 && <span className="ml-1 bg-red-100 text-red-500 px-1.5 py-0.5 rounded-lg text-xs">{cart.length}</span>}
              </button>
              <button
                onClick={() => setSelectedTab('comanda')}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium transition-colors",
                  selectedTab === 'comanda'
                    ? "text-red-500 border-b-2 border-red-500"
                    : "text-muted-foreground"
                )}
              >
                Comanda {tabItemsActive.length > 0 && <span className="ml-1 bg-muted text-muted-foreground px-1.5 py-0.5 rounded-lg text-xs">{tabItemsActive.length}</span>}
              </button>
            </div>
          )}

          {/* Conteúdo principal - scrollável */}
          <div className="flex-1 overflow-y-auto overscroll-contain" style={{backgroundColor: '#f9fafc'}}>
            {selectedTab === 'consumo' ? (
              <>
                {/* Campo de busca de produtos - estilo dropdown como menu público */}
                <div className="p-4 border-b border-border sticky top-0 bg-card z-10">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar produto para adicionar..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.trim()) setActiveView('search');
                        else setActiveView('items');
                      }}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                      className="w-full pl-9 pr-8 h-10 bg-muted border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-card transition-colors placeholder:text-muted-foreground"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => { setSearchQuery(""); setActiveView('items'); setSearchFocused(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    )}

                    {/* Dropdown de resultados flutuante - estilo menu público */}
                    {searchQuery.trim() && filteredProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-xl shadow-lg border border-border max-h-[60vh] overflow-y-auto z-[60] p-2 space-y-1">
                        {filteredProducts.slice(0, 15).map((product) => (
                          <div
                            key={product.id}
                            className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left bg-card rounded-lg border border-border/50 border-l-[3px] border-l-red-500"
                          >
                            <div className="flex-1 min-w-0" onClick={() => { handleProductClick(product); setSearchQuery(""); setSearchFocused(false); setActiveView('items'); }}>
                              <p className="font-medium text-foreground text-sm truncate">{product.name}</p>
                              {product.description && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{product.description}</p>
                              )}
                            </div>
                            <button
                              onMouseDown={(e) => { e.preventDefault(); handleQuickAdd(product, e as any); }}
                              className="flex items-center gap-2 flex-shrink-0 pl-3 pr-1 py-2 -my-2 -mr-1 rounded-r-lg hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer"
                            >
                              <span className="text-sm font-semibold text-red-500">{formatCurrency(parseFloat(product.price))}</span>
                              <div className="bg-red-50 rounded-full flex items-center justify-center" style={{width: '32px', height: '32px', minWidth: '32px'}}>
                                <Plus className="h-4 w-4 text-red-500" />
                              </div>
                            </button>
                          </div>
                        ))}
                        {filteredProducts.length > 15 && (
                          <div className="px-4 py-2 text-center text-xs text-muted-foreground bg-muted/50 rounded-lg">
                            +{filteredProducts.length - 15} outros resultados
                          </div>
                        )}
                      </div>
                    )}

                    {/* Loading ou nenhum resultado */}
                    {searchQuery.trim() && filteredProducts.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-lg shadow-lg border border-border p-4 z-[60]">
                        {productsLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                            <p className="text-sm text-muted-foreground">Carregando produtos...</p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center">Nenhum produto encontrado</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lista de itens no carrinho - sempre visível */}
                <div className="p-4">
                    {cart.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <ShoppingBag className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
                        <p className="font-medium text-sm">Nenhum item no pedido</p>
                        <p className="text-xs mt-1">Use a busca acima para adicionar produtos</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cart.map((item, index) => {
                          const itemTotal = (parseFloat(item.price) + item.complements.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0)) * item.quantity;
                          const isExpanded = expandedCartItem === index;
                          return (
                            <div key={index} className="bg-card rounded-xl shadow-sm overflow-hidden border-l-4 border-l-red-500">
                              <button
                                onClick={() => setExpandedCartItem(isExpanded ? null : index)}
                                className="w-full flex items-center gap-3 p-3 text-left"
                              >
                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-red-500">{item.quantity}x</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                                  {item.complements.length > 0 && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {item.complements.map(c => c.name).join(', ')}
                                    </p>
                                  )}
                                  {item.observation && (
                                    <p className="text-xs text-muted-foreground italic truncate">Obs: {item.observation}</p>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="font-semibold text-sm">{formatCurrency(itemTotal)}</p>
                                </div>
                              </button>
                              <div className="px-3 py-2 bg-muted/50 border-t border-border/50 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <button
                                      className="w-[28px] h-[28px] flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors disabled:opacity-50"
                                      disabled={item.quantity <= 1}
                                      onClick={() => updateCartItem(index, { quantity: item.quantity - 1 })}
                                    >
                                      <Minus className="h-3.5 w-3.5" />
                                    </button>
                                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                                    <button
                                      className="w-[28px] h-[28px] flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors"
                                      onClick={() => updateCartItem(index, { quantity: item.quantity + 1 })}
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleEditCartItem(index, item)}
                                      className="w-[28px] h-[28px] flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => removeFromCart(index)}
                                      className="w-[28px] h-[28px] flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
              </>
            ) : (
              /* Aba Comanda - itens já enviados */
              <div className="p-4">
                {tabItemsActive.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
                    <p className="font-medium text-sm">Nenhum item na comanda</p>
                    <p className="text-xs mt-1">Os itens aparecerão aqui após serem enviados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tabItemsActive.map((item: any) => {
                      const itemTotal = parseFloat(item.totalPrice) || 0;
                      let complements: any[] = [];
                      try { complements = typeof item.complements === 'string' ? JSON.parse(item.complements) : (item.complements || []); } catch {}
                      const isExpanded = expandedTabItemId === item.id;

                      return (
                        <div key={item.id} className="bg-card rounded-xl shadow-sm overflow-hidden border-l-4 border-l-red-500">
                          <button
                            onClick={() => setExpandedTabItemId(isExpanded ? null : item.id)}
                            className="w-full flex items-center gap-3 p-3 text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-red-500">{item.quantity}x</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground">{item.productName}</p>
                              {complements.length > 0 && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {complements.map((c: any) => c.name || (c.items ? c.items.map((ci: any) => ci.name).join(', ') : '')).filter(Boolean).join(', ')}
                                </p>
                              )}
                              {item.notes && <p className="text-xs text-muted-foreground italic">Obs: {item.notes}</p>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-sm">{formatCurrency(itemTotal)}</p>
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground ml-auto mt-0.5" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto mt-0.5" />}
                            </div>
                          </button>
                          <div className="px-3 py-2 bg-muted/50 border-t border-border/50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  className="w-[28px] h-[28px] flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors disabled:opacity-50"
                                  disabled={item.quantity <= 1 || updateTabItemMutation.isPending}
                                  onClick={(e) => { e.stopPropagation(); updateTabItemMutation.mutate({ id: item.id, quantity: item.quantity - 1 }); }}
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                                <button
                                  className="w-[28px] h-[28px] flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors disabled:opacity-50"
                                  disabled={updateTabItemMutation.isPending}
                                  onClick={(e) => { e.stopPropagation(); updateTabItemMutation.mutate({ id: item.id, quantity: item.quantity + 1 }); }}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <button
                                className="w-[28px] h-[28px] flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                                disabled={cancelTabItemMutation.isPending}
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmItemId(item.id); setDeleteConfirmItemName(item.productName); }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer fixo */}
          <div className="border-t border-border/50 bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-sm font-semibold">{formatCurrency(getDisplayTotal())}</span>
            </div>
            {/* Pagamentos avulsos já feitos */}
            {selectedTab === 'comanda' && loosePaymentsTotal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Já pago (avulso)</span>
                <span className="font-medium text-green-600">-{formatCurrency(loosePaymentsTotal)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="font-semibold">{selectedTab === 'comanda' && loosePaymentsTotal > 0 ? 'Saldo restante' : 'Total'}</span>
              <span className="text-lg font-bold text-red-500">
                {formatCurrency(Math.max(0, getDisplayTotal() - (selectedTab === 'comanda' ? loosePaymentsTotal : 0)))}
              </span>
            </div>
            <div className="flex gap-2">
              {/* Botão de Cupom */}
              <Button
                variant="outline"
                className={cn("px-3 flex-shrink-0", showCouponField && "border-red-500 bg-red-50")}
                onClick={() => setShowCouponField(!showCouponField)}
              >
                <Ticket className={cn("h-4 w-4", showCouponField ? "text-red-500" : "text-muted-foreground")} />
              </Button>
              {/* Botão de Histórico */}
              <Button
                variant="outline"
                className={cn("px-3 flex-shrink-0", showHistory && "border-blue-500 bg-blue-50")}
                onClick={() => setShowHistory(true)}
                disabled={!tableId}
              >
                <Clock className={cn("h-4 w-4", showHistory ? "text-blue-500" : "text-muted-foreground")} />
              </Button>
              {/* Botão Imprimir - apenas quando aba Comanda está selecionada */}
              {selectedTab === 'comanda' && tabId && (
                <Button
                  variant="outline"
                  className="px-3 flex-shrink-0"
                  onClick={handlePrintTabReceipt}
                >
                  <Printer className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
              {/* Botão Limpar/Desfazer */}
              {selectedTab !== 'comanda' && (clearedCart ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={undoClearCart}
                >
                  <Undo2 className="h-4 w-4 mr-1" />
                  Desfazer ({undoCountdown})
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="px-3 flex-shrink-0"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  <Eraser className="h-4 w-4 text-muted-foreground" />
                </Button>
              ))}
              {/* Botão Fechar conta / Enviar pedido */}
              <Button
                onClick={handleFinishOrder}
                disabled={
                  (selectedTab === 'comanda'
                    ? (!tabData?.items || tabData.items.filter((item: any) => item.status !== 'cancelled').length === 0)
                    : cart.length === 0
                  ) || addTabItemsMutation.isPending || openTableMutation.isPending || closeTableMutation.isPending || requestBillMutation.isPending
                }
                className="flex-1 bg-red-500 hover:bg-red-500 text-white"
              >
                {selectedTab !== 'comanda' && <ClipboardList className="h-4 w-4 mr-2" />}
                {(addTabItemsMutation.isPending || openTableMutation.isPending || closeTableMutation.isPending || requestBillMutation.isPending)
                  ? (requestBillMutation.isPending ? "Solicitando..." : closeTableMutation.isPending ? "Fechando..." : "Enviando...")
                  : selectedTab === 'comanda'
                    ? "Solicitar conta"
                    : "Enviar pedido"}
              </Button>
            </div>
            {/* Campo de Cupom */}
            {showCouponField && (
              <div className="mt-2 flex gap-2">
                {appliedCoupon ? (
                  <div className="flex-1 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">{appliedCoupon.code}</span>
                      <span className="text-xs text-green-600">-{formatCurrency(appliedCoupon.discount)}</span>
                    </div>
                    <button onClick={() => setAppliedCoupon(null)} className="text-green-600 hover:text-green-800">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Código do cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || isValidatingCoupon}
                      variant="outline"
                    >
                      {isValidatingCoupon ? "..." : "Aplicar"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Produto (bottom sheet) - Cópia exata do menu público */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[80] flex items-end md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setSelectedProduct(null); setSelectedComplementImage(null); setIsEditingMode(false); setEditingCartItem(null); }}
          />
          
          {/* Modal Content - Bottom Sheet no mobile */}
          <div className="relative bg-card rounded-t-2xl shadow-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300" style={{ touchAction: 'pan-y' }}>
            {/* Imagem do Produto ou Complemento Selecionado */}
            {(() => {
              const displayImage = selectedComplementImage || selectedProduct.images?.[0];
              const isComplementImage = !!selectedComplementImage;
              
              if (displayImage) {
                return (
                  <div className="relative w-full h-[215px] sm:h-60 flex-shrink-0">
                    <img
                      src={displayImage}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover transition-colors duration-300"
                    />
                    {/* Indicador de quantidade de fotos */}
                    {!isComplementImage && selectedProduct.images && selectedProduct.images.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        <span>1/{selectedProduct.images.length}</span>
                      </div>
                    )}
                    <button 
                      onClick={() => { setSelectedProduct(null); setSelectedComplementImage(null); setIsEditingMode(false); setEditingCartItem(null); }}
                      className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-card rounded-full shadow-lg transition-colors z-10"
                    >
                      <X className="h-5 w-5 text-foreground" />
                    </button>
                  </div>
                );
              }
              
              // Placeholder quando não há imagem
              return (
                <div className="relative w-full h-[180px] sm:h-48 flex-shrink-0 bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center">
                  <UtensilsCrossed className="h-16 w-16 text-white/80" />
                  <button 
                    onClick={() => { setSelectedProduct(null); setSelectedComplementImage(null); setIsEditingMode(false); setEditingCartItem(null); }}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-card rounded-full shadow-lg transition-colors z-10"
                  >
                    <X className="h-5 w-5 text-foreground" />
                  </button>
                </div>
              );
            })()}

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3 sm:space-y-4">
              {/* Título e Preço */}
              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedProduct.name}</h3>
                {Number(selectedProduct.price) > 0 && (
                  <p className="text-lg font-semibold text-red-500 mt-1">
                    {formatCurrency(parseFloat(selectedProduct.price))}
                  </p>
                )}
              </div>

              {/* Descrição */}
              {selectedProduct.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedProduct.description}
                </p>
              )}

              {/* Grupos de Complementos */}
              {productComplements && productComplements.length > 0 && (
                <div className="space-y-4">
                  {productComplements.map((group) => {
                    const selectedInGroup = selectedComplements.get(group.id) || new Map<number, number>();
                    const isRadio = group.maxQuantity === 1;
                    
                    return (
                      <div key={group.id} className="border border-border rounded-xl overflow-hidden">
                        {/* Header do Grupo */}
                        <div className="bg-muted/50 px-4 py-3 border-b border-border" style={{paddingTop: '8px', height: '58px'}}>
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-foreground">{group.name}</h4>
                            {(group.isRequired || group.minQuantity >= 1) ? (
                              <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-lg font-medium">
                                Obrigatório
                              </span>
                            ) : (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg font-medium">
                                Opcional
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {group.minQuantity > 0 ? `Mín: ${group.minQuantity}` : ''}
                            {group.minQuantity > 0 && group.maxQuantity > 1 ? ' | ' : ''}
                            {group.maxQuantity > 1 ? `Máx: ${group.maxQuantity}` : ''}
                            {group.maxQuantity === 1 && group.minQuantity === 0 ? 'Escolha até 1' : ''}
                          </p>
                        </div>
                        
                        {/* Itens do Grupo */}
                        <div className="divide-y divide-gray-100">
                          {group.items.map((item) => {
                            const itemQuantity = selectedInGroup.get(item.id) || 0;
                            const isSelected = itemQuantity > 0;
                            const displayPrice = getComplementPriceDineIn(item);
                            
                            const handleIncrement = (e: React.MouseEvent) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedComplements((prev) => {
                                const newMap = new Map(prev);
                                const currentGroupMap = new Map(prev.get(group.id) || []);
                                const currentQty = currentGroupMap.get(item.id) || 0;
                                const totalInGroup = Array.from(currentGroupMap.values()).reduce((a, b) => a + b, 0);
                                if (group.maxQuantity === 0 || totalInGroup < group.maxQuantity) {
                                  currentGroupMap.set(item.id, currentQty + 1);
                                  newMap.set(group.id, currentGroupMap);
                                  if (item.imageUrl) setSelectedComplementImage(item.imageUrl);
                                }
                                return newMap;
                              });
                            };
                            
                            const handleDecrement = (e: React.MouseEvent) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedComplements((prev) => {
                                const newMap = new Map(prev);
                                const currentGroupMap = new Map(prev.get(group.id) || []);
                                const currentQty = currentGroupMap.get(item.id) || 0;
                                if (currentQty > 1) {
                                  currentGroupMap.set(item.id, currentQty - 1);
                                } else {
                                  currentGroupMap.delete(item.id);
                                  if (item.imageUrl && selectedComplementImage === item.imageUrl) {
                                    setSelectedComplementImage(null);
                                  }
                                }
                                newMap.set(group.id, currentGroupMap);
                                return newMap;
                              });
                            };
                            
                            const handleToggle = () => {
                              setSelectedComplements((prev) => {
                                const newMap = new Map(prev);
                                const currentGroupMap = new Map(prev.get(group.id) || []);
                                if (isRadio) {
                                  const newGroupMap = new Map<number, number>();
                                  newGroupMap.set(item.id, 1);
                                  newMap.set(group.id, newGroupMap);
                                  if (item.imageUrl) setSelectedComplementImage(item.imageUrl);
                                  else setSelectedComplementImage(null);
                                } else {
                                  if (isSelected) {
                                    currentGroupMap.delete(item.id);
                                    if (item.imageUrl && selectedComplementImage === item.imageUrl) setSelectedComplementImage(null);
                                  } else {
                                    const totalInGroup = Array.from(currentGroupMap.values()).reduce((a, b) => a + b, 0);
                                    if (group.maxQuantity === 0 || totalInGroup < group.maxQuantity) {
                                      currentGroupMap.set(item.id, 1);
                                      if (item.imageUrl) setSelectedComplementImage(item.imageUrl);
                                    }
                                  }
                                  newMap.set(group.id, currentGroupMap);
                                }
                                return newMap;
                              });
                            };
                            
                            return (
                              <div
                                key={item.id}
                                className={`flex items-center justify-between px-4 py-3 transition-colors ${
                                  isSelected ? 'bg-red-50' : 'hover:bg-muted/50'
                                }`}
                              >
                                <label className="flex items-center gap-3 cursor-pointer flex-1">
                                  <input
                                    type={isRadio ? 'radio' : 'checkbox'}
                                    name={`mobile-group-${group.id}`}
                                    checked={isSelected}
                                    onChange={handleToggle}
                                    className="w-4 h-4 text-red-500 border-border focus:ring-red-500"
                                  />
                                  <span className="text-sm text-foreground">{item.name}</span>
                                </label>
                                
                                <div className="flex items-center gap-3">
                                  {/* Controles de quantidade - aparecem quando selecionado */}
                                  {isSelected && !isRadio && (
                                    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-1">
                                      <button
                                        type="button"
                                        onClick={handleDecrement}
                                        className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded transition-colors"
                                      >
                                        <Minus className="w-4 h-4" />
                                      </button>
                                      <span className="w-6 text-center text-sm font-medium text-foreground">{itemQuantity}</span>
                                      <button
                                        type="button"
                                        onClick={handleIncrement}
                                        className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded transition-colors"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                  
                                  {/* Preço */}
                                  {(() => {
                                    if (displayPrice > 0) {
                                      const totalItemPrice = displayPrice * (itemQuantity || 1);
                                      return (
                                        <span className="text-sm text-muted-foreground min-w-[70px] text-right">
                                          {isSelected && itemQuantity > 1 
                                            ? `+ ${formatCurrency(totalItemPrice)}` 
                                            : `+ ${formatCurrency(displayPrice)}`
                                          }
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Campo de Observação */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Observações
                </label>
                <textarea
                  value={productObservation}
                  onChange={(e) => setProductObservation(e.target.value)}
                  placeholder="Ex: Sem cebola, bem passado..."
                  rows={2}
                  className="w-full px-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                />
              </div>
            </div>

            {/* Footer - Quantidade e Adicionar (mesmo estilo do menu público) */}
            <div className="border-t p-4 bg-card flex items-center gap-4">
              {/* Controle de Quantidade */}
              <div className="flex items-center gap-3 bg-muted rounded-full px-2 py-1">
                <button
                  onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                  className="w-8 h-8 rounded-full bg-card shadow-sm flex items-center justify-center hover:bg-muted/50 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-semibold">{productQuantity}</span>
                <button
                  onClick={() => setProductQuantity(productQuantity + 1)}
                  className="w-8 h-8 rounded-full bg-card shadow-sm flex items-center justify-center hover:bg-muted/50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Botão Adicionar */}
              {(() => {
                let complementsTotal = 0;
                if (productComplements) {
                  productComplements.forEach((group) => {
                    const selectedInGroup = selectedComplements.get(group.id);
                    if (selectedInGroup) {
                      group.items.forEach((item) => {
                        const qty = selectedInGroup.get(item.id);
                        if (qty && qty > 0) {
                          complementsTotal += getComplementPriceDineIn(item) * qty;
                        }
                      });
                    }
                  });
                }
                
                const unitPrice = Number(selectedProduct.price) + complementsTotal;
                const totalPrice = unitPrice * productQuantity;
                
                // Verificar se grupos obrigatórios estão preenchidos
                let requiredGroupsMet = true;
                if (productComplements) {
                  productComplements.forEach((group) => {
                    if (group.minQuantity > 0) {
                      const selectedInGroup = selectedComplements.get(group.id);
                      const selectedCount = selectedInGroup ? Array.from(selectedInGroup.values()).reduce((a, b) => a + b, 0) : 0;
                      if (selectedCount < group.minQuantity) {
                        requiredGroupsMet = false;
                      }
                    }
                  });
                }
                
                const canAdd = requiredGroupsMet;
                
                return (
                  <button
                    onClick={handleAddToCart}
                    disabled={!canAdd}
                    className={`flex-1 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                      canAdd 
                        ? 'bg-red-500 hover:bg-red-500 text-white' 
                        : 'bg-muted-foreground/30 text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    <Plus className="h-5 w-5" />
                    <span>{isEditingMode ? "Atualizar" : "Adicionar"}</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conferência ao Fechar Mesa */}
      {showCloseTableModal && (
        <div className="fixed inset-0 z-[90] flex items-end md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCloseTableModal(false)} />
          <div className="relative bg-card rounded-t-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="bg-gradient-to-r from-red-500 to-red-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg"><Eye className="h-5 w-5 text-white" /></div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Conferência do Pedido</h2>
                    <p className="text-sm text-white/80">Mesa {tableDisplayName}</p>
                  </div>
                </div>
                <button onClick={() => setShowCloseTableModal(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {tabItemsActive.map((item: any, index: number) => {
                const itemTotal = parseFloat(item.totalPrice) || 0;
                let complements: any[] = [];
                try { complements = typeof item.complements === 'string' ? JSON.parse(item.complements) : (item.complements || []); } catch {}
                return (
                  <div key={index} className="p-3 border border-border rounded-lg border-l-4 border-l-red-500">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-red-500">{item.quantity}x</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.productName}</p>
                        {complements.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {complements.map((comp: any, cIndex: number) => {
                              if (comp.items && Array.isArray(comp.items)) {
                                return comp.items.map((ci: any, ciIndex: number) => (
                                  <p key={`${cIndex}-${ciIndex}`} className="text-xs text-muted-foreground pl-2">+ {ci.quantity > 1 ? `${ci.quantity}x ` : ''}{ci.name}{ci.price > 0 && <span className="ml-1 text-muted-foreground">({formatCurrency(ci.price * (ci.quantity || 1))})</span>}</p>
                                ));
                              } else if (comp.name) {
                                return <p key={cIndex} className="text-xs text-muted-foreground pl-2">+ {comp.quantity > 1 ? `${comp.quantity}x ` : ''}{comp.name}{comp.price > 0 && <span className="ml-1 text-muted-foreground">({formatCurrency(comp.price * (comp.quantity || 1))})</span>}</p>;
                              }
                              return null;
                            })}
                          </div>
                        )}
                        {item.notes && <p className="text-xs text-muted-foreground mt-1 italic">Obs: {item.notes}</p>}
                      </div>
                      <p className="font-semibold text-sm">{formatCurrency(itemTotal)}</p>
                    </div>
                  </div>
                );
              })}
              {loosePaymentsTotal > 0 ? (
                <>
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(calculateTabTotal())}</span>
                  </div>
                  {tabData && parseFloat(tabData.serviceCharge || "0") > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Serviço ({parseFloat(establishment?.serviceChargePercent || '10').toFixed(0)}%):</span>
                      <span>{formatCurrency(parseFloat(tabData.serviceCharge))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Já pago (avulso)</span>
                    <span className="font-medium text-green-600">-{formatCurrency(loosePaymentsTotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                    <span>A PAGAR:</span>
                    <span className="text-red-500">{formatCurrency(Math.max(0, parseFloat(tabData?.total || "0") - loosePaymentsTotal))}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(calculateTabTotal())}</span>
                  </div>
                  {tabData && parseFloat(tabData.serviceCharge || "0") > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Serviço ({parseFloat(establishment?.serviceChargePercent || '10').toFixed(0)}%):</span>
                      <span>{formatCurrency(parseFloat(tabData.serviceCharge))}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-border">
                    <span>TOTAL:</span>
                    <span className="text-red-500">{formatCurrency(parseFloat(tabData?.total || "0"))}</span>
                  </div>
                </>
              )}
            </div>
            {/* Forma de Pagamento */}
            <div className="px-4 py-3 border-t border-border space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Forma de pagamento:</p>
              <div className="flex gap-2">
                {[
                  { value: 'cash', label: 'Dinheiro', icon: Banknote, color: 'green' },
                  { value: 'card', label: 'Cartão', icon: CreditCard, color: 'blue' },
                  { value: 'pix', label: 'Pix', icon: QrCode, color: 'purple' },
                ].map(method => (
                  <button
                    key={method.value}
                    onClick={() => setFullClosePaymentMethod(method.value)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-colors",
                      fullClosePaymentMethod === method.value
                        ? `border-${method.color}-500 bg-${method.color}-50 dark:bg-${method.color}-950/20`
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <method.icon className={cn(
                      "h-5 w-5",
                      fullClosePaymentMethod === method.value ? `text-${method.color}-600` : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-xs font-medium",
                      fullClosePaymentMethod === method.value ? `text-${method.color}-600` : "text-muted-foreground"
                    )}>{method.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border space-y-2">
              <Button onClick={handleConfirmCloseTable} disabled={closeTableMutation.isPending} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white">
                {closeTableMutation.isPending ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />Fechando...</>) : (<><Check className="h-5 w-5 mr-2" />Confirmar e Fechar Mesa</>)}
              </Button>
              <Button onClick={() => setShowCloseTableModal(false)} variant="outline" className="w-full py-3" disabled={closeTableMutation.isPending}>Voltar e Revisar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Escolha: Fechamento Completo ou Parcial */}
      {showCloseTypeModal && (
        <div className="fixed inset-0 z-[90] flex items-end md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCloseTypeModal(false)} />
          <div className="relative bg-card rounded-t-2xl shadow-2xl w-full overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="bg-gradient-to-r from-red-500 to-red-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg"><Receipt className="h-5 w-5 text-white" /></div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Fechar Mesa {tableDisplayName}</h2>
                    <p className="text-sm text-white/80">Como deseja fechar?</p>
                  </div>
                </div>
                <button onClick={() => setShowCloseTypeModal(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <button
                onClick={() => { setShowCloseTypeModal(false); setFullClosePaymentMethod('cash'); setShowCloseTableModal(true); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors group"
              >
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-950/50 text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors">
                  <Check className="h-6 w-6" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-foreground">Fechamento Completo</p>
                  <p className="text-sm text-muted-foreground">Fechar toda a conta e liberar a mesa</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <button
                onClick={() => { setShowCloseTypeModal(false); setSelectedPartialItems([]); setPartialPaymentMethod('cash'); setShowPartialCloseModal(true); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors group"
              >
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <Scissors className="h-6 w-6" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-foreground">Fechar Parcial</p>
                  <p className="text-sm text-muted-foreground">Selecionar itens para pagar separado</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <button
                onClick={() => { setShowCloseTypeModal(false); setLoosePaymentAmount(''); setLoosePaymentMethod('cash'); setShowLoosePaymentModal(true); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors group"
              >
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-foreground">Pagamento Avulso</p>
                  <p className="text-sm text-muted-foreground">Abater um valor da conta</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Fechamento Parcial - Seleção de Itens */}
      {showPartialCloseModal && (
        <div className="fixed inset-0 z-[90] flex items-end md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPartialCloseModal(false)} />
          <div className="relative bg-card rounded-t-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg"><Scissors className="h-5 w-5 text-white" /></div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Fechar Parcial</h2>
                    <p className="text-sm text-white/80">Mesa {tableDisplayName} • Selecione os itens</p>
                  </div>
                </div>
                <button onClick={() => setShowPartialCloseModal(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Selecionar Todos */}
            <div className="px-4 pt-3 pb-2 border-b border-border">
              <button
                onClick={toggleAllPartialItems}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className={cn(
                  "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                  tabData?.items && selectedPartialItems.length === tabData.items.filter((i: any) => i.status !== 'cancelled').length
                    ? "bg-orange-500 border-orange-500 text-white"
                    : "border-muted-foreground/30"
                )}>
                  {tabData?.items && selectedPartialItems.length === tabData.items.filter((i: any) => i.status !== 'cancelled').length && (
                    <Check className="h-3 w-3" />
                  )}
                </div>
                Selecionar todos
              </button>
            </div>

            {/* Lista de Itens com Checkboxes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {tabData?.items?.filter((item: any) => item.status !== 'cancelled').map((item: any) => {
                const isSelected = selectedPartialItems.includes(item.id);
                const itemTotal = parseFloat(item.totalPrice) || 0;
                let complements: any[] = [];
                try { complements = typeof item.complements === 'string' ? JSON.parse(item.complements) : (item.complements || []); } catch {}
                return (
                  <button
                    key={item.id}
                    onClick={() => togglePartialItem(item.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-colors text-left",
                      isSelected
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <div className={cn(
                      "h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                      isSelected
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.quantity}x {item.productName}</p>
                      {complements.length > 0 && (
                        <div className="mt-0.5 space-y-0.5">
                          {complements.map((comp: any, cIndex: number) => {
                            if (comp.items && Array.isArray(comp.items)) {
                              return comp.items.map((ci: any, ciIndex: number) => (
                                <p key={`${cIndex}-${ciIndex}`} className="text-xs text-muted-foreground">
                                  + {ci.quantity > 1 ? `${ci.quantity}x ` : ''}{ci.name}
                                </p>
                              ));
                            } else if (comp.name) {
                              return (
                                <p key={cIndex} className="text-xs text-muted-foreground">
                                  + {comp.quantity > 1 ? `${comp.quantity}x ` : ''}{comp.name}
                                </p>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                      {item.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">Obs: {item.notes}</p>}
                    </div>
                    <p className={cn("font-semibold text-sm flex-shrink-0", isSelected && "text-orange-600 dark:text-orange-400")}>
                      {formatCurrency(itemTotal)}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Forma de Pagamento */}
            {selectedPartialItems.length > 0 && (
              <div className="px-4 py-3 border-t border-border space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Forma de pagamento:</p>
                <div className="flex gap-2">
                  {[
                    { value: 'cash', label: 'Dinheiro', icon: Banknote },
                    { value: 'card', label: 'Cartão', icon: CreditCard },
                    { value: 'pix', label: 'Pix', icon: QrCode },
                  ].map(method => (
                    <button
                      key={method.value}
                      onClick={() => setPartialPaymentMethod(method.value)}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-colors",
                        partialPaymentMethod === method.value
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <method.icon className={cn(
                        "h-5 w-5",
                        partialPaymentMethod === method.value ? "text-orange-600" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-xs font-medium",
                        partialPaymentMethod === method.value ? "text-orange-600" : "text-muted-foreground"
                      )}>{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Total e Botões */}
            <div className="p-4 border-t border-border space-y-3">
              {selectedPartialItems.length > 0 && (
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm text-muted-foreground">{selectedPartialItems.length} item(ns) selecionado(s)</span>
                  <span className="text-lg font-bold text-orange-600">{formatCurrency(calculatePartialTotal())}</span>
                </div>
              )}
              <Button
                onClick={handleConfirmPartialClose}
                disabled={selectedPartialItems.length === 0 || partialCloseMutation.isPending}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
              >
                {partialCloseMutation.isPending ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />Processando...</>
                ) : (
                  <><Scissors className="h-5 w-5 mr-2" />Confirmar Fechamento Parcial</>
                )}
              </Button>
              <Button
                onClick={() => setShowPartialCloseModal(false)}
                variant="outline"
                className="w-full py-3"
                disabled={partialCloseMutation.isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={deleteConfirmItemId !== null} onOpenChange={(open) => { if (!open) { setDeleteConfirmItemId(null); setDeleteConfirmItemName(""); } }}>
        <AlertDialogContent
          className="z-[100] p-0 overflow-hidden border-t-4 border-t-red-500"
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">Excluir item da comanda</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar exclusão do item</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Excluir item da comanda</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Tem certeza que deseja excluir <strong>{deleteConfirmItemName}</strong> da comanda? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold" disabled={cancelTabItemMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="flex-1 rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white"
                disabled={cancelTabItemMutation.isPending}
                onClick={() => { if (deleteConfirmItemId) cancelTabItemMutation.mutate({ id: deleteConfirmItemId }); }}
              >
                {cancelTabItemMutation.isPending ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      {/* Modal de Pagamento Avulso */}
      {showLoosePaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLoosePaymentModal(false)} />
          <div className="relative bg-card rounded-t-2xl shadow-2xl w-full overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg"><DollarSign className="h-5 w-5 text-white" /></div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Pagamento Avulso</h2>
                    <p className="text-sm text-white/80">Mesa {tableDisplayName} {paymentsData && parseFloat(paymentsData.total) > 0 ? `\u2022 J\u00e1 pago: R$ ${paymentsData.total}` : ''}</p>
                  </div>
                </div>
                <button onClick={() => setShowLoosePaymentModal(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="p-5 space-y-5">
              {/* Saldo da mesa */}
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total da conta</span>
                  <span className="font-semibold">{formatCurrency(calculateTabTotal())}</span>
                </div>
                {paymentsData && parseFloat(paymentsData.total) > 0 && (
                  <>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-muted-foreground">J\u00e1 pago (avulso)</span>
                      <span className="font-semibold text-green-600">-{formatCurrency(parseFloat(paymentsData.total))}</span>
                    </div>
                    <div className="border-t border-border mt-2 pt-2 flex justify-between items-center">
                      <span className="text-sm font-medium">Saldo restante</span>
                      <span className="font-bold text-red-500">{formatCurrency(Math.max(0, calculateTabTotal() - parseFloat(paymentsData.total)))}</span>
                    </div>
                  </>
                )}
              </div>
              {/* Campo de valor */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Valor do pagamento</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={loosePaymentAmount}
                    onChange={(e) => setLoosePaymentAmount(e.target.value)}
                    className="pl-10 text-lg font-semibold h-12"
                    autoFocus
                  />
                </div>
              </div>
              {/* Forma de pagamento */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Forma de pagamento</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setLoosePaymentMethod('cash')}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors",
                      loosePaymentMethod === 'cash' ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-border hover:border-green-300"
                    )}
                  >
                    <Banknote className={cn("h-5 w-5", loosePaymentMethod === 'cash' ? "text-green-600" : "text-muted-foreground")} />
                    <span className={cn("text-xs font-medium", loosePaymentMethod === 'cash' ? "text-green-600" : "text-muted-foreground")}>Dinheiro</span>
                  </button>
                  <button
                    onClick={() => setLoosePaymentMethod('card')}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors",
                      loosePaymentMethod === 'card' ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-border hover:border-blue-300"
                    )}
                  >
                    <CreditCard className={cn("h-5 w-5", loosePaymentMethod === 'card' ? "text-blue-600" : "text-muted-foreground")} />
                    <span className={cn("text-xs font-medium", loosePaymentMethod === 'card' ? "text-blue-600" : "text-muted-foreground")}>Cart\u00e3o</span>
                  </button>
                  <button
                    onClick={() => setLoosePaymentMethod('pix')}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors",
                      loosePaymentMethod === 'pix' ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30" : "border-border hover:border-purple-300"
                    )}
                  >
                    <QrCode className={cn("h-5 w-5", loosePaymentMethod === 'pix' ? "text-purple-600" : "text-muted-foreground")} />
                    <span className={cn("text-xs font-medium", loosePaymentMethod === 'pix' ? "text-purple-600" : "text-muted-foreground")}>Pix</span>
                  </button>
                </div>
              </div>
              {/* Bot\u00f5es */}
              <div className="space-y-2">
                <Button
                  onClick={handleConfirmLoosePayment}
                  disabled={!loosePaymentAmount || parseFloat(loosePaymentAmount) <= 0 || loosePaymentMutation.isPending}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {loosePaymentMutation.isPending ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />Processando...</>
                  ) : (
                    <><DollarSign className="h-5 w-5 mr-2" />Confirmar R$ {loosePaymentAmount ? parseFloat(loosePaymentAmount).toFixed(2) : '0,00'}</>
                  )}
                </Button>
                <Button onClick={() => setShowLoosePaymentModal(false)} variant="outline" className="w-full py-3" disabled={loosePaymentMutation.isPending}>Cancelar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Histórico da Mesa */}
      <TableHistoryMobile
        open={showHistory}
        onClose={() => setShowHistory(false)}
        tableId={tableId || null}
        tableDisplayName={tableDisplayName}
      />
    </>
  );
}
