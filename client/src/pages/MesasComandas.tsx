import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import React from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useSearch } from "@/contexts/SearchContext";
import { PageHeader } from "@/components/shared";
import { PDVSlidebar } from "@/components/PDVSlidebar";
import { MobilePDVModal } from "@/components/MobilePDVModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Search,
  Clock,
  Users,

  Plus,
  Receipt,
  AlertCircle,
  Trash2,
  X,
  ChefHat,
  Utensils,
  Printer,
  Loader2,
  MapPin,
  Settings,
  Pencil,
  Filter,
  Unlink,
  Link2,
  MoreVertical,
  CalendarClock,
  Phone,
  UserRound,
  Ban,
  LayoutGrid,
  List,
  GripVertical,
  Move,
  ArrowUpDown,
  RotateCcw,
  EyeOff,
  ArrowRightLeft,
  Check,
  Scissors,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

// Tipos
type TableStatus = "free" | "occupied" | "reserved";

interface TableSpace {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

interface TabItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  complements?: Array<{ name: string; price: number; quantity: number }> | null;
  notes?: string | null;
  status: string;
  orderedAt: Date | string;
  deliveredAt?: Date | string | null;
}

interface Tab {
  id: number;
  tabNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  status: string;
  subtotal: string;
  discount: string;
  serviceCharge: string;
  total: string;
  openedAt: Date | string;
  closedAt?: Date | string | null;
}

interface Table {
  id: number;
  number: number;
  name?: string | null;
  capacity: number;
  status: TableStatus;
  currentGuests: number;
  occupiedAt?: Date | string | null;
  reservedFor?: Date | string | null;
  reservedName?: string | null;
  reservedPhone?: string | null;
  reservedGuests?: number | null;
  spaceId?: number | null;
  label?: string | null;
  sortOrder?: number;
  // Campos para mesas combinadas
  mergedIntoId?: number | null;
  mergedTableIds?: string | null;
  displayNumber?: string | null;
  isActive?: boolean;
  tab?: Tab;
  items?: TabItem[];
}

// Helpers
const getStatusConfig = (status: TableStatus) => {
  switch (status) {
    case "free":
      return {
        label: "Livre",
        color: "bg-emerald-500",
        borderColor: "border-l-emerald-500",
        textColor: "text-emerald-600",
        bgLight: "bg-emerald-50",
        hoverBg: "hover:bg-emerald-50",
      };
    case "occupied":
      return {
        label: "Ocupada",
        color: "bg-red-500",
        borderColor: "border-l-red-500",
        textColor: "text-red-500",
        bgLight: "bg-red-50",
        hoverBg: "hover:bg-red-50",
      };
    case "reserved":
      return {
        label: "Reservada",
        color: "bg-blue-500",
        borderColor: "border-l-blue-500",
        textColor: "text-blue-600",
        bgLight: "bg-blue-50",
        hoverBg: "hover:bg-blue-50",
      };
    default:
      return {
        label: "Livre",
        color: "bg-emerald-500",
        borderColor: "border-l-emerald-500",
        textColor: "text-emerald-600",
        bgLight: "bg-emerald-50",
        hoverBg: "hover:bg-emerald-50",
      };
  }
};

const formatDuration = (startTime: Date | string | null | undefined) => {
  if (!startTime) return "—";
  const start = typeof startTime === "string" ? new Date(startTime) : startTime;
  const diff = Date.now() - start.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  // Formato: 1Min, 1h, 2h40
  if (hours > 0) {
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h${minutes}`;
  }
  return `${minutes}Min`;
};

const formatTime = (date: Date | string | null | undefined) => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

// Constante para persistência da mesa selecionada
const SELECTED_TABLE_KEY = 'mesas-selected-table-id';
const CARTS_PER_TABLE_KEY = 'pdv-carts-per-table';

// Tipo para itens do carrinho
interface CartItem {
  productId: number;
  name: string;
  price: string;
  quantity: number;
  observation: string;
  image: string | null;
  complements: Array<{ id: number; name: string; price: string; quantity: number }>;
}

export default function MesasComandas() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPDVSlidebar, setShowPDVSlidebar] = useState(false);
  const [showMobilePDV, setShowMobilePDV] = useState(false);

  // Detectar mobile (< 768px)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Estado para carrinhos por mesa (sincronizado com PDVSlidebar)
  const [cartsPerTable, setCartsPerTable] = useState<Record<number, CartItem[]>>(() => {
    try {
      const saved = localStorage.getItem(CARTS_PER_TABLE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao carregar carrinhos:', e);
    }
    return {};
  });

  // Sincronizar carrinhos quando localStorage mudar (outras abas) ou evento customizado (mesma aba)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CARTS_PER_TABLE_KEY && e.newValue) {
        try {
          setCartsPerTable(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Erro ao parsear carrinhos:', err);
        }
      }
    };
    
    // Listener para evento customizado (atualizações na mesma aba)
    const handleCartsUpdate = (e: CustomEvent<Record<number, CartItem[]>>) => {
      setCartsPerTable(e.detail);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartsPerTableUpdated', handleCartsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartsPerTableUpdated', handleCartsUpdate as EventListener);
    };
  }, []);

  // Função para verificar se mesa tem itens (apenas itens enviados/comanda, não carrinho local)
  const tableHasItems = (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    const tabItems = table?.items?.length || 0;
    return tabItems > 0;
  };

  // Função para obter total de itens da mesa (apenas itens enviados/comanda)
  const getTableItemsCount = (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    const tabItems = table?.items?.length || 0;
    return tabItems;
  };

  // Função para calcular total da mesa (apenas itens enviados/comanda)
  const getTableTotal = (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    // Filtrar itens cancelados antes de somar
    const tabTotal = table?.items
      ?.filter((item: any) => item.status !== 'cancelled')
      .reduce((sum, item) => sum + parseFloat(item.totalPrice), 0) || 0;
    // Subtrair pagamentos avulsos já realizados
    const paidAmount = table?.tab?.paidAmount ? parseFloat(String(table.tab.paidAmount)) : 0;
    return Math.max(0, tabTotal - paidAmount);
  };

  // Função para obter status derivado da mesa
  const getDerivedStatus = (table: typeof tables[number]): TableStatus => {
    // Mesas desativadas são sempre "free" (cinza no visual)
    if (table.isActive === false) return "free";
    if (tableHasItems(table.id)) return "occupied";
    if (table.status === "reserved") return "reserved";
    return "free";
  };
  // Toggle Grid/Lista
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try {
      return (localStorage.getItem('mesas_viewMode') as 'grid' | 'list') || 'grid';
    } catch { return 'grid'; }
  });

  const [selectedSpaceId, setSelectedSpaceId] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TableStatus | null>(null);
  const { searchQuery, setSearchQuery } = useSearch();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showManageSpacesDialog, setShowManageSpacesDialog] = useState(false);
  const [bulkDeleteCount, setBulkDeleteCount] = useState(5);
  const [newTableCount, setNewTableCount] = useState(10);
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [persistedTableId, setPersistedTableId] = useState<number | null>(null);
  
  // Estados para reserva de mesa
  const [showReserveDialog, setShowReserveDialog] = useState(false);
  const [reserveTableId, setReserveTableId] = useState<number | null>(null);
  const [reserveTableNumber, setReserveTableNumber] = useState<string>("");
  const [reserveName, setReserveName] = useState("");
  const [reservePhone, setReservePhone] = useState("");
  const [reserveTime, setReserveTime] = useState("");
  const [reserveGuests, setReserveGuests] = useState("");
  
  // Estado para forçar re-render do timer de ocupação das mesas a cada minuto
  const [, setTimerTick] = useState(0);
  
  // Estados para transferência de itens entre mesas
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferSourceTable, setTransferSourceTable] = useState<typeof tables[number] | null>(null);
  const [transferSelectedItems, setTransferSelectedItems] = useState<number[]>([]);
  const [transferTargetTableId, setTransferTargetTableId] = useState<number | null>(null);
  const [transferLabel, setTransferLabel] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  
  // Estados para gerenciar espaços
  const [editingSpaceId, setEditingSpaceId] = useState<number | null>(null);
  const [editingSpaceName, setEditingSpaceName] = useState("");
  const [newSpaceNameInput, setNewSpaceNameInput] = useState("");

  // Carregar mesa selecionada do localStorage
  useEffect(() => {
    try {
      const savedId = localStorage.getItem(SELECTED_TABLE_KEY);
      if (savedId) {
        setPersistedTableId(parseInt(savedId, 10));
      }
    } catch (e) {
      console.error('Erro ao carregar mesa selecionada:', e);
    }
  }, []);

  // Persistir mesa selecionada no localStorage
  useEffect(() => {
    if (selectedTable) {
      try {
        localStorage.setItem(SELECTED_TABLE_KEY, selectedTable.id.toString());
      } catch (e) {
        console.error('Erro ao salvar mesa selecionada:', e);
      }
    }
  }, [selectedTable]);

  // Buscar mesas do banco
  const { data: tables = [], isLoading, refetch } = trpc.tables.list.useQuery();
  
  // Buscar espaços do banco
  const { data: spaces = [], refetch: refetchSpaces } = trpc.tableSpaces.list.useQuery();
  // Buscar percentual de taxa de serviço
  const { data: serviceChargeConfig } = trpc.tableSpaces.getServiceChargePercent.useQuery();
  const [serviceChargeInput, setServiceChargeInput] = useState("");
  const [serviceChargeLoaded, setServiceChargeLoaded] = useState(false);

  // Restaurar mesa selecionada quando as mesas carregarem
  useEffect(() => {
    if (persistedTableId && tables.length > 0 && !selectedTable) {
      const table = tables.find(t => t.id === persistedTableId);
      if (table) {
        setSelectedTable(table as Table);
      }
    }
  }, [persistedTableId, tables, selectedTable]);

  // Timer para atualizar o contador de tempo das mesas ocupadas a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick(tick => tick + 1);
    }, 60000); // Atualiza a cada 1 minuto
    return () => clearInterval(interval);
  }, []);

  // Atalhos de teclado F2 para abrir e ESC para fechar a slidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Não capturar se estiver em um input ou textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      // F2 para abrir a slidebar/modal (se houver mesa selecionada)
      if (e.key === 'F2' && selectedTable) {
        e.preventDefault();
        if (isMobile) {
          setShowMobilePDV(true);
        } else {
          setShowPDVSlidebar(true);
        }
      }
      
      // ESC para fechar a slidebar/modal
      if (e.key === 'Escape') {
        if (showPDVSlidebar) {
          e.preventDefault();
          setShowPDVSlidebar(false);
        } else if (showMobilePDV) {
          e.preventDefault();
          setShowMobilePDV(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTable, showPDVSlidebar, showMobilePDV, isMobile]);
  
  // Mutations para mesas
  const createBatchMutation = trpc.tables.createBatch.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} mesas criadas com sucesso!`);
      setShowCreateDialog(false);
      setNewSpaceName("");
      refetch();
      refetchSpaces();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar mesas");
    },
  });

  const openTableMutation = trpc.tables.open.useMutation({
    onSuccess: () => {
      toast.success("Mesa aberta com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao abrir mesa");
    },
  });

  const closeTableMutation = trpc.tables.close.useMutation({
    onSuccess: () => {
      toast.success("Mesa fechada com sucesso!");
      setShowSidebar(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fechar mesa");
    },
  });

  const updateStatusMutation = trpc.tables.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const requestBillMutation = trpc.tabs.requestBill.useMutation({
    onSuccess: () => {
      toast.success("Conta solicitada!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao solicitar conta");
    },
  });

  // Mutations para espaços
  const createSpaceMutation = trpc.tableSpaces.create.useMutation({
    onSuccess: () => {
      toast.success("Espaço criado com sucesso!");
      setNewSpaceNameInput("");
      refetchSpaces();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar espaço");
    },
  });

  const updateSpaceMutation = trpc.tableSpaces.update.useMutation({
    onSuccess: () => {
      toast.success("Espaço atualizado!");
      setEditingSpaceId(null);
      refetchSpaces();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar espaço");
    },
  });

  const deleteSpaceMutation = trpc.tableSpaces.delete.useMutation({
    onSuccess: () => {
      toast.success("Espaço e todas as mesas removidos!");
      refetchSpaces();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover espaço");
    },
  });
  const updateServiceChargeMutation = trpc.tableSpaces.updateServiceChargePercent.useMutation({
    onSuccess: () => {
      toast.success("Taxa de serviço atualizada!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar taxa de serviço");
    },
  });

  const deleteTableMutation = trpc.tables.delete.useMutation({
    onSuccess: () => {
      toast.success("Mesa excluída! Você pode restaurá-la em Gerenciar Espaços > Mesas Excluídas.");
      refetch();
      refetchDeleted();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir mesa");
    },
  });

  const deletePermanentlyMutation = trpc.tables.deletePermanently.useMutation({
    onSuccess: () => {
      toast.success("Mesa excluída permanentemente!");
      refetchDeleted();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir mesa permanentemente");
    },
  });

  const deactivateTableMutation = trpc.tables.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Mesa desativada!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desativar mesa");
    },
  });

  const restoreTableMutation = trpc.tables.restore.useMutation({
    onSuccess: () => {
      toast.success("Mesa restaurada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao restaurar mesa");
    },
  });

  // Query para mesas excluídas (soft deleted)
  const { data: deletedTables = [], refetch: refetchDeleted } = trpc.tables.listDeleted.useQuery();

  const restoreDeletedMutation = trpc.tables.restoreDeleted.useMutation({
    onSuccess: () => {
      toast.success("Mesa restaurada com sucesso!");
      refetch();
      refetchDeleted();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao restaurar mesa");
    },
  });
  const bulkDeleteMutation = trpc.tables.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} mesas excluídas com sucesso!`);
      refetch();
      refetchDeleted();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir mesas em lote");
    },
  });
  const deleteAllPermanentlyMutation = trpc.tables.deleteAllPermanently.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} mesas removidas permanentemente!`);
      refetchDeleted();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao limpar mesas excluídas");
    },
  });

  // Mutation para juntar mesas
  const mergeTablesMutation = trpc.tables.merge.useMutation({
    onSuccess: (data) => {
      toast.success(`Mesas juntadas: ${data.displayNumber}`);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao juntar mesas");
    },
  });

  // Mutation para separar mesas
  const splitTablesMutation = trpc.tables.split.useMutation({
    onSuccess: () => {
      toast.success("Mesas separadas com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao separar mesas");
    },
  });

  // Mutation para transferir itens entre mesas
  const transferItemsMutation = trpc.tables.transferItems.useMutation({
    onSuccess: (data) => {
      const sourceNum = transferSourceTable?.displayNumber || transferSourceTable?.number;
      const targetTable = tables.find(t => t.id === transferTargetTableId);
      const targetNum = targetTable?.displayNumber || targetTable?.number;
      toast.success(`${transferSelectedItems.length} ${transferSelectedItems.length === 1 ? 'item transferido' : 'itens transferidos'} da Mesa ${sourceNum} para a Mesa ${targetNum}`);
      setShowTransferDialog(false);
      setShowTransferConfirm(false);
      setTransferSourceTable(null);
      setTransferSelectedItems([]);
      setTransferTargetTableId(null);
      setTransferLabel(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao transferir itens");
    },
  });

  // Mutation para mover mesa para outro espaço
  const moveToSpaceMutation = trpc.tables.moveToSpace.useMutation({
    onSuccess: () => {
      toast.success('Mesa movida com sucesso!');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao mover mesa');
    },
  });

  // Utils do tRPC para optimistic updates
  const utils = trpc.useUtils();

  // Mutation para reordenar mesas (com optimistic update para animação suave)
  const reorderMutation = trpc.tables.reorder.useMutation({
    onMutate: async ({ orders }) => {
      // Cancelar queries pendentes para evitar sobrescrever o optimistic update
      await utils.tables.list.cancel();
      const previousTables = utils.tables.list.getData();
      
      // Aplicar a nova ordem otimisticamente
      utils.tables.list.setData(undefined, (old) => {
        if (!old) return old;
        const orderMap = new Map(orders.map(o => [o.id, o.sortOrder]));
        return old.map(t => {
          const newSort = orderMap.get(t.id);
          return newSort !== undefined ? { ...t, sortOrder: newSort } : t;
        }).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      });
      
      return { previousTables };
    },
    onError: (_err, _vars, context) => {
      // Rollback em caso de erro
      if (context?.previousTables) {
        utils.tables.list.setData(undefined, context.previousTables);
      }
      toast.error('Erro ao reordenar mesas');
    },
    onSettled: () => {
      utils.tables.list.invalidate();
    },
  });

  // Estados para drag and drop
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [dropTargetSpaceId, setDropTargetSpaceId] = useState<number | 'all' | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Índice onde inserir a mesa arrastada (gap visual entre cards)
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null);
  const [isDragOverCard, setIsDragOverCard] = useState<boolean>(false);
  const lastDropInsertRef = useRef<number | null>(null);
  const dropDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cálculos de resumo (usando status derivado baseado em itens do carrinho + comanda)
  const summary = useMemo(() => {
    // Contar mesas por status derivado
    let free = 0;
    let occupied = 0;
    let reserved = 0;
    let totalRevenue = 0;
    
    tables.forEach((t) => {
      // Ignorar mesas desativadas na contagem
      if (t.isActive === false) return;
      const tabItemsCount = t.items?.length || 0;
      const hasItems = tabItemsCount > 0;
      
      if (hasItems) {
        occupied++;
        // Calcular total da comanda (apenas itens enviados)
        const tabTotal = t.items?.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0) || 0;
        totalRevenue += tabTotal;
      } else if (t.status === "reserved") {
        reserved++;
      } else {
        free++;
      }
    });
    
    const avgTicket = occupied > 0 ? totalRevenue / occupied : 0;

    return {
      free,
      occupied,
      reserved,
      totalRevenue,
      avgTicket,
      avgTimeMinutes: 0,
    };
  }, [tables]);

  // Contagem de mesas por status (para a legenda) - usando status derivado
  const statusCounts = useMemo(() => {
    let free = 0;
    let occupied = 0;
    let reserved = 0;
    
    tables.forEach((t) => {
      // Ignorar mesas desativadas na contagem
      if (t.isActive === false) return;
      // Verificar apenas itens enviados (comanda), não carrinho local
      const tabItems = t.items?.length || 0;
      const hasItems = tabItems > 0;
      
      if (hasItems) {
        occupied++;
      } else if (t.status === "reserved") {
        reserved++;
      } else {
        free++;
      }
    });
    
    return { free, occupied, reserved };
  }, [tables]);

  // Filtrar mesas por espaço e status (usando status derivado)
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      // Ocultar mesas que foram juntadas a outra (mergedIntoId != null)
      if (table.mergedIntoId) return false;
      // Filtro por espaço
      const matchesSpace = selectedSpaceId === "all" || table.spaceId === selectedSpaceId;
      // Filtro por status derivado (da legenda)
      const derivedStatus = getDerivedStatus(table);
      const matchesStatus = statusFilter === null || derivedStatus === statusFilter;
      // Filtro por busca (incluindo displayNumber para mesas combinadas)
      const displayNum = table.displayNumber || table.number.toString();
      const matchesSearch = searchQuery === "" || displayNum.includes(searchQuery) || table.number.toString().includes(searchQuery);
      return matchesSpace && matchesStatus && matchesSearch;
    }).sort((a, b) => {
      // Ordenar por sortOrder primeiro, depois por número da mesa
      const sortDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (sortDiff !== 0) return sortDiff;
      return a.number - b.number;
    });
  }, [tables, selectedSpaceId, statusFilter, searchQuery]);

  // Contagem de mesas por espaço
  const spaceTablesCount = useMemo(() => {
    const activeTables = tables.filter(t => t.isActive !== false);
    const counts: Record<string | number, number> = { all: activeTables.length };
    spaces.forEach(space => {
      counts[space.id] = activeTables.filter(t => t.spaceId === space.id).length;
    });
    // Mesas sem espaço definido
    const noSpaceCount = activeTables.filter(t => !t.spaceId).length;
    counts.noSpace = noSpaceCount;
    return counts;
  }, [tables, spaces]);

  const handleTableClick = (table: typeof tables[number]) => {
    // Cast para Table, tratando requesting_bill como occupied
    const normalizedTable: Table = {
      ...table,
      status: table.status === "requesting_bill" ? "occupied" : table.status as TableStatus
    };
    setSelectedTable(normalizedTable);
    if (isMobile) {
      setShowMobilePDV(true);
    } else {
      setShowPDVSlidebar(true);
    }
  };

  const handlePDVSlidebarClose = () => {
    setShowPDVSlidebar(false);
  };

  const handleOrderCreated = async () => {
    // Atualizar os dados das mesas
    const result = await refetch();
    // Atualizar selectedTable com os dados atualizados (incluindo tabId)
    if (result.data && selectedTable) {
      const updatedTable = result.data.find(t => t.id === selectedTable.id);
      if (updatedTable) {
        setSelectedTable({
          ...updatedTable,
          status: updatedTable.status === "requesting_bill" ? "occupied" : updatedTable.status as TableStatus
        } as Table);
      }
    }
    // Não fechar a sidebar após enviar pedido para permitir adicionar mais itens
  };

  const handleOpenTable = (table: Table) => {
    openTableMutation.mutate({ tableId: table.id, guests: 1 });
  };

  const handleCloseTable = (table: Table) => {
    if (!table.tab) return;
    closeTableMutation.mutate({
      tableId: table.id,
      paymentMethod: "dinheiro",
      paidAmount: parseFloat(table.tab.total),
    });
  };

  const handleRequestBill = (table: Table) => {
    if (!table.tab) return;
    requestBillMutation.mutate({ tableId: table.id });
  };

  const handleClearTable = (table: Table) => {
    updateStatusMutation.mutate({ id: table.id, status: "free" });
  };

  // Abrir modal de reserva
  const handleOpenReserveDialog = (tableId: number, displayNum: string) => {
    setReserveTableId(tableId);
    setReserveTableNumber(displayNum);
    setReserveName("");
    setReservePhone("");
    setReserveTime("");
    setReserveGuests("");
    setShowReserveDialog(true);
  };

  // Confirmar reserva
  const handleConfirmReservation = () => {
    if (!reserveTableId) return;
    
    const reservedFor = reserveTime ? new Date(`${new Date().toISOString().split('T')[0]}T${reserveTime}:00`).toISOString() : undefined;
    
    updateStatusMutation.mutate({
      id: reserveTableId,
      status: "reserved",
      reservedName: reserveName || undefined,
      reservedPhone: reservePhone || undefined,
      reservedFor: reservedFor,
      reservedGuests: reserveGuests ? parseInt(reserveGuests) : undefined,
    }, {
      onSuccess: () => {
        toast.success(`Mesa ${reserveTableNumber} reservada!`);
        setShowReserveDialog(false);
        refetch();
      },
    });
  };

  // Cancelar reserva
  const handleCancelReservation = (tableId: number, displayNum: string) => {
    updateStatusMutation.mutate({ id: tableId, status: "free" }, {
      onSuccess: () => {
        toast.success(`Reserva da Mesa ${displayNum} cancelada!`);
        refetch();
      },
    });
  };

  const handleCreateTables = () => {
    // Encontrar o maior número de mesa existente
    const maxNumber = tables.length > 0 
      ? Math.max(...tables.map(t => t.number)) 
      : 0;
    
    createBatchMutation.mutate({
      startNumber: maxNumber + 1,
      count: newTableCount,
      capacity: newTableCapacity,
      spaceName: newSpaceName || undefined,
    });
  };

  const handleStatusFilterClick = (status: TableStatus) => {
    // Toggle: se já está selecionado, desseleciona
    if (statusFilter === status) {
      setStatusFilter(null);
    } else {
      setStatusFilter(status);
    }
  };

  const handleCreateSpace = () => {
    if (!newSpaceNameInput.trim()) {
      toast.error("Digite um nome para o espaço");
      return;
    }
    createSpaceMutation.mutate({ name: newSpaceNameInput.trim() });
  };

  const handleUpdateSpace = (id: number) => {
    if (!editingSpaceName.trim()) {
      toast.error("Digite um nome para o espaço");
      return;
    }
    updateSpaceMutation.mutate({ id, name: editingSpaceName.trim() });
  };

  const handleDeleteSpace = (id: number) => {
    const spaceToDelete = spaces.find(s => s.id === id);
    const mesasCount = tables.filter(t => t.spaceId === id).length;
    if (confirm(`Tem certeza que deseja remover o espaço "${spaceToDelete?.name || ''}"? Todas as ${mesasCount} mesa(s) deste espaço também serão excluídas.`)) {
      deleteSpaceMutation.mutate({ id });
    }
  };

  const handleDeactivateTable = (tableId: number, tableNumber: number) => {
    deactivateTableMutation.mutate({ id: tableId });
  };

  // Abrir modal de transferência de itens
  const handleOpenTransferDialog = (table: typeof tables[number]) => {
    setTransferSourceTable(table);
    setTransferSelectedItems([]);
    setTransferTargetTableId(null);
    setTransferLabel(!!table.label);
    setShowTransferConfirm(false);
    setShowTransferDialog(true);
  };

  // Confirmar transferência de itens
  const handleConfirmTransfer = () => {
    if (!transferSourceTable || !transferTargetTableId || transferSelectedItems.length === 0) return;
    transferItemsMutation.mutate({
      sourceTableId: transferSourceTable.id,
      targetTableId: transferTargetTableId,
      itemIds: transferSelectedItems,
      transferLabel: transferLabel,
    });
  };

  // Toggle seleção de item para transferência
  const handleToggleTransferItem = (itemId: number) => {
    setTransferSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // Selecionar/desselecionar todos os itens
  const handleToggleAllTransferItems = (items: TabItem[]) => {
    const activeItems = items.filter(i => i.status !== 'cancelled');
    if (transferSelectedItems.length === activeItems.length) {
      setTransferSelectedItems([]);
    } else {
      setTransferSelectedItems(activeItems.map(i => i.id));
    }
  };

  const handleDeleteTablePermanently = (tableId: number, tableNumber: number) => {
    if (confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE a Mesa ${tableNumber}? Esta ação não pode ser desfeita e todos os dados da comanda serão perdidos.`)) {
      deletePermanentlyMutation.mutate({ id: tableId });
    }
  };

  // Lista de status para a legenda clicável
  const statusLegend: { status: TableStatus; label: string; color: string }[] = [
    { status: "free", label: "Livre", color: "bg-emerald-500" },
    { status: "occupied", label: "Ocupada", color: "bg-red-500" },
    { status: "reserved", label: "Reservada", color: "bg-blue-500" },
  ];

  // Se não há mesas, mostrar tela de criação
  if (!isLoading && tables.length === 0) {
    return (
      <AdminLayout>
        <div className="p-4 sm:p-6">
        <div className="hidden md:block mb-6">
          <PageHeader 
            title="Mapa de mesas" 
            description="Visualização e controle das mesas do salão"
            icon={<Utensils className="h-6 w-6 text-blue-600" />}
          />
        </div>

        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <Utensils className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma mesa cadastrada</h3>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            Crie suas mesas para começar a gerenciar o salão do seu estabelecimento.
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Criar Mesas
          </Button>
        </div>

        {/* Dialog para criar mesas */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent
            className="sm:max-w-md p-0 overflow-hidden border-t-4 border-t-primary"
            style={{ borderRadius: '16px' }}
          >
            <DialogTitle className="sr-only">Criar Mesas</DialogTitle>
            <div className="px-6 pt-5 pb-6">
              {/* Header com ícone */}
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2.5 rounded-xl flex-shrink-0 bg-primary/10">
                  <LayoutGrid className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Criar Mesas</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Configure o espaço e a quantidade de mesas para o seu restaurante.
                  </p>
                </div>
              </div>

              {/* Campos */}
              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Nome do espaço</label>
                  <Input
                    type="text"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    placeholder="Ex: Salão, Varanda, Área Externa..."
                    className="rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Opcional. Agrupa as mesas por local físico do restaurante.
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Quantidade de mesas</label>
                  <Input
                    type="number"
                    value={newTableCount}
                    onChange={(e) => setNewTableCount(parseInt(e.target.value) || 1)}
                    min={1}
                    max={100}
                    className="rounded-lg"
                  />
                </div>

              </div>

              {/* Botão Criar */}
              <Button
                className="w-full rounded-xl h-10 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleCreateTables}
                disabled={createBatchMutation.isPending}
              >
                {createBatchMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</>
                ) : (
                  <><Plus className="h-4 w-4 mr-2" /> Criar {newTableCount} Mesas</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
      <div className="hidden md:block mb-6">
        <PageHeader 
          title="Mapa de mesas" 
          description="Visualização e controle das mesas do salão"
          icon={<Utensils className="h-6 w-6 text-blue-600" />}
        />
      </div>

      <div className="space-y-5">


        {/* Filtros de Espaços e Controles */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Filtros de Espaços - scroll horizontal no mobile (só mostra se 2+ espaços) */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1 max-w-full" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {spaces.length === 1 && (
              <span className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                {spaces[0].name}
                <span className="px-1.5 py-0.5 rounded-lg text-xs font-semibold min-w-[20px] text-center bg-white/20 text-white">
                  {tables.length}
                </span>
              </span>
            )}
            {spaces.length > 1 && (<>
            {/* Botão "Todas" */}
            <button
              onClick={() => setSelectedSpaceId("all")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap",
                selectedSpaceId === "all"
                  ? "bg-red-500 text-white"
                  : "bg-card border border-border text-muted-foreground hover:border-border/80"
              )}
            >
              <MapPin className="h-4 w-4" />
              Todas
              <span className={cn(
                "px-1.5 py-0.5 rounded-lg text-xs font-semibold min-w-[20px] text-center",
                selectedSpaceId === "all"
                  ? "bg-white/20 text-white"
                  : "bg-red-500 text-white"
              )}>
                {tables.length}
              </span>
            </button>

            {/* Botões de Espaços */}
            {spaces.map((space) => (
              <button
                key={space.id}
                onClick={() => setSelectedSpaceId(space.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  // Mover mesa entre espaços: apenas no modo normal (não no modo reordenar)
                  if (draggedTableId && !isReorderMode) {
                    const draggedTable = tables.find(t => t.id === draggedTableId);
                    if (draggedTable && draggedTable.spaceId !== space.id) {
                      setDropTargetSpaceId(space.id);
                    }
                  }
                }}
                onDragLeave={() => setDropTargetSpaceId(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedTableId && !isReorderMode) {
                    const draggedTable = tables.find(t => t.id === draggedTableId);
                    if (draggedTable && draggedTable.spaceId !== space.id) {
                      moveToSpaceMutation.mutate({ tableId: draggedTableId, spaceId: space.id });
                      toast.success(`Mesa ${draggedTable.displayNumber || draggedTable.number} movida para ${space.name}`);
                    }
                  }
                  setDraggedTableId(null);
                  setDropTargetId(null);
                  setDropTargetSpaceId(null);
                  setDragOverIndex(null);
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap",
                  selectedSpaceId === space.id
                    ? "bg-red-500 text-white"
                    : "bg-card border border-border text-muted-foreground hover:border-border/80",
                  dropTargetSpaceId === space.id && "ring-2 ring-blue-400 ring-offset-2 bg-blue-50 !text-blue-700 !border-blue-400 scale-105"
                )}
              >
                {dropTargetSpaceId === space.id ? (
                  <Move className="h-4 w-4" />
                ) : null}
                {space.name}
                <span className={cn(
                  "px-1.5 py-0.5 rounded-lg text-xs font-semibold min-w-[20px] text-center",
                  selectedSpaceId === space.id && dropTargetSpaceId !== space.id
                    ? "bg-white/20 text-white"
                    : dropTargetSpaceId === space.id
                    ? "bg-blue-200 text-blue-800"
                    : "bg-red-500 text-white"
                )}>
                  {spaceTablesCount[space.id] || 0}
                </span>
              </button>
            ))}
            </>)}

            {/* Botão para adicionar mesa/espaço - oculto no mobile, visível no desktop */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="hidden md:flex px-3 py-2 rounded-lg text-sm font-medium transition-colors items-center gap-1.5 bg-red-500 text-white hover:bg-red-500 w-[42px]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Adicionar mesas</p>
              </TooltipContent>
            </Tooltip>

            {/* Botão para gerenciar espaços - oculto no mobile, visível no desktop */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowManageSpacesDialog(true)}
                  className="hidden md:flex px-3 py-2 rounded-lg text-sm font-medium transition-colors items-center gap-1.5 bg-card border border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Configurações e gerenciamento</p>
              </TooltipContent>
            </Tooltip>

            {/* Botão Reordenar - desktop */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsReorderMode(!isReorderMode)}
                  className={cn(
                    "hidden md:flex px-3 py-2 rounded-lg text-sm font-medium transition-colors items-center gap-1.5",
                    isReorderMode
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-card border border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                  )}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{isReorderMode ? 'Sair do modo reordenar' : 'Reordenar mesas'}</p>
              </TooltipContent>
            </Tooltip>
            {/* Botões mobile - inline com as tabs de espaço */}
            <button
              onClick={() => setShowCreateDialog(true)}
              className="md:hidden px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 bg-red-500 text-white hover:bg-red-500 flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowManageSpacesDialog(true)}
              className="md:hidden px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 bg-card border border-border text-muted-foreground hover:border-border/80 hover:text-foreground flex-shrink-0"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsReorderMode(!isReorderMode)}
              className={cn(
                "md:hidden px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 flex-shrink-0",
                isReorderMode
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-card border border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
              )}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>


        </div>

        {/* Legenda de Status + Toggle Grid/Lista */}
        <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
          <Filter className="h-5 w-5 text-muted-foreground/70" />
          {statusLegend.filter((item) => item.status !== 'reserved' || statusCounts.reserved > 0).map((item, index) => (
            <button
              key={item.status}
              onClick={() => handleStatusFilterClick(item.status)}
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded-md transition-colors",
                statusFilter === item.status
                  ? "bg-muted ring-2 ring-border"
                  : "hover:bg-muted/50",
                index === 0 && "-ml-2.5"
              )}
            >
              <div className={cn("w-3 h-3 rounded-full", item.color)} />
              <span>{item.label}</span>
              <span className="text-xs text-muted-foreground/70">({statusCounts[item.status]})</span>
            </button>
          ))}
          {statusFilter && (
            <button
              onClick={() => setStatusFilter(null)}
              className="text-xs text-red-500 hover:text-red-500 flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Limpar filtro
            </button>
          )}
        </div>

          {/* Toggle Grid/Lista */}
          <div className="hidden sm:flex items-center bg-muted rounded-lg p-0.5">
            <button
              onClick={() => { setViewMode('grid'); localStorage.setItem('mesas_viewMode', 'grid'); }}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                viewMode === 'grid'
                  ? "bg-white dark:bg-white text-black shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-[15px] w-[15px]" />
              Grid
            </button>
            <button
              onClick={() => { setViewMode('list'); localStorage.setItem('mesas_viewMode', 'list'); }}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                viewMode === 'list'
                  ? "bg-white dark:bg-white text-black shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-[15px] w-[15px]" />
              Lista
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Banner de modo reordenar */}
        {isReorderMode && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800">
            <ArrowUpDown className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">Modo reordenar ativo</span>
            <span className="text-xs text-blue-600">Arraste as mesas para reorganizar a ordem</span>
          </div>
        )}

        {/* Grid de Mesas */}
        {!isLoading && viewMode === 'grid' && (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3"
            onDragOver={(e) => {
              e.preventDefault();
              if (!isReorderMode || !draggedTableId) return;
              // No modo reordenar, ao arrastar sobre o grid (fora dos cards), manter o último insert index
            }}
            onDrop={(e) => {
              e.preventDefault();
              // Executar reorder se estiver no modo reordenar e tiver um insert index
              if (isReorderMode && draggedTableId && dropInsertIndex !== null) {
                const dragIdx = filteredTables.findIndex(t => t.id === draggedTableId);
                if (dragIdx !== -1 && dropInsertIndex !== dragIdx) {
                  const newOrder = [...filteredTables];
                  const [moved] = newOrder.splice(dragIdx, 1);
                  const insertAt = dropInsertIndex > dragIdx ? dropInsertIndex - 1 : dropInsertIndex;
                  newOrder.splice(insertAt, 0, moved);
                  const orders = newOrder.map((t, i) => ({ id: t.id, sortOrder: i }));
                  reorderMutation.mutate({ orders });
                  const draggedTable = tables.find(t => t.id === draggedTableId);
                  toast.success(`Mesa ${draggedTable?.displayNumber || draggedTable?.number} reposicionada`);
                }
              }
              // Reset all drag states
              setDraggedTableId(null);
              setDropTargetId(null);
              setDropTargetSpaceId(null);
              setDragOverIndex(null);
              setDropInsertIndex(null);
              setIsDragOverCard(false);
              lastDropInsertRef.current = null;
              if (dropDebounceRef.current) clearTimeout(dropDebounceRef.current);
            }}
          >
            {/* Construir lista: no modo reordenar, inserir card fantasma na posição */}
            {(() => {
              const items: Array<{ type: 'table'; table: typeof filteredTables[0]; originalIndex: number } | { type: 'ghost' }> = [];
              const showGhost = isReorderMode && dropInsertIndex !== null && draggedTableId !== null;
              
              filteredTables.forEach((table, idx) => {
                if (showGhost && idx === dropInsertIndex) {
                  items.push({ type: 'ghost' });
                }
                items.push({ type: 'table', table, originalIndex: idx });
              });
              if (showGhost && dropInsertIndex === filteredTables.length) {
                items.push({ type: 'ghost' });
              }
              
              return items.map((item, renderIdx) => {
                if (item.type === 'ghost') {
                  return (
                    <div
                      key="ghost-placeholder"
                      className="border-2 border-dashed border-blue-400/60 rounded-xl min-h-[90px] sm:min-h-[96px] flex items-center justify-center bg-blue-50/40 pointer-events-none transition-colors duration-200 animate-in fade-in"
                    >
                      <div className="flex flex-col items-center gap-1 text-blue-400">
                        <ArrowUpDown className="h-5 w-5" />
                      </div>
                    </div>
                  );
                }
                
                const table = item.table;
                const tableIndex = item.originalIndex;
                const isDeactivated = table.isActive === false;
                const derivedStatus = getDerivedStatus(table);
                const statusConfig = getStatusConfig(derivedStatus);
                const hasItems = tableHasItems(table.id);
                const itemsCount = getTableItemsCount(table.id);
                const tableTotal = getTableTotal(table.id);
                const isMergedTable = !!table.mergedTableIds;
                const displayNumber = table.displayNumber || table.number.toString();
                const isDragging = draggedTableId === table.id;
                const isDropTarget = dropTargetId === table.id && draggedTableId !== table.id;
              
              return (
                <div
                  key={table.id}
                  style={{ viewTransitionName: `table-${table.id}` }}
                  className={cn(
                    "relative transition-colors duration-300 ease-in-out",
                    isDragging && "opacity-40 scale-90"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!draggedTableId || draggedTableId === table.id) return;
                    
                    if (isReorderMode) {
                      // === MODO REORDENAR: calcular posição de inserção ===
                      const dragIdx = filteredTables.findIndex(t => t.id === draggedTableId);
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const half = rect.width / 2;
                      let newIdx = x < half ? tableIndex : tableIndex + 1;
                      
                      // Ignorar posições que resultariam em nenhuma mudança
                      // (inserir imediatamente antes ou depois da posição original)
                      if (newIdx === dragIdx || newIdx === dragIdx + 1) {
                        newIdx = -1; // Sinalizar que não há mudança
                      }
                      
                      if (lastDropInsertRef.current !== newIdx) {
                        lastDropInsertRef.current = newIdx;
                        if (dropDebounceRef.current) clearTimeout(dropDebounceRef.current);
                        dropDebounceRef.current = setTimeout(() => {
                          setDropInsertIndex(newIdx === -1 ? null : newIdx);
                          setDropTargetId(null);
                          setIsDragOverCard(false);
                        }, 60);
                      }
                    } else {
                      // === MODO NORMAL: juntar mesas (merge) ===
                      setDropTargetId(table.id);
                      setIsDragOverCard(true);
                      setDropInsertIndex(null);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      if (!isReorderMode) {
                        setDropTargetId(null);
                        setIsDragOverCard(false);
                      }
                      // No modo reordenar, não limpar dropInsertIndex no dragLeave
                      // para evitar flickering quando move entre cards
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!draggedTableId || draggedTableId === table.id) return;
                    
                    if (isReorderMode) {
                      // === MODO REORDENAR: reposicionar mesa ===
                      if (dropInsertIndex !== null) {
                        const dIdx = filteredTables.findIndex(t => t.id === draggedTableId);
                        if (dIdx !== -1 && dropInsertIndex !== dIdx) {
                          const newOrder = [...filteredTables];
                          const [moved] = newOrder.splice(dIdx, 1);
                          const insertAt = dropInsertIndex > dIdx ? dropInsertIndex - 1 : dropInsertIndex;
                          newOrder.splice(insertAt, 0, moved);
                          const orders = newOrder.map((t, i) => ({ id: t.id, sortOrder: i }));
                          reorderMutation.mutate({ orders });
                          const draggedTable = tables.find(t => t.id === draggedTableId);
                          toast.success(`Mesa ${draggedTable?.displayNumber || draggedTable?.number} reposicionada`);
                        }
                      }
                    } else {
                      // === MODO NORMAL: juntar mesas ===
                      if (dropTargetId === table.id) {
                        mergeTablesMutation.mutate({
                          sourceTableId: draggedTableId,
                          targetTableId: table.id,
                        });
                      }
                    }
                    // Reset all drag states
                    setDraggedTableId(null);
                    setDropTargetId(null);
                    setDropTargetSpaceId(null);
                    setDragOverIndex(null);
                    setDropInsertIndex(null);
                    setIsDragOverCard(false);
                    lastDropInsertRef.current = null;
                    if (dropDebounceRef.current) clearTimeout(dropDebounceRef.current);
                  }}
                >

                  {/* Botão ⋮ no canto superior direito - oculto no modo reordenar e para mesas desativadas */}
                  {!isReorderMode && !isDeactivated && (
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {derivedStatus === "occupied" && hasItems && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // Abrir a sidebar na aba comanda e acionar fechamento parcial
                              setSelectedTable(table as any);
                              setShowPDVSlidebar(true);
                              // Pequeno delay para a sidebar abrir antes de acionar o modal
                              setTimeout(() => {
                                const event = new CustomEvent('open-partial-close', { detail: { tableId: table.id } });
                                window.dispatchEvent(event);
                              }, 500);
                            }}
                            className="cursor-pointer"
                          >
                            <Scissors className="h-4 w-4 mr-2 text-orange-500" />
                            Fechar parcial
                          </DropdownMenuItem>
                        )}
                        {derivedStatus === "occupied" && hasItems && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTransferDialog(table);
                            }}
                            className="cursor-pointer"
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-2 text-orange-500" />
                            Transferir itens
                          </DropdownMenuItem>
                        )}
                        {derivedStatus === "free" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReserveDialog(table.id, displayNumber);
                            }}
                            className="cursor-pointer"
                          >
                            <CalendarClock className="h-4 w-4 mr-2 text-blue-500" />
                            Reservar mesa
                          </DropdownMenuItem>
                        )}
                        {derivedStatus === "reserved" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelReservation(table.id, displayNumber);
                            }}
                            className="cursor-pointer text-red-500 focus:text-red-500"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Cancelar reserva
                          </DropdownMenuItem>
                        )}
                        {derivedStatus === "occupied" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearTable(table as Table);
                            }}
                            className="cursor-pointer text-red-500 focus:text-red-500"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Limpar mesa
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeactivateTable(table.id, table.number);
                          }}
                          className="cursor-pointer text-red-500 focus:text-red-500"
                        >
                          <EyeOff className="h-4 w-4 mr-2" />
                          Desativar mesa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  )}

                  {/* Badge desativada com botão reativar */}
                  {!isReorderMode && isDeactivated && (
                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          restoreTableMutation.mutate({ id: table.id });
                        }}
                        disabled={restoreTableMutation.isPending}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Ativar
                      </Button>
                    </div>
                  )}

                  {/* Ícone de grip no modo reordenar */}
                  {isReorderMode && (
                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10">
                      <div className="h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center text-blue-500">
                        <GripVertical className="h-4 w-4" />
                      </div>
                    </div>
                  )}

                  <button
                    draggable={!isDeactivated}
                    onDragStart={(e) => {
                      if (isDeactivated) { e.preventDefault(); return; }
                      setDraggedTableId(table.id);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', table.id.toString());
                    }}
                    onDragEnd={() => {
                      setDraggedTableId(null);
                      setDropTargetId(null);
                      setDropTargetSpaceId(null);
                      setDragOverIndex(null);
                      setDropInsertIndex(null);
                      setIsDragOverCard(false);
                      lastDropInsertRef.current = null;
                      if (dropDebounceRef.current) clearTimeout(dropDebounceRef.current);
                    }}
                    onClick={() => {
                      if (isDeactivated) return;
                      if (!isReorderMode) {
                        handleTableClick(table);
                      }
                    }}
                    className={cn(
                      "w-full bg-card border border-border/50 p-2.5 sm:p-3 text-left transition-colors",
                      "border-l-4 min-h-[90px] sm:min-h-[96px]",
                      "rounded-xl",
                      isDeactivated ? "border-l-gray-300 opacity-50 grayscale" : statusConfig.borderColor,
                      !isReorderMode && !isDeactivated && "hover:shadow-md hover:-translate-y-0.5",
                      isDeactivated && "cursor-default",
                      isDragging && "opacity-50 scale-95 ring-2 ring-blue-400",
                      // Modo normal: highlight azul ao arrastar sobre (merge)
                      !isReorderMode && isDropTarget && isDragOverCard && "ring-2 ring-blue-500 ring-offset-2 bg-blue-50 scale-105",
                      // Modo reordenar: cursor grab
                      isReorderMode && !isDragging && "cursor-grab",
                      isReorderMode && isDragging && "cursor-grabbing",
                      // Borda azul sutil no modo reordenar
                      isReorderMode && !isDragging && "ring-1 ring-blue-200/50"
                    )}
                  >
                    <div className="flex items-start justify-between" style={{ marginTop: "-3px" }}>
                      <div>
                        <span className="text-xl sm:text-2xl font-bold text-foreground">{displayNumber}</span>
                        {/* Indicador de mesa combinada */}
                        <div className="min-h-[16px] sm:min-h-[20px]">
                          {isMergedTable ? (
                            <div className="group/merged relative w-fit">
                              <span className="text-xs text-blue-600 font-medium flex items-center gap-1 md:group-hover/merged:opacity-0 transition-opacity">
                                <Link2 className="h-3 w-3" />
                                Mesas unidas
                              </span>
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isReorderMode && !splitTablesMutation.isPending) {
                                    splitTablesMutation.mutate({ tableId: table.id });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation();
                                    if (!isReorderMode && !splitTablesMutation.isPending) {
                                      splitTablesMutation.mutate({ tableId: table.id });
                                    }
                                  }
                                }}
                                className={cn(
                                  "text-xs text-red-500 hover:text-red-500 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors inline-flex items-center gap-1 cursor-pointer w-fit",
                                  "md:absolute md:top-0 md:left-0 md:opacity-0 md:group-hover/merged:opacity-100",
                                  "max-md:mt-1",
                                  (splitTablesMutation.isPending || isReorderMode) && "opacity-50 cursor-not-allowed"
                                )}
                                title="Separar mesas"
                              >
                                <Unlink className="h-3 w-3" />
                                <span>Separar</span>
                              </span>
                            </div>
                          ) : null}
                          {/* Badge Reservada */}
                          {derivedStatus === "reserved" && !isMergedTable && (
                            <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                              <CalendarClock className="h-3 w-3" />
                              Reservada
                            </span>
                          )}
                          {isDeactivated && (
                            <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                              <EyeOff className="h-3 w-3" />
                              Desativada
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Contador de tempo para mesas ocupadas */}
                      {hasItems && table.occupiedAt && (
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mr-6">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDuration(table.occupiedAt)}</span>
                        </div>
                      )}
                      {/* Horário da reserva no topo (ao lado do ⋮) */}
                      {derivedStatus === "reserved" && !hasItems && table.reservedFor && (
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-blue-600 font-semibold mr-6">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatTime(table.reservedFor)}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Informações da mesa ocupada */}
                    {hasItems && (
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground flex-wrap">
                        <Receipt className="h-3.5 w-3.5" />
                        <span>{itemsCount} {itemsCount === 1 ? 'item' : 'itens'}</span>
                        {tableTotal > 0 && (
                          <>
                            <span className="text-muted-foreground/50">|</span>
                            <span className="font-semibold text-foreground">{formatCurrency(tableTotal)}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Informações da mesa reservada */}
                    {derivedStatus === "reserved" && !hasItems && (
                         <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-muted-foreground">
                        {table.reservedName && (
                          <div className="flex items-center gap-1">
                            <UserRound className="h-3.5 w-3.5" />
                            <span className="truncate">{table.reservedName}</span>
                          </div>
                        )}
                        {table.reservedGuests && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{table.reservedGuests} {table.reservedGuests === 1 ? 'pessoa' : 'pessoas'}</span>
                          </div>
                        )}

                        {!table.reservedName && !table.reservedGuests && !table.reservedFor && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{table.currentGuests || table.capacity}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Faixa inferior com identificação da mesa */}
                    {table.label && (
                      <div className="mt-1 mx-[-2px]">
                        <div className={cn(
                          "h-[1px] mx-1 rounded-full",
                          derivedStatus === 'occupied' ? 'bg-gradient-to-r from-red-300 via-red-200 to-transparent' :
                          derivedStatus === 'reserved' ? 'bg-gradient-to-r from-blue-300 via-blue-200 to-transparent' :
                          'bg-gradient-to-r from-emerald-300 via-emerald-200 to-transparent'
                        )} />
                        <div className="flex items-center gap-2 pt-1.5">
                          <div className={cn("w-[3px] h-4 rounded-full flex-shrink-0", statusConfig.color)} />
                          <span className="text-foreground text-[11px] sm:text-xs truncate">{table.label}</span>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              );
              });
            })()}
          </div>
        )}

        {/* Lista de Mesas */}
        {!isLoading && viewMode === 'list' && filteredTables.length > 0 && (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Mesa</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Espaço</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Tempo</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Itens</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Total</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTables.map((table) => {
                  const isDeactivatedRow = table.isActive === false;
                  const derivedStatus = getDerivedStatus(table);
                  const statusConfig = getStatusConfig(derivedStatus);
                  const hasItems = tableHasItems(table.id);
                  const itemsCount = getTableItemsCount(table.id);
                  const tableTotal = getTableTotal(table.id);
                  const displayNumber = table.displayNumber || table.number.toString();
                  const isMergedTable = !!table.mergedTableIds;
                  const spaceName = spaces.find(s => s.id === table.spaceId)?.name || '—';

                  return (
                    <tr
                      key={table.id}
                      onClick={() => { if (!isDeactivatedRow) handleTableClick(table); }}
                      className={cn(
                        "border-b border-border/30 last:border-b-0 transition-colors",
                        isDeactivatedRow ? "opacity-50 grayscale cursor-default" : "hover:bg-muted/30 cursor-pointer"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0",
                            isDeactivatedRow ? "bg-gray-300" : statusConfig.color
                          )}>
                            {displayNumber}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">Mesa {displayNumber}</span>
                            {isMergedTable && (
                              <span className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-0.5">
                                <Link2 className="h-3 w-3" />
                                Mesas unidas
                              </span>
                            )}
                            {derivedStatus === 'reserved' && table.reservedName && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <UserRound className="h-3 w-3" />
                                {table.reservedName}
                              </span>
                            )}
                            {table.label && derivedStatus !== 'reserved' && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div className={cn("w-[3px] h-3 rounded-full flex-shrink-0", statusConfig.color)} />
                                <span className="text-[11px] text-muted-foreground truncate">{table.label}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">{spaceName}</span>
                      </td>
                      <td className="px-4 py-3">
                        {isDeactivatedRow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">
                            <EyeOff className="h-3 w-3" />
                            Desativada
                          </span>
                        ) : (
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
                            derivedStatus === 'free' && "bg-emerald-50 text-emerald-700",
                            derivedStatus === 'occupied' && "bg-red-50 text-red-500",
                            derivedStatus === 'reserved' && "bg-blue-50 text-blue-700"
                          )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full", statusConfig.color)} />
                            {statusConfig.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {hasItems && table.occupiedAt ? (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDuration(table.occupiedAt)}
                          </span>
                        ) : derivedStatus === 'reserved' && table.reservedFor ? (
                          <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(table.reservedFor)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {hasItems ? (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Receipt className="h-3.5 w-3.5" />
                            {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {tableTotal > 0 ? (
                          <span className="text-sm font-semibold text-foreground">{formatCurrency(tableTotal)}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isDeactivatedRow ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              restoreTableMutation.mutate({ id: table.id });
                            }}
                            disabled={restoreTableMutation.isPending}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Ativar
                          </Button>
                        ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {derivedStatus === 'occupied' && hasItems && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTable(table as any);
                                  setShowPDVSlidebar(true);
                                  setTimeout(() => {
                                    const event = new CustomEvent('open-partial-close', { detail: { tableId: table.id } });
                                    window.dispatchEvent(event);
                                  }, 500);
                                }}
                                className="cursor-pointer"
                              >
                                <Scissors className="h-4 w-4 mr-2 text-orange-500" />
                                Fechar parcial
                              </DropdownMenuItem>
                            )}
                            {derivedStatus === 'occupied' && hasItems && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTransferDialog(table);
                                }}
                                className="cursor-pointer"
                              >
                                <ArrowRightLeft className="h-4 w-4 mr-2 text-orange-500" />
                                Transferir itens
                              </DropdownMenuItem>
                            )}
                            {derivedStatus === 'free' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenReserveDialog(table.id, displayNumber);
                                }}
                                className="cursor-pointer"
                              >
                                <CalendarClock className="h-4 w-4 mr-2 text-blue-500" />
                                Reservar mesa
                              </DropdownMenuItem>
                            )}
                            {derivedStatus === 'reserved' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelReservation(table.id, displayNumber);
                                }}
                                className="cursor-pointer text-red-500 focus:text-red-500"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Cancelar reserva
                              </DropdownMenuItem>
                            )}
                            {derivedStatus === 'occupied' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearTable(table as Table);
                                }}
                                className="cursor-pointer text-red-500 focus:text-red-500"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Limpar mesa
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeactivateTable(table.id, table.number);
                              }}
                              className="cursor-pointer text-red-500 focus:text-red-500"
                            >
                              <EyeOff className="h-4 w-4 mr-2" />
                              Desativar mesa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Mensagem quando não há mesas no filtro */}
        {!isLoading && filteredTables.length === 0 && tables.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-10 w-10 mb-3 text-muted-foreground/50" />
            <p>Nenhuma mesa encontrada com os filtros selecionados.</p>
            <button
              onClick={() => {
                setSelectedSpaceId("all");
                setStatusFilter(null);
                setSearchQuery("");
              }}
              className="text-sm text-red-500 hover:text-red-500 mt-2"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* Sidebar de Detalhes da Mesa */}
      <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedTable && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold",
                    getStatusConfig(selectedTable.status as TableStatus).color
                  )}>
                    {selectedTable.number}
                  </div>
                  <div>
                    <span className="text-xl">Mesa {selectedTable.number}</span>
                    <p className={cn(
                      "text-sm font-medium",
                      getStatusConfig(selectedTable.status as TableStatus).textColor
                    )}>
                      {getStatusConfig(selectedTable.status as TableStatus).label}
                    </p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              {/* Informações da Comanda */}
              {selectedTable.tab && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Comanda</span>
                    <span className="font-medium">{selectedTable.tab.tabNumber}</span>
                  </div>
                  {selectedTable.occupiedAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tempo de uso</span>
                      <span className="font-medium flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(selectedTable.occupiedAt)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pessoas</span>
                    <span className="font-medium flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {selectedTable.currentGuests}
                    </span>
                  </div>
                </div>
              )}

              {/* Lista de Itens */}
              {selectedTable.items && selectedTable.items.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-3">Itens da Comanda</h4>
                  <div className="space-y-2">
                    {selectedTable.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity}x {formatCurrency(parseFloat(item.unitPrice))}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground/70 italic">{item.notes}</p>
                          )}
                        </div>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(parseFloat(item.totalPrice))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totais */}
              {selectedTable.tab && (
                <div className="border-t border-border pt-4 mb-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(parseFloat(selectedTable.tab.subtotal))}</span>
                  </div>
                  {parseFloat(selectedTable.tab.serviceCharge) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Taxa de Serviço{serviceChargeConfig?.percent && parseFloat(serviceChargeConfig.percent) > 0 ? ` (${serviceChargeConfig.percent}%)` : ""}</span>
                      <span>{formatCurrency(parseFloat(selectedTable.tab.serviceCharge))}</span>
                    </div>
                  )}
                  {parseFloat(selectedTable.tab.discount) > 0 && (
                    <div className="flex items-center justify-between text-sm text-emerald-600">
                      <span>Desconto</span>
                      <span>-{formatCurrency(parseFloat(selectedTable.tab.discount))}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-lg font-bold pt-2 border-t border-border">
                    <span>Total</span>
                    <span>{formatCurrency(parseFloat(selectedTable.tab.total))}</span>
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="space-y-3">
                {selectedTable.status === "free" && (
                  <Button 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => handleOpenTable(selectedTable)}
                    disabled={openTableMutation.isPending}
                  >
                    {openTableMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Users className="h-4 w-4 mr-2" />
                    )}
                    Abrir Mesa
                  </Button>
                )}

                {selectedTable.status === "occupied" && (
                  <>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                      onClick={() => {
                        setShowSidebar(false);
                        if (isMobile) {
                          setShowMobilePDV(true);
                        } else {
                          setShowPDVSlidebar(true);
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                      onClick={() => handleRequestBill(selectedTable)}
                      disabled={requestBillMutation.isPending}
                    >
                      {requestBillMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Receipt className="h-4 w-4 mr-2" />
                      )}
                      Pedir Conta
                    </Button>
                  </>
                )}

                {selectedTable.status === "reserved" && (
                  <>
                    <Button 
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={() => handleOpenTable(selectedTable)}
                      disabled={openTableMutation.isPending}
                    >
                      {openTableMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Users className="h-4 w-4 mr-2" />
                      )}
                      Confirmar Chegada
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-red-300 text-red-500 hover:bg-red-50"
                      onClick={() => handleClearTable(selectedTable)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancelar Reserva
                    </Button>
                  </>
                )}

                {selectedTable.status === "occupied" && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={() => handleClearTable(selectedTable)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Mesa
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog para criar mesas */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent
          className="sm:max-w-md p-0 overflow-hidden border-t-4 border-t-primary"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Criar Mesas</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            {/* Header com ícone */}
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-primary/10">
                <LayoutGrid className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Criar Mesas</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Configure o espaço e a quantidade de mesas para o seu restaurante.
                </p>
              </div>
            </div>

            {/* Campos */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nome do espaço</label>
                <Input
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="Ex: Salão, Varanda, Área Externa..."
                  className="rounded-lg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Opcional. Agrupa as mesas por local físico do restaurante.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Quantidade de mesas</label>
                <Input
                  type="number"
                  value={newTableCount}
                  onChange={(e) => setNewTableCount(parseInt(e.target.value) || 1)}
                  min={1}
                  max={100}
                  className="rounded-lg"
                />
              </div>

            </div>

            {/* Botão Criar */}
            <Button
              className="w-full rounded-xl h-10 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleCreateTables}
              disabled={createBatchMutation.isPending}
            >
              {createBatchMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" /> Criar {newTableCount} Mesas</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para gerenciar espaços */}
      <Sheet open={showManageSpacesDialog} onOpenChange={setShowManageSpacesDialog}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[400px] p-0 overflow-hidden flex flex-col"
          hideCloseButton
        >
          <SheetTitle className="sr-only">Configurações e gerenciamento</SheetTitle>
          {/* Header — gradiente vermelho PDV style */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Configurações e gerenciamento</h2>
                  <p className="text-sm text-white/80">Espaços, mesas e taxa de serviço</p>
                </div>
              </div>
              <button onClick={() => setShowManageSpacesDialog(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Configuração da Taxa de Serviço - no topo */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <Receipt className="h-4 w-4" />
                Taxa de Serviço
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Percentual aplicado automaticamente sobre o subtotal da comanda.
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={serviceChargeLoaded ? serviceChargeInput : (() => {
                      const raw = serviceChargeConfig?.percent || "0";
                      const num = parseFloat(raw);
                      return num > 0 ? num.toFixed(2).replace(".", ",") : "";
                    })()}
                    onChange={(e) => {
                      setServiceChargeLoaded(true);
                      // Format: only digits, format as X,XX
                      const digits = e.target.value.replace(/[^0-9]/g, "");
                      if (digits === "" || digits === "0" || digits === "00" || digits === "000") {
                        setServiceChargeInput("");
                        return;
                      }
                      const num = parseInt(digits, 10);
                      const formatted = (num / 100).toFixed(2).replace(".", ",");
                      setServiceChargeInput(formatted);
                    }}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const displayVal = serviceChargeLoaded ? serviceChargeInput : (serviceChargeConfig?.percent || "0");
                    // Convert from "5,00" format to "5.00" for backend
                    const val = displayVal.replace(",", ".");
                    updateServiceChargeMutation.mutate({ percent: val || "0" });
                  }}
                  disabled={updateServiceChargeMutation.isPending}
                >
                  {updateServiceChargeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </div>
            {/* Seção: Espaços criados */}
            <div className="pt-4 border-t">
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4" />
                Espaços criados ({spaces.length})
              </h4>
            {/* Lista de espaços existentes */}
            {spaces.length > 0 ? (
              <div className="space-y-2">
                {spaces.map((space) => (
                  <div key={space.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    {editingSpaceId === space.id ? (
                      <>
                        <Input
                          value={editingSpaceName}
                          onChange={(e) => setEditingSpaceName(e.target.value)}
                          className="flex-1"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdateSpace(space.id)}
                          disabled={updateSpaceMutation.isPending}
                        >
                          {updateSpaceMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Salvar"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingSpaceId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 font-medium">{space.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {spaceTablesCount[space.id] || 0} mesas
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingSpaceId(space.id);
                            setEditingSpaceName(space.name);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-500"
                          onClick={() => handleDeleteSpace(space.id)}
                          disabled={deleteSpaceMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <MapPin className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                <p>Nenhum espaço cadastrado.</p>
                <p className="text-sm">Use o botão <strong>+</strong> ao lado do campo de busca para criar espaços.</p>
              </div>
            )}

            </div>
            {/* Lista de mesas ativas - exclusão (soft delete) */}
            {tables.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  Mesas Ativas ({tables.filter(t => t.isActive !== false).length})
                </h4>
                {/* Exclusão em lote */}
                {tables.filter(t => t.isActive !== false).length > 1 && (
                  <div className="flex items-center gap-2 mb-3 p-2.5 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Excluir últimas</span>
                    <select
                      value={bulkDeleteCount}
                      onChange={(e) => setBulkDeleteCount(Number(e.target.value))}
                      className="h-7 px-2 text-xs border rounded bg-background"
                    >
                      {[5, 10, 15, 20, 30, 50].filter(n => n <= tables.filter(t => t.isActive !== false).length).map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">mesas</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 px-3 text-xs ml-auto"
                      onClick={() => {
                        const activeTables = tables.filter(t => t.isActive !== false).sort((a, b) => b.number - a.number);
                        const toDelete = activeTables.slice(0, bulkDeleteCount);
                        if (confirm(`Tem certeza que deseja excluir as últimas ${toDelete.length} mesas (Mesa ${toDelete[toDelete.length-1]?.number} a ${toDelete[0]?.number})?`)) {
                          bulkDeleteMutation.mutate({ ids: toDelete.map(t => t.id) });
                        }
                      }}
                      disabled={bulkDeleteMutation.isPending}
                    >
                      {bulkDeleteMutation.isPending ? "Excluindo..." : "Excluir"}
                    </Button>
                  </div>
                )}
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {tables.filter(t => t.isActive !== false).map((table) => (
                    <div key={table.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
                      <span>Mesa {table.number}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-500 hover:bg-red-50"
                        onClick={() => deleteTableMutation.mutate({ id: table.id })}
                        disabled={deleteTableMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Lista de mesas excluídas (soft deleted) - com opção de restaurar ou excluir permanentemente */}
            {deletedTables.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2 text-amber-600">
                    <EyeOff className="h-4 w-4" />
                    Mesas Excluídas ({deletedTables.length})
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-3 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja REMOVER PERMANENTEMENTE todas as ${deletedTables.length} mesas excluídas? Esta ação não pode ser desfeita.`)) {
                        deleteAllPermanentlyMutation.mutate();
                      }
                    }}
                    disabled={deleteAllPermanentlyMutation.isPending}
                  >
                    {deleteAllPermanentlyMutation.isPending ? "Limpando..." : "Limpar todas"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Mesas excluídas podem ser restauradas ou removidas permanentemente.
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {deletedTables.map((table) => (
                    <div key={table.id} className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm">
                      <span className="text-muted-foreground">Mesa {table.number}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs gap-1"
                          onClick={() => restoreDeletedMutation.mutate({ id: table.id })}
                          disabled={restoreDeletedMutation.isPending}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restaurar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-500 hover:bg-red-50"
                          onClick={() => handleDeleteTablePermanently(table.id, table.number)}
                          disabled={deletePermanentlyMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog para reservar mesa */}
      <Dialog open={showReserveDialog} onOpenChange={setShowReserveDialog}>
        <DialogContent
          className="max-w-sm p-0 overflow-hidden border-t-4 border-t-blue-500"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Reservar Mesa {reserveTableNumber}</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-blue-100 dark:bg-blue-950/50">
                <CalendarClock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Reservar Mesa {reserveTableNumber}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Preencha os dados da reserva
                </p>
              </div>
            </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nome do cliente</label>
              <div className="relative mt-1">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={reserveName}
                  onChange={(e) => setReserveName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Telefone</label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                   value={reservePhone}
                   onChange={(e) => {
                     const numbers = e.target.value.replace(/\D/g, '');
                     const limited = numbers.slice(0, 11);
                     let formatted = '';
                     if (limited.length === 0) formatted = '';
                     else if (limited.length <= 2) formatted = limited;
                     else if (limited.length <= 3) formatted = `${limited.slice(0, 2)} ${limited.slice(2)}`;
                     else if (limited.length <= 7) formatted = `${limited.slice(0, 2)} ${limited.slice(2, 3)} ${limited.slice(3)}`;
                     else formatted = `${limited.slice(0, 2)} ${limited.slice(2, 3)} ${limited.slice(3, 7)}-${limited.slice(7)}`;
                     setReservePhone(formatted);
                   }}
                   placeholder="88 9 9929-0000"
                   maxLength={16}
                   className="pl-9"
                 />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Horário da reserva</label>
              <div className="relative mt-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={reserveTime}
                  onChange={(e) => setReserveTime(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Quantidade de pessoas</label>
              <div className="relative mt-1">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  value={reserveGuests}
                  onChange={(e) => setReserveGuests(e.target.value)}
                  placeholder="Ex: 4"
                  className="pl-9"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Todos os campos são opcionais.</p>
          </div>
            <Button
              className="w-full rounded-xl h-10 font-semibold bg-blue-500 hover:bg-blue-600 text-white mt-4"
              onClick={handleConfirmReservation}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CalendarClock className="h-4 w-4 mr-2" />
              )}
              Reservar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para transferir itens entre mesas */}
      <Dialog open={showTransferDialog} onOpenChange={(open) => {
        if (!open) {
          setShowTransferDialog(false);
          setShowTransferConfirm(false);
        }
      }}>
        <DialogContent
          className="max-w-md p-0 overflow-hidden border-t-4 border-t-orange-500"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Transferir Itens</DialogTitle>
          <DialogDescription className="sr-only">Selecione os itens e a mesa de destino para transferir</DialogDescription>
          <div className="px-6 pt-5 pb-6">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-orange-100 dark:bg-orange-950/50">
                <ArrowRightLeft className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Transferir Itens — Mesa {transferSourceTable?.displayNumber || transferSourceTable?.number}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Selecione os itens e a mesa de destino
                </p>
              </div>
            </div>

            {!showTransferConfirm ? (
              <>
                {/* Lista de itens para selecionar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">Itens da comanda</label>
                    {transferSourceTable?.items && transferSourceTable.items.filter(i => i.status !== 'cancelled').length > 0 && (
                      <button
                        onClick={() => handleToggleAllTransferItems(transferSourceTable.items || [])}
                        className="text-xs text-primary hover:underline"
                      >
                        {transferSelectedItems.length === (transferSourceTable.items?.filter(i => i.status !== 'cancelled').length || 0)
                          ? 'Desmarcar todos'
                          : 'Selecionar todos'}
                      </button>
                    )}
                  </div>
                  <ScrollArea className="max-h-[240px]">
                    <div className="space-y-1">
                      {transferSourceTable?.items?.filter(i => i.status !== 'cancelled').map((item) => {
                        const isSelected = transferSelectedItems.includes(item.id);
                        const complements = item.complements as Array<{ name: string; price: number; quantity: number }> | null;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleToggleTransferItem(item.id)}
                            className={cn(
                              "flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors border",
                              isSelected
                                ? "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800"
                                : "bg-muted/30 border-transparent hover:bg-muted/60"
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleTransferItem(item.id)}
                              className="mt-0.5 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground truncate">
                                  {item.quantity}x {item.productName}
                                </span>
                                <span className="text-sm font-semibold text-foreground ml-2 flex-shrink-0">
                                  {formatCurrency(parseFloat(item.totalPrice))}
                                </span>
                              </div>
                              {complements && complements.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  + {complements.map(c => c.name).join(', ')}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-xs text-muted-foreground/70 italic mt-0.5">{item.notes}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {/* Seletor de mesa de destino */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Mesa de destino</label>
                  <Select
                    value={transferTargetTableId?.toString() || ''}
                    onValueChange={(val) => setTransferTargetTableId(parseInt(val))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a mesa de destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables
                        .filter(t =>
                          t.id !== transferSourceTable?.id &&
                          t.isActive !== false &&
                          !t.mergedIntoId
                        )
                        .sort((a, b) => a.number - b.number)
                        .map(t => {
                          const tDisplay = t.displayNumber || t.number.toString();
                          const tStatus = getDerivedStatus(t);
                          const tHasItems = tableHasItems(t.id);
                          return (
                            <SelectItem key={t.id} value={t.id.toString()}>
                              <span className="flex items-center gap-2">
                                <span className={cn(
                                  "w-2 h-2 rounded-full flex-shrink-0",
                                  tStatus === 'occupied' ? 'bg-red-500' : tStatus === 'reserved' ? 'bg-blue-500' : 'bg-emerald-500'
                                )} />
                                Mesa {tDisplay}
                                {tHasItems && (
                                  <span className="text-xs text-muted-foreground">
                                    ({getTableItemsCount(t.id)} {getTableItemsCount(t.id) === 1 ? 'item' : 'itens'})
                                  </span>
                                )}
                              </span>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Opção de transferir label */}
                {transferSourceTable?.label && (
                  <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-muted/30">
                    <Checkbox
                      id="transfer-label"
                      checked={transferLabel}
                      onCheckedChange={(checked) => setTransferLabel(!!checked)}
                    />
                    <label htmlFor="transfer-label" className="text-sm text-foreground cursor-pointer">
                      Transferir identificação <span className="font-medium">"{transferSourceTable.label}"</span>
                    </label>
                  </div>
                )}

                {/* Botão continuar */}
                <Button
                  className="w-full rounded-xl h-10 font-semibold bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => setShowTransferConfirm(true)}
                  disabled={transferSelectedItems.length === 0 || !transferTargetTableId}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Continuar ({transferSelectedItems.length} {transferSelectedItems.length === 1 ? 'item' : 'itens'})
                </Button>
              </>
            ) : (
              /* Tela de confirmação */
              <>
                <div className="rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-4 mb-4">
                  <p className="text-sm text-foreground font-medium text-center">
                    Transferir <span className="font-bold text-orange-600">{transferSelectedItems.length} {transferSelectedItems.length === 1 ? 'item' : 'itens'}</span> da{' '}
                    <span className="font-bold">Mesa {transferSourceTable?.displayNumber || transferSourceTable?.number}</span> para a{' '}
                    <span className="font-bold">Mesa {(() => {
                      const target = tables.find(t => t.id === transferTargetTableId);
                      return target?.displayNumber || target?.number;
                    })()}</span>?
                  </p>
                  
                  {/* Resumo dos itens */}
                  <div className="mt-3 space-y-1">
                    {transferSourceTable?.items
                      ?.filter(i => transferSelectedItems.includes(i.id))
                      .map(item => (
                        <div key={item.id} className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{item.quantity}x {item.productName}</span>
                          <span>{formatCurrency(parseFloat(item.totalPrice))}</span>
                        </div>
                      ))}
                    <div className="flex items-center justify-between text-sm font-semibold text-foreground pt-1 border-t border-orange-200 dark:border-orange-700 mt-2">
                      <span>Total</span>
                      <span>{formatCurrency(
                        transferSourceTable?.items
                          ?.filter(i => transferSelectedItems.includes(i.id))
                          .reduce((sum, i) => sum + parseFloat(i.totalPrice), 0) || 0
                      )}</span>
                    </div>
                  </div>

                  {transferSourceTable?.items?.filter(i => i.status !== 'cancelled').length === transferSelectedItems.length && (
                    <p className="text-xs text-orange-600 mt-2 text-center">
                      Todos os itens serão transferidos. A mesa de origem ficará livre.
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-10"
                    onClick={() => setShowTransferConfirm(false)}
                    disabled={transferItemsMutation.isPending}
                  >
                    Voltar
                  </Button>
                  <Button
                    className="flex-1 rounded-xl h-10 font-semibold bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handleConfirmTransfer}
                    disabled={transferItemsMutation.isPending}
                  >
                    {transferItemsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Confirmar
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile PDV Modal - apenas no mobile */}
      {isMobile && (
        <MobilePDVModal
          isOpen={showMobilePDV}
          onClose={() => setShowMobilePDV(false)}
          tableNumber={selectedTable?.number || 0}
          tableId={selectedTable?.id}
          tabId={selectedTable?.tab?.id}
          occupiedAt={selectedTable?.occupiedAt}
          displayNumber={selectedTable?.displayNumber}
          onOrderCreated={handleOrderCreated}
          tabItemsCount={selectedTable?.items?.length || 0}
          tableTotal={selectedTable?.id ? getTableTotal(selectedTable.id) : 0}
          tableLabel={selectedTable?.label}
        />
      )}

      {/* PDV Slidebar - apenas no desktop */}
      <PDVSlidebar
        isOpen={showPDVSlidebar}
        onClose={handlePDVSlidebarClose}
        onToggle={() => setShowPDVSlidebar(true)}
        tableNumber={selectedTable?.number || 0}
        tableId={selectedTable?.id}
        tabId={selectedTable?.tab?.id}
        onOrderCreated={handleOrderCreated}
        showHandle={true}
        displayNumber={selectedTable?.displayNumber}
        tableLabel={selectedTable?.label}
        tables={tables.map(t => ({
          id: t.id,
          number: t.number,
          status: t.status === "requesting_bill" ? "occupied" : t.status,
          tabId: t.tab?.id,
          tabItemsCount: t.items?.length || 0,
          displayNumber: t.displayNumber,
          mergedIntoId: t.mergedIntoId
        }))}
        onTableChange={(table) => {
          const fullTable = tables.find(t => t.id === table.id);
          if (fullTable) {
            setSelectedTable({
              ...fullTable,
              status: fullTable.status === "requesting_bill" ? "occupied" : fullTable.status as TableStatus
            } as Table);
          }
        }}
      />
      </div>
    </AdminLayout>
  );
}
