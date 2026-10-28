import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TitleBar from './components/TitleBar';
import { pages, type PageId } from './navigation';
import AboutPage from './pages/AboutPage';
import PlaceholderPage from './pages/PlaceholderPage';

export default function App() {
  // The launcher has no URLs; the visible page is plain React state.
  const [currentId, setCurrentId] = useState<PageId>('home');
  const current = pages.find((page) => page.id === currentId) ?? pages[0];

  return (
    <div className="app">
      <TitleBar />
      <div className="app__body">
        <Sidebar current={current.id} onSelect={setCurrentId} />
        <main className="app__content">
          {current.id === 'about' ? (
            <AboutPage title={current.label} />
          ) : (
            <PlaceholderPage title={current.label} />
          )}
        </main>
      </div>
    </div>
  );
}
