import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadResult {
  url: string;
  path: string;
}

export function useImageUpload(bucket: string = "ocorrencias-fotos") {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (file: File): Promise<UploadResult | null> => {
    if (!file) return null;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são permitidas");
      return null;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 5MB)");
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      setProgress(30);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setProgress(70);

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setProgress(100);

      return {
        url: urlData.publicUrl,
        path: filePath,
      };
    } catch (error: any) {
      toast.error(`Erro no upload: ${error.message}`);
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const uploadMultiple = async (files: FileList): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const result = await uploadImage(files[i]);
      if (result) results.push(result);
    }
    
    return results;
  };

  const deleteImage = async (path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (error: any) {
      toast.error(`Erro ao excluir: ${error.message}`);
      return false;
    }
  };

  return {
    uploadImage,
    uploadMultiple,
    deleteImage,
    uploading,
    progress,
  };
}
