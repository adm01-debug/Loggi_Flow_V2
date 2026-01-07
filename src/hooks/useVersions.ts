import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface Version {
  id: string;
  version_number: number;
  data: Record<string, unknown>;
  changed_by: string;
  changed_at: string;
  change_summary: string;
}

// Usando localStorage já que a tabela entity_versions não existe
export function useVersions(entityType: string, entityId: string | null) {
  const storageKey = `versions-${entityType}-${entityId}`;
  const [versions, setVersions] = useState<Version[]>(() => {
    if (!entityId) return [];
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  });
  const [isLoading] = useState(false);

  const createVersion = useCallback(({ entityId: eId, data, summary }: { entityId: string; data: Record<string, unknown>; summary?: string }) => {
    const nextVersion = versions.length > 0 ? versions[0].version_number + 1 : 1;
    const newVersion: Version = {
      id: crypto.randomUUID(),
      version_number: nextVersion,
      data,
      changed_by: 'current_user',
      changed_at: new Date().toISOString(),
      change_summary: summary || `Versão ${nextVersion}`,
    };

    const updated = [newVersion, ...versions];
    setVersions(updated);
    localStorage.setItem(`versions-${entityType}-${eId}`, JSON.stringify(updated));
    toast.success('Versão salva');
  }, [versions, entityType]);

  const restoreVersion = useCallback(async (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (!version) throw new Error('Versão não encontrada');
    toast.success('Versão restaurada');
    return version.data;
  }, [versions]);

  return {
    versions,
    isLoading,
    latestVersion: versions[0],
    createVersion,
    restoreVersion,
  };
}
