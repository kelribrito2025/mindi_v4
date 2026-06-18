import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { compressImage } from "@/lib/imageCompression";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Bug, Lightbulb, Send, Loader2, ImagePlus, X, MessageSquarePlus, Info, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 7;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const feedbackTypes = [
  {
    value: "bug" as const,
    label: "Problema",
    icon: Bug,
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-950/50",
    borderColor: "border-red-500",
    description: "Algo não está funcionando como deveria",
  },
  {
    value: "suggestion" as const,
    label: "Sugestão",
    icon: Lightbulb,
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-950/50",
    borderColor: "border-amber-500",
    description: "Ideia para melhorar a plataforma",
  },
  {
    value: "praise" as const,
    label: "Elogio",
    icon: ThumbsUp,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-950/50",
    borderColor: "border-green-500",
    description: "Algo que gostou na plataforma",
  },
];

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId?: number;
  establishmentName?: string;
}

export function FeedbackModal({ open, onOpenChange, establishmentId, establishmentName }: FeedbackModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<"bug" | "suggestion" | "praise">("suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImageMutation = trpc.upload.image.useMutation();

  const submitMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      toast.success("Feedback enviado com sucesso!", {
        description: "Agradecemos pela sua contribuição. Vamos analisar em breve.",
      });
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro ao enviar feedback", {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setType("suggestion");
    setSubject("");
    setMessage("");
    photos.forEach(p => URL.revokeObjectURL(p.preview));
    setPhotos([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(`Máximo de ${MAX_PHOTOS} fotos permitido`);
      return;
    }

    const newPhotos: { file: File; preview: string }[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" excede 5MB. Escolha uma imagem menor.`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" não é uma imagem válida.`);
        continue;
      }
      newPhotos.push({ file, preview: URL.createObjectURL(file) });
    }

    if (files.length > remaining) {
      toast.info(`Apenas ${remaining} foto(s) adicionada(s). Limite: ${MAX_PHOTOS}`);
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setUploading(true);
    try {
      // Upload das fotos primeiro
      const imageUrls: string[] = [];
      for (const photo of photos) {
        const compressed = await compressImage(photo.file);
        const result = await uploadImageMutation.mutateAsync({
          base64: compressed.base64,
          mimeType: compressed.mimeType,
          folder: "feedback",
          singleVersion: true,
        });
        imageUrls.push(result.url);
      }

      // Enviar feedback
      await submitMutation.mutateAsync({
        type,
        subject: subject.trim(),
        message: message.trim(),
        imageUrls,
        establishmentId,
        page: window.location.pathname,
      });
    } catch {
      // Erro já tratado nos onError das mutations
    } finally {
      setUploading(false);
    }
  };

  const selectedType = feedbackTypes.find(t => t.value === type)!;
  const isSubmitting = uploading || submitMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isSubmitting) onOpenChange(v); }}>
      <DialogContent
        className={cn(
          "sm:max-w-md p-0 overflow-hidden border-t-4",
          type === "bug" ? "border-t-red-500" : type === "praise" ? "border-t-green-500" : "border-t-amber-500",
        )}
        style={{ borderRadius: '16px' }}
      >
        <DialogTitle className="sr-only">Enviar Feedback</DialogTitle>
        <div className="px-6 pt-5 pb-6">
          {/* Header com ícone - estilo do modal de aceitar pedido */}
          <div className="flex items-start gap-3 mb-4">
            <div className={cn("p-2.5 rounded-xl flex-shrink-0", selectedType.bgColor)}>
              <MessageSquarePlus className={cn("h-6 w-6", selectedType.color)} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Enviar Feedback</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Relate um problema, sugira melhorias ou envie um elogio. Sua opinião é muito importante.
              </p>
            </div>
          </div>

          {/* Tipo de feedback - 3 botões lado a lado */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {feedbackTypes.map((ft) => {
              const Icon = ft.icon;
              const isSelected = type === ft.value;
              return (
                <button
                  key={ft.value}
                  type="button"
                  onClick={() => setType(ft.value)}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl border-2 transition-colors text-left",
                    isSelected
                      ? `${ft.bgColor} ${ft.borderColor} shadow-sm`
                      : "border-border/50 hover:border-border hover:bg-muted/30"
                  )}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", isSelected ? ft.color : "text-muted-foreground")} />
                  <span className={cn("text-sm font-medium", isSelected ? "text-foreground" : "text-muted-foreground")}>
                    {ft.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Assunto */}
          <div className="mb-3">
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Assunto <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder={
                type === "bug"
                  ? "Ex: Erro ao salvar produto..."
                  : type === "praise"
                    ? "Ex: Adorei a nova funcionalidade..."
                    : "Ex: Adicionar filtro por data..."
              }
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={255}
              className="rounded-lg"
            />
          </div>

          {/* Mensagem */}
          <div className="mb-3">
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Descrição detalhada <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder={
                type === "bug"
                  ? "Descreva o problema: o que aconteceu, o que esperava, e os passos para reproduzir..."
                  : type === "praise"
                    ? "Conte o que gostou e como isso ajudou no seu dia a dia..."
                    : "Descreva sua sugestão: o que gostaria de ver melhorado e como isso ajudaria..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none rounded-lg"
            />
          </div>

          {/* Upload de fotos */}
          <div className="mb-4">
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Fotos <span className="text-muted-foreground font-normal">({photos.length}/{MAX_PHOTOS})</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-border shadow-sm">
                  <img loading="lazy" src={photo.preview} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-border/60 hover:border-border hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-0.5"
                >
                  <ImagePlus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground">Adicionar</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Info box - estilo do modal de aceitar pedido */}
          {user && (
            <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2.5 mb-5">
              <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                Enviando como <strong>{establishmentName || user.name || user.email}</strong>. Nosso time analisará seu feedback em breve.
              </p>
            </div>
          )}

          {/* Botão de envio principal - estilo do modal de aceitar pedido */}
          <Button
            className={cn(
              "w-full rounded-xl h-10 font-semibold",
              type === "bug"
                ? "bg-red-500 hover:bg-red-500 text-white"
                : type === "praise"
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-white",
            )}
            onClick={handleSubmit}
            disabled={isSubmitting || !subject.trim() || !message.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploading ? `Enviando fotos (${photos.length})...` : "Enviando..."}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Feedback
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper: convert File to base64 string (without data: prefix)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove "data:image/...;base64," prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
