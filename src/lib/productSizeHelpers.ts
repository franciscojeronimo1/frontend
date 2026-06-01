import { Product, ProductPrice } from "@/lib/types";

export function sortProductPrices(prices: ProductPrice[]): ProductPrice[] {
    return [...prices].sort((a, b) => (a.size.order ?? 0) - (b.size.order ?? 0));
}

/** Tamanho padrão: M se existir, senão o do meio da lista ordenada */
export function getDefaultSizeId(product: Product): string | null {
    if (!product.has_sizes || !product.prices?.length) return null;

    const sorted = sortProductPrices(product.prices);
    const medium = sorted.find((p) => p.size.name === "M");
    if (medium) return medium.size.id;

    const mid = Math.floor(sorted.length / 2);
    return sorted[mid]?.size.id ?? sorted[0]?.size.id ?? null;
}
