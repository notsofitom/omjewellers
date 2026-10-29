
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SHOP_NAME } from "@/lib/shop-details";

export const instant = false;

export default async function ActiveProductsPage() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      reference: true,
      name: true,
      category: true,
      imagePath: true,
      price: true,
    },
  });

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="text-xl font-semibold">
            {SHOP_NAME}
          </Link>

          <Link
            href="/catalogue"
            className="text-sm font-medium text-amber-800 hover:underline"
          >
            All Products →
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Active Products</h1>
        <p className="mt-2 text-stone-600">
          Explore jewellery selected by our shop for customers.
        </p>

        {products.length === 0 ? (
          <p className="mt-8 rounded-xl border border-stone-200 bg-white p-6 text-stone-600">
            No active products are available yet. Please check back soon.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.reference}
                href={`/product/${encodeURIComponent(product.reference)}`}
                className="overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:border-amber-700 hover:shadow-md"
              >
                <div className="flex aspect-square items-center justify-center bg-white p-3">
                  <img
                    src={product.imagePath}
                    alt={product.name || `Jewellery ${product.reference}`}
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="p-4">
                  <h2 className="font-medium">
                    {product.name || "Jewellery"}
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {product.category.replaceAll("-", " ")}
                  </p>
                  {product.price !== null && (
                    <p className="mt-2 font-semibold">
                      ₹{product.price.toLocaleString("en-IN")}
                    </p>
                  )}
                  <p className="mt-3 text-sm font-medium text-amber-800">
                    View Product →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Link
          href="/"
          className="mt-10 inline-flex rounded-lg border border-stone-300 px-5 py-3 font-medium hover:bg-stone-100"
        >
          ← Back to Home
        </Link>
      </section>
    </main>
  );
}
