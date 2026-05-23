import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";

interface Permission {
  permission_code: string;
  permission_name: string;
  module: string;
}

export function usePermissions() {
  const { user } = useAuth();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["user-permissions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .rpc("get_user_permissions", { _user_id: user.id });
      
      if (error) {
        return [];
      }
      
      return data as Permission[];
    },
    enabled: !!user?.id,
    staleTime: QUERY_STALE_TIME.STATIC,
  });

  const hasPermission = (permissionCode: string): boolean => {
    return permissions.some((p) => p.permission_code === permissionCode);
  };

  const hasAnyPermission = (permissionCodes: string[]): boolean => {
    return permissionCodes.some((code) => hasPermission(code));
  };

  const hasAllPermissions = (permissionCodes: string[]): boolean => {
    return permissionCodes.every((code) => hasPermission(code));
  };

  const getPermissionsByModule = (module: string): Permission[] => {
    return permissions.filter((p) => p.module === module);
  };

  const modules = [...new Set(permissions.map((p) => p.module))];

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionsByModule,
    modules,
  };
}
