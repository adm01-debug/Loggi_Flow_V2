CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
 RETURNS TABLE(permission_code text, permission_name text, module text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT DISTINCT p.code, p.name, p.module
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON rp.role = ur.role
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE ur.user_id = _user_id
  ORDER BY p.module, p.code
$function$
