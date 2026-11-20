import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, MapPin, ListOrdered, Plus, X } from "lucide-react";
import { toast } from "sonner";

type Row = Record<string, unknown>;

function extractRows(data: { data?: unknown }): Row[] {
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

export function RTECustomerManager() {
  const [searchKey, setSearchKey] = useState("");
  const [searchTaxId, setSearchTaxId] = useState("");
  const [searchById, setSearchById] = useState("");
  const [listDate, setListDate] = useState("");
  const [listPage, setListPage] = useState(1);
  const [addressTaxId, setAddressTaxId] = useState("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    cityName: "",
    stateAbbreviation: "",
    zipCode: "",
  });

  const [customers, setCustomers] = useState<Row[]>([]);
  const [addresses, setAddresses] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const invoke = async (action: string, body: Record<string, unknown>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("rodonaves-api", {
        body: { action, ...body },
      });
      if (error) throw error;
      if (!data?.success)
        throw new Error(str(data?.error) || "Erro na API Rodonaves");
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
    const data = await invoke("address-list", { taxIdRegistration: taxId });
    if (data) {
      setAddresses(extractRows(data));
    } else {
      setAddresses([]);
    }
  };

  const handleCreateAddress = async () => {
    const taxId = addressTaxId.replace(/\D/g, "");
    if (taxId.length < 11) {
      toast.error("Informe um CNPJ/CPF válido");
      return;
    }
    if (!newAddress.street.trim() || !newAddress.cityName.trim()) {
      toast.error("Logradouro e cidade são obrigatórios");
      return;
    }
    const data = await invoke("address-create", {
      body: {
        TaxIdRegistration: taxId,
        AddressType: "ENTRG",
        Street: newAddress.street.trim(),
        Number: newAddress.number.trim(),
        Complement: newAddress.complement.trim(),
        Neighborhood: newAddress.neighborhood.trim(),
        CityName: newAddress.cityName.trim(),
        StateAbbreviation: newAddress.stateAbbreviation.trim().toUpperCase(),
        ZipCode: newAddress.zipCode.replace(/\D/g, ""),
      },
    });
    if (data) {
      toast.success("Endereço criado na RTE!");
      setShowNewAddress(false);
      setNewAddress({
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        cityName: "",
        stateAbbreviation: "",
        zipCode: "",
      });
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
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
              <Button
                variant="outline"
                onClick={handleSearchFull}
                disabled={loading}
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
                disabled={loading}
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
            <Button onClick={handleList} disabled={loading}>
              <ListOrdered className="w-4 h-4 mr-2" />
              Listar Clientes
            </Button>
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
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo
              </Button>
            </div>

            {showNewAddress && (
              <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Novo endereço de entrega
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewAddress(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Logradouro *</Label>
                    <Input
                      value={newAddress.street}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, street: e.target.value })
                      }
                      placeholder="Rua, Avenida..."
                    />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input
                      value={newAddress.number}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, number: e.target.value })
                      }
                      placeholder="S/N"
                    />
                  </div>
                  <div>
                    <Label>Complemento</Label>
                    <Input
                      value={newAddress.complement}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          complement: e.target.value,
                        })
                      }
                      placeholder="Sala, andar..."
                    />
                  </div>
                  <div>
                    <Label>Bairro</Label>
                    <Input
                      value={newAddress.neighborhood}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          neighborhood: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Cidade *</Label>
                    <Input
                      value={newAddress.cityName}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          cityName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>UF</Label>
                    <Input
                      value={newAddress.stateAbbreviation}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          stateAbbreviation: e.target.value.toUpperCase(),
                        })
                      }
                      maxLength={2}
                      placeholder="SP"
                    />
                  </div>
                  <div>
                    <Label>CEP</Label>
                    <Input
                      value={newAddress.zipCode}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          zipCode: e.target.value,
                        })
                      }
                      placeholder="00000-000"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateAddress}
                  disabled={loading}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Salvar Endereço
                </Button>
              </div>
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
