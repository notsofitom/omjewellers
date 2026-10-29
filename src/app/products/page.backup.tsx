
"use client";

import { useState } from "react";
import Link from "next/link";

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
  const [imageNumber, setImageNumber] = useState("1");
  const [reference, setReference] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");

  const activeCategory = categories.find((item) => item.folder === category)!;
  const filename = `page_${imageNumber.padStart(3, "0")}_image_01.jpeg`;
  const imagePath = `/catalogue/${category}/${filename}`;

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-6 py-5">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="text-sm text-amber-800 hover:underline">
            ← Back to OM Jewellers
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">Product Management</h1>
          <p className="mt-2 text-stone-600">
            Select an original catalogue image and enter your verified product details.
          </p>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold">1. Select a catalogue image</h2>

          <label className="mt-5 block text-sm font-medium">Category</label>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setImageNumber("1");
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
            These fields are a form preview for now. Nothing is saved to the database yet.
          </p>

          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              alert("Form preview only. Database saving will be connected in the next step.");
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

            <div>
              <label className="block text-sm font-medium">Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="Leave blank until confirmed"
                className="mt-2 w-full rounded-xl border border-stone-300 p-3"
              />
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
              className="w-full rounded-xl bg-amber-800 px-5 py-3 font-medium text-white hover:bg-amber-900"
            >
              Preview product entry
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
