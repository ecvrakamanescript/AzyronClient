import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AboutPageProps {
  title: string;
}

export default function AboutPage({ title }: AboutPageProps) {
  const { t } = useTranslation();
  const [version, setVersion] = useState<string | null>(null);
  const { electron, chrome, node } = window.azyron.versions;

  useEffect(() => {
    let active = true;
    void window.azyron.app.getVersion().then((value) => {
      if (active) {
        setVersion(value);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="page">
      <h1 className="page__title">{title}</h1>

      <div className="about__product">
        <span className="about__name">Azyron Client</span>
        <span className="about__version">{t('about.version', { version: version ?? '…' })}</span>
      </div>

      {/* Required by the Minecraft Usage Guidelines; the wording must stay exactly like this in every language. */}
      <p className="about__disclaimer">
        NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.
      </p>

      <dl className="about__facts">
        <dt>{t('about.contact')}</dt>
        <dd className="about__selectable">azyronclient@proton.me</dd>
        <dt>{t('about.license')}</dt>
        <dd>GNU General Public License v3.0 (GPL-3.0)</dd>
        <dt>{t('about.runtime')}</dt>
        <dd>
          Electron {electron} · Chromium {chrome} · Node.js {node}
        </dd>
      </dl>
    </section>
  );
}
