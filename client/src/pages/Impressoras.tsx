import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, SectionCard } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Printer, Plus, Pencil, Trash2, Wifi, WifiOff, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface PrinterFormData {
  name: string;
  ipAddress: string;
  port: number;
  isActive: boolean;
}

export default function Impressoras() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Get establishment
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const establishmentId = establishment?.id;

  // Fetch printers
  const { data: printers, isLoading } = trpc.printer.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Mutations
  const createMutation = trpc.printer.create.useMutation({
    onSuccess: () => {
      toast.success("Impressora adicionada com sucesso");
      utils.printer.list.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar impressora");
      console.error(error);
    },
  });

  const updateMutation = trpc.printer.update.useMutation({
    onSuccess: () => {
      toast.success("Impressora atualizada com sucesso");
      utils.printer.list.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar impressora");
      console.error(error);
    },
  });

  const deleteMutation = trpc.printer.delete.useMutation({
    onSuccess: () => {
      toast.success("Impressora removida com sucesso");
      utils.printer.list.invalidate();
      setDeletePrinterId(null);
    },
    onError: (error) => {
      toast.error("Erro ao remover impressora");
      console.error(error);
    },
  });

  // State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<any>(null);
  const [deletePrinterId, setDeletePrinterId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PrinterFormData>({
    name: "",
    ipAddress: "",
    port: 9100,
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      ipAddress: "",
      port: 9100,
      isActive: true,
    });
    setEditingPrinter(null);
  };

  const handleOpenDialog = (printer?: any) => {
    if (printer) {
      setEditingPrinter(printer);
      setFormData({
        name: printer.name,
        ipAddress: printer.ipAddress,
        port: printer.port,
        isActive: printer.isActive,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!establishmentId) return;

    if (!formData.name.trim()) {
      toast.error("Nome da impressora é obrigatório");
      return;
    }

    if (!formData.ipAddress.trim()) {
      toast.error("IP da impressora é obrigatório");
      return;
    }

    if (editingPrinter) {
      updateMutation.mutate({
        id: editingPrinter.id,
        ...formData,
      });
    } else {
      createMutation.mutate({
        establishmentId,
        ...formData,
      });
    }
  };

  const handleDelete = () => {
    if (deletePrinterId) {
      deleteMutation.mutate({ id: deletePrinterId });
    }
  };

  const handleToggleActive = (printer: any) => {
    updateMutation.mutate({
      id: printer.id,
      isActive: !printer.isActive,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Impressoras / Setores"
          description="Configure as impressoras térmicas para impressão automática de pedidos por setor"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/configuracoes")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Impressora
              </Button>
            </div>
          }
        />

        <SectionCard title="Impressoras Cadastradas">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando impressoras...
            </div>
          ) : !printers || printers.length === 0 ? (
            <div className="text-center py-8">
              <Printer className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhuma impressora cadastrada
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Impressora
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {printers.map((printer: any) => (
                <div
                  key={printer.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${printer.isActive ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                      {printer.isActive ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold">{printer.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {printer.ipAddress}:{printer.port}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Ativa</span>
                      <Switch
                        checked={printer.isActive}
                        onCheckedChange={() => handleToggleActive(printer)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(printer)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeletePrinterId(printer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Como Funciona">
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">1. Cadastre as impressoras:</strong> Adicione cada impressora térmica com seu nome (ex: "Cozinha", "Sushi Bar") e IP na rede local.
            </p>
            <p>
              <strong className="text-foreground">2. Configure os produtos:</strong> No cadastro de cada produto, selecione qual impressora/setor deve receber o item.
            </p>
            <p>
              <strong className="text-foreground">3. Impressão automática:</strong> Ao aceitar um pedido, o sistema separa os itens por setor e envia para cada impressora apenas os itens correspondentes.
            </p>
            <p>
              <strong className="text-foreground">Exemplo:</strong> Um pedido com "X-Burger" (Cozinha) e "Sashimi" (Sushi Bar) será dividido em dois recibos, cada um enviado para a impressora correta.
            </p>
          </div>
        </SectionCard>
      </div>

      {/* Dialog para adicionar/editar impressora */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="p-0 overflow-hidden border-t-4 border-t-primary"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">{editingPrinter ? "Editar Impressora" : "Nova Impressora"}</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Printer className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{editingPrinter ? "Editar Impressora" : "Nova Impressora"}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Configure os dados da impressora térmica
                </p>
              </div>
            </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Setor *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Cozinha, Sushi Bar, Bar"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="ipAddress">Endereço IP *</Label>
                <Input
                  id="ipAddress"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  placeholder="Ex: 192.168.68.100"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="port">Porta</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                  placeholder="9100"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Porta padrão para impressoras térmicas é 9100
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Impressora ativa</Label>
              </div>
            </div>
              <Button
                type="submit"
                className="w-full rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white mt-4"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingPrinter ? "Salvar" : "Adicionar"}
              </Button>
          </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deletePrinterId} onOpenChange={() => setDeletePrinterId(null)}>
        <AlertDialogContent
          className="p-0 overflow-hidden border-t-4 border-t-red-500"
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">Remover Impressora</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar remoção da impressora</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Remover Impressora</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Tem certeza que deseja remover esta impressora? Os produtos associados a ela não serão afetados, mas não terão mais um setor definido.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="flex-1 rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-500 text-white"
              >
                Remover
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
