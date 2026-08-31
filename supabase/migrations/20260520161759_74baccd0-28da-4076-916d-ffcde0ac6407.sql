-- Table for Tactical Logs
CREATE TABLE public.nexus_tactical_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT,
  event_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warn', 'crit')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for BioSync Telemetry
CREATE TABLE public.bio_sync_telemetry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  heart_rate INTEGER NOT NULL,
  fatigue_index TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nexus_tactical_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bio_sync_telemetry ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for logs" ON public.nexus_tactical_logs FOR SELECT USING (true);
CREATE POLICY "Public insert access for logs" ON public.nexus_tactical_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for bio" ON public.bio_sync_telemetry FOR SELECT USING (true);
CREATE POLICY "Public insert access for bio" ON public.bio_sync_telemetry FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_logs_vehicle ON public.nexus_tactical_logs(vehicle_id);
CREATE INDEX idx_logs_time ON public.nexus_tactical_logs(event_time);
CREATE INDEX idx_bio_time ON public.bio_sync_telemetry(timestamp);
