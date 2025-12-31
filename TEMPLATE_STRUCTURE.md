# 🚀 Template de Estrutura - Guia de Setup

> Passo a passo para criar um novo projeto com a mesma estrutura base do Loggi-Flow.

---

## 📋 Índice

1. [Pré-requisitos](#-pré-requisitos)
2. [Criação do Projeto](#-criação-do-projeto)
3. [Instalação de Dependências](#-instalação-de-dependências)
4. [Configuração do Design System](#-configuração-do-design-system)
5. [Estrutura de Pastas](#-estrutura-de-pastas)
6. [Configuração do Supabase](#-configuração-do-supabase)
7. [Hooks Base](#-hooks-base)
8. [Componentes Comuns](#-componentes-comuns)
9. [Configuração de Rotas](#-configuração-de-rotas)
10. [PWA Setup](#-pwa-setup)
11. [Testes](#-testes)
12. [Checklist Final](#-checklist-final)

---

## 📦 Pré-requisitos

- Node.js 18+ ou Bun
- Conta no Lovable (ou Supabase se externo)
- Git configurado

---

## 🎯 Criação do Projeto

### Opção 1: Via Lovable (Recomendado)

1. Acesse [lovable.dev](https://lovable.dev)
2. Crie um novo projeto
3. O Lovable já configura React + Vite + TypeScript + Tailwind

### Opção 2: Via Terminal (Local)

```bash
# Criar projeto Vite com React + TypeScript
npm create vite@latest meu-projeto -- --template react-ts

# Entrar na pasta
cd meu-projeto

# Instalar dependências base
npm install
```

---

## 📥 Instalação de Dependências

### Dependências Core

```bash
# Supabase
npm install @supabase/supabase-js

# State Management
npm install @tanstack/react-query

# Roteamento
npm install react-router-dom

# Validação
npm install zod react-hook-form @hookform/resolvers
```

### UI Components (Shadcn/UI)

```bash
# Inicializar Shadcn
npx shadcn-ui@latest init

# Instalar componentes essenciais
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add sidebar
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add command
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add accordion
```

### Animações

```bash
npm install framer-motion
npm install tailwindcss-animate
```

### Drag & Drop

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Gráficos

```bash
npm install recharts
```

### Mapas (opcional)

```bash
npm install mapbox-gl
npm install --save-dev @types/mapbox-gl
```

### Datas

```bash
npm install date-fns date-fns-tz react-day-picker
```

### Exportação

```bash
npm install jspdf jspdf-autotable xlsx
```

### Utilitários

```bash
npm install clsx tailwind-merge class-variance-authority
npm install lucide-react
npm install sonner
npm install next-themes
npm install cmdk
npm install input-otp
npm install react-resizable-panels
npm install embla-carousel-react
npm install vaul
npm install react-markdown
```

### Testes (Dev)

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

---

## 🎨 Configuração do Design System

### tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Cores customizadas do projeto
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        info: "hsl(var(--info))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### src/index.css (Variáveis CSS)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
    
    /* Sidebar */
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
    
    /* Custom */
    --success: 142 76% 36%;
    --warning: 38 92% 50%;
    --info: 199 89% 48%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
    
    /* Sidebar Dark */
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 📁 Estrutura de Pastas

Crie a seguinte estrutura:

```bash
mkdir -p src/{components/{common,layout,ui},hooks,pages,lib,integrations/supabase,i18n/locales,test,utils}
mkdir -p public/{icons}
mkdir -p supabase/functions
```

### Estrutura Completa

```
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx
│   ├── common/
│   │   ├── ConfirmDialog.tsx
│   │   ├── DataTable.tsx
│   │   ├── DateRangePicker.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ExportButton.tsx
│   │   ├── FilterBar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── PageHeader.tsx
│   │   ├── Pagination.tsx
│   │   ├── SearchCommand.tsx
│   │   ├── StatsCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── Timeline.tsx
│   │   ├── TooltipWrapper.tsx
│   │   └── index.ts
│   ├── layout/
│   │   ├── AppSidebar.tsx
│   │   ├── Header.tsx
│   │   └── MainLayout.tsx
│   └── ui/
│       └── (shadcn components)
├── hooks/
│   ├── index.ts
│   ├── use-mobile.tsx
│   ├── use-toast.ts
│   ├── useAuth.tsx
│   ├── useDebounce.ts
│   ├── useFilters.ts
│   ├── useForm.tsx
│   ├── useKeyboardShortcuts.ts
│   ├── useLocalStorage.ts
│   ├── usePagination.ts
│   └── useSorting.ts
├── integrations/
│   └── supabase/
│       └── client.ts
├── lib/
│   ├── constants.ts
│   ├── formatters.ts
│   ├── utils.ts
│   └── validations.ts
├── pages/
│   ├── Auth.tsx
│   ├── Index.tsx
│   ├── NotFound.tsx
│   └── Profile.tsx
├── i18n/
│   ├── index.ts
│   └── locales/
│       ├── pt-BR.json
│       ├── en.json
│       └── es.json
├── test/
│   └── setup.ts
├── utils/
│   └── (helpers)
├── App.tsx
├── App.css
├── main.tsx
└── vite-env.d.ts

public/
├── icons/
│   ├── icon-192.svg
│   └── icon-512.svg
├── manifest.json
├── offline.html
├── robots.txt
└── sw.js

supabase/
├── config.toml
└── functions/
    └── (edge functions)
```

---

## ⚡ Configuração do Supabase

### src/integrations/supabase/client.ts

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### .env.example

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=xxx
```

### Tabelas Base (SQL Migration)

```sql
-- ===========================================
-- 1. SISTEMA DE ROLES (OBRIGATÓRIO)
-- ===========================================
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null default 'user',
    created_at timestamptz default now(),
    unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Função de verificação de role (Security Definer)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Policies
create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can manage all roles"
  on public.user_roles for all
  using (has_role(auth.uid(), 'admin'));

-- ===========================================
-- 2. PROFILES
-- ===========================================
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text,
    full_name text,
    avatar_url text,
    cargo text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (has_role(auth.uid(), 'admin'));

-- Trigger para criar profile automaticamente
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ===========================================
-- 3. NOTIFICAÇÕES
-- ===========================================
create type public.notification_type as enum ('info', 'success', 'warning', 'error', 'achievement');

create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    type notification_type default 'info',
    title text not null,
    message text not null,
    action_url text,
    read boolean default false,
    read_at timestamptz,
    metadata jsonb default '{}',
    created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

-- ===========================================
-- 4. AUDIT LOGS (OPCIONAL MAS RECOMENDADO)
-- ===========================================
create table public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    table_name text not null,
    record_id uuid not null,
    action text not null,
    old_data jsonb,
    new_data jsonb,
    changed_fields text[],
    user_id uuid,
    user_email text,
    user_name text,
    ip_address text,
    user_agent text,
    created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;

create policy "Admins can view all audit logs"
  on public.audit_logs for select
  using (has_role(auth.uid(), 'admin'));

create policy "System can insert audit logs"
  on public.audit_logs for insert
  with check (true);
```

---

## 🪝 Hooks Base

### src/hooks/index.ts

```typescript
export { usePagination } from './usePagination';
export { useFilters } from './useFilters';
export { useSorting } from './useSorting';
export { useDebounce } from './useDebounce';
export { useLocalStorage } from './useLocalStorage';
export { useAuth } from './useAuth';
export { useKeyboardShortcut, useGlobalShortcuts } from './useKeyboardShortcuts';
```

### src/hooks/usePagination.ts

```typescript
import { useState, useCallback } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export function usePagination({ initialPage = 1, initialPageSize = 10 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const offset = (page - 1) * pageSize;

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  const nextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  const getTotalPages = useCallback((totalItems: number) => {
    return Math.ceil(totalItems / pageSize);
  }, [pageSize]);

  return {
    page,
    pageSize,
    offset,
    setPageSize,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    getTotalPages,
  };
}
```

### src/hooks/useFilters.ts

```typescript
import { useState, useCallback, useMemo } from 'react';

export function useFilters<T extends Record<string, any>>(initialFilters: T) {
  const [filters, setFilters] = useState<T>(initialFilters);

  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const clearFilter = useCallback(<K extends keyof T>(key: K) => {
    setFilters(prev => ({ ...prev, [key]: initialFilters[key] }));
  }, [initialFilters]);

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      const initial = initialFilters[key as keyof T];
      return value !== initial && value !== '' && value !== null && value !== undefined;
    }).length;
  }, [filters, initialFilters]);

  const hasActiveFilters = activeFiltersCount > 0;

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    clearFilter,
    activeFiltersCount,
    hasActiveFilters,
  };
}
```

### src/hooks/useSorting.ts

```typescript
import { useState, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  column: string;
  direction: SortDirection;
}

export function useSorting(initialColumn?: string, initialDirection: SortDirection = null) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: initialColumn || '',
    direction: initialDirection,
  });

  const handleSort = useCallback((column: string) => {
    setSortConfig(prev => {
      if (prev.column !== column) {
        return { column, direction: 'asc' };
      }
      
      if (prev.direction === 'asc') {
        return { column, direction: 'desc' };
      }
      
      if (prev.direction === 'desc') {
        return { column: '', direction: null };
      }
      
      return { column, direction: 'asc' };
    });
  }, []);

  const clearSort = useCallback(() => {
    setSortConfig({ column: '', direction: null });
  }, []);

  const getSortIcon = useCallback((column: string) => {
    if (sortConfig.column !== column) return null;
    return sortConfig.direction;
  }, [sortConfig]);

  return {
    sortConfig,
    handleSort,
    clearSort,
    getSortIcon,
    sortColumn: sortConfig.column,
    sortDirection: sortConfig.direction,
  };
}
```

### src/hooks/useDebounce.ts

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### src/hooks/useLocalStorage.ts

```typescript
import { useState, useCallback, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
```

### src/hooks/useAuth.tsx

```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) checkAdminRole(session.user.id);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) checkAdminRole(session.user.id);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAdminRole(userId: string) {
    const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
    setIsAdmin(data || false);
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

---

## 🧩 Componentes Comuns

### src/components/common/index.ts

```typescript
export { Pagination } from './Pagination';
export { FilterBar } from './FilterBar';
export { LoadingSpinner } from './LoadingSpinner';
export { EmptyState } from './EmptyState';
export { ConfirmDialog } from './ConfirmDialog';
export { PageHeader } from './PageHeader';
export { StatsCard } from './StatsCard';
export { StatusBadge } from './StatusBadge';
export { ExportButton } from './ExportButton';
export { TooltipWrapper } from './TooltipWrapper';
```

### src/components/common/LoadingSpinner.tsx

```typescript
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
    </div>
  );
}
```

### src/components/common/EmptyState.tsx

```typescript
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

### src/components/common/PageHeader.tsx

```typescript
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
```

---

## 🛣️ Configuração de Rotas

### src/App.tsx

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/hooks/useAuth';

import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <BrowserRouter>
            <Toaster richColors position="top-right" />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              
              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Index />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### src/components/auth/ProtectedRoute.tsx

```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

---

## 📱 PWA Setup

### public/manifest.json

```json
{
  "name": "Meu App",
  "short_name": "MeuApp",
  "description": "Descrição do aplicativo",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

### public/sw.js

```javascript
const CACHE_NAME = 'app-cache-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) return response;
        return fetch(event.request).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});
```

### public/offline.html

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 { color: #333; margin-bottom: 1rem; }
    p { color: #666; }
    button {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📵 Sem conexão</h1>
    <p>Verifique sua conexão com a internet e tente novamente.</p>
    <button onclick="location.reload()">Tentar novamente</button>
  </div>
</body>
</html>
```

### index.html (adicionar no head)

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#3b82f6" />
<link rel="apple-touch-icon" href="/icons/icon-192.svg" />

<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js');
    });
  }
</script>
```

---

## 🧪 Testes

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### src/test/setup.ts

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

### package.json (scripts)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint . --ext ts,tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## ✅ Checklist Final

### Setup Inicial
- [ ] Projeto criado (Lovable ou Vite)
- [ ] Dependências instaladas
- [ ] Tailwind configurado
- [ ] Shadcn/UI inicializado

### Design System
- [ ] tailwind.config.ts configurado
- [ ] index.css com variáveis CSS
- [ ] Dark mode funcionando
- [ ] Componentes UI instalados

### Supabase
- [ ] Cliente configurado
- [ ] Tabelas base criadas
- [ ] RLS policies aplicadas
- [ ] Função has_role criada
- [ ] Trigger de novo usuário

### Estrutura
- [ ] Pastas criadas
- [ ] Hooks base implementados
- [ ] Componentes comuns criados
- [ ] Layout principal

### Rotas
- [ ] React Router configurado
- [ ] ProtectedRoute implementado
- [ ] Páginas base criadas

### PWA
- [ ] manifest.json
- [ ] Service Worker
- [ ] Página offline
- [ ] Ícones

### Qualidade
- [ ] Vitest configurado
- [ ] ESLint configurado
- [ ] TypeScript strict

---

## 🔗 Links Úteis

- [Shadcn/UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts](https://recharts.org/)
- [Lucide Icons](https://lucide.dev/)

---

*Template baseado no projeto Loggi-Flow - Dezembro 2024*
