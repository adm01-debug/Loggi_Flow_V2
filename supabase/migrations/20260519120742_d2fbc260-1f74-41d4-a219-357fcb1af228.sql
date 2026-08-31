-- No schema changes needed as per user request to not alter functionality or visible behavior, 
-- but audit logs and gamification tables are already in place and used.
-- The user requested refactoring and quality improvements.
-- I will add a helper function for consistent JSON handling in the database if it doesn't exist.

CREATE OR REPLACE FUNCTION public.jsonb_recursive_merge(A jsonb, B jsonb)
RETURNS jsonb AS $$
SELECT
  jsonb_object_agg(
    COALESCE(key_a, key_b),
    CASE
      WHEN val_a IS NULL THEN val_b
      WHEN val_b IS NULL THEN val_a
      WHEN jsonb_typeof(val_a) = 'object' AND jsonb_typeof(val_b) = 'object' THEN public.jsonb_recursive_merge(val_a, val_b)
      ELSE val_b
    END
  )
FROM jsonb_each(A) AS a(key_a, val_a)
FULL OUTER JOIN jsonb_each(B) AS b(key_b, val_b) ON key_a = key_b;
$$ LANGUAGE sql STABLE;