import { useState, useEffect } from "react";
import { useConfirmExit } from "@/hooks/common/useConfirmExit";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TwoFactorSetup } from "@/components/security/TwoFactorSetup";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Camera,
  Trophy,
  Flame,
  Star,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useGamification } from "@/hooks/gamification/useGamification";
import { useImageUpload } from "@/hooks/data/useImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const { userLevel, achievements } = useGamification();
  const { uploadImage, uploading } = useImageUpload("avatars");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Inicializa o form com o nome vindo do profile na primeira vez que
  // o profile chega. Mantemos em refs para não re-inicializar o state
  // a cada re-render.
  const [form, setForm] = useState(() => ({
    full_name:
      profile?.full_name ||
      (typeof window !== "undefined" &&
        (user?.user_metadata?.full_name as string)) ||
      "",
    phone: (user?.user_metadata?.phone as string) || "",
  }));
  const [hydrated, setHydrated] = useState(false);

  // P22: quando o profile finalmente carrega (ele começa como null
  // durante o fetch), sincronizamos o form com o nome persistido
  // exatamente uma vez. Sem isso, o form ficava com string vazia
  // (porque profile era null no momento do useState inicial) e
  // mostrávamos "Usuário" na tela.
  useEffect(() => {
    if (hydrated) return;
    if (profile?.full_name !== undefined) {
      setForm((prev) => ({
        ...prev,
        full_name: prev.full_name || profile.full_name || "",
      }));
      setHydrated(true);
    }
  }, [profile?.full_name, hydrated]);

  // Dirty-flag: form divergiu do valor persistido (profile ou user_metadata).
  // Comparamos contra o último valor "limpo" conhecido.
  const persistedName =
    profile?.full_name || user?.user_metadata?.full_name || "";
  const isDirty = form.full_name !== persistedName;

  useConfirmExit(isDirty);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: form.full_name })
        .eq("id", user.id);
      if (error) throw error;
      // P21: atualiza o profile em memória para que o cabeçalho/avatar
      // reflitam o novo nome sem precisar de refetch. Se o hook não
      // expuser refreshProfile, ignora — o próximo load já virá correto.
      if (typeof refreshProfile === "function") {
        await refreshProfile();
      }
      toast.success("Perfil atualizado!");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      toast.error("Erro: " + message);
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (newPassword.length < 8) {
      toast.error("A nova senha precisa ter pelo menos 8 caracteres");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setNewPassword("");
      toast.success("Senha alterada com sucesso!");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      toast.error("Erro: " + message);
    }
    setChangingPassword(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      // Bucket é privado: envia para pasta do próprio usuário (exigido pelo RLS)
      // e armazena URL assinada (1 ano) para servir sem expor o bucket.
      const result = await uploadImage(file, {
        pathPrefix: user.id,
        signed: true,
      });
      if (result) {
        await supabase
          .from("profiles")
          .update({ avatar_url: result.url })
          .eq("id", user.id);
        toast.success("Avatar atualizado!");
      }
    }
  };

  const stats = userLevel || {
    level: 1,
    current_xp: 0,
    total_xp: 0,
    coins: 0,
    streak_days: 0,
  };
  const unlockedAchievements = (achievements || []).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-display flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <User className="w-6 h-6 text-primary" />
              </div>
              Meu Perfil
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas informações
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <Badge
                variant="outline"
                className="text-warning border-warning animate-pulse"
              >
                Alterações não salvas
              </Badge>
            )}
            <Button onClick={handleSave} disabled={saving || !isDirty}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card-base p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-primary" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary/90">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
              </label>
            </div>
            <h2 className="text-xl font-bold">{form.full_name || "Usuário"}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge className="mt-2">Nível {stats.level}</Badge>
          </div>
          <div className="lg:col-span-2">
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="gamification">Gamificação</TabsTrigger>
                <TabsTrigger value="security">Segurança</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="card-base p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Completo</Label>
                    <Input
                      value={form.full_name}
                      onChange={(e) =>
                        setForm({ ...form, full_name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled />
                </div>
              </TabsContent>
              <TabsContent value="gamification" className="card-base p-6">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <Star className="w-6 h-6 text-coins mx-auto mb-1" />
                    <p className="text-2xl font-bold">{stats.level}</p>
                    <p className="text-xs text-muted-foreground">Nível</p>
                  </div>
                  <div className="text-center">
                    <Trophy className="w-6 h-6 text-xp mx-auto mb-1" />
                    <p className="text-2xl font-bold">{stats.total_xp}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                  <div className="text-center">
                    <Flame className="w-6 h-6 text-streak mx-auto mb-1" />
                    <p className="text-2xl font-bold">{stats.streak_days}</p>
                    <p className="text-xs text-muted-foreground">Streak</p>
                  </div>
                  <div className="text-center">
                    <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-1" />
                    <p className="text-2xl font-bold">{unlockedAchievements}</p>
                    <p className="text-xs text-muted-foreground">Conquistas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-coins">
                  <span className="text-2xl">🪙</span>
                  <span className="text-xl font-bold">{stats.coins}</span>
                  <span className="text-sm">moedas</span>
                </div>
              </TabsContent>
              <TabsContent value="security" className="space-y-4">
                <div className="card-base p-6 space-y-4">
                  <div>
                    <Label>Alterar Senha</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="password"
                        placeholder="Nova senha (mínimo 8 caracteres)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            void handleChangePassword();
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => void handleChangePassword()}
                        disabled={changingPassword || !newPassword}
                      >
                        {changingPassword ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Alterar
                      </Button>
                    </div>
                  </div>
                </div>
                <TwoFactorSetup />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
