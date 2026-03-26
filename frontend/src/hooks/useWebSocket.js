import { useEffect, useRef, useCallback, useState } from "react";
import { WS_URL } from "../utils/constants";

export function useWebSocket(onMessage) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onMessage(data);
      } catch (err) {
        console.error("Failed to parse WS message:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected, reconnecting in 3s...");
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      ws.close();
    };

    wsRef.current = ws;
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendAction = useCallback((action, incidentId, timestamp) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, incidentId, timestamp }));
    }
  }, []);

  return { connected, sendAction };
}