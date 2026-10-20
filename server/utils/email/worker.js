// Background drainer for the email outbox.
//
// Runs one pass shortly after boot (so mail queued during a restart goes out)
// and then on an interval. Overlapping runs are suppressed with a simple local
// flag; the outbox's conditional claim already prevents double-sends across
// processes, so this only avoids needless duplicate work in one process.
//
// Interval of 0 disables the worker, matching the scheduler/cleanup convention.

const { processOutbox, DEFAULT_BATCH_SIZE } = require("./outbox");
const { envNumber } = require("../helpers");

const DEFAULT_INTERVAL_SECONDS = 60;
const FIRST_RUN_DELAY_MS = 15 * 1000;

let running = false;

const runOnce = async ({ batchSize = DEFAULT_BATCH_SIZE } = {}) => {
    if (running) {
        return null;
    }

    running = true;

    try {
        const summary = await processOutbox({ limit: batchSize });

        if (summary.sent || summary.retried || summary.failed) {
            console.log(
                `[email] claimed=${summary.claimed} sent=${summary.sent} ` +
                `retried=${summary.retried} failed=${summary.failed}`
            );
        }

        return summary;
    } catch (error) {
        console.error("[email] worker run failed:", error.message);

        return null;
    } finally {
        running = false;
    }
};

const startEmailWorker = (
    intervalSeconds = envNumber(
        "EMAIL_WORKER_INTERVAL_SECONDS",
        DEFAULT_INTERVAL_SECONDS
    ),
    batchSize = envNumber("EMAIL_BATCH_SIZE", DEFAULT_BATCH_SIZE)
) => {
    if (intervalSeconds <= 0) {
        return null;
    }

    const job = () => runOnce({ batchSize });

    const first = setTimeout(job, FIRST_RUN_DELAY_MS);
    first.unref();

    const timer = setInterval(job, intervalSeconds * 1000);
    timer.unref();

    return timer;
};

module.exports = {
    startEmailWorker,
    runOnce
};
