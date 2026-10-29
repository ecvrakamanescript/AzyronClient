import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { INSTANCE_NAME_MAX_LENGTH, normalizeInstanceName, type Instance } from '../../../shared/instances';
import type { VersionList } from '../../../shared/versions';
import { errorMessage } from '../errors';
import Dialog from './Dialog';

/** Shows the error of a failed action below the form fields. */
function ActionError({ message }: { message: string | null }) {
  const { t } = useTranslation();
  return message ? (
    <p className="form-error" role="alert">
      {t('instances.actionFailed', { message })}
    </p>
  ) : null;
}

/** Runs an action of a dialog: disables the buttons meanwhile and shows an error if it fails. */
function useAction(onDone: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = (action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    action().then(onDone, (reason: unknown) => {
      setError(errorMessage(reason));
      setBusy(false);
    });
  };
  return { busy, error, run };
}

interface CreateProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateInstanceDialog({ onClose, onCreated }: CreateProps) {
  const { t } = useTranslation();
  const [includeSnapshots, setIncludeSnapshots] = useState(false);
  const [list, setList] = useState<VersionList | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [versionId, setVersionId] = useState('');
  // Until the user types a name, the name follows the chosen version.
  const [name, setName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);
  const { busy, error, run } = useAction(onCreated);

  useEffect(() => {
    let active = true;
    setLoadError(false);
    window.azyron.gameVersions.list(includeSnapshots).then(
      (result) => {
        if (!active) return;
        setList(result);
        // Keep the chosen version if it is still in the list, otherwise take the latest release.
        setVersionId((current) =>
          result.versions.some((version) => version.id === current) ? current : (result.latestRelease ?? result.versions[0]?.id ?? '')
        );
      },
      () => {
        if (active) setLoadError(true);
      }
    );
    return () => {
      active = false;
    };
  }, [includeSnapshots, attempt]);

  const shownName = nameEdited ? name : versionId;
  const validName = normalizeInstanceName(shownName);

  return (
    <Dialog
      title={t('instances.createTitle')}
      onClose={onClose}
      onSubmit={() => {
        if (validName && versionId) run(() => window.azyron.instances.create(validName, versionId));
      }}
      actions={
        <>
          <button type="button" className="button" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="button button--primary" disabled={busy || !validName || !versionId}>
            {t('common.create')}
          </button>
        </>
      }
    >
      <label className="field">
        <span className="field__label">{t('instances.nameLabel')}</span>
        <input
          className="input"
          value={shownName}
          maxLength={INSTANCE_NAME_MAX_LENGTH}
          autoFocus
          onChange={(event) => {
            setNameEdited(true);
            setName(event.target.value);
          }}
        />
      </label>

      <label className="field">
        <span className="field__label">{t('instances.versionLabel')}</span>
        <select
          className="select"
          value={versionId}
          disabled={!list || loadError}
          onChange={(event) => setVersionId(event.target.value)}
        >
          {!list && !loadError && <option value="">{t('instances.loadingVersions')}</option>}
          {list?.versions.map((version) => (
            <option key={version.id} value={version.id}>
              {version.type === 'snapshot' ? `${version.id} (${t('instances.snapshot')})` : version.id}
            </option>
          ))}
        </select>
      </label>

      <label className="checkbox">
        <input type="checkbox" checked={includeSnapshots} onChange={(event) => setIncludeSnapshots(event.target.checked)} />
        <span>{t('instances.showSnapshots')}</span>
      </label>

      {list?.offline && <p className="form-hint">{t('instances.offline')}</p>}
      {loadError && (
        <p className="form-error" role="alert">
          {t('instances.versionsError')}{' '}
          <button type="button" className="link-button" onClick={() => setAttempt((value) => value + 1)}>
            {t('common.retry')}
          </button>
        </p>
      )}
      <ActionError message={error} />
    </Dialog>
  );
}

interface InstanceProps {
  instance: Instance;
  onClose: () => void;
  onDone: () => void;
}

export function RenameInstanceDialog({ instance, onClose, onDone }: InstanceProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(instance.name);
  const { busy, error, run } = useAction(onDone);
  const validName = normalizeInstanceName(name);

  return (
    <Dialog
      title={t('instances.renameTitle')}
      onClose={onClose}
      onSubmit={() => {
        if (validName) run(() => window.azyron.instances.rename(instance.id, validName));
      }}
      actions={
        <>
          <button type="button" className="button" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="button button--primary" disabled={busy || !validName}>
            {t('common.save')}
          </button>
        </>
      }
    >
      <label className="field">
        <span className="field__label">{t('instances.nameLabel')}</span>
        <input
          className="input"
          value={name}
          maxLength={INSTANCE_NAME_MAX_LENGTH}
          autoFocus
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <ActionError message={error} />
    </Dialog>
  );
}

export function DeleteInstanceDialog({ instance, onClose, onDone }: InstanceProps) {
  const { t } = useTranslation();
  const { busy, error, run } = useAction(onDone);

  return (
    <Dialog
      title={t('instances.deleteTitle')}
      onClose={onClose}
      onSubmit={() => run(() => window.azyron.instances.remove(instance.id))}
      actions={
        <>
          {/* Cancel gets the focus, so Enter does not delete by accident. */}
          <button type="button" className="button" autoFocus onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="button button--danger" disabled={busy}>
            {t('common.delete')}
          </button>
        </>
      }
    >
      <p className="dialog__text">{t('instances.deleteText', { name: instance.name })}</p>
      <ActionError message={error} />
    </Dialog>
  );
}
