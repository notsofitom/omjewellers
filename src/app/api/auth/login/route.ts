
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createOwnerSession } from "@/lib/auth";



export async function POST(request: Request) {
  try {
    const passwordHash = process.env.OWNER_PASSWORD_HASH;

    if (!passwordHash) {
      console.error("OWNER_PASSWORD_HASH is not configured.");
      return NextResponse.json(
        { error: "Login is temporarily unavailable." },
        { status: 500 }
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("password" in body) ||
      typeof body.password !== "string" ||
      body.password.length === 0 ||
      body.password.length > 1024
    ) {
      return NextResponse.json(
        { error: "Invalid password." },
        { status: 400 }
      );
    }

    const validPassword = await bcrypt.compare(
      body.password,
      passwordHash
    );
    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid password." },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    await createOwnerSession();

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Unable to process login." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
