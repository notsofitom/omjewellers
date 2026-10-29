"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LogoutButton from "@/app/components/LogoutButton";

const rateFields = [
  { purity: "24K", label: "24K gold" },
  { purity: "22K", label: "22K gold" },
  { purity: "20K", label: "20K gold" },
  { purity: "18K", label: "18K gold" },
  { purity: "9K", label: "9K gold" },
  { purity: "Silver", label: "Silver" },
];

type RatesResponse = {
  rates: { purity: string; ratePerGram: number }[];
  silverPerGram: number | null;
  updatedAt: string | null;
};

export default function MetalRatesPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadRates() {
      try {
        const response = await fetch("/api/rates", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load rates.");
        const data = result as RatesResponse;
        if (active) {
          const initialValues = Object.fromEntries(data.rates.map((rate) => [rate.purity, String(rate.ratePerGram)]));
          if (data.silverPerGram !== null) initialValues.Silver = String(data.silverPerGram);
          setValues(initialValues);
          setUpdatedAt(data.updatedAt);
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load rates.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadRates();
    return () => { active = false; };
  }, []);

  async function saveRates(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const rates = rateFields.map(({ purity }) => {
      const value = values[purity]?.trim() ?? "";
      return { purity, ratePerGram: value === "" ? null : Number(value) };
    });

    try {
      const response = await fetch("/api/rates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rates }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save rates.");

      const data = result as RatesResponse;
      const savedValues = Object.fromEntries(data.rates.map((rate) => [rate.purity, String(rate.ratePerGram)]));
      if (data.silverPerGram !== null) savedValues.Silver = String(data.silverPerGram);
      setValues(savedValues);
      setUpdatedAt(data.updatedAt);
      setMessage("Rates saved. Calculated product prices now use your saved rates.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save rates.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/dashboard/products" className="text-sm text-amber-800 hover:underline">← Back to products</Link>
            <h1 className="mt-3 text-3xl font-semibold">Metal rates</h1>
            <p className="mt-1 text-stone-600">Set your own gold and silver price per gram.</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <form onSubmit={saveRates} className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Your rates (₹ per gram)</h2>
              <p className="mt-1 text-sm text-stone-600">These values appear on the shop and are used to calculate product prices.</p>
            </div>
            {updatedAt && <p className="text-xs text-stone-500">Last saved {new Date(updatedAt).toLocaleString("en-IN")}</p>}
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-stone-600">Loading saved rates…</p>
          ) : error && Object.keys(values).length === 0 ? (
            <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>
          ) : (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rateFields.map(({ purity, label }) => (
                  <div key={purity}>
                    <label htmlFor={`rate-${purity}`} className="block text-sm font-medium">{label}</label>
                    <div className="mt-2 flex overflow-hidden rounded-xl border border-stone-300 bg-white focus-within:border-amber-700">
                      <span className="flex items-center border-r border-stone-200 px-3 text-stone-500">₹</span>
                      <input
                        id={`rate-${purity}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={values[purity] ?? ""}
                        onChange={(event) => setValues((current) => ({ ...current, [purity]: event.target.value }))}
                        placeholder="Enter rate"
                        className="min-w-0 flex-1 px-3 py-3 outline-none"
                      />
                      <span className="flex items-center px-3 text-xs text-stone-500">/ g</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-stone-700">
                Updating a gold rate recalculates saved products of that purity using their category labour charge. Leave a rate blank to remove it from the shop and disable price calculation for that purity.
              </p>
              {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
              {message && <p role="status" className="mt-4 text-sm text-green-800">{message}</p>}
              <button type="submit" disabled={saving || loading} className="mt-6 rounded-xl bg-amber-800 px-5 py-3 font-medium text-white hover:bg-amber-900 disabled:opacity-50">
                {saving ? "Saving rates…" : "Save rates"}
              </button>
            </>
          )}
        </form>
      </section>
    </main>
  );
}
