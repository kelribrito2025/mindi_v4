import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChefHat, Package, CheckCircle, Info, Send, Video, Phone, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type OrderStatus = "pending_confirmation" | "new" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";

interface StatusOnboardingModalState {
  open: boolean;
  statusType: 'preparing' | 'ready' | 'completed' | null;
  orderId: number | null;
  dontShowAgain: boolean;
}

interface StatusOnboardingModalProps {
  modal: StatusOnboardingModalState;
  setModal: (val: StatusOnboardingModalState) => void;
  establishment: any;
  whatsappConfig: any;
  allOrders: any[];
  onConfirm: () => void;
  onDismissAndExecute: (statusType: 'preparing' | 'ready' | 'completed', orderId: number) => void;
}

export function StatusOnboardingModal({
  modal,
  setModal,
  establishment,
  whatsappConfig,
  allOrders,
  onConfirm,
  onDismissAndExecute,
}: StatusOnboardingModalProps) {
  return (
    <Dialog
      open={modal.open}
      onOpenChange={(open) => {
        if (!open) {
          setModal({ open: false, statusType: null, orderId: null, dontShowAgain: false });
        }
      }}
    >
      <DialogContent
        className={cn(
          "sm:max-w-[440px] p-0 overflow-hidden border-t-4",
          modal.statusType === 'preparing' && 'border-t-red-500',
          modal.statusType === 'ready' && 'border-t-emerald-500',
          modal.statusType === 'completed' && 'border-t-muted-foreground/50',
        )}
        style={{ borderRadius: '16px' }}
      >
        {modal.statusType && (() => {
          // Buscar o pedido para saber o tipo (delivery/pickup/dine_in)
          const currentOrder = allOrders.find((o: any) => o.id === modal.orderId);
          const isPickupOrDineIn = currentOrder?.deliveryType === 'pickup' || currentOrder?.deliveryType === 'dine_in';

          // Templates padrão (fallback)
          const defaultTemplates = {
            preparing: '👨‍🍳 *{{customerName}},* seu pedido *{{orderNumber}}* está sendo preparado!',
            ready: '✅ Seu pedido *{{orderNumber}}* está pronto!\n\n{{deliveryMessage}}',
            readyPickup: '✅ Seu pedido *{{orderNumber}}* está pronto!\n\n{{pickupMessage}}',
            completed: 'Seu pedido {{orderNumber}} foi finalizado!\n\n📌 Atualização de fidelidade\n\n*+1 carimbo* adicionado ao seu cartão.\n\n❤️ Obrigado pela preferência!\n\n*{{establishmentName}}*',
          };
          // Obter template real salvo ou usar padrão
          const getTemplateForStatus = (statusType: string): string => {
            if (statusType === 'preparing') {
              return (whatsappConfig as any)?.templatePreparing || defaultTemplates.preparing;
            }
            if (statusType === 'ready') {
              if (isPickupOrDineIn) {
                return (whatsappConfig as any)?.templateReadyPickup || defaultTemplates.readyPickup;
              }
              return (whatsappConfig as any)?.templateReady || defaultTemplates.ready;
            }
            if (statusType === 'completed') {
              return (whatsappConfig as any)?.templateCompleted || defaultTemplates.completed;
            }
            return '';
          };
          // Substituir variáveis do template por valores de exemplo
          const resolveTemplate = (template: string): string => {
            let resolved = template
              .replace(/\{\{customerName\}\}/g, 'João Silva')
              .replace(/\{\{orderNumber\}\}/g, '#1234')
              .replace(/\{\{establishmentName\}\}/g, establishment?.name || 'Restaurante')
              .replace(/\{\{greeting\}\}/g, 'Boa tarde')
              .replace(/\{\{deliveryMessage\}\}/g, '🛵 Nosso entregador já está a caminho.')
              .replace(/\{\{pickupMessage\}\}/g, 'Você já pode vir retirar. 😄')
              .replace(/\{\{cancellationReason\}\}/g, 'Item indisponível')
              .replace(/\{\{itensPedido\}\}/g, '• 1x Pizza Margherita\n• 1x Refrigerante')
              .replace(/\{\{totalPagamento\}\}/g, '🧾 Total: R$ 129,00\n💰 Pagamento via: PIX');
            // Cashback: só substituir por valores de exemplo se cashback estiver ativo
            const isCashbackActive = (establishment as any)?.cashbackEnabled === true || (establishment as any)?.rewardProgramType === 'cashback';
            if (isCashbackActive) {
              resolved = resolved
                .replace(/\{\{cashbackEarned\}\}/g, 'Cashback ganho: R$0,15')
                .replace(/\{\{cashbackTotal\}\}/g, 'Cashback acumulado: R$0,35');
            }
            // Remover linhas que contêm variáveis não resolvidas (ex: {{algo}}) - inclui cashback quando não ativo
            resolved = resolved.split('\n').filter(line => !/\{\{[^}]+\}\}/.test(line)).join('\n');
            // Limpar linhas vazias consecutivas (máx 2)
            resolved = resolved.replace(/\n{3,}/g, '\n\n');
            return resolved.trim();
          };
          const rawTemplate = getTemplateForStatus(modal.statusType!);
          const resolvedMessage = resolveTemplate(rawTemplate);
          const modalConfig = {
            preparing: {
              borderClass: 'border-t-4 border-t-red-500',
              iconBg: 'bg-red-100 dark:bg-red-950/50',
              iconColor: 'text-red-500',
              icon: ChefHat,
              title: 'Pedido em preparo',
              description: 'Ao aceitar, o cliente será avisado via WhatsApp que o pedido está em preparo.',
              messagePreview: resolvedMessage,
              buttonLabel: 'Entendi, aceitar pedido',
            },
            ready: {
              borderClass: 'border-t-4 border-t-emerald-500',
              iconBg: 'bg-emerald-100 dark:bg-emerald-950/50',
              iconColor: 'text-emerald-600',
              icon: Package,
              title: 'Pedido pronto',
              description: isPickupOrDineIn
                ? 'Ao marcar como pronto, o cliente será avisado via WhatsApp que o pedido está pronto para retirada.'
                : 'Ao marcar como pronto, o cliente será avisado via WhatsApp que o pedido está pronto.',
              messagePreview: resolvedMessage,
              buttonLabel: 'Entendi, marcar como pronto',
            },
            completed: {
              borderClass: 'border-t-4 border-t-muted-foreground/50',
              iconBg: 'bg-gray-100 dark:bg-gray-800',
              iconColor: 'text-gray-600',
              icon: CheckCircle,
              title: 'Pedido finalizado',
              description: 'Ao finalizar, o cliente será avisado via WhatsApp que o pedido foi concluído.',
              messagePreview: resolvedMessage,
              buttonLabel: 'Entendi, finalizar pedido',
            },
          };
          const cfg = modalConfig[modal.statusType!];
          const IconComponent = cfg.icon;
          const restaurantName = establishment?.name || 'Seu Estabelecimento';
          const restaurantLogo = establishment?.logo;
          // Formatar texto estilo WhatsApp (negrito com *texto*)
          const formatWAText = (text: string): React.ReactNode => {
            const parts: React.ReactNode[] = [];
            let currentIdx = 0;
            const boldRegex = /\*([^*]+)\*/g;
            let m;
            while ((m = boldRegex.exec(text)) !== null) {
              if (m.index > currentIdx) {
                parts.push(text.slice(currentIdx, m.index));
              }
              parts.push(<strong key={m.index}>{m[1]}</strong>);
              currentIdx = m.index + m[0].length;
            }
            if (currentIdx < text.length) {
              parts.push(text.slice(currentIdx));
            }
            return parts.length > 0 ? parts : text;
          };
          return (
            <>
              <DialogTitle className="sr-only">{cfg.title}</DialogTitle>
              <div className="px-6 pt-5 pb-6">
                {/* Header com ícone */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={cn("p-2.5 rounded-xl flex-shrink-0", cfg.iconBg)}>
                    <IconComponent className={cn("h-6 w-6", cfg.iconColor)} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{cfg.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {cfg.description}
                    </p>
                  </div>
                </div>
                {/* Preview WhatsApp - Estilo idêntico ao /configuracoes templates */}
                <div className="rounded-xl overflow-hidden border border-border shadow-sm mb-5">
                  {/* Header do WhatsApp - com foto, nome e "online" */}
                  <div className="bg-[#008069] px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {restaurantLogo ? (
                          <img loading="lazy"
                            src={restaurantLogo}
                            alt={restaurantName}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center overflow-hidden">
                            <span className="text-white font-bold text-sm">
                              {restaurantName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-white font-semibold text-sm">{restaurantName}</p>
                          <p className="text-emerald-200 text-xs">online</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Video className="h-4 w-4 text-white/80" />
                        <Phone className="h-4 w-4 text-white/80" />
                        <MoreVertical className="h-4 w-4 text-white/80" />
                      </div>
                    </div>
                  </div>
                  {/* Área de Chat - Background WhatsApp */}
                  <div
                    className="px-3 py-3 relative"
                    style={{
                      backgroundColor: '#ECE5DD',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%23d4cfc4' fill-opacity='0.3' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                    }}
                  >
                    {/* Badge HOJE */}
                    <div className="flex justify-center mb-3">
                      <span className="bg-white/90 text-gray-500 text-[10px] font-medium px-2.5 py-0.5 rounded-md shadow-sm">
                        HOJE
                      </span>
                    </div>
                    {/* Bolha de mensagem recebida */}
                    <div className="flex justify-start">
                      <div className="max-w-[88%] relative">
                        <div className="bg-white rounded-lg rounded-tl-sm px-3 py-2 shadow-sm relative">
                          {/* Triângulo da bolha */}
                          <div
                            className="absolute -left-2 top-0 w-0 h-0"
                            style={{
                              borderRight: '8px solid white',
                              borderBottom: '8px solid transparent',
                            }}
                          />
                          {/* Conteúdo da mensagem */}
                          <div className="text-[13px] text-gray-800 whitespace-pre-wrap break-words leading-relaxed pr-10">
                            {formatWAText(cfg.messagePreview)}
                          </div>
                          {/* Horário */}
                          <div className="absolute bottom-1.5 right-2 flex items-center">
                            <span className="text-[10px] text-gray-400">
                              {format(new Date(), 'HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Info box */}
                <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2.5 mb-5">
                  <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    Você pode personalizar as mensagens em <strong>Configurações → Whatsapp → Templates</strong>.
                  </p>
                </div>
                {/* Botão "Não mostrar novamente" - estilo vazado/outline */}
                <Button
                  variant="outline"
                  className="w-full rounded-xl h-10 font-medium mb-2.5 border-border text-muted-foreground hover:bg-muted/50"
                  onClick={() => {
                    const { statusType, orderId } = modal;
                    if (statusType && orderId) {
                      onDismissAndExecute(statusType, orderId);
                    }
                  }}
                >
                  Não mostrar este aviso novamente
                </Button>
                {/* Botão de confirmação principal */}
                <Button
                  className={cn(
                    "w-full rounded-xl h-10 font-semibold",
                    modal.statusType === 'preparing' && 'bg-red-500 hover:bg-red-500 text-white',
                    modal.statusType === 'ready' && 'bg-emerald-500 hover:bg-emerald-600 text-white',
                    modal.statusType === 'completed' && 'bg-gray-500 hover:bg-gray-600 text-white',
                  )}
                  onClick={onConfirm}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {cfg.buttonLabel}
                </Button>
              </div>
            </>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
