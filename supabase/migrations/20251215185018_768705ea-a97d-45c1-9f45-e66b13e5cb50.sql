-- Enable realtime for tracking tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rastreamento_historico;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rastreamento_alertas;