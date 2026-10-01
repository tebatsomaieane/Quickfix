/**
 * Contract tests for the validation layer.
 *
 * The most important cases here are the boundary ones. The API accepts a
 * 6-character password while the form demands 8 with a letter and a number, so
 * a rule that is off by one at the boundary would either lock out a valid
 * password or let a weak one through. These assertions exist to make that
 * boundary explicit rather than incidental.
 */

import { readFileSync } from "node:fs";

const SOURCE = "src/lib/validation.js";
const REGISTER = "src/pages/public/Register.jsx";
const HOOK = "src/hooks/useFormValidation.js";

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

const read = (file) =>
    readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

// The validation module is plain ESM with no React dependency, so it can be
// evaluated directly here to test real behaviour rather than grepping source.
const { validate, rules, fieldErrorsFromResponse, todayAsString } =
    await import(new URL(`../${SOURCE}`, import.meta.url).href);

const run = () => {
    console.log("validation contract");

    // --- required -----------------------------------------------------------
    console.log("\nrequired rule");
    const required = rules.required("First name");

    check("rejects empty string", required("") === "First name is required");
    check("rejects whitespace", required("   ") === "First name is required");
    check("rejects null", required(null) === "First name is required");
    check("rejects undefined", required(undefined) === "First name is required");
    check("accepts a value", required("M") === null);

    // --- email --------------------------------------------------------------
    console.log("\nemail rule");
    const email = rules.email();

    for (const good of [
        "a@b.co",
        "celina@example.com",
        "first.last@sub.domain.org",
        "user+tag@example.com",
        "UPPER@EXAMPLE.COM"
    ]) {
        check(`accepts ${good}`, email(good) === null);
    }

    for (const bad of [
        "plainaddress",
        "@example.com",
        "user@",
        "user@domain",
        "user@example.c",
        "user name@example.com",
        "user@domain .com",
        "user@@example.com"
    ]) {
        check(`rejects ${bad}`, email(bad) !== null);
    }

    check("skips empty so required can own it", email("") === null);

    // --- phone --------------------------------------------------------------
    console.log("\nphone rule");
    const phone = rules.phone();

    for (const good of ["+26662222222", "266 6222 2222", "(266) 622-2222", "62222222"]) {
        check(`accepts ${good}`, phone(good) === null);
    }

    for (const bad of ["12345", "abcdefghijk", "+266CALLNOW", "1234567890123456"]) {
        check(`rejects ${bad}`, phone(bad) !== null);
    }

    // --- names --------------------------------------------------------------
    console.log("\nname rule");
    const name = rules.name();

    for (const good of ["M", "Mary", "O'Brien", "Anne-Marie", "van der Berg", "José"]) {
        check(`accepts ${good}`, name(good) === null);
    }

    for (const bad of ["M4ry", "<script>", "a@b.com"]) {
        check(`rejects ${bad}`, name(bad) !== null);
    }

    // --- length boundaries --------------------------------------------------
    console.log("\nlength boundaries");
    const min6 = rules.minLength(6);

    check("5 chars fails a 6 minimum", min6("12345") !== null);
    check("6 chars passes a 6 minimum", min6("123456") === null);

    const max30 = rules.maxLength(30);

    check("30 chars passes a 30 maximum", max30("x".repeat(30)) === null);
    check("31 chars fails a 30 maximum", max30("x".repeat(31)) !== null);

    // --- password strength --------------------------------------------------
    console.log("\npassword strength");
    const strong = rules.strongPassword();

    check("rejects 6 chars (server minimum, below ours)", strong("abc123") !== null);
    check("accepts 8 with letter and number", strong("abcd1234") === null);
    check("rejects 8 letters only", strong("abcdefgh") !== null);
    check("rejects 8 numbers only", strong("12345678") !== null);
    check("accepts long mixed passphrases", strong("correct-horse-9") === null);
    check("skips empty so required can own it", strong("") === null);

    // --- cross-field match --------------------------------------------------
    console.log("\npassword confirmation");
    const matches = rules.matches("password");

    check("matching values pass", matches("secret1", { password: "secret1" }) === null);
    check("mismatched values fail", matches("secret2", { password: "secret1" }) !== null);
    check("blank is left to required", matches("", { password: "secret1" }) === null);

    // --- schema behaviour ---------------------------------------------------
    console.log("\nvalidate() over a schema");
    const schema = {
        email: [rules.required("Email address"), rules.email()],
        password: [rules.required("Password"), rules.strongPassword()],
        confirm: [rules.required("Password confirmation"), rules.matches("password")]
    };

    const empty = validate({ email: "", password: "", confirm: "" }, schema);

    check("reports all three empty fields", Object.keys(empty).length === 3);
    check("empty email is a required message", empty.email === "Email address is required");

    const partial = validate(
        { email: "bad", password: "abc123", confirm: "xyz" },
        schema
    );

    check("flags malformed email", partial.email === "Enter a valid email address");
    check("flags weak password", Boolean(partial.password));
    check("flags mismatched confirmation", partial.confirm === "Passwords do not match");

    const good = validate(
        { email: "a@b.co", password: "abcd1234", confirm: "abcd1234" },
        schema
    );

    check("a fully valid form produces no errors", Object.keys(good).length === 0);

    // --- numeric rules ------------------------------------------------------
    console.log("\nnumeric rules");
    const money = rules.number({ min: 0, label: "Budget minimum" });

    check("blank number is optional", money("") === null);
    check("zero is allowed at the minimum", money("0") === null);
    check("positive value passes", money("1500.50") === null);
    check("rejects a negative amount", money("-1") !== null);
    check("rejects text", money("abc") !== null);

    const whole = rules.number({ integer: true, label: "Experience years" });

    check("whole number passes", whole("5") === null);
    check("rejects a fractional value", whole("5.5") !== null);
    check("blank stays optional", whole("") === null);

    const capped = rules.number({ max: 5, label: "Rating" });

    check("rejects a value over the cap", capped("9") !== null);
    check("accepts the cap itself", capped("5") === null);

    // --- date rules ---------------------------------------------------------
    console.log("\ndate rules");
    const notPast = rules.notPast("Preferred date");
    const today = todayAsString();
    const tomorrow = todayAsString(
        new Date(Date.now() + 86400000)
    );
    const yesterday = todayAsString(
        new Date(Date.now() - 86400000)
    );

    check("blank date is optional", notPast("") === null);
    check("today is allowed", notPast(today) === null);
    check("a future date is allowed", notPast(tomorrow) === null);
    check("yesterday is rejected", notPast(yesterday) !== null);
    check(
        "todayAsString yields a plain calendar date",
        /^\d{4}-\d{2}-\d{2}$/.test(today)
    );
    check(
        "a date in the same format sorts correctly",
        tomorrow > today && yesterday < today
    );

    // --- server message mapping --------------------------------------------
    console.log("\nserver error mapping");
    // Matches what Axios hands the catch block: the message sits at
    // error.response.data.message, and the interceptor may pass the body
    // straight through as error.data.
    const map = (message) =>
        fieldErrorsFromResponse({ response: { data: { message } } });

    check(
        "duplicate email lands on the email field",
        map("Email is already registered").email === "Email address is already in use"
    );
    check(
        "invalid email lands on the email field",
        map("Please provide a valid email address").email ===
            "Please provide a valid email address"
    );
    check(
        "short password lands on the password field",
        map("Password must be at least 6 characters long").password ===
            "Password must be at least 6 characters long"
    );
    check(
        "combined required message splits per field",
        Object.keys(map("First name, last name and phone number are required"))
            .length === 3
    );
    check(
        "generic required message becomes a banner",
        Boolean(map("Please provide all required fields").form)
    );
    check(
        "unrecognised message stays a banner rather than guessing a field",
        Boolean(map("Something entirely unexpected happened").form)
    );

    // A bare "name" must not light up when the message is specifically about
    // first and last name.
    check(
        "a specific name match does not also flag the generic name field",
        map("First name is required").name === undefined
    );

    // The regression that motivated making the vocabulary data-driven: a
    // duplicate product name must not be reported on an `email` field.
    const productMap = (message) =>
        fieldErrorsFromResponse({ response: { data: { message } } }, {
            fields: [
                { name: "name", label: "Product name", aliases: ["product name", "name"] },
                { name: "price", label: "Price", aliases: ["price"] }
            ]
        });

    check(
        "duplicate product name lands on the product's own field",
        productMap("A product with this name already exists").name ===
            "Product name is already in use"
    );
    check(
        "duplicate product name does not invent an email error",
        productMap("A product with this name already exists").email === undefined
    );
    check(
        "a product price rejection lands on price",
        Boolean(productMap("Price must be greater than 0").price)
    );
    check("empty response maps to nothing", Object.keys(fieldErrorsFromResponse({})).length === 0);

    // --- integration --------------------------------------------------------
    console.log("\nintegration");
    const register = read(REGISTER);
    const hook = read(HOOK);

    check("Register uses the shared hook", register.includes("useFormValidation"));
    check("Register uses the shared schema", register.includes("rules.required"));
    check("Register no longer hand-rolls a 6-character check", !/password\.length\s*<\s*6/.test(register));
    check("Register validates before awaiting the request", register.includes("validateAll"));
    check("Register maps server errors back onto fields", register.includes("applyServerError"));
    check("Register offers a password confirmation field", register.includes("confirm_password"));
    check("Register never posts the confirmation to the API", /password:\s*values\.password/.test(register) && !/confirm_password:\s*values\.confirm_password/.test(register));
    check("Register disables native validation so our messages are not duplicated", register.includes("noValidate"));
    check("hook reads current values from its argument, not a render-time ref", !/valuesRef/.test(hook));
    check("hook revalidates a touched field on change", hook.includes("touched[name] || submitAttempted"));
    check("hook focuses the first invalid field", hook.includes("focusField"));
    check("hook announces the problem count", hook.includes("announcement"));
    check("hook clears a field error once corrected", hook.includes("delete next[name]"));

    console.log(`\n${checks - failures}/${checks} checks passed`);

    return failures;
};

process.exit(run() === 0 ? 0 : 1);
