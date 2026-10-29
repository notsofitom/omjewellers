import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import PrintBillButton from "@/app/components/PrintBillButton";
import { SHOP_NAME } from "@/lib/shop-details";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: `Online bill · ${SHOP_NAME}`,
  robots: { index: false, follow: false },
};

type BillItem = {
  description: string;
  weight: number;
  metalAmount: number;
  labourCharge: number;
  lineTotal: number;
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function OnlineBillPage({ params }: { params: Promise<{ shareToken: string }> }) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-stone-100 px-4 py-8 text-center text-stone-600">Loading your bill…</main>}>
      <OnlineBillContent params={params} />
    </Suspense>
  );
}

async function OnlineBillContent({ params }: { params: Promise<{ shareToken: string }> }) {
  await connection();
  const { shareToken } = await params;
  const bill = await prisma.bill.findUnique({ where: { shareToken } });
  if (!bill) notFound();

  let items: BillItem[];
  try {
    items = JSON.parse(bill.itemsJson) as BillItem[];
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-9 print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-900">Tax invoice</p>
            <h1 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">{SHOP_NAME}</h1>
            {bill.gstNumber && <p className="mt-2 text-sm text-stone-600">GSTIN: {bill.gstNumber}</p>}
          </div>
          <PrintBillButton />
        </div>

        <div className="grid gap-5 border-b border-stone-200 py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-500">Bill to</p>
            <p className="mt-1 font-medium">{bill.customerName}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wide text-stone-500">Bill number</p>
            <p className="mt-1 font-semibold">{bill.billNumber}</p>
            <p className="mt-1 text-sm text-stone-600">{new Date(bill.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</p>
          </div>
        </div>

        <div className="overflow-x-auto py-5">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 text-left text-xs uppercase tracking-wide text-stone-500">
                <th className="py-3 pr-3">Item</th>
                <th className="px-3 py-3 text-right">Weight</th>
                <th className="px-3 py-3 text-right">Value</th>
                <th className="px-3 py-3 text-right">Labour</th>
                <th className="py-3 pl-3 text-right">Before GST</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={`${item.description}-${index}`} className="border-b border-stone-100 align-top">
                  <td className="py-3 pr-3 font-medium">{item.description}</td>
                  <td className="px-3 py-3 text-right">{item.weight > 0 ? `${item.weight} g` : "—"}</td>
                  <td className="px-3 py-3 text-right">{money.format(item.metalAmount)}</td>
                  <td className="px-3 py-3 text-right">{money.format(item.labourCharge)}</td>
                  <td className="py-3 pl-3 text-right font-medium">{money.format(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto max-w-sm border-t border-stone-200 pt-4 text-sm">
          <div className="flex justify-between gap-4 py-1"><span>Subtotal before GST</span><span>{money.format(bill.subtotal)}</span></div>
          <div className="flex justify-between gap-4 py-1"><span>CGST · 1.5%</span><span>{money.format(bill.cgst)}</span></div>
          <div className="flex justify-between gap-4 py-1"><span>SGST · 1.5%</span><span>{money.format(bill.sgst)}</span></div>
          <div className="mt-2 flex justify-between gap-4 border-t border-stone-200 pt-3 text-base font-bold"><span>Total including GST</span><span>{money.format(bill.total)}</span></div>
          <p className="mt-2 text-right text-xs text-stone-500">Total GST: 3% of subtotal</p>
        </div>

        <div className="mt-8 rounded-xl bg-amber-50 p-4 text-center text-sm leading-6 text-stone-700">
          Thank you for choosing {SHOP_NAME}. We hope you love your purchase and would be happy to hear your feedback.
        </div>
        <p className="mt-5 text-center text-xs text-stone-500">This online bill was issued by {SHOP_NAME}.</p>
      </article>
    </main>
  );
}
