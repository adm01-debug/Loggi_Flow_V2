import { EmptyState } from "./EmptyState";

type EmptyStateProps = Parameters<typeof EmptyState>[0];

export const EmptyStatePresets = {
  NoResults: (props: Partial<EmptyStateProps>) => (
    <EmptyState variant="search" title="Nenhum resultado encontrado" description="Tente ajustar os filtros ou termos de busca para encontrar o que procura." {...props} />
  ),
  NoData: (props: Partial<EmptyStateProps>) => (
    <EmptyState variant="data" title="Sem dados disponíveis" description="Ainda não há dados para exibir neste período." {...props} />
  ),
  NoDeliveries: (props: Partial<EmptyStateProps>) => (
    <EmptyState variant="delivery" title="Nenhuma entrega encontrada" description="Não há entregas registradas. Crie uma nova entrega para começar." {...props} />
  ),
  NoNotifications: (props: Partial<EmptyStateProps>) => (
    <EmptyState variant="notifications" title="Nenhuma notificação" description="Você está em dia! Não há notificações pendentes." {...props} />
  ),
  NoUsers: (props: Partial<EmptyStateProps>) => (
    <EmptyState variant="users" title="Nenhum usuário encontrado" description="Não há usuários cadastrados ou que correspondam aos filtros." {...props} />
  ),
  Error: (props: Partial<EmptyStateProps>) => (
    <EmptyState variant="error" title="Algo deu errado" description="Não foi possível carregar os dados. Tente novamente." {...props} />
  ),
  EmptyInbox: (props: Partial<EmptyStateProps>) => (
    <EmptyState variant="inbox" title="Caixa vazia" description="Não há itens na sua caixa de entrada." {...props} />
  ),
  NoEvents: (props: Partial<EmptyStateProps>) => (
    <EmptyState variant="calendar" title="Nenhum evento" description="Não há eventos agendados para este período." {...props} />
  ),
};
