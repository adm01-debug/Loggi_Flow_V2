/* eslint-disable max-lines */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Users,
  MapPin,
  ListOrdered,
  Plus,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  capabilityReason,
  isActionAvailable,
} from "@/lib/rodonaves/capabilities";
import {
  extractFallbackNotice,
  fallbackNoticeMessage,
  isBlockedResponse,
} from "@/lib/rodonaves/fallbackNotice";

type Row = Record<string, unknown>;

function extractRows(data: { data?: unknown }): Row[] {
  // Bloqueio sem alternativa liberada não é registro: devolver a linha do
  // marcador (`_status`/`_fallback`/`_note`) poluiria a tabela.
  if (isBlockedResponse(data)) return [];
  const raw = data?.data;
  if (Array.isArray(raw)) return raw as Row[];
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.Result)) return r.Result as Row[];
    return [r];
  }
  return [];
}

const str = (v: unknown) => (v == null ? "" : String(v));

/**
 * Coleta os endereços dentro de um payload de cliente: a consulta liberada
 * (`customer-get-by-taxid` / getbytaxidregistration) devolve o cadastro com a
 * lista de endereços aninhada, sem depender do endpoint `address-list` (403).
 */
function extractAddresses(source: unknown, depth = 0): Row[] {
  if (!source || depth > 4) return [];
  if (Array.isArray(source)) {
    return source.flatMap((item) => {
      if (
        item &&
        typeof item === "object" &&
        ("ZipCode" in item || "Street" in item)
      ) {
        return [item as Row];
      }
      return extractAddresses(item, depth + 1);
    });
  }
  if (typeof source === "object") {
    return Object.entries(source as Record<string, unknown>)
      .filter(([key]) => /address|endereco/i.test(key))
      .flatMap(([, value]) => extractAddresses(value, depth + 1));
  }
  return [];
}

interface NewAddressFormData {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  cityName: string;
  stateAbbreviation: string;
  zipCode: string;
}

function NewAddressForm({
  loading,
  onSave,
  onCancel,
}: {
  loading: boolean;
  onSave: (address: NewAddressFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [cityName, setCityName] = useState("");
  const [stateAbbreviation, setStateAbbreviation] = useState("");
  const [zipCode, setZipCode] = useState("");

  const submit = async () => {
    if (!street.trim() || !cityName.trim()) {
      toast.error("Logradouro e cidade são obrigatórios");
      return;
    }
    await onSave({
      street,
      number,
      complement,
      neighborhood,
      cityName,
      stateAbbreviation,
      zipCode,
    });
  };

  return (
    <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Novo endereço de entrega</Label>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Logradouro *</Label>
          <Input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Rua, Avenida..."
          />
        </div>
        <div>
          <Label>Número</Label>
          <Input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="S/N"
          />
        </div>
        <div>
          <Label>Complemento</Label>
          <Input
            value={complement}
            onChange={(e) => setComplement(e.target.value)}
            placeholder="Sala, andar..."
          />
        </div>
        <div>
          <Label>Bairro</Label>
          <Input
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
          />
        </div>
        <div>
          <Label>Cidade *</Label>
          <Input
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
          />
        </div>
        <div>
          <Label>UF</Label>
          <Input
            value={stateAbbreviation}
            onChange={(e) => setStateAbbreviation(e.target.value.toUpperCase())}
            maxLength={2}
            placeholder="SP"
          />
        </div>
        <div>
          <Label>CEP</Label>
          <Input
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="00000-000"
          />
        </div>
      </div>
      <Button onClick={submit} disabled={loading} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Salvar Endereço
      </Button>
    </div>
  );
}

export function RTECustomerManager() {
  const [searchKey, setSearchKey] = useState("");
  const [searchTaxId, setSearchTaxId] = useState("");
  const [searchById, setSearchById] = useState("");
  const [listDate, setListDate] = useState("");
  const [listPage, setListPage] = useState(1);
  const [addressTaxId, setAddressTaxId] = useState("");
  const [showNewAddress, setShowNewAddress] = useState(false);

  const [customers, setCustomers] = useState<Row[]>([]);
  const [addresses, setAddresses] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const blocked = (action: string) => !isActionAvailable(action);
  const reasonOf = (action: string) => capabilityReason(action) ?? undefined;

  const invoke = async (action: string, body: Record<string, unknown>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("rodonaves-api", {
        body: { action, ...body },
      });
      if (error) throw error;
      if (!data?.success)
        throw new Error(str(data?.error) || "Erro na API Rodonaves");

      const notice = extractFallbackNotice(data);
      if (notice) {
        // Sem alternativa liberada não existe dado a exibir: o payload de
        // bloqueio do gateway não pode ser tratado como resultado.
        if (isBlockedResponse(data)) {
          throw new Error(fallbackNoticeMessage(notice));
        }
        toast.warning(fallbackNoticeMessage(notice), {
          id: `rte-fallback-${notice.route}`,
        });
      }
      return data;
    } catch (err) {
      toast.error(str(err instanceof Error ? err.message : err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const trimmedKey = searchKey.trim();
    const trimmedTaxId = searchTaxId.replace(/\D/g, "");
    if (!trimmedKey && !trimmedTaxId) {
      toast.error("Informe nome/razão social ou CNPJ/CPF");
      return;
    }
    const data = trimmedTaxId
      ? await invoke("customer-get-by-taxid", {
          taxIdRegistration: trimmedTaxId,
        })
      : await invoke("customer-search", {
          key: trimmedKey,
          description: trimmedKey,
        });
    if (data) setCustomers(extractRows(data));
  };

  const handleSearchFull = async () => {
    const trimmedKey = searchKey.trim();
    if (!trimmedKey) {
      toast.error("Informe nome/razão social");
      return;
    }
    const data = await invoke("customer-search-full", {
      key: trimmedKey,
      description: trimmedKey,
    });
    if (data) setCustomers(extractRows(data));
  };

  const handleSearchById = async () => {
    const id = parseInt(searchById, 10);
    if (!id) {
      toast.error("Informe o ID do cliente");
      return;
    }
    const data = await invoke("customer-get-by-id", { id });
    if (data) setCustomers(extractRows(data));
  };

  const handleList = async () => {
    if (!listDate) {
      toast.error("Informe a data de alteração");
      return;
    }
    const data = await invoke("customer-list", {
      lastChangedDate: listDate,
      page: listPage,
      amountByPage: 20,
    });
    if (data) setCustomers(extractRows(data));
  };

  const handleListAddresses = async () => {
    const taxId = addressTaxId.replace(/\D/g, "");
    if (taxId.length < 11) {
      toast.error("Informe um CNPJ/CPF válido");
      return;
    }
    // `address-list` responde 403 para o escopo do nosso JWT; os endereços
    // vêm do cadastro do cliente (rota liberada), que já os traz aninhados.
    const useAddressList = isActionAvailable("address-list");
    const data = await invoke(
      useAddressList ? "address-list" : "customer-get-by-taxid",
      { taxIdRegistration: taxId },
    );
    if (!data) {
      setAddresses([]);
      return;
    }
    const rows = extractRows(data);
    setAddresses(useAddressList ? rows : extractAddresses(rows));
  };

  const handleSaveAddress = async (address: Omit<NewAddressFormData, "">) => {
    const taxId = addressTaxId.replace(/\D/g, "");
    if (taxId.length < 11) {
      toast.error("Informe um CNPJ/CPF válido");
      return;
    }
    const data = await invoke("address-create", {
      body: {
        TaxIdRegistration: taxId,
        AddressType: "ENTRG",
        Street: address.street.trim(),
        Number: address.number.trim(),
        Complement: address.complement.trim(),
        Neighborhood: address.neighborhood.trim(),
        CityName: address.cityName.trim(),
        StateAbbreviation: address.stateAbbreviation.trim().toUpperCase(),
        ZipCode: address.zipCode.replace(/\D/g, ""),
      },
    });
    if (data) {
      toast.success("Endereço criado na RTE!");
      setShowNewAddress(false);
      handleListAddresses();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Gestão de Clientes Rodonaves
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Consulta por CNPJ/CPF liberada pela RTE. Busca por nome, busca por
            ID, listagem de clientes e cadastro de endereço respondem 403; os
            endereços são lidos junto do cadastro do cliente por CNPJ.
          </span>
        </div>
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">
              <Search className="w-3 h-3 mr-1" />
              Buscar
            </TabsTrigger>
            <TabsTrigger value="list">
              <ListOrdered className="w-3 h-3 mr-1" />
              Listar
            </TabsTrigger>
            <TabsTrigger value="addresses">
              <MapPin className="w-3 h-3 mr-1" />
              Endereços
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome/Razão Social</Label>
                <Input
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                  placeholder="Buscar por nome..."
                />
              </div>
              <div>
                <Label>CNPJ/CPF</Label>
                <Input
                  value={searchTaxId}
                  onChange={(e) => setSearchTaxId(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleSearch}
                disabled={
                  loading ||
                  (!searchTaxId.replace(/\D/g, "") && blocked("customer-search"))
                }
                title={reasonOf("customer-search")}
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
              <Button
                variant="outline"
                onClick={handleSearchFull}
                disabled={loading || blocked("customer-search-full")}
                title={reasonOf("customer-search-full")}
              >
                <Users className="w-4 h-4 mr-2" />
                Busca Completa
              </Button>
            </div>
            <div className="flex gap-2 items-end border-t pt-3">
              <div className="w-40">
                <Label>ID do Cliente</Label>
                <Input
                  value={searchById}
                  onChange={(e) => setSearchById(e.target.value)}
                  type="number"
                  placeholder="Ex: 12345"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSearchById}
                disabled={loading || blocked("customer-get-by-id")}
                title={reasonOf("customer-get-by-id")}
              >
                <Search className="w-3 h-3 mr-1" />
                Buscar por ID
              </Button>
            </div>
            {customers.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {customers.map((c, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border bg-card text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {str(c.Name || c.name || "N/A")}
                      </span>
                      {Boolean(c.PersonId) && (
                        <Badge variant="outline">ID: {str(c.PersonId)}</Badge>
                      )}
                    </div>
                    {Boolean(c.TradeName) && (
                      <p className="text-xs text-muted-foreground">
                        Fantasia: {str(c.TradeName)}
                      </p>
                    )}
                    {Boolean(c.TaxIdRegistration) && (
                      <p className="text-xs text-muted-foreground">
                        CNPJ: {str(c.TaxIdRegistration)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Alterados desde *</Label>
                <Input
                  type="date"
                  value={listDate}
                  onChange={(e) => setListDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Página</Label>
                <Input
                  type="number"
                  value={listPage}
                  onChange={(e) => setListPage(parseInt(e.target.value) || 1)}
                  min={1}
                />
              </div>
            </div>
            <Button
              onClick={handleList}
              disabled={loading || blocked("customer-list")}
              title={reasonOf("customer-list")}
            >
              <ListOrdered className="w-4 h-4 mr-2" />
              Listar Clientes
            </Button>
            {blocked("customer-list") && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {reasonOf("customer-list")}
              </p>
            )}
          </TabsContent>

          <TabsContent value="addresses" className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>CNPJ/CPF do Cliente *</Label>
                <Input
                  value={addressTaxId}
                  onChange={(e) => setAddressTaxId(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <Button onClick={handleListAddresses} disabled={loading}>
                <MapPin className="w-4 h-4 mr-2" />
                Buscar Endereços
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNewAddress(true)}
                disabled={loading || blocked("address-create")}
                title={reasonOf("address-create")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo
              </Button>
            </div>

            {showNewAddress && (
              <NewAddressForm
                loading={loading}
                onSave={handleSaveAddress}
                onCancel={() => setShowNewAddress(false)}
              />
            )}

            {addresses.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {addresses.map((addr, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border bg-card text-sm flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">
                        {str(addr.Street || "Logradouro N/D")},{" "}
                        {str(addr.Number || "S/N")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {str(addr.CityName)} - {str(addr.StateAbbreviation)}
                      </p>
                    </div>
                    <Badge variant="secondary">{str(addr.ZipCode)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
