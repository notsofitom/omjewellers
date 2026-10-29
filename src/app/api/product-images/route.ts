import { cloudinary } from "@/lib/cloudinary";
import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";



  export async function GET(request: Request) {
    if (!(await isOwnerAuthenticated())) {
      return NextResponse.json(
        { error: "Please log in as the shop owner." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "A product ID is required." },
        { status: 400 }
      );
    }

    try {
      const images = await prisma.productImage.findMany({
        where: { productId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          imagePath: true,
          isPrimary: true,
          sortOrder: true,
        },
      });

      return NextResponse.json(images, {
        headers: { "Cache-Control": "no-store" },
      });
    } catch (error) {
      console.error("Loading product images failed:", error);

      return NextResponse.json(
        { error: "Could not load product images." },
        { status: 500 }
      );
    }
  }

  export async function PATCH(request: Request) {
    if (!(await isOwnerAuthenticated())) {
      return NextResponse.json(
        { error: "Please log in as the shop owner." },
        { status: 401 }
      );
    }

    try {
      const body = await request.json();
      const { productId, imageId } = body;

      if (
        typeof productId !== "string" ||
        !productId ||
        typeof imageId !== "string" ||
        !imageId
      ) {
        return NextResponse.json(
          { error: "Product ID and image ID are required." },
          { status: 400 }
        );
      }

      const image = await prisma.productImage.findFirst({
        where: { id: imageId, productId },
        select: { id: true, imagePath: true },
      });

      if (!image) {
        return NextResponse.json(
          { error: "Photo not found for this product." },
          { status: 404 }
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.productImage.updateMany({
          where: { productId },
          data: { isPrimary: false },
        });

        await tx.productImage.update({
          where: { id: image.id },
          data: { isPrimary: true },
        });

        await tx.product.update({
          where: { id: productId },
          data: { imagePath: image.imagePath },
        });
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Setting primary product image failed:", error);

      return NextResponse.json(
        { error: "Could not set the main photo." },
        { status: 500 }
      );
    }
  }

  export async function DELETE(request: Request) {
    if (!(await isOwnerAuthenticated())) {
      return NextResponse.json(
        { error: "Please log in as the shop owner." },
        { status: 401 }
      );
    }

    try {
      const body = await request.json();
      const { productId, imageId } = body;

      if (
        typeof productId !== "string" ||
        !productId ||
        typeof imageId !== "string" ||
        !imageId
      ) {
        return NextResponse.json(
          { error: "Product ID and image ID are required." },
          { status: 400 }
        );
      }

      const image = await prisma.productImage.findFirst({
        where: { id: imageId, productId },
        select: {
          id: true,
          imagePath: true,
          publicId: true,
          isPrimary: true,
        },
      });

      if (!image) {
        return NextResponse.json(
          { error: "Photo not found for this product." },
          { status: 404 }
        );
      }

      const remainingImages = await prisma.productImage.findMany({
        where: {
          productId,
          id: { not: imageId },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          imagePath: true,
        },
      });

      const nextPrimary = image.isPrimary
        ? remainingImages[0]
        : undefined;

      await prisma.$transaction(async (tx) => {
        await tx.productImage.delete({
          where: { id: imageId },
        });

        if (nextPrimary) {
          await tx.productImage.updateMany({
            where: { productId },
            data: { isPrimary: false },
          });

          await tx.productImage.update({
            where: { id: nextPrimary.id },
            data: { isPrimary: true },
          });
        }

        if (image.isPrimary) {
          await tx.product.update({
            where: { id: productId },
            data: {
              imagePath: nextPrimary?.imagePath ?? "/images/placeholder.png",
            },
          });
        }
      });

      if (image.publicId) {
        try {
          await cloudinary.uploader.destroy(image.publicId);
        } catch (cloudinaryError) {
          console.error("Cloudinary photo deletion failed:", cloudinaryError);
        }
      }

      return NextResponse.json({
        success: true,
        primaryImageId: nextPrimary?.id ?? null,
      });
    } catch (error) {
      console.error("Deleting product image failed:", error);

      return NextResponse.json(
        { error: "Could not delete the photo." },
        { status: 500 }
      );
    }
  }
