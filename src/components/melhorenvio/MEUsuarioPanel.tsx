import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMelhorEnvio } from '@/hooks/useMelhorEnvio';
import { User, Wallet, MapPin, Loader2, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { MEUserInfo, MEBalance, MEAddress } from './types';

export function MEUsuarioPanel() {
  const { infoUsuario, enderecosUsuario, saldoUsuario, inserirSaldo } = useMelhorEnvio();
  const [showAddBalance, setShowAddBalance] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');

  const usuario = infoUsuario.data as MEUserInfo | undefined;
  const rawEnderecos = enderecosUsuario.data;
  const enderecos: MEAddress[] = Array.isArray((rawEnderecos as Record<string, unknown>)?.data)
    ? (rawEnderecos as Record<string, unknown>).data as MEAddress[]
    : Array.isArray(rawEnderecos)
      ? rawEnderecos as MEAddress[]
      : [];
  const saldo = saldoUsuario.data as MEBalance | undefined;

  const isLoading = infoUsuario.isLoading || enderecosUsuario.isLoading || saldoUsuario.isLoading;

  const handleInsertBalance = () => {
    const value = parseFloat(balanceAmount);
    if (isNaN(value) || value <= 0) return;
    inserirSaldo.mutate({ value } as Record<string, unknown>, {
      onSuccess: () => {
        setShowAddBalance(false);
        setBalanceAmount('');
      },
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Saldo na Carteira
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAddBalance(true)}>
            <PlusCircle className="w-4 h-4 mr-1" /> Adicionar Crédito
          </Button>
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
              {enderecos.map((end, i) => (
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

      <Dialog open={showAddBalance} onOpenChange={setShowAddBalance}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Adicionar Crédito à Carteira
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                placeholder="50.00"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                O valor será adicionado à sua carteira Melhor Envio via gateway de pagamento.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBalance(false)}>Cancelar</Button>
            <Button
              onClick={handleInsertBalance}
              disabled={inserirSaldo.isPending || !balanceAmount || parseFloat(balanceAmount) <= 0}
            >
              {inserirSaldo.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-1" />}
              Adicionar R$ {balanceAmount || '0,00'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
