import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/auth/useAuth";

interface MFAFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface EnrollmentData {
  id: string;
  type: string;
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

export function useMFA() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Check MFA status
  const checkMFAStatus = useCallback(async () => {
    if (!user) return false;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        return false;
      }

      const verifiedFactors = data.totp.filter((f) => f.status === "verified");
      setFactors(verifiedFactors as MFAFactor[]);
      setIsEnrolled(verifiedFactors.length > 0);
      
      return verifiedFactors.length > 0;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Start MFA enrollment
  const startEnrollment = useCallback(async (friendlyName?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: friendlyName || "Authenticator App",
      });

      if (error) {
        toast.error("Erro ao iniciar configuração do 2FA");
        throw error;
      }

      setEnrollmentData(data as EnrollmentData);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verify and complete enrollment
  const verifyEnrollment = useCallback(async (factorId: string, code: string) => {
    setIsLoading(true);
    try {
      const { data: challengeData, error: challengeError } = 
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) {
        toast.error("Erro ao criar desafio de verificação");
        throw challengeError;
      }

      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (error) {
        toast.error("Código inválido. Tente novamente.");
        throw error;
      }

      setIsEnrolled(true);
      setEnrollmentData(null);
      toast.success("2FA ativado com sucesso!");
      
      // Log security event
      await logSecurityEvent("mfa_enabled", "2FA foi ativado para a conta");
      
      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verify MFA code during login
  const verifyCode = useCallback(async (factorId: string, code: string) => {
    setIsLoading(true);
    try {
      const { data: challengeData, error: challengeError } = 
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) throw challengeError;

      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (error) {
        toast.error("Código inválido");
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disable MFA
  const disableMFA = useCallback(async (factorId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });

      if (error) {
        toast.error("Erro ao desativar 2FA");
        throw error;
      }

      setIsEnrolled(false);
      setFactors([]);
      toast.success("2FA desativado com sucesso");
      
      // Log security event
      await logSecurityEvent("mfa_disabled", "2FA foi desativado para a conta");
      
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get current assurance level
  const getAssuranceLevel = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    
    if (error) {
      return null;
    }
    
    return data;
  }, []);

  // Log security event helper
  const logSecurityEvent = async (eventType: string, description: string) => {
    try {
      await supabase.from("security_events").insert({
        user_id: user?.id,
        event_type: eventType,
        description,
        severity: "info",
      });
    } catch {
      // Silent fail - security event logging is non-critical
    }
  };

  return {
    isLoading,
    factors,
    isEnrolled,
    enrollmentData,
    checkMFAStatus,
    startEnrollment,
    verifyEnrollment,
    verifyCode,
    disableMFA,
    getAssuranceLevel,
  };
}
