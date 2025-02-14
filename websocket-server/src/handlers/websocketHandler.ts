export function handleConnection(ws: WebSocket) {
  console.log('Client connected');

  ws.on('message', (message: string) => {
    console.log(`Received message: ${message}`);
    // Process the incoming message and send a response if needed
    ws.send(`Echo: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
}