import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export const useWebSocket = () => {
  const ws = useRef(null);
  const addAILog = useGameStore(state => state.addAILog);
  const setThreatLevel = useGameStore(state => state.setThreatLevel);

  useEffect(() => {
    // Attempt to connect to the backend WS
    const connectWS = () => {
      try {
        // Use relative path for proxy, or full URL
        const wsUrl = window.location.protocol === 'https:' ? 'wss://' : 'ws://' + window.location.host + '/ws/monitor';
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log("WebSocket connected to AI Monitor");
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'log') {
              addAILog({
                time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                text: data.message,
                color: data.color || 'cyan'
              });
            } else if (data.type === 'threat_update') {
              setThreatLevel(data.level);
            }
          } catch (e) {
            console.error("Error parsing WS message:", e);
          }
        };

        ws.current.onclose = () => {
          console.log("WebSocket disconnected. Reconnecting in 5s...");
          setTimeout(connectWS, 5000);
        };
      } catch (e) {
        console.error("WebSocket connection failed", e);
      }
    };

    connectWS();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [addAILog, setThreatLevel]);

  return ws.current;
};
