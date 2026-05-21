import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { isApiKeyConfigured } from '../lib/apiClient';

const POLL_MS = 30_000;

export default function SystemStatusBar() {
  const { connected: wsConnected, reconnectInSec } = useWebSocket();
  const threatLevel = useGameStore((s) => s.threatLevel);
  const [apiOk, setApiOk] = useState(null);
  const [dbReady, setDbReady] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch('/api/health', { headers: isApiKeyConfigured() ? { 'X-API-Key': import.meta.env.VITE_API_KEY } : {} });
        if (!res.ok) throw new Error('unhealthy');
        const data = await res.json();
        if (!cancelled) {
          setApiOk(true);
          setDbReady(Boolean(data.db_ready));
        }
      } catch {
        if (!cancelled) {
          setApiOk(false);
          setDbReady(false);
        }
      }
    };

    check();
    const id = setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const items = [
    {
      label: 'API',
      ok: apiOk === true,
      warn: apiOk === null,
      detail: apiOk === false ? 'OFFLINE' : apiOk ? 'ONLINE' : '…',
      color: apiOk ? 'var(--accent-green)' : apiOk === false ? 'var(--accent-red)' : 'var(--accent-amber)',
    },
    {
      label: 'NASH',
      ok: apiOk === true,
      warn: apiOk === null,
      detail: apiOk ? 'READY' : apiOk === false ? 'DOWN' : '…',
      color: apiOk ? 'var(--accent-cyan)' : 'var(--accent-amber)',
    },
    {
      label: 'WS',
      ok: wsConnected,
      warn: !wsConnected && reconnectInSec > 0,
      detail: wsConnected ? 'LIVE' : reconnectInSec > 0 ? `RETRY ${reconnectInSec}s` : 'STANDBY',
      color: wsConnected ? 'var(--accent-cyan)' : 'var(--accent-amber)',
    },
    {
      label: 'DB',
      ok: dbReady === true,
      warn: dbReady === null,
      detail: dbReady ? 'READY' : dbReady === false ? 'NOT READY' : '…',
      color: dbReady ? 'var(--accent-green)' : 'var(--accent-amber)',
    },
    {
      label: 'AUTH',
      ok: true,
      detail: isApiKeyConfigured() ? 'KEY SET' : 'OPEN DEV',
      color: isApiKeyConfigured() ? 'var(--accent-purple)' : 'var(--text-muted)',
    },
    {
      label: 'THREAT',
      ok: threatLevel < 60,
      detail: threatLevel > 60 ? 'HIGH' : threatLevel > 30 ? 'MED' : 'LOW',
      color: threatLevel > 60 ? 'var(--accent-red)' : threatLevel > 30 ? 'var(--accent-amber)' : 'var(--accent-green)',
    },
  ];

  return (
    <footer className="system-status-bar">
      <div className="system-status-bar__glow" />
      <div className="system-status-bar__left">
        {items.map(({ label, warn, detail, color }) => (
          <div key={label} className="status-pill" title={`${label}: ${detail}`}>
            <span
              className="status-pill__dot"
              style={{
                background: color,
                boxShadow: `0 0 8px ${color}`,
                opacity: warn ? 0.5 : 1,
              }}
            />
            <span className="status-pill__label">{label}</span>
            <span className="status-pill__value" style={{ color }}>{detail}</span>
          </div>
        ))}
      </div>
      <div className="system-status-bar__center">
        <span className="system-status-bar__brand">CyberGameGT</span>
        <span className="system-status-bar__sep">·</span>
        <span>© 2026</span>
        <span className="system-status-bar__sep">·</span>
        <span>Techniques d&apos;Optimisation</span>
      </div>
      <div className="system-status-bar__badge">
        <span className="system-status-bar__badge-dot" />
        <span>v2.2 PRO</span>
      </div>
    </footer>
  );
}
