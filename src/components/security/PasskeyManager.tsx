import { useEffect, useState } from "react";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Fingerprint, Plus, Trash2, Edit2, Smartphone, Laptop, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function PasskeyManager() {
  const {
    isLoading,
    isSupported,
    credentials,
    checkSupport,
    fetchCredentials,
    registerPasskey,
    deletePasskey,
    renamePasskey,
  } = useWebAuthn();

  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [passkeyName, setPasskeyName] = useState("");

  useEffect(() => {
    checkSupport();
    fetchCredentials();
  }, [checkSupport, fetchCredentials]);

  const handleRegister = async () => {
    const success = await registerPasskey(passkeyName || undefined);
    if (success) {
      setShowRegisterDialog(false);
      setPasskeyName("");
    }
  };

  const handleRename = async () => {
    if (selectedCredential && newName.trim()) {
      await renamePasskey(selectedCredential, newName.trim());
      setShowRenameDialog(false);
      setSelectedCredential(null);
      setNewName("");
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    if (deviceType?.includes("iOS") || deviceType?.includes("Android")) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Laptop className="h-5 w-5" />;
  };

  if (isSupported === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Passkeys / Biometria
          </CardTitle>
          <CardDescription>Login sem senha usando biometria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Não suportado</p>
              <p className="text-sm text-muted-foreground">
                Seu navegador ou dispositivo não suporta autenticação biométrica (WebAuthn).
              </p>
            </div>
          </div>
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
              <Fingerprint className="h-5 w-5" />
              Passkeys / Biometria
            </CardTitle>
            <CardDescription>
              Login sem senha usando biometria do seu dispositivo
            </CardDescription>
          </div>
          <Button onClick={() => setShowRegisterDialog(true)} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Passkey
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSupported && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="text-sm">
              Seu dispositivo suporta autenticação biométrica
            </span>
          </div>
        )}

        {credentials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Fingerprint className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma passkey registrada</p>
            <p className="text-sm mt-1">
              Adicione uma passkey para fazer login com biometria
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {credentials.map((credential) => (
              <div
                key={credential.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(credential.device_type)}
                  <div>
                    <p className="font-medium">
                      {credential.friendly_name || "Passkey"}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{credential.device_type || "Dispositivo desconhecido"}</span>
                      {credential.last_used_at && (
                        <>
                          <span>•</span>
                          <span>
                            Usado{" "}
                            {formatDistanceToNow(new Date(credential.last_used_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Criada{" "}
                    {formatDistanceToNow(new Date(credential.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedCredential(credential.id);
                      setNewName(credential.friendly_name || "");
                      setShowRenameDialog(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover Passkey</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover esta passkey? Você não poderá mais usar
                          este dispositivo para login biométrico.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePasskey(credential.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Register Dialog */}
        <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Registrar Nova Passkey
              </DialogTitle>
              <DialogDescription>
                Use a biometria do seu dispositivo (impressão digital, Face ID, Windows Hello)
                para criar uma passkey para login sem senha.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Nome da Passkey (opcional)
                </label>
                <Input
                  placeholder="Ex: iPhone do João, Notebook do trabalho"
                  value={passkeyName}
                  onChange={(e) => setPasskeyName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Um nome amigável para identificar este dispositivo
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRegister} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Aguardando...
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4 mr-2" />
                    Registrar com Biometria
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Dialog */}
        <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renomear Passkey</DialogTitle>
              <DialogDescription>
                Altere o nome amigável desta passkey
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Nome da passkey"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRename} disabled={!newName.trim()}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
