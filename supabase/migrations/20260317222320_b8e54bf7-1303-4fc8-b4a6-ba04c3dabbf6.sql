
-- The handle_new_user_levels trigger runs as SECURITY DEFINER which bypasses RLS,
-- so the service_role restriction won't break it.
-- But handle_new_user also inserts into profiles - verify it's SECURITY DEFINER too.
-- Both are already SECURITY DEFINER, so they bypass RLS. No changes needed.

-- Enable leaked password protection is an auth config, not SQL.
-- Just add a note that it's handled via auth config tool.
SELECT 1;
