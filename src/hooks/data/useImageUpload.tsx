import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadResult {
  url: string;
  path: string;
}

interface UploadOptions {
  /** Sub-folder within the bucket, e.g. the user id. Enforced by RLS for private buckets. */
  pathPrefix?: string;
  /** If true, return a signed URL (365 days) instead of the public URL. Required for private buckets. */
  signed?: boolean;
  /** TTL of the signed URL in seconds (default 1 year). */
  signedExpiresIn?: number;
}

async function resizeImage(file: File, maxWidth: number = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas to Blob failed"));
          },
          "image/jpeg",
          0.85,
        );
      };
    };
    reader.onerror = (e) => reject(e);
  });
}

export function useImageUpload(bucket: string = "ocorrencias-fotos") {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (
    file: File,
    options: UploadOptions = {},
  ): Promise<UploadResult | null> => {
    if (!file) return null;
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são permitidas");
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      const resizedBlob = await resizeImage(file);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = options.pathPrefix
        ? `${options.pathPrefix.replace(/\/+$/, "")}/${fileName}`
        : fileName;

      setProgress(40);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, resizedBlob, {
          cacheControl: "3600",
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;
      setProgress(80);

      let url: string;
      if (options.signed) {
        const { data: signed, error: signErr } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, options.signedExpiresIn ?? 60 * 60 * 24 * 365);
        if (signErr || !signed) throw signErr ?? new Error("Falha ao gerar URL assinada");
        url = signed.signedUrl;
      } else {
        url = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
      }
      setProgress(100);

      return { url, path: filePath };
    } catch (error) {
      toast.error(`Erro no upload: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const uploadMultiple = async (
    files: FileList,
    options: UploadOptions = {},
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    for (let i = 0; i < files.length; i++) {
      const result = await uploadImage(files[i], options);
      if (result) results.push(result);
    }
    return results;
  };

  const deleteImage = async (path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw error;
      return true;
    } catch {
      toast.error("Erro ao excluir imagem");
      return false;
    }
  };

  /** Gera uma URL assinada nova para um path existente (para renovar links expirados). */
  const refreshSignedUrl = async (
    path: string,
    expiresIn: number = 60 * 60 * 24 * 365,
  ): Promise<string | null> => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error || !data) return null;
    return data.signedUrl;
  };

  return { uploadImage, uploadMultiple, deleteImage, refreshSignedUrl, uploading, progress };
}
