"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type PdfPage = { number: number; preview: string; blob: Blob };

const existingCategories = [
  ["CUBAN-BRACELETS", "Cuban Bracelets"],
  ["CUBAN-BRACELETS-9K", "Cuban Bracelets 9K"],
  ["dokiya-9k", "Dokiya 9K"],
  ["GENTS-BRACELETS-9K", "Gents Bracelets 9K"],
  ["GENTS-CHAINS", "Gents Chains"],
  ["GOD-PENDANTS", "God Pendants"],
  ["LADIES-CHAINS9K", "Ladies Chains 9K"],
  ["PENDANT-SETS-CZ", "Pendant Sets CZ"],
];

export default function ImportPdfPage() {
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [category, setCategory] = useState(existingCategories[0][0]);
  const [customCategory, setCustomCategory] = useState("");
  const [referencePrefix, setReferencePrefix] = useState("PDF-");
  const [startNumber, setStartNumber] = useState("001");
  const [productName, setProductName] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => () => pages.forEach((page) => URL.revokeObjectURL(page.preview)), [pages]);

  const actualCategory = category === "__custom__" ? customCategory.trim() : category;
  const references = useMemo(() => {
    const first = Number(startNumber);
    return selected.map((_, index) => `${referencePrefix.trim()}${String(first + index).padStart(startNumber.length, "0")}`);
  }, [selected, referencePrefix, startNumber]);

  async function loadPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPages([]);
    setSelected([]);
    setStatus("");
    if (!file) return;
    if (file.type !== "application/pdf" || file.size > 500 * 1024 * 1024) {
      setStatus("Choose a PDF file of 500 MB or less.");
      return;
    }

    setLoading(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      if (pdf.numPages > 100) throw new Error("This PDF has more than 100 pages. Split it into smaller files first.");
      const rendered: PdfPage[] = [];
      for (let number = 1; number <= pdf.numPages; number += 1) {
        const page = await pdf.getPage(number);
        const viewport = page.getViewport({ scale: Math.min(1.5, 1800 / Math.max(page.getViewport({ scale: 1 }).width, page.getViewport({ scale: 1 }).height)) });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Your browser could not render this PDF.");
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not convert a PDF page to an image.")), "image/jpeg", 0.9));
        rendered.push({ number, preview: URL.createObjectURL(blob), blob });
        canvas.width = 0;
        canvas.height = 0;
      }
      setPages(rendered);
      setStatus(`${rendered.length} PDF page${rendered.length === 1 ? "" : "s"} ready. Select the pages to import.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not read this PDF.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  function togglePage(number: number) {
    setSelected((current) => {
      if (current.includes(number)) return current.filter((item) => item !== number);
      if (current.length >= 100) {
        setStatus("Import up to 100 pages at a time.");
        return current;
      }
      return [...current, number].sort((a, b) => a - b);
    });
  }

  async function importPages() {
    if (!selected.length || !actualCategory || !referencePrefix.trim() || !Number.isInteger(Number(startNumber)) || Number(startNumber) < 0) {
      setStatus("Enter a category, a reference prefix, and a valid starting number, then select pages.");
      return;
    }
    if (new Set(references).size !== references.length) {
      setStatus("The generated product references must be unique.");
      return;
    }
    setSaving(true);
    const importedReferences: string[] = [];
    setStatus("Preparing " + selected.length + " selected pages...");
    try {
      const batchSize = 5;
      for (let offset = 0; offset < selected.length; offset += batchSize) {
        const batchPages = selected.slice(offset, offset + batchSize);
        const form = new FormData();
        form.set("category", actualCategory);
        form.set("name", productName.trim());
        form.set("references", JSON.stringify(references.slice(offset, offset + batchPages.length)));
        for (const number of batchPages) {
          form.append("pages", pages[number - 1].blob, "pdf-page-" + number + ".jpg");
        }
        setStatus("Importing pages " + (offset + 1) + "-" + (offset + batchPages.length) + " of " + selected.length + "...");
        const response = await fetch("/api/products/import-pdf", { method: "POST", body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not import the selected pages.");
        importedReferences.push(...result.references);
      }
      setStatus("Imported " + importedReferences.length + " products: " + importedReferences.join(", "));
      setSelected([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not import the selected pages.";
      setStatus(importedReferences.length
        ? "Imported " + importedReferences.length + " of " + selected.length + " products. The remaining pages stopped with this error: " + message
        : message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-6 py-5">
        <div className="mx-auto max-w-6xl">
          <a href="/products" className="text-sm text-amber-800 hover:underline">← Product Management</a>
          <h1 className="mt-4 text-3xl font-semibold">Import product photos from a PDF</h1>
          <p className="mt-2 text-stone-600">Each selected PDF page becomes one new product with its own gallery photo.</p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold">1. Choose a PDF</h2>
          <p className="my-3 text-sm text-stone-600">PDF pages are rendered in your browser. Files are sent to the app only when you import the pages. Maximum PDF size: 500 MB.</p>
          <input type="file" accept="application/pdf,.pdf" onChange={loadPdf} disabled={loading || saving} className="block w-full text-sm" />
          {loading && <p className="mt-3 text-sm text-stone-600">Rendering PDF pages…</p>}
        </div>

        {pages.length > 0 && <>
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">2. Select pages ({selected.length} selected)</h2>
              <button type="button" onClick={() => setSelected(selected.length === Math.min(pages.length, 100) ? [] : pages.slice(0, 100).map((page) => page.number))} className="text-sm font-medium text-amber-800 underline">{selected.length === Math.min(pages.length, 100) ? "Clear selection" : "Select up to 100 pages"}</button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {pages.map((page) => <button key={page.number} type="button" onClick={() => togglePage(page.number)} aria-pressed={selected.includes(page.number)} className={`overflow-hidden rounded-xl border-2 p-2 text-left ${selected.includes(page.number) ? "border-amber-800 bg-amber-50" : "border-stone-200"}`}>
                <img src={page.preview} alt={`PDF page ${page.number}`} className="aspect-[3/4] w-full bg-white object-contain" />
                <span className="mt-2 block text-sm font-medium">{selected.includes(page.number) ? "✓ " : ""}Page {page.number}</span>
              </button>)}
            </div>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">One PDF page becomes one product photo. If a page shows several separate jewellery designs, crop or split that page first so each product gets its own photo.</p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="text-xl font-semibold">3. Add product details</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium">Category<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 block w-full rounded-xl border border-stone-300 bg-white p-3">{existingCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}<option value="__custom__">New category…</option></select></label>
              {category === "__custom__" && <label className="text-sm font-medium">New category name<input value={customCategory} onChange={(event) => setCustomCategory(event.target.value)} maxLength={60} placeholder="For example: Diamond Rings" className="mt-2 block w-full rounded-xl border border-stone-300 p-3" /></label>}
              <label className="text-sm font-medium">Reference prefix<input value={referencePrefix} onChange={(event) => setReferencePrefix(event.target.value)} maxLength={35} placeholder="For example: SPRING-" className="mt-2 block w-full rounded-xl border border-stone-300 p-3" /></label>
              <label className="text-sm font-medium">Starting number<input type="number" min="0" value={startNumber} onChange={(event) => setStartNumber(event.target.value)} className="mt-2 block w-full rounded-xl border border-stone-300 p-3" /></label>
              <label className="text-sm font-medium">Product name (optional)<input value={productName} onChange={(event) => setProductName(event.target.value)} maxLength={120} placeholder="Same name for each imported product" className="mt-2 block w-full rounded-xl border border-stone-300 p-3" /></label>
            </div>
            {selected.length > 0 && <p className="mt-4 text-sm text-stone-600">References: {references.join(", ")}</p>}
            <button type="button" onClick={importPages} disabled={!selected.length || saving || loading} className="mt-5 w-full rounded-xl bg-amber-800 px-5 py-3 font-medium text-white hover:bg-amber-900 disabled:opacity-50">{saving ? "Importing…" : `Import ${selected.length || "selected"} page${selected.length === 1 ? "" : "s"} as product${selected.length === 1 ? "" : "s"}`}</button>
          </div>
        </>}

        {status && <p role="status" className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700">{status}</p>}
      </section>
    </main>
  );
}
