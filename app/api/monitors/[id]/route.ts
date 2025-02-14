import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createMonitorSchema } from "@/lib/validations/monitor";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const monitor = await prisma.monitor.findUnique({
      where: { id: params.id },
    });

    if (!monitor) {
      return new NextResponse("Monitor not found", { status: 404 });
    }

    if (monitor.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete related records first
    await prisma.event.deleteMany({
      where: { monitorId: params.id },
    });

    await prisma.webhook.deleteMany({
      where: { monitorId: params.id },
    });

    await prisma.notification.deleteMany({
      where: { monitorId: params.id },
    });

    // Delete the monitor
    await prisma.monitor.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Monitor deletion error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const body = createMonitorSchema.parse(json);

    const monitor = await prisma.monitor.findUnique({
      where: { id: params.id },
      include: { webhook: true },
    });

    if (!monitor) {
      return new NextResponse("Monitor not found", { status: 404 });
    }

    if (monitor.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Update webhook if it exists
    if (body.webhook) {
      if (monitor.webhook) {
        await prisma.webhook.update({
          where: { monitorId: params.id },
          data: {
            url: body.webhook.url,
            message: body.webhook.message || { message: "Monitor status changed" },
          },
        });
      } else {
        await prisma.webhook.create({
          data: {
            url: body.webhook.url,
            message: body.webhook.message || { message: "Monitor status changed" },
            monitorId: params.id,
          },
        });
      }
    } else if (monitor.webhook) {
      await prisma.webhook.delete({
        where: { monitorId: params.id },
      });
    }

    // Update monitor
    const updatedMonitor = await prisma.monitor.update({
      where: { id: params.id },
      data: {
        name: body.name,
        url: body.url,
        interval: body.interval,
        timeout: body.timeout,
      },
      include: {
        events: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10,
        },
        webhook: true,
      },
    });

    return NextResponse.json(updatedMonitor);
  } catch (error) {
    console.error("Monitor update error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}