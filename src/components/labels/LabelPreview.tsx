import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface LabelData {
  id: string;
  codigo: string;
  descricao: string;
  nfRemessa?: string;
  cliente?: string;
  destino?: string;
  dataDespacho?: string;
  volumes?: number;
  peso?: string;
  transportadora?: string;
  status?: string;
}

interface LabelPreviewProps {
  data: LabelData;
  showBorder?: boolean;
}

export function LabelPreview({ data, showBorder = true }: LabelPreviewProps) {
  const qrContent = `MAT:${data.codigo}|NF:${data.nfRemessa || ''}|ID:${data.id.substring(0, 8)}`;

  return (
    <div
      className={`bg-white text-black ${showBorder ? 'border-2 border-dashed border-muted-foreground/30' : ''}`}
      style={{ width: '10cm', height: '15cm', padding: '6mm', fontFamily: 'Arial, sans-serif' }}
    >
      {/* Header */}
      <div style={{ borderBottom: '2px solid #000', paddingBottom: '3mm', marginBottom: '3mm' }}>
        <div style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>
          Identificação de Material
        </div>
        <div style={{ fontSize: '8pt', textAlign: 'center', color: '#666' }}>
          Controle de Materiais e NF de Saída
        </div>
      </div>

      {/* QR Code + Code */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4mm', marginBottom: '4mm' }}>
        <QRCodeSVG
          value={qrContent}
          size={120}
          level="M"
          includeMargin={false}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '8pt', color: '#666', marginBottom: '1mm' }}>CÓDIGO</div>
          <div style={{ fontSize: '16pt', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '1px' }}>
            {data.codigo}
          </div>
          {data.nfRemessa && (
            <>
              <div style={{ fontSize: '8pt', color: '#666', marginTop: '2mm', marginBottom: '1mm' }}>NF REMESSA</div>
              <div style={{ fontSize: '12pt', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {data.nfRemessa}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div style={{ borderTop: '1px solid #ccc', borderBottom: '1px solid #ccc', padding: '3mm 0', marginBottom: '3mm' }}>
        <table style={{ width: '100%', fontSize: '9pt', borderCollapse: 'collapse' }}>
          <tbody>
            {data.descricao && (
              <tr>
                <td style={{ fontWeight: 'bold', padding: '1mm 2mm', width: '35%', verticalAlign: 'top' }}>Material:</td>
                <td style={{ padding: '1mm 2mm' }}>{data.descricao}</td>
              </tr>
            )}
            {data.cliente && (
              <tr>
                <td style={{ fontWeight: 'bold', padding: '1mm 2mm', verticalAlign: 'top' }}>Destinatário:</td>
                <td style={{ padding: '1mm 2mm' }}>{data.cliente}</td>
              </tr>
            )}
            {data.destino && (
              <tr>
                <td style={{ fontWeight: 'bold', padding: '1mm 2mm', verticalAlign: 'top' }}>Endereço:</td>
                <td style={{ padding: '1mm 2mm', fontSize: '8pt' }}>{data.destino}</td>
              </tr>
            )}
            {data.transportadora && (
              <tr>
                <td style={{ fontWeight: 'bold', padding: '1mm 2mm' }}>Transportadora:</td>
                <td style={{ padding: '1mm 2mm' }}>{data.transportadora}</td>
              </tr>
            )}
            {data.dataDespacho && (
              <tr>
                <td style={{ fontWeight: 'bold', padding: '1mm 2mm' }}>Data:</td>
                <td style={{ padding: '1mm 2mm' }}>
                  {format(new Date(data.dataDespacho), 'dd/MM/yyyy', { locale: ptBR })}
                </td>
              </tr>
            )}
            {data.status && (
              <tr>
                <td style={{ fontWeight: 'bold', padding: '1mm 2mm' }}>Status:</td>
                <td style={{ padding: '1mm 2mm', textTransform: 'uppercase', fontSize: '8pt' }}>{data.status}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ fontSize: '7pt', color: '#999', textAlign: 'center', marginTop: 'auto' }}>
        Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • ID: {data.id.substring(0, 8)}
      </div>
    </div>
  );
}
