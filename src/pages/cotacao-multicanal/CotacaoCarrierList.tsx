import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { Truck, Globe, MessageCircle, Mail, Clock, DollarSign, Phone, Star, Plus } from "lucide-react";
import { motion } from "framer-motion";
import type { TransportadoraComCanal } from "./types";

function canalBadge(canal: string) {
  switch (canal) {
    case 'api': return <Badge className="bg-success/10 text-success border-success/20"><Globe className="w-3 h-3 mr-1" />API</Badge>;
    case 'whatsapp': return <Badge className="bg-success/10 text-success border-success/20"><MessageCircle className="w-3 h-3 mr-1" />WhatsApp</Badge>;
    case 'email': return <Badge className="bg-primary/10 text-primary border-primary/20"><Mail className="w-3 h-3 mr-1" />Email</Badge>;
    default: return null;
  }
}

interface CotacaoCarrierListProps {
  carriers: TransportadoraComCanal[];
  onCotarAPI: (carrier: TransportadoraComCanal) => void;
  onCotarWhatsApp: (carrier: TransportadoraComCanal) => void;
  onCotarEmail: (carrier: TransportadoraComCanal) => void;
  onRegistrar: (carrier: TransportadoraComCanal) => void;
}

export function CotacaoCarrierList({ carriers, onCotarAPI, onCotarWhatsApp, onCotarEmail, onRegistrar }: CotacaoCarrierListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-base">
            <Truck className="w-5 h-5" />
            Transportadoras no Trecho ({carriers.length})
          </span>
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="font-normal"><Globe className="w-3 h-3 mr-1" /> API: {carriers.filter(c => c.canal_cotacao === 'api').length}</Badge>
            <Badge variant="outline" className="font-normal"><MessageCircle className="w-3 h-3 mr-1" /> WhatsApp: {carriers.filter(c => c.canal_cotacao === 'whatsapp').length}</Badge>
            <Badge variant="outline" className="font-normal"><Mail className="w-3 h-3 mr-1" /> Email: {carriers.filter(c => c.canal_cotacao === 'email').length}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {carriers.length === 0 ? (
          <EmptyState icon={Truck} title="Nenhuma transportadora para este trecho" description="Cadastre rotas em Rede Logística → Rotas" />
        ) : (
          <div className="space-y-3">
            {carriers.map((carrier, idx) => (
              <motion.div
                key={carrier.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary/30 transition-colors bg-card"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold truncate">{carrier.transportadora?.nome_fantasia}</p>
                    {canalBadge(carrier.canal_cotacao)}
                    {carrier.transportadora?.score_performance && carrier.transportadora.score_performance > 80 && (
                      <Badge variant="outline" className="text-warning border-warning/30">
                        <Star className="w-3 h-3 mr-1" />{carrier.transportadora.score_performance}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {carrier.prazo_dias} dias</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> R$ {carrier.preco_por_kg?.toFixed(2)}/kg</span>
                    {carrier.whatsapp && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {carrier.whatsapp}</span>}
                    {carrier.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {carrier.email}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {carrier.canal_cotacao === 'api' ? (
                    <Button size="sm" onClick={() => onCotarAPI(carrier)}><Globe className="w-4 h-4 mr-1" />Cotar API</Button>
                  ) : (
                    <>
                      {carrier.whatsapp && (
                        <Button size="sm" variant="outline" className="text-success border-success/20 hover:bg-success/10" onClick={() => onCotarWhatsApp(carrier)}>
                          <MessageCircle className="w-4 h-4 mr-1" />WhatsApp
                        </Button>
                      )}
                      {carrier.email && (
                        <Button size="sm" variant="outline" className="text-primary border-primary/20 hover:bg-primary/10" onClick={() => onCotarEmail(carrier)}>
                          <Mail className="w-4 h-4 mr-1" />Email
                        </Button>
                      )}
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => onRegistrar(carrier)}>
                    <Plus className="w-4 h-4 mr-1" />Registrar
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
