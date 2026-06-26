import { useState, useCallback } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  X,
  Plus,
  Trash2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Pizza,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn, capitalizeFirst } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

// Types
interface PizzaSizeItem {
  id: string; // temp id for UI
  name: string;
  slices: number;
  maxFlavors: number;
  imageUrl: string;
  pdvCode: string;
  isActive: boolean;
}

interface PizzaCrustItem {
  id: string;
  name: string;
  price: string;
  isActive: boolean;
  pdvCode: string;
}

interface PizzaEdgeItem {
  id: string;
  name: string;
  price: string;
  isActive: boolean;
  pdvCode: string;
}

type Tab = "detalhes" | "tamanho" | "massa" | "borda";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  onSuccess: () => void;
}

export default function CreatePizzaCategorySheet({ open, onOpenChange, establishmentId, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("detalhes");
  
  // Detalhes
  const [categoryName, setCategoryName] = useState("");
  const [priceRule, setPriceRule] = useState<"highest" | "average">("highest");
  
  // Tamanhos
  const [sizes, setSizes] = useState<PizzaSizeItem[]>([
    { id: "1", name: "Pequena", slices: 1, maxFlavors: 1, imageUrl: "", pdvCode: "", isActive: true },
    { id: "2", name: "Média", slices: 6, maxFlavors: 2, imageUrl: "", pdvCode: "", isActive: true },
    { id: "3", name: "Grande", slices: 8, maxFlavors: 3, imageUrl: "", pdvCode: "", isActive: true },
  ]);
  
  // Massas
  const [crusts, setCrusts] = useState<PizzaCrustItem[]>([
    { id: "1", name: "Tradicional", price: "0", isActive: true, pdvCode: "" },
  ]);
  
  // Bordas
  const [edges, setEdges] = useState<PizzaEdgeItem[]>([
    { id: "1", name: "Tradicional", price: "0", isActive: true, pdvCode: "" },
  ]);
  
  // Disponibilidade
  const [isActive, setIsActive] = useState(true);

  const createPizzaCategoryMutation = trpc.category.createPizzaCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoria de pizza criada com sucesso!");
      resetForm();
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar categoria de pizza");
    },
  });

  const resetForm = () => {
    setCategoryName("");
    setPriceRule("highest");
    setSizes([
      { id: "1", name: "Pequena", slices: 1, maxFlavors: 1, imageUrl: "", pdvCode: "", isActive: true },
      { id: "2", name: "Média", slices: 6, maxFlavors: 2, imageUrl: "", pdvCode: "", isActive: true },
      { id: "3", name: "Grande", slices: 8, maxFlavors: 3, imageUrl: "", pdvCode: "", isActive: true },
    ]);
    setCrusts([{ id: "1", name: "Tradicional", price: "0", isActive: true, pdvCode: "" }]);
    setEdges([{ id: "1", name: "Tradicional", price: "0", isActive: true, pdvCode: "" }]);
    setIsActive(true);
    setActiveTab("detalhes");
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "detalhes", label: "Detalhes" },
    { key: "tamanho", label: "Tamanho" },
    { key: "massa", label: "Massa" },
    { key: "borda", label: "Borda" },
  ];

  const currentTabIndex = tabs.findIndex(t => t.key === activeTab);

  const handleNext = () => {
    if (currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1].key);
    }
  };

  const handlePrev = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1].key);
    }
  };

  const handleSave = () => {
    if (!categoryName.trim()) {
      toast.error("Nome da categoria é obrigatório");
      setActiveTab("detalhes");
      return;
    }
    if (sizes.length === 0) {
      toast.error("Adicione pelo menos um tamanho");
      setActiveTab("tamanho");
      return;
    }

    createPizzaCategoryMutation.mutate({
      establishmentId,
      name: categoryName.trim(),
      priceRule,
      isActive,
      sizes: sizes.map(s => ({
        name: s.name,
        slices: s.slices,
        maxFlavors: s.maxFlavors,
        imageUrl: s.imageUrl || null,
        pdvCode: s.pdvCode || null,
        isActive: s.isActive,
      })),
      crusts: crusts.map(c => ({
        name: c.name,
        price: c.price,
        pdvCode: c.pdvCode || null,
        isActive: c.isActive,
      })),
      edges: edges.map(e => ({
        name: e.name,
        price: e.price,
        pdvCode: e.pdvCode || null,
        isActive: e.isActive,
      })),
    });
  };

  // Size helpers
  const addSize = () => {
    setSizes(prev => [...prev, {
      id: Date.now().toString(),
      name: "",
      slices: 8,
      maxFlavors: 1,
      imageUrl: "",
      pdvCode: "",
      isActive: true,
    }]);
  };

  const removeSize = (id: string) => {
    setSizes(prev => prev.filter(s => s.id !== id));
  };

  const updateSize = (id: string, field: keyof PizzaSizeItem, value: any) => {
    setSizes(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Crust helpers
  const addCrust = () => {
    setCrusts(prev => [...prev, {
      id: Date.now().toString(),
      name: "",
      price: "0",
      isActive: true,
      pdvCode: "",
    }]);
  };

  const removeCrust = (id: string) => {
    setCrusts(prev => prev.filter(c => c.id !== id));
  };

  const updateCrust = (id: string, field: keyof PizzaCrustItem, value: any) => {
    setCrusts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // Edge helpers
  const addEdge = () => {
    setEdges(prev => [...prev, {
      id: Date.now().toString(),
      name: "",
      price: "0",
      isActive: true,
      pdvCode: "",
    }]);
  };

  const removeEdge = (id: string) => {
    setEdges(prev => prev.filter(e => e.id !== id));
  };

  const updateEdge = (id: string, field: keyof PizzaEdgeItem, value: any) => {
    setEdges(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const flavorOptions = [1, 2, 3, 4];
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col overflow-hidden" hideCloseButton>
        <SheetTitle className="sr-only">Nova categoria de pizza</SheetTitle>
        <div className="flex flex-col h-full">
        {/* Header - same style as other sheets */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Pizza className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Nova Categoria</h2>
                <p className="text-sm text-white/80">Tipo: Pizza</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1.5 mt-3">
            {tabs.map((tab, i) => (
              <div key={tab.key} className={cn("flex-1 h-1 rounded-full", i <= currentTabIndex ? "bg-white" : "bg-white/30")} />
            ))}
          </div>
        </div>
        {/* Tabs */}
        <div className="flex border-b px-4 gap-1 overflow-x-auto bg-card">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab.key
                  ? "border-red-500 text-red-500"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-card">
          {/* Detalhes Tab */}
          {activeTab === "detalhes" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold mb-1">Detalhes</h3>
                <p className="text-sm text-muted-foreground mb-4">Preencha as informações da nova categoria.</p>
              </div>

              {/* Tipo da categoria (read-only) */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo da categoria</label>
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <Pizza className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium">Pizza</span>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="ml-auto text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    Alterar
                  </button>
                </div>
              </div>

              {/* Nome da categoria */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Nome da categoria <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Ex: Pizzas, Pizzas Especiais..."
                  value={categoryName}
                  onChange={(e) => setCategoryName(capitalizeFirst(e.target.value))}
                  className="h-11"
                  maxLength={40}
                />
                <div className="flex justify-between mt-1">
                  {!categoryName.trim() && (
                    <span className="text-xs text-destructive">Este campo é obrigatório.</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">{categoryName.length}/40</span>
                </div>
              </div>

              {/* Regra de preço */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Regra de preço (meio a meio)</label>
                <p className="text-xs text-muted-foreground mb-3">
                  Define como calcular o preço quando o cliente escolhe sabores de preços diferentes.
                </p>
                <div className="space-y-2">
                  <label className={cn(
                    "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                    priceRule === "highest" ? "border-red-500 bg-red-50 dark:bg-red-950/20" : "hover:bg-muted/50"
                  )}>
                    <input
                      type="radio"
                      name="priceRule"
                      value="highest"
                      checked={priceRule === "highest"}
                      onChange={() => setPriceRule("highest")}
                      className="accent-red-500"
                    />
                    <div>
                      <span className="text-sm font-medium">Cobrar pelo sabor mais caro</span>
                      <p className="text-xs text-muted-foreground">Padrão do iFood. Ex: Calabresa R$40 + 4 Queijos R$50 = R$50</p>
                    </div>
                  </label>
                  <label className={cn(
                    "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                    priceRule === "average" ? "border-red-500 bg-red-50 dark:bg-red-950/20" : "hover:bg-muted/50"
                  )}>
                    <input
                      type="radio"
                      name="priceRule"
                      value="average"
                      checked={priceRule === "average"}
                      onChange={() => setPriceRule("average")}
                      className="accent-red-500"
                    />
                    <div>
                      <span className="text-sm font-medium">Cobrar pela média proporcional</span>
                      <p className="text-xs text-muted-foreground">Ex: Calabresa R$40 + 4 Queijos R$50 = R$45</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tamanho Tab */}
          {activeTab === "tamanho" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold mb-1">Tamanho</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Indique aqui os tamanhos que suas pizzas são produzidas, em quantos pedaços são cortadas e até quantos sabores sua loja monta cada tamanho.
                </p>
              </div>

              <div className="space-y-4">
                {sizes.map((size) => (
                  <div key={size.id} className="border rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
                      {/* Image placeholder + fields */}
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30 flex items-center justify-center flex-shrink-0">
                          {size.imageUrl ? (
                            <img src={size.imageUrl} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Nome do tamanho</label>
                            <Input
                              value={size.name}
                              onChange={(e) => updateSize(size.id, "name", capitalizeFirst(e.target.value))}
                              placeholder="Ex: Grande"
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeSize(size.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Qtd. Pedaços</label>
                        <Input
                          type="number"
                          value={size.slices}
                          onChange={(e) => updateSize(size.id, "slices", parseInt(e.target.value) || 1)}
                          className="h-9 text-sm"
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Qtd. Sabores</label>
                        <div className="flex gap-1 mt-1">
                          {flavorOptions.map(n => (
                            <button
                              key={n}
                              onClick={() => updateSize(size.id, "maxFlavors", n)}
                              className={cn(
                                "w-8 h-8 rounded-full text-xs font-semibold transition-colors",
                                n <= size.maxFlavors
                                  ? "bg-red-500 text-white"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              )}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Cód. PDV oculto por enquanto
                      <div>
                        <label className="text-xs text-muted-foreground">Cód. PDV</label>
                        <Input
                          value={size.pdvCode}
                          onChange={(e) => updateSize(size.id, "pdvCode", e.target.value)}
                          className="h-9 text-sm"
                          placeholder="000"
                        />
                      </div>
                      */}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addSize}
                className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600"
              >
                <Plus className="h-4 w-4" />
                Adicionar novo tamanho
              </button>

              {/* Resumo e status de venda */}
              {sizes.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Resumo e status de venda</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {sizes.map(size => (
                      <div key={size.id} className="border rounded-xl p-4 text-center space-y-2">
                        <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                          <Pizza className="h-6 w-6 text-orange-500" />
                        </div>
                        <p className="text-sm font-semibold">{size.name || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground">Cortada em {size.slices} pedaço{size.slices > 1 ? "s" : ""}</p>
                        <p className="text-xs text-muted-foreground">
                          Aceita {size.maxFlavors === 1 ? "1 sabor" : `1${size.maxFlavors > 2 ? "," : " e"} ${Array.from({ length: size.maxFlavors - 1 }, (_, i) => i + 2).join(size.maxFlavors > 3 ? ", " : " e ")} sabores`}
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs text-muted-foreground">Ativado</span>
                          <Switch
                            checked={size.isActive}
                            onCheckedChange={(v) => updateSize(size.id, "isActive", v)}
                            className="data-[state=checked]:bg-red-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Massa Tab */}
          {activeTab === "massa" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold mb-1">Massa</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Indique aqui os tipos de massa que sua loja trabalha.
                </p>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_100px_80px_40px] gap-2 px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground">
                  <span>Massa</span>
                  <span>Preço</span>
                  <span>Status de vendas</span>
                  <span></span>
                </div>
                {crusts.map(crust => (
                  <div key={crust.id} className="grid grid-cols-[1fr_100px_80px_40px] gap-2 px-4 py-3 border-t items-center">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                      <Input
                        value={crust.name}
                        onChange={(e) => updateCrust(crust.id, "name", capitalizeFirst(e.target.value))}
                        className="h-8 text-sm border-0 bg-transparent px-0 focus-visible:ring-0"
                        placeholder="Nome da massa"
                      />
                    </div>
                    <Input
                      value={crust.price === "0" ? "R$ 0,00" : `R$ ${crust.price}`}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d,]/g, "").replace(",", ".");
                        updateCrust(crust.id, "price", val || "0");
                      }}
                      className="h-8 text-sm"
                      placeholder="R$ 0,00"
                    />
                    <div className="flex justify-center">
                      <Switch
                        checked={crust.isActive}
                        onCheckedChange={(v) => updateCrust(crust.id, "isActive", v)}
                        className="data-[state=checked]:bg-red-500"
                      />
                    </div>
                    {/* Cód. PDV oculto por enquanto */}
                    <button
                      onClick={() => removeCrust(crust.id)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addCrust}
                className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 border border-dashed border-red-300 rounded-lg px-4 py-2 hover:bg-red-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Adicionar massa
              </button>
            </div>
          )}

          {/* Borda Tab */}
          {activeTab === "borda" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold mb-1">Borda</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Indique aqui os tipos de borda que sua loja trabalha.
                </p>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_100px_80px_40px] gap-2 px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground">
                  <span>Borda</span>
                  <span>Preço</span>
                  <span>Status de vendas</span>
                  <span></span>
                </div>
                {edges.map(edge => (
                  <div key={edge.id} className="grid grid-cols-[1fr_100px_80px_40px] gap-2 px-4 py-3 border-t items-center">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                      <Input
                        value={edge.name}
                        onChange={(e) => updateEdge(edge.id, "name", capitalizeFirst(e.target.value))}
                        className="h-8 text-sm border-0 bg-transparent px-0 focus-visible:ring-0"
                        placeholder="Nome da borda"
                      />
                    </div>
                    <Input
                      value={edge.price === "0" ? "R$ 0,00" : `R$ ${edge.price}`}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d,]/g, "").replace(",", ".");
                        updateEdge(edge.id, "price", val || "0");
                      }}
                      className="h-8 text-sm"
                      placeholder="R$ 0,00"
                    />
                    <div className="flex justify-center">
                      <Switch
                        checked={edge.isActive}
                        onCheckedChange={(v) => updateEdge(edge.id, "isActive", v)}
                        className="data-[state=checked]:bg-red-500"
                      />
                    </div>
                    {/* Cód. PDV oculto por enquanto */}
                    <button
                      onClick={() => removeEdge(edge.id)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addEdge}
                className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 border border-dashed border-red-300 rounded-lg px-4 py-2 hover:bg-red-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Adicionar borda
              </button>
            </div>
          )}

          {/* Disponibilidade Tab */}
          {activeTab === "disponibilidade" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold mb-1">Disponibilidade</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Defina se esta categoria estará ativa no cardápio.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-xl">
                <div>
                  <p className="text-sm font-medium">Categoria ativa</p>
                  <p className="text-xs text-muted-foreground">Quando desativada, a categoria não aparece no cardápio público.</p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-red-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-4 flex items-center justify-between bg-card">
          <div>
            {currentTabIndex > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {currentTabIndex < tabs.length - 1 ? (
              <Button onClick={handleNext} size="sm" className="bg-red-500 hover:bg-red-600 text-white gap-1">
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={createPizzaCategoryMutation.isPending}
              >
                {createPizzaCategoryMutation.isPending ? "Salvando..." : "Criar Categoria"}
              </Button>
            )}
          </div>
        </div>
      </div>
      </SheetContent>
    </Sheet>
  );
}
