
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwnerAuthenticated } from "@/lib/auth";
import { getConfiguredMetalRates } from "@/lib/metal-rates";

export async function GET() {
  try {
    const isOwner = await isOwnerAuthenticated();

    const products = await prisma.product.findMany({
      where: isOwner ? {} : { isActive: true },
      orderBy: { createdAt: "desc" },
      select: isOwner
        ? undefined
        : {
            id: true,
            reference: true,
            name: true,
            category: true,
            imagePath: true,
            price: true,
            description: true,
            isActive: true,
            homeFeaturedOrder: true,
            createdAt: true,
            updatedAt: true,
          },
    });

    return NextResponse.json(products, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Could not load products:", error);
    return NextResponse.json(
      { error: "Could not load products." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const reference =
      typeof body.reference === "string" ? body.reference.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() : "";
    const imagePath =
      typeof body.imagePath === "string" ? body.imagePath.trim() : "";

    if (!reference || !category || !imagePath) {
      return NextResponse.json(
        { error: "Reference, category, and image are required." },
        { status: 400 }
      );
    }

    const allowedCategories = [
      "CUBAN-BRACELETS",
      "CUBAN-BRACELETS-9K",
      "dokiya-9k",
      "GENTS-BRACELETS-9K",
      "GENTS-CHAINS",
      "GOD-PENDANTS",
      "LADIES-CHAINS9K",
      "PENDANT-SETS-CZ",
    ];

    if (!allowedCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid catalogue category." },
        { status: 400 }
      );
    }

    const imageMatch = imagePath.match(
      /^\/catalogue\/([^/]+)\/(page_\d{3}_image_01\.jpeg)$/
    );

    if (!imageMatch || imageMatch[1] !== category) {
      return NextResponse.json(
        { error: "Image path does not match the selected category." },
        { status: 400 }
      );
    }

    const imageNumber = Number(imageMatch[2].match(/\d+/)?.[0]);

    const imageCounts: Record<string, number> = {
      "CUBAN-BRACELETS": 41,
      "CUBAN-BRACELETS-9K": 32,
      "dokiya-9k": 12,
      "GENTS-BRACELETS-9K": 34,
      "GENTS-CHAINS": 16,
      "GOD-PENDANTS": 54,
      "LADIES-CHAINS9K": 28,
      "PENDANT-SETS-CZ": 11,
    };

    if (!imageNumber || imageNumber > imageCounts[category]) {
      return NextResponse.json(
        { error: "That image does not exist in the selected category." },
        { status: 400 }
      );
    }

    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : null;
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;

    const price =
      body.price === "" || body.price === null || body.price === undefined
        ? null
        : Number(body.price);

    const weight = body.weight === "" || body.weight === null || body.weight === undefined
      ? null
      : Number(body.weight);
    const carat = weight === null || body.carat === "" || body.carat === null || body.carat === undefined
      ? null
      : Number(body.carat);
    const labourCharge = body.labourCharge === "" || body.labourCharge === null || body.labourCharge === undefined
      ? null
      : Number(body.labourCharge);

    const stock =
      body.stock === "" || body.stock === null || body.stock === undefined
        ? null
        : Number(body.stock);

    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      return NextResponse.json(
        { error: "Price must be a valid non-negative number." },
        { status: 400 }
      );
    }

    if ((weight === null) !== (carat === null)) {
      return NextResponse.json({ error: "Enter both product weight and carat to calculate its price." }, { status: 400 });
    }
    if (weight !== null && (!Number.isFinite(weight) || weight <= 0)) {
      return NextResponse.json({ error: "Product weight must be greater than zero grams." }, { status: 400 });
    }
    if (carat !== null && (![9, 18, 20, 22, 24].includes(carat))) {
      return NextResponse.json({ error: "Choose a supported gold purity: 9K, 18K, 20K, 22K or 24K." }, { status: 400 });
    }
    if (weight !== null && (labourCharge === null || !Number.isFinite(labourCharge) || labourCharge < 0)) {
      return NextResponse.json({ error: "Enter a valid category labour charge of zero or more." }, { status: 400 });
    }

    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
      return NextResponse.json(
        { error: "Stock must be a whole number of zero or more." },
        { status: 400 }
      );
    }

    
    let calculatedPrice = price;
    let goldRatePerGram: number | null = null;
    if (weight !== null && carat !== null) {
      try {
        const manualRates = await getConfiguredMetalRates();
        const rate = manualRates.rates.find((item) => item.purity === `${carat}K`)?.ratePerGram;
        if (rate === undefined) {
          return NextResponse.json({ error: `Set the ${carat}K rate in the owner dashboard before calculating this product.` }, { status: 400 });
        }
        goldRatePerGram = rate;
        calculatedPrice = Number((weight * rate + labourCharge!).toFixed(2));
      } catch {
        return NextResponse.json({ error: "Could not load the owner-set gold rates. Try again shortly." }, { status: 503 });
      }
    }

    const product = await prisma.$transaction(async (transaction) => {
      if (labourCharge !== null) {
        const previousCharge = await transaction.categoryLabourCharge.findUnique({ where: { category } });
        if (previousCharge && previousCharge.amount !== labourCharge) {
          const pricedProducts = await transaction.product.findMany({
            where: { category, weight: { not: null }, goldRatePerGram: { not: null } },
            select: { id: true, weight: true, goldRatePerGram: true },
          });
          await Promise.all(pricedProducts.map((item) => transaction.product.update({
            where: { id: item.id },
            data: { price: Number((item.weight! * item.goldRatePerGram! + labourCharge).toFixed(2)) },
          })));
        }
        await transaction.categoryLabourCharge.upsert({
          where: { category },
          create: { category, amount: labourCharge },
          update: { amount: labourCharge },
        });
      }

      return transaction.product.create({
        data: {
        reference,
        name,
        category,
        imagePath,
        originalImagePath: imagePath,
        price: calculatedPrice,
        weight,
        carat,
        goldRatePerGram,
        stock,
        description,
        },
      });
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That internal reference is already in use." },
        { status: 409 }
      );
    }

    console.error("Could not save product:", error);
    return NextResponse.json(
      { error: "Could not save product. Check the terminal for details." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        { error: "A valid product ID is required." },
        { status: 400 }
      );
    }

    const data: {
      reference?: string;
      name?: string | null;
      price?: number | null;
      weight?: number | null;
      carat?: number | null;
      goldRatePerGram?: number | null;
      stock?: number | null;
      description?: string | null;
      isActive?: boolean;
    } = {};

    if ("reference" in body) {
      if (
        typeof body.reference !== "string" ||
        !body.reference.trim()
      ) {
        return NextResponse.json(
          { error: "Reference cannot be empty." },
          { status: 400 }
        );
      }
      data.reference = body.reference.trim();
    }

    if ("name" in body) {
      if (body.name !== null && typeof body.name !== "string") {
        return NextResponse.json(
          { error: "Name must be text." },
          { status: 400 }
        );
      }
      data.name = body.name?.trim() || null;
    }

    if ("price" in body) {
      if (
        body.price !== null &&
        (typeof body.price !== "number" ||
          !Number.isFinite(body.price) ||
          body.price < 0)
      ) {
        return NextResponse.json(
          { error: "Price must be a non-negative number or empty." },
          { status: 400 }
        );
      }
      data.price = body.price;
    }

    if ("weight" in body || "carat" in body) {
      const weight = body.weight === null || body.weight === "" ? null : Number(body.weight);
      const carat = body.carat === null || body.carat === "" ? null : Number(body.carat);
      if ((weight === null) !== (carat === null)) {
        return NextResponse.json({ error: "Enter both product weight and carat to calculate its price." }, { status: 400 });
      }
      if (weight !== null && (!Number.isFinite(weight) || weight <= 0)) {
        return NextResponse.json({ error: "Product weight must be greater than zero grams." }, { status: 400 });
      }
      if (carat !== null && ![9, 18, 20, 22, 24].includes(carat)) {
        return NextResponse.json({ error: "Choose a supported gold purity: 9K, 18K, 20K, 22K or 24K." }, { status: 400 });
      }

      if (weight !== null && carat !== null) {
        const existing = await prisma.product.findUnique({ where: { id }, select: { category: true } });
        if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });
        const labour = await prisma.categoryLabourCharge.findUnique({ where: { category: existing.category } });
        if (!labour) return NextResponse.json({ error: "Set a labour charge for this category from the add product form first." }, { status: 400 });
        try {
          const manualRates = await getConfiguredMetalRates();
          const rate = manualRates.rates.find((item) => item.purity === `${carat}K`)?.ratePerGram;
          if (rate === undefined) {
            return NextResponse.json({ error: `Set the ${carat}K rate in the owner dashboard before calculating this product.` }, { status: 400 });
          }
          data.price = Number((weight * rate + labour.amount).toFixed(2));
          data.goldRatePerGram = rate;
        } catch {
          return NextResponse.json({ error: "Could not load the owner-set gold rates. Try again shortly." }, { status: 503 });
        }
      } else {
        data.price = null;
        data.goldRatePerGram = null;
      }

      data.weight = weight;
      data.carat = carat;
    }

    if ("stock" in body) {
      if (
        body.stock !== null &&
        (!Number.isInteger(body.stock) || body.stock < 0)
      ) {
        return NextResponse.json(
          { error: "Stock must be a whole number of zero or more, or empty." },
          { status: 400 }
        );
      }
      data.stock = body.stock;
    }

    if ("description" in body) {
      if (
        body.description !== null &&
        typeof body.description !== "string"
      ) {
        return NextResponse.json(
          { error: "Description must be text." },
          { status: 400 }
        );
      }
      data.description = body.description?.trim() || null;
    }

    if ("isActive" in body) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { error: "Product status must be active or inactive." },
          { status: 400 }
        );
      }
      data.isActive = body.isActive;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No changes were provided." },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json(product);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That reference is already used by another product." },
        { status: 409 }
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    console.error("Product update failed:", error);

    return NextResponse.json(
      { error: "Could not update the product." },
      { status: 500 }
    );
  }
}
