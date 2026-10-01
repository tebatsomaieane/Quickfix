const { rules, isBlank, asString, normalisesToLowercase, preservesWhitespace } = require("./rules");

// A validation rejection is 422, not 400. The distinction matters to the client:
// 400/422 both mean "fix the form", but 422 is the honest code for "well-formed
// request, unacceptable content" and keeps genuine malformed-body 400s (bad
// JSON, wrong types) free to mean exactly that.
const VALIDATION_STATUS = 422;

/**
 * The shape every validation failure is reported in. The client's
 * `fieldErrorsFromResponse` reads `errors` first and only falls back to parsing
 * the prose when it is absent, so this map is the contract that lets an error
 * land on the exact input that caused it.
 */
const validationFailure = (errors, message) => ({
    success: false,
    message: message || "Please correct the highlighted fields and try again",
    errors
});

/**
 * Run a schema against a plain object.
 *
 * Rules are evaluated in declaration order and the first failure for a field
 * wins, so a schema can put `required` first and the more specific rules after
 * it -- an empty field then says "is required" instead of three things at once.
 *
 * @returns {Record<string, string>} Field -> message. Empty when valid.
 */
const runSchema = (values, schema) => {
    const errors = {};

    for (const [field, fieldRules] of Object.entries(schema)) {
        const context = { ...values, value: values[field] };

        for (const rule of fieldRules) {
            const failure = rule(context);

            if (failure) {
                errors[field] = failure;
                break;
            }
        }
    }

    return errors;
};

/**
 * Build the request body the controller will see.
 *
 * Only fields the schema declares survive. That allowlist is the point: without
 * it, `PATCH /profile` with `{ "role": "ADMIN" }` reaches the controller as
 * `req.body.role` and the safety of the SQL allowlist downstream is the only
 * thing standing between a user and their own privileges. It is cheaper and
 * much clearer to never hand the controller a key it did not ask for.
 */
const pickDeclared = (source, schema) => {
    const picked = {};

    for (const field of Object.keys(schema)) {
        if (source[field] !== undefined) {
            picked[field] = source[field];
        }
    }

    return picked;
};

/**
 * Trim the string fields a schema declares, and lowercase the ones carrying an
 * email rule.
 *
 * The database is `VARCHAR`, and MySQL in non-strict mode silently truncates
 * over-long values -- which used to mean a pasted paragraph became a truncated
 * one with no error. Length is now bounded by the schema; trimming here is
 * about stopping `"  John "` from being stored with its padding, and the
 * lowercase pass is what lets every email lookup stay an index lookup.
 */
const normalise = (picked, schema) => {
    const result = { ...picked };

    for (const [field, fieldRules] of Object.entries(schema)) {
        if (typeof result[field] !== "string") continue;

        // A password keeps its exact bytes: trimming one would silently change
        // what the user set, so `"hunter2 "` and `"hunter2"` would not be
        // different passwords. See `preservesWhitespace` in rules.js.
        if (fieldRules.some((rule) => preservesWhitespace.has(rule))) continue;

        const trimmed = result[field].trim();

        // Lowercasing an empty string is a no-op, so an optional field cleared
        // with "" needs no special case here.
        result[field] = fieldRules.some((rule) =>
            normalisesToLowercase.has(rule)
        )
            ? trimmed.toLowerCase()
            : trimmed;
    }

    return result;
};

/**
 * Express middleware factory.
 *
 * @param {Record<string, Function[]>} schema Field -> ordered rules.
 * @param {object} [options]
 * @param {boolean} [options.strip=true] Replace the body with only the declared
 *        fields. Leave `true` unless the endpoint genuinely reads extra keys,
 *        and if you must, read them from `req.validated` rather than `req.body`.
 * @param {string} [options.message] Override the summary `message`.
 * @param {string} [options.field] Name of the request property to validate
 *        (`body` by default; `params` for route parameters).
 * @param {Function} [options.refine] Extra check over the whole value set.
 *        Runs only once every field rule has passed, so it can rely on the
 *        per-field guarantees. Return a string to reject the request as a
 *        whole, or `{ field: message }` to reject against a specific input --
 *        which is what a cross-field rule needs, since the fix belongs in a
 *        field the user can actually edit. Return `undefined` to pass.
 */
const validate = (schema, options = {}) => {
    const {
        strip = true,
        message,
        field = "body",
        refine
    } = options;

    return (req, res, next) => {
        const source = req[field];

        // A missing or non-object body is a malformed request, not a validation
        // problem: `express.json()` leaves `req.body` as `{}` for a bodyless
        // request, but a JSON array or string body parses to something else.
        if (source === null || typeof source !== "object" || Array.isArray(source)) {
            return res.status(400).json({
                success: false,
                message: "Expected a JSON object in the request body"
            });
        }

        const errors = runSchema(source, schema);

        if (Object.keys(errors).length === 0 && refine) {
            const failure = refine(source);

            if (typeof failure === "string" && failure) {
                // A whole-form problem: there is no single input to fix.
                errors.form = failure;
            } else if (failure && typeof failure === "object") {
                for (const [field, message] of Object.entries(failure)) {
                    if (typeof message === "string" && message) {
                        errors[field] = message;
                    }
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            // Answering before the controller runs is the cheap half of this
            // layer: an invalid request never reaches the database.
            return res.status(VALIDATION_STATUS).json(validationFailure(errors, message));
        }

        const picked = normalise(pickDeclared(source, schema), schema);

        req.validated = picked;

        if (strip) {
            req[field] = picked;
        }

        return next();
    };
};

/**
 * Validate outside the middleware chain -- for checks a controller has to run
 * against a value it only learns mid-handler (a duplicate email, say).
 * @returns {string|undefined} The message to report, if the value is taken.
 */
const taken = (existing, message) => (existing ? message : undefined);

module.exports = {
    validate,
    runSchema,
    validationFailure,
    taken,
    VALIDATION_STATUS,
    rules,
    isBlank,
    asString
};
