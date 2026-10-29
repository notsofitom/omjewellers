"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import EnquiryForm from "@/app/components/EnquiryForm";
import { SHOP_EMAIL, SHOP_WHATSAPP_NUMBER } from "@/lib/shop-details";

type Match = { reference: string; name: string | null; category: string; imagePath: string; price: number | null };
type Turn = { role: "user" | "assistant"; content: string; matches?: Match[] };

export default function AssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState("");
  const [history, setHistory] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const openAssistant = () => setOpen(true);
    window.addEventListener("omjewellers:open-assistant", openAssistant);
    return () => window.removeEventListener("omjewellers:open-assistant", openAssistant);
  }, []);

  if (pathname.startsWith("/dashboard")) return null;

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if ((!text && !image) || busy) return;

    const nextHistory: Turn[] = [...history, { role: "user", content: text || "Find similar jewellery in the shop." }];
    setHistory(nextHistory);
    setMessage("");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, image: image || undefined, history: history.slice(-8) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not contact the assistant.");
      setHistory([...nextHistory, { role: "assistant", content: result.reply, matches: result.matches }]);
      setImage("");
    } catch (err) {
      setHistory(history);
      setError(err instanceof Error ? err.message : "Could not contact the assistant.");
    } finally {
      setBusy(false);
    }
  }

  function selectImage(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) {
      setError("Choose a JPG, PNG, or WebP image under 3 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <section className="mb-3 flex h-[min(80vh,680px)] w-[min(92vw,400px)] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl" aria-label="Jewellery assistant">
          <header className="flex items-center justify-between bg-amber-900 px-4 py-3 text-white">
            <div><h2 className="font-semibold">Jewellery assistant</h2><p className="text-xs text-amber-100">Ask a question or share a photo</p></div>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-2 hover:bg-amber-800" aria-label="Close chat">✕</button>
          </header>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {history.length === 0 && <p className="rounded-xl bg-stone-100 p-3 text-sm text-stone-700">Hello! Ask about our jewellery or upload a jewellery photo to find similar designs. Live metal rates are on the homepage.</p>}
            {history.map((turn, index) => (
              <div key={index} className={turn.role === "user" ? "ml-8 rounded-xl bg-amber-100 p-3 text-sm" : "mr-4 rounded-xl bg-stone-100 p-3 text-sm"}>
                <p className="whitespace-pre-wrap">{turn.content}</p>
                {turn.matches?.map((product) => (
                  <article key={product.reference} className="mt-3 overflow-hidden rounded-lg border border-stone-200 bg-white">
                    <img src={product.imagePath} alt={product.name || `Product ${product.reference}`} className="h-36 w-full object-contain p-2" />
                    <div className="space-y-2 p-3">
                      <p className="font-medium">{product.name || `Reference ${product.reference}`}</p>
                      <p className="text-xs text-stone-500">{product.category.replaceAll("-", " ")} · Ref {product.reference}</p>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/product/${encodeURIComponent(product.reference)}`} className="rounded bg-amber-800 px-3 py-2 text-xs font-medium text-white">View product</Link>
                        <a href={`https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello, I am interested in ${product.name || "jewellery"} (reference ${product.reference}).`)}`} target="_blank" rel="noreferrer" className="rounded border border-green-700 px-3 py-2 text-xs font-medium text-green-800">WhatsApp</a>
                        <a href={`mailto:${SHOP_EMAIL}?subject=${encodeURIComponent(`Jewellery enquiry: ${product.name || "Jewellery"} (${product.reference})`)}`} className="rounded border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700">Email</a>
                      </div>
                      <EnquiryForm productReference={product.reference} productName={product.name || "Jewellery"} />
                    </div>
                  </article>
                ))}
              </div>
            ))}
            {busy && <p className="text-sm text-stone-500">Looking through the collection…</p>}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-800">{error}</p>}
            <details className="rounded-xl border border-stone-200 bg-white p-3">
              <summary className="cursor-pointer text-sm font-medium text-amber-900">Send a general enquiry to the shop</summary>
              <EnquiryForm />
            </details>
          </div>
          <form onSubmit={send} className="space-y-2 border-t border-stone-200 p-3">
            {image && <p className="text-xs text-stone-600">Photo attached <button type="button" onClick={() => setImage("")} className="ml-2 text-red-700 underline">Remove</button></p>}
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={2} maxLength={1000} placeholder="Ask about jewellery…" className="w-full resize-none rounded-lg border border-stone-300 p-3 text-sm" />
            <div className="flex items-center justify-between gap-2">
              <label className="cursor-pointer rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium hover:bg-stone-50">Upload photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectImage(event.target.files?.[0])} className="sr-only" /></label>
              <button disabled={busy || (!message.trim() && !image)} className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? "Please wait…" : "Send"}</button>
              <a href={`https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello, I have a jewellery enquiry.")}`} target="_blank" rel="noreferrer" className="rounded-lg border border-green-700 px-3 py-2 text-xs font-medium text-green-800">WhatsApp</a>
              <a href={`mailto:${SHOP_EMAIL}?subject=${encodeURIComponent("Jewellery enquiry")}`} className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700">Email</a>
            </div>
          </form>
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} className="ml-auto flex items-center gap-2 rounded-full bg-amber-900 px-5 py-3 font-semibold text-white shadow-lg hover:bg-amber-800">{open ? "Close chat" : "Ask our jewellery assistant"}</button>
    </div>
  );
}
