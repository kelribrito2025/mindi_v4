import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import DemoDashboard1 from "./DemoDashboard1";
import DemoDashboard2 from "./DemoDashboard2";
import DemoPedidos from "./DemoPedidos";
import { 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Clock, 
  HeadphonesIcon,
  ChevronDown,
  Menu as MenuIcon,
  X,
  BarChart3,
  Bike,
  Package,
  XCircle,
  TrendingDown,
  DollarSign,
  Link2,
  Users,
  PieChart,
  PackageCheck,
  Utensils,
  Smartphone,
  Globe,
  QrCode,
  Palette,
  Check,
  Crown,
  ChevronUp,
  MessageCircle,
  Mail,
  MapPin,
  Instagram,
  Phone,
  Shield,
  Rocket,
  HelpCircle,
  Play,
  Star,
  Gift,
  TrendingUp,
  Bell,
  Send,
  Ticket,
  Target,
  BadgePercent,
  AlertTriangle,
  UserX,
  LayoutGrid,
  Monitor,
  Heart,
  Megaphone,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Bot,
  Quote,
  UtensilsCrossed
} from "lucide-react";

// Hero background image
const HERO_BG_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/hero-restaurant-bg_6b05302e.jpg";
const LANDING_NAVBAR_LOGO_WHITE_TEXT = "/assets/mindi-login-logo-dark.png";
const LANDING_NAVBAR_LOGO_DARK_TEXT = "/assets/mindi-login-logo-light.png";
const LANDING_FOOTER_LOGO_BLACK_TEXT = "/assets/mindi-footer-logo-black-20260526.png";

// Gestão de Pedidos section background image
const GESTAO_PEDIDOS_BG_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/gestao-pedidos-bg-TjRTW44MoMoVHQzKC7q8WX.webp";

// CDN URLs dos mockups do dashboard
const DASHBOARD_MOCKUP = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/UbTUwNukIbWfXXPO.png";
const PEDIDOS_MOCKUP = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/eZYBBIOzNtjHSFop.png";
const KANBAN_REAL_MOCKUP = "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/print-pedidos-v2_398c4eed.webp";
const PDV_SLIDES = [
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/pdv-new2_ebd317a3.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/pdv-entrega_689c86ff.webp",
];
const CATALOG_SLIDES = [
  { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/IMG_7214_opt_29b20e63.webp", label: "Cardápio" },
  { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/IMG_7203_opt_1e421ddf.webp", label: "Produto" },
  { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/IMG_7204_opt_82a05521.webp", label: "Entrega" },
  { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/IMG_7205_opt_1e1ca3d5.webp", label: "Resumo" },
  { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/IMG_7206_opt_eaeef860.webp", label: "Dados" },
  { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/IMG_7207_opt_98946b70.webp", label: "Confirmação" },
  { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/IMG_7208_opt_76a4fc1b.webp", label: "Pedido Enviado" },
];

// Imagens KDS (Kitchen Display System)
const KDS_SLIDES = [
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/kds_d1322507.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/kds2_1335f386.webp",
];

// Imagens Relatórios
const RELATORIOS_SLIDES = [
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/rela_b76ef848.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/relatorios2_new_7ee1d7d3.webp",
];


const HOW_IT_WORKS_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/how-it-works-bg-h4HFHZkUTbWqVGcgaqM2fh.webp";

// Imagens reais do programa de fidelidade
const LOYALTY_SLIDE_1 = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/frIpsGmoncHJSSvS.png";
const LOYALTY_SLIDE_2 = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/cIcOnoXvsGurBZqK.png";
const LOYALTY_SLIDE_3 = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/sKWXwquYAtRCumWl.png";
const LOYALTY_SLIDE_4 = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/UjKoclpdSxjbFGcs.png";
const LOYALTY_SLIDES = [LOYALTY_SLIDE_1, LOYALTY_SLIDE_2, LOYALTY_SLIDE_3, LOYALTY_SLIDE_4];

// Screenshots de Campanhas SMS e Cupons
const CAMPANHAS_MOCKUP = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/sppXEewuzkaeQIVs.png";
const CUPONS_MOCKUP = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/ONNOgppsFwJoOdTj.png";

// Imagens da integração WhatsApp
const WHATSAPP_SLIDE_1 = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/NPTBypEdTUYmjzws.png";
const WHATSAPP_SLIDE_2 = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/AHwBsLfNlSqBdYXU.png";
const WHATSAPP_SLIDE_3 = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/frkfNNUIzkDfEZZC.png";
const WHATSAPP_SLIDES = [WHATSAPP_SLIDE_1, WHATSAPP_SLIDE_2, WHATSAPP_SLIDE_3];

// ============ NAVBAR ============
function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Preços", href: "#precos" },
    { label: "FAQ", href: "#faq" },
  ];
  const navbarLogoSrc = scrolled ? LANDING_NAVBAR_LOGO_DARK_TEXT : LANDING_NAVBAR_LOGO_WHITE_TEXT;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
      scrolled 
        ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" 
        : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13 lg:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src={navbarLogoSrc}
              alt="Mindi"
              className="h-[28.9189px] w-auto object-contain transition-opacity duration-300"
            />
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${scrolled ? "text-gray-600 hover:text-gray-900" : "text-white/80 hover:text-white"}`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="https://app.mindi.com.br/login"
              className={`text-sm font-medium transition-colors px-4 py-2 ${scrolled ? "text-gray-700 hover:text-gray-900" : "text-white/80 hover:text-white"}`}
            >
              Entrar
            </a>
            <a
              href="https://app.mindi.com.br/criar-conta"
              className="text-xs font-semibold text-white bg-red-500 hover:bg-red-500 px-4 py-2 rounded-lg transition-transform duration-200 hover:-translate-y-0.5"
            >
              Criar conta grátis
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${scrolled ? "hover:bg-gray-100" : "hover:bg-white/10"}`}
          >
            {mobileMenuOpen ? <X className={`w-5 h-5 ${scrolled ? "" : "text-white"}`} /> : <MenuIcon className={`w-5 h-5 ${scrolled ? "" : "text-white"}`} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-gray-100 bg-white/95 backdrop-blur-md">
            <div className="flex flex-col gap-1 pt-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-2.5 rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-gray-100 mt-2 pt-3 flex flex-col gap-2 px-4">
                <a
                  href="https://app.mindi.com.br/login"
                  className="text-sm font-medium text-gray-700 text-center py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Entrar
                </a>
                <a
                  href="https://app.mindi.com.br/criar-conta"
                  className="text-sm font-semibold text-white bg-red-500 hover:bg-red-500 text-center py-2.5 rounded-xl transition-colors"
                >
                  Teste 15 dias grátis
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// ============ HERO SECTION ============
const TYPEWRITER_WORDS = ["pedidos", "cardápio", "cozinha", "delivery", "finanças"];

function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [bgLoaded, setBgLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.src = HERO_BG_IMAGE;
    img.onload = () => setBgLoaded(true);
    if (img.complete) setBgLoaded(true);
  }, []);

  // Blinking cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  // Typewriter effect
  useEffect(() => {
    const currentWord = TYPEWRITER_WORDS[currentWordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (displayText.length < currentWord.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        }, 100 + Math.random() * 50);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2000);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length - 1));
        }, 60);
      } else {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % TYPEWRITER_WORDS.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentWordIndex]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{
          backgroundImage: `url(${HERO_BG_IMAGE})`,
          opacity: bgLoaded ? 1 : 0,
        }}
      />

      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/65 to-black/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24 lg:py-0">
        <div className="flex flex-col justify-center min-h-[calc(100vh-5rem)] max-w-3xl">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 w-fit mb-6 transition-colors duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-semibold text-white/90 tracking-wide uppercase">
              Gestão completa para restaurantes
            </span>
          </div>

          {/* Headline with typewriter effect */}
          <h1
            className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tight mb-6 transition-colors duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Seu restaurante no{" "}
            <br className="hidden sm:block" />
            piloto automático de{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-red-500">
                {displayText}
                <span
                  className={`inline-block w-[3px] h-[0.85em] bg-red-400 ml-0.5 align-middle rounded-sm transition-opacity duration-100 ${
                    showCursor ? "opacity-100" : "opacity-0"
                  }`}
                />
              </span>
              <svg
                className="absolute -bottom-1 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 8.5C50 3 100 2 150 5C200 8 250 4 298 7"
                  stroke="#f87171"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.4"
                />
              </svg>
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className={`text-lg sm:text-xl text-white/70 leading-relaxed max-w-2xl mb-10 transition-colors duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Cardápio digital, pedidos por WhatsApp, controle financeiro e cozinha organizada — tudo em um lugar só. Para você focar no que realmente importa, atender melhor e vender mais.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10 transition-colors duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <a
              href="https://app.mindi.com.br/criar-conta?plan=free"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 text-base font-semibold text-white bg-red-500 hover:bg-red-500 px-7 py-3.5 rounded-xl transition-transform duration-300 hover:-translate-y-0.5 shadow-lg shadow-red-500/30"
            >
              <Rocket className="w-4 h-4" />
              Comece grátis agora
            </a>
            <a
              href="#precos"
              onClick={(e) => { e.preventDefault(); document.getElementById('precos')?.scrollIntoView({ behavior: 'instant' }); }}
              className="group inline-flex items-center justify-center gap-2 text-base font-semibold text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 px-7 py-3.5 rounded-xl border border-white/20 hover:border-white/30 transition-transform duration-300 hover:-translate-y-0.5"
            >
              Veja como funciona
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>

          {/* Mini Benefits */}
          <div
            className={`flex flex-col sm:flex-row gap-4 sm:gap-6 transition-colors duration-700 delay-[400ms] ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {[
              { icon: Zap, text: "Sem taxa por pedido" },
              { icon: Clock, text: "Pronto em minutos" },
              { icon: HeadphonesIcon, text: "Sem cartão. Sem contrato." },
            ].map((benefit) => (
              <div key={benefit.text} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
                </div>
                <span className="text-sm text-white/70 font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 z-10">
        <span className="text-xs text-white/50 font-medium">Saiba mais</span>
        <div className="w-5 h-8 rounded-full border-2 border-white/30 flex justify-center pt-1.5">
          <div className="w-1 h-2 bg-white/50 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}

// ============ STATS BAR SECTION ============
function useCountUp(target: number, isVisible: boolean, duration = 1500, delay = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isVisible) return;
    const timeout = setTimeout(() => {
      const startTime = performance.now();
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo for snappy feel
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCount(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [isVisible, target, duration, delay]);
  return count;
}

function StatsBarSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Counter animations (20% slower)
  const restaurantCount = useCountUp(900, isVisible, 2160, 240);
  const percentCount = useCountUp(27, isVisible, 1680, 600);
  const minuteCount = useCountUp(7, isVisible, 1440, 720);

  return (
    <section ref={sectionRef} className="relative pt-[23px] sm:pt-[28px] pb-[50px] sm:pb-[60px]" style={{ background: 'linear-gradient(135deg, #fde8e8 0%, #fef0f0 25%, #fff5f5 50%, #fef0f0 75%, #fde8e8 100%)' }}>
      {/* Subtle shimmer */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(239,68,68,0.2) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">

          {/* +900 — Counter animation */}
          <div
            className={`text-center transition-colors duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: '0ms' }}
            /* 20% slower transition */
          >
            <div className="mb-2">
              <span className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-red-500 tracking-tight tabular-nums">
                +{restaurantCount.toLocaleString('pt-BR')}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-500 tracking-[0.15em] uppercase">RESTAURANTES ATIVOS</p>
          </div>

          {/* R$0 — Pulse effect */}
          <div
            className={`text-center transition-colors duration-840 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: '144ms' }}
          >
            <div className="mb-2">
              <span className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight inline-block">
                <span className="text-black">R$</span>
                <span
                  className="text-red-500 inline-block"
                  style={{
                    animation: isVisible ? 'pulseBeat 1.5s ease-in-out 0.5s infinite' : 'none',
                  }}
                >0</span>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-500 tracking-[0.15em] uppercase">TAXA POR PEDIDO</p>
          </div>

          {/* 27% — Slide up + flip effect */}
          <div
            className={`text-center transition-colors duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: '240ms' }}
          >
            <div className="mb-2 overflow-hidden">
              <span
                className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-red-500 tracking-tight inline-block tabular-nums"
                style={{
                  animation: isVisible ? 'slideUpReveal 0.96s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both' : 'none',
                }}
              >
                {percentCount}%
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-500 tracking-[0.15em] uppercase">ECONOMIA VS IFOOD/RAPPI</p>
          </div>

          {/* 7 min — Counter animation (same as 900) */}
          <div
            className={`text-center transition-colors duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: '360ms' }}
          >
            <div className="mb-2">
              <span className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-red-500 tracking-tight tabular-nums">
                {minuteCount} <span className="text-3xl sm:text-4xl lg:text-[2.5rem]">min</span>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-500 tracking-[0.15em] uppercase">PARA SEU CARDÁPIO NO AR</p>
          </div>

        </div>
      </div>

      {/* Scalloped wave effect */}
      <div className="absolute -bottom-1 left-0 w-full" style={{ height: '40px' }}>
        <svg
          viewBox="0 0 1200 40"
          preserveAspectRatio="none"
          className="w-full h-full block"
        >
          <path
            d="M0,0 Q30,40 60,0 Q90,40 120,0 Q150,40 180,0 Q210,40 240,0 Q270,40 300,0 Q330,40 360,0 Q390,40 420,0 Q450,40 480,0 Q510,40 540,0 Q570,40 600,0 Q630,40 660,0 Q690,40 720,0 Q750,40 780,0 Q810,40 840,0 Q870,40 900,0 Q930,40 960,0 Q990,40 1020,0 Q1050,40 1080,0 Q1110,40 1140,0 Q1170,40 1200,0 L1200,40 L0,40 Z"
            fill="#fafafa"
          />
        </svg>
      </div>

      <style>{`
        @keyframes pulseBeat {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.85; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUpReveal {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </section>
  );
}

// ============ PAIN POINTS SECTION (Transition from Hero) ============
function PainPointsStrip() {
  const painPoints = [
    { icon: "💸", text: "Paga até 30% de taxa por pedido no iFood?" },
    { icon: "📊", text: "Fecha o caixa na planilha e torce pra dar certo?" },
    { icon: "🏍️", text: "Gerencia entregadores pelo WhatsApp?" },
    { icon: "📱", text: "Perde pedidos no meio das mensagens?" },
  ];

  return (
    <section className="relative py-12 bg-gray-900 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {painPoints.map((point, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3.5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <span className="text-2xl flex-shrink-0">{point.icon}</span>
              <p className="text-sm text-gray-300 font-medium leading-snug">{point.text}</p>
            </div>
          ))}
        </div>
        <p className="text-center mt-8 text-white/80 text-base font-medium">
          Restaurante bom não fecha por falta de cliente. <span className="text-red-400 font-semibold">Fecha por falta de controle.</span>
        </p>
      </div>
    </section>
  );
}

// ============ SEÇÃO: DASHBOARD SHOWCASE (ESTILO GOOMER) ============
const DASHBOARD_DEMO_COMPONENTS = [
  DemoDashboard1,
  DemoDashboard2,
];

function DashboardShowcaseSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const demoContainerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [demoScale, setDemoScale] = useState(0.65);

  // Calculate scale based on container width
  useEffect(() => {
    const container = demoContainerRef.current;
    if (!container) return;
    const updateScale = () => {
      const containerWidth = container.offsetWidth;
      setDemoScale(containerWidth / 1310);
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % DASHBOARD_DEMO_COMPONENTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative pt-20 lg:pt-28 pb-0 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #fafafa 0%, #ffffff 40%, #fef2f2 100%)",
      }}
    >
      {/* Subtle texture */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.3) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top: Title left + Description right */}
        <div className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-end mb-16 transition-colors duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <div>
            <span className="text-sm font-bold text-red-500 tracking-[0.2em] uppercase block mb-4">RELATÓRIOS</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-[1.1]">
              Dados que transformam<br />
              <span className="text-red-500">decisões.</span>
            </h2>
          </div>
          <div>
            <p className="text-lg text-gray-500 leading-relaxed mb-6">
              Acompanhe faturamento, ticket médio, produtos mais vendidos, horários de pico e muito mais. Tudo em tempo real, no seu painel personalizado.
            </p>
            <a
              href="https://app.mindi.com.br/criar-conta"
              className="group inline-flex items-center gap-2 text-base font-semibold text-white bg-red-500 hover:bg-red-500 px-7 py-3.5 rounded-xl transition-transform duration-300 shadow-xl shadow-red-500/25 hover:shadow-red-500/40 hover:-translate-y-0.5"
            >
              Começar agora
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Dashboard Screenshot - Laptop Mockup Image - cuts at section bottom */}
        <div className={`transition-colors duration-1000 delay-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
        }`}>
          <div className="relative" style={{ maxHeight: '620px', overflow: 'hidden' }}>
            {/* Red glow behind the laptop */}
            <div className="absolute -inset-8 rounded-3xl blur-[40px] opacity-60" style={{ background: "radial-gradient(ellipse at center, rgba(239,68,68,0.7) 0%, rgba(239,68,68,0.4) 35%, rgba(239,68,68,0.15) 65%, transparent 85%)" }} />
            <div className="absolute -inset-16 rounded-[2rem] blur-[80px] opacity-40" style={{ background: "radial-gradient(ellipse at center, rgba(220,38,38,0.6) 0%, rgba(239,68,68,0.3) 40%, rgba(239,68,68,0.1) 60%, transparent 80%)" }} />

            {/* Tablet mockup frame */}
            <div className="relative rounded-[2rem] sm:rounded-[2.5rem] bg-[#1a1a1a] p-3 sm:p-4 shadow-2xl">
              {/* Camera dot on top */}
              <div className="absolute top-[6px] sm:top-[8px] left-1/2 -translate-x-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#2a2a2a] border border-[#333]" />
              {/* Screen area with browser + screenshot */}
              <div className="relative overflow-hidden rounded-[1.2rem] sm:rounded-[1.5rem]">
                {/* Browser chrome */}
                <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                  {/* Traffic lights */}
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  {/* URL bar */}
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white rounded-lg px-4 py-1 text-[11px] text-gray-400 font-medium border border-gray-200 w-64 text-center">
                      app.mindi.com.br/dashboard
                    </div>
                  </div>
                </div>
                {/* Dashboard demo components carousel (rendered directly, no iframes) */}
                <div ref={demoContainerRef} className="relative" style={{ paddingBottom: '62%' }}>
                  {DASHBOARD_DEMO_COMPONENTS.map((DemoComponent, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                        activeSlide === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
                      }`}
                      style={{ pointerEvents: 'none', overflow: 'hidden' }}
                    >
                      <div style={{
                        width: '1310px',
                        height: Math.ceil(1310 * 0.62 / demoScale) + 'px',
                        transform: `scale(${demoScale})`,
                        transformOrigin: 'top left',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}>
                        <DemoComponent embedded />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            {/* Carousel dots inside maxHeight container as absolute overlay */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {DASHBOARD_DEMO_COMPONENTS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`rounded-full transition-colors duration-300 ${
                    activeSlide === index
                      ? 'bg-red-500 w-8 h-2.5'
                      : 'bg-gray-300 hover:bg-red-300 w-2.5 h-2.5'
                  }`}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ PHONE CAROUSEL COMPONENT ============
function PhoneCarousel({ slides }: { slides: { src: string; label: string }[] }) {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, slides.length]);

  const goTo = (index: number) => {
    setCurrent(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 8s of inactivity
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  return (
    <div className="relative mx-auto max-w-[280px]">
      {/* Sombra suave */}
      <div className="absolute -inset-6 bg-gradient-to-br from-red-200/30 via-red-100/20 to-transparent rounded-[3rem] blur-2xl" />
      
      {/* iPhone frame */}
      <div className="relative bg-[#1a1a1a] rounded-[3rem] pt-[10px] px-[10px] pb-[10px] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.35)]">
        {/* Botão lateral direito (power) */}
        <div className="absolute -right-[2px] top-[100px] w-[3px] h-[40px] bg-[#2a2a2a] rounded-r-sm" />
        {/* Botões laterais esquerdos (volume) */}
        <div className="absolute -left-[2px] top-[80px] w-[3px] h-[24px] bg-[#2a2a2a] rounded-l-sm" />
        <div className="absolute -left-[2px] top-[115px] w-[3px] h-[40px] bg-[#2a2a2a] rounded-l-sm" />
        <div className="absolute -left-[2px] top-[165px] w-[3px] h-[40px] bg-[#2a2a2a] rounded-l-sm" />
        
        {/* Tela do iPhone */}
        <div
          className="relative rounded-[2.4rem] overflow-hidden bg-white"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Dynamic Island */}
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-center pt-[10px]">
            <div className="w-[90px] h-[25px] bg-black rounded-full" />
          </div>
          
          {/* Carousel images */}
          <div className="relative aspect-[9/19.5] overflow-hidden">
            {slides.map((slide, i) => (
              <img
                key={i}
                src={slide.src}
                alt={slide.label}
                className={`absolute inset-0 w-full h-full object-cover object-top transition-colors duration-500 ease-in-out ${
                  i === current ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`transition-colors duration-300 rounded-full ${
              i === current
                ? "w-6 h-2 bg-red-500"
                : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>


    </div>
  );
}

// ============ SEÇÃO 2: CARDÁPIO DIGITAL INTELIGENTE (estilo Goomer) ============
function ProblemSolutionSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const benefits = [
    {
      icon: <Zap className="w-5 h-5 text-white" />,
      title: "0% taxas, 100% seus",
      description: "Marketplaces cobram até 30% por pedido. No Mindi, cada real que entra é seu. Seu delivery cresce sem comer seu lucro.",
    },
    {
      icon: <Smartphone className="w-5 h-5 text-white" />,
      title: "Sem app, sem barreira",
      description: "Seus clientes acessam pelo link ou QR Code direto no celular. Sem baixar nada, sem cadastro. Pede e pronto.",
    },
    {
      icon: <Check className="w-5 h-5 text-white" />,
      title: "Tudo conectado, nada manual",
      description: "Pedido entrou? Estoque atualiza, cozinha recebe, financeiro registra. Sem redigitar, sem planilha, sem erro.",
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-white" />,
      title: "Ticket médio maior, sem esforço",
      description: "Complementos, combos e sugestões inteligentes fazem o trabalho por você. Seus clientes pedem mais sem você precisar empurrar.",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-16 lg:py-24 overflow-hidden bg-white"
    >
      {/* Linha vermelha decorativa no topo */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Título + Benefícios */}
          <div className={`transition-colors duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}>
            <span className="text-sm font-semibold tracking-widest text-red-500 uppercase mt-8 mb-6 block">CARDÁPIO DIGITAL</span>

            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight mb-12">
              Cadastre seu cardápio{" "}
              <br className="hidden sm:block" />
              em <span className="text-red-500">15 minutos</span>
            </h2>

            <div className="space-y-1">
              {benefits.map((benefit, i) => (
                <div
                  key={i}
                  className={`group flex gap-5 p-4 transition-colors duration-700 border-l-[3px] border-transparent hover:border-l-red-500 hover:bg-red-50/40 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  }`}
                  style={{ transitionDelay: `${300 + i * 150}ms` }}
                >
                  {/* Ícone com fundo vermelho */}
                  <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="text-[17px] font-bold text-gray-900 mb-1">{benefit.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - iPhone Carousel */}
          <div className={`transition-colors duration-700 delay-500 ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
          }`}>
            <PhoneCarousel slides={CATALOG_SLIDES} />
          </div>
        </div>
      </div>
    </section>
  );
}



// ============ SEÇÃO 3: CLIENTES QUE VENDEM CONOSCO ============

const CLIENTS_DATA_ROW1 = [
  {
    name: "Burger House",
    city: "São Paulo",
    state: "SP",
    cover: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/WxLMtqgzpplincEt.jpg",
    color: "#ef4444",
    initials: "BH",
    type: "Hamburgueria",
    deliveryType: "Delivery e Retirada",
    rating: "4.8",
    reviewCount: 127,
  },
  {
    name: "Forno & Massa",
    city: "Curitiba",
    state: "PR",
    cover: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/BgcAhrPALHBfxpsd.jpeg",
    color: "#ea580c",
    initials: "FM",
    type: "Pizzaria",
    deliveryType: "Somente Delivery",
    rating: "4.9",
    reviewCount: 214,
  },
  {
    name: "Sushi Kento",
    city: "Rio de Janeiro",
    state: "RJ",
    cover: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/mInTUYpVlTIFLkON.jpg",
    color: "#0891b2",
    initials: "SK",
    type: "Japonesa",
    deliveryType: "Delivery e Retirada",
    rating: "4.7",
    reviewCount: 89,
  },
  {
    name: "Açaí da Terra",
    city: "Belém",
    state: "PA",
    cover: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/aiffbCjVDSbuQtRz.jpg",
    color: "#7c3aed",
    initials: "AT",
    type: "Açaiteria",
    deliveryType: "Delivery e Retirada",
    rating: "4.6",
    reviewCount: 156,
  },
  {
    name: "Brasa Viva",
    city: "Belo Horizonte",
    state: "MG",
    cover: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/uhXbFmhAvEyTTgoB.jpg",
    color: "#ef4444",
    initials: "BV",
    type: "Churrascaria",
    deliveryType: "Somente Retirada",
    rating: "4.9",
    reviewCount: 203,
  },
  {
    name: "Poke Fresh",
    city: "Florianópolis",
    state: "SC",
    cover: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/LNZYzDQsQZBsCSUy.jpg",
    color: "#059669",
    initials: "PF",
    type: "Saudável",
    deliveryType: "Delivery e Retirada",
    rating: "4.8",
    reviewCount: 98,
  },
];


function ClientCard({ client }: { client: typeof CLIENTS_DATA_ROW1[0] }) {
  return (
    <div className="flex-shrink-0 w-[280px] sm:w-[300px] group transition-colors duration-500 ease-out">
      {/* Outer container — bg-gray-50 with food icon pattern (igual Preview do Perfil Público) */}
      <div className="bg-gray-50 rounded-2xl shadow-md group-hover:shadow-xl transition-all duration-500 overflow-hidden relative">
        {/* Background de ícones de comida */}
        <div
          className="absolute inset-0 opacity-[0.19] pointer-events-none z-0"
          style={{
            backgroundImage: `url('https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/chat-bg-option3-dXq5isMUuMCqTpaKJbbZwr.webp')`,
            backgroundSize: '400px auto',
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Cover Image — px-4 pt-4, h-36 rounded-2xl (igual PublicMenu) */}
        <div className="px-4 pt-4 relative z-[1]">
          <div className="relative h-36 rounded-2xl overflow-hidden bg-gray-200">
            {client.cover ? (
              <img
                src={client.cover}
                alt={client.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                loading="eager"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center">
                <UtensilsCrossed className="h-16 w-16 text-red-500/30" />
              </div>
            )}
          </div>
        </div>

        {/* Restaurant Info Block — px-4, -mt-16 (igual PublicMenu) */}
        <div className="px-4 relative z-[1]">
          <div className="relative -mt-16 flex flex-col pb-4">
            {/* Badge de Entrega/Retirada — posição EXATA do PublicMenu */}
            <div className="absolute top-[116px] right-0 z-0" style={{ marginTop: '-29px', marginRight: '16px' }}>
              <div className="bg-red-500 text-white font-bold rounded-t-xl shadow-md flex items-center gap-1.5" style={{ fontSize: '11px', paddingTop: '0px', paddingRight: '14px', paddingBottom: '10px', paddingLeft: '10px', marginTop: '21px', height: '33px', borderRadius: '12px' }}>
                {client.deliveryType.includes("Delivery") ? (
                  <Bike className="h-3.5 w-3.5" />
                ) : (
                  <Package className="h-3.5 w-3.5" />
                )}
                {client.deliveryType}
              </div>
            </div>

            {/* Logo — h-28 w-28 rounded-full border-4 border-white shadow-lg (igual PublicMenu) */}
            <div className="relative z-10 ml-4">
              <div
                className="h-28 w-28 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-white font-bold text-2xl"
                style={{ backgroundColor: client.color }}
              >
                {client.initials}
              </div>
            </div>

            {/* Info card — bg-white rounded-xl p-4 shadow-sm mt-4 (igual PublicMenu) */}
            <div className="bg-white rounded-xl p-4 shadow-sm relative z-[45] mt-4" style={{ paddingBottom: '4px' }}>
              <div className="flex flex-col">
                <div className="flex-1">
                  {/* Nome + Rating — EXATO do PublicMenu */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      <h4 className="text-xl font-bold text-gray-900 truncate max-w-[140px]">{client.name}</h4>
                      <div className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 flex-shrink-0">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-[13px] font-semibold text-gray-800">{client.rating}</span>
                        <span className="text-[13px] text-gray-500">({client.reviewCount})</span>
                      </div>
                    </div>
                  </div>

                  {/* Endereço — EXATO do PublicMenu */}
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1 min-w-0 flex-shrink">
                      <MapPin className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                      <span className="truncate max-w-[180px]">{client.city} - {client.state}</span>
                    </span>
                  </div>

                  {/* Status — Aberto agora (igual PublicMenu) */}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                      </span>
                      Aberto agora
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientsShowcaseSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="pt-20 lg:pt-28 pb-4 bg-gradient-to-b from-white to-gray-50/50 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`text-center mb-14 transition-colors duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="text-sm font-bold text-red-500 tracking-[0.2em] uppercase block mb-4">CASES REAIS</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-[1.1]">
            Clientes que vendem<br />
            <span className="text-red-500">conosco.</span>
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Restaurantes de todo o Brasil já usam o Mindi para vender mais, com menos custo e total controle.
          </p>
        </div>
      </div>

      {/* Marquee Carousel - infinite auto-scroll */}
      <div
        className={`transition-colors duration-700 delay-200 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-gray-50/50 to-transparent z-10 pointer-events-none" />
          
          {/* Marquee track - Row 1 (right to left) */}
          <div className="animate-marquee flex gap-6 pb-4 w-max">
            {CLIENTS_DATA_ROW1.map((client, idx) => (
              <ClientCard key={`a-${client.name}-${idx}`} client={client} />
            ))}
            {CLIENTS_DATA_ROW1.map((client, idx) => (
              <ClientCard key={`b-${client.name}-${idx}`} client={client} />
            ))}
          </div>
        </div>

      </div>

    </section>
  );
}

// ============ SEÇÃO 3B: VERSÁTIL PARA DIVERSOS SEGMENTOS ============

const SEGMENTS_DATA = [
  { emoji: "🥗", name: "Restaurante", link: "#" },
  { emoji: "🍔", name: "Hamburgueria", link: "#" },
  { emoji: "🍕", name: "Pizzaria", link: "#" },
  { emoji: "🍇", name: "Açaiteria", link: "#" },
  { emoji: "🍦", name: "Sorveteria", link: "#" },
  { emoji: "🍺", name: "Bar e adega", link: "#" },
  { emoji: "☕", name: "Cafeteria", link: "#" },
  { emoji: "🍣", name: "Japonesa", link: "#" },
  { emoji: "🍰", name: "Doceria", link: "#" },
];

function SegmentsSection() {
  return (
    <section className="-mt-2 pb-12 lg:pb-16 bg-gray-50/50">
      {/* Full-width marquee strip */}
      <div className="relative overflow-hidden py-5">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-gray-50/50 to-transparent z-10 pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-gray-50/50 to-transparent z-10 pointer-events-none" />

        {/* Marquee track */}
        <div className="flex animate-marquee-segments">
          {/* First set */}
          {[...SEGMENTS_DATA, ...SEGMENTS_DATA].map((seg, idx) => (
            <a
              key={`seg-${idx}`}
              href={seg.link}
              className="flex items-center gap-2.5 px-5 shrink-0 pointer-events-none"
            >
              <span className="text-2xl sm:text-3xl">{seg.emoji}</span>
              <span className="text-gray-800 font-semibold text-sm sm:text-base whitespace-nowrap">{seg.name}</span>
              <span className="text-gray-300 text-lg font-light mx-2">|</span>
            </a>
          ))}
          {/* Duplicate for seamless loop */}
          {[...SEGMENTS_DATA, ...SEGMENTS_DATA].map((seg, idx) => (
            <a
              key={`seg-dup-${idx}`}
              href={seg.link}
              className="flex items-center gap-2.5 px-5 shrink-0 pointer-events-none"
            >
              <span className="text-2xl sm:text-3xl">{seg.emoji}</span>
              <span className="text-gray-800 font-semibold text-sm sm:text-base whitespace-nowrap">{seg.name}</span>
              <span className="text-gray-300 text-lg font-light mx-2">|</span>
            </a>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-gray-400 mt-2">
        Não viu seu segmento? Se você vende pelo WhatsApp, <span className="text-red-500 font-medium">nós te atendemos!</span>
      </p>
    </section>
  );
}



// ============ FEATURE 2: GESTÃO DE PEDIDOS EM TEMPO REAL ============
function OrderManagementSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pedidosContainerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [pedidosScale, setPedidosScale] = useState(0.55);

  // Calculate scale based on container width
  useEffect(() => {
    const container = pedidosContainerRef.current;
    if (!container) return;
    const updateScale = () => {
      const containerWidth = container.offsetWidth;
      setPedidosScale(containerWidth / 1310);
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const features = [
    "Kanban: Novos → Preparo → Prontos → Completos",
    "Notificações em tempo real via WebSocket",
    "Impressão automática na cozinha",
    "Gestão de entregadores com repasses",
  ];

  const kanbanCols = [
    {
      title: "Novos",
      count: 3,
      color: "bg-red-500",
      cards: [
        { id: "#301", name: "Combo Família", time: "2min" },
        { id: "#300", name: "Hot Roll x8", time: "5min" },
      ],
    },
    {
      title: "Preparo",
      count: 2,
      color: "bg-yellow-500",
      cards: [
        { id: "#299", name: "Sashimi Mix", time: "12min" },
      ],
    },
    {
      title: "Prontos",
      count: 1,
      color: "bg-green-500",
      cards: [
        { id: "#298", name: "Temaki Duo", time: "18min" },
      ],
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-20 lg:py-28 bg-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left - Kanban Mockup */}
          <div className="lg:col-span-7 relative flex items-center justify-center lg:justify-start order-2 lg:order-1" style={{ overflow: 'visible' }}>
            <div
              className={`relative w-full max-w-lg lg:max-w-none transition-colors duration-700 delay-200 ${
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-(-12)"
              }`}
            >
              {/* Tablet mockup frame */}
              <div
                className="relative rounded-[2rem] sm:rounded-[2.5rem] bg-[#1a1a1a] p-3 sm:p-4 shadow-2xl transition-transform duration-[1.2s] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                style={{
                  transform: isVisible ? 'translateX(0%)' : 'translateX(-20%)',
                  width: '100%',
                }}
              >
                {/* Camera dot on top */}
                <div className="absolute top-[6px] sm:top-[8px] left-1/2 -translate-x-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#2a2a2a] border border-[#333]" />
                {/* Screen area with browser + screenshot */}
                <div className="relative overflow-hidden rounded-[1.2rem] sm:rounded-[1.5rem]">
                  {/* Browser chrome */}
                  <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-white rounded-lg px-4 py-1 text-[11px] text-gray-400 font-medium border border-gray-200 w-64 text-center">
                        app.mindi.com.br
                      </div>
                    </div>
                  </div>
                  {/* DemoPedidos rendered inline with scale */}
                  <div ref={pedidosContainerRef} className="relative" style={{ paddingBottom: '62%', background: '#f7f8fa' }}>
                    <div style={{
                      width: '1310px',
                      height: Math.ceil(1310 * 0.62 / pedidosScale) + 'px',
                      transform: `scale(${pedidosScale})`,
                      transformOrigin: 'top left',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      pointerEvents: 'none',
                      overflow: 'hidden',
                    }}>
                      <DemoPedidos embedded />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div
            className={`lg:col-span-5 transition-colors duration-700 order-1 lg:order-2 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 mb-6">
              <LayoutGrid className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">GESTÃO DE PEDIDOS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight mb-5">
              Gestão de Pedidos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">
                em Tempo Real
              </span>
            </h2>

            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Chega de perder pedido no WhatsApp. Todos os pedidos em um painel Kanban — do momento que o cliente pede até a entrega, você controla tudo sem anotar nada no papel.
            </p>

            <div className="space-y-3 mb-10">
              {features.map((feat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-red-500" />
                  </div>
                  <span className="text-gray-700">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ FEATURE 2.5: ROBÔ WHATSAPP ============
function WhatsAppBotSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const features = [
    "Pedidos chegam sem você digitar nada",
    "Cardápio interativo direto no WhatsApp",
    "Confirmação automática com nome do cliente",
    "Integração com Pix, cartão e dinheiro",
    "Atendimento 24/7 — você dorme, ele vende",
  ];

  return (
    <section
      ref={sectionRef}
      className="py-20 lg:py-28 bg-gradient-to-br from-red-50 via-white to-red-50/60 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left - Content */}
          <div
            className={`lg:col-span-5 transition-colors duration-700 order-1 lg:order-1 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-sm font-bold tracking-widest text-red-500 uppercase mb-4 block">WHATSAPP BOT</span>

            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight mb-5">
              Robô no WhatsApp que<br />
              <span className="text-red-500">atende e vende por você.</span>
            </h2>

            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Conecte seu WhatsApp e os pedidos chegam automaticamente, sem você digitar nada. O bot recebe pedidos, mostra o cardápio, confirma pagamentos e envia atualizações — 24 horas por dia.
            </p>

            <div className="space-y-3 mb-10">
              {features.map((feat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-red-500" />
                  </div>
                  <span className="text-gray-700">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - iPhone Mockup with floating WhatsApp bubbles */}
          <div className={`lg:col-span-7 flex items-center justify-center lg:justify-end transition-colors duration-700 delay-500 order-2 lg:order-2 ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
          }`}>
            <div className="relative mx-auto w-[300px]">
              {/* Sombra suave */}
              <div className="absolute -inset-6 bg-gradient-to-br from-red-200/30 via-red-100/20 to-transparent rounded-[3rem] blur-2xl" />

              {/* Floating bubbles that "come out" of the phone */}
              {isVisible && (
                <>
                  {/* Bubble 1 - Bot welcome (left side, coming out) */}
                  <div className="absolute -left-[120px] top-[15%] z-30 animate-[fadeSlideLeft_0.6s_0.3s_both]" style={{ animation: 'fadeSlideLeft 0.6s 0.3s both' }}>
                    <div style={{
                      background: 'white',
                      borderRadius: '18px 18px 18px 4px',
                      padding: '12px 16px',
                      maxWidth: '220px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: '#1a1a1a',
                    }}>
                      <span>Boas vindas! 👋</span><br/>
                      <span>Faça seu pedido pelo link 👇</span><br/>
                      <span style={{ color: '#007AFF', textDecoration: 'underline' }}>https://mindi.com.br/sua-loja</span>
                      <div style={{ fontSize: '10px', color: '#8e8e93', textAlign: 'right', marginTop: '4px' }}>18:45</div>
                    </div>
                  </div>

                  {/* Bubble 2 - User message (right side, coming out) */}
                  <div className="absolute -right-[80px] top-[12%] z-30" style={{ animation: 'fadeSlideRight 0.6s 0.6s both' }}>
                    <div style={{
                      background: '#dcf8c6',
                      borderRadius: '18px 18px 4px 18px',
                      padding: '10px 14px',
                      maxWidth: '200px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.10)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: '#1a1a1a',
                    }}>
                      Boa noite! Gostaria do cardápio
                      <div style={{ fontSize: '10px', color: '#6b9f46', textAlign: 'right', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                        18:45 <span style={{ color: '#53bdeb' }}>✓✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Bubble 2.5 - User order message (right side, middle) */}
                  <div className="absolute -right-[70px] top-[32%] z-30" style={{ animation: 'fadeSlideRight 0.6s 0.75s both' }}>
                    <div style={{
                      background: '#dcf8c6',
                      borderRadius: '18px 18px 4px 18px',
                      padding: '10px 14px',
                      maxWidth: '200px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.10)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: '#1a1a1a',
                    }}>
                      Quero 1 Especial de Bacon com batata frita e um refrigerante zero, por favor. 🍔
                      <div style={{ fontSize: '10px', color: '#6b9f46', textAlign: 'right', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                        19:02 <span style={{ color: '#53bdeb' }}>✓✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Bubble 3 - Bot confirmation (left side, lower) */}
                  <div className="absolute -left-[100px] top-[55%] z-30" style={{ animation: 'fadeSlideLeft 0.6s 0.9s both' }}>
                    <div style={{
                      background: 'white',
                      borderRadius: '18px 18px 18px 4px',
                      padding: '12px 16px',
                      maxWidth: '230px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: '#1a1a1a',
                    }}>
                      Olá, Rodrigo!<br/>
                      Seu pedido foi confirmado! ✅<br/><br/>
                      Por aqui você receberá todas atualizações.
                      <div style={{ fontSize: '10px', color: '#8e8e93', textAlign: 'right', marginTop: '4px' }}>18:47</div>
                    </div>
                  </div>

                  {/* Bubble 3.5 - User emoji reaction (right side, lower) */}
                  <div className="absolute -right-[50px] bottom-[25%] z-30" style={{ animation: 'fadeSlideRight 0.6s 1.05s both' }}>
                    <div style={{
                      background: '#dcf8c6',
                      borderRadius: '18px 18px 4px 18px',
                      padding: '10px 14px',
                      maxWidth: '140px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                      fontSize: '20px',
                      lineHeight: 1.3,
                    }}>
                      😍😍😍😍
                      <div style={{ fontSize: '10px', color: '#8e8e93', textAlign: 'right', marginTop: '2px' }}>19:28 <span style={{ color: '#4fc3f7' }}>✓✓</span></div>
                    </div>
                  </div>

                  {/* Bubble 4 - Delivery update (left side, bottom) */}
                  <div className="absolute -left-[60px] bottom-[10%] z-30" style={{ animation: 'fadeSlideLeft 0.6s 1.2s both' }}>
                    <div style={{
                      background: 'white',
                      borderRadius: '18px 18px 18px 4px',
                      padding: '12px 16px',
                      maxWidth: '240px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: '#1a1a1a',
                    }}>
                      🛵 Seu pedido saiu para entrega!
                      <div style={{ fontSize: '10px', color: '#8e8e93', textAlign: 'right', marginTop: '4px' }}>19:01</div>
                    </div>
                  </div>
                </>
              )}
              
              {/* iPhone frame */}
              <div className="relative bg-[#1a1a1a] rounded-[3rem] pt-[10px] px-[10px] pb-[10px] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.35)]">
                {/* Botão lateral direito (power) */}
                <div className="absolute -right-[2px] top-[100px] w-[3px] h-[40px] bg-[#2a2a2a] rounded-r-sm" />
                {/* Botões laterais esquerdos (volume) */}
                <div className="absolute -left-[2px] top-[80px] w-[3px] h-[24px] bg-[#2a2a2a] rounded-l-sm" />
                <div className="absolute -left-[2px] top-[115px] w-[3px] h-[40px] bg-[#2a2a2a] rounded-l-sm" />
                <div className="absolute -left-[2px] top-[165px] w-[3px] h-[40px] bg-[#2a2a2a] rounded-l-sm" />
                
                {/* Tela do iPhone */}
                <div className="relative w-full rounded-[2.4rem] overflow-hidden bg-white" style={{ aspectRatio: '9/19.5' }}>
                  {/* iOS Status Bar */}
                  <div className="absolute top-0 left-0 right-0 z-20" style={{ padding: '4px 22px 0 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '22px' }}>
                    {/* Left: Time */}
                    <span style={{ color: '#000', fontSize: '11px', fontWeight: 600, letterSpacing: '0.2px', minWidth: '40px' }}>23:33</span>
                    {/* Center: Dynamic Island */}
                    <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '6px' }}>
                      <div className="w-[90px] h-[25px] bg-black rounded-full" />
                    </div>
                    {/* Right: Signal, WiFi, Battery */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '60px', justifyContent: 'flex-end' }}>
                      {/* Signal bars */}
                      <svg width="14" height="10" viewBox="0 0 17 12" fill="none">
                        <rect x="0" y="9" width="3" height="3" rx="0.5" fill="#000" />
                        <rect x="4.5" y="6" width="3" height="6" rx="0.5" fill="#000" />
                        <rect x="9" y="3" width="3" height="9" rx="0.5" fill="#000" />
                        <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="#000" opacity="0.3" />
                      </svg>
                      {/* WiFi */}
                      <svg width="12" height="10" viewBox="0 0 16 12" fill="#000">
                        <path d="M8 11.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5z" />
                        <path d="M5.17 8.33a4 4 0 0 1 5.66 0" stroke="#000" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                        <path d="M2.93 6.1a7 7 0 0 1 10.14 0" stroke="#000" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                        <path d="M0.7 3.86a10 10 0 0 1 14.6 0" stroke="#000" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                      </svg>
                      {/* Battery */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                        <div style={{ width: '20px', height: '9px', border: '1px solid #000', borderRadius: '2px', padding: '1px', position: 'relative' }}>
                          <div style={{ width: '75%', height: '100%', background: '#000', borderRadius: '1px' }} />
                        </div>
                        <div style={{ width: '1.5px', height: '4px', background: '#000', borderRadius: '0 1px 1px 0' }} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Static WhatsApp background (no messages) */}
                  <div className="absolute inset-0" style={{
                    background: '#ECE5DD',
                    backgroundImage: `url('https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/whatsapp-bg-doodles-fBmAvCzDRAgJYqa78i4X2R.webp')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    {/* WhatsApp header bar */}
                    <div style={{
                      background: '#f6f6f6',
                      borderBottom: '0.5px solid #d1d1d6',
                      padding: '42px 10px 6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      minHeight: '44px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                        <svg width="10" height="16" viewBox="0 0 12 20" fill="none"><path d="M10 2L2 10L10 18" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <span style={{ color: '#007AFF', fontSize: '13px' }}>9</span>
                      </div>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: '12px' }}>S</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#000', fontWeight: 600, fontSize: '12px', lineHeight: 1.2 }}>Seu estabelecimento</div>
                        <div style={{ color: '#8e8e93', fontSize: '9px', lineHeight: 1.2 }}>online</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ PDV TABLET CAROUSEL ============
function PdvTabletCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % PDV_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative" style={{ paddingBottom: '62%', background: '#f7f8fa' }}>
      {PDV_SLIDES.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`PDV do Mindi ${i + 1}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'left top',
            opacity: currentSlide === i ? 1 : 0,
            transition: 'opacity 0.6s ease-in-out',
          }}
          loading="lazy"
        />
      ))}
      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {PDV_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`rounded-full transition-colors duration-300 ${
              currentSlide === i
                ? 'w-5 h-2 bg-red-500'
                : 'w-2 h-2 bg-gray-400/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ============ RELATORIOS CAROUSEL ============
function RelatoriosCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % RELATORIOS_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative" style={{ paddingBottom: '62%', background: '#f7f8fa' }}>
      {RELATORIOS_SLIDES.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`Relatórios do Mindi ${i + 1}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'left top',
            opacity: currentSlide === i ? 1 : 0,
            transition: 'opacity 0.6s ease-in-out',
          }}
          loading="lazy"
        />
      ))}
      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {RELATORIOS_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`rounded-full transition-colors duration-300 ${
              currentSlide === i
                ? 'w-5 h-2 bg-red-500'
                : 'w-2 h-2 bg-gray-400/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ============ KDS CAROUSEL ============
function KdsCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % KDS_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative" style={{ paddingBottom: '62%', background: '#f7f8fa' }}>
      {KDS_SLIDES.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`KDS do Mindi ${i + 1}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'left top',
            opacity: currentSlide === i ? 1 : 0,
            transition: 'opacity 0.6s ease-in-out',
          }}
          loading="lazy"
        />
      ))}
      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {KDS_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`rounded-full transition-colors duration-300 ${
              currentSlide === i
                ? 'w-5 h-2 bg-red-500'
                : 'w-2 h-2 bg-gray-400/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ============ FEATURE 3: PDV + MESAS ============
function PDVMesasSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const features = [
    "PDV rápido — busca e categorias visuais",
    "Mapa de mesas com timer e status em tempo real",
    "Comanda digital — sem papel, sem erro",
    "Delivery, retirada e salão em um só lugar",
  ];

  const tables = [
    { num: "01", status: "livre" },
    { num: "02", status: "ocupada", value: "R$156", time: "45min" },
    { num: "03", status: "livre" },
    { num: "04", status: "ocupada", value: "R$89", time: "22min" },
    { num: "05", status: "livre" },
    { num: "06", status: "livre" },
    { num: "07", status: "ocupada", value: "R$234", time: "1h12" },
    { num: "08", status: "livre" },
    { num: "09", status: "livre" },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-20 lg:py-28 bg-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left - Content */}
          <div
            className={`lg:col-span-5 order-1 lg:order-1 transition-colors duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 mb-6">
              <Monitor className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">PDV + MESAS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight mb-5">
              PDV +{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">
                Mapa de Mesas
              </span>
            </h2>

            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Atendimento presencial sem papel, sem confusão. Veja quem está em cada mesa, quanto já consumiu e há quanto tempo — tudo em tempo real, integrado com a cozinha.
            </p>

            <div className="space-y-3 mb-10">
              {features.map((feat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-red-500" />
                  </div>
                  <span className="text-gray-700">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Tablet Mockup (mesmo estilo da seção Gestão de Pedidos) */}
          <div className="lg:col-span-7 relative flex items-center justify-center lg:justify-end order-2 lg:order-2" style={{ overflow: 'visible' }}>
            <div
              className={`relative w-full max-w-lg lg:max-w-none transition-colors duration-700 delay-200 ${
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
              }`}
            >
              {/* Tablet mockup frame */}
              <div
                className="relative rounded-[2rem] sm:rounded-[2.5rem] bg-[#1a1a1a] p-3 sm:p-4 shadow-2xl transition-transform duration-[1.2s] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                style={{
                  transform: isVisible ? 'translateX(0%)' : 'translateX(20%)',
                  width: '100%',
                }}
              >
                {/* Camera dot on top */}
                <div className="absolute top-[6px] sm:top-[8px] left-1/2 -translate-x-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#2a2a2a] border border-[#333]" />
                {/* Screen area with browser + screenshot */}
                <div className="relative overflow-hidden rounded-[1.2rem] sm:rounded-[1.5rem]">
                  {/* Browser chrome */}
                  <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-white rounded-lg px-4 py-1 text-[11px] text-gray-400 font-medium border border-gray-200 w-64 text-center">
                        app.mindi.com.br
                      </div>
                    </div>
                  </div>
                  {/* PDV carousel */}
                  <PdvTabletCarousel />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ FEATURE 3B: MAPA DE MESAS ============
function MapaMesasSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const features = [
    "Mapa de mesas com timer e status (livre/ocupada)",
    "Comandas digitais por mesa",
    "Controle total do salão em tempo real",
    "Integração direta com a cozinha",
  ];

  return (
    <section
      ref={sectionRef}
      className="py-20 lg:py-28 bg-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left - Content */}
          <div
            className={`lg:col-span-5 order-1 lg:order-1 transition-colors duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 mb-6">
              <LayoutGrid className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">MAPA DE MESAS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight mb-5">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">
                Mapa de Mesas
              </span>
            </h2>

            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Mapa de mesas com status em tempo real, comandas por mesa, e controle total do salão — tudo integrado com a cozinha.
            </p>

            <div className="space-y-3 mb-10">
              {features.map((feat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-red-500" />
                  </div>
                  <span className="text-gray-700">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Tablet Mockup (mesmo estilo da seção Gestão de Pedidos) */}
          <div className="lg:col-span-7 relative flex items-center justify-center lg:justify-end order-2 lg:order-2" style={{ overflow: 'visible' }}>
            <div
              className={`relative w-full max-w-lg lg:max-w-none transition-colors duration-700 delay-200 ${
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
              }`}
            >
              {/* Tablet mockup frame */}
              <div
                className="relative rounded-[2rem] sm:rounded-[2.5rem] bg-[#1a1a1a] p-3 sm:p-4 shadow-2xl transition-transform duration-[1.2s] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                style={{
                  transform: isVisible ? 'translateX(0%)' : 'translateX(20%)',
                  width: '100%',
                }}
              >
                {/* Camera dot on top */}
                <div className="absolute top-[6px] sm:top-[8px] left-1/2 -translate-x-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#2a2a2a] border border-[#333]" />
                {/* Screen area with browser + screenshot */}
                <div className="relative overflow-hidden rounded-[1.2rem] sm:rounded-[1.5rem]">
                  {/* Browser chrome */}
                  <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-white rounded-lg px-4 py-1 text-[11px] text-gray-400 font-medium border border-gray-200 w-64 text-center">
                        app.mindi.com.br
                      </div>
                    </div>
                  </div>
                  {/* PDV carousel */}
                  <PdvTabletCarousel />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ FEATURE UNIFIED: GESTÃO + PDV + MESAS ============
function UnifiedFeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pedidosContainerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pedidosScale, setPedidosScale] = useState(0.55);

  const TAB_DURATION = 8000; // 8 seconds per tab

  // Calculate scale for DemoPedidos - recalculate when activeTab changes (container remounts)
  useEffect(() => {
    if (activeTab !== 0) return; // Only calculate when Gestão de Pedidos tab is active
    let ro: ResizeObserver | null = null;
    // Small delay to ensure the container is mounted in the DOM
    const timer = setTimeout(() => {
      const container = pedidosContainerRef.current;
      if (!container) return;
      const updateScale = () => {
        const containerWidth = container.offsetWidth;
        if (containerWidth > 0) {
          setPedidosScale(containerWidth / 1310);
        }
      };
      updateScale();
      ro = new ResizeObserver(updateScale);
      ro.observe(container);
    }, 50);
    return () => {
      clearTimeout(timer);
      ro?.disconnect();
    };
  }, [activeTab]);

  // Intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-play with progress bar
  useEffect(() => {
    if (isPaused) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / TAB_DURATION) * 100, 100);
      setProgress(pct);
      if (elapsed >= TAB_DURATION) {
        setActiveTab((prev) => (prev + 1) % 4);
        setProgress(0);
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [activeTab, isPaused]);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    setProgress(0);
    setIsPaused(true);
    // Resume auto-play after 15 seconds of inactivity
    setTimeout(() => setIsPaused(false), 15000);
  };

  const tabs = [
    {
      id: 'gestao',
      icon: <LayoutGrid className="w-4 h-4" />,
      label: 'Gestão de Pedidos',
      title: <>Gestão de Pedidos{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">em Tempo Real</span></>,
      description: 'Chega de perder pedido. Painel Kanban intuitivo — do momento que o cliente pede até a entrega, você controla tudo sem anotar nada no papel.',
      features: [
        'Kanban: Novos → Preparo → Prontos → Completos',
        'Notificações em tempo real via WebSocket',
        'Impressão automática na cozinha',
        'Gestão de entregadores com repasses',
      ],
      mockupType: 'demoPedidos' as const,
    },
    {
      id: 'pdv',
      icon: <Monitor className="w-4 h-4" />,
      label: 'PDV',
      title: <>Ponto de Venda{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">(PDV)</span></>,
      description: 'Atendimento presencial sem papel, sem confusão. Veja quem está em cada mesa, quanto já consumiu e há quanto tempo — integrado com a cozinha.',
      features: [
        'PDV com busca rápida e categorias visuais',
        'Mapa de mesas com timer e status (livre/ocupada)',
        'Comandas digitais por mesa',
        'Delivery, retirada e consumo local em um só lugar',
      ],
      mockupType: 'pdvCarousel' as const,
    },
    {
      id: 'mesas',
      icon: <LayoutGrid className="w-4 h-4" />,
      label: 'Mapa de Mesas',
      title: <><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">Mapa de Mesas</span></>,
      description: 'Saiba exatamente o que acontece no salão. Status de cada mesa, tempo de ocupação e comanda digital — sem papel, sem erro.',
      features: [
        'Mapa de mesas com timer e status (livre/ocupada)',
        'Comandas digitais por mesa',
        'Controle total do salão em tempo real',
        'Integração direta com a cozinha',
      ],
      mockupType: 'pdvCarousel' as const,
    },
    {
      id: 'kds',
      icon: <Monitor className="w-4 h-4" />,
      label: 'KDS',
      title: <>Tela de Cozinha{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">(KDS)</span></>,
      description: 'Acabou a comanda ilegível. Pedidos aparecem na tela da cozinha em tempo real, com timer de produção e ordem de saída. Menos erro, mais agilidade.',
      features: [
        'Pedidos chegam instantaneamente à cozinha em tempo real',
        'Elimina comandas físicas perdidas ou ilegíveis',
        'Controle do tempo de produção de cada prato',
        'Organização da ordem de saída dos pedidos',
      ],
      mockupType: 'kdsImage' as const,
    },
    {
      id: 'relatorios',
      icon: <BarChart3 className="w-4 h-4" />,
      label: 'Relatórios',
      title: <>Relatórios{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">Inteligentes</span></>,
      description: 'Saiba exatamente quanto faturou, qual prato mais vende e o horário de pico. Dados que te ajudam a tomar decisões — não achismos.',
      features: [
        'Performance semanal e evolução mensal de receita',
        'Curva ABC de produtos com classificação Pareto 80/20',
        'DRE financeiro e análise de clientes (LTV)',
        'Mapa de sazonalidade e performance por canal',
      ],
      mockupType: 'relatoriosImage' as const,
    },
  ];

  const currentTab = tabs[activeTab];

  return (
    <section
      ref={sectionRef}
      className="py-20 lg:py-28 bg-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className={`text-center mb-12 transition-colors duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <span className="text-sm font-bold tracking-widest text-red-500 uppercase mb-4 block">FUNCIONALIDADES</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            Tudo num só lugar.<br />
            <span className="text-red-500">Sem improviso.</span>
          </h2>
          <p className="text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
            Pedidos, PDV, mapa de mesas, cozinha e relatórios — tudo conectado para você focar na comida.
          </p>
        </div>

        {/* Tabs */}
        <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-1 mb-12 transition-colors duration-700 delay-100 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(index)}
              className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden ${
                activeTab === index
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {/* Progress bar background */}
              {activeTab === index && !isPaused && (
                <div
                  className="absolute inset-0 bg-red-500/30 transition-none"
                  style={{ width: `${progress}%` }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className={`grid lg:grid-cols-12 gap-12 lg:gap-8 items-center transition-colors duration-700 delay-200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* Left - Content (changes based on active tab) */}
          <div className="lg:col-span-5 order-1 lg:order-1">
            <div key={activeTab} className="animate-in fade-in duration-500">
              <h3 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight mb-5">
                {currentTab.title}
              </h3>

              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                {currentTab.description}
              </p>

              <div className="space-y-3 mb-10">
                {currentTab.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-red-500" />
                    </div>
                    <span className="text-gray-700">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Tablet Mockup (changes based on active tab) */}
          <div className="lg:col-span-7 relative flex items-center justify-center lg:justify-end order-2 lg:order-2" style={{ overflow: 'visible' }}>
            <div className="relative w-full max-w-lg lg:max-w-none">
              {/* Tablet mockup frame */}
              <div
                className="relative rounded-[2rem] sm:rounded-[2.5rem] bg-[#1a1a1a] p-3 sm:p-4 shadow-2xl"
                style={{ width: '100%' }}
              >
                {/* Camera dot on top */}
                <div className="absolute top-[6px] sm:top-[8px] left-1/2 -translate-x-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#2a2a2a] border border-[#333]" />
                {/* Screen area */}
                <div className="relative overflow-hidden rounded-[1.2rem] sm:rounded-[1.5rem]">
                  {/* Browser chrome */}
                  <div className="bg-gray-100 border-b border-gray-200 px-3 py-1.5 flex items-center gap-1.5">
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-white rounded-md px-3 py-0.5 text-[10px] text-gray-400 font-medium border border-gray-200 w-56 text-center">
                        app.mindi.com.br
                      </div>
                    </div>
                  </div>
                  {/* Content based on active tab */}
                  {currentTab.mockupType === 'demoPedidos' ? (
                    <div ref={pedidosContainerRef} className="relative" style={{ paddingBottom: '62%', background: '#f7f8fa' }}>
                      <div style={{
                        width: '1310px',
                        height: Math.ceil(1310 * 0.62 / pedidosScale) + 'px',
                        transform: `scale(${pedidosScale})`,
                        transformOrigin: 'top left',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        pointerEvents: 'none',
                        overflow: 'hidden',
                      }}>
                        <DemoPedidos embedded />
                      </div>
                    </div>
                  ) : currentTab.mockupType === 'kdsImage' ? (
                    <KdsCarousel />
                  ) : currentTab.mockupType === 'relatoriosImage' ? (
                    <RelatoriosCarousel />
                  ) : (
                    <PdvTabletCarousel />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ FEATURE 4: MARKETING & FIDELIZAÇÃO ============
function MarketingSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const features = [
    "Campanhas SMS que trazem o cliente de volta",
    "Cupons de desconto que geram urgência",
    "Programa de fidelidade com carimbos digitais",
    "Stories no cardápio que contam sua história",
  ];

  const stamps: (boolean | string)[] = [true, true, true, true, true, true, true, false, false, "gift"];

  return (
    <section
      ref={sectionRef}
      className="py-20 lg:py-28 bg-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Content */}
          <div
            className={`transition-colors duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-sm font-bold tracking-widest text-red-500 uppercase mb-4 block">MARKETING INTEGRADO</span>

            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight mb-5">
              Fidelize clientes e<br />
              <span className="text-red-500">aumente o ticket médio.</span>
            </h2>

            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Seus clientes voltam porque você não deixa eles esquecerem. Campanhas SMS, cupons, programa de fidelidade e stories — tudo integrado, sem precisar de outra ferramenta.
            </p>

            <div className="space-y-3 mb-10">
              {features.map((feat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-orange-600" />
                  </div>
                  <span className="text-gray-700">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - 4 Floating Cards */}
          <div
            className={`relative transition-colors duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Card 1: SMS Promoção */}
              <div
                className={`bg-white rounded-2xl border border-gray-200 shadow-lg p-0 overflow-hidden transition-all duration-700 delay-300 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              >
                {/* iOS-style SMS notification */}
                <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">Mensagens</p>
                    <p className="text-[10px] text-gray-400">Agora</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Você ganhou R$15 de desconto! Use o cupom <span className="font-bold text-red-500">#15OFF</span> em pedidos acima de R$100. Aproveite!
                  </p>
                </div>
                <div className="px-4 pb-3">
                  <div className="inline-flex items-center gap-1 bg-green-50 text-green-600 text-[10px] font-semibold px-2 py-1 rounded-full">
                    <Send className="w-2.5 h-2.5" />
                    Enviado para 142 clientes
                  </div>
                </div>
              </div>

              {/* Card 2: Cupom de Desconto */}
              <div
                className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-700 delay-[400ms] ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              >
                {/* Red header */}
                <div className="bg-gradient-to-r from-red-500 to-red-500 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-white" />
                    <span className="text-xs font-bold text-white tracking-wide">CUPOM DE DESCONTO</span>
                  </div>
                  <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Ativo
                  </span>
                </div>
                {/* Body */}
                <div className="bg-white p-4">
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-black text-red-500 leading-none">R$10</span>
                    <span className="text-xs font-semibold text-red-400 mb-1">DE DESCONTO</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="border-2 border-dashed border-red-200 rounded-lg px-3 py-1.5">
                      <code className="text-sm font-mono font-bold text-red-500">VOLTA10</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span>Sem limite</span>
                    <span className="w-px h-3 bg-gray-200" />
                    <span>Usado: 0/2</span>
                    <span className="w-px h-3 bg-gray-200" />
                    <span>Valor Fixo</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Cartão Fidelidade */}
              <div
                className={`bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-100 p-5 shadow-lg transition-colors duration-700 delay-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                    Cartão Fidelidade
                  </h4>
                  <span className="text-[10px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium">7/10</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {stamps.map((s, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold ${
                        s === true
                          ? "bg-red-500 text-white shadow-sm"
                          : s === "gift"
                          ? "bg-gradient-to-br from-yellow-400 to-orange-400 text-white shadow-sm"
                          : "bg-white border border-dashed border-gray-300 text-gray-300"
                      }`}
                    >
                      {s === true ? "✓" : s === "gift" ? "🎁" : ""}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-500">Faltam 3 para o prêmio</p>
                  <span className="text-[10px] text-orange-500 font-semibold">+40% retorno</span>
                </div>
              </div>

              {/* Card 4: Stories */}
              <div
                className={`bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden transition-all duration-700 delay-[600ms] ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-400 via-red-500 to-purple-500 flex items-center justify-center">
                      <Play className="w-3 h-3 text-white ml-0.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">Stories</p>
                      <p className="text-[10px] text-gray-400">Visível no cardápio</p>
                    </div>
                  </div>
                  {/* Simulated stories bar */}
                  <div className="flex items-center gap-2 mb-3">
                    {/* Restaurant avatar with colorful ring */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-orange-400 via-red-500 to-purple-500">
                        <div className="w-full h-full rounded-full bg-white p-[2px]">
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                            <Utensils className="w-4 h-4 text-red-500" />
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] text-gray-500 font-medium">Sua loja</span>
                    </div>
                    {/* Other stories (dimmed) */}
                    {["🍕", "🍣"].map((emoji, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 opacity-40">
                        <div className="w-12 h-12 rounded-full p-[2px] bg-gray-300">
                          <div className="w-full h-full rounded-full bg-white p-[2px]">
                            <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-lg">
                              {emoji}
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] text-gray-400">Loja {i + 2}</span>
                      </div>
                    ))}
                  </div>
                  {/* Story preview */}
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-3 relative">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                        <Utensils className="w-2 h-2 text-red-500" />
                      </div>
                      <span className="text-[10px] text-white/80 font-medium">Burger House</span>
                      <span className="text-[9px] text-white/40 ml-auto">2h</span>
                    </div>
                    <p className="text-xs text-white font-medium leading-relaxed">
                      🔥 Promoção do dia!<br/>
                      Combo Especial por R$29,90
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full">187 views</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ HOW IT WORKS ============
function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      num: "1",
      icon: <UserPlus className="w-6 h-6 text-white" />,
      title: "Cadastre seu cardápio",
      desc: "Em 15 minutos seu cardápio digital está no ar. Sem cartão de crédito, sem compromisso, sem técnico.",
      bgImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/how-step1-signup-DuiQwcTurxmM5GepGhZiHu.webp",
    },
    {
      num: "2",
      icon: <Utensils className="w-6 h-6 text-white" />,
      title: "Conecte seu WhatsApp",
      desc: "Pedidos chegam automaticamente, sem você digitar nada. Seus clientes pedem pelo link, QR Code ou direto no WhatsApp.",
      bgImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/how-step2-manager-fWHM7i3HovgbEzfU3otjwX.webp",
    },
    {
      num: "3",
      icon: <Rocket className="w-6 h-6 text-white" />,
      title: "Acompanhe tudo no painel",
      desc: "Veja pedidos, faturamento e desempenho em tempo real. Saiba exatamente quanto faturou, qual prato mais vende e o horário de pico.",
      bgImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/how-step3-share-aSKnsvMktf7zpskdnTuFej.webp",
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="como-funciona"
      className="py-20 lg:py-28 bg-gradient-to-br from-red-50 via-white to-red-50/60 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - left aligned */}
        <div className={`max-w-2xl mb-16 transition-colors duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <span className="text-sm font-bold tracking-widest text-red-500 uppercase mb-4 block">COMO FUNCIONA</span>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight mb-5">
            Três passos para o<br />
            <span className="text-red-500">piloto automático.</span>
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            Sabemos que seu dia já é corrido demais pra ficar aprendendo sistema complicado. Por isso, simplificamos tudo.
          </p>
        </div>

        {/* Steps - horizontal cards with big numbers */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-colors duration-700 delay-200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {steps.map((step, i) => (
            <div
              key={i}
              className={`group relative transition-colors duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${300 + i * 150}ms` }}
            >
              <div className="relative rounded-2xl overflow-hidden transition-all duration-300 border border-transparent hover:border-red-200 h-full hover:shadow-xl hover:shadow-red-500/10">
                {/* Background image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${step.bgImage})` }}
                />
                {/* Red overlay similar to login page */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/50 via-red-500/40 to-red-500/50" />
                {/* Gradient overlay to white at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />

                <div className="relative p-8">
                  {/* Big number */}
                  <div className="text-[80px] font-black leading-none text-gray-200/60 group-hover:text-red-200/60 transition-colors duration-300 mb-4">
                    0{step.num}
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center text-white mb-5 shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ COMPARISON TABLE ============
// ============ TESTIMONIALS ============
function TestimonialsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const testimonials = [
    {
      name: "Carlos Mendes",
      role: "Dono do Burger House",
      text: "Antes eu passava mais tempo no WhatsApp do que na cozinha. Hoje o Mindi cuida dos pedidos e eu cuido da comida. Ticket médio subiu 35%.",
      stars: 5,
      initials: "CM",
    },
    {
      name: "Ana Paula",
      role: "Gerente do Sushi Kento",
      text: "Saímos do iFood e economizamos R$3.000/mês em taxas. Agora sei exatamente quanto faturo e os clientes pedem direto pelo nosso cardápio.",
      stars: 5,
      initials: "AP",
    },
    {
      name: "Roberto Silva",
      role: "Dono da Pizzaria Napoli",
      text: "Antes eu fechava o caixa na planilha e torcia pra dar certo. Agora sei quanto faturei, qual prato mais vende e tenho tempo pra criar receitas novas.",
      stars: 5,
      initials: "RS",
    },
    {
      name: "Fernanda Lima",
      role: "Dona do Café Aroma",
      text: "Montei o cardápio em 15 minutos, coloquei o QR Code nas mesas e pronto. Sem técnico, sem instalação. Durmo tranquila sabendo que o sistema tá rodando.",
      stars: 5,
      initials: "FL",
    },

  ];

  const avatarGradients = [
    "bg-gradient-to-br from-red-400 to-orange-400",
    "bg-gradient-to-br from-blue-400 to-indigo-400",
    "bg-gradient-to-br from-green-400 to-emerald-400",
    "bg-gradient-to-br from-purple-400 to-pink-400",
    "bg-gradient-to-br from-amber-400 to-yellow-400",
    "bg-gradient-to-br from-teal-400 to-cyan-400",
  ];

  return (
    <section
      ref={sectionRef}
      className="py-20 lg:py-28 bg-white overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16 gap-6 transition-colors duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <div>
            <span className="text-red-500 font-semibold text-sm tracking-wider uppercase mb-3 block">Depoimentos</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Quem usa,<br /><span className="text-red-500">recomenda.</span>
            </h2>
          </div>
          <p className="text-gray-500 max-w-md text-lg">Restaurantes que usam Mindi sabem quanto faturam, qual prato mais vende, e têm tempo para o que importa.</p>
        </div>

        {/* Card destaque grande */}
        <div className={`bg-gradient-to-br from-red-500 to-red-500 rounded-3xl p-8 lg:p-12 text-white mb-6 relative overflow-hidden transition-all duration-700 delay-200 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <Quote className="w-12 h-12 text-white/30 mb-6" />
            <p className="text-xl lg:text-2xl font-medium leading-relaxed mb-8 max-w-3xl">"{testimonials[0].text}"</p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">{testimonials[0].initials}</div>
              <div>
                <p className="font-bold text-lg">{testimonials[0].name}</p>
                <p className="text-white/70">{testimonials[0].role}</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Grid de cards menores */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 transition-colors duration-700 delay-400 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          {testimonials.slice(1).map((t, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-lg border border-transparent hover:border-gray-100 transition-[colors,box-shadow] duration-300">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, si) => (
                  <Star key={si} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 leading-relaxed my-5 text-sm">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full ${avatarGradients[i + 1]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


// ============ SEÇÃO DE PLANOS ============

const FEATURES_VISIBLE_LIMIT = 5;

function PlanFeaturesList({ features, highlighted, planId }: { features: string[]; highlighted: boolean; planId: string }) {
  const [expanded, setExpanded] = useState(false);
  const shouldLimit = planId === "basic" && features.length > FEATURES_VISIBLE_LIMIT;
  const visibleFeatures = shouldLimit && !expanded ? features.slice(0, FEATURES_VISIBLE_LIMIT) : features;
  const hiddenCount = features.length - FEATURES_VISIBLE_LIMIT;

  return (
    <div className="mb-7">
      <ul className="space-y-2.5">
        {visibleFeatures.map((feature, i) => (
          <li key={i} className={`flex items-center gap-2.5 text-sm ${
            highlighted ? "text-white/90" : "text-gray-600"
          }`}>
            <Check className={`w-4 h-4 flex-shrink-0 ${
              highlighted ? "text-white" : "text-red-500"
            }`} />
            {feature}
          </li>
        ))}
      </ul>
      {shouldLimit && !expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className={`flex items-center gap-1.5 mt-3 text-sm font-semibold transition-colors ${
            highlighted ? "text-black hover:text-gray-800" : "text-black hover:text-gray-700"
          } shimmer-text-white`}
        >
          <ChevronDown className="w-4 h-4" />
          Ver mais {hiddenCount} recursos
        </button>
      )}
    </div>
  );
}

// Configuração visual fixa para cada plano (metadados que não ficam no banco)
const PLAN_VISUAL_CONFIG: Record<string, {
  fallbackName: string;
  subtitle: string;
  buttonText: string;
  highlighted?: boolean;
  badge?: string;
  buttonSubtitle?: string;
  fallbackFeatures: string[];
}> = {
  trial: {
    fallbackName: "Teste Grátis",
    subtitle: "Para quem está começando",
    buttonText: "Começar teste grátis",
    buttonSubtitle: "Ideal para começar e validar",
    fallbackFeatures: [
      "Teste grátis por 15 dias",
      "1 estabelecimento",
      "Link personalizado para o seu restaurante",
      "Gerenciador de pedidos",
    ],
  },
  lite: {
    fallbackName: "Lite",
    subtitle: "Para pequenos negócios",
    buttonText: "Assinar Starter →",
    buttonSubtitle: "Para dar o primeiro passo profissional",
    fallbackFeatures: [
      "Tudo do plano gratuito",
      "1 estabelecimento",
      "Suporte pelo WhatsApp",
      "Dashboard completa",
    ],
  },
  basic: {
    fallbackName: "Essencial",
    subtitle: "Para negócios em crescimento",
    buttonText: "Assinar Essencial →",
    highlighted: true,
    badge: "Mais Popular",
    buttonSubtitle: "Tudo que seu restaurante precisa",
    fallbackFeatures: [
      "Tudo do plano Lite",
      "1 estabelecimento",
      "Suporte pelo WhatsApp",
      "Dashboard completa",
      "Relatórios financeiros",
      "Campanhas SMS",
      "Cupons de desconto",
    ],
  },
  pro: {
    fallbackName: "Pro",
    subtitle: "Para operações avançadas",
    buttonText: "Assinar Pro →",
    buttonSubtitle: "Máximo controle e automação",
    fallbackFeatures: [
      "Tudo do plano Essencial",
      "Estabelecimentos ilimitados",
      "Análises avançadas",
      "Assistente de IA",
      "Relatórios personalizados",
      "Programa de fidelidade",
    ],
  },
};

const PLAN_ORDER = ["trial", "lite", "basic", "pro"];

function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Buscar dados dinâmicos dos planos do banco de dados
  const { data: planData } = trpc.plans.getData.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // Montar planos combinando dados do banco com configuração visual
  const plans = useMemo(() => {
    return PLAN_ORDER.map((planId) => {
      const visual = PLAN_VISUAL_CONFIG[planId];
      const priceData = planData?.prices?.find((p: { planId: string }) => p.planId === planId);
      const featureData = planData?.features?.filter((f: { planId: string }) => f.planId === planId)
        .sort((a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder);

      const monthlyPrice = priceData ? priceData.monthlyPriceCents / 100 : 0;
      const annualPrice = priceData ? priceData.annualPriceCents / 100 : 0;
      const features = featureData && featureData.length > 0
        ? featureData.map((f: { text: string }) => f.text)
        : visual?.fallbackFeatures || [];

      return {
        id: planId,
        name: priceData?.displayName || visual?.fallbackName || planId,
        price: { monthly: monthlyPrice, annual: annualPrice },
        features,
        buttonText: visual?.buttonText || "Começar agora",
        highlighted: visual?.highlighted || false,
        badge: visual?.badge,
        subtitle: visual?.subtitle || "",
      };
    });
  }, [planData]);

  return (
    <section
      ref={sectionRef}
      id="precos"
      className="py-20 md:py-28 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Header: título à esquerda, toggle à direita */}
        <div
          className={`flex flex-col lg:flex-row lg:items-end lg:justify-between mb-14 gap-6 transition-colors duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div>
            <span className="text-sm font-bold tracking-widest text-red-500 uppercase mb-4 block">INVESTIMENTO</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">Planos que cabem<br />no seu <span className="text-red-500">bolso.</span></h2>
          </div>
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                !isAnnual ? "bg-white shadow text-gray-900" : "text-gray-500"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                isAnnual ? "bg-white shadow text-gray-900" : "text-gray-500"
              }`}
            >
              Anual <span className="text-green-600 text-xs font-bold ml-1">-17%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid - 4 colunas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan, index) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            const delay = 200 + index * 150;
            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-7 transition-all duration-700 relative overflow-hidden group ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                } ${
                  plan.highlighted
                    ? "bg-gradient-to-br from-red-500 to-red-500 text-white shadow-2xl shadow-red-200/50 lg:scale-105"
                    : "bg-gray-50 border border-gray-200 hover:border-red-200 hover:shadow-lg"
                }`}
                style={{ transitionDelay: `${delay}ms` }}
              >
                {/* Decorative circles for highlighted */}
                {plan.highlighted && (
                  <>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                  </>
                )}
                <div className="relative z-10">
                  {/* Badge */}
                  {plan.badge && (
                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${
                      plan.highlighted ? "bg-white/20 text-white" : "bg-red-100 text-red-500"
                    }`}>
                      {plan.badge}
                    </span>
                  )}

                  {/* Plan Name */}
                  <h3 className={`text-xl font-bold mb-1 ${
                    plan.highlighted ? "text-white" : "text-gray-900"
                  }`}>{plan.name}</h3>
                  <p className={`text-sm mb-5 ${
                    plan.highlighted ? "text-white/70" : "text-gray-500"
                  }`}>
                    {plan.subtitle}
                  </p>

                  {/* Price */}
                  <div className="mb-5">
                    <span className={`text-4xl font-extrabold ${
                      plan.highlighted ? "text-white" : "text-gray-900"
                    }`}>
                      {price === 0 ? "Grátis" : formatPrice(price)}
                    </span>
                    {price > 0 && (
                      <span className={`text-sm ml-1 ${
                        plan.highlighted ? "text-white/60" : "text-gray-400"
                      }`}>{isAnnual ? "/ano" : "/mês"}</span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className={`h-px mb-5 ${
                    plan.highlighted ? "bg-white/20" : "bg-gray-200"
                  }`} />

                  {/* Features */}
                  <PlanFeaturesList features={plan.features} highlighted={plan.highlighted || false} planId={plan.id} />

                  {/* CTA Button */}
                  <a
                    href={`https://app.mindi.com.br/criar-conta?plan=${plan.id === 'trial' ? 'free' : plan.id === 'lite' ? 'starter' : plan.id === 'basic' ? 'essencial' : 'pro'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block w-full text-center py-3.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
                      plan.highlighted
                        ? "bg-white text-red-500 hover:bg-gray-100"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  >
                    {plan.buttonText}
                  </a>
                  {PLAN_VISUAL_CONFIG[plan.id]?.buttonSubtitle && (
                    <p className={`text-center text-xs mt-2 ${plan.highlighted ? "text-white/60" : "text-gray-400"}`}>
                      {PLAN_VISUAL_CONFIG[plan.id].buttonSubtitle}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <div
          className={`text-center mt-10 transition-colors duration-700 delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-sm text-gray-400">
            Todos os planos incluem suporte técnico. Cancele a qualquer momento.
          </p>
        </div>
      </div>
    </section>
  );
}

// ============ FAQ SECTION ============
const FAQ_DATA = [
  {
    question: "Como funciona o período grátis?",
    answer: "Você cria sua conta em 2 minutos, sem cartão de crédito. Tem acesso ao plano Gratuito com até 30 pedidos por mês, sem limite de tempo. Quando precisar de mais, é só fazer upgrade."
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim! Sem fidelidade, sem multa, sem burocracia. Cancela quando quiser, direto pelo painel. Seu acesso continua até o final do período pago."
  },

  {
    question: "Como meus clientes fazem pedidos?",
    answer: "Seus clientes acessam pelo link ou QR Code direto no celular — sem baixar app, sem cadastro. Escolhem os produtos e o pedido chega no seu painel em tempo real. Simples assim."
  },

  {
    question: "O sistema funciona para delivery e mesa?",
    answer: "Sim! O Mindi atende tanto delivery (com gestão de entregadores, taxas por bairro e rastreamento) quanto pedidos presenciais com mapa de mesas e comanda digital."
  },

  {
    question: "Posso integrar com impressora de pedidos?",
    answer: "Sim! O Mindi suporta impressão automática de pedidos em impressoras térmicas. Assim que o pedido entra, ele já sai impresso na cozinha, agilizando o preparo."
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="faq" className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-16 items-start">
          {/* Coluna esquerda — Título, descrição e CTA */}
          <div className={`transition-colors duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-x-8"} lg:sticky lg:top-28`}>
            <span className="text-sm font-bold text-red-500 tracking-[0.2em] uppercase block mb-4">DÚVIDAS</span>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-gray-900 leading-[1.1] mb-5">
              Perguntas<br />
              <span className="text-red-500">frequentes.</span>
            </h2>
            <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-8">
              Tudo o que você precisa saber antes de começar a usar o Mindi. Se não encontrar sua resposta, fale com a gente.
            </p>
            <a
              href="https://api.whatsapp.com/send/?phone=553498807793&text&type=phone_number&app_absent=0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-500 text-white font-semibold px-7 py-3.5 rounded-xl hover:scale-[1.02] transition-transform duration-300"
            >
              Fale com um consultor
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Coluna direita — Accordion */}
          <div className="space-y-3">
            {FAQ_DATA.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className={`transition-colors duration-500 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  } bg-white rounded-xl border ${
                    isOpen ? "border-red-200" : "border-gray-200"
                  }`}
                  style={{ transitionDelay: isVisible ? `${200 + index * 80}ms` : "0ms" }}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 text-left"
                  >
                    <span className={`text-sm sm:text-base font-semibold pr-4 transition-colors ${
                      isOpen ? "text-red-500" : "text-gray-800"
                    }`}>
                      {faq.question}
                    </span>
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      isOpen ? "bg-red-50 rotate-0" : "bg-gray-100 rotate-180"
                    }`}>
                      <ChevronUp className={`w-4 h-4 transition-colors ${isOpen ? "text-red-500" : "text-gray-400"}`} />
                    </div>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 sm:px-6 pb-5 pt-0">
                      <div className="h-px bg-gray-100 mb-4" />
                      <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ CTA FINAL SECTION ============
function CTAFinalSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 relative overflow-hidden bg-gradient-to-b from-gray-50 to-red-50">
      {/* Background de ícones de comida - mesmo do chat */}
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `url('https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/chat-bg-option3-dXq5isMUuMCqTpaKJbbZwr.webp')`,
          backgroundSize: '400px auto',
          backgroundRepeat: 'repeat',
        }}
      />
      {/* Degradê branco no topo para transição suave */}
      <div
        className="absolute inset-x-0 top-0 h-80 z-[1]"
        style={{
          background: 'linear-gradient(to bottom, rgb(249,250,251) 0%, transparent 100%)',
        }}
      />
      <div className="relative z-[2] max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className={`transition-colors duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="text-sm font-bold text-red-500 tracking-[0.2em] uppercase block mb-4">COMECE AGORA</span>
        </div>

        <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-5 leading-[1.1] transition-colors duration-700 delay-150 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          Seu restaurante pode<br />
          <span className="text-red-500">vender muito mais.</span>
        </h2>

        <p className={`text-base sm:text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed transition-colors duration-700 delay-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          Junte-se a centenas de restaurantes que já economizam milhares de reais por mês com o Mindi. Crie sua conta grátis em menos de 2 minutos.
        </p>

        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 transition-colors duration-700 delay-500 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <a
            href="https://app.mindi.com.br/criar-conta"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 bg-red-500 hover:bg-red-500 text-white font-bold px-8 py-4 rounded-xl text-base transition-transform duration-300 hover:-translate-y-0.5"
          >
            Criar conta grátis
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="https://api.whatsapp.com/send/?phone=553498807793&text&type=phone_number&app_absent=0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-xl text-base border border-gray-200 hover:border-gray-300 transition-colors duration-300"
          >
            <MessageCircle className="w-5 h-5 text-gray-500" />
            Falar com especialista
          </a>
        </div>

        {/* Trust signals */}
        <div className={`flex flex-wrap items-center justify-center gap-6 sm:gap-8 transition-colors duration-700 delay-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          {[
            { icon: Shield, text: "Dados protegidos" },
            { icon: Zap, text: "Sem taxa por pedido" },
            { icon: Clock, text: "Sem contrato" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2">
              <item.icon className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-500">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ FOOTER ============
function LandingFooter() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    "LINKS ÚTEIS": [
      { label: "Início", href: "#" },
      { label: "Planos", href: "#precos" },
      { label: "Como funciona", href: "#como-funciona" },
      { label: "Recursos", href: "#funcionalidades" },
      { label: "Blog", href: "#" },
      { label: "Entrar", href: "https://app.mindi.com.br/login" },
    ],
    "SEGMENTOS": [
      { label: "Pizzarias", href: "#" },
      { label: "Hamburguerias", href: "#" },
      { label: "Restaurantes", href: "#" },
      { label: "Cafeterias", href: "#" },
    ],
    "LEGAL": [
      { label: "Termos de uso", href: "/termos" },
      { label: "Política de privacidade", href: "/privacidade" },
    ],
  };

  return (
    <footer className="bg-red-50 text-gray-600 pt-16 pb-0 relative overflow-hidden">
      {/* Background de ícones de comida - mesmo do chat */}
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `url('https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/chat-bg-option3-dXq5isMUuMCqTpaKJbbZwr.webp')`,
          backgroundSize: '400px auto',
          backgroundRepeat: 'repeat',
        }}
      />
      <div className="relative max-w-6xl mx-auto px-6 sm:px-8">
        {/* Top section: Brand + Link columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 mb-14">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <img
              src={LANDING_FOOTER_LOGO_BLACK_TEXT}
              alt="Mindi"
              className="mb-4 h-[28.9189px] w-auto object-contain"
              loading="lazy"
            />
            <p className="text-sm leading-relaxed text-gray-600 mb-6 max-w-xs">
               Gestão completa para restaurantes. Cardápio digital, pedidos por WhatsApp, controle financeiro e cozinha organizada — tudo em um lugar só.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/mindi_br"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-colors duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-4.5 h-4.5" />
              </a>
              <span
                className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center cursor-default opacity-50"
                aria-label="Website"
              >
                <Globe className="w-4.5 h-4.5" />
              </span>
              <span
                className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center cursor-default opacity-50"
                aria-label="YouTube"
              >
                <Play className="w-4.5 h-4.5" />
              </span>
            </div>
          </div>

          {/* Links columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-5">
                  {title}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Contact section */}
        <div className="mb-12">
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-5">
            CONTATO
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-600">contato@mindi.com.br</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p>Ituiutaba - Minas Gerais</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-300" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-5">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="font-semibold text-gray-700">Gtek - Serviços digitais</span>
            <span className="hidden sm:inline">·</span>
            <span>CNPJ: 49.377.950/0001-29</span>
          </div>
          <p className="text-xs text-gray-600">
            &copy; {currentYear} Mindi. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ============ MAIN LANDING PAGE ============
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      <HeroSection />
      <StatsBarSection />
      <DashboardShowcaseSection />
      <ProblemSolutionSection />
      <UnifiedFeaturesSection />
      <WhatsAppBotSection />
      <MarketingSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />

      <ClientsShowcaseSection />
      <SegmentsSection />
      <FAQSection />
      <CTAFinalSection />
      <LandingFooter />
    </div>
  );
}
