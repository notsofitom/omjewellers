
import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";


const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(request: Request) {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json(
      { error: "Please log in as the shop owner." },
      { status: 401 }
    );
  }

  let uploadedPublicId: string | undefined;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const productId = formData.get("productId");

    if (typeof productId !== "string" || !productId.trim()) {
      return NextResponse.json(
        { error: "A product ID is required." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select an image file." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Use a JPG, PNG, or WebP image." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be larger than 0 and no more than 5 MB." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, imagePath: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "omjewellers/products",
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary returned no result."));
            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );

      stream.end(buffer);
    });

    uploadedPublicId = uploadResult.public_id;

    const imageCount = await prisma.productImage.count({
      where: { productId: product.id },
    });

    const savedImage = await prisma.productImage.create({
        data: {
            productId: product.id,
            imagePath: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            isPrimary: imageCount === 0,
            sortOrder: imageCount,
        },
    });

    return NextResponse.json(
      {
        id: savedImage.id,
        imagePath: savedImage.imagePath,
        isPrimary: savedImage.isPrimary,
        sortOrder: savedImage.sortOrder,
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId);
      } catch (cleanupError) {
        console.error("Cloudinary cleanup failed:", cleanupError);
      }
    }

    console.error("Product image upload failed:", error);

    return NextResponse.json(
      { error: "Image upload failed. Please try again." },
      { status: 500 }
    );
  }
}
