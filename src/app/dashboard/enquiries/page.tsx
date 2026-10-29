"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LogoutButton from "@/app/components/LogoutButton";

type Enquiry = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  message: string;
  productReference: string | null;
  productImagePath: string | null;
  createdAt: string;
  isRead: boolean;
};

export default function EnquiriesPage() {
  const [items, setItems] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/enquiries", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load enquiries.");
        setItems(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load enquiries."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/dashboard/products" className="text-sm text-amber-800 hover:underline">← Owner dashboard</Link>
            <h1 className="mt-2 text-3xl font-semibold">Customer enquiries</h1>
            <p className="mt-1 text-stone-600">Questions submitted from product pages are stored here.</p>
          </div>
          <LogoutButton />
        </div>
      </header>
      <section className="mx-auto max-w-5xl space-y-4 px-5 py-8 sm:px-8">
        {loading && <p>Loading enquiries…</p>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
        {!loading && !error && items.length === 0 && <p className="rounded-xl border border-stone-200 bg-white p-6">No enquiries yet.</p>}
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{item.customerName}</h2>
                <p className="mt-1 text-sm">{item.customerEmail}{item.customerPhone && <> · WhatsApp {item.customerPhone}</>}</p>
              </div>
              <time className="text-sm text-stone-500">{new Date(item.createdAt).toLocaleString("en-IN")}</time>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`mailto:${encodeURIComponent(item.customerEmail)}?subject=${encodeURIComponent(`Re: Jewellery enquiry${item.productReference ? ` - ${item.productReference}` : ""}`)}&body=${encodeURIComponent(`Hello ${item.customerName},\n\nThank you for your enquiry${item.productReference ? ` about product ${item.productReference}` : ""}.\n\n`)}`}
                className="rounded-lg border border-amber-800 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50"
              >
                Reply by email
              </a>
              {item.customerPhone && (
                <a
                  href={`https://wa.me/${item.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${item.customerName}, this is regarding your jewellery enquiry${item.productReference ? ` about product ${item.productReference}` : ""}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-green-700 px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-50"
                >
                  Reply on WhatsApp
                </a>
              )}
            </div>
            {item.productImagePath && (
              <Link
                href={`/product/${encodeURIComponent(item.productReference || "")}`}
                className="mt-4 flex w-fit items-center gap-3 rounded-xl border border-stone-200 p-2 hover:bg-stone-50"
              >
                <img
                  src={item.productImagePath}
                  alt={`Jewellery reference ${item.productReference || ""}`}
                  className="h-24 w-24 rounded-lg bg-white object-contain"
                />
                <span className="text-sm font-medium text-amber-900">
                  Product {item.productReference}
                </span>
              </Link>
            )}
            <p className="mt-4 whitespace-pre-wrap leading-7">{item.message}</p>
            <p className="mt-4 text-sm text-stone-500">Product: {item.productReference || "General enquiry"}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
