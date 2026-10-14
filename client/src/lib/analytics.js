/**
 * Normalises the business analytics payload.
 *
 * The dashboard and the analytics page both read `products.total`,
 * `advertisements.active` and so on. A payload that omits one of those buckets
 * would otherwise throw on the first property access and blank the entire
 * screen, so every bucket is filled in here and the views can read them
 * directly.
 */
const EMPTY_BUCKET = { total: 0, active: 0, inactive: 0, pending: 0 };

export function normalizeAnalytics(data) {
    if (!data) {
        return null;
    }

    return {
        products: { ...EMPTY_BUCKET, ...(data.products || {}) },
        advertisements: { ...EMPTY_BUCKET, ...(data.advertisements || {}) },
        promotions: { ...EMPTY_BUCKET, ...(data.promotions || {}) },
        linkedProviders: data.linkedProviders ?? 0
    };
}
