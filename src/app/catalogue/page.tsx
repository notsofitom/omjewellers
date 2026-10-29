
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SHOP_NAME } from "@/lib/shop-details";

type SavedProduct = {
  id: string;
  reference: string;
  category: string;
  imagePath: string;
  name: string | null;
  price: number | null;
  stock: number | null;
  isActive: boolean;
};

const categories = [
  { name: "Cuban Bracelets", folder: "CUBAN-BRACELETS", count: 41 },
  { name: "Cuban Bracelets 9K", folder: "CUBAN-BRACELETS-9K", count: 32 },
  { name: "Dokiya 9K", folder: "dokiya-9k", count: 12 },
  { name: "Gents Bracelets 9K", folder: "GENTS-BRACELETS-9K", count: 34 },
  { name: "Gents Chains", folder: "GENTS-CHAINS", count: 16 },
  { name: "God Pendants", folder: "GOD-PENDANTS", count: 54 },
  { name: "Ladies Chains 9K", folder: "LADIES-CHAINS9K", count: 28 },
  { name: "Pendant Sets CZ", folder: "PENDANT-SETS-CZ", count: 11 },
];

type Category = (typeof categories)[number];

function getImages(folder: string, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(3, "0");
    const filename = `page_${number}_image_01.jpeg`;

    return {
      name: filename,
      url: `/catalogue/${folder}/${filename}`,
    };
  });
}

export default function CataloguePage() {
  const [selectedCategory, setSelectedCategory] = useState(
    "PENDANT-SETS-CZ"
  );
  const [search, setSearch] = useState("");
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load saved products");
        }
        return response.json();
      })
      .then((products: SavedProduct[]) => {
        setSavedProducts(products);
      })
      .catch((error) => {
        console.error("Loading saved products failed:", error);
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  }, []);

  const customCategories: Category[] = Array.from(
    new Set(
      savedProducts
        .map((product) => product.category)
        .filter((category) => !categories.some((item) => item.folder === category))
    )
  ).sort((a, b) => a.localeCompare(b)).map((category) => ({
    name: category.replaceAll("-", " "),
    folder: category,
    count: new Set(
      savedProducts
        .filter((product) => product.category === category)
        .map((product) => product.imagePath)
    ).size,
  }));
  const allCategories = [...categories, ...customCategories];
  const activeCategory = allCategories.find(
    (category) => category.folder === selectedCategory
  ) ?? categories[0];

  const images = categories.some((category) => category.folder === activeCategory.folder)
    ? getImages(activeCategory.folder, activeCategory.count)
    : Array.from(
        new Map(
          savedProducts
            .filter((product) => product.category === activeCategory.folder)
            .map((product) => [product.imagePath, product])
        ).values()
      ).map((product) => ({
        name: product.reference,
        url: product.imagePath,
      }));

  const filteredImages = images.filter((image) =>
    image.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="text-sm text-amber-800 hover:underline">
            ← Back to {SHOP_NAME}
          </Link>

          <h1 className="mt-4 text-3xl font-semibold">
            Jewellery Catalogue
          </h1>

          <p className="mt-2 text-stone-600">
            Browse original images from your eight jewellery collections.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <h2 className="mb-4 text-lg font-semibold">
          Jewellery Categories
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {allCategories.map((category) => (
            <button
              key={category.folder}
              type="button"
              onClick={() => {
                setSelectedCategory(category.folder);
                setSearch("");
              }}
              className={`rounded-xl border p-4 text-left transition ${
                selectedCategory === category.folder
                  ? "border-amber-800 bg-amber-50"
                  : "border-stone-200 bg-white hover:border-amber-600"
              }`}
            >
              <span className="block font-medium">
                {category.name}
              </span>
              <span className="mt-1 block text-sm text-stone-500">
                {category.count} {categories.some((item) => item.folder === category.folder) ? "images" : "products"}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold">
              {activeCategory.name}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {filteredImages.length} of {images.length} images shown
            </p>
          </div>

          <div className="w-full sm:max-w-sm">
            <label
              htmlFor="catalogue-search"
              className="mb-2 block text-sm font-medium"
            >
              Search image filenames
            </label>
            <input
              id="catalogue-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="For example, page_001..."
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-amber-700"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredImages.map((image, index) => {
            const product = savedProducts.find(
              (item) =>
              item.category === activeCategory.folder &&
                item.imagePath === image.url
            );

            return (
              <article
                key={image.name}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
              >
                <div className="flex aspect-[3/4] items-center justify-center bg-white p-3">
                  <img
                    src={image.url}
                    alt={`${activeCategory.name} catalogue image ${index + 1}`}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="p-4">
                  <h3 className="font-medium">
                    Image {images.indexOf(image) + 1}
                  </h3>

                  <p className="mt-1 break-all text-sm text-stone-500">
                    {image.name}
                  </p>

                  
                  {product ? (
                    <div className="mt-3 space-y-1 text-sm">
                      <p className="font-semibold text-amber-800">
                        Reference: {product.reference}
                      </p>

                      {product.name && (
                        <p className="text-stone-700">{product.name}</p>
                      )}

                      {product.price !== null && (
                        <p>Price: ₹{product.price.toLocaleString("en-IN")}</p>
                      )}

                      {product.isActive ? (
                        <a
                          href={`/product/${encodeURIComponent(product.reference)}`}
                          className="mt-3 inline-flex rounded-lg bg-amber-800 px-4 py-2 font-medium text-white hover:bg-amber-900"
                        >
                          View product →
                        </a>
                      ) : (
                        <p className="mt-2 text-xs text-stone-500">
                          Not published to customers
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-stone-500">
                      {loadingProducts
                        ? "Loading product details..."
                        : "Product details not yet entered"}
                    </p>
                  )}

                  
                  
                </div>
              </article>
            );
          })}
        </div>

        {filteredImages.length === 0 && (
          <p className="mt-10 text-center text-stone-500">
            No images match your search.
          </p>
        )}

        <p className="mt-10 text-sm leading-6 text-stone-500">
          Images are from your original catalogue files. Product details
          appear only when they have been saved. Please verify prices,
          stock, and specifications before publishing products to customers.
        </p>
      </section>
    </main>
  );
}
