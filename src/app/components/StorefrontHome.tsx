"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LiveRates from "@/app/components/LiveRates";
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
  homeFeaturedOrder: number | null;
};

function openAssistant() {
  window.dispatchEvent(new Event("omjewellers:open-assistant"));
}

export default function StorefrontHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load products.");
        const data: Product[] = await response.json();
        if (active) setProducts(data.filter((product) => product.isActive));
      } catch {
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProducts();
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => {
    const byCategory = new Map<string, { product: Product; count: number }>();
    for (const product of products) {
      const existing = byCategory.get(product.category);
      if (existing) existing.count += 1;
      else byCategory.set(product.category, { product, count: 1 });
    }
    return [...byCategory.entries()].map(([category, details]) => ({ category, ...details }));
  }, [products]);

  const selectedSlides = products
    .filter((product) => product.homeFeaturedOrder !== null)
    .sort((a, b) => (a.homeFeaturedOrder ?? 0) - (b.homeFeaturedOrder ?? 0));
  const slides = selectedSlides.length ? selectedSlides : products.slice(0, 5);
  const activeFeaturedIndex = slides.length ? featuredIndex % slides.length : 0;
  const featured = slides.length ? slides[activeFeaturedIndex] : null;
  const featuredProducts = products.slice(0, 4);

  useEffect(() => {
    if (slides.length < 2) return;

    const intervalId = window.setInterval(() => {
      setFeaturedIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [slides.length]);

  return (
    <main className="min-h-screen bg-[#fbf8f2] text-[#241d1a]">
      <StorefrontHeader />

      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-5 sm:px-7 sm:pt-8 lg:px-10">
        <section className="relative overflow-hidden rounded-[28px] bg-[#2b1722] text-[#fff9ef] shadow-[0_22px_55px_rgba(48,25,34,0.16)]">
          <div className="pointer-events-none absolute inset-2 rounded-[22px] border border-[#c6a26a]/35 sm:inset-3 sm:rounded-[24px]" />
          <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full border border-[#c6a26a]/15" />
          <div className="pointer-events-none absolute -bottom-40 right-1/3 h-80 w-80 rounded-full border border-[#c6a26a]/10" />

          <div className="relative grid min-h-[430px] items-center gap-8 px-7 py-10 sm:px-12 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-16">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.26em] text-[#dfc18d]">{SHOP_NAME} · {SHOP_CITY}</p>
              <h1 className="mt-5 font-serif text-4xl leading-[1.12] sm:text-5xl lg:text-[64px]">
                Jewellery for the moments you keep.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#e9ded5] sm:text-base sm:leading-8">
                Explore considered designs for everyday wear and celebrations. Find a piece you love, then speak with us about its details.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/shop" className="rounded-full bg-[#c99e61] px-6 py-3 text-sm font-semibold text-[#2a1a1c] transition hover:bg-[#dfba7d]">
                  Explore the collection <span aria-hidden="true">→</span>
                </Link>
                <button type="button" onClick={openAssistant} className="rounded-full border border-white/35 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                  Find a design
                </button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#d9c9bf]">
                <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d8b778]" />Personal help with every enquiry</span>
                <a href={`https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello, I have a jewellery enquiry.")}`} target="_blank" rel="noreferrer" className="underline decoration-white/30 underline-offset-4 hover:text-white">Chat with our team</a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[570px]">
              <div className="absolute -inset-4 rounded-[32px] bg-[#d0aa70]/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[24px] border border-white/15 bg-[#f4efe8] p-4 shadow-2xl sm:p-5">
                <div className="aspect-[1.2/1] overflow-hidden rounded-[18px] bg-white" role="region" aria-roledescription="carousel" aria-label="Featured jewellery designs">
                  {slides.length ? (
                    <div
                      className="flex h-full w-full transition-transform duration-700 ease-in-out motion-reduce:transition-none"
                      style={{ transform: `translateX(-${activeFeaturedIndex * 100}%)` }}
                    >
                      {slides.map((slide, index) => (
                        <div key={slide.id} aria-hidden={index !== activeFeaturedIndex} className="flex h-full w-full shrink-0 items-center justify-center">
                          <img
                            src={slide.imagePath}
                            alt={slide.name || `Jewellery design ${slide.reference}`}
                            className="h-full w-full object-contain p-4 sm:p-6"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center px-8 text-center text-[#715e53]">
                      <span className="font-serif text-5xl text-[#a67d4d]" aria-hidden="true">✧</span>
                      <p className="mt-4 font-serif text-2xl">A collection with character</p>
                      <p className="mt-2 text-sm">New designs are being prepared.</p>
                    </div>
                  )}
                </div>
                {featured && (
                  <div className="flex items-center justify-between gap-4 px-2 pb-1 pt-4 text-[#2b2220]">
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8b684b]">Featured · {getCategoryLabel(featured.category)}</p>
                      <p className="mt-1 truncate font-serif text-lg sm:text-xl">{featured.name || getCategoryLabel(featured.category)}</p>
                      <p className="mt-0.5 text-sm font-semibold text-[#49313a]">{featured.price !== null ? `₹${featured.price.toLocaleString("en-IN")}` : "Price on request"}</p>
                      <p className="mt-0.5 text-xs text-[#786a61]">Reference {featured.reference}</p>
                    </div>
                    <Link href={`/product/${encodeURIComponent(featured.reference)}`} className="shrink-0 rounded-full border border-[#d9c8b3] px-4 py-2 text-xs font-semibold text-[#583641] transition hover:bg-[#f5eee5]">
                      View design
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14 sm:mt-16" aria-labelledby="categories-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8c694f]">A world of detail</p>
              <h2 id="categories-heading" className="mt-2 font-serif text-3xl text-[#2c2220] sm:text-4xl">Browse by collection</h2>
            </div>
            <Link href="/shop" className="hidden pb-1 text-sm font-semibold text-[#743f35] hover:underline sm:inline-flex">View all designs <span className="ml-2">→</span></Link>
          </div>

          {loading ? (
            <p className="mt-7 text-sm text-[#7c6d62]">Loading the collection…</p>
          ) : categories.length ? (
            <div className="mt-7 flex gap-5 overflow-x-auto pb-4 sm:gap-7">
              {categories.map(({ category, product, count }) => (
                <Link key={category} href={`/shop?category=${encodeURIComponent(category)}`} className="group min-w-[96px] text-center sm:min-w-[112px]">
                  <span className="mx-auto block h-[86px] w-[86px] overflow-hidden rounded-full border border-[#e4d5c1] bg-white p-1.5 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-md sm:h-[102px] sm:w-[102px]">
                    <img src={product.imagePath} alt="" loading="lazy" className="h-full w-full rounded-full object-cover" />
                  </span>
                  <span className="mt-3 block text-xs font-medium text-[#4e413b] sm:text-sm">{getCategoryLabel(category)}</span>
                  <span className="mt-1 block text-[11px] text-[#948477]">{count} {count === 1 ? "design" : "designs"}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-dashed border-[#ddcfbd] bg-white/70 p-7 text-sm text-[#7c6d62]">
              {loading ? "Loading collections…" : "Published designs will appear here."}
            </div>
          )}
        </section>

        <section className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8c694f]">Selected for you</p>
                <h2 className="mt-2 font-serif text-3xl text-[#2c2220] sm:text-4xl">Featured designs</h2>
              </div>
              <Link href="/shop" className="pb-1 text-sm font-semibold text-[#743f35] hover:underline">See the collection →</Link>
            </div>

            {loading ? (
              <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="aspect-[4/5] animate-pulse rounded-2xl bg-[#eee6db]" />)}</div>
            ) : featuredProducts.length ? (
              <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {featuredProducts.map((product) => (
                  <Link key={product.id} href={`/product/${encodeURIComponent(product.reference)}`} className="group overflow-hidden rounded-2xl border border-[#ebe2d8] bg-white transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(54,38,31,0.09)]">
                    <div className="aspect-[4/4.5] overflow-hidden bg-[#f4efe8] p-3 sm:p-4">
                      <img src={product.imagePath} alt={product.name || `Jewellery ${product.reference}`} loading="lazy" className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]" />
                    </div>
                    <div className="p-3 sm:p-4">
                      <p className="truncate text-[10px] font-medium uppercase tracking-[0.13em] text-[#926f50]">Type · {getCategoryLabel(product.category)}</p>
                      <p className="mt-1 truncate font-serif text-base text-[#302421] sm:text-lg">{product.name || `Design ${product.reference}`}</p>
                      <p className="mt-1 text-sm font-semibold text-[#49313a]">{product.price !== null ? `₹${product.price.toLocaleString("en-IN")}` : "Price on request"}</p>
                      <p className="mt-1 text-xs text-[#83746b]">Ask us about this design <span aria-hidden="true">→</span></p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-2xl bg-white p-6 text-sm text-[#7c6d62]">New designs are being prepared. Please check back soon.</p>
            )}
          </div>

          <aside className="rounded-[24px] bg-[#efe5d6] p-6 sm:p-7">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#865a3c]">A little guidance goes a long way</p>
            <h3 className="mt-3 font-serif text-2xl leading-snug text-[#302421]">Looking for a particular style?</h3>
            <p className="mt-3 text-sm leading-6 text-[#6d5e54]">Share a photo or tell us what you have in mind. Our jewellery assistant can help find similar designs.</p>
            <button type="button" onClick={openAssistant} className="mt-5 rounded-full bg-[#542d35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3f202a]">Talk to our assistant →</button>
          </aside>
        </section>

        <section className="mt-14 sm:mt-16">
          <LiveRates />
        </section>

        <footer className="mt-14 flex flex-col gap-5 border-t border-[#e5dbce] pt-6 text-sm text-[#74665d] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[#332723]">{SHOP_NAME}</p>
            <p className="mt-1 text-xs">Fine jewellery · {SHOP_CITY}</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/shop" className="hover:text-[#743f35]">Shop the collection</Link>
            <a href={`https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello, I have a jewellery enquiry.")}`} target="_blank" rel="noreferrer" className="hover:text-[#743f35]">WhatsApp</a>
            <a href={`mailto:${SHOP_EMAIL}?subject=${encodeURIComponent("Jewellery enquiry")}`} className="hover:text-[#743f35]">Email us</a>
            <Link href="/dashboard/products" className="text-xs text-[#a29488] hover:text-[#743f35]">Owner sign in</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
