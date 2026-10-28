import { useTranslation } from 'react-i18next';
import { pages, type PageEntry, type PageId } from '../navigation';

interface SidebarProps {
  current: PageId;
  onSelect: (page: PageId) => void;
}

export default function Sidebar({ current, onSelect }: SidebarProps) {
  const { t } = useTranslation();

  const renderEntry = ({ id, icon: Icon }: PageEntry) => (
    <li key={id}>
      <button
        type="button"
        className={id === current ? 'sidebar__item sidebar__item--active' : 'sidebar__item'}
        aria-current={id === current ? 'page' : undefined}
        onClick={() => onSelect(id)}
      >
        <Icon className="sidebar__icon" />
        <span>{t(`nav.${id}`)}</span>
      </button>
    </li>
  );

  return (
    // Mouse clicks do not move the focus, so no focus ring remains after a click; Tab still works.
    <nav className="sidebar" aria-label={t('nav.label')} onMouseDown={(event) => event.preventDefault()}>
      <ul className="sidebar__list">{pages.filter((page) => page.group === 'top').map(renderEntry)}</ul>
      <ul className="sidebar__list">{pages.filter((page) => page.group === 'bottom').map(renderEntry)}</ul>
    </nav>
  );
}
