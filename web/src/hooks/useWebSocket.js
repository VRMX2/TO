import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export const useWebSocket = () => {
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const addAILog = useGameStore(state => state.addAILog);
  const setThreatLevel = useGameStore(state => state.setThreatLevel);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const buildWebSocketUrl = () => {
      const envUrl = import.meta.env.VITE_WS_URL;
      if (envUrl) return envUrl;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}/ws/threats`;
    };

    const connectWS = () => {
      try {
        // Uses same host by default; can be overridden with VITE_WS_URL.
        ws.current = new WebSocket(buildWebSocketUrl());

        ws.current.onopen = () => {
          setConnected(true);
          addAILog({
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            text: 'WebSocket connected — live threat stream active',
            color: 'green'
          });
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'connected') return; // skip ack
            if (data.type === 'pong') return;

            if (data.type === 'threat_event') {
              // Update threat level
              setThreatLevel(prev => Math.min(100, Math.max(5, prev + (data.status === 'breached' ? 5 : data.status === 'detected' ? 1 : -2))));

              const colorMap = { breached: 'red', detected: 'amber', blocked: 'green' };
              addAILog({
                time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                text: `[${data.status?.toUpperCase()}] ${data.attack_type} → ${data.target_node} (sev: ${data.severity})`,
                color: colorMap[data.status] || 'secondary'
              });
            }
          } catch (e) {
            console.warn('WS parse error:', e);
          }
        };

        ws.current.onclose = () => {
          setConnected(false);
          // Reconnect after 8 seconds
          reconnectTimer.current = setTimeout(connectWS, 8000);
        };

        ws.current.onerror = () => {
          ws.current?.close();
        };

        // Keep-alive ping every 30s
        const pingInterval = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        return () => clearInterval(pingInterval);
      } catch (e) {
        console.warn('WebSocket connection failed:', e);
      }
    };

    connectWS();

    return () => {
      clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return connected;
};
