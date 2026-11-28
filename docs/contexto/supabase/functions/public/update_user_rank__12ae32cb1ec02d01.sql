CREATE OR REPLACE FUNCTION public.update_user_rank()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE public.user_levels
    SET rank_id = (
        SELECT id FROM public.user_ranks 
        WHERE min_level <= NEW.level 
        ORDER BY min_level DESC 
        LIMIT 1
    )
    WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$function$
