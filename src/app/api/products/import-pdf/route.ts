import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { isOwnerAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_PAGES = 20;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
const EXISTING_CATEGORIES = new Set([
  "CUBAN-BRACELETS",
  "CUBAN-BRACELETS-9K",
  "dokiya-9k",
  "GENTS-BRACELETS-9K",
  "GENTS-CHAINS",
  "GOD-PENDANTS",
  "LADIES-CHAINS9K",
  "PENDANT-SETS-CZ",
]);

type UploadedImage = { secure_url: string; public_id: string };

function uploadImage(file: File): Promise<UploadedImage> {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "omjewellers/products", resource_type: "image", format: "jpg", allowed_formats: ["jpg", "jpeg"] },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Cloudinary returned no result."));
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        }
      );
      stream.end(Buffer.from(await file.arrayBuffer()));
    } catch (error) {
      reject(error);
    }
  });
}

export async function POST(request: Request) {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ error: "Please log in as the shop owner." }, { status: 401 });
  }

  const uploadedIds: string[] = [];
  const createdIds: string[] = [];
  try {
    const form = await request.formData();
    const categoryValue = form.get("category");
    const nameValue = form.get("name");
    const referencesValue = form.get("references");
    const files = form.getAll("pages");

    if (typeof categoryValue !== "string") {
      return NextResponse.json({ error: "Choose a product category." }, { status: 400 });
    }
    const category = categoryValue.trim();
    if ((!EXISTING_CATEGORIES.has(category) && !/^[A-Za-z0-9][A-Za-z0-9 _&-]{1,59}$/.test(category))) {
      return NextResponse.json({ error: "Category must be 2–60 letters, numbers, spaces, dashes, or underscores." }, { status: 400 });
    }
    if (typeof referencesValue !== "string") {
      return NextResponse.json({ error: "Product references are required." }, { status: 400 });
    }
    let references: unknown;
    try { references = JSON.parse(referencesValue); } catch {
      return NextResponse.json({ error: "Product references are invalid." }, { status: 400 });
    }
    if (!Array.isArray(references) || references.length < 1 || references.length > MAX_PAGES || references.length !== files.length) {
      return NextResponse.json({ error: `Select between 1 and ${MAX_PAGES} pages to import at a time.` }, { status: 400 });
    }
    if (!references.every((value) => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/.test(value.trim())) || new Set(references).size !== references.length) {
      return NextResponse.json({ error: "References must be unique and use letters, numbers, dots, dashes, or underscores (up to 40 characters)." }, { status: 400 });
    }
    if (typeof nameValue !== "string" || nameValue.length > 120) {
      return NextResponse.json({ error: "Product name must be 120 characters or fewer." }, { status: 400 });
    }
    const images = files.filter((file): file is File => file instanceof File);
    if (images.length !== files.length || images.some((file) => file.type !== "image/jpeg" || file.size === 0 || file.size > MAX_IMAGE_SIZE)) {
      return NextResponse.json({ error: "Each page must be a JPG image no larger than 5 MB." }, { status: 400 });
    }
    if (images.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_SIZE) {
      return NextResponse.json({ error: "The selected page images are too large to upload together. Import fewer pages at a time." }, { status: 413 });
    }

    const uploaded: UploadedImage[] = [];
    for (const file of images) {
      const result = await uploadImage(file);
      uploaded.push(result);
      uploadedIds.push(result.public_id);
    }

    const savedReferences: string[] = [];
    for (let index = 0; index < images.length; index += 1) {
      const product = await prisma.product.create({
        data: {
          reference: (references[index] as string).trim(),
          name: nameValue.trim() || null,
          category,
          imagePath: uploaded[index].secure_url,
          images: {
            create: {
              imagePath: uploaded[index].secure_url,
              publicId: uploaded[index].public_id,
              isPrimary: true,
              sortOrder: 0,
            },
          },
        },
        select: { id: true, reference: true },
      });
      createdIds.push(product.id);
      savedReferences.push(product.reference);
    }

    return NextResponse.json({ imported: savedReferences.length, references: savedReferences }, { status: 201 });
  } catch (error) {
    await prisma.product.deleteMany({ where: { id: { in: createdIds } } }).catch(() => undefined);
    await Promise.all(uploadedIds.map((publicId) => cloudinary.uploader.destroy(publicId).catch(() => undefined)));
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "One of these references is already in use. Change the starting number and try again." }, { status: 409 });
    }
    console.error("PDF page import failed:", error);
    return NextResponse.json({ error: "PDF pages could not be imported. Please try again." }, { status: 500 });
  }
}
