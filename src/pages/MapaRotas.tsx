import { MainLayout } from "@/components/layout/MainLayout";
import DeliveryMap from "@/components/map/DeliveryMap";

const MapaRotas = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mapa de Rotas</h1>
          <p className="text-muted-foreground">
            Visualize as entregas ativas e suas rotas em tempo real
          </p>
        </div>

        <DeliveryMap />
      </div>
    </MainLayout>
  );
};

export default MapaRotas;
