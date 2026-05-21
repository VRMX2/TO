export default function PageHero({ icon: Icon, title, subtitle, actions }) {
  return (
    <header className="page-hero page-transition">
      <div className="page-hero__main">
        {Icon && (
          <div className="page-hero__icon">
            <Icon size={22} strokeWidth={1.75} />
          </div>
        )}
        <div>
          <h2 className="page-hero__title">{title}</h2>
          {subtitle && <p className="page-hero__subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="page-hero__actions">{actions}</div>}
    </header>
  );
}
