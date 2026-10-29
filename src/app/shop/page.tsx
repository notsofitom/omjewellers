
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import EnquiryForm from "@/app/components/EnquiryForm";
import StorefrontHeader from "@/app/components/StorefrontHeader";
import { SHOP_CITY, SHOP_EMAIL, SHOP_NAME, SHOP_WHATSAPP_NUMBER } from "@/lib/shop-details";
import { getCategoryLabel } from "@/lib/storefront-categories";

type Product = {
  id: string;
  reference: string;
  name: string | null;
  category: string;
  imagePath: string;
  price: number | null;
  description: string | null;
  isActive: boolean;
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(() =>
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("search") ?? ""
  );
  const [category, setCategory] = useState(() =>
    typeof window === "undefined"
      ? "ALL"
      : new URLSearchParams(window.location.search).get("category") ?? "ALL"
  );

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load products.");
        const data: Product[] = await response.json();
        setProducts(data.filter((product) => product.isActive === true));
      } catch {
        setError("Products could not be loaded. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    void loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "ALL" || product.category === category;
      const matchesSearch = !term ||
        product.reference.toLowerCase().includes(term) ||
        (product.name ?? "").toLowerCase().includes(term) ||
        getCategoryLabel(product.category).toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  return (
    <main className="min-h-screen bg-[#fbf8f2] text-[#241d1a]">
      <StorefrontHeader />
      <div className="mx-auto max-w-[1440px] px-3 pb-12 pt-4 sm:px-7 sm:pb-16 sm:pt-8 lg:px-10">
        <section className="relative overflow-hidden rounded-[20px] bg-[#2b1722] px-4 py-6 text-[#fff9ef] sm:rounded-[26px] sm:px-10 sm:py-12 lg:px-14">
          <div className="pointer-events-none absolute inset-2 rounded-[20px] border border-[#c6a26a]/30 sm:inset-3" />
          <div className="relative flex flex-col justify-between gap-4 sm:gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#dfc18d] sm:text-xs sm:tracking-[0.24em]">The {SHOP_NAME} collection</p>
              <h1 className="mt-2 font-serif text-[26px] leading-[1.15] sm:mt-3 sm:text-4xl lg:text-5xl">Find a piece that feels like you.</h1>
              <p className="mt-2 max-w-xl text-[13px] leading-5 text-[#e9ded5] sm:mt-3 sm:text-base sm:leading-7">Browse our published designs, then contact us to confirm availability, specifications, and current pricing.</p>
            </div>
            <p className="shrink-0 text-xs text-[#e6d4c3] sm:text-sm">{loading ? "Loading designs…" : `${products.length} ${products.length === 1 ? "design" : "designs"} to explore`}</p>
          </div>
        </section>

        {!loading && !error && (
          <p className="mt-3 px-1 text-[11px] text-[#88796d] sm:mt-4 sm:text-xs">
            Showing {filteredProducts.length} of {products.length} designs · {SHOP_NAME}, {SHOP_CITY}
          </p>
        )}

        {loading ? (
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{[0, 1, 2, 3, 4, 5, 6, 7].map((item) => <div key={item} className="aspect-[4/4.4] animate-pulse rounded-2xl bg-[#eee6db]" />)}</div>
        ) : error ? (
          <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:mt-8 sm:p-5">{error}</p>
        ) : filteredProducts.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[#ddcfbd] bg-white p-6 text-center sm:mt-8 sm:p-10">
            <span className="font-serif text-4xl text-[#a67d4d]" aria-hidden="true">✧</span>
            <h2 className="mt-3 font-serif text-2xl text-[#332723]">No matching designs</h2>
            <p className="mt-2 text-sm text-[#7c6d62]">Try another search or choose a different collection.</p>
            <button type="button" onClick={() => { setSearch(""); setCategory("ALL"); }} className="mt-4 rounded-full border border-[#d9c8b3] px-4 py-2 text-xs font-semibold text-[#583641] hover:bg-[#f5eee5] sm:mt-5 sm:px-5 sm:py-2.5 sm:text-sm">Clear filters</button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <article key={product.id} className="group overflow-hidden rounded-2xl border border-[#ebe2d8] bg-white transition duration-300 sm:rounded-[20px] sm:hover:-translate-y-1 sm:hover:shadow-[0_18px_40px_rgba(54,38,31,0.09)]">
                <Link href={`/product/${encodeURIComponent(product.reference)}`} className="block">
                  <div className="relative aspect-[4/4.25] overflow-hidden bg-[#f4efe8] p-2 sm:aspect-[4/4.6] sm:p-5">
                    <img src={product.imagePath} alt={product.name || `Jewellery ${product.reference}`} loading="lazy" className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03] sm:group-hover:scale-[1.04]" />
                    <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full border border-white/70 bg-white/85 px-2 py-1 text-[8px] font-medium uppercase tracking-[0.08em] text-[#775538] backdrop-blur sm:left-4 sm:top-4 sm:px-2.5 sm:text-[10px] sm:tracking-[0.12em]">{getCategoryLabel(product.category)}</span>
                  </div>
                </Link>
                <div className="p-2.5 sm:p-4">
                  <h2 className="truncate font-serif text-sm text-[#302421] sm:text-lg">{product.name || `Design ${product.reference}`}</h2>
                  {product.description && <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#83746b] sm:text-xs sm:leading-5">{product.description}</p>}
                  <p className="mt-1.5 text-[9px] text-[#948477] sm:mt-2 sm:text-xs">Reference {product.reference}</p>
                  {product.price !== null && <p className="mt-1.5 text-xs font-semibold text-[#49313a] sm:mt-2 sm:text-sm">₹{product.price.toLocaleString("en-IN")}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[#f0e9e1] pt-2 sm:mt-3 sm:gap-2 sm:pt-3">
                    <Link href={`/product/${encodeURIComponent(product.reference)}`} className="rounded-full bg-[#542d35] px-2.5 py-1.5 text-[10px] font-semibold text-white transition hover:bg-[#3f202a] sm:px-3.5 sm:py-2 sm:text-xs">View design</Link>
                    <a href={`https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello, I am interested in ${product.name || "jewellery"} (reference ${product.reference}).`)}`} target="_blank" rel="noreferrer" className="rounded-full border border-[#d9c8b3] px-2.5 py-1.5 text-[10px] font-semibold text-[#583641] transition hover:bg-[#f7f0e7] sm:px-3.5 sm:py-2 sm:text-xs">WhatsApp</a>
                    <a href={`mailto:${SHOP_EMAIL}?subject=${encodeURIComponent(`Jewellery enquiry: ${product.name || "Jewellery"} (${product.reference})`)}`} className="px-0.5 py-1.5 text-[10px] text-[#786a61] underline decoration-[#d6cabe] underline-offset-2 hover:text-[#583641] sm:px-1 sm:py-2 sm:text-xs">Email</a>
                  </div>
                  <EnquiryForm productReference={product.reference} productName={product.name || "Jewellery"} compact />
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="mt-8 border-t border-[#e5dbce] pt-5 text-center text-[11px] text-[#88796d] sm:mt-14 sm:pt-6 sm:text-xs">
          <p className="font-semibold text-[#332723]">{SHOP_NAME}</p>
          <p className="mt-1">Contact us to confirm availability, specifications, and current pricing.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link href="/" className="text-[#743f35] hover:underline">← Back to home</Link>
            <Link href="/dashboard/products" className="text-[#a29488] hover:text-[#743f35]">Owner sign in</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
