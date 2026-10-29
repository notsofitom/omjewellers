import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/postgresql/client";

type PublicProduct = {
  reference: string;
  name: string | null;
  category: string;
  imagePath: string;
  price: number | null;
  description: string | null;
  isActive: boolean;
  homeFeaturedOrder: number | null;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to import the public catalogue.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
try {
  const currentCount = await prisma.product.count();
  if (currentCount > 0) {
    console.log(`Catalogue already has ${currentCount} products; leaving it unchanged.`);
  } else {
    const products = JSON.parse(
      await readFile(join(process.cwd(), "data", "public-products.json"), "utf8"),
    ) as PublicProduct[];
    await prisma.$transaction(
      products.map((product) => prisma.product.create({ data: product })),
    );
    console.log(`Imported ${products.length} public products into the new OM Jewellers catalogue.`);
  }
} finally {
  await prisma.$disconnect();
}
