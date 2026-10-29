import { prisma } from "@/lib/prisma";

const PURITY_ORDER = ["24K", "22K", "20K", "18K", "9K"] as const;

export type ConfiguredMetalRates = {
  currency: "INR";
  unit: "gram";
  rates: { purity: string; ratePerGram: number }[];
  silverPerGram: number | null;
  updatedAt: string | null;
  source: "Owner-set reference rates";
};

export async function getConfiguredMetalRates(): Promise<ConfiguredMetalRates> {
  const savedRates = await prisma.manualMetalRate.findMany({
    orderBy: { updatedAt: "desc" },
    select: { purity: true, ratePerGram: true, updatedAt: true },
  });
  const byPurity = new Map(savedRates.map((item) => [item.purity, item]));
  return {
    currency: "INR",
    unit: "gram",
    rates: PURITY_ORDER.flatMap((purity) => {
      const saved = byPurity.get(purity);
      return saved ? [{ purity, ratePerGram: saved.ratePerGram }] : [];
    }),
    silverPerGram: byPurity.get("Silver")?.ratePerGram ?? null,
    updatedAt: savedRates[0]?.updatedAt.toISOString() ?? null,
    source: "Owner-set reference rates",
  };
}
