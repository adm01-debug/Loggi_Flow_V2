import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMelhorEnvio } from "@/hooks/logistics/useMelhorEnvio";
import {
  ShoppingCart,
  Trash2,
  CreditCard,
  Loader2,
  RefreshCw,
  RotateCcw,
  Eye,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { TableSkeleton } from "@/components/ui/skeletons";
import { MEDetailDialog } from "./MEDetailDialog";
import { MEErrorState } from "./MEErrorState";
import { MECepAutoFill } from "./MECepAutoFill";
import { MEFormField } from "./MEFormField";
import { usePagination } from "@/hooks/common/usePagination";
import { Pagination } from "@/components/common/Pagination";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { formatPhone } from "@/lib/validations";
import type { MECartItem } from "./types";

export function MECarrinhoPanel() {
  const {
    listarCarrinho,
    removerItemCarrinho,
    comprarFretes,
    inserirLogisticaReversa,
    exibirItemCarrinho,
  } = useMelhorEnvio();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showReverse, setShowReverse] = useState(false);
  const [itemDetail, setItemDetail] = useState<Record<string, unknown> | null>(
    null,
  );
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [reverseSubmitted, setReverseSubmitted] = useState(false);
  const [reverseErrors, setReverseErrors] = useState<Record<string, string>>(
    {},
  );

  const [reverseForm, setReverseForm] = useState({
    service: "",
    from_name: "",
    from_phone: "",
    from_document: "",
    from_postal_code: "",
    from_address: "",
    from_number: "",
    from_district: "",
    from_city: "",
    from_state_abbr: "",
    to_name: "",
    to_phone: "",
    to_document: "",
    to_postal_code: "",
    to_address: "",
    to_number: "",
    to_district: "",
    to_city: "",
    to_state_abbr: "",
    width: "20",
    height: "10",
    length: "30",
    weight: "1",
    insurance_value: "100",
  });

  const rawData = listarCarrinho.data;
  const rawDataObj = rawData as Record<string, unknown> | undefined;
  let items: MECartItem[] = [];
  if (Array.isArray(rawDataObj?.data)) {
    items = rawDataObj!.data as MECartItem[];
  } else if (Array.isArray(rawData)) {
    items = rawData as MECartItem[];
  }


  const pagination = usePagination(items, { initialPageSize: 10 });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    setSelectedIds(
      selectedIds.length === items.length ? [] : items.map((item) => item.id),
    );
  };

  const handleCheckout = () => {
    if (selectedIds.length === 0) return;
    comprarFretes.mutate(selectedIds);
  };

  const handleViewItem = (id: string) => {
    exibirItemCarrinho.mutate(id, {
      onSuccess: (data) => setItemDetail(data as Record<string, unknown>),
    });
  };

  const validateReverseForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!reverseForm.service.trim())
      errors["service"] = "ID do serviço é obrigatório";
    if (!reverseForm.from_name.trim())
      errors["from_name"] = "Nome é obrigatório";
    if (!reverseForm.from_postal_code.replace(/\D/g, "").trim())
      errors["from_postal_code"] = "CEP é obrigatório";
    if (!reverseForm.from_address.trim())
      errors["from_address"] = "Endereço é obrigatório";
    if (!reverseForm.from_number.trim())
      errors["from_number"] = "Número é obrigatório";
    if (!reverseForm.from_district.trim())
      errors["from_district"] = "Bairro é obrigatório";
    if (!reverseForm.from_city.trim())
      errors["from_city"] = "Cidade é obrigatória";
    if (!reverseForm.from_state_abbr.trim())
      errors["from_state"] = "UF é obrigatória";
    if (!reverseForm.to_name.trim()) errors["to_name"] = "Nome é obrigatório";
    if (!reverseForm.to_postal_code.replace(/\D/g, "").trim())
      errors["to_postal_code"] = "CEP é obrigatório";
    if (!reverseForm.to_address.trim())
      errors["to_address"] = "Endereço é obrigatório";
    if (!reverseForm.to_number.trim())
      errors["to_number"] = "Número é obrigatório";
    if (!reverseForm.to_district.trim())
      errors["to_district"] = "Bairro é obrigatório";
    if (!reverseForm.to_city.trim()) errors["to_city"] = "Cidade é obrigatória";
    if (!reverseForm.to_state_abbr.trim())
      errors["to_state"] = "UF é obrigatória";
    setReverseErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReverseSubmit = () => {
    setReverseSubmitted(true);
    if (!validateReverseForm()) return;
    inserirLogisticaReversa.mutate(
      {
        service: parseInt(reverseForm.service),
        from: {
          name: reverseForm.from_name,
          postal_code: reverseForm.from_postal_code.replace(/\D/g, ""),
          address: reverseForm.from_address,
          number: reverseForm.from_number,
          district: reverseForm.from_district,
          city: reverseForm.from_city,
          state_abbr: reverseForm.from_state_abbr,
        },
        to: {
          name: reverseForm.to_name,
          postal_code: reverseForm.to_postal_code.replace(/\D/g, ""),
          address: reverseForm.to_address,
          number: reverseForm.to_number,
          district: reverseForm.to_district,
          city: reverseForm.to_city,
          state_abbr: reverseForm.to_state_abbr,
        },
        products: [
          {
            width: parseFloat(reverseForm.width),
            height: parseFloat(reverseForm.height),
            length: parseFloat(reverseForm.length),
            weight: parseFloat(reverseForm.weight),
            insurance_value: parseFloat(reverseForm.insurance_value),
            quantity: 1,
          },
        ],
      } as Record<string, unknown>,
      {
        onSuccess: () => {
          setShowReverse(false);
          setReverseSubmitted(false);
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Carrinho de Fretes
            {items.length > 0 && (
              <Badge variant="secondary">{items.length}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReverse(true)}
            >
              <RotateCcw className="w-4 h-4 mr-1" /> Logística Reversa
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => listarCarrinho.refetch()}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
            </Button>
            {selectedIds.length > 0 && (
              <Button
                size="sm"
                onClick={handleCheckout}
                disabled={comprarFretes.isPending}
              >
                {comprarFretes.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-1" />
                )}
                Comprar ({selectedIds.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            if (listarCarrinho.isLoading) return <TableSkeleton rows={3} columns={7} />;
            if (listarCarrinho.isError) {
              return (
                <MEErrorState
                  message="Erro ao carregar o carrinho."
                  onRetry={() => listarCarrinho.refetch()}
                />
              );
            }
            if (items.length === 0) {
              return (
                <EmptyState
                  variant="inbox"
                  title="Carrinho vazio"
                  description="Faça uma cotação e adicione fretes ao carrinho para começar."
                  size="sm"
                />
              );
            }
            return (

      </Card>

      <ConfirmDialog
        open={!!confirmRemoveId}
        onOpenChange={(open) => {
          if (!open) setConfirmRemoveId(null);
        }}
        title="Remover item do carrinho"
        description="Tem certeza que deseja remover este item do carrinho? Esta ação não pode ser desfeita."
        confirmText="Remover"
        type="danger"
        onConfirm={() => {
          if (confirmRemoveId) {
            removerItemCarrinho.mutate(confirmRemoveId);
            setConfirmRemoveId(null);
          }
        }}
      />

      <MEDetailDialog
        open={!!itemDetail}
        onOpenChange={() => setItemDetail(null)}
        title="Detalhes do Item"
        data={itemDetail}
      />

      <Dialog
        open={showReverse}
        onOpenChange={(open) => {
          setShowReverse(open);
          if (!open) setReverseSubmitted(false);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" /> Logística Reversa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <MEFormField
              label="ID do Serviço"
              required
              error={reverseSubmitted ? reverseErrors["service"] : undefined}
            >
              <Input
                placeholder="Ex: 2 (SEDEX)"
                value={reverseForm.service}
                onChange={(e) =>
                  setReverseForm((p) => ({ ...p, service: e.target.value }))
                }
                className={
                  reverseSubmitted && reverseErrors["service"]
                    ? "border-destructive"
                    : ""
                }
              />
            </MEFormField>

            <div className="space-y-2">
              <p className="font-semibold text-sm border-b pb-1">
                📦 Origem (quem envia de volta)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <MEFormField
                  label="Nome"
                  required
                  error={
                    reverseSubmitted ? reverseErrors["from_name"] : undefined
                  }
                >
                  <Input
                    value={reverseForm.from_name}
                    onChange={(e) =>
                      setReverseForm((p) => ({
                        ...p,
                        from_name: e.target.value,
                      }))
                    }
                    className={
                      reverseSubmitted && reverseErrors["from_name"]
                        ? "border-destructive"
                        : ""
                    }
                  />
                </MEFormField>
                <MEFormField label="Telefone">
                  <Input
                    value={reverseForm.from_phone}
                    onChange={(e) =>
                      setReverseForm((p) => ({
                        ...p,
                        from_phone: formatPhone(e.target.value),
                      }))
                    }
                    placeholder="(99) 99999-9999"
                  />
                </MEFormField>
                <MECepAutoFill
                  value={reverseForm.from_postal_code}
                  onChange={(v) =>
                    setReverseForm((p) => ({ ...p, from_postal_code: v }))
                  }
                  label="CEP *"
                  onAddressFound={(addr) => {
                    setReverseForm((p) => ({
                      ...p,
                      from_address: addr.rua || p.from_address,
                      from_district: addr.bairro || p.from_district,
                      from_city: addr.cidade || p.from_city,
                      from_state_abbr: addr.uf || p.from_state_abbr,
                    }));
                  }}
                />
                {reverseSubmitted && reverseErrors["from_postal_code"] && (
                  <p className="text-xs text-destructive -mt-2">
                    {reverseErrors["from_postal_code"]}
                  </p>
                )}
                <MEFormField
                  label="UF"
                  required
                  error={
                    reverseSubmitted ? reverseErrors["from_state"] : undefined
                  }
                >
                  <Input
                    value={reverseForm.from_state_abbr}
                    onChange={(e) =>
                      setReverseForm((p) => ({
                        ...p,
                        from_state_abbr: e.target.value.toUpperCase(),
                      }))
                    }
                    maxLength={2}
                    className={
                      reverseSubmitted && reverseErrors["from_state"]
                        ? "border-destructive"
                        : ""
                    }
                  />
                </MEFormField>
                <MEFormField
                  label="Endereço"
                  required
                  error={
                    reverseSubmitted ? reverseErrors["from_address"] : undefined
                  }
                  className="col-span-2"
                >
                  <Input
                    value={reverseForm.from_address}
                    onChange={(e) =>
                      setReverseForm((p) => ({
                        ...p,
                        from_address: e.target.value,
                      }))
                    }
                    className={
                      reverseSubmitted && reverseErrors["from_address"]
                        ? "border-destructive"
                        : ""
                    }
                  />
                </MEFormField>
                <MEFormField
                  label="Número"
                  required
                  error={
                    reverseSubmitted ? reverseErrors["from_number"] : undefined
                  }
                >
                  <Input
                    value={reverseForm.from_number}
                    onChange={(e) =>
                      setReverseForm((p) => ({
                        ...p,
                        from_number: e.target.value,
                      }))
                    }
                    className={
                      reverseSubmitted && reverseErrors["from_number"]
                        ? "border-destructive"
                        : ""
                    }
                  />
                </MEFormField>
                <MEFormField
                  label="Bairro"
                  required
                  error={
                    reverseSubmitted
                      ? reverseErrors["from_district"]
                      : undefined
                  }
                >
                  <Input
                    value={reverseForm.from_district}
                    onChange={(e) =>
                      setReverseForm((p) => ({
                        ...p,
                        from_district: e.target.value,
                      }))
                    }
                    className={
                      reverseSubmitted && reverseErrors["from_district"]
                        ? "border-destructive"
                        : ""
                    }
                  />
                </MEFormField>
                <MEFormField
                  label="Cidade"
                  required
                  error={
                    reverseSubmitted ? reverseErrors["from_city"] : undefined
                  }
                >
                  <Input
                    value={reverseForm.from_city}
                    onChange={(e) =>
                      setReverseForm((p) => ({
                        ...p,
                        from_city: e.target.value,
                      }))
                    }
                    className={
                      reverseSubmitted && reverseErrors["from_city"]
                        ? "border-destructive"
                        : ""
                    }
                  />
                </MEFormField>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm border-b pb-1">
                📍 Destino (quem recebe de volta)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <MEFormField
                  label="Nome"
                  required
                  error={
                    reverseSubmitted ? reverseErrors["to_name"] : undefined
                  }
                >
                  <Input
                    value={reverseForm.to_name}
                    onChange={(e) =>
                      setReverseForm((p) => ({ ...p, to_name: e.target.value }))
                    }
                    className={
                      reverseSubmitted && reverseErrors["to_name"]
                        ? "border-destructive"
                        : ""
                    }
                  />
                </MEFormField>
                <MEFormField label="Telefone">
                  <Input
                    value={reverseForm.to_phone}
                    onChange={(e) =>
                      setReverseForm((p) => ({
                        ...p,
                        to_phone: formatPhone(e.target.value),
                      }))
                    }
                    placeholder="(99) 99999-9999"
                  />
                </MEFormField>
                <MECepAutoFill
                  value={reverseForm.to_postal_code}
                  onChange={(v) =>
                    setReverseForm((p) => ({ ...p, to_postal_code: v }))
                  }
                  label="CEP *"
                  onAddressFound={(addr) => {
                    setReverseForm((p) => ({
                      ...p,
                      to_address: addr.rua || p.to_address,
                      to_district: addr.bairro || p.to_district,
                      to_city: addr.cidade || p.to_city,
                      to_state_abbr: addr.uf || p.to_state_abbr,
                    }));
                  }}
                />
                {reverseSubmitted && reverseErrors["to_postal_code"] && (
                  <p className="text-xs text-destructive -mt-2">
                    {reverseErrors["to_postal_code"]}
                  </p>
                )}
                <MEFormField
                  label="UF"
                  required
                  error={
                    reverseSubmitted ? reverseErrors["to_state"] : undefined
                  }
                >
                  <Input
                    value={reverseForm.to_state_abbr}
                    onChange={(e) =>
                      setReverseForm((p) => ({
                        ...p,
                        to_state_abbr: e.target.value.toUpperCase(),
                      }))
                    }
                    maxLength={2}
                    className={
                      reverseSubmitted && reverseErrors["to_state"]
                        ? "border-destructive"
                        : ""
                    }
                  />
                </MEFormField>
                <MEFormField
                  label="Endereço"
                  required
                  error={
                    reverseSubmitted ? reverseErrors["to_address"] : undefined
                  }
                  className="col-span-2"
                >
                  <Input
                    value={reverseForm.to_address}
                    onChange={(e) =>
                      setReverseForm((p) => ({
                        ...p,
                        to_address: e.target.value,
                      }))
                    }
                    className={
                      reverseSubmitted && reverseErrors["to_address"]
                        ? "border-destructive"
                        : ""
                    }
                  />
                </MEFormField>
                <MEFormField
                  label="Número"
                  required
                  error={
                    reverseSubmitted ? reverseErrors["to_number"] : undefined
                  }
                >
                  <Input
                    value={reverseForm.to_number}
                    onChange={(e) =>
                      setReverseForm((p) => ({
                        ...p,
                        to_number: e.target.value,
                      }))
                    }
                    className={
                      reverseSubmitted && reverseErrors["to_number"]
                        ? "border-destructive"
                        : ""
                    }
                  />
                </MEFormField>
                <MEFormField
                  label="Bairro"
                  required
                  error={
                    reverseSubmitted ? reverseErrors["to_district"] : undefined
                  }
                >
                  <Input
                    value={reverseForm.to_district}
                    onChange={(e) =>
                      setReverseForm((p) => ({
                        ...p,
                        to_district: e.target.value,
                      }))
                    }
                    className={
                      reverseSubmitted && reverseErrors["to_district"]
                        ? "border-destructive"
                        : ""
                    }
                  />
                </MEFormField>
                <MEFormField
                  label="Cidade"
                  required
                  error={
                    reverseSubmitted ? reverseErrors["to_city"] : undefined
                  }
                >
                  <Input
                    value={reverseForm.to_city}
                    onChange={(e) =>
                      setReverseForm((p) => ({ ...p, to_city: e.target.value }))
                    }
                    className={
                      reverseSubmitted && reverseErrors["to_city"]
                        ? "border-destructive"
                        : ""
                    }
                  />
                </MEFormField>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm border-b pb-1">📦 Volume</p>
              <div className="grid grid-cols-5 gap-2">
                <MEFormField label="Larg. (cm)">
                  <Input
                    type="number"
                    value={reverseForm.width}
                    onChange={(e) =>
                      setReverseForm((p) => ({ ...p, width: e.target.value }))
                    }
                  />
                </MEFormField>
                <MEFormField label="Alt. (cm)">
                  <Input
                    type="number"
                    value={reverseForm.height}
                    onChange={(e) =>
                      setReverseForm((p) => ({ ...p, height: e.target.value }))
                    }
                  />
                </MEFormField>
                <MEFormField label="Comp. (cm)">
                  <Input
                    type="number"
                    value={reverseForm.length}
                    onChange={(e) =>
                      setReverseForm((p) => ({ ...p, length: e.target.value }))
                    }
                  />
                </MEFormField>
                <MEFormField label="Peso (kg)">
                  <Input
                    type="number"
                    value={reverseForm.weight}
                    onChange={(e) =>
                      setReverseForm((p) => ({ ...p, weight: e.target.value }))
                    }
                  />
                </MEFormField>
                <MEFormField label="Valor (R$)">
                  <Input
                    type="number"
                    value={reverseForm.insurance_value}
                    onChange={(e) =>
                      setReverseForm((p) => ({
                        ...p,
                        insurance_value: e.target.value,
                      }))
                    }
                  />
                </MEFormField>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReverse(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleReverseSubmit}
              disabled={inserirLogisticaReversa.isPending}
            >
              {inserirLogisticaReversa.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-1" />
              )}
              Inserir Logística Reversa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
