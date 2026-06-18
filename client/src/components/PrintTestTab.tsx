import { useState, useEffect } from "react";
import { compressImage } from "@/lib/imageCompression";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Printer, Save, RotateCcw, Smartphone, Loader2, FileText, Settings, Eye, Type, Plus, Pencil, Trash2, Star, Key, Copy, RefreshCw, Unplug, ScrollText, Volume2, LayoutGrid, Ruler, QrCode, FileCode, SlidersHorizontal, ListChecks } from "lucide-react";
import { SectionCard } from "@/components/shared";
import { SlidingTabs } from "@/components/SlidingTabs";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface PrintTestTabProps {
  establishmentId: number;
  printers?: any[];
  onAddPrinter?: () => void;
  onRefreshPrinters?: () => void;
  onEditPrinter?: (printer: any) => void;
  onDeletePrinter?: (printer: any) => void;
}

export function PrintTestTab({ establishmentId, printers, onAddPrinter, onRefreshPrinters, onEditPrinter, onDeletePrinter }: PrintTestTabProps) {
  // Buscar configurações salvas
  const { data: savedSettings, isLoading: settingsLoading, refetch: refetchSettings } = trpc.printer.getSettings.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );

  // Mutation para salvar configurações
  const saveSettingsMutation = trpc.printer.saveSettings.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      refetchSettings();
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    }
  });

  // Mutation para upload de imagem
  const uploadImageMutation = trpc.upload.image.useMutation();

  // Configurações de fonte
  const [fontSize, setFontSize] = useState(12);
  const [fontWeight, setFontWeight] = useState(500);
  const [titleFontSize, setTitleFontSize] = useState(16);
  const [titleFontWeight, setTitleFontWeight] = useState(700);
  const [itemFontSize, setItemFontSize] = useState(12);
  const [itemFontWeight, setItemFontWeight] = useState(700);
  const [obsFontSize, setObsFontSize] = useState(11);
  const [obsFontWeight, setObsFontWeight] = useState(500);
  
  // Configurações de layout
  const [paperWidth, setPaperWidth] = useState("80mm");
  const [showDividers, setShowDividers] = useState(true);
  const [boxPadding, setBoxPadding] = useState(12);
  
  // Texto personalizado
  const [customText, setCustomText] = useState("");
  
  // Estilo de borda dos itens
  const [itemBorderStyle, setItemBorderStyle] = useState<"rounded" | "dashed">("rounded");
  
  // QR Code para pagamento
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeUploading, setQrCodeUploading] = useState(false);

  // Modo de impressão HTML vs ESC/POS
  const [htmlPrintEnabled, setHtmlPrintEnabled] = useState(true);

  // Bipe ao imprimir
  const [beepOnPrint, setBeepOnPrint] = useState(false);

  // Configurações específicas da Impressão Automática
  const [mindiFontSize, setMindiFontSize] = useState(12);
  const [mindiFontWeight, setMindiFontWeight] = useState(500);
  const [mindiTitleFontSize, setMindiTitleFontSize] = useState(16);
  const [mindiTitleFontWeight, setMindiTitleFontWeight] = useState(700);
  const [mindiItemFontSize, setMindiItemFontSize] = useState(12);
  const [mindiItemFontWeight, setMindiItemFontWeight] = useState(700);
  const [mindiObsFontSize, setMindiObsFontSize] = useState(11);
  const [mindiObsFontWeight, setMindiObsFontWeight] = useState(500);
  const [mindiPaperWidth, setMindiPaperWidth] = useState("80mm");
  const [mindiShowDividers, setMindiShowDividers] = useState(false);
  const [mindiBoxPadding, setMindiBoxPadding] = useState(12);
  const [mindiItemBorderStyle, setMindiItemBorderStyle] = useState<"rounded" | "dashed">("rounded");
  const [mindiShowLogo, setMindiShowLogo] = useState(true);
  const [mindiHeaderMessage, setMindiHeaderMessage] = useState<string | null>(null);
  const [mindiFooterMessage, setMindiFooterMessage] = useState<string | null>(null);
  const [mindiBeepOnPrint, setMindiBeepOnPrint] = useState(false);
  const [mindiHtmlPrintEnabled, setMindiHtmlPrintEnabled] = useState(true);

  // Sub-tab ativa - persistir na URL para manter ao dar F5
  const [activeTab, setActiveTabState] = useState<"layout" | "mindi" | "api">(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'mindi' || tab === 'layout' || tab === 'api') return tab;
    }
    return "layout";
  });
  const setActiveTab = (tab: "layout" | "mindi" | "api") => {
    setActiveTabState(tab);
    // Atualizar URL sem recarregar a página
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', tab);
      const nextUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(window.history.state, '', nextUrl);
    }
  };

  // A aba Impressão Automática é sempre visível (API Key fica dentro dela)
  const hasMindiPrinterApiKey = !!(savedSettings as any)?.printerApiKey;

  // Carregar configurações salvas quando disponíveis
  useEffect(() => {
    if (savedSettings) {
      setFontSize(savedSettings.fontSize || 12);
      setFontWeight(savedSettings.fontWeight || 500);
      setTitleFontSize(savedSettings.titleFontSize || 16);
      setTitleFontWeight(savedSettings.titleFontWeight || 700);
      setItemFontSize(savedSettings.itemFontSize || 12);
      setItemFontWeight(savedSettings.itemFontWeight || 700);
      setObsFontSize(savedSettings.obsFontSize || 11);
      setObsFontWeight(savedSettings.obsFontWeight || 500);
      setPaperWidth(savedSettings.paperWidth || "80mm");
      setShowDividers(savedSettings.showDividers ?? true);
      setBoxPadding((savedSettings as any).boxPadding || 12);
      setShowQrCode(savedSettings.showQrCode ?? false);
      setQrCodeUrl((savedSettings as any).qrCodeUrl || null);
      setItemBorderStyle((savedSettings as any).itemBorderStyle || "rounded");
      setHtmlPrintEnabled((savedSettings as any).htmlPrintEnabled ?? true);
      setBeepOnPrint((savedSettings as any).beepOnPrint ?? false);
      // Automatic printing settings
      setMindiFontSize((savedSettings as any).mindiFontSize || 12);
      setMindiFontWeight((savedSettings as any).mindiFontWeight || 500);
      setMindiTitleFontSize((savedSettings as any).mindiTitleFontSize || 16);
      setMindiTitleFontWeight((savedSettings as any).mindiTitleFontWeight || 700);
      setMindiItemFontSize((savedSettings as any).mindiItemFontSize || 12);
      setMindiItemFontWeight((savedSettings as any).mindiItemFontWeight || 700);
      setMindiObsFontSize((savedSettings as any).mindiObsFontSize || 11);
      setMindiObsFontWeight((savedSettings as any).mindiObsFontWeight || 500);
      setMindiPaperWidth((savedSettings as any).mindiPaperWidth || "80mm");
      setMindiShowDividers((savedSettings as any).mindiShowDividers ?? false);
      setMindiBoxPadding((savedSettings as any).mindiBoxPadding || 12);
      setMindiItemBorderStyle((savedSettings as any).mindiItemBorderStyle || "rounded");
      setMindiShowLogo((savedSettings as any).mindiShowLogo ?? true);
      setMindiHeaderMessage((savedSettings as any).mindiHeaderMessage || null);
      setMindiFooterMessage((savedSettings as any).mindiFooterMessage || null);
      setMindiBeepOnPrint((savedSettings as any).mindiBeepOnPrint ?? false);
      setMindiHtmlPrintEnabled((savedSettings as any).mindiHtmlPrintEnabled ?? true);
    }
  }, [savedSettings]);
  
  // Dados de exemplo para preview
  const sampleOrder = {
    orderNumber: "P999",
    createdAt: new Date().toISOString(),
    deliveryType: "delivery",
    customerName: "João Silva",
    customerPhone: "11999998888",
    address: "Rua das Flores, 123 - Centro",
    addressComplement: "Apto 45",
    neighborhood: "Centro",
    paymentMethod: "PIX",
    items: [
      { 
        name: "X-Burger Especial", 
        quantity: 2, 
        price: 25.90,
        observation: "Sem cebola",
        complements: [
          { name: "Bacon extra", price: 5.00 },
          { name: "Queijo cheddar", price: 3.00 }
        ]
      },
      { 
        name: "Batata Frita Grande", 
        quantity: 1, 
        price: 15.00,
        observation: "",
        complements: []
      },
      { 
        name: "Refrigerante 600ml", 
        quantity: 2, 
        price: 8.00,
        observation: "Bem gelado",
        complements: []
      }
    ],
    subtotal: 90.80,
    deliveryFee: 5.00,
    discount: 0,
    total: 95.80
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resetToDefaults = () => {
    setFontSize(12);
    setFontWeight(500);
    setTitleFontSize(16);
    setTitleFontWeight(700);
    setItemFontSize(12);
    setItemFontWeight(700);
    setObsFontSize(11);
    setObsFontWeight(500);
    setPaperWidth("80mm");
    setShowDividers(true);
    toast.success("Configurações restauradas para o padrão");
  };

  const resetMindiToDefaults = () => {
    setMindiFontSize(12);
    setMindiFontWeight(500);
    setMindiTitleFontSize(16);
    setMindiTitleFontWeight(700);
    setMindiItemFontSize(12);
    setMindiItemFontWeight(700);
    setMindiObsFontSize(11);
    setMindiObsFontWeight(500);
    setMindiPaperWidth("80mm");
    setMindiShowDividers(false);
    setMindiBoxPadding(12);
    setMindiItemBorderStyle("rounded");
    setMindiShowLogo(true);
    setMindiHeaderMessage(null);
    setMindiFooterMessage(null);
    setMindiBeepOnPrint(false);
    setMindiHtmlPrintEnabled(true);
    toast.success("Configurações da Impressão Automática restauradas para o padrão");
  };

  const handleSaveMindiSettings = () => {
    if (!establishmentId) {
      toast.error("Estabelecimento não encontrado");
      return;
    }
    saveSettingsMutation.mutate({
      establishmentId,
      mindiFontSize,
      mindiFontWeight,
      mindiTitleFontSize,
      mindiTitleFontWeight,
      mindiItemFontSize,
      mindiItemFontWeight,
      mindiObsFontSize,
      mindiObsFontWeight,
      mindiPaperWidth: mindiPaperWidth as "58mm" | "80mm",
      mindiShowDividers,
      mindiBoxPadding,
      mindiItemBorderStyle,
      mindiShowLogo,
      mindiHeaderMessage,
      mindiFooterMessage,
      mindiBeepOnPrint,
      mindiHtmlPrintEnabled,
    });
  };

  const handleSaveSettings = () => {
    if (!establishmentId) {
      toast.error("Estabelecimento não encontrado");
      return;
    }

    saveSettingsMutation.mutate({
      establishmentId,
      fontSize,
      fontWeight,
      titleFontSize,
      titleFontWeight,
      itemFontSize,
      itemFontWeight,
      obsFontSize,
      obsFontWeight,
      paperWidth: paperWidth as "58mm" | "80mm",
      showDividers,
      boxPadding,
      showQrCode,
      qrCodeUrl,
      itemBorderStyle,
      htmlPrintEnabled,
      beepOnPrint,
    });
  };

  const handleTestPrint = async () => {
    if (!establishmentId) {
      toast.error("Estabelecimento não encontrado");
      return;
    }
    
    // Primeiro salvar as configurações atuais
    await saveSettingsMutation.mutateAsync({
      establishmentId,
      fontSize,
      fontWeight,
      titleFontSize,
      titleFontWeight,
      itemFontSize,
      itemFontWeight,
      obsFontSize,
      obsFontWeight,
      paperWidth: paperWidth as "58mm" | "80mm",
      showDividers,
      boxPadding,
      showQrCode,
      qrCodeUrl,
      beepOnPrint,
    });
    
    // Usar iframe oculto para imprimir sem abrir nova aba
    const testUrl = `${window.location.origin}/api/print/test/${establishmentId}`;
    
    // Remover iframe anterior se existir
    const existingIframe = document.getElementById('print-test-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }
    
    // Criar iframe oculto
    const iframe = document.createElement('iframe');
    iframe.id = 'print-test-iframe';
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    iframe.src = testUrl;
    
    iframe.onload = () => {
      try {
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Erro ao imprimir:', e);
        toast.error("Erro ao imprimir. Tente novamente.");
      }
    };
    
    document.body.appendChild(iframe);
  };

  const handleTestThermalPrint = async () => {
    if (!establishmentId) {
      toast.error("Estabelecimento não encontrado");
      return;
    }
    
    // Primeiro salvar as configurações atuais
    try {
      await saveSettingsMutation.mutateAsync({
        establishmentId,
        fontSize,
        fontWeight,
        titleFontSize,
        titleFontWeight,
        itemFontSize,
        itemFontWeight,
        obsFontSize,
        obsFontWeight,
        paperWidth: paperWidth as "58mm" | "80mm",
        showDividers,
        showQrCode,
        qrCodeUrl,
        beepOnPrint,
      });
    } catch (e) {
      // Continuar mesmo se falhar o save
    }
    
    // Detectar se é Android
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (!isAndroid) {
      const testUrl = `${window.location.origin}/api/print/test/${establishmentId}`;
      window.open(testUrl, '_blank');
      toast.info("Recibo aberto em nova aba. Para impressão térmica, use um dispositivo Android com o app Multi Printer Network Print Service.");
      return;
    }
    
    try {
      // Buscar deep link do servidor (igual à página de Pedidos)
      const response = await fetch(`${window.location.origin}/api/print/multiprinter-test/${establishmentId}`);
      const data = await response.json();
      
      if (data.success && data.deepLink) {
        // Abrir o deep link para o app Multi Printer
        window.location.href = data.deepLink;
        toast.success(`Enviando para ${data.printers.length} impressora(s)...`);
      } else {
        toast.error(data.error || "Erro ao gerar link de impressão. Verifique se há impressoras configuradas.");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
    }
  };

  const handleTestCustomPrint = async () => {
    if (!establishmentId) {
      toast.error("Estabelecimento não encontrado");
      return;
    }
    
    if (!customText.trim()) {
      toast.error("Digite algum texto para imprimir");
      return;
    }
    
    // Abrir URL de impressão customizada
    const customUrl = `${window.location.origin}/api/print/custom/${establishmentId}?text=${encodeURIComponent(customText)}`;
    
    // Detectar se é Android
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isAndroid) {
      // Usar app-link do ESC POS Wifi Print Service
      const printUrl = `print://escpos.org/escpos/net/print?srcTp=uri&srcObj=html&numCopies=1&src=${encodeURIComponent(customUrl)}`;
      window.location.href = printUrl;
      toast.info("Enviando texto para impressora térmica...");
    } else {
      // Em outros dispositivos, abrir em nova aba
      window.open(customUrl, '_blank');
      toast.info("Texto aberto em nova aba. Para impressão térmica, use um dispositivo Android com o app ESC POS Wifi Print Service.");
    }
  };

  // Gerar HTML do recibo - USA EXATAMENTE O MESMO TEMPLATE DO SERVIDOR (generateReceiptHTML)
  const generateReceiptHTML = () => {
    const is58mm = paperWidth === '58mm';
    const paperWidthValue = is58mm ? '48mm' : '72mm';
    const baseFontSize = `${fontSize}px`;
    const baseFontWeight = fontWeight;
    const headerFontSize = `${titleFontSize}px`;
    const headerFontWeight = titleFontWeight;
    const orderNumberSize = `${titleFontSize + 4}px`;
    const smallFontSize = `${obsFontSize}px`;
    const smallFontWeight = obsFontWeight;
    
    let itemsHTML = '';
    for (const item of sampleOrder.items) {
      const complementsTotal = item.complements.reduce((sum, c) => sum + (c.price || 0), 0);
      const totalItemPrice = (item.quantity * item.price) + (complementsTotal * item.quantity);
      let itemHTML = `
      <div class="item">
        <div class="item-header">
          <span>${item.quantity}x ${item.name}</span>
          <span>${formatCurrency(totalItemPrice)}</span>
        </div>
    `;
      if (item.observation) {
        itemHTML += `<div class="item-obs">Obs: ${item.observation}</div>`;
      }
      for (const comp of item.complements) {
        itemHTML += `<div class="item-complement">↳ ${comp.name}${comp.price > 0 ? ` (${formatCurrency(comp.price)})` : ''}</div>`;
      }
      itemHTML += `</div>`;
      itemsHTML += itemHTML;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=567, initial-scale=1.0">
  <title>Pedido ${sampleOrder.orderNumber}</title>
  <style>
    @page {
      size: ${paperWidthValue} auto;
      margin: 0;
    }
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    body { 
      font-family: 'Arial', 'Helvetica', sans-serif; 
      font-size: ${baseFontSize}; 
      font-weight: ${baseFontWeight};
      line-height: 1.4;
      width: 100%; 
      max-width: 100%;
      padding: 8px;
      background: #fff;
      color: #000;
      -webkit-font-smoothing: antialiased;
    }
    
    .logo {
      text-align: center;
      padding-bottom: 12px;
      margin-bottom: 12px;
      ${showDividers ? 'border-bottom: 1px solid #000;' : ''}
    }
    .logo h1 {
      font-size: ${orderNumberSize};
      font-weight: ${headerFontWeight};
      margin: 0;
    }
    .logo p {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .order-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .order-text {
      display: flex;
      flex-direction: column;
    }
    .order-number {
      font-size: ${orderNumberSize};
      font-weight: ${headerFontWeight};
      margin-bottom: 2px;
    }
    .order-date {
      font-size: ${smallFontSize};
      font-weight: ${headerFontWeight};
      display: inline-flex;
      align-items: center;
    }
    .date-icon {
      width: 14px;
      height: 14px;
      margin-right: 4px;
    }
    .section-icon {
      width: 14px;
      height: 14px;
      margin-right: 4px;
      display: inline;
      vertical-align: middle;
    }
    .delivery-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      font-size: ${smallFontSize};
      font-weight: ${headerFontWeight};
      padding: 6px 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      align-self: center;
    }
    
    .divider { 
      border: none;
      ${showDividers ? 'border-top: 2px dashed #000;' : ''} 
      margin: 10px 0; 
    }
    .divider-double {
      ${showDividers ? 'border-top: 3px double #000;' : ''}
      margin: 12px 0;
    }
    
    .customer { 
      margin: 10px 0; 
      font-size: ${itemFontSize}px;
    }
    .customer-label {
      font-weight: ${baseFontWeight};
    }
    .customer-value {
      display: block;
      margin-left: 0;
      word-wrap: break-word;
      font-weight: ${baseFontWeight};
    }
    .customer-row {
      margin: 6px 0;
    }
    
    .item {
      margin: 8px 0;
      padding: ${itemBorderStyle === 'rounded' ? boxPadding + 'px' : '8px 0'};
      ${itemBorderStyle === 'rounded' ? 'border: 2px solid #000; border-radius: 8px;' : 'border: none; border-top: 1px dashed #000; border-bottom: 1px dashed #000;'}
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-size: ${itemFontSize}px;
      font-weight: ${itemFontWeight};
    }
    .item-obs {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      margin-top: 2px;
      padding-left: 5px;
    }
    .item-complement {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      margin-top: 2px;
      padding-left: 10px;
    }
    
    .totals { 
      margin: 12px 0; 
    }
    .total-row { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      margin: 6px 0; 
      font-size: ${itemFontSize}px;
    }
    .total-final { 
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #000;
      color: #fff;
      font-weight: ${headerFontWeight}; 
      font-size: ${itemFontSize}px; 
      margin-top: 10px;
      padding: 8px 12px;
      text-transform: uppercase;
    }
    
    .section-box {
      border: 2px solid #000;
      border-radius: 8px;
      padding: ${boxPadding}px;
      margin: 12px 0;
    }
    .section-title {
      font-weight: ${headerFontWeight};
      font-size: ${itemFontSize}px;
      margin-bottom: 8px;
    }
    .section-content {
      font-size: ${baseFontSize};
      font-weight: ${baseFontWeight};
      line-height: 1.4;
    }
    .section-inline {
      font-size: ${baseFontSize};
      font-weight: ${baseFontWeight};
      line-height: 1.4;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
    }
    .payment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .payment-badge {
      background: #000;
      color: #fff;
      padding: 4px 10px;
      font-weight: ${headerFontWeight};
      font-size: ${smallFontSize};
    }
    
    .payment {
      margin: 10px 0;
      font-size: ${itemFontSize}px;
    }
    .payment-method {
      font-weight: ${baseFontWeight};
      font-size: ${itemFontSize}px;
    }
    
    .notes { 
      background: #f0f0f0; 
      padding: 8px; 
      margin: 10px 0; 
      font-size: ${smallFontSize};
      border: 2px solid #000;
    }
    .notes-title {
      font-weight: ${baseFontWeight};
      margin-bottom: 4px;
    }
    
    .qrcode-box {
      padding: 12px 0;
      margin: 12px 0;
      text-align: center;
    }
    .qrcode-box .section-title {
      margin-bottom: 8px;
    }
    .qrcode-box img {
      width: 144px;
      height: 144px;
      display: block;
      margin: 0 auto;
    }
    
    .footer { 
      text-align: center; 
      margin-top: 16px; 
      font-size: ${smallFontSize}; 
    }
    .footer-thanks {
      font-weight: ${headerFontWeight};
      font-size: ${itemFontSize}px;
      margin-top: 8px;
    }
    
    @media print {
      body {
        width: ${paperWidthValue};
        padding: 2mm;
      }
    }
  </style>
</head>
<body>
  <div class="logo">
    <h1>Restaurante</h1>
    <p>Sistema de Pedidos</p>
  </div>
  
  <div class="order-info">
    <div class="order-text">
      <div class="order-number">Pedido ${sampleOrder.orderNumber}</div>
      <div class="order-date"><img loading="lazy" src="/calendar-icon.png" class="date-icon" /> ${formatDate(sampleOrder.createdAt)}</div>
    </div>
    <div class="delivery-badge">${sampleOrder.deliveryType === 'delivery' ? 'ENTREGA' : 'RETIRADA'}</div>
  </div>
  
  <hr class="divider">
  
  <div class="items">
    ${itemsHTML}
  </div>
  
  <hr class="divider">
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(sampleOrder.subtotal)}</span>
    </div>
    ${sampleOrder.deliveryFee > 0 ? `
    <div class="total-row">
      <span>Taxa entrega:</span>
      <span>${formatCurrency(sampleOrder.deliveryFee)}</span>
    </div>
    ` : ''}
    ${sampleOrder.discount > 0 ? `
    <div class="total-row">
      <span>Desconto:</span>
      <span>-${formatCurrency(sampleOrder.discount)}</span>
    </div>
    ` : ''}
    <div class="total-row total-final">
      <span>TOTAL:</span>
      <span>${formatCurrency(sampleOrder.total)}</span>
    </div>
  </div>
  
  <hr class="divider">
  
  ${sampleOrder.deliveryType === 'delivery' ? `
  <div class="section-box">
    <div class="section-title">Endereço:</div>
    <div class="section-content">
      ${sampleOrder.address} - ${sampleOrder.neighborhood}
      ${sampleOrder.addressComplement ? '<br>' + sampleOrder.addressComplement : ''}
    </div>
  </div>
  ` : `
  <div class="section-box">
    <div class="section-content"><strong>Retirada:</strong> Cliente irá retirar no estabelecimento</div>
  </div>
  `}
  
  <div class="section-box">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: ${headerFontWeight}; display: inline-flex; align-items: center;"><img loading="lazy" src="/payment-icon.png" class="section-icon" /> Pagamento</span>
      <span style="font-weight: ${headerFontWeight};">${sampleOrder.paymentMethod}</span>
    </div>
  </div>
  
  <div class="section-box">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: ${headerFontWeight}; display: inline-flex; align-items: center;"><img loading="lazy" src="/client-icon.png" style="width: 13px; height: 13px; margin-right: 4px;" /> Cliente</span>
      <span style="font-weight: ${headerFontWeight};">${sampleOrder.customerName} - ${sampleOrder.customerPhone}</span>
    </div>
  </div>
  
  ${showQrCode && qrCodeUrl ? `
  <div class="qrcode-box">
    <div class="section-title">PIX - Escaneie para pagar</div>
    <img loading="lazy" src="${qrCodeUrl}" alt="QR Code PIX" />
  </div>
  ` : ''}
  
  <div class="footer">
    <p>Pedido realizado via www.mindi.com.br</p>
  </div>
</body>
</html>
    `.trim();
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-5">
      {/* Sub-tab selector - styled as sliding pills */}
      <SlidingTabs
        options={[
          { value: 'layout' as const, label: <span className="flex items-center gap-2"><Settings className="h-4 w-4" />Layout e Fontes</span> },
          { value: 'mindi' as const, label: <span className="flex items-center gap-2"><Smartphone className="h-4 w-4" />Impressão Automática</span> },
        ]}
        value={activeTab === 'api' ? 'mindi' : activeTab}
        onChange={setActiveTab}
        className="w-fit bg-muted/50"
      />

      {/* ==================== LAYOUT TAB ==================== */}
      {activeTab === "layout" && (
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Coluna esquerda - 40% - Layout e Opções */}
          <div className="w-full lg:w-[40%] lg:sticky lg:top-4 shrink-0 space-y-5 self-start">
            <SectionCard
              title="Configurações de Layout"
              description="Ajuste o layout e aparência do recibo"
              icon={<LayoutGrid className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
              iconBg="bg-blue-100 dark:bg-blue-500/15"
            >
              <div className="space-y-4">
                {/* Impressão HTML */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-500/15 rounded-lg">
                      <FileCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Impressão HTML</Label>
                      <p className="text-xs text-muted-foreground">Layout mais flexível</p>
                    </div>
                  </div>
                  <Switch checked={htmlPrintEnabled} onCheckedChange={setHtmlPrintEnabled} />
                </div>

                {/* Largura do papel */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-violet-100 dark:bg-violet-500/15 rounded-lg">
                      <Ruler className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Largura do papel</Label>
                      <p className="text-xs text-muted-foreground">Tamanho da bobina</p>
                    </div>
                  </div>
                  <Select value={paperWidth} onValueChange={setPaperWidth}>
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58mm">58mm</SelectItem>
                      <SelectItem value="80mm">80mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Mostrar divisores */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/15 rounded-lg">
                      <SlidersHorizontal className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Divisores</Label>
                      <p className="text-xs text-muted-foreground">Linhas tracejadas</p>
                    </div>
                  </div>
                  <Switch checked={showDividers} onCheckedChange={setShowDividers} />
                </div>

                {/* Bipe ao imprimir */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-amber-100 dark:bg-amber-500/15 rounded-lg">
                      <Volume2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Bipe ao imprimir</Label>
                      <p className="text-xs text-muted-foreground">Som na impressora</p>
                    </div>
                  </div>
                  <Switch checked={beepOnPrint} onCheckedChange={setBeepOnPrint} />
                </div>

                {/* Estilo dos itens */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-pink-100 dark:bg-pink-500/15 rounded-lg">
                      <LayoutGrid className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Estilo dos itens</Label>
                      <p className="text-xs text-muted-foreground">Aparência dos produtos</p>
                    </div>
                  </div>
                  <Select value={itemBorderStyle} onValueChange={(v) => setItemBorderStyle(v as "rounded" | "dashed")}>
                    <SelectTrigger className="w-36 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rounded">Arredondadas</SelectItem>
                      <SelectItem value="dashed">Tracejadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Espaçamento interno */}
                <div className="space-y-2 px-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Espaçamento interno</Label>
                    <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">{boxPadding}px</span>
                  </div>
                  <Slider
                    value={[boxPadding]}
                    onValueChange={(v) => setBoxPadding(v[0])}
                    min={4}
                    max={20}
                    step={2}
                  />
                </div>

                {/* QR Code PIX */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-green-100 dark:bg-green-500/15 rounded-lg">
                      <QrCode className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">QR Code PIX</Label>
                      <p className="text-xs text-muted-foreground">No recibo</p>
                    </div>
                  </div>
                  <Switch checked={showQrCode} onCheckedChange={setShowQrCode} />
                </div>

                {showQrCode && (
                  <div className="p-3 bg-muted/30 rounded-lg border border-border/30 space-y-3">
                    <Label className="text-sm">Imagem do QR Code PIX</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          setQrCodeUploading(true);
                          try {
                            const { base64, mimeType } = await compressImage(file);
                            const result = await uploadImageMutation.mutateAsync({
                              base64,
                              mimeType,
                              singleVersion: true,
                            });
                            setQrCodeUrl(result.url);
                            toast.success("QR Code carregado!");
                          } catch (error) {
                            toast.error("Erro ao carregar imagem");
                          } finally {
                            setQrCodeUploading(false);
                          }
                        }}
                        className="text-sm"
                      />
                      {qrCodeUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    {qrCodeUrl && (
                      <img loading="lazy" src={qrCodeUrl} alt="QR Code PIX" className="w-24 h-24 object-contain border rounded bg-card" />
                    )}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Coluna direita - 60% - Fontes e Ações */}
          <div className="w-full lg:flex-1 space-y-5">
            <SectionCard
              title="Configurações de Fonte"
              description="Ajuste o tamanho e peso das fontes"
              icon={<Type className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
              iconBg="bg-orange-100 dark:bg-orange-500/15"
            >
              <div className="space-y-5">
                {/* Texto geral */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Texto geral</Label>
                    <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">{fontSize}px / peso {fontWeight}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Tamanho</span>
                      <Slider value={[fontSize]} onValueChange={(v) => setFontSize(v[0])} min={8} max={18} step={1} className="mt-2" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Peso</span>
                      <Slider value={[fontWeight]} onValueChange={(v) => setFontWeight(v[0])} min={300} max={900} step={100} className="mt-2" />
                    </div>
                  </div>
                </div>

                {/* Títulos/Pedido */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Títulos/Pedido</Label>
                    <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">{titleFontSize}px / peso {titleFontWeight}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Tamanho</span>
                      <Slider value={[titleFontSize]} onValueChange={(v) => setTitleFontSize(v[0])} min={12} max={24} step={1} className="mt-2" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Peso</span>
                      <Slider value={[titleFontWeight]} onValueChange={(v) => setTitleFontWeight(v[0])} min={300} max={900} step={100} className="mt-2" />
                    </div>
                  </div>
                </div>

                {/* Nome dos itens */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Nome dos itens</Label>
                    <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">{itemFontSize}px / peso {itemFontWeight}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Tamanho</span>
                      <Slider value={[itemFontSize]} onValueChange={(v) => setItemFontSize(v[0])} min={8} max={18} step={1} className="mt-2" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Peso</span>
                      <Slider value={[itemFontWeight]} onValueChange={(v) => setItemFontWeight(v[0])} min={300} max={900} step={100} className="mt-2" />
                    </div>
                  </div>
                </div>

                {/* Observações/Complementos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Observações/Complementos</Label>
                    <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">{obsFontSize}px / peso {obsFontWeight}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Tamanho</span>
                      <Slider value={[obsFontSize]} onValueChange={(v) => setObsFontSize(v[0])} min={8} max={16} step={1} className="mt-2" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Peso</span>
                      <Slider value={[obsFontWeight]} onValueChange={(v) => setObsFontWeight(v[0])} min={300} max={900} step={100} className="mt-2" />
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Botões de ação */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSaveSettings} disabled={saveSettingsMutation.isPending} className="rounded-xl">
                <Save className="h-4 w-4 mr-2" />
                {saveSettingsMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" onClick={resetToDefaults} className="rounded-xl">
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurar Padrão
              </Button>
              <Button variant="outline" onClick={handleTestPrint} className="rounded-xl">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Teste
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== IMPRESSÃO AUTOMÁTICA TAB ==================== */}
      {activeTab === "mindi" && (
        <div className="space-y-5">
          {/* Antes da API Key: só Baixe o app + Integração */}
          {!hasMindiPrinterApiKey && (
            <div className="max-w-lg space-y-5">
              <SectionCard
                title="Baixe o app de impressão"
                description="Instale o app para imprimir pedidos diretamente na sua impressora térmica"
                icon={<Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />}
                iconBg="bg-green-100 dark:bg-green-500/15"
              >
                <div className="flex flex-row gap-2">
                  {/* Botão Android */}
                  <a
                    href="https://play.google.com/store/apps/details?id=br.com.mindi.mindiprinter&hl=pt_BR"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#000000] hover:bg-[#1a1a1a] text-white rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
                      <path fill="#4285F4" d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z" />
                      <path fill="#EA4335" d="M14.499 12.707l2.302 2.302-10.937 6.333 8.635-8.635z" />
                      <path fill="#FBBC04" d="M17.698 9.508l2.302 2.302a1 1 0 0 1 0 1.38l-2.302 2.302L15.396 12l2.302-2.492z" />
                      <path fill="#34A853" d="M5.864 2.658L16.8 9.49l-2.302 2.302-8.635-8.635z" />
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-[10px] leading-tight opacity-80">Disponível no</span>
                      <span className="text-sm font-semibold leading-tight">Google Play</span>
                    </div>
                  </a>
                  {/* Botão Windows */}
                  <a
                    href="https://apps.microsoft.com/detail/9p7m0585pcnm?hl=pt-BR&gl=BR"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current shrink-0">
                      <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-[10px] leading-tight opacity-80">Baixe na</span>
                      <span className="text-sm font-semibold leading-tight">Microsoft Store</span>
                    </div>
                  </a>
                </div>
              </SectionCard>

              {/* Integração com App - gerar API Key */}
              <PrinterApiKeyCard establishmentId={establishmentId} />
            </div>
          )}

          {/* Depois da API Key: layout completo em duas colunas */}
          {hasMindiPrinterApiKey && (
            <div className="flex flex-col lg:flex-row gap-5">
              {/* Coluna esquerda - Baixe o app + Integração + Layout */}
              <div className="w-full lg:w-[40%] shrink-0 space-y-5 self-start">
                <SectionCard
                  title="Baixe o app de impressão"
                  description="Instale o app para imprimir pedidos diretamente na sua impressora térmica"
                  icon={<Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />}
                  iconBg="bg-green-100 dark:bg-green-500/15"
                >
                  <div className="flex flex-row gap-2">
                    {/* Botão Android */}
                    <a
                      href="https://play.google.com/store/apps/details?id=br.com.mindi.mindiprinter&hl=pt_BR"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#000000] hover:bg-[#1a1a1a] text-white rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
                        <path fill="#4285F4" d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z" />
                        <path fill="#EA4335" d="M14.499 12.707l2.302 2.302-10.937 6.333 8.635-8.635z" />
                        <path fill="#FBBC04" d="M17.698 9.508l2.302 2.302a1 1 0 0 1 0 1.38l-2.302 2.302L15.396 12l2.302-2.492z" />
                        <path fill="#34A853" d="M5.864 2.658L16.8 9.49l-2.302 2.302-8.635-8.635z" />
                      </svg>
                      <div className="flex flex-col">
                        <span className="text-[10px] leading-tight opacity-80">Disponível no</span>
                        <span className="text-sm font-semibold leading-tight">Google Play</span>
                      </div>
                    </a>
                    {/* Botão Windows */}
                    <a
                      href="https://apps.microsoft.com/detail/9p7m0585pcnm?hl=pt-BR&gl=BR"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current shrink-0">
                        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
                      </svg>
                      <div className="flex flex-col">
                        <span className="text-[10px] leading-tight opacity-80">Baixe na</span>
                        <span className="text-sm font-semibold leading-tight">Microsoft Store</span>
                      </div>
                    </a>
                  </div>
                </SectionCard>

                {/* Integração com App */}
                <PrinterApiKeyCard establishmentId={establishmentId} />

                {/* Layout da Impressão Automática */}
                <SectionCard
                  title="Layout da Impressão Automática"
                  description="Configurações exclusivas para a Impressão Automática"
                  icon={<Smartphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
                  iconBg="bg-indigo-100 dark:bg-indigo-500/15"
                >
                  <div className="space-y-4">
                    {/* Impressão HTML Mindi */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-500/15 rounded-lg">
                          <FileCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Impressão HTML</Label>
                          <p className="text-xs text-muted-foreground">Layout mais flexível</p>
                        </div>
                      </div>
                      <Switch checked={mindiHtmlPrintEnabled} onCheckedChange={setMindiHtmlPrintEnabled} />
                    </div>
                    {/* Bipe ao imprimir Mindi */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-500/15 rounded-lg">
                          <Volume2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Bipe ao imprimir</Label>
                          <p className="text-xs text-muted-foreground">Som na impressora</p>
                        </div>
                      </div>
                      <Switch checked={mindiBeepOnPrint} onCheckedChange={setMindiBeepOnPrint} />
                    </div>
                    {/* Largura do papel Mindi */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-violet-100 dark:bg-violet-500/15 rounded-lg">
                          <Ruler className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Largura do papel</Label>
                          <p className="text-xs text-muted-foreground">Tamanho da bobina</p>
                        </div>
                      </div>
                      <Select value={mindiPaperWidth} onValueChange={setMindiPaperWidth}>
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="58mm">58mm</SelectItem>
                          <SelectItem value="80mm">80mm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Divisores Mindi */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/15 rounded-lg">
                          <SlidersHorizontal className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Divisores</Label>
                          <p className="text-xs text-muted-foreground">Linhas tracejadas</p>
                        </div>
                      </div>
                      <Switch checked={mindiShowDividers} onCheckedChange={setMindiShowDividers} />
                    </div>
                    {/* Estilo de borda Mindi */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-pink-100 dark:bg-pink-500/15 rounded-lg">
                          <LayoutGrid className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Estilo dos itens</Label>
                          <p className="text-xs text-muted-foreground">Aparência dos produtos</p>
                        </div>
                      </div>
                      <Select value={mindiItemBorderStyle} onValueChange={(v) => setMindiItemBorderStyle(v as "rounded" | "dashed")}>
                        <SelectTrigger className="w-36 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rounded">Arredondadas</SelectItem>
                          <SelectItem value="dashed">Tracejadas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Espaçamento Mindi */}
                    <div className="space-y-2 px-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Espaçamento interno</Label>
                        <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">{mindiBoxPadding}px</span>
                      </div>
                      <Slider value={[mindiBoxPadding]} onValueChange={(v) => setMindiBoxPadding(v[0])} min={4} max={20} step={2} />
                    </div>
                  </div>
                </SectionCard>

                {/* Botões de ação Mindi */}
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSaveMindiSettings} disabled={saveSettingsMutation.isPending} className="rounded-xl">
                    <Save className="h-4 w-4 mr-2" />
                    {saveSettingsMutation.isPending ? "Salvando..." : "Salvar Mindi"}
                  </Button>
                  <Button variant="outline" onClick={resetMindiToDefaults} className="rounded-xl">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restaurar Padrão
                  </Button>
                </div>
              </div>

              {/* Coluna direita - Impressoras Cadastradas + Fontes */}
              <div className="w-full lg:flex-1 space-y-5">
                <SectionCard
                  title="Impressoras Cadastradas"
                  description="Gerencie suas impressoras térmicas"
                  icon={<Printer className="h-5 w-5 text-primary dark:text-primary" />}
                  iconBg="bg-primary/10 dark:bg-primary/15"
                  actions={
                    onRefreshPrinters ? (
                      <Button onClick={onRefreshPrinters} size="sm" variant="outline" className="rounded-xl">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                      </Button>
                    ) : undefined
                  }
                >
                  <div className="space-y-5">
                    {!printers || printers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Printer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma impressora cadastrada</p>
                        <p className="text-sm">Conecte uma impressora pelo app Mindi Printer</p>
                      </div>
                    ) : (
                      printers.map((printer) => (
                        <div
                          key={printer.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              printer.isActive ? "bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"
                            )}>
                              <Printer className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{printer.name}</span>
                                {printer.isDefault && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-lg flex items-center gap-1">
                                    <Star className="h-3 w-3" />
                                    Padrão
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {printer.ipAddress}:{printer.port}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {onEditPrinter && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditPrinter(printer)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {onDeletePrinter && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeletePrinter(printer)}
                                className="text-destructive hover:text-destructive h-8 w-8 p-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </SectionCard>

                {/* Regras de Impressão por Categoria */}
                <CategoryPrinterRules establishmentId={establishmentId} printers={printers || []} />

                {/* Fontes da Impressão Automática */}
                <SectionCard
                  title="Fontes da Impressão Automática"
                  description="Ajuste o tamanho e peso das fontes no Mindi"
                  icon={<Type className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
                  iconBg="bg-orange-100 dark:bg-orange-500/15"
                >
                  <div className="space-y-5">
                    {/* Texto geral Mindi */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Texto geral</Label>
                        <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">{mindiFontSize}px / peso {mindiFontWeight}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground">Tamanho</span>
                          <Slider value={[mindiFontSize]} onValueChange={(v) => setMindiFontSize(v[0])} min={8} max={18} step={1} className="mt-2" />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Peso</span>
                          <Slider value={[mindiFontWeight]} onValueChange={(v) => setMindiFontWeight(v[0])} min={300} max={900} step={100} className="mt-2" />
                        </div>
                      </div>
                    </div>
                    {/* Títulos Mindi */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Títulos/Pedido</Label>
                        <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">{mindiTitleFontSize}px / peso {mindiTitleFontWeight}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground">Tamanho</span>
                          <Slider value={[mindiTitleFontSize]} onValueChange={(v) => setMindiTitleFontSize(v[0])} min={12} max={24} step={1} className="mt-2" />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Peso</span>
                          <Slider value={[mindiTitleFontWeight]} onValueChange={(v) => setMindiTitleFontWeight(v[0])} min={300} max={900} step={100} className="mt-2" />
                        </div>
                      </div>
                    </div>
                    {/* Itens Mindi */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Nome dos itens</Label>
                        <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">{mindiItemFontSize}px / peso {mindiItemFontWeight}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground">Tamanho</span>
                          <Slider value={[mindiItemFontSize]} onValueChange={(v) => setMindiItemFontSize(v[0])} min={8} max={18} step={1} className="mt-2" />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Peso</span>
                          <Slider value={[mindiItemFontWeight]} onValueChange={(v) => setMindiItemFontWeight(v[0])} min={300} max={900} step={100} className="mt-2" />
                        </div>
                      </div>
                    </div>
                    {/* Observações Mindi */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Observações/Complementos</Label>
                        <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">{mindiObsFontSize}px / peso {mindiObsFontWeight}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground">Tamanho</span>
                          <Slider value={[mindiObsFontSize]} onValueChange={(v) => setMindiObsFontSize(v[0])} min={8} max={16} step={1} className="mt-2" />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Peso</span>
                          <Slider value={[mindiObsFontWeight]} onValueChange={(v) => setMindiObsFontWeight(v[0])} min={300} max={900} step={100} className="mt-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          )}
        </div>
      )}

            {/* API tab removida - conteúdo movido para dentro da aba Impressão Automática */}
    </div>
  );
}

// ==================== Printer API Key Card (dentro da aba Impressão Automática) ====================
function PrinterApiKeyCard({ establishmentId }: { establishmentId: number }) {
  const { data: settings, refetch } = trpc.printer.getSettings.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );
  
  const generateMutation = trpc.printer.generateApiKey.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("API Key gerada com sucesso!");
    },
    onError: () => toast.error("Erro ao gerar API Key"),
  });
  
  const revokeMutation = trpc.printer.revokeApiKey.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("API Key revogada");
    },
    onError: () => toast.error("Erro ao revogar API Key"),
  });
  
  const apiKey = (settings as any)?.printerApiKey || null;
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };
  
  return (
    <SectionCard
      title="Integração com App"
      description="Gere a API Key para conectar a Impressão Automática"
      icon={<Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
      iconBg="bg-amber-100 dark:bg-amber-500/15"
    >
      {!apiKey ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-medium">Como conectar:</p>
              <p>1. Clique em "Gerar API Key" abaixo</p>
              <p>2. Copie a chave gerada</p>
              <p>3. No app de impressão Mindi, cole a API Key para conectar</p>
            </div>
          </div>
          <Button
            onClick={() => generateMutation.mutate({ establishmentId })}
            disabled={generateMutation.isPending}
            className="w-full rounded-xl"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Key className="h-4 w-4 mr-2" />
            )}
            Gerar API Key
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* API Key */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">API Key</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-xs font-mono break-all">
                {apiKey}
              </code>
              <Button size="icon" variant="outline" onClick={() => copyToClipboard(apiKey, 'API Key')} className="h-8 w-8 shrink-0">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          {/* Ações */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateMutation.mutate({ establishmentId })}
              disabled={generateMutation.isPending}
              className="rounded-xl flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Tem certeza? O app conectado perderá acesso imediatamente.')) {
                  revokeMutation.mutate({ establishmentId });
                }
              }}
              disabled={revokeMutation.isPending}
              className="rounded-xl flex-1"
            >
              <Unplug className="h-4 w-4 mr-2" />
              Revogar
            </Button>
          </div>

          {/* Instrução de uso */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Gere uma API Key acima e insira no app de impressão Mindi para conectar e imprimir seus pedidos automaticamente.
            </p>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ==================== Category Printer Rules ====================
function CategoryPrinterRules({ establishmentId, printers }: { establishmentId: number; printers: any[] }) {
  const utils = trpc.useUtils();
  const { data: categories, isLoading } = trpc.category.list.useQuery(
    { establishmentId, version: 'published' },
    { enabled: !!establishmentId }
  );

  // Local state for optimistic UI - track categoryIds per printer
  const [localCategoryMap, setLocalCategoryMap] = useState<Record<number, number[]>>({});

  // Sync local state from props when printers change
  useEffect(() => {
    const map: Record<number, number[]> = {};
    for (const printer of printers) {
      if (printer.categoryIds) {
        try { map[printer.id] = JSON.parse(printer.categoryIds); } catch { map[printer.id] = []; }
      } else {
        map[printer.id] = [];
      }
    }
    setLocalCategoryMap(map);
  }, [printers]);

  const updatePrinterMutation = trpc.printer.update.useMutation({
    onSuccess: () => {
      toast.success("Regra de impressão atualizada!");
      utils.printer.list.invalidate();
    },
    onError: (_err: any, variables: any) => {
      toast.error("Erro ao atualizar regra");
      // Rollback: re-sync from props
      const printer = printers.find((p: any) => p.id === variables.id);
      if (printer) {
        let rollbackIds: number[] = [];
        if (printer.categoryIds) {
          try { rollbackIds = JSON.parse(printer.categoryIds); } catch { rollbackIds = []; }
        }
        setLocalCategoryMap(prev => ({ ...prev, [printer.id]: rollbackIds }));
      }
    },
  });

  // Get category IDs from local state (optimistic)
  const getPrinterCategoryIds = (printer: any): number[] => {
    return localCategoryMap[printer.id] || [];
  };
  // Check if a category is assigned to a specific printer
  const isCategoryAssigned = (categoryId: number, printer: any): boolean => {
    const ids = getPrinterCategoryIds(printer);
    return ids.includes(categoryId);
  };
  // Check if a printer is set to "all" (no specific categories = prints everything)
  const isPrinterAll = (printer: any): boolean => {
    const ids = getPrinterCategoryIds(printer);
    return ids.length === 0;
  };
  // Toggle category assignment for a printer
  const toggleCategoryForPrinter = (categoryId: number, printer: any) => {
    const currentIds = getPrinterCategoryIds(printer);
    let newIds: number[];
    if (currentIds.includes(categoryId)) {
      newIds = currentIds.filter((id: number) => id !== categoryId);
    } else {
      newIds = [...currentIds, categoryId];
    }
    // Optimistic update: immediately update local state
    setLocalCategoryMap(prev => ({ ...prev, [printer.id]: newIds }));
    updatePrinterMutation.mutate({
      id: printer.id,
      categoryIds: newIds.length > 0 ? JSON.stringify(newIds) : null,
    });
  };
  // Set printer to "all categories"
  const setPrinterToAll = (printer: any) => {
    // Optimistic update: immediately clear categories
    setLocalCategoryMap(prev => ({ ...prev, [printer.id]: [] }));
    updatePrinterMutation.mutate({
      id: printer.id,
      categoryIds: null,
    });
  };
  // Só exibir regras de categoria quando há 2+ impressoras ativas (com 1 só, não faz sentido)
  if (!printers || printers.filter(p => p.isActive).length < 2) return null;

  return (
    <SectionCard
      title="Regras de Impressão por Categoria"
      description="Defina quais categorias cada impressora deve imprimir"
      icon={<ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
      iconBg="bg-blue-100 dark:bg-blue-500/15"
    >
      <div className="space-y-4">
        {/* Info box */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <p className="font-medium">Como funciona:</p>
            <p>Se nenhuma categoria estiver marcada, a impressora imprime <strong>todos os itens</strong>.</p>
            <p>Se marcar categorias específicas, a impressora só imprime itens dessas categorias.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            {printers.filter(p => p.isActive).map((printer) => {
              const isAll = isPrinterAll(printer);
              return (
                <div key={printer.id} className="border border-border/50 rounded-xl p-4 space-y-3">
                  {/* Printer header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400">
                        <Printer className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium text-sm">{printer.name}</span>
                      {printer.isDefault && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-lg">Padrão</span>
                      )}
                    </div>
                    <Button
                      variant={isAll ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs rounded-lg"
                      onClick={() => setPrinterToAll(printer)}
                      disabled={updatePrinterMutation.isPending}
                    >
                      {isAll ? "✓ Todas" : "Todas"}
                    </Button>
                  </div>

                  {/* Category checkboxes */}
                  {!isAll && categories && categories.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {categories.map((cat: any) => (
                        <label
                          key={cat.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border",
                            isCategoryAssigned(cat.id, printer)
                              ? "bg-primary/5 border-primary/30"
                              : "bg-muted/20 border-transparent hover:bg-muted/40"
                          )}
                        >
                          <Checkbox
                            checked={isCategoryAssigned(cat.id, printer)}
                            onCheckedChange={() => toggleCategoryForPrinter(cat.id, printer)}
                            disabled={updatePrinterMutation.isPending}
                          />
                          <span className="text-sm">{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Show selected categories summary when in "all" mode */}
                  {isAll && (
                    <p className="text-xs text-muted-foreground italic">
                      Esta impressora imprime todos os itens do pedido.
                      <button
                        className="ml-1 text-primary underline"
                        onClick={() => {
                          // Set to first category to switch out of "all" mode
                          if (categories && categories.length > 0) {
                            updatePrinterMutation.mutate({
                              id: printer.id,
                              categoryIds: JSON.stringify([categories[0].id]),
                            });
                          }
                        }}
                      >
                        Selecionar categorias específicas
                      </button>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
