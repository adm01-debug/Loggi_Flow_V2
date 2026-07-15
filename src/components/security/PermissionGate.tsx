import { ReactNode } from "react";
import { usePermissions } from "@/hooks/auth/usePermissions";
import { useAuth } from "@/hooks/auth/useAuth";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  requireAdmin?: boolean;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

export function PermissionGate({
  children,
  permission,
  permissions = [],
  requireAll = false,
  requireAdmin = false,
  fallback,
  showAccessDenied = false,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } =
    usePermissions();
  const { isAdmin, user } = useAuth();

  // If not authenticated, don't show anything
  if (!user) {
    return fallback || null;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return showAccessDenied ? <AccessDenied /> : fallback || null;
  }

  // If loading, optionally show nothing or a skeleton
  if (isLoading) {
    return null;
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return showAccessDenied ? (
      <AccessDenied permission={permission} />
    ) : (
      fallback || null
    );
  }

  // Check multiple permissions
  if (permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasAccess) {
      return showAccessDenied ? (
        <AccessDenied permissions={permissions} />
      ) : (
        fallback || null
      );
    }
  }

  return <>{children}</>;
}

interface AccessDeniedProps {
  permission?: string;
  permissions?: string[];
}

function AccessDenied({ permission, permissions }: AccessDeniedProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="rounded-full bg-destructive/10 p-3 mb-4">
          <Lock className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="font-semibold text-destructive mb-2">Acesso Restrito</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Você não tem permissão para acessar este recurso.
          {(permission || permissions) && (
            <span className="block mt-1 text-xs opacity-75">
              Permissão necessária: {permission || permissions?.join(", ")}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

// Higher-order component version
// eslint-disable-next-line react-refresh/only-export-components
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: string,
  fallback?: ReactNode,
) {
  return function WithPermissionComponent(props: P) {
    return (
      <PermissionGate permission={permission} fallback={fallback}>
        <WrappedComponent {...props} />
      </PermissionGate>
    );
  };
}

// Hook-like usage for conditional rendering
// eslint-disable-next-line react-refresh/only-export-components
export function useCanAccess(permission: string): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
}
