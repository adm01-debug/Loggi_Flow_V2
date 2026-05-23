import { useRef, useCallback } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDocumentUpload } from "@/hooks/data/useDocumentUpload";
import { cn } from "@/lib/utils";

interface DocumentUploadFieldProps {
  /** Current file URL */
  value?: string | null;
  /** Callback when file is uploaded or removed */
  onChange: (url: string | null) => void;
  /** Storage folder path */
  folder: string;
  /** Label text */
  label?: string;
  /** Accepted file types */
  accept?: string;
  className?: string;
}

/**
 * Reusable document upload field for comprovantes, NFs, etc.
 */
export function DocumentUploadField({
  value,
  onChange,
  folder,
  label = "Documento",
  accept = ".pdf,.jpg,.jpeg,.png",
  className,
}: DocumentUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, remove, isUploading, progress } = useDocumentUpload();

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await upload(file, folder);
      if (url) onChange(url);
      // Reset input
      if (inputRef.current) inputRef.current.value = "";
    },
    [upload, folder, onChange]
  );

  const handleRemove = useCallback(async () => {
    if (value) {
      const removed = await remove(value);
      if (removed) onChange(null);
    }
  }, [value, remove, onChange]);

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-foreground">{label}</p>

      {isUploading && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Enviando...
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {value ? (
        <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/50">
          <FileText className="w-4 h-4 text-primary flex-shrink-0" />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary underline truncate flex-1"
          >
            Ver documento
          </a>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRemove}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        !isUploading && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="w-3 h-3" />
            Enviar {label}
          </Button>
        )
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
