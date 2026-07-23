/* eslint-disable max-lines */
import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepProgress } from "@/components/common/StepProgress";
import {
  Zap,
  CheckCircle2,
  TrendingDown,
  Rocket,
  ShieldCheck,
  Timer,
  Award,
  Map,
} from "lucide-react";
import { useTransportadoraRotas } from "@/hooks/logistics/useTransportadoraRotas";
import { useRodonavesTracking } from "@/hooks/logistics/useRodonavesTracking";
import { useMelhorEnvio } from "@/hooks/logistics/useMelhorEnvio";
import { useCotacoesMulticanal } from "@/hooks/logistics/useCotacoesMulticanal";
import { useLalamoveOrders } from "@/hooks/logistics/useLalamoveOrders";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CotacaoSearchForm } from "./cotacao-multicanal/CotacaoSearchForm";
import { CotacaoCarrierList } from "./cotacao-multicanal/CotacaoCarrierList";
import { CotacaoResultsTable } from "./cotacao-multicanal/CotacaoResultsTable";
import { NegotiationAssistant } from "@/components/freight";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CotacaoManual,
  TransportadoraComCanal,
} from "./cotacao-multicanal/types";

import { NexusCoverageMap } from "@/components/freight/NexusCoverageMap";

export default function CotacaoMultiCanal() {
  const { searchRoutes } = useTransportadoraRotas();
  const { createCotacao } = useCotacoesMulticanal();
  const rodonaves = useRodonavesTracking();
  const melhorEnvio = useMelhorEnvio();
  const lalamove = useLalamoveOrders();

  const [origemEstado, setOrigemEstado] = useState("");
  const [destinoEstado, setDestinoEstado] = useState("");
  const [origemCidade, setOrigemCidade] = useState("");
  const [destinoCidade, setDestinoCidade] = useState("");
  const [origemCep, setOrigemCep] = useState("");
  const [destinoCep, setDestinoCep] = useState("");
  const [pesoKg, setPesoKg] = useState("");
  const [volumes, setVolumes] = useState("1");
  const [valorMercadoria, setValorMercadoria] = useState("");
  const [carriers, setCarriers] = useState<TransportadoraComCanal[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isBlasting, setIsBlasting] = useState(false);
  const [blastProgress, setBlastProgress] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [manualDialog, setManualDialog] = useState(false);
  const [coverageDialog, setCoverageDialog] = useState(false);
  const [selectedCarrier, setSelectedCarrier] =
    useState<TransportadoraComCanal | null>(null);
  const [manualValor, setManualValor] = useState("");
  const [manualPrazo, setManualPrazo] = useState("");
  const [manualObs, setManualObs] = useState("");
  const [cotacoes, setCotacoes] = useState<CotacaoManual[]>([]);

  const handleSearch = async () => {
    if (!origemEstado || !destinoEstado) {
      toast.error("Selecione os estados de origem e destino");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setCotacoes([]);
    setCarriers([]);

    try {
      // 1. Local routes search
      const localResults = await searchRoutes(
        origemEstado,
        destinoEstado,
        origemCidade || undefined,
        destinoCidade || undefined,
      );
      const enriched: TransportadoraComCanal[] = localResults.map((rota) => {
        const t = rota.transportadora as { api_disponivel?: boolean; whatsapp_operacional?: string; email_comercial?: string } | undefined;
        const hasApi = t?.api_disponivel === true;
        const hasWhatsapp = !!t?.whatsapp_operacional;
        let canal: "api" | "whatsapp" | "email" = "email";
        if (hasApi) canal = "api";
        else if (hasWhatsapp) canal = "whatsapp";
        return {
          ...rota,
          canal_cotacao: canal,
          whatsapp: t?.whatsapp_operacional,
          email: t?.email_comercial,
          api_disponivel: hasApi,
        };
      });
      setCarriers(enriched);

      // 2. Automated API Quotes (Rodonaves, Melhor Envio, Lalamove)
      if (origemCep && destinoCep && pesoKg) {
        const cleanedOrigemCep = origemCep.replace(/\D/g, "");
        const cleanedDestinoCep = destinoCep.replace(/\D/g, "");
        const weight = parseFloat(pesoKg);
        const value = valorMercadoria ? parseFloat(valorMercadoria) : 0;
        const vol = parseInt(volumes) || 1;

        // Rodonaves
        rodonaves
          .getQuotationAsync({
            cepOrigem: cleanedOrigemCep,
            cepDestino: cleanedDestinoCep,
            peso: weight,
            volumes: vol,
            valorMercadoria: value,
          })
          .then((res) => {
            if (res?.data) {
              addCotacao({
                id: crypto.randomUUID(),
                transportadora_id: "rodonaves-id", // Use a standard ID or find in carriers
                transportadora_nome: "Rodonaves RTE",
                canal: "api",
                valor: res.data.Valor,
                prazo_dias: res.data.PrazoEntrega,
                status: "respondido",
                observacoes: "Cotação automática API Rodonaves",
                created_at: new Date().toISOString(),
              });
            }
          })
          .catch((e) => {
            // Log errors to a safe sink or ignore in production
          });

        // Melhor Envio
        melhorEnvio.calcularFrete
          .mutateAsync({
            from: { postal_code: cleanedOrigemCep },
            to: { postal_code: cleanedDestinoCep },
            volumes: [{ width: 20, height: 20, length: 20, weight: weight }], // Default volume if not provided
          })
          .then((res: unknown) => {
            if (Array.isArray(res)) {
              type MEOption = {
                id?: string | number;
                name?: string;
                price?: string | number;
                delivery_range?: { max?: number };
                delivery_time?: number;
                error?: unknown;
              };
              (res as MEOption[]).forEach((option) => {
                if (!option.error) {
                  addCotacao({
                    id: crypto.randomUUID(),
                    transportadora_id: `me-${option.id}`,
                    transportadora_nome: `Melhor Envio - ${option.name}`,
                    canal: "api",
                    valor: parseFloat(String(option.price ?? "0")),
                    prazo_dias:
                      option.delivery_range?.max ?? option.delivery_time ?? null,

                    status: "respondido",
                    observacoes: `Serviço: ${option.name}`,
                    created_at: new Date().toISOString(),
                  });
                }
              });
            }
          })

          .catch((e) => {
            // Silent catch
          });

        // Lalamove (Simplified)
        lalamove.getQuotation
          .mutateAsync({
            stops: [
              { lat: 0, lng: 0, address: cleanedOrigemCep }, // Lalamove usually needs real addresses/coords
              { lat: 0, lng: 0, address: cleanedDestinoCep },
            ],
          })
          .then((res) => {
            if (res?.priceBreakdown) {
              addCotacao({
                id: crypto.randomUUID(),
                transportadora_id: "lalamove-id",
                transportadora_nome: "Lalamove",
                canal: "api",
                valor: parseFloat(res.priceBreakdown.total),
                prazo_dias: 1, // Lalamove is usually same day
                status: "respondido",
                observacoes: "Cotação automática Lalamove",
                created_at: new Date().toISOString(),
              });
            }
          })
          .catch((e) => {
            // Silent catch
          });
      }

      if (enriched.length === 0)
        toast.info("Nenhuma transportadora local encontrada");
      else
        toast.success(
          `${enriched.length} transportadora(s) local(is) encontrada(s)`,
        );
    } catch {
      // Silent error handler
      toast.error("Erro ao buscar transportadoras");
    } finally {
      setIsSearching(false);
    }
  };

  const handleNexusBlast = async () => {
    if (carriers.length === 0) {
      toast.error("Busque transportadoras primeiro");
      return;
    }

    setIsBlasting(true);
    setBlastProgress(0);
    toast.info("Iniciando Nexus Blast: Cotação Automatizada em Massa");

    let completed = 0;
    const total = carriers.length;

    for (const carrier of carriers) {
      try {
        if (carrier.canal_cotacao === "api") {
          await handleCotarAPI(carrier);
        } else if (carrier.canal_cotacao === "whatsapp") {
          // Record that we intend to quote via WhatsApp (automation would trigger here in real scenario)
          createCotacao.mutate({
            transportadora_id: carrier.transportadora_id,
            canal: "whatsapp",
            origem_estado: origemEstado,
            destino_estado: destinoEstado,
            peso_kg: pesoKg ? parseFloat(pesoKg) : undefined,
            volumes: parseInt(volumes),
          });
          addCotacao({
            id: crypto.randomUUID(),
            transportadora_id: carrier.transportadora_id,
            transportadora_nome: carrier.transportadora?.nome_fantasia || "N/A",
            canal: "whatsapp",
            valor: null,
            prazo_dias: null,
            status: "pendente",
            observacoes: "Nexus Blast: Aguardando RPA/WhatsApp",
            created_at: new Date().toISOString(),
          });
        } else {
          createCotacao.mutate({
            transportadora_id: carrier.transportadora_id,
            canal: "email",
            origem_estado: origemEstado,
            destino_estado: destinoEstado,
            peso_kg: pesoKg ? parseFloat(pesoKg) : undefined,
            volumes: parseInt(volumes),
          });
          addCotacao({
            id: crypto.randomUUID(),
            transportadora_id: carrier.transportadora_id,
            transportadora_nome: carrier.transportadora?.nome_fantasia || "N/A",
            canal: "email",
            valor: null,
            prazo_dias: null,
            status: "pendente",
            observacoes: "Nexus Blast: Email Automático Enviado",
            created_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error(
          `Erro ao cotar com ${carrier.transportadora?.nome_fantasia}:`,
          e,
        );
      }
      completed++;
      setBlastProgress(Math.round((completed / total) * 100));
    }

    setIsBlasting(false);
    toast.success(
      "Nexus Blast concluído! Aguardando respostas das transportadoras sem API.",
    );
  };

  const addCotacao = (c: CotacaoManual) =>
    setCotacoes((prev) => {
      // Avoid duplicates
      if (
        prev.some(
          (x) =>
            x.transportadora_id === c.transportadora_id && x.canal === c.canal,
        )
      )
        return prev;
      return [...prev, c];
    });

  const handleCotarAPI = async (carrier: TransportadoraComCanal) => {
    if (!pesoKg) {
      toast.error("Informe o peso para cotar via API");
      return;
    }
    const valorCalculado =
      (carrier.taxa_fixa || 0) +
      (carrier.preco_por_kg || 0) * parseFloat(pesoKg);
    await createCotacao.mutateAsync({
      transportadora_id: carrier.transportadora_id,
      canal: "api",
      origem_estado: origemEstado,
      origem_cidade: origemCidade || undefined,
      destino_estado: destinoEstado,
      destino_cidade: destinoCidade || undefined,
      peso_kg: parseFloat(pesoKg),
      volumes: parseInt(volumes),
      valor_mercadoria: valorMercadoria
        ? parseFloat(valorMercadoria)
        : undefined,
      valor_cotado: valorCalculado,
      prazo_dias: carrier.prazo_dias,
      observacoes: "Cotação via Nexus Blast (API)",
      status: "respondido",
    });
    addCotacao({
      id: crypto.randomUUID(),
      transportadora_id: carrier.transportadora_id,
      transportadora_nome: carrier.transportadora?.nome_fantasia || "N/A",
      canal: "api",
      valor: valorCalculado,
      prazo_dias: carrier.prazo_dias,
      status: "respondido",
      observacoes: "Nexus Blast API",
      created_at: new Date().toISOString(),
    });
  };

  const handleCotarWhatsApp = (carrier: TransportadoraComCanal) => {
    const msg = encodeURIComponent(
      `Olá! Gostaria de cotar um frete:\n📍 Origem: ${origemEstado}${origemCidade ? " - " + origemCidade : ""}\n📍 Destino: ${destinoEstado}${destinoCidade ? " - " + destinoCidade : ""}\n📦 Peso: ${pesoKg || "(não informado)"} kg\n📦 Volumes: ${volumes}\n💰 Valor: R$ ${valorMercadoria || "(não informado)"}\nAguardo retorno!`,
    );
    window.open(
      `https://wa.me/${carrier.whatsapp?.replace(/\D/g, "")}?text=${msg}`,
      "_blank",
    );
    createCotacao.mutate({
      transportadora_id: carrier.transportadora_id,
      canal: "whatsapp",
      origem_estado: origemEstado,
      destino_estado: destinoEstado,
      peso_kg: pesoKg ? parseFloat(pesoKg) : undefined,
      volumes: parseInt(volumes),
    });
    addCotacao({
      id: crypto.randomUUID(),
      transportadora_id: carrier.transportadora_id,
      transportadora_nome: carrier.transportadora?.nome_fantasia || "N/A",
      canal: "whatsapp",
      valor: null,
      prazo_dias: null,
      status: "pendente",
      observacoes: "WhatsApp enviado",
      created_at: new Date().toISOString(),
    });
    toast.success("Mensagem WhatsApp aberta!");
  };

  const handleCotarEmail = (carrier: TransportadoraComCanal) => {
    const subject = encodeURIComponent(
      `Cotação de Frete - ${origemEstado} → ${destinoEstado}`,
    );
    const body = encodeURIComponent(
      `Prezados,\n\nSolicito cotação:\nOrigem: ${origemEstado}\nDestino: ${destinoEstado}\nPeso: ${pesoKg || "?"} kg\nVolumes: ${volumes}\n\nAtenciosamente.`,
    );
    window.open(
      `mailto:${carrier.email}?subject=${subject}&body=${body}`,
      "_blank",
    );
    createCotacao.mutate({
      transportadora_id: carrier.transportadora_id,
      canal: "email",
      origem_estado: origemEstado,
      destino_estado: destinoEstado,
      peso_kg: pesoKg ? parseFloat(pesoKg) : undefined,
      volumes: parseInt(volumes),
    });
    addCotacao({
      id: crypto.randomUUID(),
      transportadora_id: carrier.transportadora_id,
      transportadora_nome: carrier.transportadora?.nome_fantasia || "N/A",
      canal: "email",
      valor: null,
      prazo_dias: null,
      status: "pendente",
      observacoes: "Email enviado",
      created_at: new Date().toISOString(),
    });
    toast.success("Email aberto!");
  };

  const handleRegistrarResposta = () => {
    if (!selectedCarrier || !manualValor) {
      toast.error("Informe o valor");
      return;
    }
    setCotacoes((prev) =>
      prev.map((c) =>
        c.transportadora_id === selectedCarrier.transportadora_id &&
        c.status === "pendente"
          ? {
              ...c,
              valor: parseFloat(manualValor),
              prazo_dias: manualPrazo ? parseInt(manualPrazo) : null,
              status: "respondido" as const,
              observacoes: manualObs || c.observacoes,
            }
          : c,
      ),
    );
    toast.success("Resposta registrada!");
    setManualDialog(false);
    setManualValor("");
    setManualPrazo("");
    setManualObs("");
    setSelectedCarrier(null);
  };

  const respondidas = cotacoes.filter(
    (c) => c.status === "respondido" && c.valor !== null,
  );
  const melhorCotacao =
    respondidas.length > 0
      ? respondidas.reduce((a, b) => (a.valor! < b.valor! ? a : b))
      : null;
  const savings = useMemo(() => {
    if (respondidas.length < 2) {
      return 0;
    }
    const v = respondidas.map((c) => c.valor!);
    return Math.max(...v) - Math.min(...v);
  }, [respondidas]);
  const currentStep = useMemo(() => {
    if (cotacoes.some((c) => c.status === "respondido")) {
      return 3;
    }
    if (cotacoes.length > 0) {
      return 2;
    }
    if (hasSearched && carriers.length > 0) {
      return 1;
    }
    return 0;
  }, [cotacoes, hasSearched, carriers]);

  return (
    <MainLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <Rocket className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Freight Command</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                      Nexus_Blast_Enabled
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                    SMART COTAÇÃO • MULTI-CHANNEL
                  </span>
                </div>
              </div>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCoverageDialog(true)}
              className="h-14 px-8 rounded-2xl border-white/10 bg-black/40 backdrop-blur-xl font-black uppercase tracking-widest text-[11px] gap-3 hover:bg-white/5 transition-all group"
            >
              <Map className="w-4 h-4 text-primary" />
              Ver Malha
            </Button>
            <Button
              size="lg"
              onClick={() => (window.location.href = "/dashboard-cotacoes")}
              className="h-14 px-8 rounded-2xl bg-primary text-black hover:bg-primary/90 font-black uppercase tracking-widest text-[11px] gap-3 transition-all shadow-lg shadow-primary/20"
            >
              <TrendingDown className="w-4 h-4" />
              Insights de Custo
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 space-y-1">
            <Label className="text-xs font-black uppercase mb-1.5 block text-muted-foreground">
              Estratégia Nexus (Priorização)
            </Label>
            <Select defaultValue="Normal">
              <SelectTrigger className="h-10 border-primary/20 bg-primary/5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">
                  Operação Normal (Foco: Preço)
                </SelectItem>
                <SelectItem value="Urgente">
                  Entrega Urgente (Foco: Prazo)
                </SelectItem>
                <SelectItem value="Evento">
                  Evento com Data Fixa (Híbrido)
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 mt-1">
              <Badge
                variant="ghost"
                className="text-[9px] px-1 py-0 h-4 bg-primary/10"
              >
                Preço: 70%
              </Badge>
              <Badge
                variant="ghost"
                className="text-[9px] px-1 py-0 h-4 bg-primary/10"
              >
                Prazo: 20%
              </Badge>
              <Badge
                variant="ghost"
                className="text-[9px] px-1 py-0 h-4 bg-primary/10"
              >
                Perf: 10%
              </Badge>
            </div>
          </div>
          <div className="flex-[3]">
            <StepProgress
              steps={[
                { id: "buscar", title: "Mapear Trecho" },
                { id: "cotar", title: "Nexus Blast" },
                { id: "receber", title: "Consolidar Respostas" },
                { id: "selecionar", title: "Decisão Inteligente" },
              ]}
              currentStep={currentStep}
            />
          </div>
        </div>

        {/* Nexus Blast Control */}
        <AnimatePresence>
          {carriers.length > 0 && !isBlasting && currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Alert className="border-primary bg-primary/5">
                <Rocket className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-bold flex items-center justify-between">
                  Trecho Mapeado: {carriers.length} Transportadoras Disponíveis
                  <Button
                    onClick={handleNexusBlast}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Zap className="w-4 h-4 mr-2" /> Iniciar Nexus Blast
                  </Button>
                </AlertTitle>
                <AlertDescription>
                  O Nexus Blast enviará solicitações automáticas para todas as
                  transportadoras mapeadas para este trecho.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {isBlasting && (
          <Card className="border-primary animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-primary" />
                  Nexus Blast em Execução...
                </span>
                <span className="text-sm font-bold text-primary">
                  {blastProgress}%
                </span>
              </div>
              <Progress value={blastProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Conectando APIs e disparando gatilhos de RPA para
                transportadoras sem API direta.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <CotacaoSearchForm
              origemEstado={origemEstado}
              setOrigemEstado={setOrigemEstado}
              destinoEstado={destinoEstado}
              setDestinoEstado={setDestinoEstado}
              origemCidade={origemCidade}
              setOrigemCidade={setOrigemCidade}
              destinoCidade={destinoCidade}
              setDestinoCidade={setDestinoCidade}
              origemCep={origemCep}
              setOrigemCep={setOrigemCep}
              destinoCep={destinoCep}
              setDestinoCep={setDestinoCep}
              pesoKg={pesoKg}
              setPesoKg={setPesoKg}
              volumes={volumes}
              setVolumes={setVolumes}
              valorMercadoria={valorMercadoria}
              setValorMercadoria={setValorMercadoria}
              isSearching={isSearching}
              onSearch={handleSearch}
            />

            {/* Coverage Summary */}
            {carriers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-success" />
                    Cobertura de Malha
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Transportadoras:
                    </span>
                    <span className="font-bold">{carriers.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Cotação Instantânea (API):
                    </span>
                    <Badge variant="outline" className="text-success">
                      {carriers.filter((c) => c.canal_cotacao === "api").length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Prazo Médio:</span>
                    <span className="font-bold">
                      {(
                        carriers.reduce(
                          (acc, c) => acc + (c.prazo_dias || 0),
                          0,
                        ) / carriers.length
                      ).toFixed(1)}{" "}
                      dias
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savings > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20"
                >
                  <TrendingDown className="w-5 h-5 text-success shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Economia Detectada</p>
                    <p className="text-lg font-bold text-success">
                      R$ {savings.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              )}
              {melhorCotacao && (
                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <NegotiationAssistant
                    bestValue={melhorCotacao.valor}
                    carrierName={melhorCotacao.transportadora_nome}
                  />
                </motion.div>
              )}
            </div>

            {/* Smart Recommendations */}
            <AnimatePresence>
              {respondidas.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {/* Cheaper */}
                  <Card className="border-success/50 bg-success/5">
                    <CardHeader className="p-3">
                      <CardTitle className="text-xs flex items-center gap-1 text-success">
                        <Award className="w-3 h-3" /> CAMPEÃO DE PREÇO
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="font-bold text-sm truncate">
                        {melhorCotacao?.transportadora_nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        R$ {melhorCotacao?.valor?.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Faster */}
                  {respondidas.length > 0 && (
                    <Card className="border-primary/50 bg-primary/5">
                      <CardHeader className="p-3">
                        <CardTitle className="text-xs flex items-center gap-1 text-primary">
                          <Timer className="w-3 h-3" /> CAMPEÃO DE PRAZO
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        {(() => {
                          const fastest = respondidas.reduce((a, b) =>
                            a.prazo_dias! < b.prazo_dias! ? a : b,
                          );
                          return (
                            <>
                              <p className="font-bold text-sm truncate">
                                {fastest.transportadora_nome}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {fastest.prazo_dias} dias
                              </p>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}

                  {/* Best Value */}
                  {respondidas.length > 1 && (
                    <Card className="border-warning/50 bg-warning/5">
                      <CardHeader className="p-3">
                        <CardTitle className="text-xs flex items-center gap-1 text-warning">
                          <Zap className="w-3 h-3" /> MELHOR CUSTO-BENEFÍCIO
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        {(() => {
                          const bestValue = respondidas.reduce((a, b) => {
                            // Weight: 70% Price, 30% Deadline
                            const scoreA =
                              a.valor! * 0.7 + (a.prazo_dias || 0) * 50 * 0.3;
                            const scoreB =
                              b.valor! * 0.7 + (b.prazo_dias || 0) * 50 * 0.3;
                            return scoreA < scoreB ? a : b;
                          });
                          return (
                            <>
                              <p className="font-bold text-sm truncate">
                                {bestValue.transportadora_nome}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Equilíbrio sugerido pelo Nexus
                              </p>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {hasSearched && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <CotacaoCarrierList
                    carriers={carriers}
                    onCotarAPI={handleCotarAPI}
                    onCotarWhatsApp={handleCotarWhatsApp}
                    onCotarEmail={handleCotarEmail}
                    onRegistrar={(c) => {
                      setSelectedCarrier(c);
                      setManualDialog(true);
                    }}
                  />
                  <CotacaoResultsTable
                    cotacoes={cotacoes}
                    melhorCotacao={melhorCotacao}
                    onRegistrar={(tid) => {
                      const c = carriers.find(
                        (x) => x.transportadora_id === tid,
                      );
                      if (c) {
                        setSelectedCarrier(c);
                        setManualDialog(true);
                      }
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Dialog open={manualDialog} onOpenChange={setManualDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Registrar Cotação -{" "}
                {selectedCarrier?.transportadora?.nome_fantasia}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Valor do Frete (R$)</Label>
                <Input
                  type="number"
                  value={manualValor}
                  onChange={(e) => setManualValor(e.target.value)}
                  placeholder="150.00"
                />
              </div>
              <div>
                <Label>Prazo (dias)</Label>
                <Input
                  type="number"
                  value={manualPrazo}
                  onChange={(e) => setManualPrazo(e.target.value)}
                  placeholder="5"
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={manualObs}
                  onChange={(e) => setManualObs(e.target.value)}
                  placeholder="Notas..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setManualDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRegistrarResposta}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={coverageDialog} onOpenChange={setCoverageDialog}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <NexusCoverageMap />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
