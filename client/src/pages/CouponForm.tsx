import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Ticket,
  Percent,
  DollarSign,
  Calendar,
  Clock,
  MapPin,
  Save,
  Loader2,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { capitalizeFirst } from "@/lib/utils";

const DAYS_OF_WEEK = [
  { id: "dom", label: "Dom" },
  { id: "seg", label: "Seg" },
  { id: "ter", label: "Ter" },
  { id: "qua", label: "Qua" },
  { id: "qui", label: "Qui" },
  { id: "sex", label: "Sex" },
  { id: "sab", label: "Sáb" },
];

const VALID_ORIGINS = [
  { id: "retirada", label: "Retirada" },
  { id: "delivery", label: "Delivery" },
  { id: "autoatendimento", label: "Autoatendimento" },
];

export default function CouponForm() {
  const [, navigate] = useLocation();
  const params = useParams();
  const couponId = params.id && params.id !== "novo" ? parseInt(params.id) : null;
  const isEditing = !!couponId;

  const utils = trpc.useUtils();

  // Form state
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [quantity, setQuantity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [validOrigins, setValidOrigins] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Get establishment
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();

  // Get coupon if editing
  const { data: coupon, isLoading: couponLoading } = trpc.coupon.get.useQuery(
    { id: couponId! },
    { enabled: !!couponId }
  );

  // Populate form when editing (apenas na primeira vez)
  useEffect(() => {
    if (coupon && !initialDataLoaded) {
      setCode(coupon.code);
      setType(coupon.type as "percentage" | "fixed");
      setValue(coupon.value);
      setMaxDiscount(coupon.maxDiscount || "");
      setMinOrderValue(coupon.minOrderValue || "");
      setQuantity(coupon.quantity?.toString() || "");
      setStartDate(coupon.startDate ? format(new Date(coupon.startDate), "yyyy-MM-dd") : "");
      setEndDate(coupon.endDate ? format(new Date(coupon.endDate), "yyyy-MM-dd") : "");
      setActiveDays(coupon.activeDays || []);
      setValidOrigins(coupon.validOrigins || []);
      setStartTime(coupon.startTime || "");
      setEndTime(coupon.endTime || "");
      setInitialDataLoaded(true);
    }
  }, [coupon, initialDataLoaded]);

  // Mutations
  const createMutation = trpc.coupon.create.useMutation({
    onSuccess: () => {
      utils.coupon.list.invalidate();
      toast.success("Cupom criado com sucesso!");
      navigate("/cupons");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar cupom");
    },
  });

  const updateMutation = trpc.coupon.update.useMutation({
    onSuccess: () => {
      utils.coupon.list.invalidate();
      toast.success("Cupom atualizado com sucesso!");
      navigate("/cupons");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar cupom");
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) {
      newErrors.code = "Código é obrigatório";
    } else if (code.length > 15) {
      newErrors.code = "Código deve ter no máximo 15 caracteres";
    }

    if (!value.trim()) {
      newErrors.value = "Valor é obrigatório";
    } else {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        newErrors.value = "Valor deve ser maior que zero";
      }
      if (type === "percentage" && numValue > 100) {
        newErrors.value = "Percentual não pode ser maior que 100%";
      }
    }

    if (maxDiscount && type === "percentage") {
      const numMax = parseFloat(maxDiscount);
      if (isNaN(numMax) || numMax < 0) {
        newErrors.maxDiscount = "Valor máximo inválido";
      }
    }

    if (minOrderValue) {
      const numMin = parseFloat(minOrderValue);
      if (isNaN(numMin) || numMin < 0) {
        newErrors.minOrderValue = "Valor mínimo inválido";
      }
    }

    if (quantity) {
      const numQty = parseInt(quantity);
      if (isNaN(numQty) || numQty < 1) {
        newErrors.quantity = "Quantidade deve ser maior que zero";
      }
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = "Data final deve ser após a data inicial";
    }

    if ((startTime && !endTime) || (!startTime && endTime)) {
      newErrors.startTime = "Preencha ambos os horários";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !establishment) return;

    const data = {
      establishmentId: establishment.id,
      code: code.toUpperCase(),
      type,
      value,
      maxDiscount: maxDiscount || null,
      minOrderValue: minOrderValue || null,
      quantity: quantity ? parseInt(quantity) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      activeDays: activeDays.length > 0 ? activeDays : null,
      validOrigins: validOrigins.length > 0 ? validOrigins : null,
      startTime: startTime || null,
      endTime: endTime || null,
    };

    if (isEditing && couponId) {
      updateMutation.mutate({ id: couponId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleDay = (day: string) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleOrigin = (origin: string) => {
    setValidOrigins((prev) =>
      prev.includes(origin) ? prev.filter((o) => o !== origin) : [...prev, origin]
    );
  };

  const isLoading = establishmentLoading || (isEditing && couponLoading);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-5">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cupons")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {isEditing ? "Editar Cupom" : "Criar Novo Cupom"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEditing ? "Atualize as informações do cupom" : "Configure um novo cupom de desconto"}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="h-4 w-4 text-red-500" />
                Informações do Cupom
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Code */}
              <div className="space-y-1.5">
                <Label htmlFor="code">Código do cupom</Label>
                <Input
                  id="code"
                  placeholder="Ex: SEGUNDAOFF10"
                  value={code}
                  onChange={(e) => setCode(capitalizeFirst(e.target.value.toUpperCase().replace(/\s/g, "")))}
                  maxLength={15}
                  className={errors.code ? "border-red-500" : ""}
                />
                <div className="flex justify-between">
                  {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
                  <p className="text-xs text-muted-foreground ml-auto">{code.length}/15</p>
                </div>
              </div>

              {/* Type Toggle */}
              <div className="space-y-1.5">
                <Label>Tipo do desconto</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={type === "percentage" ? "default" : "outline"}
                    className={type === "percentage" ? "bg-red-500 hover:bg-red-500" : ""}
                    onClick={() => setType("percentage")}
                  >
                    <Percent className="h-4 w-4 mr-1.5" />
                    Percentual (%)
                  </Button>
                  <Button
                    type="button"
                    variant={type === "fixed" ? "default" : "outline"}
                    className={type === "fixed" ? "bg-red-500 hover:bg-red-500" : ""}
                    onClick={() => setType("fixed")}
                  >
                    <DollarSign className="h-4 w-4 mr-1.5" />
                    Valor Fixo
                  </Button>
                </div>
              </div>

              {/* Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="value">
                    {type === "percentage" ? "Valor do desconto (%)" : "Valor do desconto (R$)"}
                  </Label>
                  <div className="relative">
                    {type === "fixed" && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    )}
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      min="0"
                      max={type === "percentage" ? "100" : undefined}
                      placeholder={type === "percentage" ? "10" : "10.00"}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className={`${type === "fixed" ? "pl-10" : ""} ${errors.value ? "border-red-500" : ""}`}
                    />
                    {type === "percentage" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    )}
                  </div>
                  {errors.value && <p className="text-xs text-red-500">{errors.value}</p>}
                </div>

                {type === "percentage" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="maxDiscount">Valor máximo do desconto (R$)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                      <Input
                        id="maxDiscount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="50.00"
                        value={maxDiscount}
                        onChange={(e) => setMaxDiscount(e.target.value)}
                        className={`pl-10 ${errors.maxDiscount ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.maxDiscount && <p className="text-xs text-red-500">{errors.maxDiscount}</p>}
                  </div>
                )}
              </div>

              {/* Min Order & Quantity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="minOrderValue">Valor mínimo do pedido (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    <Input
                      id="minOrderValue"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="30.00"
                      value={minOrderValue}
                      onChange={(e) => setMinOrderValue(e.target.value)}
                      className={`pl-10 ${errors.minOrderValue ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.minOrderValue && <p className="text-xs text-red-500">{errors.minOrderValue}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="quantity">Quantidade total de cupons</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="100"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className={errors.quantity ? "border-red-500" : ""}
                  />
                  {errors.quantity && <p className="text-xs text-red-500">{errors.quantity}</p>}
                  <p className="text-xs text-muted-foreground">Deixe em branco para ilimitado</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-500" />
                Disponibilidade
              </CardTitle>
              <CardDescription>Configure quando o cupom pode ser utilizado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range */}
              <div className="space-y-1.5">
                <Label>Período de validade</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate" className="text-xs text-muted-foreground">Data inicial</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="endDate" className="text-xs text-muted-foreground">Data final</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={errors.endDate ? "border-red-500" : ""}
                    />
                    {errors.endDate && <p className="text-xs text-red-500">{errors.endDate}</p>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Deixe em branco para sem limite de data</p>
              </div>

              {/* Days of Week */}
              <div className="space-y-1.5">
                <Label>Dias da semana</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.id}
                      type="button"
                      variant={activeDays.includes(day.id) ? "default" : "outline"}
                      size="sm"
                      className={activeDays.includes(day.id) ? "bg-red-500 hover:bg-red-500" : ""}
                      onClick={() => toggleDay(day.id)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Deixe em branco para todos os dias</p>
              </div>

              {/* Valid Origins */}
              <div className="space-y-1.5">
                <Label>Origem válida</Label>
                <div className="flex flex-wrap gap-2">
                  {VALID_ORIGINS.map((origin) => (
                    <Button
                      key={origin.id}
                      type="button"
                      variant={validOrigins.includes(origin.id) ? "default" : "outline"}
                      size="sm"
                      className={validOrigins.includes(origin.id) ? "bg-red-500 hover:bg-red-500" : ""}
                      onClick={() => toggleOrigin(origin.id)}
                    >
                      {origin.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Deixe em branco para todas as origens</p>
              </div>

              {/* Time Range */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Horário disponível
                </Label>
                <div className="grid grid-cols-2 gap-4 max-w-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="startTime" className="text-xs text-muted-foreground">Início</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={errors.startTime ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="endTime" className="text-xs text-muted-foreground">Fim</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                {errors.startTime && <p className="text-xs text-red-500">{errors.startTime}</p>}
                <p className="text-xs text-muted-foreground">Deixe em branco para qualquer horário</p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate("/cupons")}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-red-500 hover:bg-red-500"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  {isEditing ? "Salvar Alterações" : "Criar Cupom"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
