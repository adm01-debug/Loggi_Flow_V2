import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadResult {
  url: string;
  path: string;
}

// Helper to resize image in client
async function resizeImage(file: File, maxWidth: number = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to Blob failed'));
        }, 'image/jpeg', 0.85); // 80% quality
      };
    };
    reader.onerror = (e) => reject(e);
  });
}

export function useImageUpload(bucket: string = "ocorrencias-fotos") {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (file: File): Promise<UploadResult | null> => {
    if (!file) return null;
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são permitidas");
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      const resizedBlob = await resizeImage(file);
      const fileExt = "jpg"; // We forced jpeg in resize
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      setProgress(40);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, resizedBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;
      setProgress(80);

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      setProgress(100);

      return { url: urlData.publicUrl, path: filePath };
    } catch (error) {
      toast.error(`Erro no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw error;
      return true;
    } catch (error) {
      toast.error("Erro ao excluir imagem");
      return false;
    }
  };

  return { uploadImage, uploadMultiple, deleteImage, uploading, progress };
}
