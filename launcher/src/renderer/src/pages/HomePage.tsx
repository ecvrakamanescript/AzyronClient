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
          <p className="character-card__name">{t('home.notSignedIn')}</p>
        </div>
      </div>
    </section>
  );
}
