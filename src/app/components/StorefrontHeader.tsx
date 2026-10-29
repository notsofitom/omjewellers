"use client";

import { useState } from "react";
import Link from "next/link";
import { SHOP_CITY, SHOP_NAME } from "@/lib/shop-details";
import { STOREFRONT_CATEGORIES, getCategoryLabel } from "@/lib/storefront-categories";

export default function StorefrontHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCategory, setCurrentCategory] = useState("");

  return (
    <header className="sticky top-0 z-40 border-b border-[#e9e1d5] bg-[#fffdf9]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-7 sm:py-3 lg:px-10">
        <Link href="/" className="flex min-w-0 items-center gap-2 text-[#241923] sm:gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#b58b53] font-serif text-sm font-semibold text-[#6a402e] sm:h-10 sm:w-10">
            OM
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold tracking-[0.04em] sm:text-base sm:tracking-[0.06em]">{SHOP_NAME}</span>
            <span className="mt-0.5 block text-[9px] uppercase tracking-[0.15em] text-[#806b5e] sm:text-[11px] sm:tracking-[0.2em]">Fine jewellery · {SHOP_CITY}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-4 text-xs text-[#514844] lg:flex xl:gap-6 xl:text-sm" aria-label="Main navigation">
          <Link href="/" className="transition hover:text-[#8a4a20]">Home</Link>
          <a href="/shop" className="transition hover:text-[#8a4a20]">All jewellery</a>
          {STOREFRONT_CATEGORIES.slice(0, 4).map((category) => (
            <a
              key={category.value}
              href={`/shop?category=${encodeURIComponent(category.value)}`}
              className="whitespace-nowrap transition hover:text-[#8a4a20]"
            >
              {getCategoryLabel(category.value)}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button type="button" onClick={() => { if (!searchOpen) { const params = new URLSearchParams(window.location.search); setSearchTerm(params.get("search") ?? ""); setCurrentCategory(params.get("category") ?? ""); } setSearchOpen((open) => !open); }} aria-label={searchOpen ? "Close search" : "Search and browse jewellery"} aria-expanded={searchOpen} className="grid h-9 w-9 place-items-center rounded-full border border-[#e4d9cb] text-[#533f34] transition hover:bg-[#f5eee4] sm:h-10 sm:w-10">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              {searchOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4.2 4.2" /></>}
            </svg>
          </button>
        </div>
      </div>

      {searchOpen && (
        <form action="/shop" method="get" className="mx-auto flex max-w-[1440px] gap-2 border-t border-[#eee7dd] px-3 py-2 sm:px-7 lg:px-10">
          <label htmlFor="header-search" className="sr-only">Search designs or references</label>
          {currentCategory && <input type="hidden" name="category" value={currentCategory} />}
          <input
            autoFocus
            id="header-search"
            type="search"
            name="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false); }}
            placeholder="Search designs or references"
            className="min-w-0 flex-1 rounded-full border border-[#e5d9ca] bg-[#fdfbf8] px-4 py-2.5 text-sm outline-none placeholder:text-[#a29488] focus:border-[#a77b4b]"
          />
          <button type="submit" className="rounded-full bg-[#542d35] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3f202a] sm:px-5 sm:text-sm">Search</button>
        </form>
      )}

      <nav className="flex gap-1.5 overflow-x-auto border-t border-[#eee7dd] px-3 py-2 text-[11px] text-[#66584e] sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs lg:hidden" aria-label="Jewellery categories">
        <a href="/shop" className="shrink-0 rounded-full bg-[#f4ece1] px-2.5 py-1.5 font-medium text-[#684630] sm:px-3 sm:py-2">All designs</a>
        {STOREFRONT_CATEGORIES.map((category) => (
          <a
            key={category.value}
            href={`/shop?category=${encodeURIComponent(category.value)}`}
            className="shrink-0 rounded-full px-2.5 py-1.5 transition hover:bg-[#f4ece1] sm:px-3 sm:py-2"
          >
            {getCategoryLabel(category.value)}
          </a>
        ))}
      </nav>
    </header>
  );
}
