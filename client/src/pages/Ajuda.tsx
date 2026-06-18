import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/shared";
import {
  MessageCircle,
  Mail,
  Phone,
  Play,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ExternalLink,
  BookOpen,
  FileQuestion,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Contact Card Component - estilo Dashboard (ícone pastel + layout horizontal)
interface ContactCardProps {
  icon: React.ReactNode;
  iconBg: string;
  hoverBorder: string;
  title: string;
  subtitle: string;
  href: string;
}

function ContactCard({ icon, iconBg, hoverBorder, title, subtitle, href }: ContactCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-3 p-4 bg-card rounded-xl border border-border/50 transition-colors duration-200 cursor-pointer group",
        "hover:shadow-lg",
        hoverBorder
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
          iconBg
        )}
        style={{ borderRadius: '12px' }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
    </a>
  );
}

// Video Chapter Component
interface VideoChapterProps {
  time: string;
  title: string;
  onClick?: () => void;
}

function VideoChapter({ time, title, onClick }: VideoChapterProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full py-3 px-3 text-left hover:bg-muted/50 border-b border-border/50 last:border-b-0 transition-colors rounded-lg"
    >
      <span className="text-xs font-mono text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded">{time}</span>
      <span className="text-sm text-foreground">{title}</span>
    </button>
  );
}

// FAQ Accordion Item Component
interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className={cn(
      "rounded-xl border transition-colors duration-200 mb-2 last:mb-0",
      isOpen ? "border-border bg-card shadow-sm" : "border-border/50 bg-card hover:border-border hover:shadow-sm"
    )}>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-4 px-5 text-left"
      >
        <span className="text-sm font-medium text-foreground pr-4">{question}</span>
        <div className={cn(
          "h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
          isOpen ? "bg-red-100 dark:bg-red-500/15" : "bg-muted"
        )}>
          {isOpen ? (
            <ChevronUp className={cn("h-4 w-4", isOpen ? "text-red-500 dark:text-red-400" : "text-muted-foreground")} />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

// FAQ Data
const faqData = [
  {
    question: "Como faço para cadastrar meu cardápio?",
    answer:
      "Vá em Cardápio → \"Adicionar Item\" → preencha as informações do produto (nome, descrição, preço, foto) → clique em Salvar. Seu item estará disponível imediatamente no cardápio digital.",
  },
  {
    question: "Meus dados estão seguros e privados?",
    answer:
      "Sim. Utilizamos criptografia e seguimos as melhores práticas de segurança para proteger seus dados. Suas informações nunca são compartilhadas com terceiros.",
  },
  {
    question: "Posso cancelar minha assinatura a qualquer momento?",
    answer:
      "Sim. Você pode cancelar sua assinatura a qualquer momento diretamente pelo painel, sem multas ou taxas adicionais.",
  },
  {
    question: "Como funciona o bot do WhatsApp?",
    answer:
      "Nosso bot permite que seus clientes façam pedidos, consultem o cardápio e recebam atualizações sobre seus pedidos diretamente pelo WhatsApp.",
  },
];

// Video Chapters Data
const videoChapters = [
  { time: "0:00", title: "Introdução" },
  { time: "1:05", title: "Visão Geral do Painel" },
  { time: "3:00", title: "Cadastrando Produtos" },
  { time: "6:00", title: "Gerenciando Pedidos" },
  { time: "10:00", title: "Configurando Categorias" },
  { time: "12:00", title: "Personalizando o Cardápio" },
  { time: "15:00", title: "Relatórios e Métricas" },
  { time: "18:00", title: "Dicas e Boas Práticas" },
];

export default function Ajuda() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <PageHeader 
          title="Ajuda e Suporte" 
          description="Central de ajuda e suporte ao cliente"
          icon={<HelpCircle className="h-6 w-6 text-blue-600" />}
        />
      </div>

      {/* Block 1 - Contact Channels */}
      <div className="bg-card rounded-xl border border-border/50 p-5 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
            <Headphones className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">Como podemos ajudar você?</h3>
            <p className="text-xs text-muted-foreground">Entre em contato pelo canal de sua preferência</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ContactCard
            icon={<MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
            iconBg="bg-green-100 dark:bg-green-500/15"
            hoverBorder="hover:border-green-200 dark:hover:border-green-800/50"
            title="Suporte via WhatsApp"
            subtitle="Fale conosco instantaneamente"
            href="https://wa.me/5534998807793?text=Ol%C3%A1%2C%20queria%20tirar%20uma%20duvida%2C%20pode%20me%20ajudar%3F"
          />
          <ContactCard
            icon={<Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            iconBg="bg-amber-100 dark:bg-amber-500/15"
            hoverBorder="hover:border-amber-200 dark:hover:border-amber-800/50"
            title="Envie um E-mail"
            subtitle="contato@mindi.com.br"
            href="mailto:contato@mindi.com.br"
          />
          <ContactCard
            icon={<Phone className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />}
            iconBg="bg-cyan-100 dark:bg-cyan-500/15"
            hoverBorder="hover:border-cyan-200 dark:hover:border-cyan-800/50"
            title="Suporte por Telefone"
            subtitle="+55 (34) 99880-7793"
            href="tel:+5534998807793"
          />
        </div>
      </div>

      {/* Block 2 - Video Tutorial */}
      <div className="bg-card rounded-xl border border-border/50 p-5 mb-6 transition-shadow hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800/50">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">Tutorial</h3>
            <p className="text-xs text-muted-foreground">Aprenda a usar todas as funcionalidades do painel</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Video Player - 3 columns */}
          <div className="lg:col-span-3">
            <div className="relative aspect-video bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-xl overflow-hidden group cursor-pointer">
              {/* Dashboard mockup background */}
              <div className="absolute inset-0 opacity-40">
                <div className="absolute top-4 left-4 text-white text-xs font-medium">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-white/20 rounded" />
                    <span>Painel</span>
                  </div>
                </div>
              </div>
              
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="h-7 w-7 text-white ml-1" fill="white" />
                </div>
              </div>
              
              {/* Video title overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5">
                <h3 className="text-white font-bold text-xl leading-tight">
                  Tutorial do Cardápio Digital
                  <br />
                  (2025) – Guia Completo
                </h3>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              Tutorial do Cardápio Digital (2025) – Guia Completo
            </p>
          </div>

          {/* Video Chapters - 2 columns */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Capítulos do Vídeo
            </h3>
            <div className="max-h-[320px] overflow-y-auto">
              {videoChapters.map((chapter, index) => (
                <VideoChapter
                  key={index}
                  time={chapter.time}
                  title={chapter.title}
                  onClick={() => {
                    console.log(`Ir para ${chapter.time}`);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Block 3 - FAQ */}
      <div className="bg-card rounded-xl border border-border/50 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
            <FileQuestion className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">Perguntas Frequentes</h3>
            <p className="text-xs text-muted-foreground">Respostas para as dúvidas mais comuns</p>
          </div>
        </div>
        <div>
          {faqData.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openFAQ === index}
              onToggle={() => toggleFAQ(index)}
            />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
