import { MainLayout } from "@/components/layout/MainLayout";
import { Settings, Bell, User, Shield, Palette, Link2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Configuracoes() {
  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-display text-foreground flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent">
              <Settings className="w-6 h-6 text-accent-foreground" />
            </div>
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as configurações do sistema
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Profile */}
          <div className="card-base space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold text-lg">Perfil</h2>
            </div>
            <Separator />
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nome completo</p>
                  <p className="text-sm text-muted-foreground">João Silva</p>
                </div>
                <Button variant="outline" size="sm">Editar</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">joao@empresa.com</p>
                </div>
                <Button variant="outline" size="sm">Editar</Button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="card-base space-y-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-warning" />
              <h2 className="font-display font-semibold text-lg">Notificações</h2>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-freight" className="flex flex-col gap-1">
                  <span>Novos fretes</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    Receber notificações de novos fretes atribuídos
                  </span>
                </Label>
                <Switch id="notify-freight" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-delivery" className="flex flex-col gap-1">
                  <span>Entregas concluídas</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    Notificar quando uma entrega for finalizada
                  </span>
                </Label>
                <Switch id="notify-delivery" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-delay" className="flex flex-col gap-1">
                  <span>Alertas de atraso</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    Receber alertas quando fretes estiverem atrasados
                  </span>
                </Label>
                <Switch id="notify-delay" defaultChecked />
              </div>
            </div>
          </div>

          {/* Integrations */}
          <div className="card-base space-y-4">
            <div className="flex items-center gap-3">
              <Link2 className="w-5 h-5 text-info" />
              <h2 className="font-display font-semibold text-lg">Integrações</h2>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2FC6F6]/10 flex items-center justify-center">
                    <span className="font-bold text-[#2FC6F6]">B24</span>
                  </div>
                  <div>
                    <p className="font-medium">Bitrix24</p>
                    <p className="text-sm text-muted-foreground">Sincronização de dados</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Configurar</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Database className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">ERP</p>
                    <p className="text-sm text-muted-foreground">Sistema de gestão</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Configurar</Button>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="card-base space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-success" />
              <h2 className="font-display font-semibold text-lg">Segurança</h2>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alterar senha</p>
                  <p className="text-sm text-muted-foreground">Última alteração há 30 dias</p>
                </div>
                <Button variant="outline" size="sm">Alterar</Button>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="2fa" className="flex flex-col gap-1">
                  <span>Autenticação em dois fatores</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    Adicione uma camada extra de segurança
                  </span>
                </Label>
                <Switch id="2fa" />
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="card-base space-y-4">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-xp" />
              <h2 className="font-display font-semibold text-lg">Aparência</h2>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex flex-col gap-1">
                <span>Modo escuro</span>
                <span className="text-sm text-muted-foreground font-normal">
                  Alternar entre tema claro e escuro
                </span>
              </Label>
              <Switch id="dark-mode" />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
