import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { matchesMagicBytes } from "@/lib/fileSignature";
import { toast } from "sonner";

interface UseDocumentUploadOptions {
  bucket?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

/**
 * Hook for uploading documents (comprovantes, NFs) to Supabase Storage.
 * Includes magic-byte validation for security (Dimension 19).
 */
export function useDocumentUpload(options: UseDocumentUploadOptions = {}) {
  const {
    bucket = "documents",
    maxSizeMB = 10,
    allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancela o reset de progresso pendente ao desmontar
  useEffect(() => {
    return () => {
      if (progressResetTimerRef.current) clearTimeout(progressResetTimerRef.current);
    };
  }, []);

  // Magic byte validation for basic types
  const validateMagicBytes = async (file: File): Promise<boolean> => {
    const header = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = (e) => {
        const arr = (new Uint8Array(e.target?.result as ArrayBuffer)).subarray(0, 4);
        let header = "";
        for (let i = 0; i < arr.length; i++) {
          header += arr[i].toString(16);
        }
        resolve(header.toUpperCase());
      };
      reader.readAsArrayBuffer(file.slice(0, 4));
    });

    return matchesMagicBytes(header, file.type);
  };

  const upload = useCallback(
    async (file: File, folder: string): Promise<string | null> => {
      // Validate size
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
        return null;
      }

      // Validate type (MIME)
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        toast.error("Tipo de arquivo não permitido. Use PDF, JPG ou PNG.");
        return null;
      }

      // Validate Magic Bytes (Security)
      const isValid = await validateMagicBytes(file);
      if (!isValid) {
        toast.error("Assinatura de arquivo inválida. O arquivo pode estar corrompido ou falsificado.");
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

        // Buckets do projeto sao privados (migration 20260515134237), entao
        // getPublicUrl devolveria uma URL que responde 400 "Bucket not found".
        const { data: urlData, error: urlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(data.path, 60 * 60 * 24 * 365);

        if (urlError || !urlData) throw urlError ?? new Error("Falha ao gerar URL assinada");

        setProgress(100);
        toast.success("Arquivo enviado com sucesso!");
        return urlData.signedUrl;
      } catch {
        toast.error("Erro ao enviar arquivo.");
        return null;
      } finally {
        setIsUploading(false);
        if (progressResetTimerRef.current) clearTimeout(progressResetTimerRef.current);
        progressResetTimerRef.current = setTimeout(() => setProgress(0), 1000);
      }
    },
    [bucket, maxSizeMB, allowedTypes]
  );

  const remove = useCallback(
    async (filePath: string): Promise<boolean> => {
      try {
        // Extract path from full URL
        const pathMatch = filePath.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/([^?]+)/);
        const storagePath = pathMatch ? pathMatch[1] : filePath;

        const { error } = await supabase.storage.from(bucket).remove([storagePath]);
        if (error) throw error;
        toast.success("Arquivo removido.");
        return true;
      } catch {
        toast.error("Erro ao remover arquivo.");
        return false;
      }
    },
    [bucket]
  );

  return { upload, remove, isUploading, progress };
}
