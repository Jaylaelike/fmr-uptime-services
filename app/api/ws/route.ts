import { NextResponse } from 'next/server';
import { initWebSocket } from '@/lib/websocket';

export function GET(req: Request) {
  // Upgrade the HTTP connection to a WebSocket connection
  const { socket: res } = req as any;
  
  if (!res.socket) {
    return new NextResponse('WebSocket server not available', { status: 500 });
  }

  try {
    initWebSocket(res.socket.server);
    return new NextResponse('WebSocket connection established');
  } catch (error) {
    console.error('WebSocket initialization error:', error);
    return new NextResponse('WebSocket initialization failed', { status: 500 });
  }
}