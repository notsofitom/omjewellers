
"use client";
import LogoutButton from "@/app/components/LogoutButton";
import Link from "next/link";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  reference: string;
  name: string | null;
  category: string;
  imagePath: string;
  price: number | null;
  weight: number | null;
  carat: number | null;
  stock: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProductImage = {
  id: string;
  imagePath: string;
  isPrimary: boolean;
  sortOrder: number;
};

const categoryNames: Record<string, string> = {
  "CUBAN-BRACELETS": "Cuban Bracelets",
  "CUBAN-BRACELETS-9K": "Cuban Bracelets 9K",
  "dokiya-9k": "Dokiya 9K",
  "GENTS-BRACELETS-9K": "Gents Bracelets 9K",
  "GENTS-CHAINS": "Gents Chains",
  "GOD-PENDANTS": "God Pendants",
  "LADIES-CHAINS9K": "Ladies Chains 9K",
  "PENDANT-SETS-CZ": "Pendant Sets CZ",
};

export default function ProductsDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<Product | null>(null);
  const [editReference, setEditReference] = useState("");
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editCarat, setEditCarat] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockValue, setStockValue] = useState("");
  
  const [photoProduct, setPhotoProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosSaving, setPhotosSaving] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");


  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Could not load products.");
      }

      const data: Product[] = await response.json();
      setProducts(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const task = window.setTimeout(() => {
      void loadProducts();
    }, 0);
    return () => window.clearTimeout(task);
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.reference.toLowerCase().includes(term) ||
        (product.name ?? "").toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term);

      const matchesCategory =
        category === "ALL" || product.category === category;

      const matchesStatus =
        status === "ALL" ||
        (status === "ACTIVE" && product.isActive) ||
        (status === "INACTIVE" && !product.isActive);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, category, status]);

  const activeCount = products.filter((p) => p.isActive).length;
  const inactiveCount = products.length - activeCount;

  function openEdit(product: Product) {
    setEditing(product);
    setEditReference(product.reference);
    setEditName(product.name ?? "");
    setEditPrice(product.price === null ? "" : String(product.price));
    setEditWeight(product.weight === null ? "" : String(product.weight));
    setEditCarat(product.carat === null ? "" : String(product.carat));
    setEditDescription(product.description ?? "");
    setMessage("");
    setError("");
  }

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;

    const parsedPrice =
      editPrice.trim() === "" ? null : Number(editPrice);

    if (
      parsedPrice !== null &&
      (!Number.isFinite(parsedPrice) || parsedPrice < 0)
    ) {
      setError("Enter a valid price of zero or more.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          reference: editReference.trim(),
          name: editName.trim() || null,
          price: parsedPrice,
          weight: editWeight.trim() === "" ? null : Number(editWeight),
          carat: editWeight.trim() === "" ? null : Number(editCarat),
          description: editDescription.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save changes.");
      }

      setProducts((current) =>
        current.map((p) => (p.id === data.id ? data : p))
      );
      setEditing(null);
      setMessage(`Product ${data.reference} updated successfully.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save changes."
      );
    } finally {
      setSaving(false);
    }
  }

  function openStock(product: Product) {
    setStockProduct(product);
    setStockValue(product.stock === null ? "" : String(product.stock));
    setError("");
    setMessage("");
  }

  async function saveStock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stockProduct) return;

    if (!/^\d+$/.test(stockValue.trim())) {
      setError("Enter a whole-number stock quantity, such as 0, 5, or 12.");
      return;
    }

    const quantity = Number(stockValue);

    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      setError("Stock must be a valid whole number of zero or more.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: stockProduct.id,
          stock: quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update stock.");
      }

      setProducts((current) =>
        current.map((p) => (p.id === data.id ? data : p))
      );
      setStockProduct(null);
      setMessage(`Stock updated for ${data.reference}.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update stock."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product: Product) {
    const nextStatus = !product.isActive;
    const confirmed = window.confirm(
      `${nextStatus ? "Activate" : "Deactivate"} product ${product.reference}?`
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          isActive: nextStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not change product status.");
      }

      setProducts((current) =>
        current.map((p) => (p.id === data.id ? data : p))
      );
      setMessage(
        `${data.reference} is now ${data.isActive ? "active" : "inactive"}.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not change product status."
      );
    } finally {
      setSaving(false);
    }
  }
  
async function openPhotos(product: Product) {
  setPhotoProduct(product);
  setProductImages([]);
  setPhotoError("");
  setPhotoMessage("");
  setPhotosLoading(true);

  try {
    const response = await fetch(
      `/api/product-images?productId=${encodeURIComponent(product.id)}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not load product photos.");
    }

    setProductImages(data);
  } catch (err) {
    setPhotoError(
      err instanceof Error ? err.message : "Could not load product photos."
    );
  } finally {
    setPhotosLoading(false);
  }
}

async function uploadPhotos(files: FileList | null) {
  if (!photoProduct || !files?.length) return;

  const selectedFiles = Array.from(files);

  if (selectedFiles.some((file) => file.size > 5 * 1024 * 1024)) {
    setPhotoError("Each photo must be no larger than 5 MB.");
    return;
  }

  if (
    selectedFiles.some(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
  ) {
    setPhotoError("Use JPG, PNG, or WebP photos.");
    return;
  }

  setPhotosSaving(true);
  setPhotoError("");
  setPhotoMessage("");

  let successfulUploads = 0;

  try {
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", photoProduct.id);

      const response = await fetch("/api/product-images/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Could not upload ${file.name}.`);
      }

      successfulUploads++;
    }

    await openPhotos(photoProduct);
    await loadProducts();

    setPhotoMessage(
      `${successfulUploads} photo${successfulUploads === 1 ? "" : "s"} uploaded successfully.`
    );
  } catch (err) {
    if (successfulUploads > 0) {
      await openPhotos(photoProduct);
      await loadProducts();
    }

    setPhotoError(
      err instanceof Error ? err.message : "Photo upload failed."
    );
  } finally {
    setPhotosSaving(false);
  }
}

async function setPrimaryPhoto(imageId: string) {
  if (!photoProduct) return;

  setPhotosSaving(true);
  setPhotoError("");
  setPhotoMessage("");

  try {
    const response = await fetch("/api/product-images", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: photoProduct.id,
        imageId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not set the main photo.");
    }

    await openPhotos(photoProduct);
    await loadProducts();
    setPhotoMessage("Main photo updated successfully.");
  } catch (err) {
    setPhotoError(
      err instanceof Error ? err.message : "Could not set the main photo."
    );
  } finally {
    setPhotosSaving(false);
  }
}

async function deletePhoto(image: ProductImage) {
  if (!photoProduct) return;

  if (!window.confirm("Delete this photo permanently?")) return;

  setPhotosSaving(true);
  setPhotoError("");
  setPhotoMessage("");

  try {
    const response = await fetch("/api/product-images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: photoProduct.id,
        imageId: image.id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not delete the photo.");
    }

    await openPhotos(photoProduct);
    await loadProducts();
    setPhotoMessage("Photo deleted.");
  } catch (err) {
    setPhotoError(
      err instanceof Error ? err.message : "Could not delete the photo."
    );
  } finally {
    setPhotosSaving(false);
  }
}


  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="text-sm text-amber-800 hover:underline">
            ← Back to home
          </Link>

          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-semibold">Owner Dashboard</h1>
              <p className="mt-2 text-stone-600">
                Manage your saved jewellery products and stock.
              </p>
            </div>

            
            <div className="flex flex-wrap items-center gap-3">
            <a
                href="/dashboard/billing"
                className="inline-flex w-fit items-center rounded-xl bg-amber-800 px-5 py-3 font-medium text-white hover:bg-amber-900"
            >
                Billing pad
            </a>
            <a
                href="/dashboard/rates"
                className="inline-flex w-fit items-center rounded-xl border border-amber-800 px-5 py-3 font-medium text-amber-900 hover:bg-amber-50"
            >
                Metal rates
            </a>
            <a
                href="/dashboard/homepage"
                className="inline-flex w-fit items-center rounded-xl border border-amber-800 px-5 py-3 font-medium text-amber-900 hover:bg-amber-50"
            >
                Homepage photos
            </a>
            <a
                href="/dashboard/enquiries"
                className="inline-flex w-fit items-center rounded-xl border border-amber-800 px-5 py-3 font-medium text-amber-900 hover:bg-amber-50"
            >
                Customer enquiries
            </a>
            <a
                href="/products"
                className="inline-flex w-fit items-center rounded-xl bg-amber-800 px-5 py-3 font-medium text-white hover:bg-amber-900"
            >
                + Add Product
            </a>

            <LogoutButton />
            </div>

          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {message && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-sm text-stone-500">Saved products</p>
            <p className="mt-2 text-3xl font-semibold">{products.length}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-sm text-stone-500">Active products</p>
            <p className="mt-2 text-3xl font-semibold">{activeCount}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-sm text-stone-500">Inactive products</p>
            <p className="mt-2 text-3xl font-semibold">{inactiveCount}</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Find a product</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="product-search" className="mb-2 block text-sm font-medium">
                Search reference or name
              </label>
              <input
                id="product-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Enter a reference or name"
                className="w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </div>

            <div>
              <label htmlFor="category-filter" className="mb-2 block text-sm font-medium">
                Category
              </label>
              <select
                id="category-filter"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3"
              >
                <option value="ALL">All categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {categoryNames[item] ?? item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status-filter" className="mb-2 block text-sm font-medium">
                Product status
              </label>
              <select
                id="status-filter"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3"
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <p className="mt-4 text-sm text-stone-500">
            Showing {filteredProducts.length} of {products.length} saved products.
          </p>
        </div>

        {loading && <p className="mt-8 text-stone-600">Loading products…</p>}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
            <h2 className="font-semibold">No matching products</h2>
            <p className="mt-2 text-sm text-stone-500">
              Try a different search or filter.
            </p>
          </div>
        )}

        {!loading && filteredProducts.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
              >
                <div className="flex aspect-[4/3] items-center justify-center bg-white p-4">
                  <img
                    src={product.imagePath}
                    alt={product.name || `Product ${product.reference}`}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-stone-500">Reference</p>
                      <h2 className="break-all font-semibold">{product.reference}</h2>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                        product.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div>
                    <p className="font-medium">{product.name || "Name not entered"}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {categoryNames[product.category] ?? product.category}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-stone-100 pt-3">
                    <div>
                      <p className="text-xs text-stone-500">Price</p>
                      <p className="mt-1 font-medium">
                        {product.price === null
                          ? "Not entered"
                          : product.price.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Stock</p>
                      <p className="mt-1 font-medium">
                        {product.stock === null ? "Not entered" : product.stock}
                      </p>
                    </div>
                  </div>
                  {product.weight !== null && product.carat !== null && (
                    <p className="text-xs text-stone-500">{product.weight} g · {product.carat}K</p>
                  )}

                  {product.description && (
                    <p className="border-t border-stone-100 pt-3 text-sm text-stone-600">
                      {product.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 border-t border-stone-100 pt-3">
                    <button
                      type="button"
                      onClick={() => openEdit(product)}
                      disabled={saving}
                      className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
                    >
                      Edit details
                    </button>
                    <button
                      type="button"
                      onClick={() => openStock(product)}
                      disabled={saving}
                      className="rounded-lg bg-amber-800 px-3 py-2 text-sm font-medium text-white hover:bg-amber-900 disabled:opacity-50"
                    >
                      Update stock
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleActive(product)}
                    disabled={saving}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50 disabled:opacity-50"
                  >
                    {product.isActive ? "Deactivate product" : "Activate product"}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => openPhotos(product)}
                    disabled={saving || photosSaving}
                    className="w-full rounded-lg border border-amber-800 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50 disabled:opacity-50"
                  >
                    Manage Photos
                  </button>

                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <form
            onSubmit={saveEdit}
            className="my-8 w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <div>
              <h2 className="text-xl font-semibold">Edit product</h2>
              <p className="mt-1 text-sm text-stone-500">
                Image and category are kept unchanged.
              </p>
            </div>

            <div>
              <label htmlFor="edit-reference" className="mb-1 block text-sm font-medium">
                Reference *
              </label>
              <input
                id="edit-reference"
                required
                value={editReference}
                onChange={(event) => setEditReference(event.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="edit-name" className="mb-1 block text-sm font-medium">
                Product name
              </label>
              <input
                id="edit-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="edit-weight" className="mb-1 block text-sm font-medium">
                Weight (grams)
              </label>
              <input
                id="edit-weight"
                type="number"
                min="0.01"
                step="0.01"
                value={editWeight}
                onChange={(event) => setEditWeight(event.target.value)}
                placeholder="Leave blank for a manually priced product"
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="edit-carat" className="mb-1 block text-sm font-medium">
                Gold purity
              </label>
              <select
                id="edit-carat"
                value={editCarat}
                onChange={(event) => setEditCarat(event.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              >
                <option value="">Not set</option>
                {[9, 18, 20, 22, 24].map((value) => <option key={value} value={value}>{value}K</option>)}
              </select>
              <p className="mt-1 text-xs text-stone-500">Changing weight or purity recalculates the price with your saved gold rate and this category’s labour charge.</p>
            </div>

            <div>
              <label htmlFor="edit-price" className="mb-1 block text-sm font-medium">
                Manual price (used when weight is blank)
              </label>
              <input
                id="edit-price"
                type="number"
                min="0"
                step="any"
                value={editPrice}
                onChange={(event) => setEditPrice(event.target.value)}
                placeholder="Leave blank if unknown"
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="edit-description" className="mb-1 block text-sm font-medium">
                Description
              </label>
              <textarea
                id="edit-description"
                rows={3}
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="rounded-lg border border-stone-300 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-amber-800 px-4 py-2 font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {stockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={saveStock}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <div>
              <h2 className="text-xl font-semibold">Update stock</h2>
              <p className="mt-1 text-sm text-stone-500">
                Product reference: {stockProduct.reference}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Enter the new total quantity, not the quantity to add.
              </p>
            </div>

            <div>
              <label htmlFor="stock-quantity" className="mb-1 block text-sm font-medium">
                Current total quantity *
              </label>
              <input
                id="stock-quantity"
                type="number"
                min="0"
                step="1"
                required
                autoFocus
                value={stockValue}
                onChange={(event) => setStockValue(event.target.value)}
                placeholder="Enter quantity"
                className="w-full rounded-lg border border-stone-300 px-3 py-3"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStockProduct(null)}
                disabled={saving}
                className="rounded-lg border border-stone-300 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-amber-800 px-4 py-2 font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save stock"}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {photoProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <section className="my-8 w-full max-w-4xl space-y-5 rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Manage Photos</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Product reference: {photoProduct.reference}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPhotoProduct(null)}
                disabled={photosSaving}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            {photoError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                {photoError}
              </div>
            )}

            {photoMessage && (
              <div
                role="status"
                className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800"
              >
                {photoMessage}
              </div>
            )}

            <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5">
              <label
                htmlFor="product-photo-upload"
                className="mb-2 block font-medium"
              >
                Upload photos
              </label>
              <p className="mb-3 text-sm text-stone-600">
                Select multiple JPG, PNG, or WebP files. Each file must be
                no larger than 5 MB.
              </p>

              <input
                id="product-photo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={photosSaving}
                onChange={(event) => {
                  void uploadPhotos(event.target.files);
                  event.target.value = "";
                }}
                className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-amber-800 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-amber-900 disabled:opacity-50"
              />

              {photosSaving && (
                <p className="mt-3 text-sm text-stone-600">
                  Please wait while photos are being processed…
                </p>
              )}
            </div>

            <div>
              <h3 className="mb-3 font-semibold">
                Gallery ({productImages.length})
              </h3>

              {photosLoading ? (
                <p className="text-sm text-stone-500">Loading photos…</p>
              ) : productImages.length === 0 ? (
                <p className="rounded-xl bg-stone-50 p-6 text-center text-sm text-stone-500">
                  No gallery photos yet. Upload photos above to get started.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {productImages.map((image) => (
                    <article
                      key={image.id}
                      className="overflow-hidden rounded-xl border border-stone-200"
                    >
                      <div className="flex aspect-square items-center justify-center bg-stone-50 p-3">
                        <img
                          src={image.imagePath}
                          alt={`Product ${photoProduct.reference}`}
                          className="h-full w-full object-contain"
                        />
                      </div>

                      <div className="space-y-2 p-3">
                        {image.isPrimary && (
                          <span className="inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
                            Main photo
                          </span>
                        )}

                        {!image.isPrimary && (
                          <button
                            type="button"
                            onClick={() => void setPrimaryPhoto(image.id)}
                            disabled={photosSaving}
                            className="w-full rounded-lg border border-amber-800 px-2 py-2 text-xs font-medium text-amber-900 hover:bg-amber-50 disabled:opacity-50"
                          >
                            Set as main
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => void deletePhoto(image)}
                          disabled={photosSaving}
                          className="w-full rounded-lg border border-red-200 px-2 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete photo
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={() => setPhotoProduct(null)}
                disabled={photosSaving}
                className="rounded-lg bg-stone-900 px-5 py-2 font-medium text-white hover:bg-stone-700 disabled:opacity-50"
              >
                Done
              </button>
            </div>
          </section>
        </div>
      )}

    </main>
  );
}
