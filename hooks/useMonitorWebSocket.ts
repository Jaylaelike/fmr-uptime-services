

import { useEffect, useCallback } from 'react';
import { Monitor } from '@prisma/client';

type WebSocketMessage = {
  type: 'MONITOR_UPDATE' | 'STATUS_CHANGE';
  data: any;
};

export function useMonitorWebSocket(onUpdate: (monitor: Monitor) => void) {
  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'MONITOR_UPDATE') {
      onUpdate(message.data);
    } else if (message.type === 'STATUS_CHANGE') {
      // Handle status change
      const { monitorId, status } = message.data;
      onUpdate({ id: monitorId, status } as Monitor);
    }
  }, [onUpdate]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${process.env.NEXT_PUBLIC_WS_URL}/api/ws`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // return () => {
    //   ws.close();
    // };
  }, [handleMessage]);
}