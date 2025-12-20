import { toast as sonnerToast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const advancedToast = {
  success: (options: ToastOptions | string) => {
    const opts = typeof options === "string" ? { title: options } : options;
    return sonnerToast.success(opts.title, {
      description: opts.description,
      duration: opts.duration || 4000,
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      action: opts.action ? {
        label: opts.action.label,
        onClick: opts.action.onClick,
      } : undefined,
    });
  },

  error: (options: ToastOptions | string) => {
    const opts = typeof options === "string" ? { title: options } : options;
    return sonnerToast.error(opts.title, {
      description: opts.description,
      duration: opts.duration || 6000,
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      action: opts.action ? {
        label: opts.action.label,
        onClick: opts.action.onClick,
      } : undefined,
    });
  },

  warning: (options: ToastOptions | string) => {
    const opts = typeof options === "string" ? { title: options } : options;
    return sonnerToast.warning(opts.title, {
      description: opts.description,
      duration: opts.duration || 5000,
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      action: opts.action ? {
        label: opts.action.label,
        onClick: opts.action.onClick,
      } : undefined,
    });
  },

  info: (options: ToastOptions | string) => {
    const opts = typeof options === "string" ? { title: options } : options;
    return sonnerToast.info(opts.title, {
      description: opts.description,
      duration: opts.duration || 4000,
      icon: <Info className="h-5 w-5 text-blue-500" />,
      action: opts.action ? {
        label: opts.action.label,
        onClick: opts.action.onClick,
      } : undefined,
    });
  },

  loading: (title: string) => {
    return sonnerToast.loading(title, {
      icon: <Loader2 className="h-5 w-5 animate-spin" />,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
    });
  },

  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id);
  },

  // Toast para ações CRUD
  saved: (entity: string) => {
    advancedToast.success({
      title: `${entity} salvo`,
      description: "As alterações foram salvas com sucesso.",
    });
  },

  deleted: (entity: string) => {
    advancedToast.success({
      title: `${entity} excluído`,
      description: "O registro foi removido com sucesso.",
    });
  },

  created: (entity: string) => {
    advancedToast.success({
      title: `${entity} criado`,
      description: "O novo registro foi criado com sucesso.",
    });
  },

  updated: (entity: string) => {
    advancedToast.success({
      title: `${entity} atualizado`,
      description: "O registro foi atualizado com sucesso.",
    });
  },

  apiError: (error: any) => {
    const message = error?.message || "Ocorreu um erro inesperado";
    advancedToast.error({
      title: "Erro",
      description: message,
      action: {
        label: "Tentar novamente",
        onClick: () => window.location.reload(),
      },
    });
  },

  offline: () => {
    advancedToast.warning({
      title: "Sem conexão",
      description: "Você está offline. Algumas funcionalidades podem não funcionar.",
      duration: 10000,
    });
  },

  online: () => {
    advancedToast.success({
      title: "Conectado",
      description: "Sua conexão foi restabelecida.",
    });
  },
};

export default advancedToast;
