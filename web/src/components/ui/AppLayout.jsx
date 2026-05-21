import Header from '../Header';

export default function AppLayout({ children, wide = false }) {
  return (
    <div className="app-page page-transition">
      <Header />
      <main className="app-page__content">
        <div className={wide ? 'app-page__inner' : 'app-page__inner'} style={wide ? { maxWidth: '100%' } : undefined}>
          {children}
        </div>
      </main>
    </div>
  );
}
