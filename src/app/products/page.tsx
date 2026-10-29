
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SHOP_NAME } from "@/lib/shop-details";

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

export default function ProductsPage() {
  const [category, setCategory] = useState(categories[0].folder);
  const categoryRef = useRef(category);
  const [imageNumber, setImageNumber] = useState("1");
  const [reference, setReference] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [carat, setCarat] = useState("22");
  const [labourCharge, setLabourCharge] = useState("");
  const [categoryLabourCharges, setCategoryLabourCharges] = useState<Record<string, number>>({});
  const [configuredRates, setConfiguredRates] = useState<Record<number, number>>({});
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const activeCategory = categories.find((item) => item.folder === category)!;
  const filename = `page_${imageNumber.padStart(3, "0")}_image_01.jpeg`;
  const imagePath = `/catalogue/${category}/${filename}`;
  const selectedRate = configuredRates[Number(carat)];
  const calculatedPrice = weight && selectedRate !== undefined && labourCharge !== ""
    ? Number((Number(weight) * selectedRate + Number(labourCharge)).toFixed(2))
    : null;

  useEffect(() => {
    let active = true;
    async function loadPricing() {
      const [chargesResponse, ratesResponse] = await Promise.all([
        fetch("/api/category-labour", { cache: "no-store" }),
        fetch("/api/rates", { cache: "no-store" }),
      ]);
      if (chargesResponse.ok) {
        const charges: Record<string, number> = await chargesResponse.json();
        if (active) {
          setCategoryLabourCharges(charges);
          const savedCharge = charges[categoryRef.current];
          setLabourCharge(savedCharge === undefined ? "" : String(savedCharge));
        }
      }
      if (ratesResponse.ok) {
        const result = await ratesResponse.json();
        if (active) setConfiguredRates(Object.fromEntries(result.rates.map((rate: { purity: string; ratePerGram: number }) => [Number.parseInt(rate.purity, 10), rate.ratePerGram])));
      }
    }
    void loadPricing().catch(() => undefined);
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-6 py-5">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="text-sm text-amber-800 hover:underline">
            ← Back to {SHOP_NAME}
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">Product Management</h1>
          <p className="mt-2 text-stone-600">
            Select an original catalogue image and enter your verified product details.
          </p>
          <Link href="/products/import" className="mt-4 inline-flex rounded-lg border border-amber-800 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50">
            Import products from a PDF
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold">1. Select a catalogue image</h2>

          <label className="mt-5 block text-sm font-medium">Category</label>
          <select
            value={category}
            onChange={(event) => {
              const nextCategory = event.target.value;
              categoryRef.current = nextCategory;
              setCategory(nextCategory);
              setImageNumber("1");
              setCarat(nextCategory.toLowerCase().includes("9k") ? "9" : "22");
              setLabourCharge(categoryLabourCharges[nextCategory] === undefined ? "" : String(categoryLabourCharges[nextCategory]));
            }}
            className="mt-2 w-full rounded-xl border border-stone-300 bg-white p-3"
          >
            {categories.map((item) => (
              <option key={item.folder} value={item.folder}>
                {item.name} ({item.count} images)
              </option>
            ))}
          </select>

          <label className="mt-5 block text-sm font-medium">Image number</label>
          <select
            value={imageNumber}
            onChange={(event) => setImageNumber(event.target.value)}
            className="mt-2 w-full rounded-xl border border-stone-300 bg-white p-3"
          >
            {Array.from({ length: activeCategory.count }, (_, index) => (
              <option key={index + 1} value={String(index + 1)}>
                Image {index + 1}
              </option>
            ))}
          </select>

          <div className="mt-5 flex aspect-[3/4] items-center justify-center rounded-xl bg-stone-50 p-4">
            <img
              src={imagePath}
              alt={`${activeCategory.name}, image ${imageNumber}`}
              className="h-full w-full object-contain"
            />
          </div>
          <p className="mt-3 break-all text-xs text-stone-500">{imagePath}</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold">2. Product details</h2>
          <p className="mt-2 text-sm text-stone-500">
            Add the product details below. The category labour charge is saved as the default for that category.
          </p>

          
          <form
            className="mt-5 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              setMessage("");

              try {
                const response = await fetch("/api/products", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    reference,
                    name,
                    category,
                    imagePath,
                    price,
                    weight,
                    carat,
                    labourCharge,
                    stock,
                    description,
                  }),
                });

                const result = await response.json();

                if (!response.ok) {
                  setMessage(result.error || "Could not save product.");
                  return;
                }

                if (labourCharge !== "") {
                  setCategoryLabourCharges((current) => ({ ...current, [category]: Number(labourCharge) }));
                }
                setMessage(`Product saved successfully. Reference: ${result.reference}. Price: ${result.price === null ? "not entered" : `₹${Number(result.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}`);
                setReference("");
                setName("");
                setPrice("");
                setWeight("");
                setStock("");
                setDescription("");
              } catch {
                setMessage("Could not connect to the server. Check that your app is running.");
              } finally {
                setSaving(false);
              }
            }}
          >

          
            <div>
              <label className="block text-sm font-medium">Your internal reference *</label>
              <input
                required
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Enter your own unique reference"
                className="mt-2 w-full rounded-xl border border-stone-300 p-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Product name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter verified product name"
                className="mt-2 w-full rounded-xl border border-stone-300 p-3"
              />
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-medium">Automatic gold price</h3>
              <p className="mt-1 text-xs text-stone-600">Price = weight × your {carat}K rate per gram + category labour charge. The calculated amount is saved with the product.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="product-weight" className="block text-sm font-medium">Weight (grams) *</label>
                  <input id="product-weight" type="number" min="0.01" step="0.01" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="e.g. 8.5" className="mt-2 w-full rounded-xl border border-stone-300 bg-white p-3" />
                </div>
                <div>
                  <label htmlFor="product-carat" className="block text-sm font-medium">Gold purity *</label>
                  <select id="product-carat" value={carat} onChange={(event) => setCarat(event.target.value)} className="mt-2 w-full rounded-xl border border-stone-300 bg-white p-3">
                    {[9, 18, 20, 22, 24].map((value) => <option key={value} value={value}>{value}K</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="category-labour" className="block text-sm font-medium">Labour charge for {activeCategory.name} (₹ per product)</label>
                  <input id="category-labour" type="number" min="0" step="0.01" value={labourCharge} onChange={(event) => setLabourCharge(event.target.value)} placeholder="Enter the category’s shared charge" className="mt-2 w-full rounded-xl border border-stone-300 bg-white p-3" />
                  <p className="mt-1 text-xs text-stone-500">This shared amount becomes the default for this category and adjusts its previously calculated products.</p>
                </div>
                <div className="flex flex-col justify-center rounded-lg bg-white p-3">
                  <span className="text-sm text-stone-500">Calculated total</span>
                  <span className="mt-1 text-xl font-semibold">{calculatedPrice === null ? "Enter weight and labour" : `₹${calculatedPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}</span>
                  <span className="mt-1 text-xs text-stone-500">{selectedRate === undefined ? "Set this rate in Owner Dashboard → Metal rates" : `₹${selectedRate.toLocaleString("en-IN")} / g · owner-set rate`}</span>
                </div>
              </div>
              {!weight && <div className="mt-4 border-t border-amber-200 pt-3">
                <label htmlFor="manual-price" className="block text-sm font-medium">Or enter a manual price</label>
                <input id="manual-price" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Only needed when weight is unknown" className="mt-2 w-full rounded-xl border border-stone-300 bg-white p-3" />
              </div>}
            </div>

            <div>
              <label className="block text-sm font-medium">Stock quantity</label>
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                placeholder="Leave blank until counted"
                className="mt-2 w-full rounded-xl border border-stone-300 p-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Description or notes</label>
              <textarea
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Enter verified material, weight, size or other details"
                className="mt-2 w-full rounded-xl border border-stone-300 p-3"
              />
            </div>

            
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-amber-800 px-5 py-3 font-medium text-white hover:bg-amber-900 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Product"}
            </button>

            {message && (
              <p role="status" className="mt-3 text-sm text-stone-700">
                {message}
              </p>
            )}

          </form>
        </div>
      </section>
    </main>
  );
}
