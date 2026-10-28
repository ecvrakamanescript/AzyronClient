export default function App() {
  const { electron, chrome, node } = window.azyron.versions;

  return (
    <main className="app">
      <h1 className="app__title">Azyron Client</h1>
      <p className="app__versions">
        Electron {electron} · Chromium {chrome} · Node.js {node}
      </p>
    </main>
  );
}
