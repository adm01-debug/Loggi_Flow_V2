import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Loader2 } from "lucide-react";

const ESTADOS_BRASIL = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

interface CotacaoSearchFormProps {
  origemEstado: string;
  setOrigemEstado: (v: string) => void;
  destinoEstado: string;
  setDestinoEstado: (v: string) => void;
  origemCidade: string;
  setOrigemCidade: (v: string) => void;
  destinoCidade: string;
  setDestinoCidade: (v: string) => void;
  origemCep: string;
  setOrigemCep: (v: string) => void;
  destinoCep: string;
  setDestinoCep: (v: string) => void;
  pesoKg: string;
  setPesoKg: (v: string) => void;
  volumes: string;
  setVolumes: (v: string) => void;
  valorMercadoria: string;
  setValorMercadoria: (v: string) => void;
  isSearching: boolean;
  onSearch: () => void;
}

export function CotacaoSearchForm(props: CotacaoSearchFormProps) {
  const { origemEstado, setOrigemEstado, destinoEstado, setDestinoEstado, origemCidade, setOrigemCidade, destinoCidade, setDestinoCidade, origemCep, setOrigemCep, destinoCep, setDestinoCep, pesoKg, setPesoKg, volumes, setVolumes, valorMercadoria, setValorMercadoria, isSearching, onSearch } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="w-5 h-5 text-primary" />
          Buscar Transportadoras por Trecho
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="w-4 h-4 text-success" /> ORIGEM
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>CEP</Label>
                <Input value={origemCep} onChange={e => setOrigemCep(e.target.value)} placeholder="00000-000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Estado</Label>
                  <Select value={origemEstado} onValueChange={setOrigemEstado}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>{ESTADOS_BRASIL.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cidade (opcional)</Label>
                  <Input value={origemCidade} onChange={e => setOrigemCidade(e.target.value)} placeholder="Ex: São Paulo" />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="w-4 h-4 text-destructive" /> DESTINO
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>CEP</Label>
                <Input value={destinoCep} onChange={e => setDestinoCep(e.target.value)} placeholder="00000-000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Estado</Label>
                  <Select value={destinoEstado} onValueChange={setDestinoEstado}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>{ESTADOS_BRASIL.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cidade (opcional)</Label>
                  <Input value={destinoCidade} onChange={e => setDestinoCidade(e.target.value)} placeholder="Ex: Recife" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Peso (kg)</Label>
            <Input type="number" value={pesoKg} onChange={e => setPesoKg(e.target.value)} placeholder="Ex: 15" />
          </div>
          <div>
            <Label>Volumes</Label>
            <Input type="number" value={volumes} onChange={e => setVolumes(e.target.value)} placeholder="1" />
          </div>
          <div>
            <Label>Valor Mercadoria (R$)</Label>
            <Input type="number" value={valorMercadoria} onChange={e => setValorMercadoria(e.target.value)} placeholder="1000" />
          </div>
        </div>
        <Button onClick={onSearch} disabled={isSearching} size="lg" className="w-full md:w-auto">
          {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
          Buscar Transportadoras
        </Button>
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { ESTADOS_BRASIL };
