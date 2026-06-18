import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "@/components/shared";
import { 
  Loader2,
  ShoppingBag,
  ChefHat,
  CheckCircle,
  Package,
  XCircle,
  RotateCcw,
  Info,
  MessageCircle,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  Send,
  Check,
  FileText
} from "lucide-react";

interface TemplatesEditorProps {
  templateNewOrder: string;
  setTemplateNewOrder: (value: string) => void;
  templatePreparing: string;
  setTemplatePreparing: (value: string) => void;
  templateReady: string;
  setTemplateReady: (value: string) => void;
  templateReadyPickup: string;
  setTemplateReadyPickup: (value: string) => void;
  templateCompleted: string;
  setTemplateCompleted: (value: string) => void;
  templateCancelled: string;
  setTemplateCancelled: (value: string) => void;
  templateReservation?: string;
  setTemplateReservation?: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  defaultTemplates: {
    newOrder: string;
    preparing: string;
    ready: string;
    readyPickup: string;
    completed: string;
    cancelled: string;
    reservation?: string;
  };
  restaurantName?: string;
  restaurantLogo?: string | null;
  // Flags de notificações ativadas - templates desativados não são exibidos
  enabledNotifications?: {
    notifyOnNewOrder?: boolean;
    notifyOnPreparing?: boolean;
    notifyOnReady?: boolean;
    notifyOnCompleted?: boolean;
    notifyOnCancelled?: boolean;
    notifyOnReservation?: boolean;
  };
}

type TemplateType = 'newOrder' | 'preparing' | 'ready' | 'readyPickup' | 'completed' | 'cancelled' | 'reservation';

const TEMPLATE_CONFIG: Record<TemplateType, { 
  label: string; 
  icon: React.ReactNode; 
  color: string;
  bgColor: string;
  iconBg: string;
  description: string;
}> = {
  newOrder: { 
    label: 'Novo Pedido', 
    icon: <ShoppingBag className="h-4 w-4" />, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100 dark:bg-blue-500/15',
    description: 'Enviada quando um novo pedido é recebido'
  },
  preparing: { 
    label: 'Preparando', 
    icon: <ChefHat className="h-4 w-4" />, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    iconBg: 'bg-orange-100 dark:bg-orange-500/15',
    description: 'Enviada quando o pedido começa a ser preparado'
  },
  ready: { 
    label: 'Pronto (Delivery)', 
    icon: <CheckCircle className="h-4 w-4" />, 
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    iconBg: 'bg-green-100 dark:bg-green-500/15',
    description: 'Enviada quando o pedido delivery está pronto'
  },
  readyPickup: { 
    label: 'Pronto (Retirada/Local)', 
    icon: <CheckCircle className="h-4 w-4" />, 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/15',
    description: 'Enviada quando o pedido para retirada ou consumo no local está pronto'
  },
  completed: { 
    label: 'Finalizado', 
    icon: <Package className="h-4 w-4" />, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    iconBg: 'bg-purple-100 dark:bg-purple-500/15',
    description: 'Enviada quando o pedido é entregue/retirado'
  },
  cancelled: { 
    label: 'Cancelado', 
    icon: <XCircle className="h-4 w-4" />, 
    color: 'text-red-500',
    bgColor: 'bg-red-50 border-red-200',
    iconBg: 'bg-red-100 dark:bg-red-500/15',
    description: 'Enviada quando o pedido é cancelado'
  },
  reservation: {
    label: 'Reserva de Mesa',
    icon: <ShoppingBag className="h-4 w-4" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 border-cyan-200',
    iconBg: 'bg-cyan-100 dark:bg-cyan-500/15',
    description: 'Enviada ao confirmar reserva de mesa'
  },
};

const VARIABLES = [
  { name: '{{customerName}}', label: 'Nome do Cliente', description: 'Insere automaticamente o nome do cliente que fez o pedido' },
  { name: '{{orderNumber}}', label: 'Número do Pedido', description: 'Insere o número identificador do pedido' },
  { name: '{{establishmentName}}', label: 'Nome do Restaurante', description: 'Insere o nome do seu estabelecimento' },
  { name: '{{greeting}}', label: 'Saudação', description: 'Insere automaticamente Bom dia, Boa tarde ou Boa noite conforme o horário' },
  { name: '{{deliveryMessage}}', label: 'Mensagem de Entrega', description: 'Mensagem automática exibida quando o pedido é para entrega (delivery)' },
  { name: '{{pickupMessage}}', label: 'Mensagem de Retirada', description: 'Mensagem automática exibida quando o pedido é para retirada ou consumo no local' },
  { name: '{{cancellationReason}}', label: 'Motivo do Cancelamento', description: 'Insere o motivo informado ao cancelar o pedido' },
  { name: '{{itensPedido}}', label: 'Itens do Pedido', description: 'Insere a lista completa de itens do pedido com quantidades e complementos' },
  { name: '{{totalPagamento}}', label: 'Total do Pedido', description: 'Exibe o valor total do pedido e a forma de pagamento escolhida' },
  { name: '{{deliveryFee}}', label: 'Taxa de Entrega', description: 'Exibe a taxa de entrega do pedido ou entrega grátis quando aplicável' },
  { name: '{{cashbackEarned}}', label: 'Cashback Ganho', description: 'Valor de cashback que o cliente ganhou neste pedido' },
  { name: '{{cashbackTotal}}', label: 'Cashback Acumulado', description: 'Saldo total de cashback acumulado pelo cliente' },
  { name: '{{customerAddress}}', label: 'Endereço do Cliente', description: 'Insere o endereço completo do cliente (Rua, Nº, Bairro, Complemento, Referência)' },
  { name: '{{customerPhone}}', label: 'Telefone do Cliente', description: 'Insere o telefone do cliente no formato (XX) X XXXX-XXXX' },
];

const RESERVATION_VARIABLES = [
  { name: '{{mesa}}', label: 'Número da Mesa', description: 'Insere o número da mesa reservada' },
  { name: '{{cliente}}', label: 'Nome do Cliente', description: 'Insere o nome do cliente que fez a reserva' },
  { name: '{{horario}}', label: 'Horário da Reserva', description: 'Insere o horário agendado para a reserva' },
  { name: '{{pessoas}}', label: 'Quantidade de Pessoas', description: 'Insere a quantidade de pessoas da reserva' },
];

// Função para formatar texto estilo WhatsApp
function formatWhatsAppText(text: string): React.ReactNode {
  // Substitui variáveis por valores de exemplo
  let formattedText = text
    .replace(/\{\{customerName\}\}/g, 'João Silva')
    .replace(/\{\{orderNumber\}\}/g, '#1234')
    .replace(/\{\{establishmentName\}\}/g, 'Restaurante Exemplo')
    .replace(/\{\{greeting\}\}/g, 'Boa tarde')
    .replace(/\{\{deliveryMessage\}\}/g, '\ud83d\udee5 Nosso entregador já está a caminho.')
    .replace(/\{\{pickupMessage\}\}/g, 'Você já pode vir retirar. \ud83d\ude04')
    .replace(/\{\{cancellationReason\}\}/g, 'Item indisponível')
    .replace(/\{\{itensPedido\}\}/g, '\ud83d\udce6 *Itens do pedido:*\n1x Pizza Margherita\n1x Refrigerante')
    .replace(/\{\{totalPagamento\}\}/g, '🧾 Total: R$ 129,00\n💰 Pagamento via: PIX')
    .replace(/\{\{deliveryFee\}\}/g, '🛵 Taxa de entrega: R$ 8,00')
    .replace(/\{\{cashbackEarned\}\}/g, 'Cashback ganho: R$0,15')
    .replace(/\{\{cashbackTotal\}\}/g, 'Cashback acumulado: R$0,35')
    .replace(/\{\{customerAddress\}\}/g, '📌 *Endereço:*\n*Rua:* Lindolfo Veras | N.º 1876\n*Bairro:* Cidade Nova\n*Complemento:* Casa verde\n*Ponto de referência:* Ao lado de casa')
    .replace(/\{\{customerPhone\}\}/g, '📞 Telefone: (88) 9 9929-0000')
    .replace(/\{\{mesa\}\}/g, '5')
    .replace(/\{\{cliente\}\}/g, 'Maria Silva')
    .replace(/\{\{horario\}\}/g, '19:30')
    .replace(/\{\{pessoas\}\}/g, '4');

  // Processa formatação WhatsApp
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  
  // Regex para encontrar texto em negrito (*texto*)
  const boldRegex = /\*([^*]+)\*/g;
  let match;
  
  while ((match = boldRegex.exec(formattedText)) !== null) {
    // Adiciona texto antes do match
    if (match.index > currentIndex) {
      parts.push(formattedText.slice(currentIndex, match.index));
    }
    // Adiciona texto em negrito
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    currentIndex = match.index + match[0].length;
  }
  
  // Adiciona texto restante
  if (currentIndex < formattedText.length) {
    parts.push(formattedText.slice(currentIndex));
  }
  
  return parts.length > 0 ? parts : formattedText;
}

export function TemplatesEditor({
  templateNewOrder,
  setTemplateNewOrder,
  templatePreparing,
  setTemplatePreparing,
  templateReady,
  setTemplateReady,
  templateReadyPickup,
  setTemplateReadyPickup,
  templateCompleted,
  setTemplateCompleted,
  templateCancelled,
  setTemplateCancelled,
  templateReservation,
  setTemplateReservation,
  onSave,
  isSaving,
  defaultTemplates,
  restaurantName,
  restaurantLogo,
  enabledNotifications,
}: TemplatesEditorProps) {
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('newOrder');
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  // Função auxiliar para verificar se um template está visível
  const isTemplateVisible = (type: TemplateType): boolean => {
    if (enabledNotifications) {
      const notifMap: Record<string, boolean | undefined> = {
        newOrder: enabledNotifications.notifyOnNewOrder,
        preparing: enabledNotifications.notifyOnPreparing,
        ready: enabledNotifications.notifyOnReady,
        readyPickup: enabledNotifications.notifyOnReady,
        completed: enabledNotifications.notifyOnCompleted,
        cancelled: enabledNotifications.notifyOnCancelled,
        reservation: enabledNotifications.notifyOnReservation,
      };
      if (notifMap[type] === false) return false;
    }
    return true;
  };

  // Se o template ativo foi desativado, mudar para o primeiro template visível
  const visibleTypes = (Object.keys(TEMPLATE_CONFIG) as TemplateType[]).filter(isTemplateVisible);
  if (!visibleTypes.includes(activeTemplate) && visibleTypes.length > 0) {
    // Usar setTimeout para evitar setState durante render
    setTimeout(() => setActiveTemplate(visibleTypes[0]), 0);
  }

  const baseTemplates: Partial<Record<TemplateType, { value: string; setter: (v: string) => void; default: string }>> = {
    newOrder: { value: templateNewOrder, setter: setTemplateNewOrder, default: defaultTemplates.newOrder },
    preparing: { value: templatePreparing, setter: setTemplatePreparing, default: defaultTemplates.preparing },
    ready: { value: templateReady, setter: setTemplateReady, default: defaultTemplates.ready },
    readyPickup: { value: templateReadyPickup, setter: setTemplateReadyPickup, default: defaultTemplates.readyPickup },
    completed: { value: templateCompleted, setter: setTemplateCompleted, default: defaultTemplates.completed },
    cancelled: { value: templateCancelled, setter: setTemplateCancelled, default: defaultTemplates.cancelled },
  };
  if (templateReservation !== undefined && setTemplateReservation && defaultTemplates.reservation) {
    baseTemplates.reservation = { value: templateReservation, setter: setTemplateReservation, default: defaultTemplates.reservation };
  }
  const templates = baseTemplates as Record<TemplateType, { value: string; setter: (v: string) => void; default: string }>;

  const currentTemplate = templates[activeTemplate];
  const config = TEMPLATE_CONFIG[activeTemplate];

  const handleInsertVariable = (variable: string) => {
    currentTemplate.setter(currentTemplate.value + variable);
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const handleResetTemplate = () => {
    currentTemplate.setter(currentTemplate.default);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Coluna esquerda - 40% - Seleção de template + Variáveis */}
      <div className="w-full lg:w-[40%] lg:sticky lg:top-4 shrink-0 space-y-5 self-start">
        {/* Seleção de Template */}
        <SectionCard 
          title="Selecionar Template" 
          description="Escolha o tipo de mensagem para editar"
          icon={<FileText className="h-5 w-5 text-primary dark:text-primary" />}
          iconBg="bg-primary/10 dark:bg-primary/15"
          actions={
            <Button 
              onClick={onSave}
              disabled={isSaving}
              size="sm"
              className="bg-red-500 hover:bg-red-500"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : null}
              Salvar
            </Button>
          }
        >
          <div className="space-y-1.5">
            {(Object.keys(TEMPLATE_CONFIG) as TemplateType[]).filter((type) => {
              if (!isTemplateVisible(type)) return false;
              if (type === 'reservation' && !templates.reservation) return false;
              return true;
            }).map((type) => {
              const cfg = TEMPLATE_CONFIG[type];
              const isActive = activeTemplate === type;
              return (
                <button
                  key={type}
                  onClick={() => setActiveTemplate(type)}
                  className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary/10 border border-primary/30' 
                      : 'bg-muted/30 border border-border/30 hover:bg-muted/60'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${cfg.iconBg}`}>
                    <span className={cfg.color}>{cfg.icon}</span>
                  </div>
                  <div className="text-left">
                    <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {cfg.label}
                    </span>
                    <p className="text-[10px] text-muted-foreground">{cfg.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Variáveis Disponíveis */}
        <SectionCard 
          title="Variáveis disponíveis" 
          description="Clique para inserir no template"
          icon={<Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-100 dark:bg-blue-500/15"
        >
          <div className="flex flex-wrap gap-2">
            {(activeTemplate === 'reservation' ? RESERVATION_VARIABLES : VARIABLES).map((v) => (
              <div key={v.name} className="relative group">
                <button
                  onClick={() => handleInsertVariable(v.name)}
                  className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    copiedVar === v.name
                      ? 'bg-green-500 text-white scale-95'
                      : 'bg-muted text-muted-foreground hover:bg-blue-500 hover:text-white hover:shadow-md'
                  }`}
                >
                  <span className="text-xs">{v.label}</span>
                  {copiedVar === v.name && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap z-20">
                      Inserido!
                    </span>
                  )}
                </button>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-[9999] pointer-events-none">
                  <div className="bg-foreground text-background text-sm px-4 py-2.5 rounded-lg shadow-lg w-72 text-center whitespace-normal">
                    <div className="font-semibold mb-0.5">{v.label}</div>
                    <div className="opacity-80">{v.description}</div>
                    <div className="mt-1 font-mono text-[10px] opacity-60">{v.name}</div>
                  </div>
                  <div className="w-2 h-2 bg-foreground rotate-45 -mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Coluna direita - 60% - Editor + Preview */}
      <div className="w-full lg:flex-1 space-y-5">
        {/* Editor de Texto */}
        <SectionCard 
          title={config.label} 
          description={config.description}
          icon={<span className={config.color}>{config.icon}</span>}
          iconBg={config.iconBg}
          actions={
            <button
              onClick={handleResetTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar
            </button>
          }
        >
          <div className="space-y-3">
            <Textarea
              value={currentTemplate.value}
              onChange={(e) => currentTemplate.setter(e.target.value)}
              rows={12}
              className="font-mono text-sm resize-none border-border rounded-xl focus:border-blue-400 focus:ring-blue-400 bg-muted/50"
              placeholder="Digite sua mensagem aqui..."
            />
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-muted-foreground">
                Use <code className="bg-muted px-1.5 py-0.5 rounded text-muted-foreground">*texto*</code> para <strong>negrito</strong>
              </span>
              <span className={`text-xs font-semibold ${
                currentTemplate.value.length > 900 
                  ? currentTemplate.value.length > 1000 
                    ? 'text-red-500' 
                    : 'text-orange-500'
                  : 'text-muted-foreground'
              }`}>
                {currentTemplate.value.length} / 1024
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Preview WhatsApp */}
        <SectionCard 
          title="Preview da Mensagem" 
          description="Visualize como a mensagem aparecerá no WhatsApp"
          icon={<MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
          iconBg="bg-green-100 dark:bg-green-500/15"
          noPadding
        >
          <div className="overflow-hidden rounded-b-xl">
            {/* Header do WhatsApp */}
            <div className="bg-[#008069] px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {restaurantLogo ? (
                    <img loading="lazy" 
                      src={restaurantLogo} 
                      alt={restaurantName || 'Restaurante'} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center overflow-hidden">
                      <span className="text-white font-bold text-sm">
                        {restaurantName ? restaurantName.charAt(0).toUpperCase() : 'R'}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-white font-semibold text-sm">{restaurantName || 'Seu Restaurante'}</p>
                    <p className="text-emerald-200 text-xs">online</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Video className="h-5 w-5 text-white/80" />
                  <Phone className="h-5 w-5 text-white/80" />
                  <MoreVertical className="h-5 w-5 text-white/80" />
                </div>
              </div>
            </div>
            
            {/* Área de Chat */}
            <div 
              className="p-4 min-h-[350px] relative"
              style={{
                backgroundColor: '#ECE5DD',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d4cfc4' fill-opacity='0.3' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              }}
            >
              {/* Data do dia */}
              <div className="flex justify-center mb-4">
                <span className="bg-card/90 text-muted-foreground text-[11px] font-medium px-3 py-1 rounded-lg shadow-sm">
                  HOJE
                </span>
              </div>
              
              {/* Bolha de mensagem RECEBIDA */}
              <div className="flex justify-start">
                <div className="max-w-[85%] relative">
                  <div className="bg-card rounded-lg rounded-tl-sm p-3 shadow-sm relative">
                    <div 
                      className="absolute -left-2 top-0 w-0 h-0"
                      style={{
                        borderRight: '8px solid white',
                        borderBottom: '8px solid transparent',
                      }}
                    />
                    
                    <div className="text-[14px] text-foreground whitespace-pre-wrap break-words leading-relaxed pr-12">
                      {formatWhatsAppText(currentTemplate.value) || (
                        <span className="text-muted-foreground italic">Sua mensagem aparecerá aqui...</span>
                      )}
                    </div>
                    
                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
                      <span className="text-[11px] text-muted-foreground">{getCurrentTime()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer do WhatsApp */}
            <div className="bg-muted/80 px-3 py-2 flex items-center gap-2">
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <Smile className="h-6 w-6 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <Paperclip className="h-6 w-6 text-muted-foreground" />
              </button>
              <div className="flex-1 bg-card rounded-full px-4 py-2.5 text-sm text-muted-foreground">
                Digite uma mensagem
              </div>
              <button className="w-10 h-10 rounded-full bg-[#008069] flex items-center justify-center hover:bg-[#017561] transition-colors">
                <Mic className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
