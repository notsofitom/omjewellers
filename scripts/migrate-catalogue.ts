import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient as SqlitePrismaClient } from "../src/generated/prisma/client";
import { PrismaClient as PostgresPrismaClient } from "../src/generated/postgresql/client";

async function migrateCatalogue() {
  const targetUrl = process.env.POSTGRES_DATABASE_URL;
  if (!targetUrl) {
    throw new Error("Set POSTGRES_DATABASE_URL to the hosted PostgreSQL connection string before running this migration.");
  }

  const includeEnquiries = process.argv.includes("--include-enquiries");
  const source = new SqlitePrismaClient({
    adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }),
  });
  const target = new PostgresPrismaClient({ adapter: new PrismaPg({ connectionString: targetUrl }) });

  try {
    const products = await source.product.findMany({ include: { images: true }, orderBy: { createdAt: "asc" } });
    for (const product of products) {
      const { images, ...data } = product;
      await target.product.upsert({ where: { id: product.id }, create: data, update: data });
      for (const image of images) {
        await target.productImage.upsert({
          where: { id: image.id },
          create: image,
          update: image,
        });
      }
    }

    let enquiryCount = 0;
    if (includeEnquiries) {
      const enquiries = await source.enquiry.findMany({ orderBy: { createdAt: "asc" } });
      for (const enquiry of enquiries) {
        await target.enquiry.upsert({ where: { id: enquiry.id }, create: enquiry, update: enquiry });
      }
      enquiryCount = enquiries.length;
    }

    console.log(`Copied ${products.length} products and ${products.reduce((count, product) => count + product.images.length, 0)} product images.`);
    console.log(includeEnquiries
      ? `Also copied ${enquiryCount} enquiries.`
      : "Existing customer enquiries were skipped. Rerun with --include-enquiries only if you want to transfer them.");
  } finally {
    await Promise.all([source.$disconnect(), target.$disconnect()]);
  }
}

migrateCatalogue().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
