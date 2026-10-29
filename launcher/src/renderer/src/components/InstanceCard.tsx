import { useTranslation } from 'react-i18next';
import type { InstallProgress, InstallState } from '../../../shared/install';
import type { Instance } from '../../../shared/instances';
import { useAccount } from '../account';
import { CheckIcon, FolderIcon, InstancesIcon, PencilIcon, TrashIcon, XIcon } from './Icons';

interface InstanceCardProps {
  instance: Instance;
  /** Installation state of the instance's version; undefined while it is loading. */
  install: InstallState | undefined;
  onRename: () => void;
  onOpenFolder: () => void;
  onDelete: () => void;
}

const megabytes = (bytes: number) => Math.round(bytes / 1e6);

function stageText(progress: InstallProgress, t: ReturnType<typeof useTranslation>['t']): string {
  switch (progress.stage) {
    case 'metadata':
      return t('instances.stageMetadata');
    case 'game':
      return t('instances.stageGame');
    case 'java':
      return t('instances.stageJava');
  }
}

/** Install button, progress bar or result, depending on the installation state. */
function InstallArea({ versionId, state }: { versionId: string; state: InstallState | undefined }) {
  const { t } = useTranslation();
  const account = useAccount();
  if (!state) {
    return <div className="install-area" />;
  }

  switch (state.status) {
    case 'not-installed':
      return (
        <div className="install-area">
          <button type="button" className="button button--primary button--small" onClick={() => void window.azyron.install.start(versionId)}>
            {t('instances.install')}
          </button>
        </div>
      );
    case 'installing': {
      const { progress } = state;
      const share = progress.totalBytes > 0 ? Math.min(1, progress.completedBytes / progress.totalBytes) : 0;
      return (
        <div className="install-area install-area--progress">
          <div className="install-area__row">
            <span className="install-area__stage">{stageText(progress, t)}</span>
            <span className="install-area__percent">{Math.floor(share * 100)} %</span>
            <button
              type="button"
              className="icon-button icon-button--small"
              title={t('instances.cancelInstall')}
              aria-label={t('instances.cancelInstall')}
              onClick={() => void window.azyron.install.cancel(versionId)}
            >
              <XIcon />
            </button>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.floor(share * 100)}
            aria-label={stageText(progress, t)}
          >
            <div className="progress__bar" style={{ transform: `scaleX(${share})` }} />
          </div>
          {progress.totalBytes > 0 && (
            <span className="install-area__bytes">
              {t('instances.progress', { done: megabytes(progress.completedBytes), total: megabytes(progress.totalBytes) })}
            </span>
          )}
        </div>
      );
    }
    case 'installed':
      return (
        <div className="install-area">
          {/* Playing needs a signed-in account; until the sign-in exists the button stays locked. */}
          <button
            type="button"
            className="button button--primary button--small"
            disabled={!account}
            title={account ? undefined : t('instances.signInToPlay')}
          >
            {t('instances.play')}
          </button>
          {!account && <span className="install-area__hint">{t('instances.signInToPlay')}</span>}
          <span className="install-area__done" role="img" title={t('instances.installed')} aria-label={t('instances.installed')}>
            <CheckIcon className="install-area__done-icon" />
          </span>
        </div>
      );
    case 'failed': {
      const message = {
        'disk-space': t('instances.failedDiskSpace'),
        network: t('instances.failedNetwork'),
        other: t('instances.failedOther')
      }[state.reason];
      return (
        <div className="install-area install-area--failed">
          <p className="install-area__error" role="alert" title={state.detail}>
            {message}
          </p>
          <button type="button" className="button button--small" onClick={() => void window.azyron.install.start(versionId)}>
            {t('common.retry')}
          </button>
        </div>
      );
    }
  }
}

export default function InstanceCard({ instance, install, onRename, onOpenFolder, onDelete }: InstanceCardProps) {
  const { t } = useTranslation();

  return (
    <li className="instance-card">
      <div className="instance-card__header">
        <span className="instance-card__icon" aria-hidden="true">
          <InstancesIcon />
        </span>
        <div className="instance-card__text">
          <h2 className="instance-card__name">{instance.name}</h2>
          <p className="instance-card__version">{t('instances.version', { version: instance.versionId })}</p>
        </div>
      </div>

      <InstallArea versionId={instance.versionId} state={install} />

      <div className="instance-card__actions">
        <button type="button" className="icon-button" title={t('instances.rename')} aria-label={t('instances.rename')} onClick={onRename}>
          <PencilIcon />
        </button>
        <button
          type="button"
          className="icon-button"
          title={t('instances.openFolder')}
          aria-label={t('instances.openFolder')}
          onClick={onOpenFolder}
        >
          <FolderIcon />
        </button>
        <button
          type="button"
          className="icon-button icon-button--danger"
          title={t('instances.delete')}
          aria-label={t('instances.delete')}
          onClick={onDelete}
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}
