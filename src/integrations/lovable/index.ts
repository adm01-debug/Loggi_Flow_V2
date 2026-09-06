// Migrado de @lovable.dev/cloud-auth-js para OAuth nativo Supabase (destino jvfhclubfpxrtrrazrgr).
// O cloud-auth-js emitia JWTs do projeto origem — incompatível após cutover.

import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (
      provider: "google" | "apple",
      opts?: SignInOptions,
    ) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: opts?.redirect_uri,
          queryParams: opts?.extraParams,
        },
      });

      if (error) {
        return { error };
      }

      return { redirected: true, data };
    },
  },
};
