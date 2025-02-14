import { useEffect, useState } from 'react';
import { Status } from '@prisma/client';

interface StatusUpdate {
  monitorId: string;
  status: Status;
  timestamp: string;
}

export function useMonitorStatus(monitorId: string, initialStatus: Status) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.hostname}:8080`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'STATUS_UPDATE' && message.data.monitorId === monitorId) {
          setStatus(message.data.status);
          setLastUpdate(message.data.timestamp);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [monitorId]);

  return { status, lastUpdate };
}