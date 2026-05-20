import { Link, useLocation } from 'react-router-dom';
import { Hexagon, ShieldCheck } from 'lucide-react';
import { isApiKeyConfigured } from '../lib/apiClient';
import { useGameStore } from '../store/gameStore';
import { useI18n } from '../i18n/I18nProvider';

export default function Header() {
  const threatLevel = useGameStore((state) => state.threatLevel);
  const location = useLocation();
  const { t, language, setLanguage } = useI18n();

  const tabs = [
    { name: t('nav.dashboard'), path: '/' },
    { name: t('nav.analysis'), path: '/analysis' },
    { name: t('nav.simulate'), path: '/simulate' },
    { name: t('nav.report'), path: '/report' },
    { name: t('nav.about'), path: '/about' }
  ];

  return (
    <header className="header-container scanline-effect">
      <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <Hexagon className="text-cyan" size={24} />
        </div>
        <div>
          <h1 className="text-primary m-0" style={{ fontSize: '1.25rem', margin: 0 }}>CyberGameGT</h1>
          <p className="text-xs text-secondary m-0" style={{ letterSpacing: '0.1em', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
            {t('app.tagline')}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          border: `1px solid ${isApiKeyConfigured() ? 'var(--accent-purple)' : 'var(--accent-green)'}`,
          borderRadius: '20px',
          padding: '0.25rem 1rem',
          background: isApiKeyConfigured() ? 'rgba(168, 85, 247, 0.08)' : 'rgba(0, 255, 102, 0.05)',
        }}>
          <ShieldCheck size={12} style={{ color: isApiKeyConfigured() ? 'var(--accent-purple)' : 'var(--accent-green)' }} />
          <span className="text-xs font-mono" style={{ color: isApiKeyConfigured() ? 'var(--accent-purple)' : 'var(--accent-green)' }}>
            {isApiKeyConfigured() ? t('app.secured') : t('app.nashEngineActive')}
          </span>
        </div>

        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '0.5rem', 
          border: '1px solid var(--accent-amber)', borderRadius: '20px', 
          padding: '0.25rem 1rem', background: 'rgba(255, 214, 10, 0.05)'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-amber)', boxShadow: '0 0 5px var(--accent-amber)' }}></div>
          <span className="text-xs font-mono text-amber">{t('app.threatLevel')}: {threatLevel > 60 ? t('app.high') : threatLevel > 30 ? t('app.medium') : t('app.low')}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="text-xs font-mono text-secondary">{t('app.language')}</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              background: 'var(--bg-base)',
              border: '1px solid rgba(0,240,255,0.2)',
              color: 'var(--text-primary)',
              padding: '3px 6px',
              borderRadius: 4,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
            }}
          >
            <option value="en">English</option>
            <option value="fr">Francais</option>
            <option value="ar">العربية</option>
          </select>
        </div>

        <nav style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link key={tab.name} to={tab.path} style={{
                background: isActive ? 'linear-gradient(to bottom, rgba(0,240,255,0.15), rgba(0,240,255,0.02))' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'rgba(0,240,255,0.3)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                padding: '0.4rem 1.25rem',
                borderRadius: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                textDecoration: 'none',
                textShadow: isActive ? '0 0 10px rgba(0,240,255,0.5)' : 'none',
                boxShadow: isActive ? '0 4px 15px rgba(0,240,255,0.1), inset 0 1px 1px rgba(255,255,255,0.1)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.textShadow = '0 0 8px rgba(0,240,255,0.25)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,240,255,0.05)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.textShadow = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
