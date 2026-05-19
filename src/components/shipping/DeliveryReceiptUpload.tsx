import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, CheckCircle2, Loader2, Camera, Download, Eye, ShieldCheck, Search } from "lucide-react";
import { useAuth } from "@/hooks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DeliveryReceiptUploadProps {
  entregaId: string;
  onUploadSuccess?: (url: string) => void;
  currentUrl?: string | null;
}

export function DeliveryReceiptUpload({ entregaId, onUploadSuccess, currentUrl }: DeliveryReceiptUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const { user } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
          upload_status: 'failed',
          error_message: uploadError.message
        });
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // Audit log for success
      await supabase.from("delivery_receipt_audit").insert({
        delivery_id: entregaId,
        user_id: user?.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: filePath,
        upload_status: 'success',
        ocr_status: 'pending'
      });

      // Update basic info first
      const { error: updateError } = await supabase
        .from("entregas")
        .update({ 
          comprovante_entrega_url: publicUrl,
          comprovante_audit_info: { 
            uploaded_by: user?.id, 
            uploaded_at: new Date().toISOString(),
            original_name: file.name
          }
        })
        .eq("id", entregaId);

      if (updateError) throw updateError;

      setPreview(publicUrl);
      
      // Trigger OCR
      setIsProcessingOCR(true);
      toast.info("Processando OCR para extração de dados...");
      
      const { data: ocrResult, error: ocrError } = await supabase.functions.invoke('ocr-receipt-processor', {
        body: { storage_path: filePath, delivery_id: entregaId }
      });

      if (ocrError) {
        console.error("OCR Error:", ocrError);
        toast.warning("Comprovante enviado, mas houve erro no processamento OCR.");
      } else {
        toast.success("Dados extraídos via OCR com sucesso!");
      }

      onUploadSuccess?.(publicUrl);
      toast.success("Comprovante vinculado com sucesso!");
    } catch (error: any) {
      toast.error("Falha no protocolo de upload: " + error.message);
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
    } catch (error: any) {
      toast.error("Erro ao remover comprovante");
    }
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative group rounded-lg overflow-hidden border bg-muted/50 aspect-video flex items-center justify-center">
          {preview.toLowerCase().endsWith(".pdf") ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-12 h-12 text-primary" />
              <span className="text-xs font-medium">Comprovante PDF</span>
            </div>
          ) : (
            <img src={preview} alt="Comprovante" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" asChild>
              <a href={preview} target="_blank" rel="noreferrer">Visualizar</a>
            </Button>
            <Button size="sm" variant="destructive" onClick={removeReceipt}>Remover</Button>
          </div>
        </div>
      ) : (
        <label className={cn(
          "flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed transition-all cursor-pointer",
          isUploading ? "bg-muted animate-pulse border-muted-foreground/20" : "bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/40"
        )}>
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <span className="text-xs font-medium text-muted-foreground">Enviando...</span>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-primary/10 mb-2">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Upload Comprovante</span>
              <span className="text-[10px] text-muted-foreground mt-1">JPG, PNG ou PDF</span>
            </>
          )}
          <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} accept="image/*,application/pdf" />
        </label>
      )}
    </div>
  );
}
