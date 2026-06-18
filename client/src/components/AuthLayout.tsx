import { ReactNode, useEffect, useState, useRef } from "react";
import { Smartphone, BarChart3, Clock } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const BG_OPTIMIZED = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/RGXZrAZifRctLVFg.jpg";
const BG_PLACEHOLDER = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/NGESLtTMlNimKDep.jpg";

interface AuthLayoutProps {
  children: ReactNode;
  backgroundImage?: string;
  backgroundPlaceholder?: string;
}

export function AuthLayoutBackground({ backgroundImage, backgroundPlaceholder }: { backgroundImage?: string; backgroundPlaceholder?: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const src = backgroundImage || BG_OPTIMIZED;
    setImageLoaded(false);
    const img = new Image();
    img.src = src;
    imgRef.current = img;
    if (img.complete) {
      setImageLoaded(true);
    } else {
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageLoaded(true);
    }
    return () => { img.onload = null; img.onerror = null; };
  }, [backgroundImage]);

  const finalSrc = backgroundImage || BG_OPTIMIZED;
  const placeholderSrc = backgroundPlaceholder || BG_PLACEHOLDER;

  return (
    <>
      <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-gray-900 via-gray-800 to-black' : 'from-red-500 via-red-500 to-red-500'}`} />
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-300"
        style={{ backgroundImage: `url(${placeholderSrc})`, filter: 'blur(20px)', transform: 'scale(1.1)', opacity: imageLoaded ? 0 : 1 }}
      />
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-out"
        style={{ backgroundImage: `url(${finalSrc})`, opacity: imageLoaded ? 1 : 0 }}
      />
      <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-black/70 via-gray-900/70 to-black/80' : 'from-red-500/60 via-red-500/60 to-red-500/60'}`} />
      <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
      <div className="relative z-10 flex flex-col justify-end p-12 w-full h-full">
        <div className="max-w-2xl">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6" style={{marginRight: '-130px'}}>
            Gerencie seu restaurante de um jeito simples e inteligente.
          </h1>
          <p className="text-white/80 text-lg mb-8" style={{marginRight: '-130px'}}>
            Cardápio digital, gestão de pedidos, controle de estoque e muito mais — tudo em uma única plataforma pensada para o seu negócio crescer.
          </p>
          <div className="flex flex-wrap gap-3" style={{marginRight: '-123px'}}>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              <Smartphone className="w-4 h-4" /><span>Cardápio Digital</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              <BarChart3 className="w-4 h-4" /><span>Relatórios Completos</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              <Clock className="w-4 h-4" /><span>Gestão de Pedidos</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-8">
          <div className="flex -space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">JM</div>
            <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">AS</div>
            <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">PL</div>
            <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">RC</div>
          </div>
          <span className="text-white/80 text-sm">
            Junte-se a mais de <strong className="text-white">500+</strong> restaurantes satisfeitos
          </span>
        </div>
      </div>
    </>
  );
}

export function AuthLayout({ children, backgroundImage, backgroundPlaceholder }: AuthLayoutProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Preload the optimized background image
  useEffect(() => {
    const src = backgroundImage || BG_OPTIMIZED;
    setImageLoaded(false); // Reset when image changes
    const img = new Image();
    img.src = src;
    imgRef.current = img;

    if (img.complete) {
      setImageLoaded(true);
    } else {
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageLoaded(true); // fallback to gradient
    }

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [backgroundImage]);

  const finalSrc = backgroundImage || BG_OPTIMIZED;
  const placeholderSrc = backgroundPlaceholder || BG_PLACEHOLDER;

  return (
    <div className="h-[100dvh] min-h-[100dvh] lg:h-auto lg:min-h-screen flex overflow-x-hidden">
      {/* Left side - Background with promotional content */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Fallback gradient - always visible immediately */}
        <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-gray-900 via-gray-800 to-black' : 'from-red-500 via-red-500 to-red-500'}`} />

        {/* Tiny placeholder with blur - loads instantly (~700 bytes) */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-300"
          style={{ 
            backgroundImage: `url(${placeholderSrc})`,
            filter: 'blur(20px)',
            transform: 'scale(1.1)', // prevent blur edges from showing
            opacity: imageLoaded ? 0 : 1,
          }}
        />

        {/* Full quality image - fades in when loaded */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-out"
          style={{ 
            backgroundImage: `url(${finalSrc})`,
            opacity: imageLoaded ? 1 : 0,
          }}
        />

        {/* Overlay - red in light mode, dark in dark mode */}
        <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-black/70 via-gray-900/70 to-black/80' : 'from-red-500/60 via-red-500/60 to-red-500/60'}`} />
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        
        {/* Content - Bottom aligned */}
        <div className="relative z-10 flex flex-col justify-end p-12 w-full h-full">
          {/* Main text */}
          <div className="max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6" style={{marginRight: '-130px'}}>
              Gerencie seu restaurante de um jeito simples e inteligente.
            </h1>
            <p className="text-white/80 text-lg mb-8" style={{marginRight: '-130px'}}>
              Cardápio digital, gestão de pedidos, controle de estoque e muito mais — tudo em uma única plataforma pensada para o seu negócio crescer.
            </p>
            
            {/* Feature badges */}
            <div className="flex flex-wrap gap-3" style={{marginRight: '-123px'}}>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                <Smartphone className="w-4 h-4" />
                <span>Cardápio Digital</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                <BarChart3 className="w-4 h-4" />
                <span>Relatórios Completos</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                <Clock className="w-4 h-4" />
                <span>Gestão de Pedidos</span>
              </div>
            </div>
          </div>
          
          {/* Social proof */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">JM</div>
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">AS</div>
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">PL</div>
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">RC</div>
            </div>
            <span className="text-white/80 text-sm">
              Junte-se a mais de <strong className="text-white">500+</strong> restaurantes satisfeitos
            </span>
          </div>
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 h-full lg:min-h-screen flex flex-col lg:items-center lg:justify-center overflow-y-auto px-6 py-6 sm:p-8 transition-colors duration-200 bg-white dark:bg-background">
        <div className="w-full max-w-md my-auto lg:my-0">
          {children}
        </div>
      </div>
    </div>
  );
}
