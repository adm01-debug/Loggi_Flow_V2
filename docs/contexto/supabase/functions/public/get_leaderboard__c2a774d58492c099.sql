CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count integer DEFAULT 100, period_filter text DEFAULT 'all'::text)
 RETURNS TABLE(user_id uuid, full_name text, avatar_url text, total_xp integer, level integer, coins integer, streak_days integer, achievements_count bigint, rank bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ul.user_id,
    COALESCE(p.full_name, 'Usuário') as full_name,
    p.avatar_url,
    ul.total_xp,
    ul.level,
    ul.coins,
    ul.streak_days,
    COALESCE(ac.achievement_count, 0) as achievements_count,
    ROW_NUMBER() OVER (ORDER BY ul.total_xp DESC) as rank
  FROM user_levels ul
  LEFT JOIN profiles p ON p.id = ul.user_id
  LEFT JOIN (
    SELECT ua.user_id, COUNT(*) as achievement_count
    FROM user_achievements ua
    GROUP BY ua.user_id
  ) ac ON ac.user_id = ul.user_id
  WHERE ul.total_xp > 0
  ORDER BY ul.total_xp DESC
  LIMIT limit_count;
END;
$function$
