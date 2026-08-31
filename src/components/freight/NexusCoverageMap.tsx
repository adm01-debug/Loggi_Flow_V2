/* eslint-disable sonarjs/class-name */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, MapPin, Truck, Globe, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface Praça {
  estado: string;
  cidades: string[];
  transportadoras: string[];
}

const SAMPLE_DATA: Praça[] = [
  { estado: 'SP', cidades: ['São Paulo', 'Campinas', 'Santos'], transportadoras: ['Rodonaves', 'Braspress', 'Loggi'] },
  { estado: 'RJ', cidades: ['Rio de Janeiro', 'Niterói'], transportadoras: ['Braspress', 'Total Express'] },
  { estado: 'MG', cidades: ['Belo Horizonte', 'Uberlândia'], transportadoras: ['Rodonaves', 'Jamef'] },
  { estado: 'PE', cidades: ['Recife', 'Caruaru'], transportadoras: ['Braspress', 'Azul Cargo'] },
];

export function NexusCoverageMap() {
  const [selectedEstado, setSelectedEstado] = useState<string | null>(null);

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
            Abaixo estão as praças mapeadas em nosso banco de dados. O Nexus utiliza esta malha para automatizar as cotações.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {['SP', 'RJ', 'MG', 'PE', 'PR', 'RS', 'SC', 'BA', 'CE', 'DF', 'ES', 'GO'].map((uf) => (
              <Button
                key={uf}
                variant={selectedEstado === uf ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedEstado(uf)}
                className="h-12 text-lg font-bold"
              >
                {uf}
              </Button>
            ))}
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 border relative overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedEstado ? (
              <motion.div
                key={selectedEstado}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Praça: {selectedEstado}
                  </h3>
                  <Badge variant="success">Ativa</Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Principais Cidades</p>
                  <div className="flex flex-wrap gap-1">
                    {SAMPLE_DATA.find(d => d.estado === selectedEstado)?.cidades.map(c => (
                      <Badge key={c} variant="outline" className="font-normal">{c}</Badge>
                    )) || <span className="text-xs italic">Mapeamento em andamento...</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transportadoras Especialistas</p>
                  <div className="space-y-1">
                    {SAMPLE_DATA.find(d => d.estado === selectedEstado)?.transportadoras.map(t => (
                      <div key={t} className="flex items-center gap-2 text-sm p-2 rounded bg-card border">
                        <Truck className="w-4 h-4 text-primary" />
                        <span className="font-medium">{t}</span>
                        <Shield className="w-3 h-3 text-success ml-auto" />
                      </div>
                    )) || <span className="text-xs italic">Consultando banco de rotas...</span>}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                <Map className="w-12 h-12 text-muted/50" />
                <div>
                  <p className="font-medium">Selecione uma Praça</p>
                  <p className="text-sm text-muted-foreground">Para visualizar detalhes da malha logística</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'framer-motion';
