import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { createMonitorSchema } from "@/lib/validations/monitor";
import { ZodError } from "zod";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const body = createMonitorSchema.parse(json);

    const monitor = await prisma.monitor.create({
      data: {
        name: body.name,
        url: body.url,
        interval: body.interval,
        timeout: body.timeout,
        user: {
          connect: {
            id: session.user.id
          }
        },
        webhook: body.webhook ? {
          create: {
            url: body.webhook.url,
            message: body.webhook.message || { message: "Monitor status changed" }
          }
        } : undefined
      },
      include: {
        events: true,
        webhook: true
      }
    });

    return NextResponse.json(monitor);
  } catch (error) {
    console.error("Monitor creation error:", error);

    if (error instanceof ZodError) {
      return new NextResponse(JSON.stringify({
        error: "Validation failed",
        details: error.errors
      }), { status: 400 });
    }

    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }), 
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const monitors = await prisma.monitor.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        events: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        webhook: true
      }
    });

    return NextResponse.json(monitors);
  } catch (error) {
    console.error("Failed to fetch monitors:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch monitors" }), 
      { status: 500 }
    );
  }
}