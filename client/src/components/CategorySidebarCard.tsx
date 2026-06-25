import { useState, useRef, useEffect } from "react";
import { GripVertical, Plus, Check, X, Pencil } from "lucide-react";
import { cn, capitalizeFirst } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";

interface Category {
  id: number;
  name: string;
  sortOrder: number;
  emoji?: string | null;
}

interface CategorySidebarCardProps {
  categories: Category[];
  productCountByCategory: Record<number, number>;
  totalProducts: number;
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number | null) => void;
  onAddCategory: () => void;
  onRenameCategory: (id: number, name: string) => void;
  onReorderCategories: (updates: { id: number; sortOrder: number }[]) => void;
  isRenamePending?: boolean;
  isReadOnly?: boolean;
}

function SortableCategoryItem({
  category,
  productCount,
  isSelected,
  isEditing,
  editingName,
  onSelect,
  onStartEdit,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
  isRenamePending,
  isReadOnly,
}: {
  category: Category;
  productCount: number;
  isSelected: boolean;
  isEditing: boolean;
  editingName: string;
  onSelect: () => void;
  onStartEdit: () => void;
  onEditNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  isRenamePending?: boolean;
  isReadOnly?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled: isReadOnly || isEditing });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-1 px-2 py-1.5">
        <input
          ref={inputRef}
          value={editingName}
          onChange={(e) => onEditNameChange(capitalizeFirst(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && editingName.trim()) onSaveEdit();
            if (e.key === "Escape") onCancelEdit();
          }}
          className="flex-1 text-sm px-2 py-1 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-red-400 min-w-0"
        />
        <button
          onClick={onSaveEdit}
          disabled={!editingName.trim() || isRenamePending}
          className="p-1 rounded-md hover:bg-emerald-100 text-emerald-600 disabled:opacity-40"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onCancelEdit}
          className="p-1 rounded-md hover:bg-red-100 text-red-500"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1 px-2 py-1.5 rounded-xl cursor-pointer transition-colors",
        isSelected
          ? "bg-red-50 dark:bg-red-950/20"
          : "hover:bg-muted/50"
      )}
      onClick={onSelect}
    >
      {/* Drag handle */}
      {!isReadOnly && (
        <Tooltip>
          <TooltipTrigger asChild>
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground/70 touch-none"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            Arraste para reordenar
          </TooltipContent>
        </Tooltip>
      )}

      {/* Category name */}
      <span className={cn(
        "flex-1 text-sm truncate min-w-0",
        isSelected ? "font-medium text-red-500 dark:text-red-400" : "text-foreground"
      )}>
        {category.emoji ? `${category.emoji} ` : ""}{category.name}
      </span>

      {/* Product count */}
      <span className="text-xs text-muted-foreground flex-shrink-0">
        {productCount}
      </span>

      {/* Edit button on hover */}
      {!isReadOnly && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartEdit();
          }}
          className="flex-shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted text-muted-foreground"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export default function CategorySidebarCard({
  categories,
  productCountByCategory,
  totalProducts,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onRenameCategory,
  onReorderCategories,
  isRenamePending,
  isReadOnly,
}: CategorySidebarCardProps) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  // Sync with parent
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localCategories.findIndex((c) => c.id === active.id);
    const newIndex = localCategories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(localCategories, oldIndex, newIndex);
    setLocalCategories(newOrder);

    const updates = newOrder.map((cat, idx) => ({
      id: cat.id,
      sortOrder: idx,
    }));
    onReorderCategories(updates);
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      onRenameCategory(editingId, editingName.trim());
      setEditingId(null);
      setEditingName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="mt-3">
      {/* Tab "Categorias" - folder tab style above the card */}
      <div className="flex items-end">
        <div className="px-4 py-1.5 bg-card border border-border/50 border-b-0 rounded-t-xl">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categorias</span>
        </div>
      </div>
      {/* Card body - connects to the tab above */}
      <div className="rounded-2xl rounded-tl-none border border-border/50 bg-card overflow-hidden">
      {/* Botao Nova Categoria - topo do card */}
      {!isReadOnly && (
        <div className="px-3 pt-3 pb-0">
          <button
            onClick={onAddCategory}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 border border-dashed border-red-300 hover:border-red-400 rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova Categoria
          </button>
        </div>
      )}
      {/* "Todos" button */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            selectedCategoryId === null
              ? "bg-red-500 text-white shadow-sm"
              : "bg-muted/40 hover:bg-muted/60 text-foreground"
          )}
        >
          <span>Todos</span>
          <span className={cn(
            "text-xs",
            selectedCategoryId === null ? "text-white/80" : "text-muted-foreground"
          )}>
            ({totalProducts})
          </span>
        </button>
      </div>

      {/* Category list */}
      <div className="px-2 pb-3 pt-1 max-h-[300px] overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localCategories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {localCategories.map((cat) => (
              <SortableCategoryItem
                key={cat.id}
                category={cat}
                productCount={productCountByCategory[cat.id] || 0}
                isSelected={selectedCategoryId === cat.id}
                isEditing={editingId === cat.id}
                editingName={editingName}
                onSelect={() => onSelectCategory(cat.id)}
                onStartEdit={() => handleStartEdit(cat)}
                onEditNameChange={setEditingName}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                isRenamePending={isRenamePending}
                isReadOnly={isReadOnly}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      </div>
    </div>
  );
}
