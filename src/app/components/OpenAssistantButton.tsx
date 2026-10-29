"use client";

export default function OpenAssistantButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("omjewellers:open-assistant"))}
      className="mt-5 inline-flex items-center rounded-lg bg-amber-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-900"
    >
      Open jewellery assistant →
    </button>
  );
}
