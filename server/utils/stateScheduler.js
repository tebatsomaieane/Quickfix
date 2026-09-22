const db = require("../config/db");


const DEFAULT_INTERVAL_MINUTES = 15;


// Flip offers, advertisements and promotions into their EXPIRED state once
// their validity window has passed. Idempotent and safe to re-run.
const runExpiryPass = async () => {
    const results = { offers: 0, advertisements: 0, promotions: 0 };

    // Offers that were not accepted before their expiry time.
    const [offerResult] = await db.query(
        `UPDATE offers
         SET status = 'EXPIRED', updated_at = NOW()
         WHERE status = 'PENDING'
           AND valid_until IS NOT NULL
           AND valid_until < NOW()`
    );
    results.offers = offerResult.affectedRows;

    // Advertisements and promotions whose campaign window has ended.
    const [adResult] = await db.query(
        `UPDATE advertisements
         SET status = 'EXPIRED', updated_at = NOW()
         WHERE status IN ('PENDING', 'ACTIVE', 'PAUSED')
           AND end_date < CURDATE()`
    );
    results.advertisements = adResult.affectedRows;

    const [promoResult] = await db.query(
        `UPDATE promotions
         SET status = 'EXPIRED', updated_at = NOW()
         WHERE status IN ('PENDING', 'ACTIVE', 'PAUSED')
           AND end_date < CURDATE()`
    );
    results.promotions = promoResult.affectedRows;

    if (results.offers + results.advertisements + results.promotions > 0) {
        console.log(
            `[scheduler] Expired: offers=${results.offers}, advertisements=${results.advertisements}, promotions=${results.promotions}`
        );
    }

    return results;
};


// Re-open requests that were stuck in 'OPEN'/'OFFERS_RECEIVED' long past
// their preferred date with no hired provider. Keeps the marketplace from
// accumulating dead requests.
const closeStaleRequests = async (maxDays = 14) => {
    const [result] = await db.query(
        `UPDATE service_requests
         SET status = 'CANCELLED', updated_at = NOW()
         WHERE status IN ('OPEN', 'OFFERS_RECEIVED')
           AND preferred_date IS NOT NULL
           AND preferred_date < DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
        [maxDays]
    );

    if (result.affectedRows > 0) {
        console.log(
            `[scheduler] Closed ${result.affectedRows} stale request(s)`
        );
    }

    return result.affectedRows;
};


// Start the background job. Returns the timer (for tests / manual stop).
const startScheduler = (intervalMinutes = DEFAULT_INTERVAL_MINUTES) => {
    if (intervalMinutes <= 0) {
        return null;
    }

    const job = async () => {
        try {
            await runExpiryPass();
            await closeStaleRequests();
        } catch (error) {
            console.error("[scheduler] Job failed:", error.message);
        }
    };

    // Run once shortly after boot, then on the configured interval.
    const first = setTimeout(job, 30 * 1000);
    first.unref();

    const timer = setInterval(job, intervalMinutes * 60 * 1000);
    timer.unref();

    return timer;
};


module.exports = {
    runExpiryPass,
    closeStaleRequests,
    startScheduler
};