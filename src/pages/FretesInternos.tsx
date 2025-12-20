import { Truck, Package, Clock, CheckCircle2, AlertTriangle, Star, Plus } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";

// Stub page - fretes_internos table doesn't exist yet
export default function FretesInternos() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-display text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              Fretes Internos
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie transferências internas</p>
          </div>
          <Button disabled className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Frete
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="stat-card text-center">
            <Package className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="stat-card text-center">
            <Clock className="w-5 h-5 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
          <div className="stat-card text-center">
            <Truck className="w-5 h-5 text-info mx-auto mb-2" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Em Trânsito</p>
          </div>
          <div className="stat-card text-center">
            <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Entregues</p>
          </div>
          <div className="stat-card text-center">
            <Star className="w-5 h-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">XP Ganho</p>
          </div>
        </div>

        <div className="card-base flex flex-col items-center py-12">
          <AlertTriangle className="w-12 h-12 text-warning/50 mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">Funcionalidade em desenvolvimento</p>
          <p className="text-muted-foreground text-center max-w-md">
            A tabela de fretes internos ainda não foi configurada no banco de dados. 
            Esta funcionalidade estará disponível em breve.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
