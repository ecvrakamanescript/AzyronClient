import { useTranslation } from 'react-i18next';
import type { ThemeId } from '../../../shared/themes';
import SkinPreview from '../components/SkinPreview';

interface HomePageProps {
  title: string;
  theme: ThemeId;
}

export default function HomePage({ title, theme }: HomePageProps) {
  const { t } = useTranslation();

  return (
    <section className="page home">
      <h1 className="page__title">{title}</h1>

      <div className="home__stage">
        {/* Placeholder figure until Microsoft login (phase 2) provides the account's skin and cape. */}
        <div className="character-card">
          <SkinPreview theme={theme} label={t('home.characterPreview')} />
          <div className="character-card__footer">
            <p className="character-card__name">{t('home.notSignedIn')}</p>
            {/* Placeholder: the Microsoft sign-in follows once Mojang has approved the client ID. */}
            <button type="button" className="button button--primary button--small" disabled title={t('home.signInSoon')}>
              {t('home.signIn')}
            </button>
            <p className="character-card__hint">{t('home.signInSoon')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
