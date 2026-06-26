import { useLocation } from "wouter";
import { UtensilsCrossed, Layers, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "cardapio", label: "Cardápio", icon: UtensilsCrossed, path: "/catalogo" },
  { id: "grupos", label: "Grupos", icon: Layers, path: "/complementos" },
  { id: "sugestoes", label: "Sugestões", icon: Sparkles, path: "/sugestoes" },
  { id: "avaliacoes", label: "Avaliações", icon: Star, path: "/avaliacoes" },
];

interface MenuTabsNavProps {
  actions?: React.ReactNode;
}

export function MenuTabsNav({ actions }: MenuTabsNavProps) {
  const [location, navigate] = useLocation();
  const activeTab = tabs.find(t => location.startsWith(t.path))?.id || "cardapio";

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><UtensilsCrossed className="h-6 w-6 text-blue-600" /><h1 className="text-xl sm:text-2xl font-bold text-foreground">Cardápio</h1></div>
        {actions && <div>{actions}</div>}
      </div>
      <div className="border-b border-gray-200 dark:border-border">
        <nav className="flex gap-6 -mb-px overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
