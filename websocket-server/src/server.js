// Change require statements to import
import 'dotenv/config';
import { WebSocket, WebSocketServer } from 'ws';
import { PrismaClient, Status } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const wss = new WebSocketServer({ port: 8080 });

// Store connected clients
const clients = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  const clientId = Date.now();
  clients.set(clientId, ws);

  console.log(`Client connected: ${clientId}`);

  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
  });
});

// Broadcast status update to all connected clients
function broadcastStatusUpdate(monitorId, status) {
  const message = JSON.stringify({
    type: 'STATUS_UPDATE',
    data: {
      monitorId,
      status,
      timestamp: new Date().toISOString()
    }
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Check URL status
async function checkUrl(url, timeout) {
  try {
    await axios.get(url, {
      timeout: timeout * 1000,
      validateStatus: function (status) {
        return status >= 200 && status < 600; // Accept all status codes
      },
    });
    return true;
  } catch (error) {
    console.error(`Error checking ${url}:`, error.message);
    return false;
  }
}

// Monitor check function
async function checkMonitors() {
  try {
    const monitors = await prisma.monitor.findMany({
      where: {
        isActive: true
      },
      include: {
        webhook: true,
        events: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    for (const monitor of monitors) {
      const isUp = await checkUrl(monitor.url, monitor.timeout);
      const newStatus = isUp ? Status.UP : Status.DOWN;
      const lastStatus = monitor.events[0]?.status || null;

      // Only create event and send notification if status has changed
      if (lastStatus !== newStatus) {
        console.log(`Status changed for ${monitor.name}: ${newStatus}`);

        // Create event
        await prisma.event.create({
          data: {
            status: newStatus,
            monitorId: monitor.id
          }
        });

        // Create notification
        await prisma.notification.create({
          data: {
            message: `Monitor ${monitor.name} is ${newStatus}`,
            status: newStatus,
            userId: monitor.userId,
            monitorId: monitor.id
          }
        });

        // Send webhook if configured
        if (monitor.webhook) {
          const webhookMessage = monitor.webhook.message;
          const payload = newStatus === Status.DOWN ? 
            webhookMessage.down || { message: "Offline" } : 
            webhookMessage.up || { message: "Online" };

          try {
            await axios.post(monitor.webhook.url, payload);
            console.log(`Webhook sent for ${monitor.name}`);
          } catch (error) {
            console.error(`Webhook delivery failed for ${monitor.name}:`, error.message);
          }
        }

        // Broadcast status change
        broadcastStatusUpdate(monitor.id, newStatus);
      }

      // Update monitor status
      await prisma.monitor.update({
        where: { id: monitor.id },
        data: {
          status: newStatus,
          lastCheck: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Monitor check error:', error);
  }
}

// Start monitoring
async function startMonitoring() {
  console.log('Monitor server started');
  
  // Initial check
  await checkMonitors();

  // Schedule regular checks
  setInterval(async () => {
    await checkMonitors();
  }, 30000); // Check every 30 seconds
}

// Start the monitoring process
startMonitoring().catch(console.error);