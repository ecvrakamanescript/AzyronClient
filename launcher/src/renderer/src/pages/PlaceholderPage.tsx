interface PlaceholderPageProps {
  title: string;
}

// Shown for pages whose content follows in later phases.
export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="page">
      <h1 className="page__title">{title}</h1>
    </section>
  );
}
