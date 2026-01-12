import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface WebAuthnCredential {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  device_type: string | null;
  transports: string[] | null;
  friendly_name: string | null;
  created_at: string;
  last_used_at: string | null;
}

// Helper functions for base64url encoding/decoding
function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64URLDecode(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array.buffer);
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "Android";
  if (/iPad|iPhone|iPod/.test(ua)) return "iOS";
  if (/Windows/.test(ua)) return "Windows";
  if (/Mac/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown";
}

export function useWebAuthn() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<WebAuthnCredential[]>([]);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  // Check if WebAuthn is supported
  const checkSupport = useCallback(async () => {
    if (!window.PublicKeyCredential) {
      setIsSupported(false);
      return false;
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setIsSupported(available);
      return available;
    } catch {
      setIsSupported(false);
      return false;
    }
  }, []);

  // Fetch user's registered credentials
  const fetchCredentials = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("webauthn_credentials")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch {
      // Silent fail - credentials list is non-critical
    }
  }, [user]);

  // Register a new passkey
  const registerPasskey = useCallback(async (friendlyName?: string) => {
    if (!user) {
      toast.error("Você precisa estar logado para registrar uma passkey");
      return false;
    }

    const supported = await checkSupport();
    if (!supported) {
      toast.error("Seu dispositivo não suporta autenticação biométrica");
      return false;
    }

    setIsLoading(true);

    try {
      // Generate and store challenge
      const challenge = generateChallenge();
      
      const { error: challengeError } = await supabase
        .from("webauthn_challenges")
        .insert({
          user_id: user.id,
          challenge,
          type: "registration",
        });

      if (challengeError) throw challengeError;

      // Create credential options
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: base64URLDecode(challenge),
        rp: {
          name: "LogiFlow",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(user.id),
          name: user.email || "user",
          displayName: user.email?.split("@")[0] || "User",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },  // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      };

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Falha ao criar credencial");
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      
      // Extract public key
      const publicKeyBuffer = response.getPublicKey?.();
      const publicKey = publicKeyBuffer ? base64URLEncode(publicKeyBuffer) : base64URLEncode(response.attestationObject);

      // Get transports if available
      const transports = response.getTransports?.() || [];

      // Store credential in database
      const { error: insertError } = await supabase
        .from("webauthn_credentials")
        .insert({
          user_id: user.id,
          credential_id: base64URLEncode(credential.rawId),
          public_key: publicKey,
          counter: 0,
          device_type: getDeviceType(),
          transports,
          friendly_name: friendlyName || `${getDeviceType()} - ${new Date().toLocaleDateString()}`,
        });

      if (insertError) throw insertError;

      // Log security event
      await supabase.from("security_events").insert({
        user_id: user.id,
        event_type: "passkey_registered",
        description: `Nova passkey registrada: ${friendlyName || getDeviceType()}`,
        severity: "info",
      });

      toast.success("Passkey registrada com sucesso!");
      await fetchCredentials();
      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          toast.error("Registro cancelado pelo usuário");
        } else if (error.name === "SecurityError") {
          toast.error("Erro de segurança. Verifique se está usando HTTPS");
        } else {
          toast.error("Erro ao registrar passkey");
        }
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, checkSupport, fetchCredentials]);

  // Authenticate with passkey
  const authenticateWithPasskey = useCallback(async (email?: string) => {
    const supported = await checkSupport();
    if (!supported) {
      toast.error("Seu dispositivo não suporta autenticação biométrica");
      return null;
    }

    setIsLoading(true);

    try {
      // Generate challenge
      const challenge = generateChallenge();
      
      // Store challenge without user_id (for login)
      const { error: challengeError } = await supabase
        .from("webauthn_challenges")
        .insert({
          challenge,
          type: "authentication",
        });

      if (challengeError) throw challengeError;

      // Get allowed credentials if we have the email
      let allowCredentials: PublicKeyCredentialDescriptor[] | undefined;
      
      if (email) {
        // Try to find user's credentials by looking up their profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (profileData) {
          const { data: userCredentials } = await supabase
            .from("webauthn_credentials")
            .select("credential_id, transports")
            .eq("user_id", profileData.id);

          if (userCredentials && userCredentials.length > 0) {
            allowCredentials = userCredentials.map((cred) => ({
              type: "public-key" as const,
              id: base64URLDecode(cred.credential_id),
              transports: (cred.transports as AuthenticatorTransport[]) || undefined,
            }));
          }
        }
      }

      // Create authentication options
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: base64URLDecode(challenge),
        rpId: window.location.hostname,
        userVerification: "required",
        timeout: 60000,
        allowCredentials,
      };

      // Get credential
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Autenticação falhou");
      }

      const credentialId = base64URLEncode(credential.rawId);

      // Find the credential in database
      const { data: storedCredential, error: findError } = await supabase
        .from("webauthn_credentials")
        .select("*, profiles!webauthn_credentials_user_id_fkey(email)")
        .eq("credential_id", credentialId)
        .maybeSingle();

      if (findError || !storedCredential) {
        throw new Error("Credencial não encontrada");
      }

      // Update counter and last_used_at
      const response = credential.response as AuthenticatorAssertionResponse;
      const authenticatorData = new Uint8Array(response.authenticatorData);
      const counter = new DataView(authenticatorData.buffer).getUint32(33, false);

      await supabase
        .from("webauthn_credentials")
        .update({
          counter,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", storedCredential.id);

      // Log security event
      await supabase.from("security_events").insert({
        user_id: storedCredential.user_id,
        event_type: "passkey_authentication",
        description: "Login realizado com passkey",
        severity: "info",
      });

      toast.success("Autenticação biométrica bem-sucedida!");
      
      return {
        userId: storedCredential.user_id,
        credentialId: storedCredential.credential_id,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          toast.error("Autenticação cancelada");
        } else {
          toast.error("Erro na autenticação biométrica");
        }
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [checkSupport]);

  // Delete a passkey
  const deletePasskey = useCallback(async (credentialId: string) => {
    if (!user) return false;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("webauthn_credentials")
        .delete()
        .eq("id", credentialId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Log security event
      await supabase.from("security_events").insert({
        user_id: user.id,
        event_type: "passkey_deleted",
        description: "Passkey removida",
        severity: "warning",
      });

      toast.success("Passkey removida com sucesso");
      await fetchCredentials();
      return true;
    } catch {
      toast.error("Erro ao remover passkey");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchCredentials]);

  // Rename a passkey
  const renamePasskey = useCallback(async (credentialId: string, newName: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("webauthn_credentials")
        .update({ friendly_name: newName })
        .eq("id", credentialId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Nome atualizado");
      await fetchCredentials();
      return true;
    } catch {
      toast.error("Erro ao renomear passkey");
      return false;
    }
  }, [user, fetchCredentials]);

  return {
    isLoading,
    isSupported,
    credentials,
    checkSupport,
    fetchCredentials,
    registerPasskey,
    authenticateWithPasskey,
    deletePasskey,
    renamePasskey,
  };
}
