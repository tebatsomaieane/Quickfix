/**
 * Checks for the shared error-message layer.
 *
 * The failure mode this guards against is specific and expensive: a user
 * reading "Failed to update provider_services" or "ECONNREFUSED" and learning
 * nothing. These assertions pin the mapping from transport-level failures to
 * something a person can act on, and confirm nothing internal leaks through.
 */

let failures = 0;
let checks = 0;

const check = (name, condition) => {
    checks += 1;

    if (condition) {
        console.log(`  PASS  ${name}`);
    } else {
        failures += 1;
        console.log(`  FAIL  ${name}`);
    }
};

const { describeError, errorToast } = await import(
    new URL("../src/lib/errorMessages.js", import.meta.url).href
);

const axiosError = (status, message) => ({
    response: { status, data: message ? { message } : {} }
});

const run = () => {
    console.log("error message mapping");

    // --- offline ------------------------------------------------------------
    const offline = describeError(new Error("Network Error"), {
        // Simulate a disconnected device.
        isOffline: true
    });

    check(
        "a network failure is described in plain language",
        offline.title === "Can't reach QuickFix"
    );
    check(
        "a network failure reassures that nothing was lost",
        /nothing was lost|still here/i.test(offline.detail)
    );
    check("a network failure is marked retryable", offline.retryable === true);
    check(
        "the raw transport error never reaches the user",
        !/ECONNREFUSED|Network Error/i.test(`${offline.title} ${offline.detail}`)
    );

    // --- server status codes ------------------------------------------------
    console.log("\nstatus codes");

    for (const status of [500, 502, 503]) {
        const described = describeError(axiosError(status, "Internal server error: db failure on users table"));

        check(
            `${status} produces a reassuring message`,
            /went wrong|unavailable|maintenance/i.test(described.title)
        );
        check(
            `${status} does not leak the server's internal text`,
            !/users table|db failure|Internal server error/i.test(
                `${described.title} ${described.detail}`
            )
        );
        check(`${status} is retryable`, described.retryable === true);
    }

    const forbidden = describeError(axiosError(403, "Not authorised"));

    check(
        "a 403 explains the permission problem",
        /don't have access|permission/i.test(forbidden.title)
    );
    check("a 403 is not offered as retryable", forbidden.retryable === false);

    const missing = describeError(axiosError(404));

    check("a 404 says what happened", /couldn't find/i.test(missing.title));

    const rate = describeError(axiosError(429, "Too many requests"));

    check(
        "a 429 tells the user to wait",
        /wait/i.test(`${rate.title} ${rate.detail}`)
    );

    // A 401 on an auth endpoint is the common case: the session header says
    // "expired", but a failed sign-in must instead name the credentials.
    const expired = describeError(axiosError(401, "jwt expired"));

    check(
        "a 401 says the session expired",
        /session has expired/i.test(expired.title)
    );

    const wrongPassword = describeError(
        axiosError(401, "Invalid email or password")
    );

    check(
        "wrong credentials name the likely cause",
        /email or password/i.test(wrongPassword.title)
    );

    // --- validation ---------------------------------------------------------
    console.log("\nvalidation rejections");

    // 400/422 messages are rendered on the field itself, so describeError must
    // not also produce a headline banner saying the same thing.
    const invalid = describeError(axiosError(400, "Please provide a valid email address"));

    check("a 400 has no redundant headline", invalid.title === "");
    check(
        "a 400 keeps the server's field-level reason",
        invalid.detail === "Please provide a valid email address"
    );
    check("a 400 is not marked retryable", invalid.retryable === false);

    const unprocessable = describeError(axiosError(422, "Title must be 200 characters or fewer"));

    check("a 422 is treated as a field error", unprocessable.title === "");

    // --- auth ---------------------------------------------------------------
    console.log("\nauthentication");

    const badCredentials = describeError(
        axiosError(401, "Invalid email or password")
    );

    check(
        "wrong credentials name the likely cause",
        /email or password/i.test(badCredentials.title)
    );
    check(
        "wrong credentials do not reveal which field was wrong",
        !/email is wrong|password is wrong|no such user|not found/i.test(
            badCredentials.title
        )
    );

    // --- unknown ------------------------------------------------------------
    console.log("\nunknown failures");

    const unknownStatus = describeError(axiosError(418, "I am a teapot"));

    check(
        "an unmapped status falls back to a safe message",
        /something went wrong|try again/i.test(unknownStatus.title)
    );
    check(
        "an unmapped status is not shown raw",
        !/teapot|418/.test(unknownStatus.title)
    );

    const nothing = describeError({});

    check("a missing error object still yields a message", Boolean(nothing.title));
    check(
        "a missing error object does not produce an empty message",
        nothing.title.length > 0
    );

    // --- toast shape --------------------------------------------------------
    console.log("\ntoast payloads");

    const retryable = errorToast(new Error("Network Error"), {
        retry: () => {}
    });

    check(
        "a retryable failure offers a retry action",
        retryable.action?.label === "Try again"
    );
    check("the retry action is a function", typeof retryable.action?.onClick === "function");

    const permanent = errorToast(axiosError(403, "Not allowed"));

    check(
        "a permanent failure offers no pointless retry",
        permanent.action === undefined
    );

    const validationToast = errorToast(axiosError(400, "Invalid email"));

    check(
        "a validation failure produces no retry",
        validationToast.action === undefined
    );

    console.log(`\n${checks - failures}/${checks} checks passed`);

    return failures;
};

process.exit(run() === 0 ? 0 : 1);
