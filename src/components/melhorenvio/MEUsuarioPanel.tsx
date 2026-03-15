import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMelhorEnvio } from '@/hooks/useMelhorEnvio';
import { User, Wallet, MapPin, Loader2 } from 'lucide-react';

export function MEUsuarioPanel() {
  const { infoUsuario, enderecosUsuario, saldoUsuario } = useMelhorEnvio();

  const usuario = infoUsuario.data;
  const enderecos = Array.isArray(enderecosUsuario.data?.data) ? enderecosUsuario.data.data : 
                    Array.isArray(enderecosUsuario.data) ? enderecosUsuario.data : [];
  const saldo = saldoUsuario.data;

  const isLoading = infoUsuario.isLoading || enderecosUsuario.isLoading || saldoUsuario.isLoading;

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Info do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {usuario ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">{usuario.firstname} {usuario.lastname}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{usuario.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Documento:</span>
                <span className="font-mono text-sm">{usuario.document || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefone:</span>
                <span>{usuario.phone?.phone || '-'}</span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Dados não disponíveis</p>
          )}
        </CardContent>
      </Card>

      {/* Saldo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Saldo na Carteira
          </CardTitle>
        </CardHeader>
        <CardContent>
          {saldo ? (
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-primary">
                R$ {typeof saldo.balance === 'number' ? saldo.balance.toFixed(2) : saldo.balance || '0,00'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Saldo disponível para compras</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Saldo não disponível</p>
          )}
        </CardContent>
      </Card>

      {/* Endereços */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Endereços Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enderecos.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum endereço cadastrado</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enderecos.map((end: any, i: number) => (
                <div key={i} className="p-4 rounded-lg bg-muted/50 space-y-1">
                  <p className="font-medium">{end.label || `Endereço ${i + 1}`}</p>
                  <p className="text-sm">{end.address}, {end.number}</p>
                  {end.complement && <p className="text-sm text-muted-foreground">{end.complement}</p>}
                  <p className="text-sm">{end.district} - {end.city}/{end.state_abbr}</p>
                  <Badge variant="outline" className="font-mono">{end.postal_code}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
