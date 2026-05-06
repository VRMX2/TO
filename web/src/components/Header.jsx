import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Hexagon } from 'lucide-react';
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
    { name: t('nav.report'), path: '/report' }
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
          border: '1px solid var(--accent-green)', borderRadius: '20px', 
          padding: '0.25rem 1rem', background: 'rgba(0, 255, 102, 0.05)'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 5px var(--accent-green)' }}></div>
          <span className="text-xs font-mono text-green">{t('app.nashEngineActive')}</span>
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

        <nav style={{ display: 'flex', gap: '1rem', marginLeft: '1rem' }}>
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link key={tab.name} to={tab.path} style={{
                background: isActive ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                border: 'none',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                borderBottom: isActive ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                textDecoration: 'none'
              }}>
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
