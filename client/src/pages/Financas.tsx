import { AdminLayout } from "@/components/AdminLayout";
import { StatCard, PageHeader, SectionCard, EmptyState } from "@/components/shared";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  BadgeDollarSign,
  Plus,
  Search,
  Edit2,
  Trash2,
  Receipt,
  Target,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Tag,
  Calendar,
  Filter,
  Repeat,
  Pause,
  Play,
  Clock,
  Activity,
  BarChart3,
  CreditCard,
  Home,
  Zap,
  Droplets,
  Globe,
  Megaphone,
  Users,
  FileText,
  Package,
  ShieldCheck,
  Wrench,
  History,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DateRangePickerSales } from "@/components/DateRangePickerSales";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";



const paymentMethodLabels: Record<string, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  pix_online: "Pix Online",
  card: "Cartão",
  card_online: "Cartão Online",
  transfer: "Transferência",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// ============ EXPENSE MODAL ============
const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MONTH_LABELS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function ExpenseModal({
  open,
  onOpenChange,
  establishmentId,
  editingExpense,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  editingExpense?: any;
  onSuccess: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Recurring fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<string>("monthly");
  const [executionDay, setExecutionDay] = useState<string>("1");
  const [executionMonth, setExecutionMonth] = useState<string>("1");
  const [generateAsPending, setGenerateAsPending] = useState(false);
  const [endDate, setEndDate] = useState("");
  const recurringRef = useRef<HTMLDivElement>(null);

  const { data: categories } = trpc.finance.listCategories.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );

  const createMutation = trpc.finance.createExpense.useMutation({
    onSuccess: () => {
      toast.success("Despesa registrada com sucesso!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.finance.updateExpense.useMutation({
    onSuccess: () => {
      toast.success("Despesa atualizada com sucesso!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const createRecurringMutation = trpc.finance.createRecurring.useMutation({
    onSuccess: () => {
      toast.success("Despesa recorrente criada com sucesso!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (editingExpense) {
      setCategoryId(String(editingExpense.categoryId));
      setDescription(editingExpense.description);
      setAmount(String(Number(editingExpense.amount)));
      setPaymentMethod(editingExpense.paymentMethod);
      setDate(
        new Date(editingExpense.date).toISOString().split("T")[0]
      );
      setNotes(editingExpense.notes || "");
      setIsRecurring(false); // Can't convert existing to recurring
    } else {
      resetForm();
    }
  }, [editingExpense, open]);

  function resetForm() {
    setCategoryId("");
    setDescription("");
    setAmount("");
    setPaymentMethod("cash");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setIsRecurring(false);
    setFrequency("monthly");
    setExecutionDay("1");
    setExecutionMonth("1");
    setGenerateAsPending(false);
    setEndDate("");
  }

  function handleSubmit() {
    if (!categoryId || !description || !amount || !date) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (isRecurring && !editingExpense) {
      // Create the current expense + recurring rule
      createMutation.mutate(
        {
          establishmentId,
          categoryId: Number(categoryId),
          description,
          amount: String(parseFloat(amount)),
          paymentMethod: paymentMethod as "cash" | "pix" | "card" | "transfer",
          date: new Date(date + "T12:00:00").toISOString(),
          notes: notes || undefined,
        },
        {
          onSuccess: () => {
            // Also create the recurring rule
            createRecurringMutation.mutate({
              establishmentId,
              type: "expense",
              description,
              categoryId: Number(categoryId),
              amount: String(parseFloat(amount)),
              paymentMethod: paymentMethod as "cash" | "pix" | "card" | "transfer",
              frequency: frequency as "weekly" | "monthly" | "yearly",
              executionDay: Number(executionDay),
              executionMonth: frequency === "yearly" ? Number(executionMonth) : undefined,
              generateAsPending,
              startDate: new Date(date + "T12:00:00").toISOString(),
              endDate: endDate ? new Date(endDate + "T23:59:59").toISOString() : undefined,
              notes: notes || undefined,
            });
          },
        }
      );
      return;
    }

    const data = {
      categoryId: Number(categoryId),
      description,
      amount: String(parseFloat(amount)),
      paymentMethod: paymentMethod as "cash" | "pix" | "card" | "transfer",
      date: new Date(date + "T12:00:00").toISOString(),
      notes: notes || undefined,
    };

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, ...data });
    } else {
      createMutation.mutate({ establishmentId, ...data });
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending || createRecurringMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-0 overflow-hidden border-t-4 border-t-primary"
        style={{ borderRadius: '16px' }}
      >
        <DialogTitle className="sr-only">{editingExpense ? "Editar despesa" : "Registrar despesa"}</DialogTitle>
        <div className="px-6 pt-5 pb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
              <Receipt className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{editingExpense ? "Editar despesa" : "Registrar despesa"}</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {editingExpense ? "Atualize os dados da despesa" : "Adicione uma nova despesa ao controle financeiro"}
              </p>
            </div>
          </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Data *
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Categoria *
            </label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || "#6b7280" }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Descrição *
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Compra de ingredientes"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Valor (R$) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Forma de pagamento
            </label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Observação
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          {/* Recurring Toggle */}
          {!editingExpense && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="recurring-toggle" className="text-sm font-medium cursor-pointer">
                    Tornar lançamento recorrente
                  </Label>
                </div>
                <Switch
                  id="recurring-toggle"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>

              {/* Recurring Fields - Animated Accordion */}
              <div
                ref={recurringRef}
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: isRecurring ? "400px" : "0px",
                  opacity: isRecurring ? 1 : 0,
                  marginTop: isRecurring ? "16px" : "0px",
                }}
              >
                <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/30">
                  {/* Frequency */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                      Frequência
                    </label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conditional: Day of Month */}
                  {frequency === "monthly" && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        Dia do mês
                      </label>
                      <Select value={executionDay} onValueChange={setExecutionDay}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>
                              Dia {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Conditional: Day of Week */}
                  {frequency === "weekly" && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        Dia da semana
                      </label>
                      <Select value={executionDay} onValueChange={setExecutionDay}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WEEKDAY_LABELS.map((label, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Conditional: Day + Month for Yearly */}
                  {frequency === "yearly" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                          Dia
                        </label>
                        <Select value={executionDay} onValueChange={setExecutionDay}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>
                                Dia {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                          Mês
                        </label>
                        <Select value={executionMonth} onValueChange={setExecutionMonth}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTH_LABELS.map((label, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Generate as pending */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pending-toggle" className="text-sm cursor-pointer">
                      Gerar como pendente
                    </Label>
                    <Switch
                      id="pending-toggle"
                      checked={generateAsPending}
                      onCheckedChange={setGenerateAsPending}
                    />
                  </div>

                  {/* End date (optional) */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                      Data final (opcional)
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="Sem data final"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Deixe vazio para recorrência sem fim
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
          <Button
            className="w-full rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white mt-4"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading
              ? "Salvando..."
              : editingExpense
              ? "Atualizar"
              : isRecurring
              ? "Salvar recorrente"
              : "Salvar despesa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ RECURRING EDIT MODAL ============
function RecurringEditModal({
  open,
  onOpenChange,
  establishmentId,
  recurring,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  recurring: any;
  onSuccess: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [frequency, setFrequency] = useState<string>("monthly");
  const [executionDay, setExecutionDay] = useState<string>("1");
  const [executionMonth, setExecutionMonth] = useState<string>("1");
  const [notes, setNotes] = useState("");

  const { data: categories } = trpc.finance.listCategories.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );

  const updateMutation = trpc.finance.updateRecurring.useMutation({
    onSuccess: () => {
      toast.success("Recorrência atualizada com sucesso!");
      onSuccess();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (recurring && open) {
      setCategoryId(String(recurring.categoryId));
      setDescription(recurring.description || "");
      setAmount(String(Number(recurring.amount)));
      setPaymentMethod(recurring.paymentMethod || "cash");
      setFrequency(recurring.frequency || "monthly");
      setExecutionDay(String(recurring.executionDay || 1));
      setExecutionMonth(String(recurring.executionMonth || 1));
      setNotes(recurring.notes || "");
    }
  }, [recurring, open]);

  function handleSubmit() {
    if (!categoryId || !description || !amount) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    updateMutation.mutate({
      id: recurring.id,
      establishmentId,
      categoryId: Number(categoryId),
      description,
      amount,
      paymentMethod: paymentMethod as any,
      frequency: frequency as any,
      executionDay: Number(executionDay),
      executionMonth: frequency === "yearly" ? Number(executionMonth) : null,
      notes: notes || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden border-t-4 border-t-blue-500"
        style={{ borderRadius: '16px' }}
      >
        <DialogTitle className="sr-only">Editar despesa recorrente</DialogTitle>
        <div className="px-6 pt-5 pb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl flex-shrink-0 bg-blue-100 dark:bg-blue-950/50">
              <Repeat className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Editar despesa recorrente</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Atualize os dados da despesa recorrente
              </p>
            </div>
          </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {categories?.map((cat: any) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Aluguel do ponto" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Valor (R$)</Label>
            <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Forma de pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Frequência</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {frequency === "weekly" && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Dia da semana</Label>
              <Select value={executionDay} onValueChange={setExecutionDay}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WEEKDAY_LABELS.map((label, i) => (
                    <SelectItem key={i} value={String(i)}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {frequency === "monthly" && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Dia do mês</Label>
              <Input type="number" min="1" max="31" value={executionDay} onChange={(e) => setExecutionDay(e.target.value)} />
            </div>
          )}
          {frequency === "yearly" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Dia</Label>
                <Input type="number" min="1" max="31" value={executionDay} onChange={(e) => setExecutionDay(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Mês</Label>
                <Select value={executionMonth} onValueChange={setExecutionMonth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTH_LABELS.map((label, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Observações (opcional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionais..." />
          </div>
        </div>
          <Button
            className="w-full rounded-xl h-10 font-semibold bg-blue-500 hover:bg-blue-600 text-white mt-4"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Salvando..." : "Atualizar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ CATEGORY MANAGER MODAL ============
function CategoryManagerModal({
  open,
  onOpenChange,
  establishmentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
}) {
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#6b7280");

  const utils = trpc.useUtils();
  const { data: categories } = trpc.finance.listCategories.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );

  const createMutation = trpc.finance.createCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoria criada!");
      utils.finance.listCategories.invalidate();
      setNewCatName("");
      setNewCatColor("#6b7280");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.finance.deleteCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoria excluída!");
      utils.finance.listCategories.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[450px] p-0 overflow-hidden border-t-4 border-t-primary"
        style={{ borderRadius: '16px' }}
      >
        <DialogTitle className="sr-only">Gerenciar categorias</DialogTitle>
        <div className="px-6 pt-5 pb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
              <Tag className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Gerenciar categorias</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Crie e gerencie as categorias de despesas
              </p>
            </div>
          </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nova categoria..."
              className="flex-1"
            />
            <input
              type="color"
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer"
            />
            <Button
              size="icon"
              onClick={() => {
                if (!newCatName.trim()) return;
                createMutation.mutate({
                  establishmentId,
                  name: newCatName.trim(),
                  color: newCatColor,
                });
              }}
              disabled={createMutation.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {categories?.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || "#6b7280" }}
                  />
                  <span className="text-sm font-medium">{cat.name}</span>
                  {cat.isDefault && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      padrão
                    </span>
                  )}
                </div>
                {!cat.isDefault && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate({ id: cat.id })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ GOAL MODAL ============
function GoalModal({
  open,
  onOpenChange,
  establishmentId,
  currentGoal,
  month,
  year,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  currentGoal: number | null;
  month: number;
  year: number;
}) {
  const [targetProfit, setTargetProfit] = useState(
    currentGoal ? String(currentGoal) : ""
  );

  useEffect(() => {
    setTargetProfit(currentGoal ? String(currentGoal) : "");
  }, [currentGoal, open]);

  const utils = trpc.useUtils();
  const mutation = trpc.finance.setGoal.useMutation({
    onSuccess: () => {
      toast.success("Meta atualizada!");
      utils.finance.getGoal.invalidate();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[400px] p-0 overflow-hidden border-t-4 border-t-emerald-500"
        style={{ borderRadius: '16px' }}
      >
        <DialogTitle className="sr-only">Meta mensal de lucro</DialogTitle>
        <div className="px-6 pt-5 pb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl flex-shrink-0 bg-emerald-100 dark:bg-emerald-950/50">
              <Target className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Meta mensal de lucro</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Defina sua meta de lucro líquido para{" "}
                {new Date(year, month - 1).toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Meta de lucro (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={targetProfit}
              onChange={(e) => setTargetProfit(e.target.value)}
              placeholder="Ex: 10000"
            />
          </div>
        </div>
          <Button
            className="w-full rounded-xl h-10 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
            onClick={() => {
              if (!targetProfit) return;
              mutation.mutate({
                establishmentId,
                month,
                year,
                targetProfit,
              });
            }}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Salvando..." : "Salvar meta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ WEEKLY GOAL MODAL ============
function WeeklyGoalModal({
  open,
  onOpenChange,
  establishmentId,
  currentGoal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  currentGoal: number | null;
}) {
  const [targetRevenue, setTargetRevenue] = useState(
    currentGoal ? String(currentGoal) : ""
  );

  useEffect(() => {
    setTargetRevenue(currentGoal ? String(currentGoal) : "");
  }, [currentGoal, open]);

  const utils = trpc.useUtils();
  const mutation = trpc.finance.setWeeklyGoal.useMutation({
    onSuccess: () => {
      toast.success("Meta semanal atualizada!");
      utils.finance.getWeeklyGoal.invalidate();
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[400px] p-0 overflow-hidden border-t-4 border-t-blue-500"
        style={{ borderRadius: '16px' }}
      >
        <DialogTitle className="sr-only">Meta semanal de faturamento</DialogTitle>
        <div className="px-6 pt-5 pb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl flex-shrink-0 bg-blue-100 dark:bg-blue-950/50">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Meta semanal de faturamento</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Defina sua meta de faturamento semanal. Essa meta ser\u00e1 usada no card de Performance Semanal.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Meta de faturamento (R$)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={targetRevenue}
                onChange={(e) => setTargetRevenue(e.target.value)}
                placeholder="Ex: 15000"
              />
            </div>
          </div>
          <Button
            className="w-full rounded-xl h-10 font-semibold bg-blue-600 hover:bg-blue-700 text-white mt-4"
            onClick={() => {
              if (!targetRevenue) return;
              mutation.mutate({
                establishmentId,
                targetRevenue,
              });
            }}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Salvando..." : "Salvar meta semanal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ CUSTOM GOAL MODAL ============
function CustomGoalModal({
  open,
  onOpenChange,
  establishmentId,
  editingGoal,
  month,
  year,
  onCreateGoal,
  onUpdateGoal,
  isCreating,
  isUpdating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  editingGoal: any;
  month: number;
  year: number;
  onCreateGoal: (data: { establishmentId: number; month: number; year: number; name: string; targetValue: string }) => void;
  onUpdateGoal: (data: { id: number; establishmentId: number; name: string; targetValue: string }) => void;
  isCreating: boolean;
  isUpdating: boolean;
}) {
  const [goalName, setGoalName] = useState("");
  const [targetValue, setTargetValue] = useState("");

  useEffect(() => {
    if (editingGoal) {
      setGoalName(editingGoal.name || "");
      setTargetValue(String(Number(editingGoal.targetValue)) || "");
    } else {
      setGoalName("");
      setTargetValue("");
    }
  }, [editingGoal, open]);

  const isLoading = isCreating || isUpdating;

  function handleSubmit() {
    if (!goalName.trim() || !targetValue) {
      toast.error("Preencha o nome e o valor da meta.");
      return;
    }
    if (editingGoal) {
      onUpdateGoal({
        id: editingGoal.id,
        establishmentId,
        name: goalName.trim(),
        targetValue: String(parseFloat(targetValue)),
      });
    } else {
      onCreateGoal({
        establishmentId,
        month,
        year,
        name: goalName.trim(),
        targetValue: String(parseFloat(targetValue)),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[400px] p-0 overflow-hidden border-t-4 border-t-amber-500"
        style={{ borderRadius: '16px' }}
      >
        <DialogTitle className="sr-only">{editingGoal ? "Editar meta" : "Nova meta"}</DialogTitle>
        <div className="px-6 pt-5 pb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl flex-shrink-0 bg-amber-100 dark:bg-amber-950/50">
              <Target className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{editingGoal ? "Editar meta" : "Nova meta"}</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {editingGoal ? "Edite os dados da meta" : `Crie uma nova meta para ${new Date(year, month - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`}
              </p>
            </div>
          </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Nome da meta *
            </label>
            <Input
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder="Ex: Faturamento, Economia, Investimento"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Valor alvo (R$) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="Ex: 15000"
            />
          </div>
        </div>
          <Button
            className="w-full rounded-xl h-10 font-semibold bg-amber-500 hover:bg-amber-600 text-white mt-4"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : editingGoal ? "Salvar" : "Criar meta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ FINANCIAL HEALTH INDICATOR ============
function FinancialHealthIndicator({
  profit,
  revenue,
  expensesTotal,
  goalTarget,
  goalProgress,
}: {
  profit: number;
  revenue: number;
  expensesTotal: number;
  goalTarget: number | null;
  goalProgress: number | null;
}) {
  const hasNoData = revenue === 0 && expensesTotal === 0;
  const isNegative = profit < 0;
  const isWarning = expensesTotal > revenue && revenue > 0;
  const healthPercent = revenue > 0 ? Math.min(100, Math.max(0, ((revenue - expensesTotal) / revenue) * 100)) : 0;

  // Animated fill: start at 0 and grow to healthPercent
  const [animatedPercent, setAnimatedPercent] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercent(Math.max(3, healthPercent));
    }, 150);
    return () => clearTimeout(timer);
  }, [healthPercent]);

  let healthColor = "bg-emerald-500";
  let healthLabel = "Saudável";
  let healthTextColor = "text-emerald-600";

  if (hasNoData) {
    healthColor = "bg-muted-foreground/30";
    healthLabel = "Sem movimentação";
    healthTextColor = "text-muted-foreground";
  } else if (isNegative) {
    healthColor = "bg-red-500";
    healthLabel = "Prejuízo";
    healthTextColor = "text-red-500";
  } else if (healthPercent < 20) {
    healthColor = "bg-amber-500";
    healthLabel = "Atenção";
    healthTextColor = "text-amber-600";
  } else if (healthPercent < 40) {
    healthColor = "bg-yellow-500";
    healthLabel = "Regular";
    healthTextColor = "text-yellow-600";
  }

  return (
    <div className="space-y-4">
      {/* Health Thermometer */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Saúde financeira
          </span>
          <span className={`text-sm font-semibold ${healthTextColor}`}>
            {healthLabel}
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${healthColor}`}
            style={{
              width: `${animatedPercent}%`,
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[11px] font-medium text-red-500">Prejuízo</span>
          <span className="text-[11px] font-medium text-amber-500">Boa</span>
          <span className="text-[11px] font-medium text-emerald-500">Excelente</span>
        </div>
      </div>

      {/* Warning Alert */}
      {isWarning && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <span className="text-xs text-red-500 dark:text-red-400 font-medium">
            Despesas excedem a receita neste período
          </span>
        </div>
      )}


    </div>
  );
}

// ============ CUSTOM CHART TOOLTIP ============
function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/50 rounded-xl shadow-lg p-3 min-w-[160px]">
      <p className="text-xs text-muted-foreground font-medium mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ============ EVOLUTION BAR CHART (estilo WeeklyRevenueCard) ============
function EvolutionBarChart({ data }: { data: { label: string; revenue: number; expenses: number; profit: number }[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const maxValue = useMemo(() => {
    const allValues = data.flatMap(d => [d.revenue, d.expenses, Math.abs(d.profit)]);
    return Math.max(...allValues, 1);
  }, [data]);

  return (
    <div className="flex-1 flex flex-col justify-end">
      <div className="flex items-end justify-between gap-1 sm:gap-1.5 h-40">
        {data.map((item, index) => {
          const revenueH = (item.revenue / maxValue) * 100;
          const expenseH = (item.expenses / maxValue) * 100;
          const profitH = (Math.abs(item.profit) / maxValue) * 100;

          return (
            <div
              key={item.label}
              className="flex-1 flex flex-col items-center gap-1.5 relative group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Bars container */}
              <div className="relative w-full h-32 flex items-end justify-center gap-[2px]">
                {/* Revenue bar */}
                <div
                  className="flex-1 rounded-t-md bg-emerald-500 transition-colors duration-300"
                  style={{ height: `${Math.max(revenueH, 3)}%` }}
                />
                {/* Expenses bar */}
                <div
                  className="flex-1 rounded-t-md bg-red-500 transition-colors duration-300"
                  style={{ height: `${Math.max(expenseH, 3)}%` }}
                />
                {/* Profit bar */}
                <div
                  className={cn(
                    "flex-1 rounded-t-md transition-colors duration-300",
                    item.profit >= 0 ? "bg-blue-500" : "bg-blue-300"
                  )}
                  style={{ height: `${Math.max(profitH, 3)}%` }}
                />
              </div>

              {/* Label */}
              <span className="text-[10px] font-medium text-muted-foreground truncate w-full text-center">
                {item.label}
              </span>

              {/* Tooltip */}
              {hoveredIndex === index && (
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-10 bg-gray-900 dark:bg-gray-800 text-white px-2.5 py-2 rounded-md shadow-lg text-xs whitespace-nowrap">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Receita:</span>
                    <span className="font-semibold">{formatCurrency(item.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span>Despesas:</span>
                    <span className="font-semibold">{formatCurrency(item.expenses)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Lucro:</span>
                    <span className={cn("font-semibold", item.profit >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {formatCurrency(item.profit)}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-900 dark:bg-gray-800 rotate-45" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function Financas() {
  const { data: establishment } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  // Date range state for the filter button
  const [customStart, setCustomStart] = useState(() => new Date().toISOString().split("T")[0]);
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split("T")[0]);

  // Always use 'custom' period with explicit dates
  const period = 'custom' as const;
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [weeklyGoalModalOpen, setWeeklyGoalModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [editingRecurring, setEditingRecurring] = useState<any>(null);
  const [recurringEditModalOpen, setRecurringEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 15;
  const [listTab, setListTab] = useState<"gastos" | "receitas" | "recorrentes">("gastos");
  const [revenueSearchTerm, setRevenueSearchTerm] = useState("");
  const [revenuePage, setRevenuePage] = useState(0);
  const [pageInput, setPageInput] = useState("");
  const [revenuePageInput, setRevenuePageInput] = useState("");
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecurringId, setHistoryRecurringId] = useState<number | null>(null);
  const [customGoalModalOpen, setCustomGoalModalOpen] = useState(false);
  const [editingCustomGoal, setEditingCustomGoal] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmMessage, setDeleteConfirmMessage] = useState('');
  const [deleteConfirmAction, setDeleteConfirmAction] = useState<(() => void) | null>(null);

  const showDeleteConfirm = useCallback((message: string, action: () => void) => {
    setDeleteConfirmMessage(message);
    setDeleteConfirmAction(() => action);
    setDeleteConfirmOpen(true);
  }, []);

  const [payConfirmOpen, setPayConfirmOpen] = useState(false);
  const [payConfirmItem, setPayConfirmItem] = useState<any>(null);
  const [payConfirmAmount, setPayConfirmAmount] = useState('');
  const [payConfirmDate, setPayConfirmDate] = useState('');

  useEffect(() => {
    if (establishment) setEstablishmentId(establishment.id);
  }, [establishment]);

  useEffect(() => {
    if (!establishmentId) return;

    const params = new URLSearchParams(window.location.search);
    const openGoalModal = params.get('openGoalModal');

    if (openGoalModal === 'monthly') {
      setGoalModalOpen(true);
    } else if (openGoalModal === 'weekly') {
      setWeeklyGoalModalOpen(true);
    } else {
      return;
    }

    params.delete('openGoalModal');
    const search = params.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  }, [establishmentId]);

  const utils = trpc.useUtils();

  // Current month/year for goal
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Memoize inputs
  const summaryInput = useMemo(
    () => ({ establishmentId: establishmentId!, period, customStart, customEnd }),
    [establishmentId, period, customStart, customEnd]
  );

  const chartInput = useMemo(
    () => ({ establishmentId: establishmentId!, period: 'week' as const }),
    [establishmentId]
  );

  const expensesInput = useMemo(
    () => ({
      establishmentId: establishmentId!,
      search: searchTerm || undefined,
      categoryId: filterCategory !== "all" ? Number(filterCategory) : undefined,
      limit: ITEMS_PER_PAGE,
      offset: page * ITEMS_PER_PAGE,
    }),
    [establishmentId, searchTerm, filterCategory, page]
  );

  const goalInput = useMemo(
    () => ({
      establishmentId: establishmentId!,
      month: currentMonth,
      year: currentYear,
    }),
    [establishmentId, currentMonth, currentYear]
  );

  const expensesByCatInput = useMemo(
    () => ({ establishmentId: establishmentId!, period: 'month' as const }),
    [establishmentId]
  );

  // Queries
  const { data: summary, isLoading: summaryLoading } =
    trpc.finance.summary.useQuery(summaryInput, {
      enabled: !!establishmentId,
    });

  const { data: chartData, isLoading: chartLoading } =
    trpc.finance.chart.useQuery(chartInput, {
      enabled: !!establishmentId,
    });

  const { data: expensesData, isLoading: expensesLoading } =
    trpc.finance.listExpenses.useQuery(expensesInput, {
      enabled: !!establishmentId,
    });

  const { data: categories } = trpc.finance.listCategories.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  const { data: goal } = trpc.finance.getGoal.useQuery(goalInput, {
    enabled: !!establishmentId,
  });

  // Meta semanal
  const { data: weeklyGoal } = trpc.finance.getWeeklyGoal.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  const setWeeklyGoalMutation = trpc.finance.setWeeklyGoal.useMutation({
    onSuccess: () => {
      toast.success("Meta semanal atualizada!");
      utils.finance.getWeeklyGoal.invalidate();
      setWeeklyGoalModalOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteWeeklyGoalMutation = trpc.finance.deleteWeeklyGoal.useMutation({
    onSuccess: () => {
      toast.success("Meta semanal removida!");
      utils.finance.getWeeklyGoal.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMonthlyGoalMutation = trpc.finance.deleteMonthlyGoal.useMutation({
    onSuccess: () => {
      toast.success("Meta mensal removida!");
      utils.finance.getGoal.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const weeklyGoalTargetRaw = weeklyGoal ? Number(weeklyGoal.targetRevenue) : null;
  const weeklyGoalTarget = weeklyGoalTargetRaw && weeklyGoalTargetRaw > 0 ? weeklyGoalTargetRaw : null;
  const weeklyGoalProgress = weeklyGoalTarget && summary ? (summary.revenue / weeklyGoalTarget) * 100 : null;

  // Custom financial goals (multiple)
  const customGoalsInput = useMemo(
    () => ({
      establishmentId: establishmentId!,
      month: currentMonth,
      year: currentYear,
    }),
    [establishmentId, currentMonth, currentYear]
  );
  const { data: customGoals } = trpc.finance.listGoals.useQuery(customGoalsInput, {
    enabled: !!establishmentId,
  });

  const createCustomGoalMutation = trpc.finance.createGoalCustom.useMutation({
    onSuccess: () => {
      toast.success("Meta criada com sucesso!");
      utils.finance.listGoals.invalidate();
      setCustomGoalModalOpen(false);
      setEditingCustomGoal(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateCustomGoalMutation = trpc.finance.updateGoalCustom.useMutation({
    onSuccess: () => {
      toast.success("Meta atualizada!");
      utils.finance.listGoals.invalidate();
      setCustomGoalModalOpen(false);
      setEditingCustomGoal(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCustomGoalMutation = trpc.finance.deleteGoalCustom.useMutation({
    onSuccess: () => {
      toast.success("Meta removida!");
      utils.finance.listGoals.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: expensesByCategory } = trpc.finance.expensesByCategory.useQuery(
    expensesByCatInput,
    { enabled: !!establishmentId }
  );

  // Revenue by channel
  const channelInput = useMemo(
    () => ({ establishmentId: establishmentId!, period, customStart, customEnd }),
    [establishmentId, period, customStart, customEnd]
  );
  const { data: channelData, isLoading: channelLoading } =
    trpc.finance.revenueByChannel.useQuery(channelInput, {
      enabled: !!establishmentId,
    });

  // Revenue by payment method
  const paymentMethodInput = useMemo(
    () => ({ establishmentId: establishmentId!, period, customStart, customEnd }),
    [establishmentId, period, customStart, customEnd]
  );
  const { data: paymentMethodData, isLoading: paymentMethodLoading } =
    trpc.finance.revenueByPaymentMethod.useQuery(paymentMethodInput, {
      enabled: !!establishmentId,
    });

  // Payment method daily breakdown for sparklines
  const paymentDailyInput = useMemo(
    () => ({ establishmentId: establishmentId!, period, customStart, customEnd }),
    [establishmentId, period, customStart, customEnd]
  );
  const { data: paymentDailyData } =
    trpc.finance.paymentMethodDaily.useQuery(paymentDailyInput, {
      enabled: !!establishmentId,
    });

  // Monthly comparison
  const comparisonInput = useMemo(
    () => ({ establishmentId: establishmentId! }),
    [establishmentId]
  );
  const { data: comparison, isLoading: comparisonLoading } =
    trpc.finance.getMonthlyComparison.useQuery(comparisonInput, {
      enabled: !!establishmentId,
    });

  // Recurring expenses
  const recurringInput = useMemo(
    () => ({ establishmentId: establishmentId! }),
    [establishmentId]
  );
  const { data: recurringExpenses } = trpc.finance.listRecurring.useQuery(
    recurringInput,
    { enabled: !!establishmentId }
  );

  // Upcoming recurring expenses query
  const { data: upcomingRecurring } = trpc.finance.upcomingRecurring.useQuery(
    recurringInput,
    { enabled: !!establishmentId }
  );

  // Undo mark as paid mutation
  const undoMarkAsPaidMutation = trpc.finance.undoMarkAsPaid.useMutation({
    onSuccess: () => {
      toast.success("Pagamento desfeito!");
      invalidateAll();
    },
    onError: (err) => toast.error(err.message),
  });

  // Mark upcoming as paid mutation
  const markAsPaidMutation = trpc.finance.markUpcomingAsPaid.useMutation({
    onSuccess: (result) => {
      setPayConfirmOpen(false);
      setPayConfirmItem(null);
      const message = result.action === 'updated' ? "Lan\u00e7amento marcado como pago!" : "Despesa registrada como paga!";
      toast.success(message, {
        action: {
          label: "Desfazer",
          onClick: () => {
            if (result.expenseId) {
              undoMarkAsPaidMutation.mutate({
                expenseId: result.expenseId,
                action: result.action,
                originalDate: result.originalDate ?? null,
              });
            }
          },
        },
        duration: 8000,
      });
      invalidateAll();
    },
    onError: (err) => toast.error(err.message),
  });

  // Recurring expense history query
  const historyInput = useMemo(
    () => ({
      recurringExpenseId: historyRecurringId!,
      establishmentId: establishmentId!,
    }),
    [historyRecurringId, establishmentId]
  );
  const { data: recurringHistory } = trpc.finance.recurringHistory.useQuery(
    historyInput,
    { enabled: !!historyRecurringId && !!establishmentId && historyModalOpen }
  );

  // Daily revenue query
  const dailyRevenueInput = useMemo(
    () => ({
      establishmentId: establishmentId!,
      limit: ITEMS_PER_PAGE,
      offset: revenuePage * ITEMS_PER_PAGE,
    }),
    [establishmentId, revenuePage]
  );
  const { data: dailyRevenueData, isLoading: dailyRevenueLoading } =
    trpc.finance.listDailyRevenue.useQuery(dailyRevenueInput, {
      enabled: !!establishmentId && listTab === "receitas",
    });

  // Delete mutation
  const deleteMutation = trpc.finance.deleteExpense.useMutation({
    onSuccess: () => {
      toast.success("Despesa excluída!");
      invalidateAll();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteRecurringMutation = trpc.finance.deleteRecurring.useMutation({
    onSuccess: () => {
      toast.success("Recorrência removida!");
      utils.finance.listRecurring.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleRecurringMutation = trpc.finance.updateRecurring.useMutation({
    onSuccess: () => {
      toast.success("Recorrência atualizada!");
      utils.finance.listRecurring.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function invalidateAll() {
    utils.finance.summary.invalidate();
    utils.finance.chart.invalidate();
    utils.finance.listExpenses.invalidate();
    utils.finance.expensesByCategory.invalidate();
    utils.finance.listRecurring.invalidate();
    utils.finance.getMonthlyComparison.invalidate();
    utils.finance.listGoals.invalidate();
    utils.finance.upcomingRecurring.invalidate();
    utils.finance.listDailyRevenue.invalidate();
  }

  const goalTargetRaw = goal ? Number(goal.targetProfit) : null;
  const goalTarget = goalTargetRaw && goalTargetRaw > 0 ? goalTargetRaw : null;
  const goalProgress =
    goalTarget && summary ? (summary.profit / goalTarget) * 100 : null;

  const totalPages = expensesData
    ? Math.ceil(expensesData.total / ITEMS_PER_PAGE)
    : 0;

  const revenueTotalPages = dailyRevenueData
    ? Math.ceil(dailyRevenueData.total / ITEMS_PER_PAGE)
    : 0;

  const sourceLabels: Record<string, string> = {
    internal: "Menu público",
    pdv: "PDV",
    ifood: "iFood",
    rappi: "Rappi",
    ubereats: "Uber Eats",
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Finanças"
          description="Controle completo das receitas e despesas do restaurante."
          icon={<BadgeDollarSign className="h-6 w-6 text-blue-600" />}
        />
        <div className="flex items-center gap-3">
          <div className="bg-muted rounded-xl p-1">
            <DateRangePickerSales
              startDate={customStart}
              endDate={customEnd}
              onApply={(start, end) => {
                setCustomStart(start);
                setCustomEnd(end);
              }}
              triggerClassName="flex items-center gap-2 rounded-lg cursor-pointer transition-colors px-4 py-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200"
              triggerLabel="Filtro"
              triggerIcon="sliders"
            />
          </div>
          <button
            onClick={() => {
              setEditingExpense(null);
              setExpenseModalOpen(true);
            }}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-red-500 text-white hover:bg-red-500 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo lançamento</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          title={
            "Receita do Período"
          }
          value={formatCurrency(summary?.revenue ?? 0)}
          icon={DollarSign}
          loading={summaryLoading}
          variant="emerald"
          trendPosition="title"
          trend={
            summary && summary.revenueChange !== undefined
              ? {
                  value: summary.revenueChange,
                  isPositive: summary.revenueChange >= 0,
                  label:
                    "vs período anterior",
                }
              : undefined
          }
        />
        <StatCard
          title={
            "Despesas do Período"
          }
          value={formatCurrency(summary?.expensesTotal ?? 0)}
          icon={TrendingDown}
          loading={summaryLoading}
          variant="red"
          trendPosition="title"
          trend={
            summary && summary.expensesChange !== undefined
              ? {
                  value: summary.expensesChange,
                  isPositive: summary.expensesChange <= 0,
                  label:
                    "vs período anterior",
                }
              : undefined
          }
        />
        <StatCard
          title="L. Líquido"
          value={formatCurrency(summary?.profit ?? 0)}
          icon={TrendingUp}
          loading={summaryLoading}
          variant="blue"
          trendPosition="title"
          trend={
            summary && summary.profitChange !== undefined
              ? {
                  value: summary.profitChange,
                  isPositive: summary.profitChange >= 0,
                  label:
                    "vs período anterior",
                }
              : undefined
          }
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(summary?.avgTicket ?? 0)}
          icon={Receipt}
          loading={summaryLoading}
          variant="amber"
          trendPosition="title"
          trend={
            summary && summary.avgTicketChange !== undefined
              ? {
                  value: summary.avgTicketChange,
                  isPositive: summary.avgTicketChange >= 0,
                  label:
                    "vs período anterior",
                }
              : undefined
          }
        />
      </div>

      {/* Chart + Health Indicator */}
      <div key={period} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6 mb-6 min-w-0 overflow-x-hidden">
        {/* Coluna esquerda */}
        <div className="flex flex-col gap-6 min-w-0">
        <div className="bg-card rounded-xl border border-border/50 p-5" style={{ flex: 1, display: 'flex', flexDirection: 'column' as const }}>
          {/* Header com ícone + tags de legenda */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Evolução financeira</h3>
                <p className="text-xs text-muted-foreground">
                  {'Últimos 7 dias'}
                </p>
              </div>
            </div>
            {/* Legend tags */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Receita</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Despesas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Lucro</span>
              </div>
            </div>
          </div>

          {/* Gráfico recharts */}
          <div style={{ flex: 1, minHeight: 250 }}>
          {chartLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="skeleton h-full w-full rounded-lg" />
            </div>
          ) : chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  opacity={0.3}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                  }
                  dx={-5}
                />
                <RechartsTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ stroke: 'var(--color-border)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Bar
                  dataKey="expenses"
                  name="Despesas"
                  fill="url(#gradExpenses)"
                  radius={[6, 6, 0, 0]}
                  barSize={20}
                />
                <Area
                  type="natural"
                  dataKey="revenue"
                  name="Receita"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#gradRevenue)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                />
                <Line
                  type="natural"
                  dataKey="profit"
                  name="Lucro"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Sem dados para o período selecionado
            </div>
          )}
          </div>
        </div>

        {/* Comparação Mensal */}
        <div className="bg-card rounded-xl border border-border/50 p-5" style={{ flex: 1, display: 'flex', flexDirection: 'column' as const }}>
          {/* Header com ícone */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Comparação Mensal</h3>
                <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
              </div>
            </div>
            {/* Legend tags */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Receitas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Despesas</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 250 }}>
          {comparisonLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="skeleton h-full w-full rounded-lg" />
            </div>
          ) : comparison && comparison.months?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparison.months}
                barGap={4}
                barCategoryGap="25%"
              >
                <defs>
                  <linearGradient id="gradBarReceitas" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.95} />
                  </linearGradient>
                  <linearGradient id="gradBarDespesas" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.95} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => {
                    if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(0)}.000`;
                    return `R$ ${v}`;
                  }}
                />
                <RechartsTooltip content={<ChartTooltipContent />} cursor={{ fill: 'rgba(156, 163, 175, 0.2)' }} />
                <Bar
                  dataKey="receitas"
                  name="Receitas"
                  fill="url(#gradBarReceitas)"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
                <Bar
                  dataKey="despesas"
                  name="Despesas"
                  fill="url(#gradBarDespesas)"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Sem dados para comparação
            </div>
          )}
          </div>
        </div>
        </div>{/* end coluna esquerda */}

        {/* Coluna direita */}
        <div className="flex flex-col gap-6 min-w-0">
        {/* Indicadores */}
        <div className="bg-card rounded-xl border border-border/50 p-5 min-w-0">
          {/* Header com ícone - mesmo estilo do Evolução Financeira */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Indicadores</h3>
                <p className="text-xs text-muted-foreground">Saúde e metas do período</p>
              </div>
            </div>
          </div>

          <FinancialHealthIndicator
            profit={summary?.profit ?? 0}
            revenue={summary?.revenue ?? 0}
            expensesTotal={summary?.expensesTotal ?? 0}
            goalTarget={goalTarget}
            goalProgress={goalProgress}
          />

          {/* Expenses by category mini-list */}
          {expensesByCategory && expensesByCategory.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Despesas por categoria
              </h4>
              <div className="space-y-2">
                {expensesByCategory.map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: cat.categoryColor || "#6b7280",
                        }}
                      />
                      <span className="text-sm">{cat.categoryName}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 space-y-2">
            {/* Meta semanal button with integrated progress fill */}
            <div
              className="relative w-full h-10 rounded-md border border-border overflow-hidden cursor-pointer transition-all hover:border-foreground/30 group"
              onClick={() => setWeeklyGoalModalOpen(true)}
            >
              {/* Progress fill background */}
              {weeklyGoalTarget && weeklyGoalProgress !== null && (
                <div
                  className="absolute inset-y-0 left-0 transition-colors duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(0, weeklyGoalProgress))}%`,
                    background: weeklyGoalProgress >= 70
                      ? 'linear-gradient(90deg, #3b82f6, #2563eb)'
                      : weeklyGoalProgress >= 30
                      ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                      : weeklyGoalProgress >= 10
                      ? 'linear-gradient(90deg, #f97316, #f59e0b)'
                      : 'linear-gradient(90deg, #ef4444, #f97316)',
                    opacity: 0.2,
                  }}
                />
              )}
              {/* Button content */}
              <div className="relative flex items-center gap-2 h-full px-3 z-10">
                <Calendar className={`h-4 w-4 shrink-0 ${
                  weeklyGoalTarget && weeklyGoalProgress !== null
                    ? weeklyGoalProgress >= 70 ? 'text-blue-600' : weeklyGoalProgress >= 30 ? 'text-amber-600' : weeklyGoalProgress >= 10 ? 'text-orange-600' : 'text-red-500'
                    : 'text-muted-foreground'
                }`} />
                <span className="text-sm font-medium">
                  {weeklyGoalTarget
                    ? `Meta semanal: ${formatCurrency(weeklyGoalTarget)}`
                    : "Definir meta semanal"}
                </span>
                {weeklyGoalTarget && weeklyGoalProgress !== null && (
                  <span className={`ml-auto text-xs font-bold ${
                    weeklyGoalProgress >= 70 ? 'text-blue-600' : weeklyGoalProgress >= 30 ? 'text-amber-600' : weeklyGoalProgress >= 10 ? 'text-orange-600' : 'text-red-500'
                  } shrink-0`}>
                    {weeklyGoalProgress >= 100 ? '\u2713 Atingida!' : `${Math.round(Math.max(0, weeklyGoalProgress))}%`}
                  </span>
                )}
                {weeklyGoalTarget && (
                  <button
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-500/20 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      showDeleteConfirm('Remover meta semanal?', () => {
                        deleteWeeklyGoalMutation.mutate({ establishmentId: establishmentId! });
                      });
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Meta principal (mensal) button with integrated progress fill */}
            <div
              className="relative w-full h-10 rounded-md border border-border overflow-hidden cursor-pointer transition-all hover:border-foreground/30 group"
              onClick={() => setGoalModalOpen(true)}
            >
              {/* Progress fill background */}
              {goalTarget && goalProgress !== null && (
                <div
                  className="absolute inset-y-0 left-0 transition-colors duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(0, goalProgress))}%`,
                    background: goalProgress >= 70
                      ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                      : goalProgress >= 30
                      ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                      : goalProgress >= 10
                      ? 'linear-gradient(90deg, #f97316, #f59e0b)'
                      : 'linear-gradient(90deg, #ef4444, #f97316)',
                    opacity: 0.2,
                  }}
                />
              )}
              {/* Button content */}
              <div className="relative flex items-center gap-2 h-full px-3 z-10">
                <Target className={`h-4 w-4 shrink-0 ${
                  goalTarget && goalProgress !== null
                    ? goalProgress >= 70 ? 'text-emerald-600' : goalProgress >= 30 ? 'text-amber-600' : goalProgress >= 10 ? 'text-orange-600' : 'text-red-500'
                    : 'text-muted-foreground'
                }`} />
                <span className="text-sm font-medium">
                  {goalTarget
                    ? `Meta: ${formatCurrency(goalTarget)}`
                    : "Definir meta mensal"}
                </span>
                {goalTarget && goalProgress !== null && (
                  <span className={`ml-auto text-xs font-bold ${
                    goalProgress >= 70 ? 'text-emerald-600' : goalProgress >= 30 ? 'text-amber-600' : goalProgress >= 10 ? 'text-orange-600' : 'text-red-500'
                  } shrink-0`}>
                    {goalProgress >= 100 ? '✓ Atingida!' : `${Math.round(Math.max(0, goalProgress))}%`}
                  </span>
                )}
                {goalTarget && (
                  <button
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-500/20 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      showDeleteConfirm('Remover meta mensal?', () => {
                        deleteMonthlyGoalMutation.mutate({ establishmentId: establishmentId!, month: currentMonth, year: currentYear });
                      });
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Custom goals list */}
            {customGoals && customGoals.length > 0 && customGoals.map((cGoal) => {
              const cTarget = Number(cGoal.targetValue);
              const cProgress = cTarget && summary ? (summary.profit / cTarget) * 100 : 0;
              const cIconColor = cProgress >= 70 ? 'text-emerald-600' : cProgress >= 30 ? 'text-amber-600' : cProgress >= 10 ? 'text-orange-600' : 'text-red-500';
              return (
                <div
                  key={cGoal.id}
                  className="relative w-full h-10 rounded-md border border-border overflow-hidden cursor-pointer transition-all hover:border-foreground/30 group"
                  onClick={() => {
                    setEditingCustomGoal(cGoal);
                    setCustomGoalModalOpen(true);
                  }}
                >
                  {/* Progress fill background */}
                  <div
                    className="absolute inset-y-0 left-0 transition-colors duration-700 ease-out"
                    style={{
                      width: `${Math.min(100, Math.max(0, cProgress))}%`,
                      background: cProgress >= 70
                        ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                        : cProgress >= 30
                        ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                        : cProgress >= 10
                        ? 'linear-gradient(90deg, #f97316, #f59e0b)'
                        : 'linear-gradient(90deg, #ef4444, #f97316)',
                      opacity: 0.2,
                    }}
                  />
                  {/* Button content */}
                  <div className="relative flex items-center gap-2 h-full px-3 z-10">
                    <Target className={`h-4 w-4 shrink-0 ${cIconColor}`} />
                    <span className="text-sm font-medium truncate">
                      {cGoal.name}: {formatCurrency(cTarget)}
                    </span>
                    <span className={`ml-auto text-xs font-bold ${cIconColor} shrink-0`}>
                      {cProgress >= 100 ? '✓ Atingida!' : `${Math.round(Math.max(0, cProgress))}%`}
                    </span>
                    {/* Delete button on hover */}
                    <button
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-500/20 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        showDeleteConfirm('Remover esta meta?', () => {
                          deleteCustomGoalMutation.mutate({ id: cGoal.id, establishmentId: establishmentId! });
                        });
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Action buttons side by side */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 justify-center gap-2 border-dashed text-xs"
                onClick={() => {
                  setEditingCustomGoal(null);
                  setCustomGoalModalOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Nova meta
              </Button>

              <Button
                variant="outline"
                className="flex-1 justify-center gap-2 text-xs"
                onClick={() => setCategoryModalOpen(true)}
              >
                <Tag className="h-3.5 w-3.5" />
                Categorias
              </Button>
            </div>
          </div>
        </div>

        {/* Faturamento por canal - mesma coluna do Indicadores */}
        <div className="bg-card rounded-xl border border-border/50 p-5 min-w-0">
          {/* Header com ícone */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
              <DollarSign className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">Faturamento por canal</h3>
              <p className="text-xs text-muted-foreground">Origem das receitas no período</p>
            </div>
          </div>

          {channelLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="skeleton h-full w-full rounded-lg" />
            </div>
          ) : channelData && channelData.total > 0 ? (
            <div className="flex items-center gap-6">
              {/* Donut Chart */}
              <div className="relative flex-shrink-0">
                <PieChart width={140} height={140}>
                  <Pie
                    data={channelData.channels.map((ch) => ({
                      name: ch.name,
                      value: ch.total,
                      id: ch.id,
                    }))}
                    cx={70}
                    cy={70}
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {channelData.channels.map((ch) => {
                      const donutColors: Record<string, string> = {
                        pdv: '#3b82f6',
                        menu: '#10b981',
                        mesas: '#f59e0b',
                      };
                      return <Cell key={ch.id} fill={donutColors[ch.id] || '#9ca3af'} />;
                    })}
                  </Pie>
                </PieChart>
                {/* Centro do donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-bold text-foreground leading-tight">
                    {channelData.total >= 1000 ? `R$ ${(channelData.total / 1000).toFixed(1)}k` : formatCurrency(channelData.total)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Total</span>
                </div>
              </div>

              {/* Lista de canais */}
              <div className="flex-1 space-y-3 min-w-0">
                {channelData.channels.map((ch) => {
                  const dotColors: Record<string, string> = {
                    pdv: 'bg-blue-500',
                    menu: 'bg-emerald-500',
                    mesas: 'bg-amber-500',
                  };
                  return (
                    <div key={ch.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${dotColors[ch.id] || 'bg-gray-400'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{ch.name}</p>
                          <p className="text-[11px] text-muted-foreground">{ch.count} pedidos · Ticket {formatCurrency(ch.count > 0 ? ch.total / ch.count : 0)}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-foreground flex-shrink-0 ml-3">{formatCurrency(ch.total)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">
              Sem faturamento registrado neste período
            </div>
          )}
        </div>
        {/* Formas de Pagamento */}
        <div className="bg-card rounded-xl border border-border/50 p-5 min-w-0">
          {/* Header com ícone */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
              <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">Formas de Pagamento</h3>
              <p className="text-xs text-muted-foreground">Distribuição por método de pagamento</p>
            </div>
          </div>

          {paymentMethodLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="skeleton h-full w-full rounded-lg" />
            </div>
          ) : paymentMethodData && paymentMethodData.total > 0 ? (
            <div className="space-y-4">
              {/* Horizontal bars - one per payment method */}
              {paymentMethodData.methods.map((m) => {
                const paymentColors: Record<string, string> = {
                  pix: 'bg-violet-500',
                  card: 'bg-blue-500',
                  cash: 'bg-emerald-500',
                };
                const barColor = paymentColors[m.id] || 'bg-gray-500';

                return (
                  <div key={m.id} className="group relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{m.name}</span>
                        <span className="text-xs text-muted-foreground">({m.count} pedidos)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(m.total)}</span>
                        <span className="text-xs font-semibold" style={{ color: m.color }}>{m.percent}%</span>
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden cursor-pointer">
                      <div
                        className={`h-full rounded-full transition-colors duration-500 ${barColor}`}
                        style={{ width: `${Math.max(3, m.percent)}%` }}
                      />
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-colors duration-200 pointer-events-none">
                      <div className="bg-foreground text-background rounded-lg px-3 py-2 shadow-lg text-xs whitespace-nowrap">
                        <div className="font-semibold mb-1">{m.name}</div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span>Valor:</span>
                          <span className="font-semibold">{formatCurrency(m.total)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span>Pedidos:</span>
                          <span className="font-semibold">{m.count}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>Percentual:</span>
                          <span className="font-semibold">{m.percent}%</span>
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-foreground" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">
              Nenhuma venda registrada neste período
            </div>
          )}
        </div>
        </div>{/* end coluna direita */}

      </div>

      {/* Lançamentos futuros - Timeline horizontal */}
      {(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const currentMonthName = MONTH_LABELS[currentMonth];
        
        // Filter occurrences for current month to calculate committed amount
        const monthOccurrences = (upcomingRecurring ?? []).filter(item => {
          const d = new Date(item.dueDate + 'T12:00:00');
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const committedTotal = monthOccurrences.reduce((sum, item) => sum + item.amount, 0);
        
        // Get badge for each item
        const getBadge = (dueDate: string) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const due = new Date(dueDate + 'T12:00:00');
          due.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays < 0) return { text: "Atrasado", color: "bg-red-500 text-white" };
          if (diffDays === 0) return { text: "Hoje", color: "bg-amber-500 text-white" };
          if (diffDays <= 3) return { text: "Próximo", color: "bg-red-100 text-red-500 dark:bg-red-500/20 dark:text-red-400" };
          return null;
        };
        
        const formatDate = (dateStr: string) => {
          const d = new Date(dateStr + 'T12:00:00');
          return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        };
        
        // Category icon mapping - using Lucide icons to match system visual
        const getCategoryLucideIcon = (categoryName: string | null): LucideIcon => {
          const name = (categoryName ?? '').toLowerCase();
          if (name.includes('aluguel')) return Home;
          if (name.includes('energia') || name.includes('luz')) return Zap;
          if (name.includes('água')) return Droplets;
          if (name.includes('internet') || name.includes('telefone')) return Globe;
          if (name.includes('marketing') || name.includes('publicidade')) return Megaphone;
          if (name.includes('funcionário') || name.includes('salário')) return Users;
          if (name.includes('imposto') || name.includes('taxa')) return FileText;
          if (name.includes('fornecedor')) return Package;
          if (name.includes('seguro')) return ShieldCheck;
          if (name.includes('manutenção')) return Wrench;
          return Calendar;
        };
        
        return (
          <div className="bg-card rounded-xl border border-border/50 p-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Lançamentos futuros</h3>
                <p className="text-xs text-muted-foreground">
                  Quantia comprometida em {currentMonthName}: {formatCurrency(committedTotal)}
                </p>
              </div>
            </div>
            
            {/* Timeline horizontal */}
            {(!upcomingRecurring || upcomingRecurring.length === 0) ? (
              <div className="h-[100px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhum lançamento recorrente programado.
              </div>
            ) : (
              <div className="relative hover-scroll-container">
                <div 
                  className="flex items-center gap-3 overflow-x-auto pt-3 pb-3 scrollbar-hide"
                >
                  {upcomingRecurring.filter(item => {
                      if (!item.isPaid) return true;
                      // Show paid cards only on the same day they were due (hide after midnight)
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const due = new Date(item.dueDate + 'T00:00:00');
                      return due.getTime() >= today.getTime();
                    }).slice(0, 12).map((item, index) => {
                    const badge = getBadge(item.dueDate);
                    return (
                      <div key={`${item.recurringId}-${item.dueDate}`} className="flex items-center gap-3 flex-shrink-0">
                        {/* Mini card - left colored border */}
                        <div
                          className={`relative border rounded-xl p-3.5 min-w-[150px] hover:shadow-md hover:-translate-y-0.5 transition-transform duration-200 border-l-[3px] cursor-pointer ${
                            item.isPaid
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 border-l-emerald-500'
                              : `bg-card border-border/50 ${item.type === 'revenue' ? 'border-l-emerald-500' : 'border-l-red-500'}`
                          }`}
                          style={{width: '165px'}}
                          onClick={() => {
                            if (item.frequency === 'once') {
                              // One-time expense: open expense edit modal
                              const expenseToEdit = expensesData?.items?.find((e: any) => e.id === item.recurringId);
                              if (expenseToEdit) {
                                setEditingExpense(expenseToEdit);
                                setExpenseModalOpen(true);
                              } else {
                                // Expense may not be in current list (different month), fetch and open with basic data
                                setEditingExpense({
                                  id: item.recurringId,
                                  categoryId: item.categoryId,
                                  description: item.description,
                                  amount: String(item.amount),
                                  paymentMethod: item.paymentMethod,
                                  date: item.dueDate,
                                });
                                setExpenseModalOpen(true);
                              }
                              return;
                            }
                            // Find the full recurring expense data
                            const fullRecurring = recurringExpenses?.find((r: any) => r.id === item.recurringId);
                            if (fullRecurring) {
                              setEditingRecurring(fullRecurring);
                              setRecurringEditModalOpen(true);
                            } else {
                              toast.error("Não foi possível encontrar a recorrência.");
                            }
                          }}
                        >
                          {/* Badge */}
                          {item.isPaid ? (
                            <span className="absolute -top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-lg bg-emerald-500 text-white">
                              Pago
                            </span>
                          ) : badge ? (
                            <span className={`absolute -top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-lg ${badge.color}`}>
                              {badge.text}
                            </span>
                          ) : null}
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate max-w-[120px]" title={item.description}>{item.description}</p>
                            <p className="text-sm font-bold mt-1">
                              {item.type === 'revenue' ? (
                                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(item.amount)}</span>
                              ) : (
                                <span className="text-red-500 dark:text-red-400">{formatCurrency(item.amount)}</span>
                              )}
                            </p>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-[10px] text-muted-foreground">{formatDate(item.dueDate)}</p>
                              {!item.isPaid ? (
                                <button
                                  className="text-muted-foreground/50 hover:text-emerald-500 transition-colors p-0.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                  title="Marcar como pago"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!item.categoryId) {
                                      toast.error("Categoria n\u00e3o encontrada para este lan\u00e7amento.");
                                      return;
                                    }
                                    setPayConfirmItem(item);
                                    setPayConfirmAmount(item.amount.toFixed(2));
                                    setPayConfirmDate(item.dueDate);
                                    setPayConfirmOpen(true);
                                  }}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Arrow separator */}
                        {index < Math.min((upcomingRecurring?.length ?? 0), 12) - 1 && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Unified Tabbed Section: Gastos / Receitas / Recorrentes */}
      <div className="mt-6">
        {/* Header with tabs - OUTSIDE the card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-5">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              listTab === "gastos" ? "bg-red-100 dark:bg-red-500/15" :
              listTab === "receitas" ? "bg-emerald-100 dark:bg-emerald-500/15" :
              "bg-purple-100 dark:bg-purple-500/15"
            }`} style={{borderRadius: '12px'}}>
              {listTab === "gastos" ? (
                <Receipt className="h-5 w-5 text-red-500 dark:text-red-400" />
              ) : listTab === "receitas" ? (
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Repeat className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">
                {listTab === "gastos" ? "Gastos registrados" :
                 listTab === "receitas" ? "Receitas di\u00e1rias" :
                 "Despesas recorrentes"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {listTab === "gastos" ? `${expensesData?.total ?? 0} despesas` :
                 listTab === "receitas" ? `${dailyRevenueData?.total ?? 0} dias com receita` :
                 `${recurringExpenses?.length ?? 0} lan\u00e7amentos recorrentes`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Tab selector - same style as period selector */}
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
              {(["gastos", "receitas", "recorrentes"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setListTab(tab);
                    setPage(0);
                    setRevenuePage(0);
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    listTab === tab
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "gastos" ? "Gastos" : tab === "receitas" ? "Receitas" : "Recorrentes"}
                </button>
              ))}
            </div>
            {listTab === "gastos" && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingExpense(null);
                  setExpenseModalOpen(true);
                }}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Novo gasto
              </Button>
            )}
          </div>
        </div>

        {/* Card container for tab content */}
        <div className="bg-card rounded-xl border border-border/50 p-5">
        {/* === GASTOS TAB === */}
        {listTab === "gastos" && (
          <>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar despesas..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={filterCategory}
            onValueChange={(v) => {
              setFilterCategory(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Todas categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color || "#6b7280" }}
                    />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {expensesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton h-5 flex-[0.8] rounded" />
                <div className="skeleton h-5 flex-1 rounded" />
                <div className="skeleton h-5 flex-[1.5] rounded" />
                <div className="skeleton h-5 flex-[0.7] rounded" />
                <div className="skeleton h-5 flex-[0.8] rounded" />
                <div className="skeleton h-5 flex-[0.5] rounded" />
              </div>
            ))}
          </div>
        ) : expensesData && expensesData.items.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                      Data
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                      Categoria
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                      Descrição
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                      Valor
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                      Pagamento
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expensesData.items.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-2 text-sm">
                        {new Date(expense.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                expense.categoryColor || "#6b7280",
                            }}
                          />
                          <span className="text-sm">
                            {expense.categoryName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm max-w-[200px] truncate">
                        {expense.description}
                      </td>
                      <td className="py-3 px-2 text-sm font-semibold text-right text-red-500 dark:text-red-400">
                        -{formatCurrency(Number(expense.amount))}
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {paymentMethodLabels[expense.paymentMethod] ||
                          expense.paymentMethod}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingExpense(expense);
                              setExpenseModalOpen(true);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              showDeleteConfirm(
                                "Tem certeza que deseja excluir esta despesa?",
                                () => {
                                  deleteMutation.mutate({ id: expense.id });
                                }
                              );
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {expensesData.items.map((expense) => (
                <div
                  key={expense.id}
                  className="p-4 rounded-xl bg-muted/30 border border-border/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">
                        {expense.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor:
                              expense.categoryColor || "#6b7280",
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {expense.categoryName}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-red-500 dark:text-red-400">
                      -{formatCurrency(Number(expense.amount))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {new Date(expense.date).toLocaleDateString("pt-BR")}
                      </span>
                      <span>
                        {paymentMethodLabels[expense.paymentMethod] ||
                          expense.paymentMethod}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingExpense(expense);
                          setExpenseModalOpen(true);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          showDeleteConfirm("Excluir esta despesa?", () => {
                            deleteMutation.mutate({ id: expense.id });
                          });
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5 mt-4">
                <p className="text-sm text-muted-foreground">
                  Página {page + 1} de {totalPages} · Total: {expensesData.total} despesa{expensesData.total !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={() => setPage(0)} disabled={page === 0}>
                    Primeira
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1.5 mx-1">
                    <span className="text-xs text-muted-foreground">Página</span>
                    <Input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={pageInput || (page + 1)}
                      onChange={(e) => setPageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = parseInt(pageInput);
                          if (val >= 1 && val <= totalPages) setPage(val - 1);
                          setPageInput("");
                        }
                      }}
                      onBlur={() => {
                        const val = parseInt(pageInput);
                        if (val >= 1 && val <= totalPages) setPage(val - 1);
                        setPageInput("");
                      }}
                      className="h-8 w-14 text-center text-xs"
                    />
                    <span className="text-xs text-muted-foreground">de {totalPages}</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs font-semibold" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                    Próxima
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>
                    Última
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={Receipt}
            title="Nenhuma despesa registrada"
            description="Registre seus gastos para acompanhar a saúde financeira do restaurante."
            action={{
              label: "Registrar despesa",
              onClick: () => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              },
            }}
          />
        )}
          </>
        )}

        {/* === RECEITAS TAB === */}
        {listTab === "receitas" && (
          <>
            {dailyRevenueLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="skeleton h-5 flex-1 rounded" />
                    <div className="skeleton h-5 flex-[0.7] rounded" />
                    <div className="skeleton h-5 flex-1 rounded" />
                    <div className="skeleton h-5 flex-[0.8] rounded" />
                  </div>
                ))}
              </div>
            ) : dailyRevenueData && dailyRevenueData.items.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">Data</th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">Pedidos</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">Canais</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">Pagamentos</th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyRevenueData.items.map((rev) => (
                        <tr key={rev.date} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-2 text-sm">
                            {new Date(rev.date + 'T12:00:00').toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}
                          </td>
                          <td className="py-3 px-2 text-sm text-right">{rev.orderCount}</td>
                          <td className="py-3 px-2 text-sm">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {rev.sources.split(',').map((s) => (
                                <span key={s} className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-muted">
                                  {sourceLabels[s.trim()] || s.trim()}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">
                            {rev.paymentMethods.split(',').map(m => paymentMethodLabels[m.trim()] || m.trim()).join(', ')}
                          </td>
                          <td className="py-3 px-2 text-sm font-semibold text-right text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(rev.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {dailyRevenueData.items.map((rev) => (
                    <div key={rev.date} className="p-4 rounded-xl bg-muted/30 border border-border/30">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(rev.date + 'T12:00:00').toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{rev.orderCount} pedidos</p>
                        </div>
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(rev.total)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {rev.sources.split(',').map((s) => (
                          <span key={s} className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-muted">
                            {sourceLabels[s.trim()] || s.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {revenueTotalPages > 1 && (
                  <div className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {revenuePage + 1} de {revenueTotalPages} · Total: {dailyRevenueData.total} dia{dailyRevenueData.total !== 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={() => setRevenuePage(0)} disabled={revenuePage === 0}>
                        Primeira
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={() => setRevenuePage((p) => Math.max(0, p - 1))} disabled={revenuePage === 0}>
                        Anterior
                      </Button>
                      <div className="flex items-center gap-1.5 mx-1">
                        <span className="text-xs text-muted-foreground">Página</span>
                        <Input
                          type="number"
                          min={1}
                          max={revenueTotalPages}
                          value={revenuePageInput || (revenuePage + 1)}
                          onChange={(e) => setRevenuePageInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = parseInt(revenuePageInput);
                              if (val >= 1 && val <= revenueTotalPages) setRevenuePage(val - 1);
                              setRevenuePageInput("");
                            }
                          }}
                          onBlur={() => {
                            const val = parseInt(revenuePageInput);
                            if (val >= 1 && val <= revenueTotalPages) setRevenuePage(val - 1);
                            setRevenuePageInput("");
                          }}
                          className="h-8 w-14 text-center text-xs"
                        />
                        <span className="text-xs text-muted-foreground">de {revenueTotalPages}</span>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs font-semibold" onClick={() => setRevenuePage((p) => Math.min(revenueTotalPages - 1, p + 1))} disabled={revenuePage >= revenueTotalPages - 1}>
                        Próxima
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={() => setRevenuePage(revenueTotalPages - 1)} disabled={revenuePage >= revenueTotalPages - 1}>
                        Última
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={DollarSign}
                title="Nenhuma receita registrada"
                description="As receitas são geradas automaticamente a partir dos pedidos finalizados."
              />
            )}
          </>
        )}

        {/* === RECORRENTES TAB === */}
        {listTab === "recorrentes" && (
          <>
            {recurringExpenses && recurringExpenses.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                          Frequência
                        </th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                          Categoria
                        </th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                          Descrição
                        </th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                          Valor
                        </th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                          Pagamento
                        </th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                          Status
                        </th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recurringExpenses.map((rec: any) => {
                        const freqLabel =
                          rec.frequency === "monthly"
                            ? `Mensal (dia ${rec.executionDay})`
                            : rec.frequency === "weekly"
                            ? `Semanal (${WEEKDAY_LABELS[rec.executionDay] || rec.executionDay})`
                            : `Anual (dia ${rec.executionDay}/${MONTH_LABELS[(rec.executionMonth || 1) - 1]})`;
                        return (
                          <tr
                            key={rec.id}
                            className={`border-b border-border/30 hover:bg-muted/30 transition-colors ${
                              !rec.active ? "opacity-50" : ""
                            }`}
                          >
                            <td className="py-3 px-2 text-sm">
                              {freqLabel}
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: rec.categoryColor || "#6b7280",
                                  }}
                                />
                                <span className="text-sm">
                                  {rec.categoryName}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-sm max-w-[200px] truncate">
                              {rec.description}
                            </td>
                            <td className={`py-3 px-2 text-sm font-semibold text-right ${
                              rec.type === 'revenue'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-500 dark:text-red-400'
                            }`}>
                              {rec.type === 'revenue' ? '+' : '-'}{formatCurrency(Number(rec.amount))}
                            </td>
                            <td className="py-3 px-2 text-sm text-muted-foreground">
                              {paymentMethodLabels[rec.paymentMethod] || rec.paymentMethod}
                            </td>
                            <td className="py-3 px-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${
                                rec.active
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {rec.active ? 'Ativo' : 'Pausado'}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                   variant="ghost"
                                   size="icon"
                                   className="h-8 w-8"
                                   title="Histórico"
                                   onClick={() => {
                                     setHistoryRecurringId(rec.id);
                                     setHistoryModalOpen(true);
                                   }}
                                 >
                                   <History className="h-3.5 w-3.5" />
                                 </Button>
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   className="h-8 w-8"
                                   title="Editar"
                                   onClick={() => {
                                     setEditingRecurring(rec);
                                     setRecurringEditModalOpen(true);
                                   }}
                                 >
                                   <Edit2 className="h-3.5 w-3.5" />
                                 </Button>
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   className="h-8 w-8"
                                   title={rec.active ? "Pausar" : "Ativar"}
                                  onClick={() => {
                                    toggleRecurringMutation.mutate({
                                      id: rec.id,
                                      establishmentId: establishmentId!,
                                      active: !rec.active,
                                    });
                                  }}
                                >
                                  {rec.active ? (
                                    <Pause className="h-3.5 w-3.5" />
                                  ) : (
                                    <Play className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    showDeleteConfirm("Excluir esta recorrência? Os lançamentos já gerados serão mantidos.", () => {
                                      deleteRecurringMutation.mutate({
                                        id: rec.id,
                                        establishmentId: establishmentId!,
                                        deleteFutureExpenses: false,
                                      });
                                    });
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {recurringExpenses.map((rec: any) => {
                    const freqLabel =
                      rec.frequency === "monthly"
                        ? `Mensal (dia ${rec.executionDay})`
                        : rec.frequency === "weekly"
                        ? `Semanal (${WEEKDAY_LABELS[rec.executionDay] || rec.executionDay})`
                        : `Anual (dia ${rec.executionDay}/${MONTH_LABELS[(rec.executionMonth || 1) - 1]})`;
                    return (
                      <div
                        key={rec.id}
                        className={`p-4 rounded-xl bg-muted/30 border border-border/30 ${
                          !rec.active ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{rec.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: rec.categoryColor || "#6b7280" }}
                              />
                              <span className="text-xs text-muted-foreground">
                                {rec.categoryName}
                              </span>
                            </div>
                          </div>
                          <span className={`text-sm font-semibold ${
                            rec.type === 'revenue'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-500 dark:text-red-400'
                          }`}>
                            {rec.type === 'revenue' ? '+' : '-'}{formatCurrency(Number(rec.amount))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{freqLabel}</span>
                            <span>·</span>
                            <span>{paymentMethodLabels[rec.paymentMethod] || rec.paymentMethod}</span>
                            <span>·</span>
                            <span className={`font-medium px-1.5 py-0.5 rounded-lg text-[10px] ${
                              rec.active
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {rec.active ? 'Ativo' : 'Pausado'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                               size="icon"
                               className="h-7 w-7"
                               title="Histórico"
                               onClick={() => {
                                 setHistoryRecurringId(rec.id);
                                 setHistoryModalOpen(true);
                               }}
                             >
                               <History className="h-3 w-3" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-7 w-7"
                               title="Editar"
                               onClick={() => {
                                 setEditingRecurring(rec);
                                 setRecurringEditModalOpen(true);
                               }}
                             >
                               <Edit2 className="h-3 w-3" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-7 w-7"
                               title={rec.active ? "Pausar" : "Ativar"}
                              onClick={() => {
                                toggleRecurringMutation.mutate({
                                  id: rec.id,
                                  establishmentId: establishmentId!,
                                  active: !rec.active,
                                });
                              }}
                            >
                              {rec.active ? (
                                <Pause className="h-3 w-3" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                showDeleteConfirm("Excluir esta recorrência? Os lançamentos já gerados serão mantidos.", () => {
                                  deleteRecurringMutation.mutate({
                                    id: rec.id,
                                    establishmentId: establishmentId!,
                                    deleteFutureExpenses: false,
                                  });
                                });
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <EmptyState
                icon={Repeat}
                title="Nenhuma despesa recorrente"
                description="Crie despesas recorrentes para automatizar lançamentos periódicos."
                action={{
                  label: "Criar recorrência",
                  onClick: () => {
                    setEditingExpense(null);
                    setExpenseModalOpen(true);
                  },
                }}
              />
            )}
          </>
        )}
        </div>{/* end card container */}
      </div>{/* end tabbed section wrapper */}

      {/* Modals */}
      {establishmentId && (
        <>
          <ExpenseModal
            open={expenseModalOpen}
            onOpenChange={setExpenseModalOpen}
            establishmentId={establishmentId}
            editingExpense={editingExpense}
            onSuccess={invalidateAll}
          />
          <CategoryManagerModal
            open={categoryModalOpen}
            onOpenChange={setCategoryModalOpen}
            establishmentId={establishmentId}
          />
          <RecurringEditModal
            open={recurringEditModalOpen}
            onOpenChange={setRecurringEditModalOpen}
            establishmentId={establishmentId!}
            recurring={editingRecurring}
            onSuccess={invalidateAll}
          />
          {/* Histórico de alterações modal */}
          <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
            <DialogContent
              className="max-w-lg p-0 overflow-hidden border-t-4 border-t-slate-500"
              style={{ borderRadius: '16px' }}
            >
              <DialogTitle className="sr-only">Histórico de alterações</DialogTitle>
              <div className="px-6 pt-5 pb-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2.5 rounded-xl flex-shrink-0 bg-slate-100 dark:bg-slate-950/50">
                    <History className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Histórico de alterações</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Veja as alterações feitas nesta despesa recorrente
                    </p>
                  </div>
                </div>
              <div className="max-h-[400px] overflow-y-auto">
                {recurringHistory && recurringHistory.length > 0 ? (
                  <div className="space-y-3">
                    {recurringHistory.map((entry: any) => (
                      <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="mt-0.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">{entry.field}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.changedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-sm">
                            <span className="text-red-500 line-through">{entry.oldValue || '(vazio)'}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-emerald-600 font-medium">{entry.newValue || '(vazio)'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma alteração registrada.</p>
                    <p className="text-xs mt-1">O histórico aparecerá quando você editar esta despesa recorrente.</p>
                  </div>
                )}
              </div>
              </div>
            </DialogContent>
          </Dialog>
          <GoalModal
            open={goalModalOpen}
            onOpenChange={setGoalModalOpen}
            establishmentId={establishmentId}
            currentGoal={goalTarget}
            month={currentMonth}
            year={currentYear}
          />
          <WeeklyGoalModal
            open={weeklyGoalModalOpen}
            onOpenChange={setWeeklyGoalModalOpen}
            establishmentId={establishmentId!}
            currentGoal={weeklyGoalTarget}
          />
          <CustomGoalModal
            open={customGoalModalOpen}
            onOpenChange={(v) => {
              setCustomGoalModalOpen(v);
              if (!v) setEditingCustomGoal(null);
            }}
            establishmentId={establishmentId}
            editingGoal={editingCustomGoal}
            month={currentMonth}
            year={currentYear}
            onCreateGoal={(data) => createCustomGoalMutation.mutate(data)}
            onUpdateGoal={(data) => updateCustomGoalMutation.mutate(data)}
            isCreating={createCustomGoalMutation.isPending}
            isUpdating={updateCustomGoalMutation.isPending}
          />

          {/* Diálogo de confirmação antes de marcar como pago */}
          <Dialog open={payConfirmOpen} onOpenChange={(v) => { setPayConfirmOpen(v); if (!v) setPayConfirmItem(null); }}>
            <DialogContent
              className="sm:max-w-[400px] p-0 overflow-hidden border-t-4 border-t-emerald-500"
              style={{ borderRadius: '16px' }}
            >
              <DialogTitle className="sr-only">Confirmar pagamento</DialogTitle>
              <div className="px-6 pt-5 pb-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2.5 rounded-xl flex-shrink-0 bg-emerald-100 dark:bg-emerald-950/50">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Confirmar pagamento</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Confirme os dados do pagamento
                    </p>
                  </div>
                </div>
              {payConfirmItem && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium">{payConfirmItem.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {payConfirmItem.categoryName || 'Sem categoria'} • {payConfirmItem.frequency === 'once' ? 'Avulso' : payConfirmItem.frequency === 'monthly' ? 'Mensal' : payConfirmItem.frequency === 'weekly' ? 'Semanal' : 'Anual'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={payConfirmAmount}
                        onChange={(e) => setPayConfirmAmount(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Data do pagamento</Label>
                      <Input
                        type="date"
                        value={payConfirmDate}
                        onChange={(e) => setPayConfirmDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}
                <Button
                  className="w-full rounded-xl h-10 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
                  disabled={markAsPaidMutation.isPending || !payConfirmAmount || !payConfirmDate}
                  onClick={() => {
                    if (!payConfirmItem || !payConfirmItem.categoryId) return;
                    markAsPaidMutation.mutate({
                      establishmentId: establishmentId!,
                      recurringId: payConfirmItem.recurringId,
                      frequency: payConfirmItem.frequency,
                      description: payConfirmItem.description,
                      categoryId: payConfirmItem.categoryId,
                      amount: payConfirmAmount,
                      paymentMethod: (payConfirmItem.paymentMethod as "cash" | "pix" | "card" | "transfer") || "cash",
                      dueDate: payConfirmDate,
                      type: payConfirmItem.type,
                    });
                  }}
                >
                  {markAsPaidMutation.isPending ? "Registrando..." : "Confirmar pagamento"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent
          className="p-0 overflow-hidden border-t-4 border-t-red-500"
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar exclusão do item</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Confirmar exclusão</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {deleteConfirmMessage}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel
                className="flex-1 rounded-xl h-10 font-semibold"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteConfirmAction(null);
                }}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                className="flex-1 rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white"
                onClick={() => {
                  deleteConfirmAction?.();
                  setDeleteConfirmOpen(false);
                  setDeleteConfirmAction(null);
                }}
              >
                Excluir
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminLayout>
  );
}
