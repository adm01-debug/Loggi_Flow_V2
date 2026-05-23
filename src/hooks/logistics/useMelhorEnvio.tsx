import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from 'sonner';
import { useLocalStorage } from "@/hooks/common/useLocalStorage";

// Helper to call the edge function
async function meApi(action: string, params: Record<string, unknown> = {}, useSandbox = true) {
  const { data, error } = await supabase.functions.invoke('melhor-envio-api', {
    body: { action, params, useSandbox },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useMelhorEnvio() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const enabled = !!user?.id;
  const [useSandbox] = useLocalStorage('me-sandbox-mode', true);

  const api = (action: string, params: Record<string, unknown> = {}) =>
    meApi(action, params, useSandbox);

  // === COTAÇÃO ===
  const calcularFrete = useMutation({
    mutationFn: (params: {
      from: { postal_code: string };
      to: { postal_code: string };
      products?: Array<{ id?: string; width: number; height: number; length: number; weight: number; insurance_value: number; quantity: number }>;
      volumes?: Array<{ width: number; height: number; length: number; weight: number }>;
      options?: { receipt?: boolean; own_hand?: boolean; insurance_value?: number };
    }) => api('calcularFrete', params as unknown as Record<string, unknown>),
    onError: (e) => toast.error('Erro na cotação: ' + e.message),
  });

  // === CARRINHO ===
  const inserirCarrinho = useMutation({
    mutationFn: (params: Record<string, unknown>) => api('inserirCarrinho', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-carrinho'] });
      toast.success('Frete adicionado ao carrinho!');
    },
    onError: (e) => toast.error('Erro ao inserir no carrinho: ' + e.message),
  });

  const inserirLogisticaReversa = useMutation({
    mutationFn: (params: Record<string, unknown>) => api('inserirLogisticaReversa', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-carrinho'] });
      toast.success('Logística reversa adicionada!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const listarCarrinho = useQuery({
    queryKey: ['me-carrinho'],
    queryFn: () => api('listarCarrinho'),
    enabled,
    staleTime: 30 * 1000,
  });

  const exibirItemCarrinho = useMutation({
    mutationFn: (id: string) => api('exibirItemCarrinho', { id }),
  });

  const removerItemCarrinho = useMutation({
    mutationFn: (id: string) => api('removerItemCarrinho', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-carrinho'] });
      toast.success('Item removido do carrinho!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const comprarFretes = useMutation({
    mutationFn: (orders: string[]) => api('comprarFretes', { orders }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-carrinho'] });
      queryClient.invalidateQueries({ queryKey: ['me-etiquetas'] });
      toast.success('Fretes comprados com sucesso!');
    },
    onError: (e) => toast.error('Erro na compra: ' + e.message),
  });

  // === ETIQUETAS ===
  const gerarEtiquetas = useMutation({
    mutationFn: (orders: string[]) => api('gerarEtiquetas', { orders }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-etiquetas'] });
      toast.success('Etiquetas geradas!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const imprimirEtiquetas = useMutation({
    mutationFn: (params: { orders: string[]; mode?: string }) => api('imprimirEtiquetas', params),
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const imprimirEtiquetasArquivo = useMutation({
    mutationFn: (id: string) => api('imprimirEtiquetasArquivo', { id }),
  });

  const preVisualizarEtiquetas = useMutation({
    mutationFn: (orders: string[]) => api('preVisualizarEtiquetas', { orders }),
  });

  // === PESQUISA E CANCELAMENTO ===
  const pesquisarEtiqueta = useMutation({
    mutationFn: (params: { status?: string; q?: string; page?: string }) => api('pesquisarEtiqueta', params),
  });

  const listarEtiquetas = useQuery({
    queryKey: ['me-etiquetas'],
    queryFn: () => api('listarEtiquetas', { per_page: '50' }),
    enabled,
    staleTime: 60 * 1000,
  });

  const infoEtiqueta = useMutation({
    mutationFn: (id: string) => api('infoEtiqueta', { id }),
  });

  const verificarCancelamento = useMutation({
    mutationFn: (orders: string[]) => api('verificarCancelamento', { orders }),
  });

  const cancelarEtiquetas = useMutation({
    mutationFn: (params: { orders: string[]; description?: string }) => api('cancelarEtiquetas', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-etiquetas'] });
      toast.success('Etiqueta(s) cancelada(s)!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  // === RASTREAMENTO ===
  const rastrearEnvios = useMutation({
    mutationFn: (orders: string[]) => api('rastrearEnvios', { orders }),
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  // === TRANSPORTADORAS ===
  const listarTransportadoras = useQuery({
    queryKey: ['me-transportadoras'],
    queryFn: () => api('listarTransportadoras'),
    enabled,
    staleTime: 10 * 60 * 1000,
  });

  const infoTransportadora = useMutation({
    mutationFn: (id: string) => api('infoTransportadora', { id }),
  });

  const listarServicos = useQuery({
    queryKey: ['me-servicos'],
    queryFn: () => api('listarServicos'),
    enabled,
    staleTime: 10 * 60 * 1000,
  });

  const infoServico = useMutation({
    mutationFn: (id: string) => api('infoServico', { id }),
  });

  const listarAgencias = useMutation({
    mutationFn: (params: { company?: string; state?: string; city?: string }) => api('listarAgencias', params),
  });

  const infoAgencia = useMutation({
    mutationFn: (id: string) => api('infoAgencia', { id }),
  });

  // === USUÁRIO ===
  const infoUsuario = useQuery({
    queryKey: ['me-usuario'],
    queryFn: () => api('infoUsuario'),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const enderecosUsuario = useQuery({
    queryKey: ['me-enderecos-usuario'],
    queryFn: () => api('enderecosUsuario'),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const saldoUsuario = useQuery({
    queryKey: ['me-saldo'],
    queryFn: () => api('saldoUsuario'),
    enabled,
    staleTime: 60 * 1000,
  });

  const inserirSaldo = useMutation({
    mutationFn: (params: Record<string, unknown>) => api('inserirSaldo', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-saldo'] });
      toast.success('Saldo adicionado!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  // === LOJAS ===
  const listarLojas = useQuery({
    queryKey: ['me-lojas'],
    queryFn: () => api('listarLojas'),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const cadastrarLoja = useMutation({
    mutationFn: (params: Record<string, unknown>) => api('cadastrarLoja', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-lojas'] });
      toast.success('Loja cadastrada!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const visualizarLoja = useMutation({
    mutationFn: (id: string) => api('visualizarLoja', { id }),
  });

  const cadastrarEnderecoLoja = useMutation({
    mutationFn: (params: { company_id: string; address: Record<string, unknown> }) => api('cadastrarEnderecoLoja', params),
    onSuccess: () => toast.success('Endereço cadastrado!'),
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const listarEnderecosLoja = useMutation({
    mutationFn: (company_id: string) => api('listarEnderecosLoja', { company_id }),
  });

  const cadastrarTelefonesLoja = useMutation({
    mutationFn: (params: { company_id: string; phones: Record<string, unknown> }) => api('cadastrarTelefonesLoja', params),
    onSuccess: () => toast.success('Telefones cadastrados!'),
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const listarTelefonesLoja = useMutation({
    mutationFn: (company_id: string) => api('listarTelefonesLoja', { company_id }),
  });

  return {
    // Cotação
    calcularFrete,
    // Carrinho
    inserirCarrinho, inserirLogisticaReversa, listarCarrinho,
    exibirItemCarrinho, removerItemCarrinho, comprarFretes,
    // Etiquetas
    gerarEtiquetas, imprimirEtiquetas, imprimirEtiquetasArquivo, preVisualizarEtiquetas,
    // Pesquisa/Cancelamento
    pesquisarEtiqueta, listarEtiquetas, infoEtiqueta,
    verificarCancelamento, cancelarEtiquetas,
    // Rastreamento
    rastrearEnvios,
    // Transportadoras
    listarTransportadoras, infoTransportadora,
    listarServicos, infoServico, listarAgencias, infoAgencia,
    // Usuário
    infoUsuario, enderecosUsuario, saldoUsuario, inserirSaldo,
    // Lojas
    listarLojas, cadastrarLoja, visualizarLoja,
    cadastrarEnderecoLoja, listarEnderecosLoja,
    cadastrarTelefonesLoja, listarTelefonesLoja,
  };
}
