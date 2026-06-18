import { AdminLayout } from "@/components/AdminLayout";
import { ScheduledClosureBanner } from "@/components/ScheduledClosureBanner";
import { PageHeader, SectionCard } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { compressImage } from "@/lib/imageCompression";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Store,
  MapPin,
  Settings2,
  Link as LinkIcon,
  Phone,
  CreditCard,
  ImagePlus,
  Save,
  Copy,
  ExternalLink,
  UtensilsCrossed,
  Info,
  Camera,
  Pencil,
  Check,
  X,
  MessageCircle,
  Trash2,
  MessageSquare,
  Clock,
  Gift,
  Printer,
  Plus,
  Wifi,
  WifiOff,
  Star,
  TestTube,
  Bell,
  BellRing,
  Smartphone,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  Bike,
  Package,
  ShoppingBag,
  ChevronDown,
  FileText,
  Globe,
  Eye,
  MapPinned,
  Pin,
  StickyNote,
  CalendarClock,
  Search,
  Truck,
  CalendarOff,
  AlertTriangle,
  Lock,
  Share2,
  Palette,
  Crosshair,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo, type ComponentType } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LockedSettingsCardProps = {
  title: string;
  description: string;
  unlockDescription?: string;
  icon: ComponentType<{ className?: string }>;
  minHeightClass?: string;
  className?: string;
};

function LockedSettingsCard({
  title,
  description,
  unlockDescription = "Acesse este recurso ao desbloquear",
  icon: Icon,
  minHeightClass = "min-h-[180px]",
  className = "",
}: LockedSettingsCardProps) {
  return (
    <div className={`rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 p-6 relative overflow-hidden flex flex-col ${minHeightClass} ${className}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-600 dark:text-gray-300">{title}</h4>
          <p className="text-sm text-gray-400 dark:text-gray-500">{description}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-1 min-h-0 flex-col items-center justify-center text-center">
        <Lock className="w-6 h-6 text-gray-300 dark:text-gray-600 mb-1" />
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Desbloqueie este recurso</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{unlockDescription}</p>
        <a href="/planos" className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 transition-colors">
          Ver planos →
        </a>
      </div>
    </div>
  );
}
import { ImageCropModal } from "@/components/ImageCropModal";
import { AddressMapPicker } from "@/components/AddressMapPicker";

import { WhatsAppTab } from "@/components/WhatsAppTab";
import { PrintTestTab } from "@/components/PrintTestTab";
import { IntegrationsTab } from "@/components/IntegrationsTab";
import { SettingsSidebar, SettingsSection } from "@/components/SettingsSidebar";
import { SchedulingSettings } from "@/components/SchedulingSettings";
import { ScheduledClosures } from "@/components/ScheduledClosures";
import { AccountSecuritySection } from "@/components/AccountSecuritySection";
import { TimeInput } from "@/components/TimeInput";
import { SUPPORTED_TIMEZONES } from "../../../shared/const";

const formatNeighborhoodFeeInputValue = (value: string | number | null | undefined) => {
  const normalized = String(value ?? "0").trim().replace(",", ".");
  const amount = Number.parseFloat(normalized);
  return (Number.isFinite(amount) ? amount : 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const normalizeNeighborhoodFeeInputValue = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const cents = Number.parseInt(digits || "0", 10);
  return (cents / 100).toFixed(2);
};

const MAX_PINNED_NEIGHBORHOOD_FEES = 5;
const INSTAGRAM_USERNAME_MAX_LENGTH = 35;
const INSTAGRAM_LINK_PATTERN = /(?:https?:\/\/|www\.|instagram\.com)/i;

const normalizeInstagramUsername = (value: string) => (
  value
    .trim()
    .replace(/^@+/, "")
    .replace(/[^A-Za-z0-9._]/g, "")
    .slice(0, INSTAGRAM_USERNAME_MAX_LENGTH)
);

const isInstagramLinkValue = (value: string) => INSTAGRAM_LINK_PATTERN.test(value.trim());

type NeighborhoodFeeRow = {
  id?: number;
  neighborhood: string;
  fee: string;
  pinned?: boolean;
  isFree?: boolean;
  _isNew?: boolean;
  _isEditing?: boolean;
};

const createEmptyNeighborhoodFeeRow = (): NeighborhoodFeeRow => ({
  neighborhood: "",
  fee: "",
  pinned: false,
  isFree: false,
  _isNew: true,
  _isEditing: true,
});

const isNeighborhoodFeeComplete = (fee: NeighborhoodFeeRow) => (
  fee.neighborhood.trim().length > 0 && (fee.isFree || fee.fee.trim().length > 0) && !fee._isNew
);

const isNeighborhoodFeeWaitingForManualPrice = (fee: NeighborhoodFeeRow) => (
  Boolean(fee.id) &&
  fee.neighborhood.trim().length > 0 &&
  !fee.isFree &&
  fee.fee.trim().length === 0
);

const SETTINGS_SECTIONS: SettingsSection[] = [
  'estabelecimento',
  'atendimento',
  'whatsapp',
  'whatsapp-conexao',
  'whatsapp-notificacoes',
  'whatsapp-templates',
  'impressora',
  'integracoes',
  'conta-seguranca',
];

const normalizeSettingsSection = (section: string | null): SettingsSection | null => {
  if (!section) return null;
  if (section === 'whatsapp') return 'whatsapp-conexao';
  return SETTINGS_SECTIONS.includes(section as SettingsSection) ? section as SettingsSection : null;
};

const getSettingsSectionFromSearch = (search: string): SettingsSection | null => {
  const params = new URLSearchParams(search);
  return normalizeSettingsSection(params.get('section'));
};

const updateSettingsSectionInUrl = (section: SettingsSection, replace = false) => {
  if (typeof window === 'undefined') return;

  const normalizedSection = normalizeSettingsSection(section) ?? 'estabelecimento';
  const params = new URLSearchParams(window.location.search);
  params.set('section', normalizedSection);

  if (normalizedSection !== 'atendimento') {
    params.delete('scrollTo');
  }

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl === currentUrl) return;

  if (replace) {
    window.history.replaceState(window.history.state, '', nextUrl);
  } else {
    window.history.pushState(window.history.state, '', nextUrl);
  }
};

export default function Configuracoes() {
  const utils = trpc.useUtils();
  const { data: establishment, refetch } = trpc.establishment.get.useQuery();
  const { data: whatsappConfig } = trpc.whatsapp.getConfig.useQuery();
  const isWhatsappConnectedForSms = whatsappConfig?.status === 'connected';
  const isLitePlan = establishment?.planType === 'lite' || establishment?.planType === 'trial' || establishment?.planType === 'free';
  const isFreePlan = establishment?.planType === 'trial' || establishment?.planType === 'free';
  const deliveryKmEnabledPlanTypes = new Set(['basic', 'essential', 'essencial', 'pro']);
  const normalizedPlanType = String(establishment?.planType || 'trial').toLowerCase();
  const isDeliveryKmPremiumLocked = !deliveryKmEnabledPlanTypes.has(normalizedPlanType);
  const { data: businessHoursData, refetch: refetchBusinessHours } = trpc.establishment.getBusinessHours.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id }
  );
  const { data: neighborhoodFeesData, refetch: refetchNeighborhoodFees } = trpc.neighborhoodFees.list.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id }
  );
  const { data: radiusFeesData, refetch: refetchRadiusFees } = trpc.radiusFees.list.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id }
  );

  // Scheduled closures query (para aviso visual no card de horários)
  const { data: scheduledClosuresData } = trpc.scheduledClosures.list.useQuery();

  // Printer queries
  const { data: printers, refetch: refetchPrinters } = trpc.printer.list.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id }
  );
  const { data: printerSettings, refetch: refetchPrinterSettings } = trpc.printer.getSettings.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id }
  );

  const [activeSection, setActiveSection] = useState<SettingsSection>(() => (
    getSettingsSectionFromSearch(window.location.search) ?? 'estabelecimento'
  ));

  const handleSectionChange = useCallback((section: SettingsSection, options?: { replace?: boolean }) => {
    const normalizedSection = normalizeSettingsSection(section) ?? 'estabelecimento';
    updateSettingsSectionInUrl(normalizedSection, options?.replace);
    setActiveSection(normalizedSection);
  }, []);

  // Ouvir evento de abrir seção WhatsApp (vindo do banner de desconectado)
  useEffect(() => {
    const handleOpenWhatsApp = () => {
      handleSectionChange('whatsapp-conexao');
    };
    window.addEventListener('open-whatsapp-settings', handleOpenWhatsApp);
    return () => window.removeEventListener('open-whatsapp-settings', handleOpenWhatsApp);
  }, [handleSectionChange]);

  // Reagir a mudanças na URL (deep linking dinâmico e navegação voltar/avançar)
  const [currentLocation] = useLocation();
  useEffect(() => {
    setActiveSection(getSettingsSectionFromSearch(window.location.search) ?? 'estabelecimento');
  }, [currentLocation]);

  // Scroll automático para cards específicos apenas quando vem de um CTA explícito do onboarding.
  useEffect(() => {
    if (activeSection !== 'atendimento') return;

    const params = new URLSearchParams(window.location.search);
    const scrollTo = params.get('scrollTo');
    if (!scrollTo) return;

    const scrollToElement = (ref: React.RefObject<HTMLDivElement | null>, retries = 5) => {
      if (ref.current) {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight visual temporário com bordas arredondadas e pulso suave
        ref.current.style.borderRadius = '1rem';
        ref.current.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.3)';
        ref.current.style.animation = 'onboarding-highlight-pulse 1.5s ease-in-out 3';
        ref.current.style.transition = 'box-shadow 0.3s ease';
        setTimeout(() => {
          if (ref.current) {
            ref.current.style.boxShadow = '';
            ref.current.style.animation = '';
          }
        }, 5000);
      } else if (retries > 0) {
        // Ref pode não estar pronto ainda, tentar novamente
        setTimeout(() => scrollToElement(ref, retries - 1), 300);
      }
    };

    const consumeScrollToParam = () => {
      const nextParams = new URLSearchParams(window.location.search);
      nextParams.delete('scrollTo');
      const query = nextParams.toString();
      const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
      window.history.replaceState(window.history.state, '', nextUrl);
    };

    let targetRef: React.RefObject<HTMLDivElement | null> | null = null;
    if (scrollTo === 'formas-pagamento') {
      targetRef = paymentMethodsCardRef;
    } else if (scrollTo === 'fechamentos-programados') {
      targetRef = scheduledClosuresCardRef;
    } else if (scrollTo === 'horarios-funcionamento') {
      targetRef = businessHoursCardRef;
    }

    if (!targetRef) {
      consumeScrollToParam();
      return;
    }

    const timer = setTimeout(() => {
      scrollToElement(targetRef);
      consumeScrollToParam();
    }, 500);

    return () => clearTimeout(timer);
  }, [activeSection, currentLocation]);

  // Establishment form state
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [latitude, setLatitude] = useState<string | null>(null);
  const [longitude, setLongitude] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [pendingRadiusActivation, setPendingRadiusActivation] = useState(false);

  // Service settings form state
  const [menuSlug, setMenuSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [acceptsCash, setAcceptsCash] = useState(true);
  const [acceptsCard, setAcceptsCard] = useState(true);
  const [acceptsPix, setAcceptsPix] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [pixHolderName, setPixHolderName] = useState("");
  const [acceptsBoleto, setAcceptsBoleto] = useState(false);
  const [allowsDelivery, setAllowsDelivery] = useState(true);
  const [allowsPickup, setAllowsPickup] = useState(true);
  const [allowsDineIn, setAllowsDineIn] = useState(false);

  // Public note state
  const [publicNote, setPublicNote] = useState("");
  const [publicNoteCreatedAt, setPublicNoteCreatedAt] = useState<Date | null>(null);
  const [noteValidityDays, setNoteValidityDays] = useState(7);

  // SMS settings state
  const [smsEnabled, setSmsEnabled] = useState(false);

  useEffect(() => {
    if (isWhatsappConnectedForSms && smsEnabled) {
      setSmsEnabled(false);
    }
  }, [isWhatsappConnectedForSms, smsEnabled]);

  // Auto-accept orders state
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);

  // Note style state
  const [noteStyle, setNoteStyle] = useState("default");
  // Menu background hue state
  const [menuBackgroundHue, setMenuBackgroundHue] = useState<number | null>(null);
  const [showPreviewForStyle, setShowPreviewForStyle] = useState<string | null>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Delivery time state
  const [deliveryTimeEnabled, setDeliveryTimeEnabled] = useState(false);
  const [deliveryTimeMin, setDeliveryTimeMin] = useState(20);
  const [deliveryTimeMax, setDeliveryTimeMax] = useState(60);

  // Minimum order state
  const [minimumOrderEnabled, setMinimumOrderEnabled] = useState(false);
  const [minimumOrderValue, setMinimumOrderValue] = useState("0");

  // Delivery fee state
  const [deliveryFeeType, setDeliveryFeeType] = useState<"free" | "fixed" | "byNeighborhood" | "byRadius">("free");
  const [deliveryFeeFixed, setDeliveryFeeFixed] = useState("0");
  const [isMobileFixedFeeSheetOpen, setIsMobileFixedFeeSheetOpen] = useState(false);
  const [neighborhoodFees, setNeighborhoodFees] = useState<NeighborhoodFeeRow[]>([]);
  const [mobileNeighborhoodSheetIndex, setMobileNeighborhoodSheetIndex] = useState<number | null>(null);
  const [mobileNeighborhoodSheetDraft, setMobileNeighborhoodSheetDraft] = useState<NeighborhoodFeeRow>(() => createEmptyNeighborhoodFeeRow());
  const [radiusFees, setRadiusFees] = useState<{id?: number; maxKm: string; fee: string}[]>([]);
  // Entrega grátis acima de valor mínimo
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(false);
  const [freeDeliveryMinValue, setFreeDeliveryMinValue] = useState("0");

  // Timezone state
  const [timezone, setTimezone] = useState('America/Sao_Paulo');

  // Reviews settings state
  const [reviewsEnabled, setReviewsEnabled] = useState(true);
  const [fakeReviewCount, setFakeReviewCount] = useState(250);

  // Business hours state
  type BusinessHourDay = {
    dayOfWeek: number;
    isActive: boolean;
    openTime: string;
    closeTime: string;
  };
  const [businessHours, setBusinessHours] = useState<BusinessHourDay[]>([
    { dayOfWeek: 0, isActive: false, openTime: "", closeTime: "" }, // Domingo
    { dayOfWeek: 1, isActive: false, openTime: "", closeTime: "" }, // Segunda
    { dayOfWeek: 2, isActive: false, openTime: "", closeTime: "" }, // Terça
    { dayOfWeek: 3, isActive: false, openTime: "", closeTime: "" }, // Quarta
    { dayOfWeek: 4, isActive: false, openTime: "", closeTime: "" }, // Quinta
    { dayOfWeek: 5, isActive: false, openTime: "", closeTime: "" }, // Sexta
    { dayOfWeek: 6, isActive: false, openTime: "", closeTime: "" }, // Sábado
  ]);

  // Printer state
  type PrinterData = {
    id: number;
    name: string;
    ipAddress: string;
    port: number;
    isActive: boolean;
    isDefault: boolean;
  };
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterData | null>(null);
  const [printerDeleteConfirmOpen, setPrinterDeleteConfirmOpen] = useState(false);
  const [printerToDelete, setPrinterToDelete] = useState<PrinterData | null>(null);
  const [printerName, setPrinterName] = useState("");
  const [printerIpAddress, setPrinterIpAddress] = useState("");
  const [printerPort, setPrinterPort] = useState(9100);
  const [printerType, setPrinterType] = useState<'all' | 'kitchen' | 'counter' | 'bar'>('all');
  const [printerCategoryIds, setPrinterCategoryIds] = useState<number[]>([]);
  const [printerIsActive, setPrinterIsActive] = useState(true);
  const [printerIsDefault, setPrinterIsDefault] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string } | null>(null);

  // Printer settings state
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);
  const [printOnNewOrder, setPrintOnNewOrder] = useState(true);
  const [printOnStatusChange, setPrintOnStatusChange] = useState(false);
  const [printCopies, setPrintCopies] = useState(1);
  const [printShowLogo, setPrintShowLogo] = useState(true);
  const [printLogoUrl, setPrintLogoUrl] = useState("");
  const [printShowQrCode, setPrintShowQrCode] = useState(false);
  const [printHeaderMessage, setPrintHeaderMessage] = useState("");
  const [printFooterMessage, setPrintFooterMessage] = useState("");
  const [printPaperWidth, setPrintPaperWidth] = useState<'58mm' | '80mm'>('80mm');

  // POSPrinterDriver state
  const [posPrinterEnabled, setPosPrinterEnabled] = useState(false);
  const [posPrinterLinkcode, setPosPrinterLinkcode] = useState("");
  const [posPrinterNumber, setPosPrinterNumber] = useState(1);
  const [isTestingPosPrinter, setIsTestingPosPrinter] = useState(false);
  const [posPrinterTestResult, setPosPrinterTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Impressão Direta via Rede state
  const [directPrintEnabled, setDirectPrintEnabled] = useState(false);
  const [directPrintIp, setDirectPrintIp] = useState("");
  const [directPrintPort, setDirectPrintPort] = useState(9100);
  const [isTestingDirectPrint, setIsTestingDirectPrint] = useState(false);
  const [directPrintTestResult, setDirectPrintTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Image crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [cropType, setCropType] = useState<"logo" | "cover">("logo");

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Inline editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [originalName, setOriginalName] = useState("");

  // Flags para carregar dados do servidor apenas uma vez (evita sobrescrever edições ao voltar à aba)
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [initialBusinessHoursLoaded, setInitialBusinessHoursLoaded] = useState(false);
  const [initialNeighborhoodFeesLoaded, setInitialNeighborhoodFeesLoaded] = useState(false);
  const [initialRadiusFeesLoaded, setInitialRadiusFeesLoaded] = useState(false);
  const [initialPrinterSettingsLoaded, setInitialPrinterSettingsLoaded] = useState(false);

  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");
  const businessHoursCardRef = useRef<HTMLDivElement>(null);
  const paymentMethodsCardRef = useRef<HTMLDivElement>(null);
  const scheduledClosuresCardRef = useRef<HTMLDivElement>(null);

  // Mapa de dias da semana com fechamento programado ativo (para aviso visual no card de horários)
  // dayOfWeek: 0=Domingo, 1=Segunda, ..., 6=Sábado
  const closedDaysMap = useMemo(() => {
    const map: Record<number, { reason: string | null; ruleLabel: string }[]> = {};
    if (!scheduledClosuresData) return map;

    const dayNameToNumber: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6,
    };

    for (const closure of scheduledClosuresData) {
      if (!closure.isActive) continue;

      if (closure.type === "recurring" && closure.recurringRule) {
        const rule = closure.recurringRule;
        // Regras "every_*" afetam sempre o mesmo dia da semana
        if (rule.startsWith("every_")) {
          const dayName = rule.replace("every_", "");
          const dayNum = dayNameToNumber[dayName];
          if (dayNum !== undefined) {
            if (!map[dayNum]) map[dayNum] = [];
            const RULE_LABELS: Record<string, string> = {
              every_sunday: "Todo domingo", every_monday: "Toda segunda",
              every_tuesday: "Toda ter\u00e7a", every_wednesday: "Toda quarta",
              every_thursday: "Toda quinta", every_friday: "Toda sexta",
              every_saturday: "Todo s\u00e1bado",
            };
            map[dayNum].push({ reason: closure.reason, ruleLabel: RULE_LABELS[rule] || rule });
          }
        }
        // Regras "last_*" e "first_*" afetam apenas em certas semanas do mês
        // Mostramos um aviso mais sutil ("pode estar fechado")
        if (rule.startsWith("last_") || rule.startsWith("first_")) {
          const dayName = rule.replace("last_", "").replace("first_", "");
          const dayNum = dayNameToNumber[dayName];
          if (dayNum !== undefined) {
            if (!map[dayNum]) map[dayNum] = [];
            const RULE_LABELS: Record<string, string> = {
              last_sunday: "\u00dalt. domingo do m\u00eas", last_saturday: "\u00dalt. s\u00e1bado do m\u00eas",
              last_friday: "\u00dalt. sexta do m\u00eas", last_monday: "\u00dalt. segunda do m\u00eas",
              first_sunday: "1\u00ba domingo do m\u00eas", first_saturday: "1\u00ba s\u00e1bado do m\u00eas",
              first_monday: "1\u00aa segunda do m\u00eas",
            };
            map[dayNum].push({ reason: closure.reason, ruleLabel: RULE_LABELS[rule] || rule });
          }
        }
      }

      // Datas específicas: verificar qual dia da semana cai
      if (closure.type === "specific_date" && closure.specificDate) {
        const dateStr = typeof closure.specificDate === "string"
          ? closure.specificDate
          : (closure.specificDate as Date).toISOString().split("T")[0];
        const d = new Date(dateStr + "T12:00:00");
        const dayNum = d.getDay(); // 0=Sunday
        if (!map[dayNum]) map[dayNum] = [];
        const formatted = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        map[dayNum].push({ reason: closure.reason, ruleLabel: `Fechado em ${formatted}` });
      }
    }
    return map;
  }, [scheduledClosuresData]);


  // Load establishment data (apenas no carregamento inicial)
  useEffect(() => {
    if (establishment && !initialDataLoaded) {
      setName(establishment.name || "");
      setLogo(establishment.logo || "");
      setCoverImage(establishment.coverImage || "");
      setStreet(establishment.street || "");
      setNumber(establishment.number || "");
      setComplement(establishment.complement || "");
      setNeighborhood(establishment.neighborhood || "");
      setCity(establishment.city || "");
      setState(establishment.state || "");
      setZipCode(establishment.zipCode || "");
      setLatitude(establishment.latitude || null);
      setLongitude(establishment.longitude || null);
      setMenuSlug(establishment.menuSlug || "");
      setWhatsapp(establishment.whatsapp || "");
      setInstagram(normalizeInstagramUsername(establishment.instagram || ""));
      setAcceptsCash(establishment.acceptsCash);
      setAcceptsCard(establishment.acceptsCard);
      setAcceptsPix(establishment.acceptsPix);
      setPixKey(establishment.pixKey || "");
      setPixHolderName(establishment.pixHolderName || "");
      setAcceptsBoleto(establishment.acceptsBoleto);
      setAllowsDelivery(establishment.allowsDelivery);
      setAllowsPickup(establishment.allowsPickup);
      setAllowsDineIn(establishment.allowsDineIn);
      setPublicNote(establishment.publicNote || "");
      setPublicNoteCreatedAt(establishment.publicNoteCreatedAt ? new Date(establishment.publicNoteCreatedAt) : null);
      // Calcular dias de validade baseado na data de expiração
      if (establishment.noteExpiresAt && establishment.publicNoteCreatedAt) {
        const createdAt = new Date(establishment.publicNoteCreatedAt);
        const expiresAt = new Date(establishment.noteExpiresAt);
        const diffDays = Math.round((expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        setNoteValidityDays(Math.min(7, Math.max(1, diffDays)));
      }
      setSmsEnabled(establishment.smsEnabled || false);
      setNoteStyle(establishment.noteStyle || "default");
      setMenuBackgroundHue(establishment.menuBackgroundHue ?? null);
      // Delivery time settings
      setDeliveryTimeEnabled(establishment.deliveryTimeEnabled || false);
      setDeliveryTimeMin(establishment.deliveryTimeMin || 20);
      setDeliveryTimeMax(establishment.deliveryTimeMax || 60);
      // Minimum order settings
      setMinimumOrderEnabled(establishment.minimumOrderEnabled || false);
      setMinimumOrderValue(establishment.minimumOrderValue || "0");
      // Delivery fee settings
      setDeliveryFeeType(establishment.deliveryFeeType || "free");
      setDeliveryFeeFixed(establishment.deliveryFeeFixed || "0");
      setFreeDeliveryEnabled(establishment.freeDeliveryEnabled || false);
      setFreeDeliveryMinValue(establishment.freeDeliveryMinValue || "0");
      setTimezone(establishment.timezone || 'America/Sao_Paulo');
      setAutoAcceptOrders(establishment.autoAcceptOrders || false);
      setReviewsEnabled(establishment.reviewsEnabled ?? true);
      setFakeReviewCount(Math.min(establishment.fakeReviewCount ?? 250, 250));
      setInitialDataLoaded(true);
    }
  }, [establishment, initialDataLoaded]);

  // Load business hours when data is available
  useEffect(() => {
    if (businessHoursData && businessHoursData.length > 0 && !initialBusinessHoursLoaded) {
      const hoursMap = new Map(businessHoursData.map(h => [h.dayOfWeek, h]));
      setBusinessHours(prev => prev.map(day => {
        const savedHour = hoursMap.get(day.dayOfWeek);
        if (savedHour) {
          return {
            dayOfWeek: day.dayOfWeek,
            isActive: savedHour.isActive,
            openTime: savedHour.openTime || "",
            closeTime: savedHour.closeTime || "",
          };
        }
        return day;
      }));
      setInitialBusinessHoursLoaded(true);
    }
  }, [businessHoursData, initialBusinessHoursLoaded]);

  // Load neighborhood fees when data is available
  useEffect(() => {
    if (neighborhoodFeesData && !initialNeighborhoodFeesLoaded) {
      setNeighborhoodFees(neighborhoodFeesData.map(fee => ({
        id: fee.id,
        neighborhood: fee.neighborhood,
        fee: fee.fee,
        pinned: Boolean(fee.pinned),
        isFree: Number(fee.fee) === 0,
        _isNew: false,
        _isEditing: false,
      })));
      setInitialNeighborhoodFeesLoaded(true);
    }
  }, [neighborhoodFeesData, initialNeighborhoodFeesLoaded]);

  // Load radius fees when data is available
  useEffect(() => {
    if (radiusFeesData && !initialRadiusFeesLoaded) {
      setRadiusFees(radiusFeesData.map(fee => ({
        id: fee.id,
        maxKm: fee.maxKm,
        fee: fee.fee,
      })));
      setInitialRadiusFeesLoaded(true);
    }
  }, [radiusFeesData, initialRadiusFeesLoaded]);

  // Load printer settings when data is available
  useEffect(() => {
    if (printerSettings && !initialPrinterSettingsLoaded) {
      setAutoPrintEnabled(printerSettings.autoPrintEnabled);
      setPrintOnNewOrder(printerSettings.printOnNewOrder);
      setPrintOnStatusChange(printerSettings.printOnStatusChange);
      setPrintCopies(printerSettings.copies);
      setPrintShowLogo(printerSettings.showLogo);
      setPrintLogoUrl((printerSettings as any).logoUrl || "");
      setPrintShowQrCode(printerSettings.showQrCode);
      setPrintHeaderMessage((printerSettings as any).headerMessage || "");
      setPrintFooterMessage(printerSettings.footerMessage || "");
      setPrintPaperWidth((printerSettings as any).paperWidth || '80mm');
      // POSPrinterDriver
      setPosPrinterEnabled((printerSettings as any).posPrinterEnabled || false);
      setPosPrinterLinkcode((printerSettings as any).posPrinterLinkcode || "");
      setPosPrinterNumber((printerSettings as any).posPrinterNumber || 1);
      // Impressão Direta via Rede
      setDirectPrintEnabled((printerSettings as any).directPrintEnabled || false);
      setDirectPrintIp((printerSettings as any).directPrintIp || "");
      setDirectPrintPort((printerSettings as any).directPrintPort || 9100);
      setInitialPrinterSettingsLoaded(true);
    }
  }, [printerSettings, initialPrinterSettingsLoaded]);

  // Upload mutation
  const uploadMutation = trpc.upload.image.useMutation();

  // Mutations
  const createMutation = trpc.establishment.create.useMutation({
    onSuccess: () => {
      // Para criação, precisamos recarregar tudo pois é um novo registro
      setInitialDataLoaded(false);
      utils.establishment.get.invalidate();
      toast.success("Estabelecimento criado com sucesso");
    },
    onError: () => toast.error("Erro ao criar estabelecimento"),
  });

  // Estado para rastrear campos salvos com sucesso (indicador visual)
  const [savedFields, setSavedFields] = useState<Set<string>>(new Set());
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());
  const savedTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Marca campos como salvos e remove após 2s
  const markFieldsSaved = useCallback((fieldKeys: string[]) => {
    setSavedFields(prev => {
      const next = new Set(prev);
      fieldKeys.forEach(k => next.add(k));
      return next;
    });
    fieldKeys.forEach(k => {
      if (savedTimersRef.current[k]) clearTimeout(savedTimersRef.current[k]);
      savedTimersRef.current[k] = setTimeout(() => {
        setSavedFields(prev => {
          const next = new Set(prev);
          next.delete(k);
          return next;
        });
        delete savedTimersRef.current[k];
      }, 2000);
    });
  }, []);

  // Funções para marcar campos como "salvando" (spinner)
  const markFieldsSaving = useCallback((fields: string[]) => {
    setSavingFields(prev => {
      const next = new Set(prev);
      fields.forEach(f => next.add(f));
      return next;
    });
  }, []);

  const clearFieldsSaving = useCallback((fields: string[]) => {
    setSavingFields(prev => {
      const next = new Set(prev);
      fields.forEach(f => next.delete(f));
      return next;
    });
  }, []);

  // Componente indicador de campo salvando/salvo
  const SavedCheck = ({ field }: { field: string }) => {
    if (savingFields.has(field)) {
      return (
        <span className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium animate-in fade-in duration-200 ml-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Salvando</span>
        </span>
      );
    }
    if (!savedFields.has(field)) return null;
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium animate-in fade-in slide-in-from-left-1 duration-300 ml-1.5">
        <Check className="h-3 w-3" />
        <span>Salvo</span>
      </span>
    );
  };

  const updateMutation = trpc.establishment.update.useMutation({
    onSuccess: (_data, variables) => {
      // Invalidar checklist do onboarding (para passos como foto/capa)
      utils.dashboard.onboardingChecklist.invalidate();
      // Optimistic cache update: merge the sent variables into the cached establishment data
      // This avoids the race condition of setInitialDataLoaded(false) + refetch() where
      // the useEffect would run with stale data before refetch completes
      utils.establishment.get.setData(undefined, (old) => {
        if (!old) return old;
        return { ...old, ...variables };
      });
      // Also refetch in background to ensure full server sync
      refetch();
      // Marcar campos salvos para indicador visual (excluir id)
      const fieldKeys = Object.keys(variables).filter(k => k !== 'id');
      if (fieldKeys.length > 0) {
        clearFieldsSaving(fieldKeys);
        markFieldsSaved(fieldKeys);
      }
      toast.success("Configurações salvas com sucesso");
    },
    onError: (error) => {
      setSavingFields(new Set());
      if (error.message.includes("link já está em uso")) {
        toast.error("Este link já está em uso por outro restaurante. Escolha outro.");
      } else {
        toast.error("Erro ao salvar configurações");
      }
    },
  });

  const saveNoteMutation = trpc.establishment.savePublicNote.useMutation({
    onSuccess: () => {
      // Optimistic cache update: atualizar o cache local sem resetar initialDataLoaded
      // para evitar que o useEffect sobrescreva o estado local
      utils.establishment.get.setData(undefined, (old) => {
        if (!old) return old;
        return { ...old, publicNote, publicNoteCreatedAt: new Date() };
      });
      utils.establishment.get.invalidate();
      clearFieldsSaving(['publicNote']);
      markFieldsSaved(['publicNote']);
      toast.success("Nota salva com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar nota"),
  });

  const removeNoteMutation = trpc.establishment.removePublicNote.useMutation({
    onSuccess: () => {
      // Optimistic cache update: atualizar o cache local sem resetar initialDataLoaded
      utils.establishment.get.setData(undefined, (old) => {
        if (!old) return old;
        return { ...old, publicNote: null, publicNoteCreatedAt: null, noteExpiresAt: null };
      });
      utils.establishment.get.invalidate();
      setPublicNote("");
      setPublicNoteCreatedAt(null);
      toast.success("Nota removida com sucesso");
    },
    onError: () => toast.error("Erro ao remover nota"),
  });

  const saveBusinessHoursMutation = trpc.establishment.saveBusinessHours.useMutation({
    onSuccess: (data) => {
      // NÃO resetar initialBusinessHoursLoaded aqui para evitar que o useEffect
      // sobrescreva o estado local enquanto o utilizador está a editar outro dia
      utils.dashboard.onboardingChecklist.invalidate();
      clearFieldsSaving(['businessHours']);
      markFieldsSaved(['businessHours']);

      // Se a loja foi fechada imediatamente ao desligar o dia atual
      if (data?.closedImmediately) {
        toast.info("Loja fechada! O dia de hoje foi desativado, a loja foi fechada imediatamente.", { duration: 5000 });
        // Invalidar dados do estabelecimento para refletir o novo status
        utils.establishment.get.invalidate();
        utils.establishment.getOpenStatus.invalidate();
      }
    },
    onError: () => toast.error("Erro ao salvar horários de funcionamento"),
  });

  // Neighborhood fees mutations (individual - kept for backwards compatibility)
  const createNeighborhoodFeeMutation = trpc.neighborhoodFees.create.useMutation({
    onSuccess: () => {
      // Refetch sem resetar a flag para evitar sobrescrever estado local
      refetchNeighborhoodFees();
    },
    onError: () => toast.error("Erro ao salvar taxa por bairro"),
  });

  const updateNeighborhoodFeeMutation = trpc.neighborhoodFees.update.useMutation({
    onSuccess: () => {
      // Refetch sem resetar a flag para evitar sobrescrever estado local
      refetchNeighborhoodFees();
    },
    onError: () => toast.error("Erro ao atualizar taxa por bairro"),
  });

  const deleteNeighborhoodFeeMutation = trpc.neighborhoodFees.delete.useMutation({
    onSuccess: () => {
      // Refetch sem resetar a flag para evitar sobrescrever estado local
      refetchNeighborhoodFees();
    },
    onError: () => toast.error("Erro ao remover taxa por bairro"),
  });

  // Batch sync mutation - saves all neighborhood fees in a single request
  const syncNeighborhoodFeesMutation = trpc.neighborhoodFees.sync.useMutation({
    onSuccess: (updatedFees) => {
      // Update local state with the server response, preserving rows where the
      // owner just removed "Grátis" and is still typing the manual price.
      setNeighborhoodFees(currentFees => {
        const waitingForManualPriceById = new Map(
          currentFees
            .filter(isNeighborhoodFeeWaitingForManualPrice)
            .map(fee => [fee.id, fee])
        );
        const manuallyEditingById = new Map(
          currentFees
            .filter(fee => fee.id && fee._isEditing)
            .map(fee => [fee.id, fee])
        );

        return updatedFees.map(f => {
          const localEditingFee = waitingForManualPriceById.get(f.id);
          if (!localEditingFee && manuallyEditingById.has(f.id)) {
            manuallyEditingById.delete(f.id);
          }
          if (localEditingFee) {
            return {
              ...localEditingFee,
              id: f.id,
              pinned: Boolean(f.pinned),
              isFree: false,
              _isNew: true,
              _isEditing: true,
            };
          }

          return {
            id: f.id,
            neighborhood: f.neighborhood,
            fee: f.fee,
            pinned: Boolean(f.pinned),
            isFree: Number(f.fee) === 0,
            _isNew: false,
            _isEditing: false,
          };
        });
      });
      setInitialNeighborhoodFeesLoaded(true);
      clearFieldsSaving(['neighborhoodFees']);
      markFieldsSaved(['neighborhoodFees']);
    },
    onError: () => { setSavingFields(new Set()); toast.error("Erro ao salvar taxas por bairro"); },
  });

  const syncRadiusFeesMutation = trpc.radiusFees.sync.useMutation({
    onSuccess: (updatedFees) => {
      setRadiusFees(updatedFees.map(f => ({
        id: f.id,
        maxKm: f.maxKm,
        fee: f.fee,
      })));
      setInitialRadiusFeesLoaded(true);
      clearFieldsSaving(['radiusFees']);
      markFieldsSaved(['radiusFees']);
    },
    onError: () => { setSavingFields(new Set()); toast.error("Erro ao salvar faixas de raio"); },
  });

  // Printer mutations
  const createPrinterMutation = trpc.printer.create.useMutation({
    onSuccess: () => {
      refetchPrinters();
      setIsPrinterModalOpen(false);
      resetPrinterForm();
      toast.success("Impressora adicionada com sucesso");
    },
    onError: () => toast.error("Erro ao adicionar impressora"),
  });

  const updatePrinterMutation = trpc.printer.update.useMutation({
    onSuccess: () => {
      refetchPrinters();
      setIsPrinterModalOpen(false);
      resetPrinterForm();
      toast.success("Impressora atualizada com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar impressora"),
  });

  const deletePrinterMutation = trpc.printer.delete.useMutation({
    onSuccess: () => {
      refetchPrinters();
      setPrinterDeleteConfirmOpen(false);
      setPrinterToDelete(null);
      toast.success("Impressora removida com sucesso");
    },
    onError: () => toast.error("Erro ao remover impressora"),
  });

  const savePrinterSettingsMutation = trpc.printer.saveSettings.useMutation({
    onSuccess: () => {
      // Refetch sem resetar a flag para evitar sobrescrever estado local
      refetchPrinterSettings();
      toast.success("Configurações de impressão salvas com sucesso");
    },
    onError: () => toast.error("Erro ao salvar configurações de impressão"),
  });

  const testConnectionMutation = trpc.printer.testConnection.useMutation({
    onSuccess: (result) => {
      setTestConnectionResult(result);
      setIsTestingConnection(false);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      setIsTestingConnection(false);
      setTestConnectionResult({ success: false, message: "Erro ao testar conexão" });
      toast.error("Erro ao testar conexão");
    },
  });

  const testPosPrinterMutation = trpc.printer.testPOSPrinter.useMutation({
    onSuccess: (result) => {
      setPosPrinterTestResult(result);
      setIsTestingPosPrinter(false);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      setIsTestingPosPrinter(false);
      setPosPrinterTestResult({ success: false, message: "Erro ao testar conexão" });
      toast.error("Erro ao testar conexão com POSPrinterDriver");
    },
  });

  const testDirectPrintMutation = trpc.printer.testDirectPrint.useMutation({
    onSuccess: (result) => {
      setDirectPrintTestResult(result);
      setIsTestingDirectPrint(false);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      setIsTestingDirectPrint(false);
      setDirectPrintTestResult({ success: false, message: "Erro ao testar conexão" });
      toast.error("Erro ao testar conexão com a impressora");
    },
  });

  // Printer helper functions
  const resetPrinterForm = () => {
    setPrinterName("");
    setPrinterIpAddress("");
    setPrinterPort(9100);
    setPrinterType('all');
    setPrinterCategoryIds([]);
    setPrinterIsActive(true);
    setPrinterIsDefault(false);
    setEditingPrinter(null);
    setTestConnectionResult(null);
  };

  const handleTestConnection = () => {
    if (!printerIpAddress.trim()) {
      toast.error("Informe o endereço IP para testar a conexão");
      return;
    }
    setIsTestingConnection(true);
    setTestConnectionResult(null);
    testConnectionMutation.mutate({ ipAddress: printerIpAddress, port: printerPort });
  };

  const openAddPrinterModal = () => {
    resetPrinterForm();
    setIsPrinterModalOpen(true);
  };

  const openEditPrinterModal = (printer: PrinterData) => {
    setEditingPrinter(printer);
    setPrinterName(printer.name);
    setPrinterIpAddress(printer.ipAddress);
    setPrinterPort(printer.port);
    setPrinterType((printer as any).printerType || 'all');
    setPrinterCategoryIds((printer as any).categoryIds ? JSON.parse((printer as any).categoryIds) : []);
    setPrinterIsActive(printer.isActive);
    setPrinterIsDefault(printer.isDefault);
    setIsPrinterModalOpen(true);
  };

  const handleSavePrinter = () => {
    if (!printerName.trim()) {
      toast.error("Nome da impressora é obrigatório");
      return;
    }
    if (!printerIpAddress.trim()) {
      toast.error("Endereço IP é obrigatório");
      return;
    }

    if (editingPrinter) {
      updatePrinterMutation.mutate({
        id: editingPrinter.id,
        name: printerName,
        ipAddress: printerIpAddress,
        port: printerPort,
        printerType,
        categoryIds: printerCategoryIds.length > 0 ? JSON.stringify(printerCategoryIds) : undefined,
        isActive: printerIsActive,
        isDefault: printerIsDefault,
      });
    } else {
      createPrinterMutation.mutate({
        establishmentId: establishment?.id || 0,
        name: printerName,
        ipAddress: printerIpAddress,
        port: printerPort,
        printerType,
        categoryIds: printerCategoryIds.length > 0 ? JSON.stringify(printerCategoryIds) : undefined,
        isActive: printerIsActive,
        isDefault: printerIsDefault,
      });
    }
  };

  const handleDeletePrinter = (printer: PrinterData) => {
    setPrinterToDelete(printer);
    setPrinterDeleteConfirmOpen(true);
  };

  const confirmDeletePrinter = () => {
    if (printerToDelete) {
      deletePrinterMutation.mutate({ id: printerToDelete.id });
    }
  };

  const handleSavePrinterSettings = () => {
    savePrinterSettingsMutation.mutate({
      establishmentId: establishment?.id || 0,
      autoPrintEnabled,
      printOnNewOrder,
      printOnStatusChange,
      copies: printCopies,
      showLogo: printShowLogo,
      logoUrl: printLogoUrl || null,
      showQrCode: printShowQrCode,
      headerMessage: printHeaderMessage || null,
      footerMessage: printFooterMessage || null,
      paperWidth: printPaperWidth,
      posPrinterEnabled,
      posPrinterLinkcode: posPrinterLinkcode || null,
      posPrinterNumber,
      directPrintEnabled,
      directPrintIp: directPrintIp || null,
      directPrintPort,
    });
  };

  const handleTestPosPrinter = () => {
    if (!posPrinterLinkcode.trim()) {
      toast.error("Informe o Linkcode do POSPrinterDriver");
      return;
    }
    setIsTestingPosPrinter(true);
    setPosPrinterTestResult(null);
    testPosPrinterMutation.mutate({ linkcode: posPrinterLinkcode, printerNumber: posPrinterNumber });
  };

  const handleTestDirectPrint = () => {
    if (!directPrintIp.trim()) {
      toast.error("Informe o IP da impressora");
      return;
    }
    setIsTestingDirectPrint(true);
    setDirectPrintTestResult(null);
    testDirectPrintMutation.mutate({ ip: directPrintIp, port: directPrintPort });
  };

  const handleSaveEstablishment = () => {
    if (!name.trim()) {
      toast.error("Nome do estabelecimento é obrigatório");
      return;
    }

    // Validar campos obrigatórios de endereço (apenas Rua é obrigatório)
    if (!street.trim()) {
      toast.error("Preencha o campo obrigatório: Rua");
      return;
    }

    if (establishment) {
      // Para update, enviar null explicitamente para limpar campos vazios no banco
      updateMutation.mutate({
        id: establishment.id,
        name: name.trim(),
        logo: logo || null,
        coverImage: coverImage || null,
        street: street.trim() || null,
        number: number.trim() || null,
        complement: complement.trim() || null,
        neighborhood: neighborhood.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zipCode: zipCode.trim() || null,
        latitude: latitude || null,
        longitude: longitude || null,
      });
    } else {
      // Para create, enviar undefined para campos vazios (serão ignorados)
      createMutation.mutate({
        name: name.trim(),
        logo: logo || undefined,
        coverImage: coverImage || undefined,
        street: street.trim() || undefined,
        number: number.trim() || undefined,
        complement: complement.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
      });
    }
  };

  const handleSaveServiceSettings = async () => {
    if (!establishment) {
      toast.error("Crie o estabelecimento primeiro");
      return;
    }

    // Salvar configurações do estabelecimento
    updateMutation.mutate({
      id: establishment.id,
      menuSlug: menuSlug || null,
      whatsapp: whatsapp || null,
      instagram: normalizeInstagramUsername(instagram) || null,
      acceptsCash,
      acceptsCard,
      acceptsPix,
      pixKey: pixKey || null,
      pixHolderName: pixHolderName || null,
      acceptsBoleto,
      allowsDelivery,
      allowsPickup,
      allowsDineIn,
      smsEnabled,
      deliveryTimeEnabled,
      deliveryTimeMin,
      deliveryTimeMax,
      minimumOrderEnabled,
      minimumOrderValue,
      deliveryFeeType,
      deliveryFeeFixed,
      freeDeliveryEnabled,
      freeDeliveryMinValue,
      autoAcceptOrders,
    });

    // Salvar taxas por bairro se o tipo for byNeighborhood (batch sync)
    if (deliveryFeeType === "byNeighborhood") {
      if (!neighborhoodFees.some(isNeighborhoodFeeWaitingForManualPrice)) {
        syncNeighborhoodFeesMutation.mutate({
          establishmentId: establishment.id,
          fees: neighborhoodFees
            .filter(f => f.neighborhood.trim() && (f.isFree || f.fee.trim())) // Ignorar bairros incompletos
            .map(f => ({
              id: f.id,
              neighborhood: f.neighborhood.trim(),
              fee: f.isFree ? "0.00" : f.fee,
              pinned: Boolean(f.pinned),
            })),
        });
      }
    }

    // Salvar faixas de raio se o tipo for byRadius (batch sync)
    if (deliveryFeeType === "byRadius") {
      syncRadiusFeesMutation.mutate({
        establishmentId: establishment.id,
        fees: radiusFees
          .filter(f => f.maxKm && parseFloat(f.maxKm) > 0)
          .map(f => ({
            id: f.id,
            maxKm: f.maxKm,
            fee: f.fee,
          })),
      });
    }
  };

  // Abrir modal de crop ao selecionar arquivo
  const handleFileSelect = (file: File, type: "logo" | "cover") => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validate file size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 8MB");
      return;
    }

    // Abrir modal de crop para qualquer imagem
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropType(type);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Processar imagem recortada e enviar para o servidor
  const handleCroppedImage = async (croppedBlob: Blob) => {
    try {
      toast.loading("Enviando imagem...", { id: "upload" });

      // Converter blob para base64 com compressão
      const file = new File([croppedBlob], "cropped.webp", { type: "image/webp" });
      const { base64, mimeType } = await compressImage(file);

      const result = await uploadMutation.mutateAsync({
        base64,
        mimeType,
        folder: "establishments",
        singleVersion: true,
      });

      toast.dismiss("upload");
      toast.success("Imagem enviada com sucesso!");

      if (cropType === "logo") {
        setLogo(result.url);
        // Auto-save after logo upload with blur placeholder
        if (establishment) {
          updateMutation.mutate({ id: establishment.id, logo: result.url, logoBlur: result.blurDataUrl || null });
        }
      } else {
        setCoverImage(result.url);
        // Auto-save after cover upload with blur placeholder
        if (establishment) {
          updateMutation.mutate({ id: establishment.id, coverImage: result.url, coverBlur: result.blurDataUrl || null });
        }
      }
    } catch (error) {
      toast.dismiss("upload");
      toast.error("Erro ao enviar imagem");
    }
  };

  const copyMenuLink = () => {
    // Use /api/menu/:slug for sharing - has proper OG tags for WhatsApp/Facebook previews
    const link = `${window.location.origin}/api/menu/${menuSlug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const openMenuPreview = () => {
    if (menuSlug) {
      window.open(`/menu/${menuSlug}`, "_blank");
    } else {
      toast.error("Configure o link do cardápio primeiro");
    }
  };

  // Auto-save helper: atualiza estado local + salva no servidor imediatamente
  const autoSaveField = (fields: Record<string, any>) => {
    if (!establishment) {
      toast.error("Crie o estabelecimento primeiro");
      return;
    }
    const fieldKeys = Object.keys(fields);
    markFieldsSaving(fieldKeys);
    updateMutation.mutate({ id: establishment.id, ...fields });
  };

  const handleSmsEnabledChange = (checked: boolean) => {
    if (checked && isWhatsappConnectedForSms) {
      setSmsEnabled(false);
      toast.error("Não é possível ativar as Notificações SMS enquanto o WhatsApp estiver conectado. Desconecte o WhatsApp para usar SMS.");
      return;
    }

    setSmsEnabled(checked);
    autoSaveField({ smsEnabled: checked });
  };

  // Debounce refs para auto-save de campos de texto/numéricos
  const debounceTimerRef = useRef<Record<string, NodeJS.Timeout>>({});
  const businessHoursDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const neighborhoodFeesDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const radiusFeesDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save com debounce para campos de texto/numéricos
  const autoSaveFieldDebounced = useCallback((fields: Record<string, any>, debounceKey: string, delay = 800) => {
    if (!establishment) return;
    // Mostrar spinner imediatamente
    markFieldsSaving([debounceKey]);
    // Limpar timer anterior para esta chave
    if (debounceTimerRef.current[debounceKey]) {
      clearTimeout(debounceTimerRef.current[debounceKey]);
    }
    debounceTimerRef.current[debounceKey] = setTimeout(() => {
      updateMutation.mutate({ id: establishment.id, ...fields });
      delete debounceTimerRef.current[debounceKey];
    }, delay);
  }, [establishment, updateMutation, markFieldsSaving]);

  // Auto-save debounced para horários de funcionamento
  const autoSaveBusinessHours = useCallback((hours: typeof businessHours) => {
    if (!establishment?.id) return;
    markFieldsSaving(['businessHours']);
    if (businessHoursDebounceRef.current) {
      clearTimeout(businessHoursDebounceRef.current);
    }
    businessHoursDebounceRef.current = setTimeout(() => {
      saveBusinessHoursMutation.mutate({
        establishmentId: establishment.id,
        hours: hours.map(h => ({
          dayOfWeek: h.dayOfWeek,
          isActive: h.isActive,
          openTime: h.openTime,
          closeTime: h.closeTime,
        })),
      });
      businessHoursDebounceRef.current = null;
    }, 800);
  }, [establishment, saveBusinessHoursMutation, markFieldsSaving]);

  // Auto-save debounced para taxas por bairro
  const autoSaveNeighborhoodFees = useCallback((fees: typeof neighborhoodFees) => {
    if (!establishment?.id) return;
    if (neighborhoodFeesDebounceRef.current) {
      clearTimeout(neighborhoodFeesDebounceRef.current);
      neighborhoodFeesDebounceRef.current = null;
    }

    // Linhas novas ou em edição manual não devem ser sincronizadas durante a digitação.
    // Isso evita que o sync remova a linha recém-adicionada antes do preenchimento completo.
    if (fees.some(f => f._isNew || f._isEditing)) return;

    // Quando um bairro existente deixa de ser "Grátis", o campo de preço fica
    // vazio por alguns segundos enquanto o dono digita. Não sincronizar esse
    // estado intermediário, pois o backend só representa grátis como taxa 0,00.
    if (fees.some(isNeighborhoodFeeWaitingForManualPrice)) return;

    markFieldsSaving(['neighborhoodFees']);
    neighborhoodFeesDebounceRef.current = setTimeout(() => {
      syncNeighborhoodFeesMutation.mutate({
        establishmentId: establishment.id,
        fees: fees
          .filter(f => f.neighborhood.trim() && (f.isFree || f.fee.trim()))
          .map(f => ({
            id: f.id,
            neighborhood: f.neighborhood.trim(),
            fee: f.isFree ? "0.00" : f.fee,
            pinned: Boolean(f.pinned),
          })),
      });
      neighborhoodFeesDebounceRef.current = null;
    }, 1200);
  }, [establishment, syncNeighborhoodFeesMutation, markFieldsSaving]);

  const autoSaveRadiusFees = useCallback((fees: typeof radiusFees) => {
    if (!establishment?.id) return;
    markFieldsSaving(['radiusFees']);
    if (radiusFeesDebounceRef.current) {
      clearTimeout(radiusFeesDebounceRef.current);
    }
    radiusFeesDebounceRef.current = setTimeout(() => {
      syncRadiusFeesMutation.mutate({
        establishmentId: establishment.id,
        fees: fees
          .filter(f => f.maxKm && parseFloat(f.maxKm) > 0)
          .map(f => ({
            id: f.id,
            maxKm: f.maxKm,
            fee: f.fee,
          })),
      });
      radiusFeesDebounceRef.current = null;
    }, 1200);
  }, [establishment, syncRadiusFeesMutation, markFieldsSaving]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimerRef.current).forEach(clearTimeout);
      Object.values(savedTimersRef.current).forEach(clearTimeout);
      if (businessHoursDebounceRef.current) clearTimeout(businessHoursDebounceRef.current);
      if (neighborhoodFeesDebounceRef.current) clearTimeout(neighborhoodFeesDebounceRef.current);
    };
  }, []);

  const pinnedNeighborhoodFeesCount = neighborhoodFees.filter(fee => fee.pinned).length;

  const orderedNeighborhoodFees = useMemo(() => neighborhoodFees
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      if (a.item.pinned !== b.item.pinned) return a.item.pinned ? -1 : 1;

      const aComplete = isNeighborhoodFeeComplete(a.item);
      const bComplete = isNeighborhoodFeeComplete(b.item);

      if (!a.item.pinned && aComplete !== bComplete) return aComplete ? 1 : -1;
      if (!aComplete || !bComplete) return a.index - b.index;

      return a.item.neighborhood.localeCompare(b.item.neighborhood, "pt-BR", { sensitivity: "base" });
    }), [neighborhoodFees]);

  const updateNeighborhoodFeeRow = useCallback((index: number, updater: (fee: NeighborhoodFeeRow) => NeighborhoodFeeRow, options: { autoSave?: boolean } = {}) => {
    setNeighborhoodFees(prev => {
      const updated = prev.map((fee, rowIndex) => rowIndex === index ? updater(fee) : fee);
      if (options.autoSave !== false) {
        autoSaveNeighborhoodFees(updated);
      }
      return updated;
    });
  }, [autoSaveNeighborhoodFees]);

  const addNeighborhoodFeeRow = useCallback(() => {
    setNeighborhoodFees(prev => [
      createEmptyNeighborhoodFeeRow(),
      ...prev,
    ]);
  }, []);

  const editNeighborhoodFeeRow = useCallback((index: number) => {
    setNeighborhoodFees(prev => prev.map((fee, rowIndex) => (
      rowIndex === index ? { ...fee, _isEditing: true } : fee
    )));
  }, []);

  const saveNeighborhoodFeeRow = useCallback((index: number) => {
    if (!establishment?.id) return;

    const fee = neighborhoodFees[index];
    if (!fee) return;

    const neighborhoodName = fee.neighborhood.trim();
    if (!neighborhoodName) {
      toast.error("Informe o nome do bairro antes de salvar.");
      return;
    }

    if (!fee.isFree && !fee.fee.trim()) {
      toast.error("Informe a taxa do bairro ou marque como grátis.");
      return;
    }

    if (neighborhoodFeesDebounceRef.current) {
      clearTimeout(neighborhoodFeesDebounceRef.current);
      neighborhoodFeesDebounceRef.current = null;
    }

    markFieldsSaving(['neighborhoodFees']);
    syncNeighborhoodFeesMutation.mutate({
      establishmentId: establishment.id,
      fees: neighborhoodFees
        .filter(f => f.neighborhood.trim() && (f.isFree || f.fee.trim()))
        .map(f => ({
          id: f.id,
          neighborhood: f.neighborhood.trim(),
          fee: f.isFree ? "0.00" : f.fee,
          pinned: Boolean(f.pinned),
        })),
    });
  }, [establishment?.id, neighborhoodFees, syncNeighborhoodFeesMutation, markFieldsSaving]);

  const openMobileNeighborhoodSheet = useCallback((index?: number) => {
    if (typeof index === "number") {
      const fee = neighborhoodFees[index];
      if (!fee) return;

      setNeighborhoodFees(prev => prev.map((row, rowIndex) => (
        rowIndex === index ? { ...row, _isEditing: true } : row
      )));
      setMobileNeighborhoodSheetIndex(index);
      setMobileNeighborhoodSheetDraft({ ...fee, _isEditing: true });
      return;
    }

    const emptyRow = createEmptyNeighborhoodFeeRow();
    setNeighborhoodFees(prev => [emptyRow, ...prev]);
    setMobileNeighborhoodSheetIndex(0);
    setMobileNeighborhoodSheetDraft(emptyRow);
  }, [neighborhoodFees]);

  const closeMobileNeighborhoodSheet = useCallback(() => {
    setNeighborhoodFees(prev => {
      if (mobileNeighborhoodSheetIndex === null) return prev;

      return prev
        .map((row, rowIndex) => (
          rowIndex === mobileNeighborhoodSheetIndex && !row._isNew
            ? { ...row, _isEditing: false }
            : row
        ))
        .filter((row, rowIndex) => !(rowIndex === mobileNeighborhoodSheetIndex && row._isNew));
    });
    setMobileNeighborhoodSheetIndex(null);
    setMobileNeighborhoodSheetDraft(createEmptyNeighborhoodFeeRow());
  }, [mobileNeighborhoodSheetIndex]);

  const saveMobileNeighborhoodSheet = useCallback(() => {
    if (!establishment?.id || mobileNeighborhoodSheetIndex === null) return;

    const neighborhoodName = mobileNeighborhoodSheetDraft.neighborhood.trim();
    if (!neighborhoodName) {
      toast.error("Informe o nome do bairro antes de salvar.");
      return;
    }

    if (!mobileNeighborhoodSheetDraft.isFree && !mobileNeighborhoodSheetDraft.fee.trim()) {
      toast.error("Informe a taxa do bairro ou marque como grátis.");
      return;
    }

    const normalizedDraft: NeighborhoodFeeRow = {
      ...mobileNeighborhoodSheetDraft,
      neighborhood: neighborhoodName,
      fee: mobileNeighborhoodSheetDraft.isFree ? "0.00" : mobileNeighborhoodSheetDraft.fee,
      isFree: Boolean(mobileNeighborhoodSheetDraft.isFree),
      pinned: Boolean(mobileNeighborhoodSheetDraft.pinned),
      _isNew: false,
      _isEditing: false,
    };

    const nextFees = neighborhoodFees.map((fee, rowIndex) => (
      rowIndex === mobileNeighborhoodSheetIndex ? normalizedDraft : fee
    ));

    if (neighborhoodFeesDebounceRef.current) {
      clearTimeout(neighborhoodFeesDebounceRef.current);
      neighborhoodFeesDebounceRef.current = null;
    }

    setNeighborhoodFees(nextFees);
    markFieldsSaving(['neighborhoodFees']);
    syncNeighborhoodFeesMutation.mutate({
      establishmentId: establishment.id,
      fees: nextFees
        .filter(f => f.neighborhood.trim() && (f.isFree || f.fee.trim()))
        .map(f => ({
          id: f.id,
          neighborhood: f.neighborhood.trim(),
          fee: f.isFree ? "0.00" : f.fee,
          pinned: Boolean(f.pinned),
        })),
    }, {
      onSuccess: () => {
        setMobileNeighborhoodSheetIndex(null);
        setMobileNeighborhoodSheetDraft(createEmptyNeighborhoodFeeRow());
      },
    });
  }, [establishment?.id, markFieldsSaving, mobileNeighborhoodSheetDraft, mobileNeighborhoodSheetIndex, neighborhoodFees, syncNeighborhoodFeesMutation]);

  const removeNeighborhoodFeeRow = useCallback((index: number) => {
    setNeighborhoodFees(prev => {
      const updated = prev.filter((_, rowIndex) => rowIndex !== index);
      autoSaveNeighborhoodFees(updated);
      return updated;
    });
  }, [autoSaveNeighborhoodFees]);

  const isMobileViewport = () => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;

  const openMobileFixedFeeSheet = useCallback(() => {
    setIsMobileFixedFeeSheetOpen(true);
  }, []);

  const closeMobileFixedFeeSheet = useCallback(() => {
    setIsMobileFixedFeeSheetOpen(false);
  }, []);

  const handleDeliveryFeeTypeChange = useCallback((nextType: "free" | "fixed" | "byNeighborhood" | "byRadius") => {
    setDeliveryFeeType(nextType);
    autoSaveField({ deliveryFeeType: nextType });

    if (nextType === "fixed" && isMobileViewport()) {
      openMobileFixedFeeSheet();
      return;
    }

    setIsMobileFixedFeeSheetOpen(false);
  }, [openMobileFixedFeeSheet]);

  const handleFixedFeeValueChange = useCallback((rawValue: string) => {
    const nextValue = normalizeNeighborhoodFeeInputValue(rawValue);
    setDeliveryFeeFixed(nextValue);
    autoSaveFieldDebounced({ deliveryFeeFixed: nextValue }, 'deliveryFeeFixed');
  }, [autoSaveFieldDebounced]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Get full address
  const fullAddress = [street, number].filter(Boolean).join(", ");

  // Get delivery types
  const deliveryTypes = [];
  if (allowsDelivery) deliveryTypes.push("Entrega");
  if (allowsPickup) deliveryTypes.push("Retirada");

  return (
    <AdminLayout>
      {/* Layout com Barra Lateral Secundária */}
      <div data-settings-page className="flex flex-col md:flex-row h-full overflow-hidden">
        {/* Barra Lateral Secundária - Desktop: Fixa / Mobile: Accordion no topo */}
        <div className="md:w-64 shrink-0 bg-card md:border-r border-border/50 pt-3 pb-4 px-3 md:h-full md:overflow-y-auto animate-slide-in-from-left">
          <SettingsSidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            planType={establishment?.planType}
          />
        </div>

        {/* Conteúdo Principal - Com Scroll */}
        <div className="flex-1 p-4 md:p-6 bg-muted/30 h-full overflow-y-auto">
          {/* Banner de fechamento programado - dentro do conteúdo, ao lado do menu secundário */}
          <ScheduledClosureBanner className="mb-3" />

          {/* Cabeçalho */}
          <div className="mb-4 md:mb-6">
            <PageHeader
              title="Configurações"
              description="Gerencie as configurações do seu estabelecimento"
              icon={<Settings2 className="h-6 w-6 text-blue-600" />}
            />
          </div>

          {/* Estabelecimento Section */}
          {activeSection === "estabelecimento" && (
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {/* Preview do Perfil Público + Configurações básicas - 40% */}
            <div className="w-full lg:w-[40%] lg:sticky lg:top-4 shrink-0 space-y-5">
              <SectionCard title="Preview do Perfil Público" description="Visualize como seu perfil aparece para os clientes no celular" icon={<Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />} iconBg="bg-blue-100 dark:bg-blue-500/15" className="h-full overflow-hidden" noPadding>
              {/* === PREVIEW — cópia EXATA da estrutura mobile do PublicMenu.tsx === */}
              {/* Fundo cinza claro simulando o bg do menu público mobile */}
              <div className="bg-gray-50 relative overflow-hidden">
              {/* Background de ícones de comida - reage à cor selecionada em "Cor do Background" */}
              <div
                className="absolute inset-0 opacity-[0.19] pointer-events-none z-0"
                style={{
                  backgroundImage: `url('${menuBackgroundHue === 270 ? 'https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/static-assets/bg_purple.webp' : 'https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/chat-bg-option3-dXq5isMUuMCqTpaKJbbZwr.webp'}')`,
                  backgroundSize: '400px auto',
                  backgroundRepeat: 'repeat',
                }}
              />

              {/* Cover Image — px-4 pt-4 + h-36 rounded-2xl (igual PublicMenu) */}
              <div className="px-4 pt-4 relative z-[1]">
                <div className="relative h-36 rounded-2xl overflow-hidden bg-gray-200 group/cover">
                  {coverImage ? (
                    <img loading="lazy" src={coverImage} alt="Capa" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center">
                      <UtensilsCrossed className="h-16 w-16 text-red-500/30" />
                    </div>
                  )}
                  {/* Hover overlay para remover capa */}
                  {coverImage && (
                    <button
                      onClick={() => { setCoverImage(""); if (establishment) { updateMutation.mutate({ id: establishment.id, coverImage: null, coverBlur: null }); } }}
                      className="absolute inset-0 bg-black/0 group-hover/cover:bg-black/50 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-colors duration-300 cursor-pointer"
                    >
                      <span className="text-white font-medium text-sm bg-red-500/90 px-4 py-2 rounded-lg shadow-lg">Remover capa</span>
                    </button>
                  )}
                  {/* Edit Cover Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}
                    className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
                    title="Alterar capa"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file, "cover"); }} />
                </div>
              </div>

              {/* Restaurant Info Block — px-4 -mt-16 (igual PublicMenu) */}
              <div className="px-4 relative z-[1]">
                <div className="relative -mt-16 flex flex-col pb-4">
                  {/* Badge de Entrega/Retirada — aba flutuante (mobile) — posição EXATA do PublicMenu */}
                  {deliveryTypes.length > 0 && (
                    <div className="absolute top-[116px] right-0 z-0" style={{marginTop: '-29px', marginRight: '16px'}}>
                      <div className="animate-delivery-pulse bg-red-500 text-white font-bold rounded-t-xl shadow-md flex items-center gap-1.5" style={{fontSize: '11px', paddingTop: '0px', paddingRight: '14px', paddingBottom: '10px', paddingLeft: '10px', marginTop: '21px', height: '33px', borderRadius: '12px'}}>
                        {deliveryTypes.includes("Entrega") ? (
                          <Bike className="h-3.5 w-3.5 animate-bike-ride" />
                        ) : (
                          <Package className="h-3.5 w-3.5" />
                        )}
                        {deliveryTypes.includes("Entrega") && deliveryTypes.includes("Retirada")
                          ? "Delivery e Retirada"
                          : deliveryTypes.includes("Entrega")
                            ? "Somente Delivery"
                            : "Somente Retirada"}
                      </div>
                    </div>
                  )}

                  {/* Profile Image with Note Balloon — ml-4 (igual PublicMenu) */}
                  <div className="relative z-10 ml-4">
                    {/* Balão de Nota */}
                    {publicNote && publicNoteCreatedAt && (() => {
                      const balloonStyles: Record<string, { bg: string; text: string; border: string; arrowBg: string }> = {
                        default: { bg: "bg-white", text: "text-gray-700", border: "border-gray-200", arrowBg: "bg-white border border-gray-200" },
                        ocean: { bg: "bg-gradient-to-r from-cyan-400 to-blue-500", text: "text-white", border: "border-transparent", arrowBg: "bg-blue-500" },
                        forest: { bg: "bg-gradient-to-r from-green-400 to-emerald-500", text: "text-white", border: "border-transparent", arrowBg: "bg-emerald-500" },
                        fire: { bg: "bg-gradient-to-r from-red-500 to-orange-500", text: "text-white", border: "border-transparent", arrowBg: "bg-orange-500" },
                        gold: { bg: "bg-gradient-to-r from-yellow-400 to-amber-500", text: "text-white", border: "border-transparent", arrowBg: "bg-amber-500" },
                        night: { bg: "bg-gradient-to-r from-gray-700 to-gray-900", text: "text-white", border: "border-transparent", arrowBg: "bg-gray-900" },
                        acai: { bg: "bg-gradient-to-r from-purple-600 to-purple-900", text: "text-white", border: "border-transparent", arrowBg: "bg-purple-900" },
                      };
                      const currentStyle = balloonStyles[noteStyle] || balloonStyles.default;
                      return (
                        <div className="absolute -top-14 left-0 z-20 animate-float-balloon">
                          <div className="relative">
                            <div className={cn("rounded-[20px] px-3 py-1.5 max-w-[140px] overflow-hidden", currentStyle.bg, currentStyle.border !== "border-transparent" && "border " + currentStyle.border)}>
                              <p className={cn("text-xs text-center leading-tight break-words", currentStyle.text)}>{publicNote}</p>
                            </div>
                            <div className={cn("absolute -bottom-2.5 left-4 w-3.5 h-3.5 rounded-full", currentStyle.arrowBg)}></div>
                            <div className={cn("absolute -bottom-5 left-7 w-2 h-2 rounded-full", currentStyle.arrowBg)}></div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Logo — h-28 w-28 rounded-full border-4 border-white shadow-lg (igual PublicMenu) */}
                    <div className="relative inline-block">
                      <div className={cn("h-28 w-28 rounded-full border-4 border-white shadow-lg overflow-hidden", "bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center")}>
                        {logo ? (
                          <img loading="lazy" src={logo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <UtensilsCrossed className="h-12 w-12 text-white" />
                        )}
                      </div>
                      {/* Hover overlay para remover logo */}
                      {logo && (
                        <button
                          onClick={() => { setLogo(""); if (establishment) { updateMutation.mutate({ id: establishment.id, logo: null, logoBlur: null }); } }}
                          className="absolute inset-0 rounded-full bg-black/0 hover:bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-colors duration-300 cursor-pointer z-10"
                        >
                          <span className="text-white font-medium text-[10px] leading-tight text-center">Remover<br/>foto</span>
                        </button>
                      )}
                      {/* Edit Logo Button */}
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="absolute bottom-1 right-1 p-2 bg-black/50 hover:bg-black/70 rounded-full shadow-md transition-colors z-20 text-white"
                        title="Alterar logo"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </button>
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file, "logo"); }} />
                    </div>
                  </div>

                  {/* Info card — bg-white rounded-xl p-4 shadow-sm relative z-[45] (igual PublicMenu) */}
                  <div className="bg-white rounded-xl p-4 shadow-sm relative z-[45] mt-4" style={{paddingBottom: '4px'}}>
                    <div className="flex flex-col">
                      <div className="flex-1">
                        {/* Restaurant Name, Rating and Share — EXATO do PublicMenu */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1 min-w-0">
                            {isEditingName ? (
                              <div className="flex items-center gap-1.5">
                                <Input ref={nameInputRef} value={name} onChange={(e) => setName(e.target.value)} className="h-8 w-full font-bold text-lg" autoFocus
                                  onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { setIsEditingName(false); if (establishment && name.trim() !== originalName) { updateMutation.mutate({ id: establishment.id, name: name.trim() }); } } else if (e.key === "Escape") { setName(originalName); setIsEditingName(false); } }}
                                />
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                  onClick={() => { if (name.trim()) { setIsEditingName(false); if (establishment && name.trim() !== originalName) { updateMutation.mutate({ id: establishment.id, name: name.trim() }); } } }}
                                  disabled={!name.trim()}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-500 hover:bg-red-100" onClick={() => { setName(originalName); setIsEditingName(false); }}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="group flex items-center gap-1.5 px-2 py-1 -mx-2 -my-1 rounded-md cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                                onClick={() => { setOriginalName(name); setIsEditingName(true); setTimeout(() => nameInputRef.current?.focus(), 0); }}
                              >
                                <h1 className="text-xl font-bold text-gray-900 group-hover:text-red-500 transition-colors truncate max-w-[180px]">
                                  {name || "Nome do Restaurante"}
                                </h1>
                                <Pencil className="h-3.5 w-3.5 text-gray-400 group-hover:text-red-500 transition-colors duration-200 flex-shrink-0" />
                              </div>
                            )}
                            {/* Rating */}
                            <div className="relative flex-shrink-0">
                              <div className="flex items-center gap-1 rounded-lg px-1.5 py-0.5">
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-[13px] font-semibold text-gray-800">
                                  {establishment?.rating ? Number(establishment.rating).toFixed(1) : '0.0'}
                                </span>
                                <span className="text-[13px] text-gray-500">
                                  ({establishment?.reviewCount || 0} {(establishment?.reviewCount || 0) === 1 ? 'avaliação' : 'avaliações'})
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Botão Compartilhar */}
                          <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0" title="Compartilhar">
                            <Share2 className="h-5 w-5 text-gray-500" />
                          </button>
                        </div>

                        {/* Address and More Info — EXATO do PublicMenu */}
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          {fullAddress && (
                            <>
                              <span className="flex items-center gap-1 min-w-0 flex-shrink">
                                <MapPin className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                                <span className="truncate max-w-[180px]">
                                  {fullAddress}{neighborhood ? ` - ${neighborhood}` : ''}{city ? ` - ${city}` : ''}
                                </span>
                              </span>
                              <span className="text-gray-400 flex-shrink-0">•</span>
                            </>
                          )}
                          <button className="flex items-center gap-1 text-gray-600 hover:text-red-500 font-medium transition-colors flex-shrink-0">
                            <Info className="h-3.5 w-3.5" />
                            Informações
                          </button>
                        </div>

                        {/* Status — Aberto/Fechado (igual PublicMenu) */}
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                            Aberto agora
                          </span>
                        </div>

                        {/* Ícones de Redes Sociais — inline no preview do perfil */}
                        {(whatsapp || instagram) && (
                          <div className="flex items-center gap-2 mt-1 pt-1.5 pb-1 border-t border-gray-100">
                            {whatsapp && (
                              <a
                                href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="WhatsApp"
                                className="inline-flex h-[35px] w-[35px] items-center justify-center rounded-lg bg-green-50 text-green-600 transition-colors hover:bg-green-100 hover:text-green-700"
                              >
                                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              </a>
                            )}
                            {instagram && (
                              <a
                                href={`https://instagram.com/${instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="inline-flex h-[35px] w-[35px] items-center justify-center rounded-lg bg-pink-50 text-pink-600 transition-colors hover:bg-pink-100 hover:text-pink-700"
                              >
                                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
              </SectionCard>

              {/* Configurações básicas - Link, WhatsApp, Instagram */}
              <SectionCard
                title="Configurações básicas"
                description="Link do cardápio e redes sociais"
                icon={<Settings2 className="h-5 w-5 text-primary" />}
                iconBg="bg-primary/10 dark:bg-primary/15"
                className="overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Link do cardápio */}
                  <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background p-4 dark:from-primary/10 dark:via-card dark:to-card">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <LinkIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <Label htmlFor="menuSlugEstab" className="text-sm font-semibold text-foreground">
                            Link do cardápio<SavedCheck field="menuSlug" />
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Compartilhe este endereço com seus clientes.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:justify-end">
                        <Button variant="outline" size="icon" onClick={copyMenuLink} title="Copiar link" className="h-9 w-9 rounded-xl border-border/60 bg-background/80 hover:bg-primary/5 hover:text-primary" disabled={!menuSlug}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={openMenuPreview} title="Visualizar cardápio" className="h-9 w-9 rounded-xl border-border/60 bg-background/80 hover:bg-primary/5 hover:text-primary" disabled={!menuSlug}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex min-w-0 items-stretch overflow-hidden rounded-2xl border border-border/60 bg-background transition-colors focus-within:ring-2 focus-within:ring-primary/15">
                      <div className="flex items-center gap-1.5 border-r border-border/60 bg-muted/40 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        <Globe className="h-3.5 w-3.5 text-primary" />
                        <span className="hidden sm:inline">app.mindi.com.br/menu/</span>
                        <span className="sm:hidden">/menu/</span>
                      </div>
                      <Input
                        id="menuSlugEstab"
                        value={menuSlug}
                        onChange={(e) => { const val = e.target.value.toLowerCase().replace(/[^a-z0-9_\.\-]/g, ""); setMenuSlug(val); autoSaveFieldDebounced({ menuSlug: val || null }, 'menuSlug'); }}
                        placeholder="seu_restaurante"
                        className="h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>

                  {/* WhatsApp e Instagram */}
                  <div className="grid gap-3 2xl:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 bg-background/80 p-3 transition-colors hover:border-emerald-200 dark:hover:border-emerald-500/40">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                          <Phone className="h-4 w-4" />
                        </div>
                        <Label htmlFor="whatsappEstab" className="text-sm font-semibold text-foreground">
                          WhatsApp<SavedCheck field="whatsapp" />
                        </Label>
                      </div>
                      <Input
                        id="whatsappEstab"
                        value={whatsapp}
                        onChange={(e) => { const val = e.target.value; setWhatsapp(val); autoSaveFieldDebounced({ whatsapp: val || null }, 'whatsapp'); }}
                        placeholder="+55 00 00000-0000"
                        className="mt-2 h-10 min-w-0 rounded-xl border-border/60 bg-muted/30 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/80 p-3 transition-colors hover:border-pink-200 dark:hover:border-pink-500/40">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </div>
                        <Label htmlFor="instagramEstab" className="text-sm font-semibold text-foreground">
                          Instagram<SavedCheck field="instagram" />
                        </Label>
                      </div>
                      <div className="mt-2 flex h-10 min-w-0 items-center rounded-xl border border-border/60 bg-muted/30 focus-within:ring-2 focus-within:ring-primary/20">
                        <span className={cn(
                          "pl-3 text-sm font-semibold transition-colors",
                          instagram ? "text-pink-600 dark:text-pink-400" : "text-muted-foreground"
                        )}>
                          @
                        </span>
                        <Input
                          id="instagramEstab"
                          value={instagram}
                          onChange={(e) => {
                            const rawVal = e.target.value;
                            if (isInstagramLinkValue(rawVal)) {
                              toast.error("Digite apenas o usuário do Instagram, sem link.");
                              return;
                            }
                            const val = normalizeInstagramUsername(rawVal);
                            setInstagram(val);
                            autoSaveFieldDebounced({ instagram: val || null }, 'instagram');
                          }}
                          placeholder="seurestaurante"
                          maxLength={INSTAGRAM_USERNAME_MAX_LENGTH}
                          inputMode="text"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-2 text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                    <p>
                      O link do cardápio será público. Use apenas letras minúsculas, números, hífens, underscores e pontos.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Coluna direita - 60% */}
            <div className="w-full lg:flex-1 space-y-5">
          {/* Nota do Restaurante */}
          {isFreePlan ? (
            <LockedSettingsCard
              title="Nota do Restaurante"
              description="Adicione uma nota que aparecerá como um balão acima da foto no seu Menu digital."
              unlockDescription="Personalize notas no seu cardápio"
              icon={StickyNote}
              minHeightClass="min-h-[300px]"
            />
          ) : (
          <div>
          <SectionCard title="Nota do Restaurante" description="Adicione uma nota que aparecerá como um balão acima da foto no seu Menu digital." icon={<StickyNote className="h-5 w-5 text-amber-600 dark:text-amber-400" />} iconBg="bg-amber-100 dark:bg-amber-500/15">
            <div className="space-y-4">


              {/* Campo de texto + Botão Sugestões */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="publicNote"
                      value={publicNote}
                      onChange={(e) => {
                        const val = e.target.value.slice(0, 80);
                        setPublicNote(val);
                        if (val.trim() && establishment) {
                          // Debounce auto-save da nota
                          markFieldsSaving(['publicNote']);
                          if (debounceTimerRef.current['publicNote']) clearTimeout(debounceTimerRef.current['publicNote']);
                          debounceTimerRef.current['publicNote'] = setTimeout(() => {
                            saveNoteMutation.mutate({ id: establishment.id, note: val.trim(), noteStyle, validityDays: noteValidityDays });
                            delete debounceTimerRef.current['publicNote'];
                          }, 1000);
                        }
                      }}
                      placeholder="Deixe uma nota no menu para seus clientes visualizarem"
                      maxLength={80}
                      className="h-11 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {publicNote.length}/80
                    </span>
                  </div>
                  {publicNoteCreatedAt && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!establishment) return;
                        removeNoteMutation.mutate({ id: establishment.id });
                      }}
                      disabled={removeNoteMutation.isPending}
                      className="h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-xl border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Remover Nota"
                    >
                      {removeNoteMutation.isPending ? (
                        <span className="h-4 w-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></span>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="h-11 rounded-xl border-red-500 text-red-500 hover:bg-red-50 hover:text-red-500 hover:border-red-500"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Ver sugestões de notas
                  </Button>
                </div>
              </div>

              {/* Sugestões rápidas - exibidas ao clicar no botão */}
              {showSuggestions && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-xl border border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {[
                    "Temos novidades no cardápio 👀",
                    "Hoje o tempo de entrega está reduzido 🚀",
                    "Obrigado por pedir com a gente ❤️",
                    "Estamos com alta demanda, pedimos paciência 🙏",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setPublicNote(suggestion);
                        setShowSuggestions(false);
                        // Auto-save imediato ao selecionar sugestão
                        if (establishment) {
                          markFieldsSaving(['publicNote']);
                          if (debounceTimerRef.current['publicNote']) clearTimeout(debounceTimerRef.current['publicNote']);
                          saveNoteMutation.mutate({ id: establishment.id, note: suggestion.trim(), noteStyle, validityDays: noteValidityDays });
                        }
                      }}
                      className="px-3 py-1.5 text-xs bg-card hover:bg-primary/10 hover:text-primary rounded-lg transition-colors border border-border hover:border-primary/30 shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Seleção de Estilo do Balão */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Estilo do Balão</Label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {[
                    { id: "default", name: "Padrão", bg: "bg-white", text: "text-gray-700", border: "border-gray-200", arrowBg: "bg-white border-r border-b border-gray-200" },
                    { id: "ocean", name: "Oceano", bg: "bg-gradient-to-r from-cyan-400 to-blue-500", text: "text-white", border: "border-transparent", arrowBg: "bg-blue-500" },
                    { id: "forest", name: "Floresta", bg: "bg-gradient-to-r from-green-400 to-emerald-500", text: "text-white", border: "border-transparent", arrowBg: "bg-emerald-500" },
                    { id: "fire", name: "Fogo", bg: "bg-gradient-to-r from-red-500 to-orange-500", text: "text-white", border: "border-transparent", arrowBg: "bg-orange-500" },
                    { id: "gold", name: "Dourado", bg: "bg-gradient-to-r from-yellow-400 to-amber-500", text: "text-white", border: "border-transparent", arrowBg: "bg-amber-500" },
                    { id: "night", name: "Noite", bg: "bg-gradient-to-r from-gray-700 to-gray-900", text: "text-white", border: "border-transparent", arrowBg: "bg-gray-900" },
                    { id: "acai", name: "Açaí", bg: "bg-gradient-to-r from-purple-600 to-purple-900", text: "text-white", border: "border-transparent", arrowBg: "bg-purple-900" },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => {
                        setNoteStyle(style.id);
                        // Auto-save imediato ao trocar estilo
                        if (publicNote.trim() && establishment) {
                          saveNoteMutation.mutate({ id: establishment.id, note: publicNote.trim(), noteStyle: style.id, validityDays: noteValidityDays });
                        }
                        if (publicNote) {
                          // Limpar timeout anterior se existir
                          if (previewTimeoutRef.current) {
                            clearTimeout(previewTimeoutRef.current);
                          }
                          setShowPreviewForStyle(style.id);
                          // Definir novo timeout de 5 segundos
                          previewTimeoutRef.current = setTimeout(() => {
                            setShowPreviewForStyle(null);
                            previewTimeoutRef.current = null;
                          }, 5000);
                        }
                      }}
                      className={cn(
                        "relative p-2 rounded-xl transition-colors duration-200 border-2",
                        noteStyle === style.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-border/80"
                      )}
                    >
                      <div className={cn(
                        "h-8 rounded-lg",
                        style.bg,
                        style.border !== "border-transparent" && "border " + style.border
                      )} />
                      <span className="text-[10px] mt-1 block text-center text-muted-foreground">{style.name}</span>
                      {noteStyle === style.id && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                      {/* Preview temporário do balão */}
                      {showPreviewForStyle === style.id && publicNote && (
                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="relative">
                            <div className={cn(
                              "rounded-[20px] px-3 py-2 shadow-lg w-[160px]",
                              style.bg,
                              style.border !== "border-transparent" && "border " + style.border
                            )}>
                              <p className={cn(
                                "text-xs text-center leading-tight break-words",
                                style.text
                              )}>{publicNote}</p>
                            </div>
                            <div className={cn(
                              "absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 transform rotate-45",
                              style.arrowBg
                            )}></div>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>


            </div>
          </SectionCard>
          </div>
          )}

          {/* Card de Cor do Menu Público */}
          <div>
            <SectionCard title="Cor do Background" description="Personalize a cor de fundo do seu cardápio digital" icon={<Palette className="h-5 w-5 text-red-500 dark:text-red-400" />} iconBg="bg-red-100 dark:bg-red-500/15" className="h-full">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Escolha a cor do fundo do seu menu público. O padrão é vermelho.
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {[
                    { name: 'Padrão', hue: null, bg: 'bg-red-500', border: 'border-transparent' },
                    { name: 'Açaí', hue: 270, bg: 'bg-purple-600', border: 'border-transparent' },
                  ].map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => {
                        setMenuBackgroundHue(option.hue);
                        autoSaveField({ menuBackgroundHue: option.hue });
                      }}
                      className={cn(
                        "relative p-2 rounded-xl transition-colors duration-200 border-2",
                        (menuBackgroundHue === option.hue || (menuBackgroundHue === null && option.hue === null))
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-border/80"
                      )}
                    >
                      <div className={cn(
                        "h-8 rounded-lg",
                        option.bg,
                        option.border !== "border-transparent" && "border " + option.border
                      )} />
                      <span className="text-[10px] mt-1 block text-center text-muted-foreground">{option.name}</span>
                      {(menuBackgroundHue === option.hue || (menuBackgroundHue === null && option.hue === null)) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>

            <div>
              <SectionCard title="Endereço do Estabelecimento" description="Localização exibida no cardápio público" icon={<MapPinned className="h-5 w-5 text-red-500 dark:text-red-400" />} iconBg="bg-red-100 dark:bg-red-500/15" className="h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Campos com <span className="text-red-500">*</span> são obrigatórios</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMapPicker(true)}
                      className="rounded-xl gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      {latitude && longitude ? "Mapa" : "Mapa"}
                    </Button>
                  </div>

                  {latitude && longitude && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-xl">
                      <Check className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-700">Localização definida</span>
                    </div>
                  )}

                  {/* Rua */}
                  <div>
                    <Label htmlFor="street" className="text-sm font-semibold">Rua <span className="text-red-500">*</span><SavedCheck field="street" /></Label>
                    <Input
                      id="street"
                      value={street}
                      onChange={(e) => { const val = e.target.value; setStreet(val); autoSaveFieldDebounced({ street: val.trim() || null }, 'street'); }}
                      placeholder="Nome da rua"
                      required
                      className={cn(
                        "mt-2 h-10 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20",
                        !street.trim() && "border-red-300 focus:border-red-500"
                      )}
                    />
                  </div>

                  {/* Número, Bairro, Cidade e UF */}
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-3">
                      <Label htmlFor="number" className="text-xs font-semibold">Nº<SavedCheck field="number" /></Label>
                      <Input
                        id="number"
                        value={number}
                        onChange={(e) => { const val = e.target.value; setNumber(val); autoSaveFieldDebounced({ number: val.trim() || null }, 'number'); }}
                        placeholder="123"
                        className="mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor="neighborhood" className="text-xs font-semibold">Bairro<SavedCheck field="addressNeighborhood" /></Label>
                      <Input
                        id="neighborhood"
                        value={neighborhood}
                        onChange={(e) => { const val = e.target.value; setNeighborhood(val); autoSaveFieldDebounced({ neighborhood: val.trim() || null }, 'addressNeighborhood'); }}
                        placeholder="Bairro"
                        className="mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>
                    <div className="col-span-4">
                      <Label htmlFor="city" className="text-xs font-semibold">Cidade<SavedCheck field="city" /></Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => { const val = e.target.value; setCity(val); autoSaveFieldDebounced({ city: val.trim() || null }, 'city'); }}
                        placeholder="Cidade"
                        className="mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="state" className="text-xs font-semibold">UF<SavedCheck field="state" /></Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => { const val = e.target.value; setState(val); autoSaveFieldDebounced({ state: val.trim() || null }, 'state'); }}
                        placeholder="UF"
                        className="mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>
                  </div>

                  {/* Complemento e CEP */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="complement" className="text-xs font-semibold">Complemento<SavedCheck field="complement" /></Label>
                      <Input
                        id="complement"
                        value={complement}
                        onChange={(e) => { const val = e.target.value; setComplement(val); autoSaveFieldDebounced({ complement: val.trim() || null }, 'complement'); }}
                        placeholder="Sala, Bloco, etc."
                        className="mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode" className="text-xs font-semibold">CEP<SavedCheck field="zipCode" /></Label>
                      <Input
                        id="zipCode"
                        value={zipCode}
                        onChange={(e) => { const val = e.target.value; setZipCode(val); autoSaveFieldDebounced({ zipCode: val.trim() || null }, 'zipCode'); }}
                        placeholder="00000-000"
                        className="mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>
                  </div>


                </div>
              </SectionCard>
            </div>

          </div>
          </div>
          )}

          {/* Atendimento Section */}
          {activeSection === "atendimento" && (
            <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* Coluna esquerda - Modalidades (40%) */}
          <div className="w-full lg:w-[40%] flex-shrink-0 lg:sticky lg:top-4 space-y-5">
          {/* Modalidades de atendimento + Tempo + Pedido mínimo */}
          <SectionCard title="Modalidades e entrega" description="Tipos de atendimento e configurações de entrega" icon={<Bike className="h-5 w-5 text-primary dark:text-primary" />} iconBg="bg-primary/10 dark:bg-primary/15">
            <div className="space-y-5">
              {/* Modalidades */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modalidades disponíveis<SavedCheck field="allowsDelivery" /><SavedCheck field="allowsPickup" /><SavedCheck field="allowsDineIn" /></Label>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => { const newVal = !allowsDelivery; setAllowsDelivery(newVal); autoSaveField({ allowsDelivery: newVal }); }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 transition-colors cursor-pointer",
                      allowsDelivery
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/50 bg-muted/20 hover:bg-muted/40"
                    )}
                  >
                    <Bike className={cn("h-4 w-4 shrink-0", allowsDelivery ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("font-semibold text-sm", allowsDelivery ? "text-primary" : "text-muted-foreground")}>Entrega</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { const newVal = !allowsPickup; setAllowsPickup(newVal); autoSaveField({ allowsPickup: newVal }); }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 transition-colors cursor-pointer",
                      allowsPickup
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/50 bg-muted/20 hover:bg-muted/40"
                    )}
                  >
                    <Store className={cn("h-4 w-4 shrink-0", allowsPickup ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("font-semibold text-sm", allowsPickup ? "text-primary" : "text-muted-foreground")}>Retirada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { const newVal = !allowsDineIn; setAllowsDineIn(newVal); autoSaveField({ allowsDineIn: newVal }); }}
                    className={cn(
                      "col-span-2 xl:col-span-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-colors cursor-pointer",
                      allowsDineIn
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/50 bg-muted/20 hover:bg-muted/40"
                    )}
                  >
                    <UtensilsCrossed className={cn("h-4 w-4 shrink-0", allowsDineIn ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("font-semibold text-sm", allowsDineIn ? "text-primary" : "text-muted-foreground")}>No local</span>
                  </button>
                </div>
              </div>

              {/* Tempo de entrega e Pedido mínimo empilhados */}
              <div className="grid grid-cols-1 gap-4">
                {/* Tempo de entrega */}
                <div className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-cyan-50 rounded-lg">
                        <Clock className="h-4 w-4 text-cyan-600" />
                      </div>
                      <Label className="text-sm font-semibold">Tempo de entrega<SavedCheck field="deliveryTimeEnabled" /><SavedCheck field="deliveryTimeMin" /><SavedCheck field="deliveryTimeMax" /></Label>
                    </div>
                    <Checkbox
                      checked={deliveryTimeEnabled}
                      onCheckedChange={(checked) => { const newVal = checked as boolean; setDeliveryTimeEnabled(newVal); autoSaveField({ deliveryTimeEnabled: newVal }); }}
                      className="h-4 w-4 rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                  {deliveryTimeEnabled && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={deliveryTimeMin}
                        onChange={(e) => { const val = parseInt(e.target.value) || 0; setDeliveryTimeMin(val); autoSaveFieldDebounced({ deliveryTimeMin: val }, 'deliveryTimeMin'); }}
                        className="flex-1 h-9 rounded-xl text-sm text-center"
                        min={0}
                      />
                      <span className="text-sm text-muted-foreground font-medium">a</span>
                      <Input
                        type="number"
                        value={deliveryTimeMax}
                        onChange={(e) => { const val = parseInt(e.target.value) || 0; setDeliveryTimeMax(val); autoSaveFieldDebounced({ deliveryTimeMax: val }, 'deliveryTimeMax'); }}
                        className="flex-1 h-9 rounded-xl text-sm text-center"
                        min={0}
                      />
                      <span className="text-sm text-muted-foreground font-medium">min</span>
                    </div>
                  )}
                </div>

                {/* Pedido mínimo */}
                <div className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <CreditCard className="h-4 w-4 text-amber-600" />
                      </div>
                      <Label className="text-sm font-semibold">Pedido mínimo<SavedCheck field="minimumOrderEnabled" /><SavedCheck field="minimumOrderValue" /></Label>
                    </div>
                    <Checkbox
                      checked={minimumOrderEnabled}
                      onCheckedChange={(checked) => { const newVal = checked as boolean; setMinimumOrderEnabled(newVal); autoSaveField({ minimumOrderEnabled: newVal }); }}
                      className="h-4 w-4 rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                  {minimumOrderEnabled && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">R$</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={(() => {
                          // Display formatted value with comma
                          const num = parseFloat(minimumOrderValue);
                          if (isNaN(num) || minimumOrderValue === '' || minimumOrderValue === '0') return '0,00';
                          return num.toFixed(2).replace('.', ',');
                        })()}
                        onChange={(e) => {
                          // Remove tudo que não é número
                          const digits = e.target.value.replace(/\D/g, '');
                          // Converter para valor decimal (últimos 2 dígitos são centavos)
                          const numericValue = (parseInt(digits || '0', 10) / 100);
                          const formatted = numericValue.toFixed(2);
                          setMinimumOrderValue(formatted);
                          autoSaveFieldDebounced({ minimumOrderValue: formatted }, 'minimumOrderValue');
                        }}
                        className="flex-1 h-9 rounded-xl text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Card de Agendamento de Pedidos */}
          {isLitePlan ? (
            <LockedSettingsCard
              title="Agendamento de Pedidos"
              description="Permita que seus clientes agendem pedidos para datas e horários futuros"
              unlockDescription="Permita pedidos agendados no seu cardápio"
              icon={CalendarClock}
            />
          ) : (
            <SchedulingSettings />
          )}

          {/* Card de Fechamentos Programados */}
          <div ref={scheduledClosuresCardRef} className="transition-colors duration-300">
            {isLitePlan ? (
              <LockedSettingsCard
                title="Fechamentos programados"
                description="Programe datas e regras de fechamento automático"
                unlockDescription="Automatize fechamentos por datas e regras recorrentes"
                icon={CalendarOff}
              />
            ) : (
              <ScheduledClosures />
            )}
          </div>
          </div>

          {/* Coluna direita - Pagamento/Taxa/Horários (60%) */}
          <div className="w-full lg:flex-1 space-y-5">
          {/* Formas de pagamento */}
          <div ref={paymentMethodsCardRef} className="transition-colors duration-300">
          <SectionCard title="Formas de pagamento" description="Métodos aceitos no estabelecimento" icon={<CreditCard className="h-5 w-5 text-primary dark:text-primary" />} iconBg="bg-primary/10 dark:bg-primary/15">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => { const newVal = !acceptsCash; setAcceptsCash(newVal); autoSaveField({ acceptsCash: newVal }); }}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-colors cursor-pointer",
                    acceptsCash
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <svg className={cn("h-4 w-4 shrink-0", acceptsCash ? "text-primary" : "text-muted-foreground")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <span className={cn("font-semibold text-sm", acceptsCash ? "text-primary" : "text-muted-foreground")}>Dinheiro</span>
                </button>

                <button
                  type="button"
                  onClick={() => { const newVal = !acceptsCard; setAcceptsCard(newVal); autoSaveField({ acceptsCard: newVal }); }}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-colors cursor-pointer",
                    acceptsCard
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <CreditCard className={cn("h-4 w-4 shrink-0", acceptsCard ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("font-semibold text-sm", acceptsCard ? "text-primary" : "text-muted-foreground")}>Cartão</span>
                </button>

                <button
                  type="button"
                  onClick={() => { const newVal = !acceptsPix; setAcceptsPix(newVal); autoSaveField({ acceptsPix: newVal }); }}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-colors cursor-pointer",
                    acceptsPix
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <svg className={cn("h-4 w-4 shrink-0", acceptsPix ? "text-primary" : "text-muted-foreground")} viewBox="0 0 24 24" fill="currentColor"><path d="M13.59 4.41l2.83 2.83a2 2 0 0 1 0 2.83l-2.83 2.83a2 2 0 0 1-2.83 0L7.93 10.07a2 2 0 0 1 0-2.83l2.83-2.83a2 2 0 0 1 2.83 0zm-5.66 8.49l2.83 2.83a2 2 0 0 1 0 2.83L7.93 21.39a2 2 0 0 1-2.83 0L2.27 18.56a2 2 0 0 1 0-2.83l2.83-2.83a2 2 0 0 1 2.83 0zm11.31 0l2.83 2.83a2 2 0 0 1 0 2.83l-2.83 2.83a2 2 0 0 1-2.83 0l-2.83-2.83a2 2 0 0 1 0-2.83l2.83-2.83a2 2 0 0 1 2.83 0z"/></svg>
                  <span className={cn("font-semibold text-sm", acceptsPix ? "text-primary" : "text-muted-foreground")}>Pix</span>
                </button>
              </div>

              {/* Campo de Chave Pix */}
              {acceptsPix && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-violet-200 bg-violet-50/50 space-y-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold">Pix estático</h4>
                        <span className="text-xs text-muted-foreground">— sem taxas</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Sua chave Pix será exibida ao cliente na finalização do pedido e também enviada na mensagem via WhatsApp, para que ele possa copiar e realizar o pagamento.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="pixKey" className="text-sm font-semibold">Chave Pix<SavedCheck field="pixKey" /></Label>
                        <Input
                          id="pixKey"
                          value={pixKey}
                          onChange={(e) => { const val = e.target.value; setPixKey(val); autoSaveFieldDebounced({ pixKey: val || null }, 'pixKey'); }}
                          placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                          className="rounded-xl h-9"
                        />
                        <p className="text-xs text-muted-foreground">Verifique se sua chave está correta antes de salvar.</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pixHolderName" className="text-sm font-semibold">Nome do titular<SavedCheck field="pixHolderName" /></Label>
                        <Input
                          id="pixHolderName"
                          value={pixHolderName}
                          onChange={(e) => { const val = e.target.value; setPixHolderName(val); autoSaveFieldDebounced({ pixHolderName: val || null }, 'pixHolderName'); }}
                          placeholder="Nome que aparecerá junto à chave Pix"
                          className="rounded-xl h-9"
                        />
                        <p className="text-xs text-muted-foreground">Exibido ao cliente na mensagem de pagamento via PIX.</p>
                      </div>
                    </div>
                  </div>
                  {/* Aviso Importante */}
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50/60 space-y-2 animate-[pulse-subtle_3s_ease-in-out_infinite]">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚠️</span>
                      <h4 className="text-sm font-bold text-red-500">Importante</h4>
                    </div>
                    <p className="text-xs text-red-500/80 leading-relaxed">Ao utilizar esta função, seu estabelecimento se compromete a conferir cada comprovante de pagamento recebido individualmente. Não nos responsabilizamos por fraudes decorrentes de comprovantes falsos enviados por clientes. Fique atento a tentativas de golpes.</p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
          </div>

          {/* Taxa de Entrega */}
          <SectionCard title="Taxa de entrega" description="Defina como cobrar a entrega" icon={<MapPin className="h-5 w-5 text-rose-600 dark:text-rose-400" />} iconBg="bg-rose-100 dark:bg-rose-500/15">
            <div className="space-y-4">
              {/* Opções de taxa - cards selecionáveis */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => handleDeliveryFeeTypeChange("free")}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-colors cursor-pointer",
                    deliveryFeeType === "free"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <Bike className={cn("h-4 w-4 shrink-0", deliveryFeeType === "free" ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("font-semibold text-sm", deliveryFeeType === "free" ? "text-primary" : "text-muted-foreground")}>Grátis</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeliveryFeeTypeChange("fixed")}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-colors cursor-pointer",
                    deliveryFeeType === "fixed"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <CreditCard className={cn("h-4 w-4 shrink-0", deliveryFeeType === "fixed" ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("font-semibold text-sm", deliveryFeeType === "fixed" ? "text-primary" : "text-muted-foreground")}>Fixa</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeliveryFeeTypeChange("byNeighborhood")}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-colors cursor-pointer",
                    deliveryFeeType === "byNeighborhood"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <MapPin className={cn("h-4 w-4 shrink-0", deliveryFeeType === "byNeighborhood" ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("font-semibold text-sm", deliveryFeeType === "byNeighborhood" ? "text-primary" : "text-muted-foreground")}>Por Bairros</span>
                </button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="block" tabIndex={isDeliveryKmPremiumLocked ? 0 : -1}>
                      <button
                        type="button"
                        disabled={isDeliveryKmPremiumLocked}
                        aria-disabled={isDeliveryKmPremiumLocked}
                        onClick={() => {
                          if (isDeliveryKmPremiumLocked) {
                            return;
                          }
                          if (!latitude || !longitude) {
                            toast.info("Defina a localização do estabelecimento primeiro");
                            setShowMapPicker(true);
                            // Set pending delivery fee type to apply after map selection
                            setPendingRadiusActivation(true);
                            return;
                          }
                          handleDeliveryFeeTypeChange("byRadius");
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 p-3 rounded-xl border-2 transition-colors",
                          isDeliveryKmPremiumLocked
                            ? "cursor-not-allowed border-border/50 bg-muted/30 opacity-70 grayscale"
                            : "cursor-pointer",
                          !isDeliveryKmPremiumLocked && deliveryFeeType === "byRadius"
                            ? "border-primary bg-primary/5 shadow-sm"
                            : !isDeliveryKmPremiumLocked
                              ? "border-border/50 bg-muted/20 hover:bg-muted/40"
                              : "border-border/50 bg-muted/30"
                        )}
                      >
                        <Crosshair className={cn("h-4 w-4 shrink-0", !isDeliveryKmPremiumLocked && deliveryFeeType === "byRadius" ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("font-semibold text-sm", !isDeliveryKmPremiumLocked && deliveryFeeType === "byRadius" ? "text-primary" : "text-muted-foreground")}>Por (Km)</span>
                        {isDeliveryKmPremiumLocked && <Lock className="ml-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                      </button>
                    </span>
                  </TooltipTrigger>
                  {isDeliveryKmPremiumLocked && (
                    <TooltipContent
                      side="top"
                      className="border-0 bg-gray-950 px-4 py-3 text-left text-sm text-white shadow-2xl"
                    >
                      <div className="font-semibold text-white">Taxa por quilômetro</div>
                      <div className="text-gray-300">
                        Disponível nos planos <span className="font-semibold text-blue-400">Essencial</span> e <span className="font-semibold text-blue-400">Pro</span>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>

              {/* Campo de valor fixo */}
              {deliveryFeeType === "fixed" && (
                <>
                  <div className="sm:hidden p-4 rounded-xl border border-red-100 bg-red-50/40">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Label className="text-sm font-semibold text-gray-900">Taxa fixa configurada<SavedCheck field="deliveryFeeFixed" /></Label>
                        <p className="mt-1 text-lg font-bold text-red-500">R$ {formatNeighborhoodFeeInputValue(deliveryFeeFixed)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openMobileFixedFeeSheet}
                        className="h-9 shrink-0 rounded-xl border-red-200 bg-white px-4 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        Editar
                      </Button>
                    </div>
                  </div>

                  <div className="hidden sm:block p-4 rounded-xl border border-border/40 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-semibold">Valor da taxa:<SavedCheck field="deliveryFeeFixed" /></Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          value={deliveryFeeFixed}
                          onChange={(e) => { const val = e.target.value; setDeliveryFeeFixed(val); autoSaveFieldDebounced({ deliveryFeeFixed: val }, 'deliveryFeeFixed'); }}
                          className="w-24 h-9 rounded-xl text-sm"
                          min={0}
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {isMobileFixedFeeSheetOpen && deliveryFeeType === "fixed" && (
                <div
                  className="fixed inset-0 z-[100] flex items-end sm:hidden"
                  onTouchMove={event => {
                    const target = event.target as HTMLElement;
                    const scrollableParent = target.closest('[data-fixed-fee-scrollable="true"]');
                    if (!scrollableParent) {
                      event.preventDefault();
                    }
                  }}
                >
                  <div
                    className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
                    onClick={closeMobileFixedFeeSheet}
                  />

                  <div
                    className="relative bg-gray-200 rounded-t-[30px] overflow-hidden md:rounded-[30px] shadow-2xl w-full md:max-w-[520px] md:mx-4 max-h-[80vh] overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 flex flex-col"
                    style={{ touchAction: "pan-y" }}
                  >
                    <div
                      className="flex-shrink-0 bg-gradient-to-r from-red-500 to-red-500 px-5 flex items-center justify-between overflow-hidden"
                      style={{
                        paddingTop: "12px",
                        paddingBottom: "12px",
                        height: "67px",
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 bg-white/20 rounded-lg flex-shrink-0">
                          <CreditCard className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-base font-bold text-white leading-tight truncate">Taxa fixa</h2>
                          <p className="text-xs text-white/80">Valor da entrega</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={closeMobileFixedFeeSheet}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex-shrink-0"
                        aria-label="Fechar taxa fixa"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>

                    <div
                      className="p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain"
                      style={{
                        backgroundColor: "#ffffff",
                        maxHeight: "calc(80vh - 67px - 96px)",
                        WebkitOverflowScrolling: "touch",
                      }}
                      data-fixed-fee-scrollable="true"
                    >
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Informe o valor único que será cobrado em todos os pedidos de entrega.
                      </p>

                      <div className="space-y-2">
                        <label htmlFor="mobile-fixed-delivery-fee" className="block text-sm font-bold text-gray-900">
                          Valor da taxa
                        </label>
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-bold text-gray-500">R$</span>
                          <input
                            id="mobile-fixed-delivery-fee"
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9,.]*"
                            placeholder="0,00"
                            value={formatNeighborhoodFeeInputValue(deliveryFeeFixed)}
                            onChange={event => handleFixedFeeValueChange(event.target.value)}
                            className="w-full py-3 pl-12 pr-4 bg-gray-100 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder:text-gray-400"
                            autoFocus
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t px-6 py-5 space-y-3" style={{ backgroundColor: "#ffffff" }}>
                      <button
                        type="button"
                        onClick={() => {
                          autoSaveField({ deliveryFeeFixed });
                          closeMobileFixedFeeSheet();
                        }}
                        disabled={updateMutation.isPending}
                        className="w-full py-3.5 bg-red-500 hover:bg-red-600 disabled:opacity-70 disabled:hover:bg-red-500 text-white font-semibold rounded-xl transition-colors text-base flex items-center justify-center gap-2"
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Salvar taxa
                      </button>
                      <button
                        type="button"
                        onClick={closeMobileFixedFeeSheet}
                        className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-base"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de bairros */}
              {deliveryFeeType === "byNeighborhood" && (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <Label className="text-sm font-semibold">Bairros e taxas<SavedCheck field="neighborhoodFees" /></Label>
                      <span className="text-xs text-muted-foreground">{pinnedNeighborhoodFeesCount}/{MAX_PINNED_NEIGHBORHOOD_FEES} bairros fixados no topo</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openMobileNeighborhoodSheet()}
                        className="sm:hidden rounded-xl h-8 text-xs gap-1"
                      >
                        + Adicionar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addNeighborhoodFeeRow}
                        className="hidden sm:inline-flex rounded-xl h-8 text-xs gap-1"
                      >
                        + Adicionar bairro
                      </Button>
                    </div>
                  </div>

                  {neighborhoodFees.length > 3 && (
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Buscar bairro..."
                        value={neighborhoodSearch}
                        onChange={(e) => setNeighborhoodSearch(e.target.value)}
                        className="h-8 pl-8 rounded-lg text-sm"
                      />
                    </div>
                  )}

                  {neighborhoodFees.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      Nenhum bairro cadastrado. Clique em "+ Adicionar bairro" para começar.
                    </p>
                  ) : (
                    <>
                    <div className="sm:hidden space-y-2 max-h-72 overflow-y-auto pr-1">
                      {orderedNeighborhoodFees.map(({ item, index }) => {
                        const isIncomplete = !isNeighborhoodFeeComplete(item);
                        if (neighborhoodSearch && !isIncomplete && !item.neighborhood.toLowerCase().includes(neighborhoodSearch.toLowerCase())) {
                          return null;
                        }
                        const isPinDisabled = !item.pinned && pinnedNeighborhoodFeesCount >= MAX_PINNED_NEIGHBORHOOD_FEES;
                        const feeLabel = item.isFree ? "Grátis" : `R$ ${item.fee || "0,00"}`;

                        return (
                          <div key={`mobile-${item.id ?? `new-neighborhood-${index}`}`} className={cn(
                            "rounded-2xl border border-border/40 bg-white/80 p-3 shadow-sm space-y-3",
                            item.pinned && "border-amber-300 bg-amber-50/70"
                          )}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {item.neighborhood || "Novo bairro"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.pinned ? "Fixado no topo" : "Bairro não fixado"} · {feeLabel}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant={item.pinned ? "secondary" : "ghost"}
                                size="icon"
                                disabled={isPinDisabled}
                                title={item.pinned ? "Desafixar bairro" : isPinDisabled ? "Limite de 5 bairros fixados atingido" : "Fixar bairro no topo"}
                                onClick={() => {
                                  if (isPinDisabled) {
                                    toast.error("Você pode fixar até 5 bairros no topo.");
                                    return;
                                  }
                                  updateNeighborhoodFeeRow(index, (fee) => ({ ...fee, pinned: !fee.pinned }));
                                }}
                                className={cn(
                                  "h-9 w-9 shrink-0 rounded-xl",
                                  item.pinned ? "text-amber-700 bg-amber-100 hover:bg-amber-200" : "text-muted-foreground hover:text-amber-700 hover:bg-amber-50"
                                )}
                                aria-label={item.pinned ? `Desafixar bairro ${item.neighborhood || index + 1}` : `Fixar bairro ${item.neighborhood || index + 1}`}
                              >
                                <Pin className={cn("h-4 w-4", item.pinned && "fill-current")} />
                              </Button>
                            </div>
                            {isIncomplete && (
                              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                Complete o nome e a taxa no formulário para salvar este bairro.
                              </p>
                            )}
                            <div className="grid grid-cols-[1fr_auto] gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openMobileNeighborhoodSheet(index)}
                                className="h-10 rounded-xl gap-2"
                              >
                                <Pencil className="h-4 w-4" />
                                {isIncomplete ? "Preencher" : "Editar"}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeNeighborhoodFeeRow(index)}
                                className="h-10 w-10 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                                aria-label={item.neighborhood ? `Remover bairro ${item.neighborhood}` : "Remover bairro"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      {neighborhoodSearch && neighborhoodFees.filter(f => !isNeighborhoodFeeComplete(f) || f.neighborhood.toLowerCase().includes(neighborhoodSearch.toLowerCase())).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">Nenhum bairro encontrado para "{neighborhoodSearch}"</p>
                      )}
                    </div>
                    <div className="hidden sm:block space-y-2 max-h-64 overflow-y-auto">
                      {orderedNeighborhoodFees.map(({ item, index }) => {
                        // Filtrar por pesquisa, mantendo linhas novas/incompletas visíveis durante o preenchimento
                        const isIncomplete = !isNeighborhoodFeeComplete(item);
                        if (neighborhoodSearch && !isIncomplete && !item.neighborhood.toLowerCase().includes(neighborhoodSearch.toLowerCase())) {
                          return null;
                        }
                        const isPinDisabled = !item.pinned && pinnedNeighborhoodFeesCount >= MAX_PINNED_NEIGHBORHOOD_FEES;
                        const isRowEditable = Boolean(item._isNew || item._isEditing);
                        const isSavingNeighborhoodFees = syncNeighborhoodFeesMutation.isPending;
                        return (
                        <div key={item.id ?? `new-neighborhood-${index}`} className={cn(
                          "flex flex-col gap-2 p-2 bg-white/60 rounded-lg border border-border/30",
                          item.pinned && "border-amber-300 bg-amber-50/60"
                        )}>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant={item.pinned ? "secondary" : "ghost"}
                              size="icon"
                              disabled={isPinDisabled}
                              title={item.pinned ? "Desafixar bairro" : isPinDisabled ? "Limite de 5 bairros fixados atingido" : "Fixar bairro no topo"}
                              onClick={() => {
                                if (isPinDisabled) {
                                  toast.error("Você pode fixar até 5 bairros no topo.");
                                  return;
                                }
                                updateNeighborhoodFeeRow(index, (fee) => ({ ...fee, pinned: !fee.pinned }));
                              }}
                              className={cn(
                                "h-8 w-8 shrink-0 rounded-lg",
                                item.pinned ? "text-amber-700 bg-amber-100 hover:bg-amber-200" : "text-muted-foreground hover:text-amber-700 hover:bg-amber-50"
                              )}
                              aria-label={item.pinned ? `Desafixar bairro ${item.neighborhood || index + 1}` : `Fixar bairro ${item.neighborhood || index + 1}`}
                            >
                              <Pin className={cn("h-3.5 w-3.5", item.pinned && "fill-current")} />
                            </Button>
                            <Input
                              placeholder="Nome do bairro"
                              value={item.neighborhood}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateNeighborhoodFeeRow(index, (fee) => ({ ...fee, neighborhood: value }), { autoSave: false });
                              }}
                              disabled={!isRowEditable}
                              className="min-w-0 flex-1 h-8 rounded-lg text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            />
                            <div className="flex shrink-0 items-center gap-2">
                              {!item.isFree && (
                                <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground font-medium">R$</span>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  placeholder="0,00"
                                  value={item.fee ? formatNeighborhoodFeeInputValue(item.fee) : ""}
                                  onChange={(e) => {
                                    const nextFee = normalizeNeighborhoodFeeInputValue(e.target.value);
                                    updateNeighborhoodFeeRow(index, (fee) => ({ ...fee, fee: nextFee, isFree: false }), { autoSave: false });
                                  }}
                                  disabled={!isRowEditable}
                                  className="w-24 h-8 rounded-lg text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                  aria-label={`Taxa de entrega do bairro ${item.neighborhood || index + 1}`}
                                />
                                </div>
                              )}
                              <Button
                              type="button"
                              variant={item.isFree ? "secondary" : "outline"}
                              size="sm"
                              disabled={!isRowEditable}
                              onClick={() => updateNeighborhoodFeeRow(index, (fee) => (
                                fee.isFree
                                  ? { ...fee, isFree: false, fee: "" }
                                  : { ...fee, fee: "0.00", isFree: true }
                              ), { autoSave: false })}
                              className={cn(
                                "h-8 shrink-0 rounded-lg text-xs gap-1",
                                item.isFree && "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              )}
                              aria-label={item.isFree
                                ? (item.neighborhood ? `Remover gratuidade do bairro ${item.neighborhood}` : "Remover gratuidade do bairro")
                                : (item.neighborhood ? `Marcar bairro ${item.neighborhood} como grátis` : "Marcar bairro como grátis")
                              }
                            >
                              <Gift className="h-3.5 w-3.5" />
                              Grátis
                            </Button>
                            <Button
                              type="button"
                              variant={isRowEditable ? "default" : "outline"}
                              size="sm"
                              onClick={() => isRowEditable ? saveNeighborhoodFeeRow(index) : editNeighborhoodFeeRow(index)}
                              disabled={isSavingNeighborhoodFees}
                              className="h-8 shrink-0 rounded-lg text-xs gap-1"
                              aria-label={isRowEditable
                                ? (item.neighborhood ? `Salvar bairro ${item.neighborhood}` : "Salvar bairro")
                                : (item.neighborhood ? `Editar bairro ${item.neighborhood}` : "Editar bairro")
                              }
                            >
                              {isSavingNeighborhoodFees && isRowEditable ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : isRowEditable ? (
                                <Save className="h-3.5 w-3.5" />
                              ) : (
                                <Pencil className="h-3.5 w-3.5" />
                              )}
                              {isRowEditable ? "Salvar" : "Editar"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeNeighborhoodFeeRow(index)}
                              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                              aria-label={item.neighborhood ? `Remover bairro ${item.neighborhood}` : "Remover bairro"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            </div>
                          </div>
                          {isIncomplete && (
                            <span className="pl-10 text-[11px] text-muted-foreground">Preencha bairro e taxa, ou marque como grátis, e clique em Salvar.</span>
                          )}
                        </div>
                        );
                      })}
                      {neighborhoodSearch && neighborhoodFees.filter(f => !isNeighborhoodFeeComplete(f) || f.neighborhood.toLowerCase().includes(neighborhoodSearch.toLowerCase())).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">Nenhum bairro encontrado para "{neighborhoodSearch}"</p>
                      )}
                    </div>
                    </>
                  )}

                  {mobileNeighborhoodSheetIndex !== null && (
                    <div
                      className="fixed inset-0 z-[100] flex items-end sm:hidden"
                      onTouchMove={event => {
                        const target = event.target as HTMLElement;
                        const scrollableParent = target.closest('[data-neighborhood-scrollable="true"]');
                        if (!scrollableParent) {
                          event.preventDefault();
                        }
                      }}
                    >
                      {/* Backdrop - mesmo código base do bottom sheet do menu público */}
                      <div
                        className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
                        onClick={closeMobileNeighborhoodSheet}
                      />

                      {/* Modal - Bottom Sheet no mobile, mesmo shell usado no menu público */}
                      <div
                        className="relative bg-gray-200 rounded-t-[30px] overflow-hidden md:rounded-[30px] shadow-2xl w-full md:max-w-[520px] md:mx-4 max-h-[80vh] overflow-hidden overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 flex flex-col"
                        style={{ touchAction: "pan-y" }}
                      >
                        {/* Header - estilo vermelho, mesma altura do modal do menu público */}
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
                                {mobileNeighborhoodSheetDraft.id ? "Editar bairro" : "Adicionar bairro"}
                              </h2>
                              <p className="text-xs text-white/80">Bairros e taxas</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={closeMobileNeighborhoodSheet}
                            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex-shrink-0"
                            aria-label="Fechar formulário de bairro"
                          >
                            <X className="h-4 w-4 text-white" />
                          </button>
                        </div>

                        <div
                          className="p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain"
                          style={{
                            backgroundColor: "#ffffff",
                            maxHeight: "calc(80vh - 67px - 146px)",
                            WebkitOverflowScrolling: "touch",
                          }}
                          data-neighborhood-scrollable="true"
                        >
                          <p className="text-sm text-gray-500 leading-relaxed">
                            Preencha o nome do bairro e escolha se a entrega será grátis ou terá uma taxa própria.
                          </p>

                          <div className="space-y-2">
                            <label htmlFor="mobile-neighborhood-name" className="block text-sm font-bold text-gray-900">
                              Nome do bairro
                            </label>
                            <input
                              id="mobile-neighborhood-name"
                              type="text"
                              placeholder="Ex.: Centro"
                              value={mobileNeighborhoodSheetDraft.neighborhood}
                              onChange={event => setMobileNeighborhoodSheetDraft(prev => ({ ...prev, neighborhood: event.target.value }))}
                              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder:text-gray-400"
                              autoFocus
                            />
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="mobile-neighborhood-fee" className="block text-sm font-bold text-gray-900">
                              Taxa de entrega
                            </label>
                            <div className="relative">
                              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-bold text-gray-500">R$</span>
                              <input
                                id="mobile-neighborhood-fee"
                                type="text"
                                inputMode="decimal"
                                pattern="[0-9,.]*"
                                placeholder="0,00"
                                value={mobileNeighborhoodSheetDraft.isFree ? "0,00" : (mobileNeighborhoodSheetDraft.fee ? formatNeighborhoodFeeInputValue(mobileNeighborhoodSheetDraft.fee) : "")}
                                disabled={Boolean(mobileNeighborhoodSheetDraft.isFree)}
                                onChange={event => {
                                  const nextFee = normalizeNeighborhoodFeeInputValue(event.target.value);
                                  setMobileNeighborhoodSheetDraft(prev => ({ ...prev, fee: nextFee, isFree: false }));
                                }}
                                className="w-full py-3 pl-12 pr-4 bg-gray-100 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder:text-gray-400 disabled:opacity-70"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setMobileNeighborhoodSheetDraft(prev => (
                                prev.isFree ? { ...prev, isFree: false, fee: "" } : { ...prev, isFree: true, fee: "0.00" }
                              ))}
                              className={cn(
                                "flex-1 px-4 py-2.5 text-left rounded-lg flex items-center justify-center gap-2 transition-colors border-2 font-medium text-sm",
                                mobileNeighborhoodSheetDraft.isFree
                                  ? "bg-red-50 border-red-300 text-red-500 shadow-sm"
                                  : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300"
                              )}
                            >
                              <Gift className="h-4 w-4" />
                              Grátis
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!mobileNeighborhoodSheetDraft.pinned && pinnedNeighborhoodFeesCount >= MAX_PINNED_NEIGHBORHOOD_FEES) {
                                  toast.error("Você pode fixar até 5 bairros no topo.");
                                  return;
                                }
                                setMobileNeighborhoodSheetDraft(prev => ({ ...prev, pinned: !prev.pinned }));
                              }}
                              className={cn(
                                "flex-1 px-4 py-2.5 text-left rounded-lg flex items-center justify-center gap-2 transition-colors border-2 font-medium text-sm",
                                mobileNeighborhoodSheetDraft.pinned
                                  ? "bg-red-50 border-red-300 text-red-500 shadow-sm"
                                  : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300"
                              )}
                            >
                              <Pin className={cn("h-4 w-4", mobileNeighborhoodSheetDraft.pinned && "fill-current")} />
                              Fixar
                            </button>
                          </div>
                        </div>

                        {/* Footer */}
                        <div
                          className="border-t px-6 py-5 space-y-3"
                          style={{ backgroundColor: "#ffffff" }}
                        >
                          <button
                            type="button"
                            onClick={saveMobileNeighborhoodSheet}
                            disabled={syncNeighborhoodFeesMutation.isPending}
                            className="w-full py-3.5 bg-red-500 hover:bg-red-600 disabled:opacity-70 disabled:hover:bg-red-500 text-white font-semibold rounded-xl transition-colors text-base flex items-center justify-center gap-2"
                          >
                            {syncNeighborhoodFeesMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Salvar bairro
                          </button>
                          <button
                            type="button"
                            onClick={closeMobileNeighborhoodSheet}
                            className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-base"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Faixas de distância por raio */}
              {!isDeliveryKmPremiumLocked && deliveryFeeType === "byRadius" && (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Faixas de distância<SavedCheck field="radiusFees" /></Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRadiusFees([...radiusFees, { maxKm: "", fee: "0" }])}
                      className="rounded-xl h-8 text-xs gap-1"
                    >
                      + Adicionar faixa
                    </Button>
                  </div>

                  {radiusFees.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      Nenhuma faixa cadastrada. Clique em "+ Adicionar faixa" para começar.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {radiusFees.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-white/60 rounded-lg border border-border/30">
                          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Até</span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.maxKm}
                            onChange={(e) => {
                              const updated = [...radiusFees];
                              updated[index].maxKm = e.target.value;
                              setRadiusFees(updated);
                              autoSaveRadiusFees(updated);
                            }}
                            className="w-20 h-8 rounded-lg text-sm"
                            min={0}
                            step="0.1"
                          />
                          <span className="text-xs text-muted-foreground font-medium">km</span>
                          <div className="flex-1" />
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground font-medium">R$</span>
                            <Input
                              type="number"
                              placeholder="0"
                              value={item.fee}
                              onChange={(e) => {
                                const updated = [...radiusFees];
                                updated[index].fee = e.target.value;
                                setRadiusFees(updated);
                                autoSaveRadiusFees(updated);
                              }}
                              className="w-20 h-8 rounded-lg text-sm"
                              min={0}
                              step="0.01"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const updated = radiusFees.filter((_, i) => i !== index);
                              setRadiusFees(updated);
                              autoSaveRadiusFees(updated);
                            }}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Indicador de localização */}
                  {latitude && longitude ? (
                    <div className="flex items-center justify-between p-2.5 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-xs text-green-700 font-medium">Localização do restaurante definida</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMapPicker(true)}
                        className="h-7 text-xs text-green-700 hover:text-green-800 hover:bg-green-100 gap-1 px-2"
                      >
                        <MapPin className="h-3 w-3" />
                        Alterar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-xs text-amber-700 font-medium">Localização não definida</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMapPicker(true)}
                        className="h-7 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100 gap-1 px-2"
                      >
                        <MapPin className="h-3 w-3" />
                        Definir localização
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Entrega Grátis acima de valor mínimo */}
          {isLitePlan ? (
            <LockedSettingsCard
              title="Entrega grátis acima de valor"
              description="Incentive seus clientes a pedir mais e aumente o ticket médio oferecendo entrega grátis"
              unlockDescription="Configure entrega grátis automática por valor mínimo"
              icon={Truck}
            />
          ) : deliveryFeeType !== "free" ? (
          <SectionCard title="Entrega grátis acima de valor" description="Incentive seus clientes a pedir mais e aumente o ticket médio oferecendo entrega grátis" icon={<Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />} iconBg="bg-emerald-100 dark:bg-emerald-500/15">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">Ativar entrega grátis por valor mínimo</p>
                  <p className="text-xs text-muted-foreground">Quando o subtotal do pedido atingir o valor definido, a taxa de entrega será zerada automaticamente</p>
                </div>
                <Switch
                  checked={freeDeliveryEnabled}
                  onCheckedChange={(checked) => { setFreeDeliveryEnabled(checked); autoSaveField({ freeDeliveryEnabled: checked }); }}
                />
              </div>
              {freeDeliveryEnabled && (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-500/5">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm font-semibold">Valor mínimo para entrega grátis:</Label>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        value={freeDeliveryMinValue}
                        onChange={(e) => { const val = e.target.value; setFreeDeliveryMinValue(val); autoSaveFieldDebounced({ freeDeliveryMinValue: val }, 'freeDeliveryMinValue'); }}
                        className="w-24 h-9 rounded-xl text-sm"
                        min={0}
                        step="0.01"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2">
                    Pedidos com subtotal a partir de R$ {parseFloat(freeDeliveryMinValue || "0").toFixed(2)} terão entrega grátis. O cliente verá uma barra de progresso no carrinho.
                  </p>
                </div>
              )}
            </div>
          </SectionCard>
          ) : null}

          {/* Notificações SMS */}
          {isLitePlan ? (
            <LockedSettingsCard
              title="Notificações SMS"
              description="Envie SMS automáticos ao cliente em cada etapa do pedido"
              unlockDescription="Envie SMS automáticos aos seus clientes"
              icon={MessageSquare}
            />
          ) : (
          <SectionCard title="Notificações SMS" description="Envie SMS automáticos ao cliente em cada etapa do pedido" icon={<MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />} iconBg="bg-blue-100 dark:bg-blue-500/15">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl border border-border/30">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">Notificações SMS automáticas</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Quando ativado, o cliente receberá SMS automáticos nas seguintes etapas: pedido aceito, pedido pronto e pedido cancelado.
                      </p>
                    </div>
                    <Switch
                      checked={smsEnabled}
                      onCheckedChange={handleSmsEnabledChange}
                    />
                  </div>
                  {isWhatsappConnectedForSms && (
                    <div className="mt-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                      <p className="text-xs font-medium">
                        O WhatsApp está conectado. Para evitar envio duplicado ao cliente, as Notificações SMS ficam desativadas enquanto o WhatsApp estiver ativo.
                      </p>
                    </div>
                  )}
                  {smsEnabled && !isWhatsappConnectedForSms && (
                    <div className="mt-3 space-y-2">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">
                          <strong>Pedido aceito:</strong> "{name || 'Seu Restaurante'}: Ola! Seu pedido #P5 (R$20,00) foi confirmado e ja esta sendo preparado. Obrigado pela preferencia!"
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          <strong>Pedido pronto:</strong> "{name || 'Seu Restaurante'}: Seu pedido esta saindo para entrega."
                        </p>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-500">
                        <p className="text-xs text-red-500 dark:text-red-300">
                          <strong>Pedido cancelado:</strong> "{name || 'Seu Restaurante'}: Infelizmente seu pedido #P5 foi cancelado. Entre em contato conosco para mais informacoes."
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>
          )}

          {/* Horários de Funcionamento */}
          <div id="horarios-funcionamento" ref={businessHoursCardRef} className="scroll-mt-24">
          <SectionCard title="Horários de funcionamento" description="Defina quando seu estabelecimento está aberto" icon={<Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />} iconBg="bg-cyan-100 dark:bg-cyan-500/15">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                O menu público exibirá automaticamente se o restaurante está aberto ou fechado.
              </p>

              {/* Fuso horário */}
              <div className="flex flex-col gap-3 p-4 rounded-xl border border-border/40 bg-muted/20 sm:flex-row sm:items-center">
                <div className="flex w-full min-w-0 items-start gap-3 sm:flex-1">
                  <div className="shrink-0 p-2 bg-cyan-50 rounded-lg">
                    <Globe className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Label className="flex flex-wrap items-center gap-1 text-sm font-semibold leading-tight">Fuso horário<SavedCheck field="timezone" /></Label>
                    <p className="mt-1 text-xs leading-snug text-muted-foreground">Todos os horários serão baseados neste fuso.</p>
                  </div>
                </div>
                <select
                  value={timezone}
                  onChange={(e) => { const val = e.target.value; setTimezone(val); autoSaveField({ timezone: val }); }}
                  className="h-10 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:h-9 sm:w-[240px] sm:shrink-0"
                >
                  {Object.entries(
                    SUPPORTED_TIMEZONES.reduce((acc, tz) => {
                      if (!acc[tz.group]) acc[tz.group] = [];
                      acc[tz.group].push(tz);
                      return acc;
                    }, {} as Record<string, typeof SUPPORTED_TIMEZONES[number][]>)
                  ).map(([group, tzs]) => (
                    <optgroup key={group} label={group}>
                      {tzs.map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                {[
                  { day: 0, name: "Domingo", shortName: "Dom." },
                  { day: 1, name: "Segunda-feira", shortName: "Seg." },
                  { day: 2, name: "Terça-feira", shortName: "Ter." },
                  { day: 3, name: "Quarta-feira", shortName: "Qua." },
                  { day: 4, name: "Quinta-feira", shortName: "Qui." },
                  { day: 5, name: "Sexta-feira", shortName: "Sex." },
                  { day: 6, name: "Sábado", shortName: "Sáb." },
                ].map(({ day, name, shortName }) => {
                  const hourData = businessHours.find(h => h.dayOfWeek === day);
                  const closureInfos = closedDaysMap[day];
                  const hasScheduledClosure = closureInfos && closureInfos.length > 0;
                  // Verificar se é regra "every_*" (sempre fecha) vs "last_*/first_*" (parcial)
                  const hasAlwaysClosure = closureInfos?.some(c => c.ruleLabel.startsWith("Tod"));
                  const isToday = new Date().getDay() === day;
                  return (
                    <div
                      key={day}
                      className={cn(
                        "flex flex-col gap-1 p-3.5 rounded-xl border transition-colors",
                        hasScheduledClosure
                          ? "border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5"
                          : hourData?.isActive
                            ? "border-primary/30 bg-primary/5"
                            : "border-border/40 bg-muted/20"
                      )}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={hourData?.isActive || false}
                              onChange={(e) => {
                                const newHours = businessHours.map(h =>
                                  h.dayOfWeek === day ? { ...h, isActive: e.target.checked } : h
                                );
                                setBusinessHours(newHours);
                                autoSaveBusinessHours(newHours);
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5.5 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-colors peer-checked:bg-primary"></div>
                          </label>
                        </TooltipTrigger>
                        {isToday && hourData?.isActive && (
                          <TooltipContent side="top" className="max-w-[250px]">
                            <p className="text-xs">Hoje é {name.toLowerCase()}. Ao desativar, a loja será fechada imediatamente.</p>
                          </TooltipContent>
                        )}
                        {isToday && !hourData?.isActive && (
                          <TooltipContent side="top" className="max-w-[250px]">
                            <p className="text-xs">Hoje é {name.toLowerCase()}. Ao ativar, a loja seguirá o horário configurado.</p>
                          </TooltipContent>
                        )}
                      </Tooltip>

                      <span className={cn(
                        "font-medium text-sm min-w-[3.75rem] sm:min-w-[120px]",
                        hasScheduledClosure ? "text-red-500 dark:text-red-400" : hourData?.isActive ? "text-foreground" : "text-muted-foreground"
                      )}>
                        <span className="hidden sm:inline">{name}</span>
                        <span className="sm:hidden" aria-label={name}>{shortName}</span>
                        {isToday && (
                          <span className="ml-1 sm:ml-1.5 inline-flex items-center px-1 sm:px-1.5 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold">
                            Hoje
                          </span>
                        )}
                      </span>

                      {hourData?.isActive && (
                        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                          {hasAlwaysClosure && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400 text-[11px] font-semibold">
                                  <CalendarOff className="h-3 w-3" />
                                  Fechado (programado)
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[220px]">
                                <p className="text-xs">{closureInfos!.map(c => c.ruleLabel + (c.reason ? ` \u2014 ${c.reason}` : "")).join("; ")}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {!hasAlwaysClosure && (
                            <>
                              <TimeInput
                                id={`bh-open-${day}`}
                                value={hourData.openTime}
                                onChange={(val) => {
                                  let newHours = businessHours.map(h =>
                                    h.dayOfWeek === day ? { ...h, openTime: val } : h
                                  );
                                  if (day === 1 && val) {
                                    newHours = newHours.map(h => {
                                      if (h.dayOfWeek !== 1 && h.isActive && !h.openTime) {
                                        return { ...h, openTime: val };
                                      }
                                      return h;
                                    });
                                  }
                                  setBusinessHours(newHours);
                                  autoSaveBusinessHours(newHours);
                                }}
                                onComplete={() => {
                                  // Auto-focus para o campo de fechamento do mesmo dia
                                  const closeInput = document.getElementById(`bh-close-${day}`);
                                  if (closeInput) {
                                    closeInput.focus();
                                  }
                                }}
                              />
                              <span className="hidden sm:inline text-xs text-muted-foreground font-medium">até</span>
                              <TimeInput
                                id={`bh-close-${day}`}
                                value={hourData.closeTime}
                                onChange={(val) => {
                                  let newHours = businessHours.map(h =>
                                    h.dayOfWeek === day ? { ...h, closeTime: val } : h
                                  );
                                  if (day === 1 && val) {
                                    newHours = newHours.map(h => {
                                      if (h.dayOfWeek !== 1 && h.isActive && !h.closeTime) {
                                        return { ...h, closeTime: val };
                                      }
                                      return h;
                                    });
                                  }
                                  setBusinessHours(newHours);
                                  autoSaveBusinessHours(newHours);
                                }}
                                onComplete={() => {
                                  // Auto-focus para o campo de abertura do próximo dia ativo
                                  const daysOrder = [0, 1, 2, 3, 4, 5, 6];
                                  const currentIdx = daysOrder.indexOf(day);
                                  for (let i = 1; i <= 7; i++) {
                                    const nextDay = daysOrder[(currentIdx + i) % 7];
                                    const nextHour = businessHours.find(h => h.dayOfWeek === nextDay);
                                    if (nextHour?.isActive) {
                                      const nextInput = document.getElementById(`bh-open-${nextDay}`);
                                      if (nextInput) {
                                        nextInput.focus();
                                      }
                                      break;
                                    }
                                  }
                                }}
                              />
                            </>
                          )}
                        </div>
                      )}

                      {!hourData?.isActive && (
                        <span className={cn("text-xs ml-auto", hasScheduledClosure ? "text-red-500 dark:text-red-400 font-medium" : "text-muted-foreground")}>
                          {hasScheduledClosure ? "Fechado (programado)" : "Fechado"}
                        </span>
                      )}
                      </div>

                      {/* Badge de aviso de fechamento parcial quando dia está ativo */}
                      {hasScheduledClosure && !hasAlwaysClosure && hourData?.isActive && (
                        <div className="flex items-center gap-1.5 ml-14 mt-0.5">
                          <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                          <span className="text-[11px] text-amber-700 dark:text-amber-400">
                            {closureInfos!.map(c => c.ruleLabel + (c.reason ? ` \u2014 ${c.reason}` : "")).join("; ")}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>
          </div>


          </div>

            </div>
          )}



          {/* WhatsApp - Conexão */}
          {activeSection === "whatsapp-conexao" && (
            <div className="space-y-5">
              <WhatsAppTab showConnectionOnly />
            </div>
          )}

          {/* WhatsApp - Notificações */}
          {activeSection === "whatsapp-notificacoes" && (
            <div className="space-y-5">
              <WhatsAppTab hideConnectionCard activeSubTab="notifications" showOnlyContent />
            </div>
          )}

          {/* WhatsApp - Templates */}
          {activeSection === "whatsapp-templates" && (
            <div className="space-y-5">
              <WhatsAppTab hideConnectionCard activeSubTab="templates" showOnlyContent />
            </div>
          )}

          {/* Impressora e Teste Section */}
          {activeSection === "impressora" && (
            <div className="space-y-5">
              <PrintTestTab
                establishmentId={establishment?.id || 0}
                printers={printers}
                onAddPrinter={openAddPrinterModal}
                onRefreshPrinters={refetchPrinters}
                onEditPrinter={openEditPrinterModal}
                onDeletePrinter={handleDeletePrinter}
              />
            </div>
          )}

          {/* Integrações Section */}
          {activeSection === "integracoes" && (
            <div className="space-y-5">
              <IntegrationsTab />
            </div>
          )}


          {/* Conta e Segurança Section */}
          {activeSection === "conta-seguranca" && (
            <div className="space-y-5">
              <AccountSecuritySection establishmentId={establishment?.id || 0} />
            </div>
          )}
        </div>
      </div>

      {/* Modal de Adicionar/Editar Impressora */}
      <Dialog open={isPrinterModalOpen} onOpenChange={setIsPrinterModalOpen}>
        <DialogContent
          className="sm:max-w-[425px] p-0 overflow-hidden border-t-4 border-t-primary"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">{editingPrinter ? "Editar Impressora" : "Adicionar Impressora"}</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Printer className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{editingPrinter ? "Editar Impressora" : "Adicionar Impressora"}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {editingPrinter ? "Atualize as informações da impressora" : "Cadastre uma nova impressora térmica"}
                </p>
              </div>
            </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="printerName">Nome da Impressora</Label>
              <Input
                id="printerName"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                placeholder="Ex: Cozinha, Caixa, Bar"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="ipAddress">Endereço IP</Label>
                <Input
                  id="ipAddress"
                  value={printerIpAddress}
                  onChange={(e) => setPrinterIpAddress(e.target.value)}
                  placeholder="Ex: 192.168.1.100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Porta</Label>
                <Input
                  id="port"
                  type="number"
                  value={printerPort}
                  onChange={(e) => setPrinterPort(parseInt(e.target.value) || 9100)}
                  placeholder="9100"
                />
              </div>
            </div>

            {/* Tipo de Impressora */}
            <div className="space-y-2">
              <Label>Tipo de Impressora</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={printerType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPrinterType('all')}
                >
                  Todos os Itens
                </Button>
                <Button
                  type="button"
                  variant={printerType === 'kitchen' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPrinterType('kitchen')}
                >
                  Cozinha
                </Button>
                <Button
                  type="button"
                  variant={printerType === 'counter' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPrinterType('counter')}
                >
                  Balcão
                </Button>
                <Button
                  type="button"
                  variant={printerType === 'bar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPrinterType('bar')}
                >
                  Bar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Defina o tipo para filtrar quais itens serão impressos nesta impressora
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="printerIsActive">Impressora Ativa</Label>
              <Switch
                id="printerIsActive"
                checked={printerIsActive}
                onCheckedChange={setPrinterIsActive}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="printerIsDefault">Impressora Padrão</Label>
              <Switch
                id="printerIsDefault"
                checked={printerIsDefault}
                onCheckedChange={setPrinterIsDefault}
              />
            </div>


          </div>

            <Button
              className="w-full rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white mt-4"
              onClick={handleSavePrinter}
              disabled={createPrinterMutation.isPending || updatePrinterMutation.isPending}
            >
              {createPrinterMutation.isPending || updatePrinterMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão de Impressora */}
      <AlertDialog open={printerDeleteConfirmOpen} onOpenChange={setPrinterDeleteConfirmOpen}>
        <AlertDialogContent
          className="p-0 overflow-hidden border-t-4 border-t-red-500"
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">Remover Impressora</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar remoção da impressora</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Remover Impressora</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Tem certeza que deseja remover a impressora "{printerToDelete?.name}"? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeletePrinter}
                className="flex-1 rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white"
              >
                Remover
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Seleção de Endereço no Mapa */}
      {showMapPicker && (
        <AddressMapPicker
          initialAddress={{
            street,
            number,
            neighborhood,
            city,
            state,
            zipCode,
            latitude: latitude || undefined,
            longitude: longitude || undefined,
          }}
          onAddressSelect={(address) => {
            setStreet(address.street);
            setNumber(address.number);
            setNeighborhood(address.neighborhood);
            setCity(address.city);
            setState(address.state);
            setZipCode(address.zipCode);
            setLatitude(address.latitude);
            setLongitude(address.longitude);
            setShowMapPicker(false);
            // Salvar todos os campos do endereço incluindo lat/lng no servidor
            autoSaveField({
              street: address.street.trim() || null,
              number: address.number.trim() || null,
              neighborhood: address.neighborhood.trim() || null,
              city: address.city.trim() || null,
              state: address.state.trim() || null,
              zipCode: address.zipCode.trim() || null,
              latitude: address.latitude || null,
              longitude: address.longitude || null,
            });
            toast.success("Endereço atualizado com sucesso!");
            // Se estava pendente a ativação do raio, ativar agora apenas para planos elegíveis
            if (pendingRadiusActivation && address.latitude && address.longitude) {
              if (isDeliveryKmPremiumLocked) {
                setPendingRadiusActivation(false);
                return;
              }
              setDeliveryFeeType("byRadius");
              autoSaveField({ deliveryFeeType: "byRadius" });
              setPendingRadiusActivation(false);
              toast.success("Modo 'Por (Km)' ativado!");
            }
          }}
          onClose={() => { setShowMapPicker(false); setPendingRadiusActivation(false); }}
        />
      )}

      {/* Modal de Crop de Imagem */}
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false);
          setCropImageSrc("");
        }}
        imageSrc={cropImageSrc}
        onCropComplete={handleCroppedImage}
        aspectRatio={cropType === "logo" ? 1 : 16 / 9}
        cropShape={cropType === "logo" ? "round" : "rect"}
        title={cropType === "logo" ? "Recortar Logo" : "Recortar Capa"}
      />
    </AdminLayout>
  );
}
