-- Enable realtime for entregas and coletas tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.entregas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coletas;