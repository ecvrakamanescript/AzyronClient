import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Instance } from '../../../shared/instances';
import { InstancesIcon, PlusIcon } from '../components/Icons';
import InstanceCard from '../components/InstanceCard';
import { CreateInstanceDialog, DeleteInstanceDialog, RenameInstanceDialog } from '../components/InstanceDialogs';
import { errorMessage } from '../errors';
import { useInstallStates } from '../useInstallStates';

interface InstancesPageProps {
  title: string;
}

type OpenDialog = { kind: 'create' } | { kind: 'rename'; instance: Instance } | { kind: 'delete'; instance: Instance } | null;

export default function InstancesPage({ title }: InstancesPageProps) {
  const { t } = useTranslation();
  const [instances, setInstances] = useState<Instance[] | null>(null);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [error, setError] = useState<string | null>(null);
  const installStates = useInstallStates(instances?.map((instance) => instance.versionId) ?? []);

  const reload = useCallback(() => {
    window.azyron.instances.list().then(setInstances, (reason: unknown) => setError(errorMessage(reason)));
  }, []);

  useEffect(reload, [reload]);

  const closeDialog = () => setDialog(null);
  const afterChange = () => {
    setDialog(null);
    reload();
  };

  const openFolder = (instance: Instance) => {
    setError(null);
    window.azyron.instances.openFolder(instance.id).catch((reason: unknown) => setError(errorMessage(reason)));
  };

  const newButton = (
    <button type="button" className="button button--primary" onClick={() => setDialog({ kind: 'create' })}>
      <PlusIcon className="button__icon" />
      {t('instances.newInstance')}
    </button>
  );

  return (
    <section className="page">
      <div className="page__header">
        <h1 className="page__title">{title}</h1>
        {instances && instances.length > 0 && newButton}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {t('instances.actionFailed', { message: error })}
        </p>
      )}

      {instances?.length === 0 && (
        <div className="empty-state">
          <InstancesIcon className="empty-state__icon" />
          <h2 className="empty-state__title">{t('instances.emptyTitle')}</h2>
          <p className="empty-state__hint">{t('instances.emptyHint')}</p>
          {newButton}
        </div>
      )}

      {instances && instances.length > 0 && (
        <ul className="instance-grid">
          {instances.map((instance) => (
            <InstanceCard
              key={instance.id}
              instance={instance}
              install={installStates[instance.versionId]}
              onRename={() => setDialog({ kind: 'rename', instance })}
              onOpenFolder={() => openFolder(instance)}
              onDelete={() => setDialog({ kind: 'delete', instance })}
            />
          ))}
        </ul>
      )}

      {dialog?.kind === 'create' && <CreateInstanceDialog onClose={closeDialog} onCreated={afterChange} />}
      {dialog?.kind === 'rename' && (
        <RenameInstanceDialog instance={dialog.instance} onClose={closeDialog} onDone={afterChange} />
      )}
      {dialog?.kind === 'delete' && (
        <DeleteInstanceDialog instance={dialog.instance} onClose={closeDialog} onDone={afterChange} />
      )}
    </section>
  );
}
