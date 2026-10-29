"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import LogoutButton from "@/app/components/LogoutButton";
import { SHOP_NAME } from "@/lib/shop-details";

type Product = {
  id: string;
  reference: string;
  name: string | null;
  category: string;
  price: number | null;
  weight: number | null;
  carat: number | null;
};

type BillLine = {
  productId: string;
  description: string;
  weight: string;
  metalAmount: string;
  labourCharge: string;
};

type SavedBill = {
  billNumber: string;
  shareToken: string;
  customerName: string;
  customerPhone: string;
  total: number;
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function blankLine(): BillLine {
  return { productId: "", description: "", weight: "", metalAmount: "", labourCharge: "" };
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

export default function BillingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [labourByCategory, setLabourByCategory] = useState<Record<string, number>>({});
  const [gstNumber, setGstNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<BillLine[]>([blankLine()]);
  const [savedBill, setSavedBill] = useState<SavedBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadBillingData() {
      try {
        const [productsResponse, labourResponse, settingsResponse] = await Promise.all([
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/category-labour", { cache: "no-store" }),
          fetch("/api/billing-settings", { cache: "no-store" }),
        ]);
        const [productData, labourData, settingsData] = await Promise.all([
          productsResponse.json(),
          labourResponse.json(),
          settingsResponse.json(),
        ]);
        if (!productsResponse.ok || !labourResponse.ok || !settingsResponse.ok) {
          throw new Error("Could not load billing details. Please sign in again and refresh.");
        }
        if (active) {
          setProducts(productData as Product[]);
          setLabourByCategory(labourData as Record<string, number>);
          setGstNumber(settingsData.gstNumber ?? "");
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load billing details.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadBillingData();
    return () => { active = false; };
  }, []);

  const subtotal = useMemo(() => roundMoney(items.reduce((sum, item) => {
    const metalAmount = Number(item.metalAmount) || 0;
    const labourCharge = Number(item.labourCharge) || 0;
    return sum + metalAmount + labourCharge;
  }, 0)), [items]);
  const cgst = roundMoney(subtotal * 0.015);
  const sgst = roundMoney(subtotal * 0.015);
  const total = roundMoney(subtotal + cgst + sgst);

  function updateItem(index: number, changes: Partial<BillLine>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
  }

  function selectProduct(index: number, productId: string) {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product) {
      updateItem(index, { productId: "" });
      return;
    }
    const labourCharge = labourByCategory[product.category] ?? 0;
    const metalAmount = product.price === null ? "" : String(roundMoney(Math.max(0, product.price - labourCharge)));
    updateItem(index, {
      productId,
      description: product.name || `Design ${product.reference}`,
      weight: product.weight === null ? "" : String(product.weight),
      metalAmount,
      labourCharge: String(labourCharge),
    });
  }

  async function saveGstNumber(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingSettings(true);
    setError("");
    setSettingsMessage("");
    try {
      const response = await fetch("/api/billing-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gstNumber }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save GSTIN.");
      setGstNumber(result.gstNumber ?? "");
      setSettingsMessage("Shop GSTIN saved for future bills.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save GSTIN.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function createBill(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSavedBill(null);
    try {
      const response = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          items: items.map((item) => ({
            description: item.description,
            weight: item.weight === "" ? 0 : Number(item.weight),
            metalAmount: item.metalAmount === "" ? 0 : Number(item.metalAmount),
            labourCharge: item.labourCharge === "" ? 0 : Number(item.labourCharge),
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create the bill.");
      setSavedBill(result as SavedBill);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not create the bill.");
    } finally {
      setSaving(false);
    }
  }

  const onlineBillUrl = savedBill ? `${window.location.origin}/bill/${savedBill.shareToken}` : "";
  const whatsappMessage = savedBill
    ? `Namaste ${savedBill.customerName}, thank you for shopping with ${SHOP_NAME}. Your online bill ${savedBill.billNumber} is ready: ${onlineBillUrl}\n\nWe would love your feedback. Please reply to this message and tell us how we did. Thank you!`
    : "";
  const whatsappUrl = savedBill
    ? `https://wa.me/${savedBill.customerPhone}?text=${encodeURIComponent(whatsappMessage)}`
    : "";

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/dashboard/products" className="text-sm text-amber-800 hover:underline">← Back to products</Link>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-amber-900">{SHOP_NAME}</p>
            <h1 className="mt-1 text-3xl font-semibold">Billing pad</h1>
            <p className="mt-1 text-sm text-stone-600">Create a GST bill and share its online copy with the customer.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/rates" className="rounded-xl border border-amber-800 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50">Metal rates</Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <form onSubmit={saveGstNumber} className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">Shop GSTIN</h2>
                <p className="mt-1 text-sm text-stone-600">Add this once; it will be printed on each new bill.</p>
              </div>
              <button type="submit" disabled={savingSettings || loading} className="rounded-lg border border-amber-800 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50 disabled:opacity-50">
                {savingSettings ? "Saving…" : "Save GSTIN"}
              </button>
            </div>
            <input
              aria-label="Shop GST registration number"
              value={gstNumber}
              onChange={(event) => setGstNumber(event.target.value.toUpperCase())}
              maxLength={15}
              placeholder="15-character GSTIN (optional)"
              className="mt-4 w-full rounded-xl border border-stone-300 px-4 py-3 uppercase sm:max-w-md"
            />
            {settingsMessage && <p role="status" className="mt-2 text-sm text-green-800">{settingsMessage}</p>}
          </form>

          <form onSubmit={createBill} className="space-y-6 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <div>
              <h2 className="text-xl font-semibold">Customer details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">Customer name *
                  <input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 font-normal" placeholder="Enter customer name" />
                </label>
                <label className="block text-sm font-medium">Phone number *
                  <input required type="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 font-normal" placeholder="10-digit number or country code" />
                </label>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Bill items</h2>
                  <p className="mt-1 text-sm text-stone-600">Pick a saved design to fill its weight, value and category labour, or enter a line manually.</p>
                </div>
                <button type="button" onClick={() => setItems((current) => [...current, blankLine()])} className="rounded-lg border border-amber-800 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50">+ Add item</button>
              </div>

              <div className="mt-4 space-y-4">
                {items.map((item, index) => {
                  const lineTotal = roundMoney((Number(item.metalAmount) || 0) + (Number(item.labourCharge) || 0));
                  return (
                    <fieldset key={index} className="rounded-xl border border-stone-200 p-4">
                      <legend className="px-2 text-sm font-semibold text-stone-700">Item {index + 1}</legend>
                      <label className="block text-sm font-medium">Saved product (optional)
                        <select value={item.productId} onChange={(event) => selectProduct(index, event.target.value)} className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 font-normal">
                          <option value="">Enter this item manually</option>
                          {products.map((product) => <option key={product.id} value={product.id}>{product.reference} · {product.name || product.category}</option>)}
                        </select>
                      </label>
                      <label className="mt-3 block text-sm font-medium">Item name or description *
                        <input required value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 font-normal" placeholder="e.g. Gold bracelet" />
                      </label>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm font-medium">Weight (g)
                          <input type="number" min="0" step="0.001" value={item.weight} onChange={(event) => updateItem(index, { weight: event.target.value })} className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 font-normal" placeholder="0" />
                        </label>
                        <label className="block text-sm font-medium">Gold / item value (₹)
                          <input required type="number" min="0" step="0.01" value={item.metalAmount} onChange={(event) => updateItem(index, { metalAmount: event.target.value })} className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 font-normal" placeholder="Enter value before labour" />
                        </label>
                        <label className="block text-sm font-medium">Labour charge (₹)
                          <input required type="number" min="0" step="0.01" value={item.labourCharge} onChange={(event) => updateItem(index, { labourCharge: event.target.value })} className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 font-normal" placeholder="0" />
                        </label>
                        <div className="flex items-end justify-between gap-3">
                          <div className="pb-2">
                            <p className="text-xs text-stone-500">Item total before GST</p>
                            <p className="mt-1 font-semibold">{money.format(lineTotal)}</p>
                          </div>
                          {items.length > 1 && <button type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="mb-2 text-sm text-red-700 hover:underline">Remove item</button>}
                        </div>
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            </div>

            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            {savedBill && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <h3 className="font-semibold text-green-900">Bill {savedBill.billNumber} created</h3>
                <p className="mt-1 text-sm text-green-900">The online bill is ready. Send the greeting and feedback request with it through WhatsApp.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href={onlineBillUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-green-800 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-100">Open online bill</a>
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900">Send to customer on WhatsApp</a>
                </div>
                <p className="mt-3 text-xs text-green-900">WhatsApp opens the message for this customer; tap Send in WhatsApp to deliver it.</p>
              </div>
            )}

            <button type="submit" disabled={saving || loading} className="w-full rounded-xl bg-amber-800 px-5 py-3 font-semibold text-white hover:bg-amber-900 disabled:opacity-50">
              {saving ? "Creating bill…" : "Create bill"}
            </button>
          </form>
        </div>

        <aside className="h-fit rounded-2xl border border-amber-200 bg-amber-50 p-5 lg:sticky lg:top-6">
          <h2 className="text-lg font-semibold">Bill summary</h2>
          <div className="mt-5 space-y-3 border-b border-amber-200 pb-4 text-sm">
            <div className="flex justify-between gap-3"><span>Items before GST</span><span>{money.format(subtotal)}</span></div>
            <div className="flex justify-between gap-3"><span>CGST · 1.5%</span><span>{money.format(cgst)}</span></div>
            <div className="flex justify-between gap-3"><span>SGST · 1.5%</span><span>{money.format(sgst)}</span></div>
          </div>
          <div className="mt-4 flex items-baseline justify-between gap-3">
            <span className="font-semibold">Total including GST</span>
            <span className="text-xl font-bold">{money.format(total)}</span>
          </div>
          <p className="mt-4 text-xs leading-5 text-stone-600">GST totals 3% of the pre-tax amount: ₹300 GST on each ₹10,000. It is split equally between CGST and SGST.</p>
          {gstNumber && <p className="mt-3 text-xs text-stone-600">Shop GSTIN: {gstNumber}</p>}
        </aside>
      </section>
    </main>
  );
}
