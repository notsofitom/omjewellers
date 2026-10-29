import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        reference: true,
        name: true,
        category: true,
        imagePath: true,
        homeFeaturedOrder: true,
      },
    });

    return NextResponse.json(products, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Could not load homepage photos:", error);
    return NextResponse.json(
      { error: "Could not load homepage photos." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const productIds: unknown = body?.productIds;

    if (
      !Array.isArray(productIds) ||
      productIds.length > 5 ||
      productIds.some((id) => typeof id !== "string" || !id.trim()) ||
      new Set(productIds).size !== productIds.length
    ) {
      return NextResponse.json(
        { error: "Choose up to five different products." },
        { status: 400 }
      );
    }

    const validProducts = await prisma.product.findMany({
      where: { id: { in: productIds as string[] }, isActive: true },
      select: { id: true },
    });

    if (validProducts.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more selected products are no longer active." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.product.updateMany({
        where: { homeFeaturedOrder: { not: null } },
        data: { homeFeaturedOrder: null },
      });

      for (const [order, id] of (productIds as string[]).entries()) {
        await transaction.product.update({
          where: { id },
          data: { homeFeaturedOrder: order },
        });
      }
    });

    return NextResponse.json({ productIds });
  } catch (error) {
    console.error("Could not save homepage photos:", error);
    return NextResponse.json(
      { error: "Could not save homepage photos." },
      { status: 500 }
    );
  }
}
