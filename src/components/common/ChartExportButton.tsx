/**
 * Componente de Botão para Exportar Gráficos como PNG
 * 
 * @module components/common/ChartExportButton
 */

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image, Loader2, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChartExportButtonProps {
  /** ID do elemento DOM contendo o gráfico */
  chartContainerId?: string;
  /** Ref do container do gráfico */
  chartRef?: React.RefObject<HTMLDivElement>;
  /** Nome do arquivo exportado */
  fileName?: string;
  /** Qualidade da imagem (0-1) */
  quality?: number;
  /** Escala da imagem */
  scale?: number;
  /** Cor de fundo */
  backgroundColor?: string;
  /** Variante do botão */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  /** Tamanho do botão */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Classe CSS adicional */
  className?: string;
  /** Mostrar dropdown com opções */
  showOptions?: boolean;
}

export function ChartExportButton({
  chartContainerId,
  chartRef,
  fileName = 'chart',
  quality = 1,
  scale = 2,
  backgroundColor = '#0f1117',
  variant = 'ghost',
  size = 'icon',
  className,
  showOptions = false,
}: ChartExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const exportChart = useCallback(async (format: 'png' | 'jpeg' | 'svg' = 'png') => {
    setIsExporting(true);
    setIsSuccess(false);

    try {
      // Encontrar o elemento do gráfico
      let element: HTMLElement | null = null;
      
      if (chartRef?.current) {
        element = chartRef.current;
      } else if (chartContainerId) {
        element = document.getElementById(chartContainerId);
      }

      if (!element) {
        throw new Error('Elemento do gráfico não encontrado');
      }

      // Importar html2canvas dinamicamente
      const html2canvas = (await import('html2canvas')).default;

      // Capturar o elemento
      const canvas = await html2canvas(element, {
        backgroundColor,
        scale,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });

      // Converter para blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Falha ao criar blob'));
            }
          },
          format === 'jpeg' ? 'image/jpeg' : 'image/png',
          quality
        );
      });

      // Criar link de download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsSuccess(true);
      toast.success('Gráfico exportado com sucesso!');

      // Reset success state após 2 segundos
      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);

    } catch {
      toast.error('Erro ao exportar gráfico');
    } finally {
      setIsExporting(false);
    }
  }, [chartRef, chartContainerId, fileName, quality, scale, backgroundColor]);

  // Copiar para clipboard
  const copyToClipboard = useCallback(async () => {
    setIsExporting(true);

    try {
      let element: HTMLElement | null = null;
      
      if (chartRef?.current) {
        element = chartRef.current;
      } else if (chartContainerId) {
        element = document.getElementById(chartContainerId);
      }

      if (!element) {
        throw new Error('Elemento do gráfico não encontrado');
      }

      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(element, {
        backgroundColor,
        scale,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            toast.success('Gráfico copiado para a área de transferência!');
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 2000);
          } catch {
            toast.error('Erro ao copiar para a área de transferência');
          }
        }
      }, 'image/png');

    } catch {
      toast.error('Erro ao copiar gráfico');
    } finally {
      setIsExporting(false);
    }
  }, [chartRef, chartContainerId, backgroundColor, scale]);

  if (showOptions) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size} 
            className={cn('relative', className)}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSuccess ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => exportChart('png')}>
            <Image className="h-4 w-4 mr-2" />
            Exportar como PNG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportChart('jpeg')}>
            <Image className="h-4 w-4 mr-2" />
            Exportar como JPEG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyToClipboard}>
            <Download className="h-4 w-4 mr-2" />
            Copiar para clipboard
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={cn('relative', className)}
      onClick={() => exportChart('png')}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSuccess ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
}

export default ChartExportButton;
