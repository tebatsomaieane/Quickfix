/**
 * Small, dependency-free form validation.
 *
 * The API already validates registration input, but it answers with a single
 * flat message ("Please provide a valid email address") that the form can only
 * render as a banner at the top. That leaves a user with three empty-looking
 * fields and no idea which one to fix, especially on mobile where the banner
 * can sit off-screen.
 *
 * These rules mirror the server's contract exactly (see the register endpoint:
 * required names/phone, RFC-ish email, an 8+ character password with a letter
 * and a number) so that a correct form never round-trips to learn what was
 * wrong, and every message lands on the field that caused it.
 *
 * Deliberately hand-rolled: this app has no schema library, and pulling one in
 * for six rules would be the larger risk.
 */

// Intentionally permissive. RFC 5322 is unusable in practice (it rejects valid
// addresses), so this is the pragmatic subset: a local part, a single @, and a
// dotted domain with a 2+ character TLD. It rejects the mistakes people
// actually make -- typos like "gmail.con" or a missing @.
const EMAIL =
    /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/;

// Letters (incl. accented), spaces, apostrophes, hyphens and periods. Rejects
// digits and symbols, which are never legitimate in a person's name field.
const NAME = /^[\p{L}][\p{L}\s'’.-]*$/u;

// Phone fields here accept the formats people actually type: spaces, dashes,
// brackets and a country prefix. Only the digit count is enforced, so nobody
// is blocked by a formatting choice we did not anticipate.
const PHONE_ALLOWED = /^[0-9+()\s-]+$/;

export const messages = {
    required: (label) => `${label} is required`,
    email: "Enter a valid email address",
    phone: "Enter a valid phone number",
    minLength: (n) => `Must be at least ${n} characters`,
    maxLength: (n) => `Must be ${n} characters or fewer`,
    digits: (n) => `Must be exactly ${n} digits`,
    name: "Use letters, spaces, hyphens or apostrophes only",
    passwordMatch: "Passwords do not match",
    passwordWeak: "Use at least 8 characters with a letter and a number"
};

/** True when a value counts as "provided" for a required check. */
const isBlank = (value) =>
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "");

const isEmail = (value) => EMAIL.test(String(value).trim());

const isName = (value) => NAME.test(String(value).trim());

const isPhone = (value) => {
    const raw = String(value).trim();

    if (!PHONE_ALLOWED.test(raw)) {
        return false;
    }

    // Count digits only: spacing and a + prefix are free.
    const digits = raw.replace(/\D/g, "");

    return digits.length >= 7 && digits.length <= 15;
};

const isStrongEnough = (value) => {
    const raw = String(value);

    return raw.length >= 8 && /[A-Za-z]/.test(raw) && /\d/.test(raw);
};

// Kept in step with COMMON_PASSWORDS in server/validators/rules.js: entries
// that would already fail the 8+ letter-and-digit check are pointless here,
// so only plausible-but-guessable passwords are listed.
const COMMON_PASSWORDS = new Set([
    "password1", "password12", "password123", "password1234",
    "password12345", "passw0rd1", "p@ssw0rd1", "qwerty123",
    "qwerty1234", "qwerty12345", "12345678", "123456789", "1234567890",
    "abc12345", "abcd1234", "abc123456", "letmein1", "letmein123",
    "welcome123", "welcome1234", "admin1234", "admin12345", "iloveyou1",
    "monkey123", "dragon123", "sunshine1", "princess1", "trustno1",
    "football1", "baseball1", "superman1", "starwars1", "whatever1",
    "master123", "shadow123", "michael1", "jennifer1", "jordan123",
    "harley123", "ranger123", "buster123", "thomas123", "robert123",
    "soccer123", "batman123", "andrew123", "test1234", "demo1234",
    "sample123", "change123", "changeme1", "secret123", "summer123",
    "winter123", "freedom123", "liverpool1", "arsenal123", "chelsea123",
    "1qaz2wsx", "q1w2e3r4", "1q2w3e4r", "asdfgh123", "qazwsx123"
]);

/**
 * Rule definitions. Each returns an error string, or null when the value passes.
 * `label` is only used to phrase "required", so it can be omitted for fields
 * whose required message is already covered by a more specific rule.
 */
export const rules = {
    required:
        (label = "This field") =>
        (value) =>
            isBlank(value) ? messages.required(label) : null,

    minLength:
        (n, message) =>
        (value) =>
            isBlank(value) || String(value).length >= n
                ? null
                : message || messages.minLength(n),

    maxLength:
        (n, message) =>
        (value) =>
            String(value ?? "").length <= n
                ? null
                : message || messages.maxLength(n),

    email:
        (_label, message) =>
        (value) =>
            isBlank(value) || isEmail(value)
                ? null
                : message || messages.email,

    phone:
        (_label, message) =>
        (value) =>
            isBlank(value) || isPhone(value)
                ? null
                : message || messages.phone,

    name:
        (_label, message) =>
        (value) =>
            isBlank(value) || isName(value)
                ? null
                : message || messages.name,

    digits:
        (n, message) =>
        (value) =>
            isBlank(value) ||
            new RegExp(`^\\d{${n}}$`).test(String(value).trim())
                ? null
                : message || messages.digits(n),

    /**
     * Cross-field rule. `other` is the name of the field to compare against,
     * resolved from the values object rather than captured at definition time
     * so it always sees current data.
     */
    matches:
        (other, message) =>
        (value, values) =>
            isBlank(value) || value === values?.[other]
                ? null
                : message || messages.passwordMatch,

    strongPassword:
        (_label, message) =>
        (value) =>
            isBlank(value) || isStrongEnough(value)
                ? null
                : message || messages.passwordWeak,

    /**
     * Registration only, mirrored from the server's `passwordExcludesIdentity`:
     * a password that repeats the account's own details, or that sits on the
     * common-guess list, is rejected on the form rather than on a round-trip.
     */
    passwordExcludesIdentity:
        (_label, message) =>
        (value, values) => {
            if (isBlank(value)) {
                return null;
            }

            const password = String(value).toLowerCase();

            if (COMMON_PASSWORDS.has(password)) {
                return (
                    message ||
                    "That is one of the most commonly used passwords. Please choose a different one."
                );
            }

            // Same floor as the server: fragments under three characters would
            // flag almost any password that merely contains those letters.
            const identity = [
                String(values?.email || "").trim().split("@")[0],
                String(values?.first_name || ""),
                String(values?.last_name || "")
            ]
                .map((part) => part.trim().toLowerCase())
                .filter((part) => part.length >= 3);

            if (identity.some((part) => password.includes(part))) {
                return (
                    message || "Password must not contain your name or email address"
                );
            }

            return null;
        },

    /**
     * Numeric field with optional bounds. Blank is left alone so an optional
     * number is not forced on the user, and a non-numeric value is caught here
     * rather than arriving at the API as NaN.
     */
    number:
        ({ min, max, label = "This field", integer = false, message } = {}) =>
        (value) => {
            if (isBlank(value)) {
                return null;
            }

            const parsed = Number(value);

            if (!Number.isFinite(parsed)) {
                return message || `${label} must be a number`;
            }

            if (integer && !Number.isInteger(parsed)) {
                return message || `${label} must be a whole number`;
            }

            if (min !== undefined && parsed < min) {
                return message || `${label} cannot be less than ${min}`;
            }

            if (max !== undefined && parsed > max) {
                return message || `${label} cannot be more than ${max}`;
            }

            return null;
        },

    /**
     * Cross-field comparison against another field's value, e.g. an end date
     * that must fall on or after a start date.
     */
    afterOrEqual:
        (other, label = "This field", message) =>
        (value, values) => {
            if (isBlank(value) || isBlank(values?.[other])) {
                return null;
            }

            return String(value) >= String(values[other])
                ? null
                : message || `${label} must be on or after ${other.replace(/_/g, " ")}`;
        },

    /** Blocks dates that have already passed. */
    notPast:
        (label = "Date", message) =>
        (value) => {
            if (isBlank(value)) {
                return null;
            }

            // Compared as plain calendar strings so a timezone difference can
            // never shift the day.
            return String(value) >= todayAsString()
                ? null
                : message || `${label} cannot be in the past`;
        }
};

/** Local calendar date as YYYY-MM-DD, avoiding UTC's day shift. */
export function todayAsString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/**
 * @param {Record<string, object>} values
 * @param {Record<string, ((value: any, values: any) => string|null)[]>} schema
 *        field name -> ordered rule list
 * @returns {Record<string, string>} field name -> first failing message
 */
export function validate(values = {}, schema = {}) {
    const errors = {};

    for (const [field, fieldRules] of Object.entries(schema)) {
        const value = values[field];

        for (const rule of fieldRules) {
            const message = rule(value, values);

            if (message) {
                errors[field] = message;
                break;
            }
        }
    }

    return errors;
}

/**
 * Default vocabulary: the field names the account endpoints use, plus the
 * everyday phrasings a person would use for them. The API phrases validation
 * messages in prose ("First name, last name and phone number are required")
 * rather than naming columns, so each entry carries the words to look for.
 */
export const DEFAULT_FIELDS = [
    { name: "email", label: "Email address", aliases: ["email", "e-mail"] },
    {
        name: "first_name",
        label: "First name",
        aliases: ["first name", "firstname"]
    },
    {
        name: "last_name",
        label: "Last name",
        aliases: ["last name", "lastname", "surname"]
    },
    { name: "phone", label: "Phone number", aliases: ["phone", "mobile", "contact number"] },
    { name: "password", label: "Password", aliases: ["password"] },
    { name: "new_password", label: "New password", aliases: ["new password"] },
    {
        name: "current_password",
        label: "Current password",
        aliases: ["current password", "old password"]
    },
    { name: "confirm_password", label: "Password confirmation", aliases: ["confirmation", "confirm password", "password confirmation"] },
    { name: "pin", label: "Verification code", aliases: ["pin", "code"] },
    { name: "token", label: "Reset code", aliases: ["token", "reset code"] },
    {
        name: "name",
        label: "Name",
        aliases: ["name", "title", "product name", "business name"]
    },
    {
        name: "description",
        label: "Description",
        aliases: ["description", "details"]
    },
    { name: "price", label: "Price", aliases: ["price", "amount", "cost"] },
    {
        name: "location",
        label: "Location",
        aliases: ["location", "address"]
    },
    {
        name: "service",
        label: "Service",
        aliases: ["service", "category"]
    }
];

const DUPLICATE_HINTS = [
    "already exists",
    "already registered",
    "already in use",
    "already taken",
    "is taken",
    "duplicate"
];

/**
 * Reads the API's structured rejection map, when there is one.
 *
 * Validation failures are reported as `{ message, errors: { field: message } }`.
 * When the server names the field, that is strictly better evidence than
 * anything inferred from prose, so it is taken first and the message-guessing
 * below never runs. `form` is the API's own key for a problem that belongs to
 * the form as a whole rather than to any single input.
 *
 * @returns {Record<string, string>|null} `null` when the body carries no map.
 */
function structuredFieldErrors(body) {
    const errors = body?.errors;

    if (!errors || typeof errors !== "object" || Array.isArray(errors)) {
        return null;
    }

    const mapped = {};

    for (const [field, message] of Object.entries(errors)) {
        if (typeof message === "string" && message.trim()) {
            mapped[field] = message.trim();
        }
    }

    // An empty or entirely non-string map carries no more information than
    // having sent nothing, so fall through to the prose path rather than
    // reporting a rejection the user can see nowhere.
    return Object.keys(mapped).length > 0 ? mapped : null;
}

/**
 * Maps a server rejection onto individual fields.
 *
 * The API answers with a structured `errors` map, which is used directly. Older
 * and non-validation failures answer with a single flat sentence, so the field
 * it was complaining about is recovered by looking for that field's name or a
 * synonym in the message. That fallback is data-driven rather than a list of
 * hardcoded account cases, because the same API pattern is used by every other
 * endpoint: a duplicate product name must land on the product's name field, not
 * on an `email` field that form does not even have.
 *
 * When nothing recognisable is mentioned, the message is returned as `form` and
 * rendered as a banner. Guessing would place an error on an input the user
 * never got wrong, which is worse than a banner.
 *
 * @param {object} response Axios error, response body, or `{ message }`
 * @param {object} [options]
 * @param {Array<{name: string, label: string, aliases?: string[]}>} [options.fields]
 *        Vocabulary to match against. Defaults to {@link DEFAULT_FIELDS}.
 * @returns {Record<string, string>} field errors, or `{ form }` for a banner
 */
export function fieldErrorsFromResponse(response, options = {}) {
    // Accepts a raw Axios error, the `data` body it carries, or a plain
    // `{ message }` object, because callers reach for whichever they have to
    // hand.
    const body = response?.response?.data ?? response?.data ?? response;
    const raw = body?.message || response?.message || "";

    // The server already said which field is wrong. Do not second-guess it.
    const structured = structuredFieldErrors(body);

    if (structured) {
        return structured;
    }

    const message = raw.toLowerCase();

    if (!message) {
        return {};
    }

    const fields = options.fields || DEFAULT_FIELDS;

    const mentioned = fields
        .map((field) => ({
            field,
            // Keep the longest matching alias per field: it is the most
            // specific evidence that the field is the one being discussed.
            alias: [...(field.aliases || []), field.label.toLowerCase()]
                .filter(Boolean)
                .filter((alias) => message.includes(alias))
                .sort((a, b) => b.length - a.length)[0]
        }))
        .filter((entry) => entry.alias);

    if (mentioned.length === 0) {
        return { form: raw };
    }

    const isDuplicate = DUPLICATE_HINTS.some((hint) => message.includes(hint));
    const isMissing =
        message.includes("required") || message.includes("provide all");

    // The API reports several missing inputs in one sentence ("First name,
    // last name and phone number are required"), so a "required" complaint is
    // always about every field it names. Any other complaint is about a single
    // field, and the longest match is the most specific one.
    const targets =
        isMissing || isDuplicate
            ? mentioned
            : mentioned.filter(
                  (entry) => entry.alias.length === mentioned[0].alias.length
              );

    // Drop a field whose match is contained in another field's match, so
    // "First name is required" does not also light up a generic `name` field
    // that merely shares a word.
    const kept = targets.filter(
        (entry) =>
            !targets.some(
                (other) =>
                    other !== entry &&
                    other.alias.length > entry.alias.length &&
                    other.alias.includes(entry.alias)
            )
    );

    const mapped = {};

    for (const { field } of kept) {
        if (isDuplicate) {
            mapped[field.name] = `${field.label} is already in use`;
        } else if (isMissing) {
            mapped[field.name] = messages.required(field.label);
        } else {
            // Keep the server's own wording when it is specific enough to be
            // actionable on its own.
            mapped[field.name] = raw;
        }
    }

    return mapped;
}
