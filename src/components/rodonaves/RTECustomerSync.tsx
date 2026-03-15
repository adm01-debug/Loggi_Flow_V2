import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useRodonavesTracking } from '@/hooks/useRodonavesTracking';
import { RefreshCw, Search, Loader2, Building2, User, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface RTECustomerSyncProps {
  cnpj?: string;
  razaoSocial?: string;
  onCustomerFound?: (data: Record<string, unknown>) => void;
}

export function RTECustomerSync({ cnpj, razaoSocial, onCustomerFound }: RTECustomerSyncProps) {
  const rte = useRodonavesTracking();
  const [open, setOpen] = useState(false);
  const [searchCnpj, setSearchCnpj] = useState(cnpj || '');
  const [searching, setSearching] = useState(false);

  const handleSearch = () => {
    if (!searchCnpj) { toast.error('Informe o CNPJ'); return; }
    setSearching(true);
    rte.getCustomerByTaxId({ taxIdRegistration: searchCnpj.replace(/\D/g, '') });
    setTimeout(() => setSearching(false), 2000);
  };

  const customerData = rte.customerSearchResult?.data || rte.customerResult?.data;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <RefreshCw className="w-3 h-3 mr-1" />Sync RTE
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Sincronizar com Rodonaves
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>CNPJ</Label>
                <Input value={searchCnpj} onChange={(e) => setSearchCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} disabled={searching} size="sm">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {customerData && (
              <div className="p-3 rounded-lg border bg-muted/30 space-y-2 text-sm">
                <div className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Dados Encontrados na RTE
                </div>
                <div className="space-y-1">
                  {customerData.Name && <div><span className="text-muted-foreground">Razão Social:</span> {customerData.Name}</div>}
                  {customerData.TradeName && <div><span className="text-muted-foreground">Nome Fantasia:</span> {customerData.TradeName}</div>}
                  {customerData.TaxIdRegistration && <div><span className="text-muted-foreground">CNPJ:</span> {customerData.TaxIdRegistration}</div>}
                  {customerData.PersonId && <Badge variant="outline">ID RTE: {customerData.PersonId}</Badge>}
                </div>
                {onCustomerFound && (
                  <Button size="sm" className="w-full mt-2" onClick={() => { onCustomerFound(customerData); setOpen(false); }}>
                    Importar Dados
                  </Button>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
