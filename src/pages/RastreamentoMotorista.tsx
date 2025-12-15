import { MainLayout } from "@/components/layout/MainLayout";
import DriverTrackingMap from "@/components/tracking/DriverTrackingMap";

const RastreamentoMotorista = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Rastreamento do Motorista</h1>
          <p className="text-muted-foreground">
            Acompanhe a localização do motorista Lalamove em tempo real com alertas de desvio de rota e paradas
          </p>
        </div>

        <DriverTrackingMap />
      </div>
    </MainLayout>
  );
};

export default RastreamentoMotorista;
