import { NextResponse } from "next/server";
import { PrismaClient, Status } from "@prisma/client";
import axios from "axios";
import { broadcastStatusChange } from "@/lib/websocket";

const prisma = new PrismaClient();

async function checkUrl(url: string, timeout: number): Promise<boolean> {
  try {
    await axios.get(url, { timeout: timeout * 1000 });
    return true;
  } catch (error) {
    return false;
  }
}

export async function POST() {
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
          const webhookMessage = monitor.webhook.message as any;
          const payload = newStatus === Status.DOWN ? 
            webhookMessage.down || { message: "Offline" } : 
            webhookMessage.up || { message: "Online" };

          try {
            await axios.post(monitor.webhook.url, payload);
          } catch (error) {
            console.error("Webhook delivery failed:", error);
          }
        }

        // Broadcast status change via WebSocket
        broadcastStatusChange(monitor.id, newStatus);
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Monitor check error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}