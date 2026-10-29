import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const charges = await prisma.categoryLabourCharge.findMany({
      select: { category: true, amount: true },
    });
    return NextResponse.json(Object.fromEntries(charges.map(({ category, amount }) => [category, amount])), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Could not load category labour charges:", error);
    return NextResponse.json({ error: "Could not load category labour charges." }, { status: 500 });
  }
}
