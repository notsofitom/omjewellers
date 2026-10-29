import { NextResponse } from "next/server";
import { getConfiguredMetalRates } from "@/lib/metal-rates";
import { isOwnerAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_PURITIES = new Set(["24K", "22K", "20K", "18K", "9K", "Silver"]);

export async function GET() {
  try {
    const rates = await getConfiguredMetalRates();
    return NextResponse.json(rates, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Could not load owner-set metal rates:", error);
    return NextResponse.json({ error: "Could not load the saved metal rates." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!Array.isArray(body.rates) || body.rates.length === 0) {
      return NextResponse.json({ error: "Enter at least one rate to save." }, { status: 400 });
    }

    const seen = new Set<string>();
    for (const item of body.rates) {
      if (!item || typeof item.purity !== "string" || !ALLOWED_PURITIES.has(item.purity)) {
        return NextResponse.json({ error: "One or more rate types are invalid." }, { status: 400 });
      }
      if (seen.has(item.purity)) {
        return NextResponse.json({ error: `Enter ${item.purity} only once.` }, { status: 400 });
      }
      seen.add(item.purity);
      if (item.ratePerGram !== null && (typeof item.ratePerGram !== "number" || !Number.isFinite(item.ratePerGram) || item.ratePerGram < 0)) {
        return NextResponse.json({ error: `${item.purity} rate must be a number of zero or more.` }, { status: 400 });
      }
    }

    await prisma.$transaction(async (transaction) => {
      for (const item of body.rates as { purity: string; ratePerGram: number | null }[]) {
        if (item.ratePerGram === null) {
          await transaction.manualMetalRate.deleteMany({ where: { purity: item.purity } });
        } else {
          await transaction.manualMetalRate.upsert({
            where: { purity: item.purity },
            create: { purity: item.purity, ratePerGram: item.ratePerGram },
            update: { ratePerGram: item.ratePerGram },
          });

          if (item.purity !== "Silver") {
            const carat = Number.parseInt(item.purity, 10);
            const products = await transaction.product.findMany({
              where: { carat, weight: { not: null } },
              select: { id: true, category: true, weight: true },
            });
            const categories = [...new Set(products.map((product) => product.category))];
            const labourCharges = categories.length > 0
              ? await transaction.categoryLabourCharge.findMany({
                  where: { category: { in: categories } },
                  select: { category: true, amount: true },
                })
              : [];
            const labourByCategory = new Map(labourCharges.map((charge) => [charge.category, charge.amount]));

            for (const product of products) {
              const labourCharge = labourByCategory.get(product.category);
              if (labourCharge === undefined || product.weight === null) continue;
              await transaction.product.update({
                where: { id: product.id },
                data: {
                  goldRatePerGram: item.ratePerGram,
                  price: Number((product.weight * item.ratePerGram + labourCharge).toFixed(2)),
                },
              });
            }
          }
        }
      }
    });

    return NextResponse.json(await getConfiguredMetalRates(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Could not save owner-set metal rates:", error);
    return NextResponse.json({ error: "Could not save the metal rates." }, { status: 500 });
  }
}
