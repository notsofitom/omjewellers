"use client";

import { useState } from "react";

export default function EnquiryForm({
  productReference,
  productName,
  compact = false,
}: {
  productReference?: string;
  productName?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setError("");
    setMessage("");
      const form = new FormData(formElement);
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.get("customerName"),
          email: form.get("email"),
          phone: form.get("phone"),
          message: form.get("message"),
          productReference: productReference ?? null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send your enquiry.");
      setMessage(result.emailSent ? "Enquiry sent to the shop. We’ll be in touch soon." : result.emailConfigured ? "Enquiry saved, but the email could not be delivered. You can also contact the shop on WhatsApp." : "Enquiry saved. Email notifications are not configured yet.");
      formElement.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your enquiry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? "mt-2" : "mt-5"}>
      <button type="button" onClick={() => setOpen((value) => !value)} className={compact ? "w-full rounded-lg border border-amber-800 px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-50" : "rounded-lg border border-amber-800 px-5 py-3 font-medium text-amber-900 hover:bg-amber-50"}>
        {open ? "Close enquiry form" : "Send an enquiry"}
      </button>
      {open && (
        <form onSubmit={submit} className={`mt-3 rounded-xl border border-stone-200 bg-white ${compact ? "space-y-2 p-3" : "space-y-3 p-4"}`}>
          {productName && <p className="text-sm text-stone-600">About: {productName}{productReference ? ` (${productReference})` : ""}</p>}
          <input name="customerName" required maxLength={100} placeholder="Your name" className={`w-full rounded-lg border border-stone-300 ${compact ? "p-2 text-xs" : "p-3"}`} />
          <input name="email" type="email" required maxLength={200} placeholder="Your email" className={`w-full rounded-lg border border-stone-300 ${compact ? "p-2 text-xs" : "p-3"}`} />
          <div>
            <input name="phone" type="tel" maxLength={30} placeholder="WhatsApp number (optional)" aria-label="WhatsApp number (optional)" className={`w-full rounded-lg border border-stone-300 ${compact ? "p-2 text-xs" : "p-3"}`} />
            <p className="mt-1 text-[10px] text-stone-500">Include country code so the shop can reply on WhatsApp.</p>
          </div>
          <textarea name="message" required minLength={3} maxLength={2000} placeholder="What would you like to know?" rows={compact ? 3 : 4} className={`w-full rounded-lg border border-stone-300 ${compact ? "p-2 text-xs" : "p-3"}`} />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="text-sm text-green-800">{message}</p>}
          <button disabled={busy} className={compact ? "rounded-lg bg-amber-800 px-3 py-2 text-xs font-medium text-white hover:bg-amber-900 disabled:opacity-50" : "rounded-lg bg-amber-800 px-5 py-3 font-medium text-white hover:bg-amber-900 disabled:opacity-50"}>{busy ? "Sending…" : "Send enquiry"}</button>
        </form>
      )}
    </div>
  );
}
