import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { wsUrl } from '../lib/apiClient';

export const useWebSocket = () => {
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const addAILog = useGameStore(state => state.addAILog);
  const setThreatLevel = useGameStore(state => state.setThreatLevel);
  const [connected, setConnected] = useState(false);
  const [reconnectInSec, setReconnectInSec] = useState(0);

  useEffect(() => {
    const connectWS = () => {
      try {
        ws.current = new WebSocket(wsUrl('/ws/threats'));

        ws.current.onopen = () => {
          setConnected(true);
          setReconnectInSec(0);
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
          // Reconnect after 8 seconds with visible countdown.
          const delaySec = 8;
          setReconnectInSec(delaySec);
          const countdown = setInterval(() => {
            setReconnectInSec((prev) => (prev > 0 ? prev - 1 : 0));
          }, 1000);
          reconnectTimer.current = setTimeout(() => {
            clearInterval(countdown);
            connectWS();
          }, delaySec * 1000);
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

  return { connected, reconnectInSec };
};
