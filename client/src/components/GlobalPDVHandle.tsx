import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { getGlobalHandleConfig, isGlobalHandleEnabled, PDVSlidebar } from "./PDVSlidebar";
import { trpc } from "@/lib/trpc";

// Constante para localStorage
const HANDLE_CONFIG_KEY = 'pdv-slidebar-handle-config';
const LAST_TABLE_KEY = 'pdv-slidebar-last-table';

export function GlobalPDVHandle() {
  const [location] = useLocation();
  const [isEnabled, setIsEnabled] = useState(false);
  const [handleConfig, setHandleConfig] = useState(getGlobalHandleConfig());
  const [isSlidebarOpen, setIsSlidebarOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<{ id: number; number: number; tabId?: number } | null>(null);
  
  // Buscar mesas do estabelecimento
  const { data: establishment } = trpc.establishment.get.useQuery();
  const { data: tables } = trpc.tables.list.useQuery();

  // Verificar se a aba global está ativada e atualizar quando o localStorage mudar
  useEffect(() => {
    const checkConfig = () => {
      const config = getGlobalHandleConfig();
      setHandleConfig(config);
      setIsEnabled(config.showGlobally);
    };
    
    checkConfig();
    
    // Listener para mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === HANDLE_CONFIG_KEY) {
        checkConfig();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Verificar periodicamente (para mudanças na mesma aba)
    const interval = setInterval(checkConfig, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Restaurar última mesa selecionada
  useEffect(() => {
    if (tables && tables.length > 0) {
      try {
        const savedTableId = localStorage.getItem(LAST_TABLE_KEY);
        if (savedTableId) {
          const table = tables.find(t => t.id === parseInt(savedTableId));
          if (table) {
            setSelectedTable({
              id: table.id,
              number: table.number,
              tabId: table.tab?.id || undefined
            });
          }
        } else {
          // Selecionar a primeira mesa disponível
          const firstTable = tables[0];
          setSelectedTable({
            id: firstTable.id,
            number: firstTable.number,
            tabId: firstTable.tab?.id || undefined
          });
        }
      } catch (e) {
        console.error('Erro ao restaurar mesa:', e);
      }
    }
  }, [tables]);

  // Atalhos de teclado F2 para abrir e ESC para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Não capturar se estiver em um input ou textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      // F2 para abrir a slidebar
      if (e.key === 'F2') {
        e.preventDefault();
        setIsSlidebarOpen(true);
      }
      
      // ESC para fechar a slidebar
      if (e.key === 'Escape' && isSlidebarOpen) {
        e.preventDefault();
        setIsSlidebarOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSlidebarOpen]);

  // Não mostrar nas páginas de PDV ou Mesas
  const excludedPaths = ['/pdv', '/mesas'];
  const shouldShow = isEnabled && !excludedPaths.some(path => location.startsWith(path));

  if (!shouldShow || !selectedTable) {
    return null;
  }

  const handleToggle = () => {
    setIsSlidebarOpen(!isSlidebarOpen);
  };

  const handleClose = () => {
    setIsSlidebarOpen(false);
  };

  return (
    <>
      {/* Aba fixa global */}
      <div
        className={cn(
          "fixed flex flex-col items-center justify-center cursor-pointer select-none touch-none",
          "bg-gradient-to-r from-red-500 to-red-500 rounded-l-lg shadow-lg",
          "hover:from-red-500 hover:to-red-500 transition-colors duration-200",
          !isSlidebarOpen && "animate-handle-pulse",
          "z-50"
        )}
        style={{
          width: `${handleConfig.width}px`,
          height: `${handleConfig.height}px`,
          top: `${handleConfig.positionY}%`,
          transform: 'translateY(-50%)',
          right: isSlidebarOpen ? '78%' : '0',
          transition: 'right 0.3s ease-in-out'
        }}
        onClick={handleToggle}
      >
        <button className="flex flex-col items-center justify-center w-full h-full">
          {/* Seta */}
          <div className="flex items-center">
            {isSlidebarOpen ? (
              <ChevronRight className="h-5 w-5 text-white" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-white" />
            )}
          </div>

        </button>
      </div>

      {/* Slidebar do PDV */}
      <PDVSlidebar
        isOpen={isSlidebarOpen}
        onClose={handleClose}
        onToggle={handleToggle}
        tableNumber={selectedTable.number}
        tableId={selectedTable.id}
        tabId={selectedTable.tabId}
        showHandle={false}
        tables={tables?.map(t => ({
          id: t.id,
          number: t.number,
          status: t.status === "requesting_bill" ? "occupied" : t.status,
          tabId: t.tab?.id,
          tabItemsCount: t.items?.length || 0
        })) || []}
        onTableChange={(table) => {
          setSelectedTable({
            id: table.id,
            number: table.number,
            tabId: table.tabId
          });
          // Salvar a mesa selecionada
          localStorage.setItem(LAST_TABLE_KEY, table.id.toString());
        }}
      />
    </>
  );
}
