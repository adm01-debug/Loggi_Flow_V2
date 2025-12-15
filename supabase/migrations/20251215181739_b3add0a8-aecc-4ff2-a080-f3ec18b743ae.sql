-- Add latitude and longitude columns to entregas table for geocoded coordinates
ALTER TABLE public.entregas 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on geocoded deliveries
CREATE INDEX IF NOT EXISTS idx_entregas_coordinates ON public.entregas (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.entregas.latitude IS 'Geocoded latitude from delivery address';
COMMENT ON COLUMN public.entregas.longitude IS 'Geocoded longitude from delivery address';
COMMENT ON COLUMN public.entregas.geocoded_at IS 'Timestamp when coordinates were geocoded';