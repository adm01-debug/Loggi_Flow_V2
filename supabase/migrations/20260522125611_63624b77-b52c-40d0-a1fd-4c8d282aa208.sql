-- Tabela para persistir zonas de risco calculadas pelo OpenWeather
CREATE TABLE IF NOT EXISTS public.risk_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_lat DOUBLE PRECISION NOT NULL,
    center_lng DOUBLE PRECISION NOT NULL,
    radius DOUBLE PRECISION NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    cause TEXT,
    suggested_action TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.risk_zones ENABLE ROW LEVEL SECURITY;

-- Política de visualização para usuários autenticados
CREATE POLICY "Users can view risk zones" ON public.risk_zones
    FOR SELECT USING (auth.role() = 'authenticated');

-- Adicionar colunas de telemetria estendida para anomalias reais
ALTER TABLE public.bio_sync_telemetry 
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info',
ADD COLUMN IF NOT EXISTS cause TEXT,
ADD COLUMN IF NOT EXISTS suggested_action TEXT;

-- Adicionar colunas de clima na tabela de entregas para recálculo de rota
ALTER TABLE public.entregas
ADD COLUMN IF NOT EXISTS weather_risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_weather_update TIMESTAMP WITH TIME ZONE;

-- Função para atualizar log tático automaticamente quando uma anomalia biométrica crítica ocorre
CREATE OR REPLACE FUNCTION public.log_biometric_anomaly()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.severity = 'critical' OR NEW.heart_rate > 110 THEN
        INSERT INTO public.nexus_tactical_logs (
            module, 
            level, 
            message, 
            target_vehicle
        ) VALUES (
            'BIO_SYNC',
            'crit',
            'ANOMALIA DETECTADA: Batimento cardíaco elevado (' || NEW.heart_rate || ' BPM). Alerta de fadiga nível ' || NEW.fatigue_index,
            NEW.vehicle_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para logs táticos
DROP TRIGGER IF EXISTS tr_log_biometric_anomaly ON public.bio_sync_telemetry;
CREATE TRIGGER tr_log_biometric_anomaly
AFTER INSERT ON public.bio_sync_telemetry
FOR EACH ROW EXECUTE FUNCTION public.log_biometric_anomaly();
