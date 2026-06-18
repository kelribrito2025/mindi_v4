import { cn } from "@/lib/utils";
import { usePreference } from "@/hooks/usePreference";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Store,
  Clock,
  MessageCircle,
  Printer,
  Puzzle,
  ChevronDown,
  Menu,
  ShieldCheck,
  Bell,
  FileText,
  Link2,
  Lock,
} from "lucide-react";
import { useState, useEffect } from "react";

export type SettingsSection = 
  | "estabelecimento" 
  | "atendimento" 
  | "whatsapp" 
  | "whatsapp-conexao"
  | "whatsapp-notificacoes"
  | "whatsapp-templates"
  | "impressora" 
  | "integracoes"
  | "conta-seguranca";

interface SubMenuItem {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
}

interface MenuItem {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
  subItems?: SubMenuItem[];
  lockedByPlan?: boolean;
  lockedLabel?: string;
}

const menuItems: MenuItem[] = [
  { id: "estabelecimento", label: "Estabelecimento", icon: Store },
  { id: "atendimento", label: "Atendimento", icon: Clock },
  { 
    id: "whatsapp", 
    label: "WhatsApp", 
    icon: MessageCircle,
    subItems: [
      { id: "whatsapp-conexao", label: "Conexão", icon: Link2 },
      { id: "whatsapp-notificacoes", label: "Notificações", icon: Bell },
      { id: "whatsapp-templates", label: "Templates", icon: FileText },
    ],
  },
  { id: "impressora", label: "Impressora e Teste", icon: Printer },
  { id: "integracoes", label: "Integrações", icon: Puzzle },
  { id: "conta-seguranca", label: "Conta e Segurança", icon: ShieldCheck },
];

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  planType?: string;
}

// Helper para verificar se uma seção é sub-item do WhatsApp
function isWhatsAppSection(section: SettingsSection): boolean {
  return section === "whatsapp" || section === "whatsapp-conexao" || section === "whatsapp-notificacoes" || section === "whatsapp-templates";
}

// Lite plan: only show Estabelecimento, Atendimento (simplified), Conta e Segurança
const LITE_ALLOWED_SECTIONS: SettingsSection[] = ['estabelecimento', 'atendimento', 'conta-seguranca'];
const LOCKED_PLAN_MESSAGE = 'Disponível em planos superiores';

export function SettingsSidebar({ activeSection, onSectionChange, planType }: SettingsSidebarProps) {
  const isLitePlan = planType === 'lite' || planType === 'trial' || planType === 'free';
  const [hideLockedPrefValue] = usePreference('sidebar_hide_locked');
  const hideLockedItems = hideLockedPrefValue === 'true';
  const visibleMenuItems = (isLitePlan 
    ? menuItems.map(item => LITE_ALLOWED_SECTIONS.includes(item.id) ? item : { ...item, lockedByPlan: true, lockedLabel: LOCKED_PLAN_MESSAGE })
    : menuItems
  ).filter(item => !(hideLockedItems && item.lockedByPlan));
  const [isExpanded, setIsExpanded] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(() => isWhatsAppSection(activeSection));
  
  // Abrir submenu do WhatsApp automaticamente quando uma seção WhatsApp é ativa
  useEffect(() => {
    if (isWhatsAppSection(activeSection)) {
      setWhatsappOpen(true);
    }
  }, [activeSection]);
  
  // Encontrar o item ativo para mostrar no botão do accordion (mobile)
  const getActiveLabel = (): string => {
    for (const item of visibleMenuItems) {
      if (item.id === activeSection) return item.label;
      if (item.subItems) {
        const sub = item.subItems.find(s => s.id === activeSection);
        if (sub) return `${item.label} › ${sub.label}`;
      }
    }
    return "Selecione";
  };
  
  const getActiveIcon = (): React.ElementType => {
    for (const item of visibleMenuItems) {
      if (item.id === activeSection) return item.icon;
      if (item.subItems) {
        const sub = item.subItems.find(s => s.id === activeSection);
        if (sub) return sub.icon;
      }
    }
    return Store;
  };

  const ActiveIcon = getActiveIcon();

  const handleSectionClick = (section: SettingsSection) => {
    onSectionChange(section);
    setIsExpanded(false);
  };

  const handleWhatsAppClick = () => {
    if (whatsappOpen) {
      setWhatsappOpen(false);
    } else {
      setWhatsappOpen(true);
      // Ao abrir, navegar para Notificações por padrão se não estiver em sub-item
      if (!isWhatsAppSection(activeSection)) {
        onSectionChange("whatsapp-notificacoes");
      }
    }
  };

  const renderLockedMenuItem = (item: MenuItem, Icon: React.ElementType, options?: { mobile?: boolean; bordered?: boolean }) => {
    const isMobile = options?.mobile === true;
    const message = item.lockedLabel || LOCKED_PLAN_MESSAGE;

    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div
            role="menuitem"
            aria-disabled="true"
            aria-label={`${item.label}: ${message}`}
            tabIndex={0}
            className={cn(
              isMobile
                ? "w-full flex items-center gap-3 p-3 text-sm font-medium text-muted-foreground/50 cursor-not-allowed opacity-60"
                : "w-full flex items-center gap-3 py-2.5 text-sm font-medium text-muted-foreground/50 cursor-not-allowed opacity-60",
              isMobile && options?.bordered && "border-b border-border/30"
            )}
            style={!isMobile ? { paddingLeft: '14px', marginLeft: '-3px' } : undefined}
          >
            <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground/50" />
            <span className="flex-1 text-left">{item.label}</span>
            <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
        </TooltipTrigger>
        <TooltipContent side={isMobile ? "top" : "right"} className="font-medium">
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Versão Desktop - Barra lateral normal */}
      <div className="hidden md:block">
        <div className="mb-4 px-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Configurações
          </h3>
        </div>
        
        <nav className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = !!item.subItems;
            const isActive = hasSubItems 
              ? isWhatsAppSection(activeSection) 
              : activeSection === item.id;
            const isDisabled = item.disabled;
            const isLocked = item.lockedByPlan;
            
            return (
              <div key={item.id}>
                {isLocked ? (
                  renderLockedMenuItem(item, Icon)
                ) : (
                <button
                  onClick={() => {
                    if (isDisabled) return;
                    if (hasSubItems) {
                      handleWhatsAppClick();
                    } else {
                      onSectionChange(item.id);
                    }
                  }}
                  disabled={isDisabled}
                  className={cn(
                    "w-full flex items-center gap-3 py-2.5 text-sm font-medium transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative",
                    isDisabled
                      ? "text-muted-foreground/50 cursor-not-allowed px-3"
                      : hasSubItems && isActive
                        ? "text-primary"
                        : !hasSubItems && isActive
                          ? "bg-primary/15 text-primary rounded-r-xl -ml-3 pl-6 border-r-4 border-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground px-3 rounded-lg"
                  )}
                  style={
                    !hasSubItems && isActive && !isDisabled 
                      ? { borderRadius: '12px', marginRight: '-12px', paddingLeft: '14px', marginLeft: '-3px' } 
                      : { paddingLeft: '14px', marginLeft: '-3px' }
                  }
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isDisabled ? "text-muted-foreground/50" : isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isDisabled && (
                    <span className="ml-auto text-[9px] font-semibold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-lg">
                      Breve
                    </span>
                  )}
                  {hasSubItems && !isDisabled && (
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      whatsappOpen ? "rotate-180" : ""
                    )} />
                  )}
                </button>
                )}
                
                {/* Sub-items */}
                {hasSubItems && item.subItems && !isLocked && (
                  <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    whatsappOpen ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-border/50 pl-3">
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeSection === sub.id;
                        
                        return (
                          <button
                            key={sub.id}
                            onClick={() => onSectionChange(sub.id)}
                            className={cn(
                              "w-full flex items-center gap-2.5 py-2 px-2.5 text-sm font-medium rounded-lg transition-colors duration-200",
                              isSubActive
                                ? "bg-primary/15 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <SubIcon className={cn(
                              "h-4 w-4 flex-shrink-0",
                              isSubActive ? "text-primary" : "text-muted-foreground"
                            )} />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Versão Mobile - Menu Sanfona (Accordion) */}
      <div className="md:hidden">
        {/* Botão do Accordion */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full flex items-center justify-between gap-3 p-3 rounded-xl transition-colors duration-300",
            isExpanded 
              ? "bg-primary/15 text-primary" 
              : "bg-card border border-border/50 text-foreground shadow-sm"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isExpanded ? "bg-primary/15" : "bg-muted"
            )}>
              <ActiveIcon className={cn(
                "h-5 w-5",
                isExpanded ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Configurações</p>
              <p className="font-medium">{getActiveLabel()}</p>
            </div>
          </div>
          <ChevronDown className={cn(
            "h-5 w-5 transition-transform duration-300",
            isExpanded ? "rotate-180 text-primary" : "text-muted-foreground"
          )} />
        </button>

        {/* Lista de Opções do Accordion */}
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isExpanded ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"
        )}>
          <nav className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
            {visibleMenuItems.map((item, index) => {
              const Icon = item.icon;
              const hasSubItems = !!item.subItems;
              const isParentActive = hasSubItems && isWhatsAppSection(activeSection);
              const isActive = !hasSubItems && activeSection === item.id;
              const isDisabled = item.disabled;
              const isLocked = item.lockedByPlan;
              
              return (
                <div key={item.id}>
                  {isLocked ? (
                    renderLockedMenuItem(item, Icon, { mobile: true, bordered: index !== visibleMenuItems.length - 1 })
                  ) : (
                  <button
                    onClick={() => {
                      if (isDisabled) return;
                      if (hasSubItems) {
                        handleWhatsAppClick();
                      } else {
                        handleSectionClick(item.id);
                      }
                    }}
                    disabled={isDisabled}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 text-sm font-medium transition-colors duration-200",
                      isDisabled
                        ? "text-muted-foreground/50 cursor-not-allowed"
                        : isActive
                          ? "bg-primary/15 text-primary border-l-4 border-primary"
                          : isParentActive
                            ? "text-primary"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      !hasSubItems && index !== visibleMenuItems.length - 1 && "border-b border-border/30"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isDisabled ? "text-muted-foreground/50" : (isActive || isParentActive) ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isDisabled ? (
                      <span className="text-[9px] font-semibold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-lg">
                        Breve
                      </span>
                    ) : hasSubItems ? (
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        whatsappOpen ? "rotate-180" : ""
                      )} />
                    ) : isActive && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                  )}
                  
                  {/* Sub-items mobile */}
                  {hasSubItems && item.subItems && !isLocked && (
                    <div className={cn(
                      "overflow-hidden transition-all duration-300",
                      whatsappOpen ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
                    )}>
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeSection === sub.id;
                        
                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleSectionClick(sub.id)}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 pl-10 text-sm font-medium transition-colors duration-200",
                              isSubActive
                                ? "bg-primary/10 text-primary border-l-4 border-primary"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                              "border-b border-border/30"
                            )}
                          >
                            <SubIcon className={cn(
                              "h-4 w-4 flex-shrink-0",
                              isSubActive ? "text-primary" : "text-muted-foreground"
                            )} />
                            <span className="flex-1 text-left">{sub.label}</span>
                            {isSubActive && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </TooltipProvider>
  );
}
