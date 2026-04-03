import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { WebhookManager } from '@/components/integrations/WebhookManager';
import { Webhook } from 'lucide-react';

export default function GestaoWebhooks() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Integrações' }, { label: 'Webhooks' }]} />
        <PageHeader
          title="Gestão de Webhooks"
          description="Configure webhooks para receber notificações de eventos em sistemas externos"
          icon={Webhook}
        />
        <WebhookManager />
      </div>
    </MainLayout>
  );
}
