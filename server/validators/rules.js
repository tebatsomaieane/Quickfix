// Validation rules for request bodies.
//
// Hand-rolled for the same reason as the client's `lib/validation.js`: the rule
// set is small, the messages have to read like a person wrote them, and the
// whole thing has to stay in step with the browser-side copy. A schema library
// would not remove the work of writing those messages, only the plumbing.
//
// Every rule receives the *whole* value set so cross-field checks (`matches`,
// `afterOrEqual`, `oneOfUnequal`) work without a second pass.
//
// A rule is a function returning either `undefined` (valid) or a string (the
// problem). That keeps custom rules -- the `fn` escape hatch -- identical in
// shape to the built-ins, so a schema can mix them freely.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Letters (any script), spaces, apostrophes, hyphens and periods. No digits:
// a name field is not a free-for-all, and rejecting "John2" here gives a clear
// message instead of storing a typo nobody can undo later.
const NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]*$/u;

const PHONE_PATTERN = /^[0-9+()\s-]+$/;

const OTP_PATTERN = /^\d{6}$/;

const HEX_TOKEN_PATTERN = /^[a-f0-9]{64}$/;

const MAX_STRING = 5000;

const isBlank = (value) =>
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "");

/**
 * Trim a value to a string for validation purposes without ever throwing on
 * objects or arrays. A body field is attacker-controlled, so `String(value)`
 * on an object would otherwise produce "[object Object]" and pass a length
 * check that was meant to reject it.
 */
const asString = (value) => {
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    return "";
};

const asNumber = (value) => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") {
        return Number(value);
    }
    return Number.NaN;
};

// The `label` argument is part of the message, so each rule composes its own
// rather than reading a shared vocabulary. These helpers keep the wording
// identical between the two halves of the app.
const messages = {    required: (label) => `${label} is required`,
    email: () => "Please enter a valid email address",
    phone: () => "Please enter a valid phone number",
    name: (label) =>
        `${label} can only contain letters, spaces, apostrophes, hyphens and periods`,
    minLength: (label, n) => `${label} must be at least ${n} characters`,
    maxLength: (label, n) => `${label} must be ${n} characters or fewer`,
    digits: (label, n) => `${label} must be exactly ${n} digits`,
    number: (label, n) => `${label} must be a number`,
    integer: (label) => `${label} must be a whole number`,
    min: (label, n) => `${label} must be at least ${n}`,
    max: (label, n) => `${label} must be ${n} or less`,
    oneOf: (label, list) => `${label} must be one of: ${list.join(", ")}`,
    match: (label) => `${label} do not match`,
    different: (label) => `${label} must be different from the current one`,
    past: (label) => `${label} cannot be in the past`,
    order: (label) => `${label} must be on or after ${label.toLowerCase()}`,
    otp: (label) => `${label} must be 6 digits`,
    token: () => "This link is not valid. Please request a new one."
};

/**
 * Rules that imply a value normalisation.
 *
 * An email is compared with plain equality against a UNIQUE index rather than
 * `LOWER(email) = ?`, which is only correct because the stored value and the
 * compared value are both lowercase. Tying the normalisation to the email rule
 * itself means no endpoint can forget it: a field carrying `rules.email()` is
 * lowercased on the way in, so `WHERE email = ?` stays an index lookup and
 * `Alice@x.com` and `alice@x.com` can never become two accounts.
 */
const normalisesToLowercase = new WeakSet();

/**
 * Fields whose leading and trailing whitespace is significant, so `normalise`
 * must leave them exactly as they arrived.
 *
 * This is the password counterpart to `normalisesToLowercase`, and it exists
 * because trimming every string field quietly changed what a user set:
 * `"hunter2 "` and `"hunter2"` became the same password, so an attacker gained a
 * guess for free and a user who meant to include a trailing space could not
 * sign in. Silently rewriting a credential is worse than rejecting it.
 *
 * A one-time code is deliberately *not* in this set: nobody means a space in
 * ` 123456 `, and pasting one from an email or SMS is the common case, so those
 * are still trimmed.
 */
const preservesWhitespace = new WeakSet();

/**
 * Rule factories. Each returns `(values) => string | undefined`.
 *
 * Convention: a rule that is not the primary rule for a field treats "absent"
 * as "not my problem" and returns undefined, so `{ required, minLength }` is
 * the normal pairing -- an empty optional field does not also complain that it
 * is too short.
 */
const rules = {
    required(label = "This field") {
        return (values) =>
            isBlank(values.value) ? messages.required(label) : undefined;
    },

    // Present-and-non-empty check that keeps the raw value's type irrelevant.
    requiredIfPresent(label) {
        return (values) => {
            const value = values.value;

            if (value === undefined || value === null) return undefined;
            if (asString(value).trim() === "") {
                return messages.required(label);
            }

            return undefined;
        };
    },

    /**
     * Blank-tolerant, per the convention at the top of this file: an empty or
     * absent value is "not my problem" and `required`/`requiredIfPresent` is the
     * rule that decides whether that is acceptable.
     *
     * This matters for `businessProfile`, a partial update where `email: ""` is
     * how a business removes its contact address. Without the blank guard this
     * rule rejected that with "Please enter a valid email address", so the whole
     * endpoint returned 422 for any business without an email on file.
     *
     * `isBlank` rather than `!asString(value)`: a value that is present but not
     * a string (an object, say) is still a malformed input and must fail here,
     * where the message can name the field.
     */
    email() {
        const rule = (values) => {
            if (isBlank(values.value)) return undefined;

            return EMAIL_PATTERN.test(asString(values.value).trim())
                ? undefined
                : messages.email();
        };

        normalisesToLowercase.add(rule);

        return rule;
    },

    /** Blank-tolerant for the same reason as {@link rules.email}. */
    phone() {
        return (values) => {
            if (isBlank(values.value)) return undefined;

            const raw = asString(values.value).trim();
            const digits = raw.replace(/\D/g, "");

            if (!PHONE_PATTERN.test(raw) || digits.length < 7 || digits.length > 15) {
                return messages.phone();
            }

            return undefined;
        };
    },

    /** Blank-tolerant for the same reason as {@link rules.email}. */
    name(label = "This field") {
        return (values) => {
            if (isBlank(values.value)) return undefined;

            return NAME_PATTERN.test(asString(values.value).trim())
                ? undefined
                : messages.name(label);
        };
    },

    minLength(n, label = "This field") {
        return (values) => {
            if (isBlank(values.value)) return undefined;

            return asString(values.value).trim().length < n
                ? messages.minLength(label, n)
                : undefined;
        };
    },

    maxLength(n, label = "This field") {
        return (values) =>
            asString(values.value).length > n ? messages.maxLength(label, n) : undefined;
    },

    // A hard ceiling on any free-text field. Without it a single column can
    // carry a megabyte into a query and into a notification row.
    safeText(label = "This field") {
        return rules.maxLength(MAX_STRING, label);
    },

    digits(n, label = "This field") {
        return (values) => {
            if (isBlank(values.value)) return undefined;

            return new RegExp(`^\\d{${n}}$`).test(asString(values.value).trim())
                ? undefined
                : messages.digits(label, n);
        };
    },

    otp(label = "Verification code") {
        return (values) => {
            if (isBlank(values.value)) return undefined;

            return OTP_PATTERN.test(asString(values.value).trim())
                ? undefined
                : messages.otp(label);
        };
    },

    // Reset tokens are 32 random bytes rendered as hex, so anything that is not
    // 64 hex characters cannot match a stored row. Rejecting it here avoids a
    // pointless index probe and gives a clearer message than "link expired" for
    // what is really a mangled link.
    hexToken() {
        return (values) => {
            if (isBlank(values.value)) return undefined;

            return HEX_TOKEN_PATTERN.test(asString(values.value).trim().toLowerCase())
                ? undefined
                : messages.token();
        };
    },

    number({ min, max, integer, label = "This field", message } = {}) {
        return (values) => {
            if (isBlank(values.value)) return undefined;

            const parsed = asNumber(values.value);

            if (!Number.isFinite(parsed)) {
                return message || messages.number(label);
            }

            if (integer && !Number.isInteger(parsed)) {
                return message || messages.integer(label);
            }

            if (min !== undefined && parsed < min) {
                return message || messages.min(label, min);
            }

            if (max !== undefined && parsed > max) {
                return message || messages.max(label, max);
            }

            return undefined;
        };
    },

    /** Blank-tolerant for the same reason as {@link rules.email}. */
    boolean() {
        return (values) => {
            if (isBlank(values.value)) return undefined;

            return typeof values.value === "boolean" || values.value === 0 || values.value === 1
                ? undefined
                : "This value must be true or false";
        };
    },

    /**
     * A list field, bounded by length.
     *
     * Attachment arrays arrive as JSON arrays, and the `number` rule would
     * reject them as non-numeric -- so this is what any list-valued body field
     * uses instead. Each entry is left to the controller to validate, since
     * what counts as a valid entry is specific to the field.
     */
    array({ max = 20, min = 0, label = "This field" } = {}) {
        return (values) => {
            // Blank-tolerant per the convention at the top of this file: a form
            // that serialises an untouched checkbox or empty file input as ""
            // should mean "none", not "this must be a list".
            if (isBlank(values.value)) return undefined;

            if (!Array.isArray(values.value)) {
                return `${label} must be a list`;
            }

            if (values.value.length > max) {
                return `${label} cannot have more than ${max} items`;
            }

            if (values.value.length < min) {
                return `${label} needs at least ${min} item${min === 1 ? "" : "s"}`;
            }

            return undefined;
        };
    },

    // Only http(s). Rejecting `javascript:`, `data:` and `file:` here is the
    // point: these values are rendered as links, and a scheme the app never
    // needs is a way to smuggle script into a user's session.
    httpUrl(label = "Link") {
        return (values) => {
            if (isBlank(values.value)) return undefined;

            let parsed;

            try {
                parsed = new URL(asString(values.value).trim());
            } catch {
                return `${label} must be a valid web link`;
            }

            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                return `${label} must be a valid web link`;
            }

            return undefined;
        };
    },

    oneOf(list, label = "This field") {
        return (values) => {
            if (isBlank(values.value)) return undefined;

            return list.includes(values.value)
                ? undefined
                : messages.oneOf(label, list);
        };
    },

    matches(otherField, label = "The values") {
        return (values) =>
            asString(values.value) === asString(values[otherField])
                ? undefined
                : messages.match(label);
    },

    // Used to reject reusing the current password. Kept as a rule so the
    // comparison cannot be forgotten at a call site.
    differsFrom(otherField, label = "The new value") {
        return (values) =>
            asString(values.value) === asString(values[otherField])
                ? messages.different(label)
                : undefined;
    },

    // Date columns are stored as DATETIME; the client sends `YYYY-MM-DD`.
    // Comparing the ISO strings is equivalent to comparing the dates and
    // avoids timezone shifting a value across a day boundary.
    afterOrEqual(otherField, label = "The date") {
        return (values) => {
            const own = asString(values.value).trim();
            const other = asString(values[otherField]).trim();

            if (!own || !other) return undefined;

            return own < other
                ? `${label} must be on or after ${otherField.replace(/_/g, " ")}`
                : undefined;
        };
    },

    notPast(label = "The date") {
        return (values) => {
            const own = asString(values.value).trim();

            if (!own) return undefined;

            // Compare on the date part only: a request booked for today at
            // 09:00 is not "in the past" because 09:00 has not started yet.
            const today = new Date();
            const localToday = [
                today.getFullYear(),
                String(today.getMonth() + 1).padStart(2, "0"),
                String(today.getDate()).padStart(2, "0")
            ].join("-");

            return own < localToday ? messages.past(label) : undefined;
        };
    },

    /**
     * Escape hatch for rules that are specific to one endpoint (a cross-field
     * budget range, say). Kept in the same shape as the built-ins so it can sit
     * in the same array.
     */
    fn(check) {
        return check;
    }
};

/**
 * Password policy, in one place so registration, password change and password
 * reset cannot drift apart. The client enforces exactly this rule -- 8
 * characters with at least one letter and one number.
 */
const PASSWORD_MIN_LENGTH = 8;

const strongPassword = (label = "Password") => {
    const rule = rules.fn((values) => {
        if (isBlank(values.value)) return undefined;

        const value = asString(values.value);

        if (value.length < PASSWORD_MIN_LENGTH) {
            return messages.minLength(label, PASSWORD_MIN_LENGTH);
        }

        if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
            return `${label} must be at least ${PASSWORD_MIN_LENGTH} characters and include both a letter and a number`;
        }

        return undefined;
    });

    preservesWhitespace.add(rule);

    return rule;
};

module.exports = {
    rules,
    messages,
    isBlank,
    asString,
    asNumber,
    strongPassword,
    normalisesToLowercase,
    preservesWhitespace,
    PASSWORD_MIN_LENGTH,
    EMAIL_PATTERN,
    NAME_PATTERN,
    MAX_STRING
};
