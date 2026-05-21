import { Link, useLocation } from 'react-router-dom';
import {
  Hexagon,
  ShieldCheck,
  LayoutDashboard,
  LineChart,
  Play,
  FileText,
  Info,
} from 'lucide-react';
import { isApiKeyConfigured } from '../lib/apiClient';
import { useGameStore } from '../store/gameStore';
import { useI18n } from '../i18n/I18nProvider';

const NAV = [
  { path: '/', key: 'dashboard', Icon: LayoutDashboard },
  { path: '/analysis', key: 'analysis', Icon: LineChart },
  { path: '/simulate', key: 'simulate', Icon: Play },
  { path: '/report', key: 'report', Icon: FileText },
  { path: '/about', key: 'about', Icon: Info },
];

export default function Header() {
  const threatLevel = useGameStore((state) => state.threatLevel);
  const location = useLocation();
  const { t, language, setLanguage } = useI18n();

  const threatClass =
    threatLevel > 60 ? 'stat-chip--threat-high' : 'stat-chip--threat';

  return (
    <header className="header-pro scanline-effect">
      <Link to="/" className="header-pro__brand">
        <div className="header-pro__logo">
          <Hexagon size={22} className="text-cyan" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="header-pro__title">
            Cyber<span>Game</span>GT
          </h1>
          <p className="header-pro__tagline">{t('app.tagline')}</p>
        </div>
      </Link>

      <div className="header-pro__right">
        <div className="header-pro__chips">
          <span className={`stat-chip ${isApiKeyConfigured() ? 'stat-chip--secure' : 'stat-chip--live'}`}>
            <ShieldCheck size={11} strokeWidth={2} />
            {isApiKeyConfigured() ? t('app.secured') : t('app.nashEngineActive')}
          </span>
          <span className={`stat-chip ${threatClass}`}>
            <span className="stat-chip__dot" />
            {t('app.threatLevel')}: {threatLevel > 60 ? t('app.high') : threatLevel > 30 ? t('app.medium') : t('app.low')}
          </span>
        </div>

        <label className="header-pro__lang">
          <span className="sr-only">{t('app.language')}</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label={t('app.language')}
          >
            <option value="en">EN</option>
            <option value="fr">FR</option>
            <option value="ar">AR</option>
          </select>
        </label>

        <nav className="header-pro__nav" aria-label="Main navigation">
          {NAV.map(({ path, key, Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`nav-link${isActive ? ' nav-link--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={13} strokeWidth={2} />
                {t(`nav.${key}`)}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
