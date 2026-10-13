const test = require("node:test");
const assert = require("node:assert/strict");

const { envNumber } = require("./helpers");

/**
 * Tests for envNumber.
 *
 * The reason this helper exists is the `Number(env) || fallback` trap: it makes
 * a documented "0 disables" setting silently unusable because 0 is falsy. These
 * cases pin down that 0 wins, that a missing/blank value falls back, and that a
 * typo does not turn into NaN.
 */

const withEnv = (value, run) => {
    const previous = process.env.TEST_ENV_NUMBER;

    if (value === undefined) {
        delete process.env.TEST_ENV_NUMBER;
    } else {
        process.env.TEST_ENV_NUMBER = value;
    }

    try {
        run();
    } finally {
        if (previous === undefined) {
            delete process.env.TEST_ENV_NUMBER;
        } else {
            process.env.TEST_ENV_NUMBER = previous;
        }
    }
};

test("an explicit 0 is honoured rather than replaced by the fallback", () => {
    withEnv("0", () => {
        assert.equal(envNumber("TEST_ENV_NUMBER", 15), 0);
    });
});

test("a positive number wins over the fallback", () => {
    withEnv("42", () => {
        assert.equal(envNumber("TEST_ENV_NUMBER", 15), 42);
    });
});

test("an unset variable falls back", () => {
    withEnv(undefined, () => {
        assert.equal(envNumber("TEST_ENV_NUMBER", 15), 15);
    });
});

test("a blank value falls back", () => {
    withEnv("", () => {
        assert.equal(envNumber("TEST_ENV_NUMBER", 15), 15);
    });
});

test("a non-numeric value falls back instead of producing NaN", () => {
    withEnv("soon", () => {
        const value = envNumber("TEST_ENV_NUMBER", 15);

        assert.equal(value, 15);
        assert.equal(Number.isNaN(value), false);
    });
});

test("a negative value is passed through, not coerced to the fallback", () => {
    withEnv("-3", () => {
        assert.equal(envNumber("TEST_ENV_NUMBER", 15), -3);
    });
});
