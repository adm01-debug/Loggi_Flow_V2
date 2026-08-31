import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { authService, Profile } from "@/services/api/authService";

// P25: hidratação instantânea via localStorage.
//
// O `supabase.auth.getSession()` pode demorar indefinidamente (5s+)
// no cold load porque faz uma chamada de rede para o endpoint
// /auth/v1/token?grant_type=refresh_token. Em vez de esperar esse
// round-trip só pra confirmar o que já está no storage, lemos o
// JSON do token diretamente, validamos o `expires_at`, e marcamos
// o usuário como autenticado na hora. As queries do React Query
// disparam imediatamente; a única consequência é que a sessão
// pode estar tecnicamente "stale" (vai expirar em breve) e o
// onAuthStateChange vai disparar SIGNED_IN com a sessão renovada
// logo em seguida.
//
// A chave usada no localStorage segue o padrão do supabase-js v2:
// `sb-<project-ref>-auth-token`.
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "") as string;
const PROJECT_REF = SUPABASE_URL.replace(/^https?:\/\//, "").split(".")[0];
const TOKEN_STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

interface CachedSession {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user?: User;
}

function readSessionFromStorage(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSession;
    const sessionUser = parsed.user;
    if (!sessionUser?.id || !parsed.access_token) return null;

    // Se o token já expirou há mais de 5min, é lixo. Limpamos e
    // forçamos re-login.
    const expiresAt =
      typeof parsed.expires_at === "number"
        ? parsed.expires_at * 1000
        : Date.now() + 60_000;
    if (expiresAt < Date.now() - 5 * 60_000) {
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch {
        // ignore
      }
      return null;
    }

    return {
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token ?? "",
      token_type: parsed.token_type ?? "bearer",
      expires_in: parsed.expires_in ?? 3600,
      expires_at: parsed.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
      user: sessionUser,
    } as Session;
  } catch {
    return null;
  }
}

interface UserRole {
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: string[];
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // P25: inicializa o user com a sessão em cache, se houver. Isso
  // elimina o atraso do getSession() na primeira renderização — o
  // usuário já aparece logado e as queries disparam imediatamente.
  const cachedSession = readSessionFromStorage();
  const [user, setUser] = useState<User | null>(cachedSession?.user ?? null);
  const [session, setSession] = useState<Session | null>(cachedSession);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  // P26: se já temos user em cache, isLoading começa false. Os dados
  // de profile/roles são complementares — não devem bloquear a
  // renderização inicial. Antigamente começava como true e podia
  // ficar travado se fetchUserData pendurasse.
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserData = async (userId: string) => {
    try {
      const [profileData, rolesData] = await Promise.all([
        authService.fetchProfile(userId),
        authService.fetchRoles(userId),
      ]);

      if (profileData) {
        setProfile(profileData);
      }

      if (rolesData) {
        setRoles(rolesData);
      }

      // P14: debounce streak — só chama RPC 1x/dia por user
      const streakKey = `streak_last_${userId}`;
      const today = new Date().toISOString().slice(0, 10);
      if (typeof window !== "undefined" && localStorage.getItem(streakKey) !== today) {
        localStorage.setItem(streakKey, today);
        await authService.updateStreak(userId);
      }

    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // P25: já temos a sessão em cache (do localStorage), então só
    // precisamos buscar profile+roles e deixar o onAuthStateChange
    // renovar a sessão se necessário. Nada de getSession() com
    // timeout 5s.
    //
    // P26: NÃO aguardamos fetchUserData antes de continuar. profile/
    // roles são preenchidos quando chegarem — a renderização inicial
    // segue imediatamente. Isso evita ficar preso no spinner do
    // ProtectedRoute se a rede estiver lenta.
    if (user) {
      fetchUserData(user.id).catch((err) =>
        console.error("[auth] fetchUserData failed:", err),
      );
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        fetchUserData(newSession.user.id).catch((err) =>
          console.error("[auth] fetchUserData failed:", err),
        );
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    // onAuthStateChange vai disparar SIGNED_IN e cuidar de hidratar
    // user/session/profile/roles. Forçamos isLoading=false aqui
    // também para garantir que a tela destrave mesmo se o evento
    // chegar atrasado.
    setIsLoading(false);
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const [profileData, rolesData] = await Promise.all([
      authService.fetchProfile(user.id),
      authService.fetchRoles(user.id),
    ]);
    setProfile(profileData);
    setRoles(rolesData || []);
  };

  const isAdmin = roles.includes("admin");

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isAdmin,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
