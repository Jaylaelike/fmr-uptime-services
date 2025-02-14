import { WebSocket } from 'ws';
import { Monitor, Status } from '@prisma/client';

let wss: WebSocket.Server;

export function initWebSocket(server: any) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
}

export function broadcastMonitorUpdate(monitor: Monitor) {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'MONITOR_UPDATE',
    data: monitor
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function broadcastStatusChange(monitorId: string, status: Status) {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'STATUS_CHANGE',
    data: {
      monitorId,
      status
    }
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

