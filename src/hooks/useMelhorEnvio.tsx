import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Helper to call the edge function
async function meApi(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('melhor-envio-api', {
    body: { action, params, useSandbox: true },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useMelhorEnvio() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const enabled = !!user?.id;

  // === COTAÇÃO ===
  const calcularFrete = useMutation({
    mutationFn: (params: {
      from: { postal_code: string };
      to: { postal_code: string };
      products?: Array<{ id?: string; width: number; height: number; length: number; weight: number; insurance_value: number; quantity: number }>;
      volumes?: Array<{ width: number; height: number; length: number; weight: number }>;
      options?: { receipt?: boolean; own_hand?: boolean; insurance_value?: number };
    }) => meApi('calcularFrete', params as unknown as Record<string, unknown>),
    onError: (e) => toast.error('Erro na cotação: ' + e.message),
  });

  // === CARRINHO ===
  const inserirCarrinho = useMutation({
    mutationFn: (params: Record<string, unknown>) => meApi('inserirCarrinho', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-carrinho'] });
      toast.success('Frete adicionado ao carrinho!');
    },
    onError: (e) => toast.error('Erro ao inserir no carrinho: ' + e.message),
  });

  const inserirLogisticaReversa = useMutation({
    mutationFn: (params: Record<string, unknown>) => meApi('inserirLogisticaReversa', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-carrinho'] });
      toast.success('Logística reversa adicionada!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const listarCarrinho = useQuery({
    queryKey: ['me-carrinho'],
    queryFn: () => meApi('listarCarrinho'),
    enabled,
    staleTime: 30 * 1000,
  });

  const exibirItemCarrinho = useMutation({
    mutationFn: (id: string) => meApi('exibirItemCarrinho', { id }),
  });

  const removerItemCarrinho = useMutation({
    mutationFn: (id: string) => meApi('removerItemCarrinho', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-carrinho'] });
      toast.success('Item removido do carrinho!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const comprarFretes = useMutation({
    mutationFn: (orders: string[]) => meApi('comprarFretes', { orders }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-carrinho'] });
      queryClient.invalidateQueries({ queryKey: ['me-etiquetas'] });
      toast.success('Fretes comprados com sucesso!');
    },
    onError: (e) => toast.error('Erro na compra: ' + e.message),
  });

  // === ETIQUETAS ===
  const gerarEtiquetas = useMutation({
    mutationFn: (orders: string[]) => meApi('gerarEtiquetas', { orders }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-etiquetas'] });
      toast.success('Etiquetas geradas!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const imprimirEtiquetas = useMutation({
    mutationFn: (params: { orders: string[]; mode?: string }) => meApi('imprimirEtiquetas', params),
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const imprimirEtiquetasArquivo = useMutation({
    mutationFn: (id: string) => meApi('imprimirEtiquetasArquivo', { id }),
  });

  const preVisualizarEtiquetas = useMutation({
    mutationFn: (orders: string[]) => meApi('preVisualizarEtiquetas', { orders }),
  });

  // === PESQUISA E CANCELAMENTO ===
  const pesquisarEtiqueta = useMutation({
    mutationFn: (params: { status?: string; q?: string; page?: string }) => meApi('pesquisarEtiqueta', params),
  });

  const listarEtiquetas = useQuery({
    queryKey: ['me-etiquetas'],
    queryFn: () => meApi('listarEtiquetas', { per_page: '50' }),
    enabled,
    staleTime: 60 * 1000,
  });

  const infoEtiqueta = useMutation({
    mutationFn: (id: string) => meApi('infoEtiqueta', { id }),
  });

  const verificarCancelamento = useMutation({
    mutationFn: (orders: string[]) => meApi('verificarCancelamento', { orders }),
  });

  const cancelarEtiquetas = useMutation({
    mutationFn: (params: { orders: string[]; description?: string }) => meApi('cancelarEtiquetas', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-etiquetas'] });
      toast.success('Etiqueta(s) cancelada(s)!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  // === RASTREAMENTO ===
  const rastrearEnvios = useMutation({
    mutationFn: (orders: string[]) => meApi('rastrearEnvios', { orders }),
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  // === TRANSPORTADORAS ===
  const listarTransportadoras = useQuery({
    queryKey: ['me-transportadoras'],
    queryFn: () => meApi('listarTransportadoras'),
    enabled,
    staleTime: 10 * 60 * 1000,
  });

  const infoTransportadora = useMutation({
    mutationFn: (id: string) => meApi('infoTransportadora', { id }),
  });

  const listarServicos = useQuery({
    queryKey: ['me-servicos'],
    queryFn: () => meApi('listarServicos'),
    enabled,
    staleTime: 10 * 60 * 1000,
  });

  const infoServico = useMutation({
    mutationFn: (id: string) => meApi('infoServico', { id }),
  });

  const listarAgencias = useMutation({
    mutationFn: (params: { company?: string; state?: string; city?: string }) => meApi('listarAgencias', params),
  });

  const infoAgencia = useMutation({
    mutationFn: (id: string) => meApi('infoAgencia', { id }),
  });

  // === USUÁRIO ===
  const infoUsuario = useQuery({
    queryKey: ['me-usuario'],
    queryFn: () => meApi('infoUsuario'),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const enderecosUsuario = useQuery({
    queryKey: ['me-enderecos-usuario'],
    queryFn: () => meApi('enderecosUsuario'),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const saldoUsuario = useQuery({
    queryKey: ['me-saldo'],
    queryFn: () => meApi('saldoUsuario'),
    enabled,
    staleTime: 60 * 1000,
  });

  const inserirSaldo = useMutation({
    mutationFn: (params: Record<string, unknown>) => meApi('inserirSaldo', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-saldo'] });
      toast.success('Saldo adicionado!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  // === LOJAS ===
  const listarLojas = useQuery({
    queryKey: ['me-lojas'],
    queryFn: () => meApi('listarLojas'),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const cadastrarLoja = useMutation({
    mutationFn: (params: Record<string, unknown>) => meApi('cadastrarLoja', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-lojas'] });
      toast.success('Loja cadastrada!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const visualizarLoja = useMutation({
    mutationFn: (id: string) => meApi('visualizarLoja', { id }),
  });

  const cadastrarEnderecoLoja = useMutation({
    mutationFn: (params: { company_id: string; address: Record<string, unknown> }) => meApi('cadastrarEnderecoLoja', params),
    onSuccess: () => toast.success('Endereço cadastrado!'),
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const listarEnderecosLoja = useMutation({
    mutationFn: (company_id: string) => meApi('listarEnderecosLoja', { company_id }),
  });

  const cadastrarTelefonesLoja = useMutation({
    mutationFn: (params: { company_id: string; phones: Record<string, unknown> }) => meApi('cadastrarTelefonesLoja', params),
    onSuccess: () => toast.success('Telefones cadastrados!'),
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const listarTelefonesLoja = useMutation({
    mutationFn: (company_id: string) => meApi('listarTelefonesLoja', { company_id }),
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
