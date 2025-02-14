import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Call the monitor check endpoint
    await axios.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/monitors/check`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cron job error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}