import { Server } from 'ws';
import { createServer } from 'http';
import { WebSocketMessage } from '../src/types'; // Adjust the import based on your actual types

const server = createServer();
const wss = new Server({ server });

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message: string) => {
    const parsedMessage: WebSocketMessage = JSON.parse(message);
    console.log('Received message:', parsedMessage);

    // Handle the message and send a response if needed
    // Example: ws.send(JSON.stringify({ type: 'RESPONSE', data: 'Your response here' }));
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});