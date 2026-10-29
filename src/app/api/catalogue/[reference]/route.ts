
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await context.params;

    const product = await prisma.product.findFirst({
      where: {
        reference,
        isActive: true,
      },
      select: {
        id: true,
        reference: true,
        name: true,
        category: true,
        imagePath: true,
        price: true,
        description: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch {
    return NextResponse.json(
      { error: "Unable to load product" },
      { status: 500 }
    );
  }
}
