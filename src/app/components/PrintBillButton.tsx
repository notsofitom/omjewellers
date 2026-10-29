"use client";

export default function PrintBillButton() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 print:hidden">
      Print bill
    </button>
  );
}
