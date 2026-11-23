/* eslint-disable max-lines */
import { useState, useMemo, useCallback, useRef } from "react";
import { SortIcon } from "@/components/common/SortIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  MapPin,
  Loader2,
  Download,
  Upload,
} from "lucide-react";
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions } from "@/components/common/BulkActions";
import { useSelection } from "@/hooks/common/useSelection";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { usePagination } from "@/hooks/common/usePagination";
import { useFilters, FilterConfig } from "@/hooks/common/useFilters";
import { useSorting } from "@/hooks/common/useSorting";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ESTADOS_BRASIL = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

interface TabelaFreteLocal {
  id: string;
  transportadora_id: string;
  transportadora_nome?: string;
  estado_destino: string;
  peso_min: number;
  peso_max: number;
  valor_kg: number;
  prazo_dias: number;
}

interface FreightTableManagerProps {
  tabelasList: TabelaFreteLocal[];
  transportadoras: Array<{ id: string; nome_fantasia: string }>;
  isLoading: boolean;
  onAdd: (data: {
    transportadora_id: string;
    estado_destino: string;
    regiao_destino: string;
    peso_min_kg: number;
    peso_max_kg: number;
    preco_por_kg: number;
    prazo_dias: number;
    taxa_fixa: number;
    ativo: boolean;
  }) => void;
  onDelete: (id: string) => void;
}

const filterConfig: FilterConfig<TabelaFreteLocal> = {
  search: {
    fields: ["transportadora_nome", "estado_destino"],
    placeholder: "Buscar tabelas...",
  },
};

export function FreightTableManager({
  tabelasList,
  transportadoras,
  isLoading,
  onAdd,
  onDelete,
}: FreightTableManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [newForm, setNewForm] = useState({
    transportadora_id: "",
    estado_destino: "",
    peso_min: 0,
    peso_max: 100,
    valor_kg: 0,
    prazo_dias: 5,
  });

  const estadoFiltered = useMemo(() => {
    if (estadoFilter === "all") return tabelasList;
    return tabelasList.filter((t) => t.estado_destino === estadoFilter);
  }, [tabelasList, estadoFilter]);

  const {
    filteredData,
    filters,
    setSearch,
    clearFilters,
    hasActiveFilters,
    totalFiltered,
    totalOriginal,
  } = useFilters(estadoFiltered, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(
    filteredData,
    { defaultKey: "valor_kg", defaultDirection: "asc" },
  );
  const pagination = usePagination(sortedData, { initialPageSize: 10 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } =
    useSelection(pagination.paginatedData);

  const handleAdd = useCallback(() => {
    onAdd({
      transportadora_id: newForm.transportadora_id,
      estado_destino: newForm.estado_destino,
      regiao_destino: newForm.estado_destino,
      peso_min_kg: newForm.peso_min,
      peso_max_kg: newForm.peso_max,
      preco_por_kg: newForm.valor_kg,
      prazo_dias: newForm.prazo_dias,
      taxa_fixa: 0,
      ativo: true,
    });
    setIsAddDialogOpen(false);
    setNewForm({
      transportadora_id: "",
      estado_destino: "",
      peso_min: 0,
      peso_max: 100,
      valor_kg: 0,
      prazo_dias: 5,
    });
  }, [newForm, onAdd]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportCSV = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = String(e.target?.result ?? "");
        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length === 0) {
          toast.error("Arquivo CSV vazio.");
          return;
        }
        const rows = lines.slice(1); // skip header
        let imported = 0;
        let skipped = 0;
        for (const line of rows) {
          const cols = line.split(",").map((c) => c.trim());
          const [
            transportadora_id,
            estado_destino,
            pesoMin,
            pesoMax,
            valorKg,
            prazo,
          ] = cols;
          const pMin = Number(pesoMin);
          const pMax = Number(pesoMax);
          const vKg = Number(valorKg);
          const prazoDias = Number(prazo);
          if (
            !transportadora_id ||
            !estado_destino ||
            Number.isNaN(pMin) ||
            Number.isNaN(pMax) ||
            Number.isNaN(vKg) ||
            Number.isNaN(prazoDias)
          ) {
            skipped += 1;
            continue;
          }
          onAdd({
            transportadora_id,
            estado_destino,
            regiao_destino: estado_destino,
            peso_min_kg: pMin,
            peso_max_kg: pMax,
            preco_por_kg: vKg,
            prazo_dias: prazoDias,
            taxa_fixa: 0,
            ativo: true,
          });
          imported += 1;
        }
        const skippedNote = skipped > 0 ? ` (${skipped} ignorados)` : "";
        toast.success(`Importados ${imported} registros${skippedNote}.`);
        setIsImporting(false);
      };
      reader.onerror = () => {
        setIsImporting(false);
        toast.error("Falha ao ler o arquivo CSV.");
      };
      setIsImporting(true);
      reader.readAsText(file);
    },
    [onAdd],
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setEstadoFilter("all");
  }, [clearFilters]);

  const confirmBulkDelete = useCallback(() => {
    if (bulkDeleteIds) {
      bulkDeleteIds.forEach((id) => onDelete(id));
      clearSelection();
      setBulkDeleteIds(null);
    }
  }, [bulkDeleteIds, onDelete, clearSelection]);


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const csv = [
                [
                  "ID",
                  "Transportadora",
                  "Estado",
                  "Peso Min",
                  "Peso Max",
                  "Valor/kg",
                  "Prazo",
                ],
                ...sortedData.map((t) => [
                  t.id,
                  t.transportadora_nome,
                  t.estado_destino,
                  t.peso_min,
                  t.peso_max,
                  t.valor_kg,
                  t.prazo_dias,
                ]),
              ]
                .map((row) => row.join(","))
                .join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "tabelas-frete.csv";
              a.click();
            }}
          >
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}{" "}
            Importar CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportCSV(file);
              e.target.value = "";
            }}
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Tabela
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Tabela de Frete</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Transportadora</Label>
                <Select
                  value={newForm.transportadora_id}
                  onValueChange={(v) =>
                    setNewForm({ ...newForm, transportadora_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {transportadoras.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome_fantasia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado Destino</Label>
                <Select
                  value={newForm.estado_destino}
                  onValueChange={(v) =>
                    setNewForm({ ...newForm, estado_destino: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BRASIL.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Peso Mín (kg)</Label>
                  <Input
                    type="number"
                    value={newForm.peso_min}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        peso_min: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Peso Máx (kg)</Label>
                  <Input
                    type="number"
                    value={newForm.peso_max}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        peso_max: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Valor/kg (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newForm.valor_kg}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        valor_kg: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Prazo (dias)</Label>
                  <Input
                    type="number"
                    value={newForm.prazo_dias}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        prazo_dias: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!newForm.transportadora_id || !newForm.estado_destino}
              >
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <FilterBar
        search={filters.search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar tabelas..."
        extraFilters={[
          {
            key: "estado_destino",
            label: "Estado",
            value: estadoFilter,
            options: ESTADOS_BRASIL.map((uf) => ({ value: uf, label: uf })),
            onChange: setEstadoFilter,
          },
        ]}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters || estadoFilter !== "all"}
        totalFiltered={totalFiltered}
        totalOriginal={totalOriginal}
      />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleSort("valor_kg")}
          className="gap-1"
        >
          Valor <SortIcon dir={getSortDirection("valor_kg")} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleSort("prazo_dias")}
          className="gap-1"
        >
          Prazo <SortIcon dir={getSortDirection("prazo_dias")} />
        </Button>
      </div>

      {selectedIds.length > 0 && (
        <BulkActions
          selectedIds={selectedIds}
          totalCount={pagination.paginatedData.length}
          onClearSelection={clearSelection}
          onSelectAll={selectAll}
          actions={[
            {
              id: "delete",
              label: "Excluir",
              icon: Trash2,
              variant: "destructive",
              onClick: (ids) => setBulkDeleteIds(ids),
            },
          ]}
        />
      )}

      {(() => {
        if (isLoading)
          return (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          );
        if (sortedData.length === 0)
          return (
            <EmptyState
              icon={MapPin}
              title="Nenhuma tabela cadastrada"
              description="Adicione tabelas de frete para começar a cotar"
            />
          );
        return (
          <div className="space-y-2">
            {pagination.paginatedData.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "card-interactive flex items-center gap-3",
                  isSelected(t.id) && "ring-2 ring-primary",
                )}
              >
                <Checkbox
                  checked={isSelected(t.id)}
                  onCheckedChange={() => toggle(t.id)}
                />
                <div className="flex-1">
                  <p className="font-semibold">{t.transportadora_nome}</p>
                  <p className="text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3 inline" /> {t.estado_destino} |{" "}
                    {t.peso_min}-{t.peso_max}kg
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">R$ {t.valor_kg?.toFixed(2)}/kg</p>
                  <p className="text-sm text-muted-foreground">
                    {t.prazo_dias} dias
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(t.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        );
      })()}

      {sortedData.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          pageSizeOptions={pagination.pageSizeOptions}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
          onNextPage={pagination.nextPage}
          onPrevPage={pagination.prevPage}
          onFirstPage={pagination.firstPage}
          onLastPage={pagination.lastPage}
        />
      )}

      {/* Single Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Excluir tabela de frete?"
        description="Esta ação não pode ser desfeita. A tabela será removida permanentemente."
        confirmText="Excluir"
        onConfirm={() => {
          if (deleteTarget) {
            onDelete(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        type="danger"
      />

      {/* Bulk Delete Confirm */}
      <ConfirmDialog
        open={!!bulkDeleteIds}
        onOpenChange={() => setBulkDeleteIds(null)}
        title={`Excluir ${bulkDeleteIds?.length || 0} tabelas?`}
        description="Esta ação não pode ser desfeita. Todas as tabelas selecionadas serão removidas."
        confirmText="Excluir Todas"
        onConfirm={confirmBulkDelete}
        type="danger"
      />
    </div>
  );
}
