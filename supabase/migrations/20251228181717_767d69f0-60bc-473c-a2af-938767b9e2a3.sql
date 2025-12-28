-- Create a function to get leaderboard data securely
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  limit_count INTEGER DEFAULT 100,
  period_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  total_xp INTEGER,
  level INTEGER,
  coins INTEGER,
  streak_days INTEGER,
  achievements_count BIGINT,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_leaderboard TO authenticated;