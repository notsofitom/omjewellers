import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const settings = await prisma.billingSettings.findUnique({ where: { id: "shop" } });
    return NextResponse.json({ gstNumber: settings?.gstNumber ?? null });
  } catch (error) {
    console.error("Could not load billing settings:", error);
    return NextResponse.json({ error: "Could not load the shop billing settings." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (typeof body.gstNumber !== "string") {
      return NextResponse.json({ error: "Enter the GSTIN as text, or leave it blank." }, { status: 400 });
    }

    const gstNumber = body.gstNumber.trim().replace(/\s+/g, "").toUpperCase() || null;
    if (gstNumber !== null && !/^[0-9A-Z]{15}$/.test(gstNumber)) {
      return NextResponse.json({ error: "An Indian GSTIN must contain 15 letters and numbers." }, { status: 400 });
    }

    const settings = await prisma.billingSettings.upsert({
      where: { id: "shop" },
      create: { id: "shop", gstNumber },
      update: { gstNumber },
    });

    return NextResponse.json({ gstNumber: settings.gstNumber });
  } catch (error) {
    console.error("Could not save billing settings:", error);
    return NextResponse.json({ error: "Could not save the shop billing settings." }, { status: 500 });
  }
}
