import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const exists = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (exists) {
      return new NextResponse("User already exists", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}