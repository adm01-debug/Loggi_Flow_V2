import { MainLayout } from "@/components/layout/MainLayout";
import DriverTrackingMap from "@/components/tracking/DriverTrackingMap";
import RealtimeMonitoringPanel from "@/components/tracking/RealtimeMonitoringPanel";
import { toast } from "sonner";

const RastreamentoMotorista = () => {
  const handleLocationUpdate = (location: any) => {
    console.log('New location received via realtime:', location);
  };

  const handleAlertUpdate = (alert: any) => {
    console.log('New alert received via realtime:', alert);
    if (alert.severity === 'critical' || alert.severity === 'high') {
      toast.error(`Alerta: ${alert.message}`);
    } else if (alert.severity === 'warning' || alert.severity === 'medium') {
      toast.warning(`Alerta: ${alert.message}`);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Rastreamento do Motorista</h1>
          <p className="text-muted-foreground">
            Acompanhe a localização do motorista Lalamove em tempo real com alertas de desvio de rota e paradas
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3">
            <DriverTrackingMap />
          </div>
          <div className="xl:col-span-1">
            <RealtimeMonitoringPanel 
              onLocationUpdate={handleLocationUpdate}
              onAlertUpdate={handleAlertUpdate}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RastreamentoMotorista;
