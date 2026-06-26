import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Pizza,
  Ruler,
  CircleDot,
  Circle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
interface PizzaCategoryContentProps {
  categoryId: number;
  isReadOnly?: boolean;
}
export default function PizzaCategoryContent({ categoryId, isReadOnly = false }: PizzaCategoryContentProps) {
  const { data: pizzaConfig, isLoading } = trpc.category.getPizzaConfig.useQuery(
    { categoryId },
    { enabled: !!categoryId }
  );
  const utils = trpc.useUtils();
  const [expandedSection, setExpandedSection] = useState<"sizes" | "crusts" | "edges" | null>("sizes");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<string>("");
  const [editingValue, setEditingValue] = useState<string>("");
  // Mutations - sizes are now products, crusts/edges are complementItems
  const updateSizeMutation = trpc.category.updatePizzaSize.useMutation({
    onSuccess: () => utils.category.getPizzaConfig.invalidate({ categoryId }),
  });
  const addSizeMutation = trpc.category.addPizzaSize.useMutation({
    onSuccess: () => utils.category.getPizzaConfig.invalidate({ categoryId }),
  });
  const deleteSizeMutation = trpc.category.deletePizzaSize.useMutation({
    onSuccess: () => utils.category.getPizzaConfig.invalidate({ categoryId }),
  });
  const updateCrustMutation = trpc.category.updatePizzaCrust.useMutation({
    onSuccess: () => utils.category.getPizzaConfig.invalidate({ categoryId }),
  });
  const addCrustMutation = trpc.category.addPizzaCrust.useMutation({
    onSuccess: () => utils.category.getPizzaConfig.invalidate({ categoryId }),
  });
  const deleteCrustMutation = trpc.category.deletePizzaCrust.useMutation({
    onSuccess: () => utils.category.getPizzaConfig.invalidate({ categoryId }),
  });
  const updateEdgeMutation = trpc.category.updatePizzaEdge.useMutation({
    onSuccess: () => utils.category.getPizzaConfig.invalidate({ categoryId }),
  });
  const addEdgeMutation = trpc.category.addPizzaEdge.useMutation({
    onSuccess: () => utils.category.getPizzaConfig.invalidate({ categoryId }),
  });
  const deleteEdgeMutation = trpc.category.deletePizzaEdge.useMutation({
    onSuccess: () => utils.category.getPizzaConfig.invalidate({ categoryId }),
  });
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!pizzaConfig) return null;
  const { sizes, crusts, edges } = pizzaConfig;
  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num) || num === 0) return "Grátis";
    return `R$ ${num.toFixed(2).replace(".", ",")}`;
  };
  const handleAddSize = () => {
    addSizeMutation.mutate({
      categoryId,
      name: "Novo Tamanho",
      slices: 8,
      maxFlavors: 2,
      price: "0.00",
      pdvCode: null,
      isActive: true,
      sortOrder: (sizes?.length || 0) + 1,
    });
  };
  const handleAddCrust = () => {
    addCrustMutation.mutate({
      categoryId,
      name: "Nova Massa",
      price: "0.00",
      pdvCode: null,
      isActive: true,
      sortOrder: (crusts?.length || 0) + 1,
    });
  };
  const handleAddEdge = () => {
    addEdgeMutation.mutate({
      categoryId,
      name: "Nova Borda",
      price: "0.00",
      pdvCode: null,
      isActive: true,
      sortOrder: (edges?.length || 0) + 1,
    });
  };
  const startEditing = (id: number, field: string, value: string) => {
    setEditingId(id);
    setEditingField(field);
    setEditingValue(value);
  };
  const saveEdit = (type: "size" | "crust" | "edge") => {
    if (!editingId) return;
    const data: any = { id: editingId, [editingField]: editingValue };
    if (editingField === "price") {
      data[editingField] = editingValue.replace(",", ".");
    }
    if (editingField === "slices" || editingField === "maxFlavors") {
      data[editingField] = parseInt(editingValue) || 1;
    }
    if (type === "size") updateSizeMutation.mutate(data);
    else if (type === "crust") updateCrustMutation.mutate(data);
    else updateEdgeMutation.mutate(data);
    setEditingId(null);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingField("");
    setEditingValue("");
  };
  const renderEditableCell = (id: number, field: string, value: string, type: "size" | "crust" | "edge") => {
    if (editingId === id && editingField === field) {
      return (
        <div className="flex items-center gap-1">
          <Input
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            className="h-7 w-20 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit(type);
              if (e.key === "Escape") cancelEdit();
            }}
          />
          <button onClick={() => saveEdit(type)} className="text-green-500 hover:text-green-600">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      );
    }
    return (
      <span
        className={cn("cursor-pointer hover:text-red-500 transition-colors", !isReadOnly && "hover:underline")}
        onClick={() => !isReadOnly && startEditing(id, field, value)}
      >
        {field === "price" ? formatCurrency(value) : value}
      </span>
    );
  };
  return (
    <div className="divide-y divide-border/50">
      {/* Tamanhos Section */}
      <div>
        <button
          className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/30 transition-colors"
          onClick={() => setExpandedSection(expandedSection === "sizes" ? null : "sizes")}
        >
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">Tamanhos</span>
            <Badge variant="secondary" className="text-xs">{sizes?.length || 0}</Badge>
          </div>
          {expandedSection === "sizes" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSection === "sizes" && (
          <div className="px-4 pb-3 space-y-2">
            {sizes?.map((size: any) => (
              <div key={size.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {renderEditableCell(size.id, "name", size.name, "size")}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{size.slices} ped.</span>
                    <span>•</span>
                    <span>{size.maxFlavors} sab.</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!isReadOnly && (
                    <>
                      <Switch
                        checked={size.isActive}
                        onCheckedChange={(checked) => updateSizeMutation.mutate({ id: size.id, isActive: checked })}
                        className="data-[state=checked]:bg-red-500"
                      />
                      <button
                        onClick={() => deleteSizeMutation.mutate({ id: size.id })}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {!isReadOnly && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed text-xs"
                onClick={handleAddSize}
                disabled={addSizeMutation.isPending}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar Tamanho
              </Button>
            )}
          </div>
        )}
      </div>
      {/* Massas Section */}
      <div>
        <button
          className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/30 transition-colors"
          onClick={() => setExpandedSection(expandedSection === "crusts" ? null : "crusts")}
        >
          <div className="flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Massas</span>
            <Badge variant="secondary" className="text-xs">{crusts?.length || 0}</Badge>
          </div>
          {expandedSection === "crusts" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSection === "crusts" && (
          <div className="px-4 pb-3 space-y-2">
            {crusts?.map((crust: any) => (
              <div key={crust.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg border border-border/50">
                <div className="text-sm font-medium">
                  {renderEditableCell(crust.id, "name", crust.name, "crust")}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-green-600">
                    {renderEditableCell(crust.id, "price", crust.price, "crust")}
                  </span>
                  {!isReadOnly && (
                    <>
                      <Switch
                        checked={crust.isActive}
                        onCheckedChange={(checked) => updateCrustMutation.mutate({ id: crust.id, isActive: checked })}
                        className="data-[state=checked]:bg-red-500"
                      />
                      <button
                        onClick={() => deleteCrustMutation.mutate({ id: crust.id })}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {!isReadOnly && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed text-xs"
                onClick={handleAddCrust}
                disabled={addCrustMutation.isPending}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar Massa
              </Button>
            )}
          </div>
        )}
      </div>
      {/* Bordas Section */}
      <div>
        <button
          className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/30 transition-colors"
          onClick={() => setExpandedSection(expandedSection === "edges" ? null : "edges")}
        >
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Bordas</span>
            <Badge variant="secondary" className="text-xs">{edges?.length || 0}</Badge>
          </div>
          {expandedSection === "edges" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSection === "edges" && (
          <div className="px-4 pb-3 space-y-2">
            {edges?.map((edge: any) => (
              <div key={edge.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg border border-border/50">
                <div className="text-sm font-medium">
                  {renderEditableCell(edge.id, "name", edge.name, "edge")}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-green-600">
                    {renderEditableCell(edge.id, "price", edge.price, "edge")}
                  </span>
                  {!isReadOnly && (
                    <>
                      <Switch
                        checked={edge.isActive}
                        onCheckedChange={(checked) => updateEdgeMutation.mutate({ id: edge.id, isActive: checked })}
                        className="data-[state=checked]:bg-red-500"
                      />
                      <button
                        onClick={() => deleteEdgeMutation.mutate({ id: edge.id })}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {!isReadOnly && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed text-xs"
                onClick={handleAddEdge}
                disabled={addEdgeMutation.isPending}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar Borda
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
