import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseDocumentUploadOptions {
  bucket?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

/**
 * Hook for uploading documents (comprovantes, NFs) to Supabase Storage.
 */
export function useDocumentUpload(options: UseDocumentUploadOptions = {}) {
  const {
    bucket = "documents",
    maxSizeMB = 10,
    allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async (file: File, folder: string): Promise<string | null> => {
      // Validate size
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
        return null;
      }

      // Validate type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        toast.error("Tipo de arquivo não permitido. Use PDF, JPG ou PNG.");
        return null;
      }

      setIsUploading(true);
      setProgress(0);

      try {
        const ext = file.name.split(".").pop() || "pdf";
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        setProgress(30);

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        setProgress(80);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        setProgress(100);
        toast.success("Arquivo enviado com sucesso!");
        return urlData.publicUrl;
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("Erro ao enviar arquivo.");
        return null;
      } finally {
        setIsUploading(false);
        setTimeout(() => setProgress(0), 1000);
      }
    },
    [bucket, maxSizeMB, allowedTypes]
  );

  const remove = useCallback(
    async (filePath: string): Promise<boolean> => {
      try {
        // Extract path from full URL
        const pathMatch = filePath.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
        const storagePath = pathMatch ? pathMatch[1] : filePath;

        const { error } = await supabase.storage.from(bucket).remove([storagePath]);
        if (error) throw error;
        toast.success("Arquivo removido.");
        return true;
      } catch (err) {
        console.error("Remove error:", err);
        toast.error("Erro ao remover arquivo.");
        return false;
      }
    },
    [bucket]
  );

  return { upload, remove, isUploading, progress };
}
