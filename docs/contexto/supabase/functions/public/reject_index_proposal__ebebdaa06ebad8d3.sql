CREATE OR REPLACE FUNCTION public.reject_index_proposal(p_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;
  UPDATE public.index_proposals
     SET status = 'rejected',
         error_message = p_reason,
         updated_at = now()
   WHERE id = p_id;
END; $function$
