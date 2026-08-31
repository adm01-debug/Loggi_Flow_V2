/* eslint-disable sonarjs/no-nested-functions */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Shield, Save } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
}

interface RolePermission {
  id: string;
  role: string;
  permission_id: string;
}

type AppRole = "admin" | "user";

const ROLES: { value: AppRole; label: string; color: string }[] = [
  { value: "admin", label: "Administrador", color: "bg-red-500" },
  { value: "user", label: "Usuário", color: "bg-blue-500" },
];

export function PermissionMatrix() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(
    new Map(),
  );

  // Fetch all permissions
  const { data: permissions = [], isLoading: isLoadingPermissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("module", { ascending: true })
        .order("code", { ascending: true });

      if (error) throw error;
      return data as Permission[];
    },
  });

  // Fetch role permissions
  const { data: rolePermissions = [], isLoading: isLoadingRolePermissions } =
    useQuery({
      queryKey: ["role-permissions"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("role_permissions")
          .select("*");

        if (error) throw error;
        return data as RolePermission[];
      },
      enabled: isAdmin,
    });

  // Group permissions by module
  const permissionsByModule = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  // Check if role has permission
  const hasRolePermission = (role: AppRole, permissionId: string): boolean => {
    const key = `${role}-${permissionId}`;
    if (pendingChanges.has(key)) {
      return pendingChanges.get(key)!;
    }
    return rolePermissions.some(
      (rp) => rp.role === role && rp.permission_id === permissionId,
    );
  };

  // Toggle permission
  const togglePermission = (role: AppRole, permissionId: string) => {
    const key = `${role}-${permissionId}`;
    const currentValue = hasRolePermission(role, permissionId);
    setPendingChanges((prev) => {
      const newMap = new Map(prev);
      newMap.set(key, !currentValue);
      return newMap;
    });
  };

  // Save changes mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const [key, shouldHave] of pendingChanges.entries()) {
        const [role, permissionId] = key.split("-") as [AppRole, string];
        const currentlyHas = rolePermissions.some(
          (rp) => rp.role === role && rp.permission_id === permissionId,
        );

        if (shouldHave && !currentlyHas) {
          await supabase.from("role_permissions").insert({
            role,
            permission_id: permissionId,
          });
        } else if (!shouldHave && currentlyHas) {
          await supabase
            .from("role_permissions")
            .delete()
            .eq("role", role)
            .eq("permission_id", permissionId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["user-permissions"] });
      setPendingChanges(new Map());
      toast.success("Permissões atualizadas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar permissões");
    },
  });

  const getModuleLabel = (module: string) => {
    const labels: Record<string, string> = {
      dashboard: "Dashboard",
      coletas: "Coletas",
      entregas: "Entregas",
      users: "Usuários",
      security: "Segurança",
      reports: "Relatórios",
      settings: "Configurações",
      analytics: "Analytics",
    };
    return labels[module] || module;
  };

  const isLoading = isLoadingPermissions || isLoadingRolePermissions;

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">
            Apenas administradores podem gerenciar permissões.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Matriz de Permissões
            </CardTitle>
            <CardDescription>
              Configure quais permissões cada role possui no sistema
            </CardDescription>
          </div>
          {pendingChanges.size > 0 && (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Alterações ({pendingChanges.size})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-6">
              {Object.entries(permissionsByModule).map(
                ([module, modulePermissions]) => (
                  <div key={module} className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Badge variant="outline">{getModuleLabel(module)}</Badge>
                    </h3>

                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">
                              Permissão
                            </th>
                            {ROLES.map((role) => (
                              <th
                                key={role.value}
                                className="text-center p-3 font-medium w-32"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${role.color}`}
                                  />
                                  {role.label}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {modulePermissions.map((permission) => (
                            <tr key={permission.id} className="border-t">
                              <td className="p-3">
                                <div>
                                  <p className="font-medium text-sm">
                                    {permission.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {permission.description}
                                  </p>
                                </div>
                              </td>
                              {ROLES.map((role) => (
                                <td
                                  key={role.value}
                                  className="text-center p-3"
                                >
                                  <Checkbox
                                    checked={hasRolePermission(
                                      role.value,
                                      permission.id,
                                    )}
                                    onCheckedChange={() =>
                                      togglePermission(
                                        role.value,
                                        permission.id,
                                      )
                                    }
                                    disabled={role.value === "admin"} // Admin sempre tem tudo
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ),
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
