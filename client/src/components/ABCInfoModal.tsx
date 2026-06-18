import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Target,
  TrendingUp,
} from "lucide-react";

interface ABCInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TOTAL_STEPS = 4;

export function ABCInfoModal({ open, onOpenChange }: ABCInfoModalProps) {
  const [step, setStep] = useState(0);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => setStep(0), 300);
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else handleClose();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden border-border/50 [&>button]:hidden">
        <DialogTitle className="sr-only">Entenda a Curva ABC</DialogTitle>
        {/* Progress bar */}
        <div className="flex gap-1.5 px-6 pt-5 pb-0">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-emerald-500" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="px-6 pt-5 pb-4 min-h-[340px] flex flex-col">
          {step === 0 && <Step1 />}
          {step === 1 && <Step2 />}
          {step === 2 && <Step3 />}
          {step === 3 && <Step4 />}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 pb-5 pt-0">
          <div>
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={prev} className="text-muted-foreground gap-1">
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleClose} className="text-muted-foreground">
                Pular
              </Button>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{step + 1} de {TOTAL_STEPS}</span>
          <Button
            size="sm"
            onClick={next}
            className={`gap-1 ${
              step === TOTAL_STEPS - 1
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {step === TOTAL_STEPS - 1 ? "Entendi!" : "Próximo"}
            {step < TOTAL_STEPS - 1 && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Step 1: O que é a Curva ABC ─── */
function Step1() {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
        <BarChart3 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">O que é a Curva ABC?</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A Curva ABC é uma técnica de classificação baseada no <strong className="text-foreground">Princípio de Pareto (80/20)</strong>, muito usada em gestão de restaurantes.
        </p>
      </div>
      <div className="bg-emerald-50 dark:bg-emerald-500/5 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-500/10">
        <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
          A ideia é simples: <strong>poucos produtos geram a maior parte do seu faturamento</strong>. Saber quais são esses produtos é essencial para tomar decisões inteligentes.
        </p>
      </div>
      <div className="mt-auto flex items-center gap-2 bg-muted/50 rounded-lg p-3">
        <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Analisamos automaticamente seus pedidos para gerar essa classificação.
        </p>
      </div>
    </div>
  );
}

/* ─── Step 2: Classes A, B e C ─── */
function Step2() {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">As 3 classes de produtos</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Cada produto do seu cardápio é classificado em uma das três classes, de acordo com a sua contribuição para o faturamento total.
        </p>
      </div>

      {/* Classe A */}
      <div className="flex gap-3 items-start bg-emerald-50 dark:bg-emerald-500/5 rounded-xl p-3.5 border border-emerald-200/50 dark:border-emerald-500/10">
        <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-white">A</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Classe A — Essenciais</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
            Representam <strong className="text-foreground">~80% do faturamento</strong>. São poucos itens (cerca de 20% do cardápio), mas geram a maior parte da receita. São os <strong className="text-foreground">carros-chefe</strong> do seu restaurante.
          </p>
        </div>
      </div>

      {/* Classe B */}
      <div className="flex gap-3 items-start bg-amber-50 dark:bg-amber-500/5 rounded-xl p-3.5 border border-amber-200/50 dark:border-amber-500/10">
        <div className="h-9 w-9 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-white">B</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Classe B — Intermediários</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
            Representam os próximos <strong className="text-foreground">~15% do faturamento</strong>. São itens de importância intermediária que complementam o cardápio.
          </p>
        </div>
      </div>

      {/* Classe C */}
      <div className="flex gap-3 items-start bg-red-50 dark:bg-red-500/5 rounded-xl p-3.5 border border-red-200/50 dark:border-red-500/10">
        <div className="h-9 w-9 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-white">C</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-500 dark:text-red-400">Classe C — Baixo impacto</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
            Representam os últimos <strong className="text-foreground">~5% do faturamento</strong>. São muitos itens que vendem pouco individualmente.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3: Como ajuda o restaurante ─── */
function Step3() {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
        <TrendingUp className="h-7 w-7 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Como isso ajuda seu restaurante?</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Com a Curva ABC, você toma decisões mais inteligentes sobre o seu cardápio:
        </p>
      </div>

      <div className="space-y-2.5">
        <div className="flex gap-3 items-start">
          <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-emerald-600">A</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Proteja seus campeões:</strong> nunca deixe faltar estoque dos itens Classe A. Invista em qualidade e destaque no cardápio.
          </p>
        </div>
        <div className="flex gap-3 items-start">
          <div className="h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-amber-600">B</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Desenvolva os intermediários:</strong> crie promoções ou combos para impulsionar os itens Classe B e aumentar o faturamento.
          </p>
        </div>
        <div className="flex gap-3 items-start">
          <div className="h-7 w-7 rounded-lg bg-red-100 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-red-500">C</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Avalie os de baixo impacto:</strong> considere simplificar o cardápio removendo itens Classe C que geram custo sem retorno significativo.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 4: Como usar na Mindi ─── */
function Step4() {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="h-14 w-14 rounded-2xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
        <Target className="h-7 w-7 text-violet-600 dark:text-violet-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Como usar na Mindi</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A Mindi calcula a Curva ABC automaticamente com base nos seus pedidos reais. Veja como aproveitar ao máximo:
        </p>
      </div>

      <div className="space-y-2.5">
        <div className="flex gap-3 items-start bg-muted/50 rounded-xl p-3">
          <span className="text-base">📊</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Mude o período</strong> para comparar a classificação em diferentes épocas e identificar tendências.
          </p>
        </div>
        <div className="flex gap-3 items-start bg-muted/50 rounded-xl p-3">
          <span className="text-base">📈</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Acompanhe o gráfico de Pareto</strong> para visualizar a concentração de receita e a linha acumulada de 80%.
          </p>
        </div>
        <div className="flex gap-3 items-start bg-muted/50 rounded-xl p-3">
          <span className="text-base">🎯</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Revise mensalmente</strong> para ajustar seu cardápio, promoções e estoque com base em dados reais.
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/5 rounded-lg p-3 border border-emerald-200/50 dark:border-emerald-500/10">
        <Lightbulb className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        <p className="text-xs text-emerald-700 dark:text-emerald-300">
          Quanto mais pedidos, mais precisa será a classificação!
        </p>
      </div>
    </div>
  );
}
