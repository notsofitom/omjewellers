"use client";

import { useEffect, useState } from "react";

type RateData = {
  currency: string;
  unit: string;
  rates: { purity: string; ratePerGram: number }[];
  silverPerGram: number | null;
  updatedAt: string | null;
  source: string;
};

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export default function LiveRates() {
  const [data, setData] = useState<RateData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/rates", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Rates unavailable.");
        if (active) {
          setData(result);
          setError("");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Rates unavailable.");
      }
    }
    void load();
    const interval = window.setInterval(() => void load(), 300_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6" aria-label="Owner-set gold and silver rates">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-amber-900">Shop rates</p>
          <h2 className="mt-2 text-2xl font-semibold">Gold &amp; silver rates</h2>
          <p className="mt-1 text-sm text-stone-600">INR per gram · Set by the shop</p>
        </div>
        {data?.updatedAt && <p className="text-xs text-stone-500">Updated {new Date(data.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>}
      </div>
      {data && (data.rates.length > 0 || data.silverPerGram !== null) ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ...data.rates,
            ...(data.silverPerGram === null ? [] : [{ purity: "Silver", ratePerGram: data.silverPerGram }]),
          ].map((item) => (
            <div key={item.purity} className="rounded-xl border border-amber-100 bg-white p-4">
              <p className="text-sm text-stone-500">{item.purity}</p>
              <p className="mt-1 font-semibold">{rupees.format(item.ratePerGram)}</p>
              <p className="text-xs text-stone-500">per gram</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-white p-4 text-sm text-stone-600">{error || (data ? "Shop rates will appear here once the owner enters them." : "Loading shop rates…")}</p>
      )}
      <p className="mt-4 text-xs leading-5 text-stone-500">
        {data?.source ?? "Owner-set reference rates"}. Jewellery prices may also include labour and other charges.
      </p>
    </section>
  );
}
