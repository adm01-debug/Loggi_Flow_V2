/* eslint-disable sonarjs/class-name */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Map as MapIcon,
  MapPin,
  Truck,
  Globe,
  Shield,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Praça {
  estado: string;
  cidades: string[];
  transportadoras: string[];
}

interface RotaComTransportadora {
  id: string;
  origem_estado: string;
  origem_cidade: string | null;
  destino_estado: string;
  destino_cidade: string | null;
  transportadora: { nome_fantasia: string } | null;
}

/** Insere cidade e transportadora únicos em uma praça existente ou nova. */
function addToEntry(
  entry: Praça,
  cidade: string | null,
  nome: string | null,
): void {
  if (cidade && !entry.cidades.includes(cidade)) {
    entry.cidades.push(cidade);
  }
  if (nome && !entry.transportadoras.includes(nome)) {
    entry.transportadoras.push(nome);
  }
}

/** Agrega as rotas ativas em praças por estado, extraindo cidades e transportadoras únicas. */
function collectPracas(rotas: RotaComTransportadora[]): Praça[] {
  const map = new Map<string, Praça>();
  for (const rota of rotas) {
    const estados = [rota.origem_estado, rota.destino_estado];
    const cidades = [rota.origem_cidade, rota.destino_cidade];
    const nome = rota.transportadora?.nome_fantasia ?? null;
    for (let i = 0; i < estados.length; i += 1) {
      const estado = estados[i]?.trim().toUpperCase();
      if (!estado) continue;
      let entry = map.get(estado);
      if (!entry) {
        entry = { estado, cidades: [], transportadoras: [] };
        map.set(estado, entry);
      }
      addToEntry(entry, cidades[i], nome);
    }
  }
  return [...map.values()].sort((a, b) => a.estado.localeCompare(b.estado));
}

/** Texto descritivo do estado de carregamento da malha de praças. */
function descriptiveText(isLoading: boolean, isError: boolean): string {
  if (isLoading) return "Carregando praças a partir das rotas ativas...";
  if (isError) return "Falha ao carregar a malha de praças do banco de dados.";
  return "Praças mapeadas a partir das rotas ativas no banco de dados. O Nexus utiliza esta malha para automatizar as cotações.";
}

function useCoveragePracas() {
  return useQuery({
    queryKey: ["nexus-coverage-pracas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transportadora_rotas")
        .select(
          `
          id,
          origem_estado,
          origem_cidade,
          destino_estado,
          destino_cidade,
          transportadora:transportadoras (
            nome_fantasia
          )
        `,
        )
        .eq("ativo", true);
      if (error) throw error;
      return collectPracas((data ?? []) as RotaComTransportadora[]);
    },
    staleTime: 60_000,
    retry: 1,
  });
}

function CidadeBadges({ cidades }: { cidades: string[] }) {
  if (cidades.length === 0) {
    return (
      <span className="text-xs italic">Mapa de cidades em construção...</span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1">
      {cidades.map((cidade) => (
        <Badge key={cidade} variant="outline" className="font-normal">
          {cidade}
        </Badge>
      ))}
    </div>
  );
}

function TransportadoraList({
  transportadoras,
}: {
  transportadoras: string[];
}) {
  if (transportadoras.length === 0) {
    return (
      <span className="text-xs italic">
        Sem transportadoras homologadas nesta praça.
      </span>
    );
  }
  return (
    <div className="space-y-1">
      {transportadoras.map((nome) => (
        <div
          key={nome}
          className="flex items-center gap-2 text-sm p-2 rounded bg-card border"
        >
          <Truck className="w-4 h-4 text-primary" />
          <span className="font-medium">{nome}</span>
          <Shield className="w-3 h-3 text-success ml-auto" />
        </div>
      ))}
    </div>
  );
}

function coverageGrid(
  isLoading: boolean,
  pracas: Praça[],
  selectedEstado: string | null,
  onSelect: (estado: string) => void,
) {
  if (isLoading) {
    return (
      <div className="col-span-3 flex items-center justify-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Consultando rotas...</span>
      </div>
    );
  }
  if (pracas.length === 0) {
    return (
      <div className="col-span-3 flex items-center justify-center gap-2 py-8 text-muted-foreground">
        <AlertTriangle className="w-5 h-5" />
        <span className="text-sm">Nenhuma rota ativa cadastrada.</span>
      </div>
    );
  }
  return pracas.map((praça) => (
    <Button
      key={praça.estado}
      variant={selectedEstado === praça.estado ? "default" : "outline"}
      size="sm"
      onClick={() => onSelect(praça.estado)}
      className="h-12 text-lg font-bold"
    >
      {praça.estado}
    </Button>
  ));
}

export function NexusCoverageMap() {
  const [selectedEstado, setSelectedEstado] = useState<string | null>(null);
  const { data: pracas = [], isLoading, isError } = useCoveragePracas();
  const selected = pracas.find((p) => p.estado === selectedEstado) ?? null;

  return (
    <Card className="w-full h-full min-h-[400px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Nexus Intelligence: Mapa de Cobertura (Praças)
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {descriptiveText(isLoading, isError)}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {coverageGrid(isLoading, pracas, selectedEstado, setSelectedEstado)}
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 border relative overflow-hidden">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.estado}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Praça: {selected.estado}
                  </h3>
                  <Badge variant="success">Ativa</Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Principais Cidades
                  </p>
                  <CidadeBadges cidades={selected.cidades} />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Transportadoras Especialistas
                  </p>
                  <TransportadoraList
                    transportadoras={selected.transportadoras}
                  />
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                <MapIcon className="w-12 h-12 text-muted/50" />
                <div>
                  <p className="font-medium">Selecione uma Praça</p>
                  <p className="text-sm text-muted-foreground">
                    Para visualizar detalhes da malha logística
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
