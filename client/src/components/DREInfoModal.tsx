import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Lightbulb,
  Link2,
  PackageSearch,
  Target,
} from "lucide-react";

interface DREInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TOTAL_STEPS = 4;

export function DREInfoModal({ open, onOpenChange }: DREInfoModalProps) {
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
        <DialogTitle className="sr-only">Entenda o DRE</DialogTitle>
        {/* Progress bar */}
        <div className="flex gap-1.5 px-6 pt-5 pb-0">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-blue-500" : "bg-muted"
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
            className="gap-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {step === TOTAL_STEPS - 1 ? "Entendi!" : "Próximo"}
            {step < TOTAL_STEPS - 1 && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Step 1: O que é o DRE ─── */
function Step1() {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
        <FileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">O que é o DRE?</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          O <strong className="text-foreground">DRE (Demonstrativo de Resultado do Exercício)</strong> é o relatório financeiro mais importante do seu restaurante. Ele mostra, de forma clara, se o negócio está dando lucro ou prejuízo.
        </p>
      </div>
      <div className="bg-blue-50 dark:bg-blue-500/5 rounded-xl p-4 border border-blue-200/50 dark:border-blue-500/10">
        <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
          O DRE organiza suas finanças em uma estrutura lógica: <strong>Receita − Custos − Despesas = Resultado</strong>. Assim você enxerga exatamente onde o dinheiro está indo.
        </p>
      </div>
      <div className="mt-auto flex items-center gap-2 bg-muted/50 rounded-lg p-3">
        <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          A Mindi calcula o DRE automaticamente com base nos seus dados reais.
        </p>
      </div>
    </div>
  );
}

/* ─── Step 2: Conexão com a página de Finanças ─── */
function Step2() {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="h-14 w-14 rounded-2xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
        <Link2 className="h-7 w-7 text-violet-600 dark:text-violet-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Conectado com suas Finanças</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          O DRE não usa valores fictícios — ele puxa dados reais de duas fontes do seu sistema:
        </p>
      </div>

      <div className="space-y-2.5">
        {/* Receita */}
        <div className="flex gap-3 items-start bg-emerald-50 dark:bg-emerald-500/5 rounded-xl p-3.5 border border-emerald-200/50 dark:border-emerald-500/10">
          <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">R$</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Receita — Seus Pedidos</p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              A <strong className="text-foreground">Receita Bruta</strong> vem diretamente dos pedidos registrados. Cancelamentos são descontados automaticamente.
            </p>
          </div>
        </div>

        {/* Despesas */}
        <div className="flex gap-3 items-start bg-red-50 dark:bg-red-500/5 rounded-xl p-3.5 border border-red-200/50 dark:border-red-500/10">
          <div className="h-9 w-9 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">-</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-500 dark:text-red-400">Despesas — Página de Finanças</p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              Todas as <strong className="text-foreground">despesas operacionais</strong> (aluguel, funcionários, impostos, etc.) vêm dos lançamentos que você faz na página de Finanças.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 bg-violet-50 dark:bg-violet-500/5 rounded-lg p-3 border border-violet-200/50 dark:border-violet-500/10">
        <Lightbulb className="h-4 w-4 text-violet-500 flex-shrink-0" />
        <p className="text-xs text-violet-700 dark:text-violet-300">
          Quanto mais despesas você lançar em Finanças, mais preciso será o DRE!
        </p>
      </div>
    </div>
  );
}

/* ─── Step 3: Importância do custo dos produtos (CMV) ─── */
function Step3() {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="h-14 w-14 rounded-2xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
        <PackageSearch className="h-7 w-7 text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Cadastre o custo dos produtos</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          O <strong className="text-foreground">CMV (Custo da Mercadoria Vendida)</strong> é calculado automaticamente quando você cadastra o custo de cada produto. Ele mostra quanto você gasta em insumos para produzir o que vende.
        </p>
      </div>

      <div className="space-y-2.5">
        <div className="flex gap-3 items-start bg-muted/50 rounded-xl p-3">
          <span className="text-base">📦</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Onde cadastrar:</strong> acesse o Catálogo, edite um produto e preencha o campo "Custo do produto" ao lado do preço de venda.
          </p>
        </div>
        <div className="flex gap-3 items-start bg-muted/50 rounded-xl p-3">
          <span className="text-base">📐</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Cálculo automático:</strong> a Mindi multiplica o custo unitário pela quantidade vendida de cada item para calcular o CMV total.
          </p>
        </div>
        <div className="flex gap-3 items-start bg-muted/50 rounded-xl p-3">
          <span className="text-base">🎯</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Meta ideal:</strong> o CMV de um restaurante saudável deve ficar entre <strong className="text-foreground">28% e 35%</strong> da receita.
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 bg-amber-50 dark:bg-amber-500/5 rounded-lg p-3 border border-amber-200/50 dark:border-amber-500/10">
        <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Sem o custo cadastrado, o CMV aparecerá como R$ 0,00 no DRE.
        </p>
      </div>
    </div>
  );
}

/* ─── Step 4: Como usar o DRE na Mindi ─── */
function Step4() {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
        <Target className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Como usar o DRE na Mindi</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Acompanhe o DRE regularmente para entender a saúde financeira do seu restaurante e tomar decisões baseadas em dados:
        </p>
      </div>

      <div className="space-y-2.5">
        <div className="flex gap-3 items-start bg-muted/50 rounded-xl p-3">
          <span className="text-base">📊</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Acompanhe as margens:</strong> Margem Bruta mostra eficiência de produção, Margem Líquida mostra o lucro real do negócio.
          </p>
        </div>
        <div className="flex gap-3 items-start bg-muted/50 rounded-xl p-3">
          <span className="text-base">📅</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Compare períodos:</strong> use o filtro de datas para comparar meses e identificar tendências de melhoria ou piora.
          </p>
        </div>
        <div className="flex gap-3 items-start bg-muted/50 rounded-xl p-3">
          <span className="text-base">💡</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Identifique gargalos:</strong> se a margem está baixa, veja se o problema está no CMV (custos de insumos) ou nas despesas operacionais.
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/5 rounded-lg p-3 border border-emerald-200/50 dark:border-emerald-500/10">
        <Lightbulb className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        <p className="text-xs text-emerald-700 dark:text-emerald-300">
          Revise o DRE todo mês para manter seu restaurante financeiramente saudável!
        </p>
      </div>
    </div>
  );
}
