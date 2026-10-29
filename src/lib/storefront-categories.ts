export const STOREFRONT_CATEGORIES = [
  { value: "CUBAN-BRACELETS", label: "Cuban bracelets" },
  { value: "CUBAN-BRACELETS-9K", label: "Cuban bracelets 9K" },
  { value: "dokiya-9k", label: "Dokiya 9K" },
  { value: "GENTS-BRACELETS-9K", label: "Gents bracelets 9K" },
  { value: "GENTS-CHAINS", label: "Gents chains" },
  { value: "GOD-PENDANTS", label: "God pendants" },
  { value: "LADIES-CHAINS9K", label: "Ladies chains 9K" },
  { value: "PENDANT-SETS-CZ", label: "Pendant sets CZ" },
] as const;

export function getCategoryLabel(category: string) {
  return (
    STOREFRONT_CATEGORIES.find((item) => item.value === category)?.label ??
    category.replaceAll("-", " ").replace(/\b\w/g, (character) => character.toUpperCase())
  );
}
