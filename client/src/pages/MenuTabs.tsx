import { AdminLayout } from "@/components/AdminLayout";
import { useLocation } from "wouter";
import { UtensilsCrossed, Layers, Sparkles, Star } from "lucide-react";
import { lazy, Suspense } from "react";
import { cn } from "@/lib/utils";

const Catalogo = lazy(() => import("./Catalogo"));
const Complementos = lazy(() => import("./Complementos"));
const Sugestoes = lazy(() => import("./Sugestoes"));
const Avaliacoes = lazy(() => import("./Avaliacoes"));

const tabs = [
  { id: "cardapio", label: "Cardápio", icon: UtensilsCrossed, path: "/catalogo" },
  { id: "grupos", label: "Grupos", icon: Layers, path: "/complementos" },
  { id: "sugestoes", label: "Sugestões", icon: Sparkles, path: "/sugestoes" },
  { id: "avaliacoes", label: "Avaliações", icon: Star, path: "/avaliacoes" },
];

export default function MenuTabs() {
  const [location, navigate] = useLocation();

  // Determine active tab based on current route
  const activeTab = tabs.find(t => location.startsWith(t.path))?.id || "cardapio";

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-4">Menu</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-border mb-6">
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

        {/* Content - render the active page without its own AdminLayout/PageHeader */}
        <Suspense fallback={<div className="animate-pulse h-64 bg-muted/30 rounded-xl" />}>
          {activeTab === "cardapio" && <Catalogo embedded />}
          {activeTab === "grupos" && <Complementos embedded />}
          {activeTab === "sugestoes" && <Sugestoes embedded />}
          {activeTab === "avaliacoes" && <Avaliacoes embedded />}
        </Suspense>
      </div>
    </AdminLayout>
  );
}
