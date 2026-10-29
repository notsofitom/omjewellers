"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type HomepageProduct = {
  id: string;
  reference: string;
  name: string | null;
  category: string;
  imagePath: string;
  homeFeaturedOrder: number | null;
};

function categoryLabel(category: string) {
  return category
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function HomepagePhotosPage() {
  const [products, setProducts] = useState<HomepageProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/homepage-featured", {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Could not load homepage photos.");
        }

        if (active) {
          const loadedProducts = data as HomepageProduct[];
          setProducts(loadedProducts);
          const savedSelection = loadedProducts
            .filter((product) => product.homeFeaturedOrder !== null)
            .sort(
              (a, b) =>
                (a.homeFeaturedOrder ?? 0) - (b.homeFeaturedOrder ?? 0)
            );
          setSelectedIds(
            (savedSelection.length ? savedSelection : loadedProducts.slice(0, 5))
              .map((product) => product.id)
          );
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load homepage photos."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const selectedProducts = useMemo(
    () =>
      selectedIds
        .map((id) => products.find((product) => product.id === id))
        .filter((product): product is HomepageProduct => Boolean(product)),
    [products, selectedIds]
  );

  const availableProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter(
      (product) =>
        !selectedIds.includes(product.id) &&
        (!term ||
          product.reference.toLowerCase().includes(term) ||
          (product.name ?? "").toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term))
    );
  }, [products, search, selectedIds]);

  function addProduct(id: string) {
    if (selectedIds.length >= 5) return;
    setSelectedIds((current) => [...current, id]);
    setMessage("");
  }

  function removeProduct(id: string) {
    setSelectedIds((current) => current.filter((item) => item !== id));
    setMessage("");
  }

  function moveProduct(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= selectedIds.length) return;
    setSelectedIds((current) => {
      const reordered = [...current];
      [reordered[index], reordered[destination]] = [
        reordered[destination],
        reordered[index],
      ];
      return reordered;
    });
    setMessage("");
  }

  async function saveSelection() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/homepage-featured", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedIds }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not save homepage photos.");
      }
      setProducts((current) =>
        current.map((product) => {
          const order = selectedIds.indexOf(product.id);
          return {
            ...product,
            homeFeaturedOrder: order >= 0 ? order : null,
          };
        })
      );
      setMessage("Homepage photos saved. The carousel is now updated.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save homepage photos."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/dashboard/products"
            className="text-sm text-amber-800 hover:underline"
          >
            ← Back to products
          </Link>
          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-semibold">Homepage photos</h1>
              <p className="mt-2 max-w-2xl text-stone-600">
                Choose and arrange up to five active products for the rotating
                photo panel on your homepage.
              </p>
            </div>
            <button
              type="button"
              onClick={saveSelection}
              disabled={loading || saving}
              className="inline-flex w-fit items-center rounded-xl bg-amber-800 px-5 py-3 font-medium text-white hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save homepage photos"}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8">
        {message && (
          <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </p>
        )}

        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Selected carousel photos</h2>
              <p className="mt-1 text-sm text-stone-600">
                {selectedIds.length} of 5 selected. The first photo appears first.
              </p>
            </div>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedIds([]);
                  setMessage("");
                }}
                className="text-sm font-medium text-amber-900 underline underline-offset-4"
              >
                Clear selection
              </button>
            )}
          </div>

          {loading ? (
            <p className="mt-5 text-sm text-stone-600">Loading products…</p>
          ) : selectedProducts.length ? (
            <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedProducts.map((product, index) => (
                <li
                  key={product.id}
                  className="flex items-center gap-3 rounded-xl border border-stone-200 p-3"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-sm font-semibold text-amber-950">
                    {index + 1}
                  </span>
                  <img
                    src={product.imagePath}
                    alt={product.name || `Design ${product.reference}`}
                    className="h-16 w-16 shrink-0 rounded-lg bg-stone-100 object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {product.name || `Design ${product.reference}`}
                    </p>
                    <p className="truncate text-xs text-stone-500">
                      {categoryLabel(product.category)} · {product.reference}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveProduct(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move photo ${index + 1} earlier`}
                      className="rounded border border-stone-300 px-2 py-1 text-xs disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProduct(index, 1)}
                      disabled={index === selectedProducts.length - 1}
                      aria-label={`Move photo ${index + 1} later`}
                      className="rounded border border-stone-300 px-2 py-1 text-xs disabled:opacity-40"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    aria-label={`Remove ${product.name || product.reference}`}
                    className="ml-1 text-xs font-medium text-red-700 underline underline-offset-2"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-stone-600">
              No products selected. Save this to use the five newest active products instead.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-semibold">Choose a product photo</h2>
              <p className="mt-1 text-sm text-stone-600">
                Add active products to the carousel. To upload a new image, first update that product in the Products dashboard.
              </p>
            </div>
            <label className="text-sm font-medium">
              <span className="sr-only">Search products</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products"
                className="w-full rounded-xl border border-stone-300 px-4 py-2.5 sm:w-64"
              />
            </label>
          </div>

          {loading ? (
            <p className="mt-5 text-sm text-stone-600">Loading products…</p>
          ) : availableProducts.length ? (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableProducts.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center gap-3 rounded-xl border border-stone-200 p-3"
                >
                  <img
                    src={product.imagePath}
                    alt={product.name || `Design ${product.reference}`}
                    className="h-16 w-16 shrink-0 rounded-lg bg-stone-100 object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {product.name || `Design ${product.reference}`}
                    </p>
                    <p className="truncate text-xs text-stone-500">
                      {categoryLabel(product.category)} · {product.reference}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addProduct(product.id)}
                    disabled={selectedIds.length >= 5}
                    className="shrink-0 rounded-lg border border-amber-800 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-stone-600">
              {search.trim()
                ? "No active products match your search."
                : "All active products are already selected."}
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
