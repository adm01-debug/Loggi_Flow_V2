import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  FileText,
  Loader2,
  Camera,
  Download,
  Eye,
  ShieldCheck,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { getSignedDocumentUrl } from "@/services/api/storageService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DeliveryReceiptUploadProps {
  entregaId: string;
  onUploadSuccess?: (url: string) => void;
  currentUrl?: string | null;
}

export function DeliveryReceiptUpload({
  entregaId,
  onUploadSuccess,
  currentUrl,
}: DeliveryReceiptUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const { user } = useAuth();

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf";
    if (!isImage && !isPDF) {
      toast.error("Apenas imagens (JPG, PNG) ou PDFs são permitidos");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${entregaId}_${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) {
        await supabase.from("delivery_receipt_audit").insert({
          delivery_id: entregaId,
          user_id: user?.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: filePath,
          upload_status: "failed",
          error_message: uploadError.message,
        });
        throw uploadError;
      }

      // `documents` e bucket privado (migration 20260314181509): getPublicUrl
      // gravava no banco uma URL que responde 400 e o comprovante nunca abria.
      const publicUrl = await getSignedDocumentUrl(filePath, 60 * 60 * 24 * 365);
      if (!publicUrl) throw new Error("Falha ao gerar URL do comprovante");

      // Audit log for success
      await supabase.from("delivery_receipt_audit").insert({
        delivery_id: entregaId,
        user_id: user?.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: filePath,
        upload_status: "success",
        ocr_status: "pending",
      });

      // Update basic info first
      const { error: updateError } = await supabase
        .from("entregas")
        .update({
          comprovante_entrega_url: publicUrl,
          comprovante_audit_info: {
            uploaded_by: user?.id,
            uploaded_at: new Date().toISOString(),
            original_name: file.name,
          },
        })
        .eq("id", entregaId);

      if (updateError) throw updateError;

      setPreview(publicUrl);

      // Trigger OCR
      setIsProcessingOCR(true);
      toast.info("Processando OCR para extração de dados...");

      const { error: ocrError } =
        await supabase.functions.invoke("ocr-receipt-processor", {
          body: { storage_path: filePath, delivery_id: entregaId },
        });

      if (ocrError) {
        console.error("OCR Error:", ocrError);
        toast.warning(
          "Comprovante enviado, mas houve erro no processamento OCR.",
        );
      } else {
        toast.success("Dados extraídos via OCR com sucesso!");
      }

      onUploadSuccess?.(publicUrl);
      toast.success("Comprovante vinculado com sucesso!");
    } catch (error: unknown) {
      toast.error("Falha no protocolo de upload: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUploading(false);
      setIsProcessingOCR(false);
    }
  };

  const removeReceipt = async () => {
    try {
      const { error } = await supabase
        .from("entregas")
        .update({ comprovante_entrega_url: null })
        .eq("id", entregaId);

      if (error) throw error;
      setPreview(null);
      toast.success("Comprovante removido");
    } catch {
      toast.error("Erro ao remover comprovante");
    }
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="space-y-4">
          <div className="relative group rounded-[2rem] overflow-hidden border-2 border-white/5 bg-black/40 aspect-video flex items-center justify-center shadow-2xl backdrop-blur-xl">
            {preview.toLowerCase().endsWith(".pdf") ? (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <FileText className="w-12 h-12 text-primary" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
                  Digital_Vault_PDF
                </span>
              </div>
            ) : (
              <img
                src={preview}
                alt="Comprovante"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            )}

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
              <Button
                size="sm"
                variant="secondary"
                className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-2"
                asChild
              >
                <a href={preview} target="_blank" rel="noopener noreferrer">
                  <Eye className="w-3.5 h-3.5" /> Visualizar
                </a>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-2"
                asChild
              >
                <a
                  href={preview}
                  download={`comprovante_${entregaId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="w-3.5 h-3.5" /> Salvar
                </a>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-2"
                onClick={removeReceipt}
              >
                <X className="w-3.5 h-3.5" /> Remover
              </Button>
            </div>

            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-success/20 border border-success/30 backdrop-blur-md flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-success" />
                <span className="text-[8px] font-black text-success uppercase tracking-widest">
                  Verificado_Nexus
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Search className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">
                    Status OCR
                  </p>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">
                    {isProcessingOCR
                      ? "Processando_IA..."
                      : "Extração_Completa"}
                  </p>
                </div>
              </div>
              {isProcessingOCR && (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              )}
            </div>
          </div>
        </div>
      ) : (
        <label
          className={cn(
            "flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed transition-all cursor-pointer",
            isUploading
              ? "bg-muted animate-pulse border-muted-foreground/20"
              : "bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/40",
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <span className="text-xs font-medium text-muted-foreground">
                Enviando...
              </span>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-primary/10 mb-2">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Upload Comprovante
              </span>
              <span className="text-[10px] text-muted-foreground mt-1">
                JPG, PNG ou PDF
              </span>
            </>
          )}
          <input
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
            accept="image/*,application/pdf"
          />
        </label>
      )}
    </div>
  );
}
