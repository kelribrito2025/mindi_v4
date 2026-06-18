import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Printer, Wifi, WifiOff, Bell, BellOff, CheckCircle, XCircle, Clock, Volume2, VolumeX, Settings, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';

interface PrintJob {
  id: number;
  orderId: number;
  status: string;
  createdAt: string | Date;
}

export default function PrinterApp() {
  const { user, loading: authLoading } = useAuth();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(5); // segundos
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoOpen, setAutoOpen] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [printedJobs, setPrintedJobs] = useState<Set<number>>(new Set());
  const [recentJobs, setRecentJobs] = useState<PrintJob[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('disconnected');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Buscar estabelecimento do usuário
  const { data: establishment } = trpc.establishment.get.useQuery(undefined, {
    enabled: !!user,
  });

  // Query para buscar pedidos pendentes
  const pendingQuery = trpc.printer.queue.pending.useQuery(
    { establishmentId: establishmentId! },
    { enabled: false }
  );

  // Mutation para marcar como impresso
  const markPrintedMutation = trpc.printer.queue.markPrinted.useMutation();

  // Inicializar áudio
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQwAQa/l7JNlFgBGqNvqm2wdAEWn2OmdbB4ARKbX6J5tHwBEptfon20fAESm1+ifbR8ARKbX6J9tHwBEptfon20fAESm1+ifbR8ARKbX6J9tHwBEptfon20fAESm1+ifbR8ARKbX6J9tHwBEptfon20fAESm1+ifbR8ARKbX6J9tHwBEptfon20fAESm1+ifbR8ARKbX6J9tHwBEptfon20fAA==');
    
    // Carregar configurações salvas
    const savedPolling = localStorage.getItem('printerApp_isPolling');
    const savedInterval = localStorage.getItem('printerApp_interval');
    const savedSound = localStorage.getItem('printerApp_sound');
    const savedAutoOpen = localStorage.getItem('printerApp_autoOpen');
    const savedEstablishment = localStorage.getItem('printerApp_establishmentId');
    const savedPrintedJobs = localStorage.getItem('printerApp_printedJobs');
    
    if (savedInterval) setPollingInterval(parseInt(savedInterval));
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');
    if (savedAutoOpen !== null) setAutoOpen(savedAutoOpen === 'true');
    if (savedEstablishment) setEstablishmentId(parseInt(savedEstablishment));
    if (savedPrintedJobs) {
      try {
        const jobs = JSON.parse(savedPrintedJobs);
        setPrintedJobs(new Set(jobs));
      } catch (e) {}
    }
    if (savedPolling === 'true' && savedEstablishment) {
      setIsPolling(true);
    }
  }, []);

  // Salvar configurações
  useEffect(() => {
    localStorage.setItem('printerApp_isPolling', String(isPolling));
    localStorage.setItem('printerApp_interval', String(pollingInterval));
    localStorage.setItem('printerApp_sound', String(soundEnabled));
    localStorage.setItem('printerApp_autoOpen', String(autoOpen));
    if (establishmentId) {
      localStorage.setItem('printerApp_establishmentId', String(establishmentId));
    }
  }, [isPolling, pollingInterval, soundEnabled, autoOpen, establishmentId]);

  // Salvar jobs impressos
  useEffect(() => {
    localStorage.setItem('printerApp_printedJobs', JSON.stringify(Array.from(printedJobs)));
  }, [printedJobs]);

  // Função para tocar som de notificação
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

  // Função para abrir impressão via app ESC POS
  const openPrintLink = useCallback((orderId: number) => {
    const baseUrl = window.location.origin;
    const receiptUrl = `${baseUrl}/api/print/receipt/${orderId}`;
    // Usar o formato correto do app ESC POS Wifi Print Service
    const printUrl = `print://escpos.org/escpos/net/print?srcTp=uri&srcObj=html&numCopies=1&src='${encodeURIComponent(receiptUrl)}'`;
    
    console.log('[PrinterApp] Abrindo link de impressão:', printUrl);
    
    // Usar window.location.href para abrir o app ESC POS
    // Isso é o mesmo método usado na página de Pedidos que funciona
    window.location.href = printUrl;
  }, []);

  // Função de polling
  // Usar ref para printedJobs para evitar re-renders infinitos
  const printedJobsRef = useRef(printedJobs);
  printedJobsRef.current = printedJobs;
  
  const autoOpenRef = useRef(autoOpen);
  autoOpenRef.current = autoOpen;

  const checkForNewJobs = useCallback(async () => {
    if (!establishmentId) return;
    
    setConnectionStatus('checking');
    
    try {
      const result = await pendingQuery.refetch();
      setLastCheck(new Date());
      setConnectionStatus('connected');
      
      if (result.data && result.data.length > 0) {
        const newJobs = result.data.filter(job => !printedJobsRef.current.has(job.id));
        
        if (newJobs.length > 0) {
          console.log('[PrinterApp] Novos jobs encontrados:', newJobs.length);
          
          // Tocar som
          playNotificationSound();
          
          // Atualizar lista de jobs recentes (evitar duplicatas)
          setRecentJobs(prev => {
            const existingIds = new Set(prev.map(j => j.id));
            const uniqueNewJobs = newJobs.filter(j => !existingIds.has(j.id));
            return [...uniqueNewJobs, ...prev].slice(0, 20);
          });
          
          // Processar cada job
          for (const job of newJobs) {
            // NÃO marcar como impresso automaticamente
            // O usuário deve clicar no botão para confirmar a impressão
            
            // Tentar abrir link de impressão automaticamente (pode não funcionar no Android)
            if (autoOpenRef.current) {
              openPrintLink(job.orderId);
              // Não marcar como impresso aqui - o usuário deve confirmar
            }
            
            toast.success(`Novo pedido #${job.orderId} - Clique em IMPRIMIR AGORA!`, {
              duration: 10000,
            });
          }
        }
      }
    } catch (error) {
      console.error('[PrinterApp] Erro no polling:', error);
      setConnectionStatus('disconnected');
    }
  }, [establishmentId, pendingQuery, playNotificationSound, openPrintLink, markPrintedMutation]);

  // Gerenciar polling
  useEffect(() => {
    if (isPolling && establishmentId) {
      // Verificar imediatamente
      checkForNewJobs();
      
      // Configurar intervalo
      pollingRef.current = setInterval(checkForNewJobs, pollingInterval * 1000);
      
      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      setConnectionStatus('disconnected');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPolling, establishmentId, pollingInterval]);

  // Selecionar estabelecimento automaticamente
  useEffect(() => {
    if (establishment && !establishmentId) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment, establishmentId]);

  // Função para imprimir manualmente um job
  const handleManualPrint = async (job: PrintJob) => {
    openPrintLink(job.orderId);
    try {
      await markPrintedMutation.mutateAsync({ jobId: job.id });
      setPrintedJobs(prev => new Set(Array.from(prev).concat(job.id)));
      toast.success('Pedido enviado para impressão!');
    } catch (e) {
      toast.error('Erro ao marcar como impresso');
    }
  };

  // Limpar histórico de jobs impressos
  const clearPrintedJobs = () => {
    setPrintedJobs(new Set());
    setRecentJobs([]);
    localStorage.removeItem('printerApp_printedJobs');
    toast.success('Histórico limpo!');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Printer className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <CardTitle>App de Impressão</CardTitle>
            <CardDescription>
              Faça login para usar o app de impressão automática
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-red-500 hover:bg-red-500"
              onClick={() => window.location.href = '/'}
            >
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted p-4 pb-24">
      {/* Header */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 p-2 rounded-lg">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Impressão Automática</h1>
              <p className="text-sm text-muted-foreground">Cardápio Admin</p>
            </div>
          </div>
          <Badge 
            variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'checking' ? 'secondary' : 'destructive'}
            className="flex items-center gap-1"
          >
            {connectionStatus === 'connected' ? (
              <><Wifi className="w-3 h-3" /> Online</>
            ) : connectionStatus === 'checking' ? (
              <><Clock className="w-3 h-3 animate-spin" /> Verificando</>
            ) : (
              <><WifiOff className="w-3 h-3" /> Offline</>
            )}
          </Badge>
        </div>
      </div>

      {/* Seleção de Estabelecimento */}
      <Card className="max-w-md mx-auto mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Estabelecimento</CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={establishmentId?.toString() || ''} 
            onValueChange={(v) => setEstablishmentId(parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estabelecimento" />
            </SelectTrigger>
            <SelectContent>
              {establishment && (
                <SelectItem key={establishment.id} value={establishment.id.toString()}>
                  {establishment.name}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Controle Principal */}
      <Card className="max-w-md mx-auto mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {isPolling ? (
                <div className="relative">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-ping absolute"></div>
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                </div>
              ) : (
                <div className="w-4 h-4 bg-muted-foreground/30 rounded-full"></div>
              )}
              <div>
                <p className="font-medium">{isPolling ? 'Monitorando' : 'Parado'}</p>
                <p className="text-sm text-muted-foreground">
                  {lastCheck ? `Última verificação: ${lastCheck.toLocaleTimeString()}` : 'Aguardando início'}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              variant={isPolling ? 'destructive' : 'default'}
              className={!isPolling ? 'bg-green-500 hover:bg-green-600' : ''}
              onClick={() => setIsPolling(!isPolling)}
              disabled={!establishmentId}
            >
              {isPolling ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              {isPolling ? 'Parar' : 'Iniciar'}
            </Button>
          </div>

          {/* Intervalo de Polling */}
          <div className="space-y-2">
            <Label>Intervalo de verificação</Label>
            <Select 
              value={pollingInterval.toString()} 
              onValueChange={(v) => setPollingInterval(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 segundos</SelectItem>
                <SelectItem value="5">5 segundos</SelectItem>
                <SelectItem value="10">10 segundos</SelectItem>
                <SelectItem value="15">15 segundos</SelectItem>
                <SelectItem value="30">30 segundos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pedidos Pendentes - Botão Grande de Impressão */}
      {(() => {
        const pendingJobs = recentJobs.filter(job => !printedJobs.has(job.id));
        if (pendingJobs.length === 0) return null;
        
        return (
          <Card className="max-w-md mx-auto mb-4 border-2 border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <Bell className="w-8 h-8 text-red-500 mx-auto mb-2 animate-bounce" />
                <p className="text-xl font-bold text-red-500">
                  {pendingJobs.length} pedido(s) aguardando impressão!
                </p>
              </div>
              <div className="space-y-2">
                {pendingJobs.map((job) => (
                  <Button 
                    key={job.id}
                    className="w-full h-14 text-lg bg-red-500 hover:bg-red-500"
                    onClick={() => handleManualPrint(job)}
                  >
                    <Printer className="w-6 h-6 mr-3" />
                    IMPRIMIR PEDIDO #{job.orderId}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Configurações */}
      <Card className="max-w-md mx-auto mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <Label>Som de notificação</Label>
            </div>
            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {autoOpen ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              <Label>Imprimir automaticamente</Label>
            </div>
            <Switch checked={autoOpen} onCheckedChange={setAutoOpen} />
          </div>
        </CardContent>
      </Card>

      {/* Jobs Recentes */}
      <Card className="max-w-md mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Impressões Recentes</CardTitle>
            {recentJobs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearPrintedJobs}>
                Limpar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma impressão recente
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {printedJobs.has(job.id) ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium">Pedido #{job.orderId}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!printedJobs.has(job.id) && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleManualPrint(job)}
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instruções */}
      <div className="max-w-md mx-auto mt-6 text-center text-sm text-muted-foreground">
        <p className="mb-2">
          📱 Para instalar como app: Menu do navegador → "Adicionar à tela inicial"
        </p>
        <p>
          🖨️ Certifique-se de que o app ESC POS está configurado com a impressora
        </p>
      </div>
    </div>
  );
}
