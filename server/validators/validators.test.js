const test = require("node:test");
const assert = require("node:assert/strict");

const { validate, runSchema, VALIDATION_STATUS } = require("./index");
const { auth, content, admin, LIMITS } = require("./schemas");
const { rules, strongPassword } = require("./rules");

/**
 * Tests for the request-validation layer.
 *
 * This is the last thing standing between an arbitrary JSON body and the
 * database, so the cases below are chosen for what they would let through
 * rather than for how many rules there are: privilege escalation through an
 * undeclared field, a value that silently corrupts on the way into a column,
 * and a cross-field rule that a single-field test would miss.
 */

/** Minimal Express-shaped response that records what was sent. */
const recorder = () => {
    const res = {
        statusCode: null,
        body: null,
        status(code) {
            this.statusCode = code;

            return this;
        },
        json(payload) {
            this.body = payload;

            return this;
        }
    };

    return res;
};

/** Run the middleware and report whether it passed, blocked, or called next. */
const execute = (schema, body, options) => {
    const req = { body };
    const res = recorder();
    let nexted = false;

    validate(schema, options)(req, res, () => {
        nexted = true;
    });

    return { req, res, nexted };
};

/** The field keys the middleware reported as problems. */
const errorKeys = (res) => Object.keys(res.body?.errors || {}).sort();

const VALID_REGISTRATION = {
    first_name: "Nthabeleng",
    last_name: "Mokoena",
    email: "nthabeleng@example.com",
    phone: "+266 6222 2222",
    password: "garden42",
    role: "CUSTOMER"
};

// ---------------------------------------------------------------------------
// Field presence and format
// ---------------------------------------------------------------------------

test("a complete registration passes and reaches the controller", () => {
    const { nexted, res } = execute(auth.register, { ...VALID_REGISTRATION });

    assert.equal(nexted, true);
    assert.equal(res.body, null);
});

test("every missing registration field is reported at once, not just the first", () => {
    const { res, nexted } = execute(auth.register, { role: "CUSTOMER" });

    assert.equal(nexted, false);
    assert.equal(res.statusCode, VALIDATION_STATUS);
    assert.deepEqual(errorKeys(res), [
        "email",
        "first_name",
        "last_name",
        "password",
        "phone"
    ]);
});

test("the summary message never names a column, and errors map each field", () => {
    const { res } = execute(auth.register, { role: "CUSTOMER" });

    assert.match(res.body.message, /correct the highlighted fields/i);
    assert.equal(typeof res.body.errors.email, "string");
    assert.equal(res.body.success, false);
});

test("an address that only looks like an email is rejected", () => {
    for (const email of [
        "plainaddress",
        "no-at-sign.com",
        "trailing@dot.",
        "two@@ats.com",
        "spaces in@example.com",
        "@example.com",
        "user@example.c"
    ]) {
        const { nexted, res } = execute(auth.register, {
            ...VALID_REGISTRATION,
            email
        });

        assert.equal(nexted, false, `expected "${email}" to be rejected`);
        assert.deepEqual(errorKeys(res), ["email"]);
    }
});

test("a real address with a subdomain and a plus tag is accepted", () => {
    const { nexted } = execute(auth.register, {
        ...VALID_REGISTRATION,
        email: "first.last+tag@mail.example.co.za"
    });

    assert.equal(nexted, true);
});

test("digits in a name field are rejected rather than stored as a typo", () => {
    const { nexted, res } = execute(auth.register, {
        ...VALID_REGISTRATION,
        first_name: "John2"
    });

    assert.equal(nexted, false);
    assert.deepEqual(errorKeys(res), ["first_name"]);
});

test("a hyphenated, apostrophised name with accents is accepted", () => {
    const { nexted } = execute(auth.register, {
        ...VALID_REGISTRATION,
        first_name: "Thandiwe",
        last_name: "O'Brien-Mbeki"
    });

    assert.equal(nexted, true);
});

test("phone numbers are judged on digit count, not formatting", () => {
    for (const phone of ["+266 6222 2222", "6222222", "(266) 622-2222"]) {
        const { nexted } = execute(auth.register, {
            ...VALID_REGISTRATION,
            phone
        });

        assert.equal(nexted, true, `expected "${phone}" to be accepted`);
    }

    for (const phone of ["12345", "call-me", "+266 6222 2222 ext 9"]) {
        const { nexted } = execute(auth.register, {
            ...VALID_REGISTRATION,
            phone
        });

        assert.equal(nexted, false, `expected "${phone}" to be rejected`);
    }
});

test("password policy is 8+ characters with a letter and a digit", () => {
    const cases = [
        ["short1", false],
        ["nodigitshere", false],
        ["12345678", false],
        ["garden42", true],
        ["Ga4", false]
    ];

    for (const [password, expected] of cases) {
        const rule = strongPassword("Password");
        const actual = rule({ value: password }) === undefined;

        assert.equal(
            actual,
            expected,
            `password "${password}" should be ${expected ? "valid" : "invalid"}`
        );
    }
});

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

test("an email is lowercased so a UNIQUE index lookup cannot be bypassed", () => {
    const { req, nexted } = execute(auth.register, {
        ...VALID_REGISTRATION,
        email: "  Nthabeleng@Example.COM  "
    });

    assert.equal(nexted, true);
    assert.equal(req.body.email, "nthabeleng@example.com");
});

test("names are trimmed before storage", () => {
    const { req } = execute(auth.register, {
        ...VALID_REGISTRATION,
        first_name: "  Nthabeleng  "
    });

    assert.equal(req.body.first_name, "Nthabeleng");
});

test("a password is never trimmed, because leading spaces are part of it", () => {
    const { req } = execute(auth.register, {
        ...VALID_REGISTRATION,
        password: " pass word1 "
    });

    assert.equal(req.body.password, " pass word1 ");
});

// ---------------------------------------------------------------------------
// The field allowlist (privilege escalation)
// ---------------------------------------------------------------------------

test("an undeclared field is dropped before the controller runs", () => {
    const { req, nexted } = execute(auth.updateProfile, {
        first_name: "Nthabeleng",
        role: "ADMIN",
        is_active: true,
        id: 999
    });

    assert.equal(nexted, true);
    assert.deepEqual(Object.keys(req.body).sort(), ["first_name"]);
    assert.equal(req.body.role, undefined);
    assert.equal(req.body.is_active, undefined);
});

test("a partial update accepts a single field", () => {
    const { req, nexted } = execute(auth.updateProfile, { phone: "+266 5000 0000" });

    assert.equal(nexted, true);
    assert.deepEqual(req.body, { phone: "+266 5000 0000" });
});

test("a role outside the allowed set is rejected", () => {
    const { nexted, res } = execute(auth.register, {
        ...VALID_REGISTRATION,
        role: "SUPERADMIN"
    });

    assert.equal(nexted, false);
    assert.deepEqual(errorKeys(res), ["role"]);
});

// ---------------------------------------------------------------------------
// Length ceilings
// ---------------------------------------------------------------------------

test("an over-long name is rejected instead of being truncated by MySQL", () => {
    const { nexted, res } = execute(auth.register, {
        ...VALID_REGISTRATION,
        first_name: "a".repeat(LIMITS.name + 1)
    });

    assert.equal(nexted, false);
    assert.deepEqual(errorKeys(res), ["first_name"]);
});

test("a description at the ceiling is still accepted", () => {
    const { nexted } = execute(content.complaint, {
        subject: "Provider did not arrive",
        description: "a".repeat(LIMITS.description)
    });

    assert.equal(nexted, true);
});

// ---------------------------------------------------------------------------
// Dates and times
// ---------------------------------------------------------------------------

const VALID_COMPLAINT = {
    subject: "Provider did not arrive",
    description: "Booked for 09:00 and nobody came by 11:00."
};

test("a date that parses but does not exist is rejected", () => {
    const { nexted, res } = execute(content.advertisement, {
        title: "Spring sale",
        start_date: "2026-02-30",
        end_date: "2026-03-10"
    });

    assert.equal(nexted, false);
    assert.deepEqual(errorKeys(res), ["start_date"]);
});

test("a malformed date string is rejected", () => {
    for (const start_date of ["10/03/2026", "2026-3-1", "tomorrow", "2026-03-10T00:00"]) {
        const { nexted } = execute(content.advertisement, {
            title: "Spring sale",
            start_date,
            end_date: "2026-03-31"
        });

        assert.equal(nexted, false, `expected "${start_date}" to be rejected`);
    }
});

test("an end date before its start date is rejected against the end field", () => {
    const { nexted, res } = execute(content.advertisement, {
        title: "Spring sale",
        start_date: "2026-03-10",
        end_date: "2026-03-01"
    });

    assert.equal(nexted, false);
    // The fix belongs in the end date, so that is where the message lands.
    assert.deepEqual(errorKeys(res), ["end_date"]);
});

test("an end date equal to its start date is a one-day campaign, and is allowed", () => {
    const { nexted } = execute(content.advertisement, {
        title: "Flash sale",
        start_date: "2026-03-10",
        end_date: "2026-03-10"
    });

    assert.equal(nexted, true);
});

test("a clock time must be a real time of day", () => {
    const valid = { ...VALID_COMPLAINT };

    for (const preferred_time of ["09:00", "23:59", "09:00:00"]) {
        const { nexted } = execute(content.createRequest, {
            ...valid,
            service_id: 1,
            title: "Fix the leaking tap",
            description: "The kitchen tap drips all night long.",
            location: "Maseru",
            preferred_time
        });

        assert.equal(nexted, true, `expected "${preferred_time}" to be accepted`);
    }

    for (const preferred_time of ["24:00", "9:00", "09:60", "morning"]) {
        const { nexted } = execute(content.createRequest, {
            ...valid,
            service_id: 1,
            title: "Fix the leaking tap",
            description: "The kitchen tap drips all night long.",
            location: "Maseru",
            preferred_time
        });

        assert.equal(nexted, false, `expected "${preferred_time}" to be rejected`);
    }
});

// ---------------------------------------------------------------------------
// Numbers and enums
// ---------------------------------------------------------------------------

test("a rating outside 1-5 is rejected", () => {
    for (const rating of [0, 6, 2.5, "five"]) {
        const { nexted } = execute(content.review, { job_id: 1, rating });

        assert.equal(nexted, false, `expected rating ${rating} to be rejected`);
    }

    for (const rating of [1, 3, 5]) {
        const { nexted } = execute(content.review, { job_id: 1, rating });

        assert.equal(nexted, true, `expected rating ${rating} to be accepted`);
    }
});

test("a discount above 100 percent is rejected", () => {
    const { nexted, res } = execute(content.promotion, {
        title: "Half price",
        discount: 150,
        start_date: "2026-03-01",
        end_date: "2026-03-31"
    });

    assert.equal(nexted, false);
    assert.deepEqual(errorKeys(res), ["discount"]);
});

test("a negative price is rejected", () => {
    const { nexted } = execute(content.product, { name: "Mug", price: -1 });

    assert.equal(nexted, false);
});

test("a zero price is allowed, because a free listing is a real choice", () => {
    const { nexted } = execute(content.product, { name: "Mug", price: 0 });

    assert.equal(nexted, true);
});

test("a non-integer foreign key is rejected before any lookup happens", () => {
    const { nexted, res } = execute(content.review, { job_id: 1.5, rating: 5 });

    assert.equal(nexted, false);
    assert.deepEqual(errorKeys(res), ["job_id"]);
});

test("a blank optional foreign key is left for the controller", () => {
    const { nexted } = execute(content.complaint, { ...VALID_COMPLAINT });

    assert.equal(nexted, true);
});

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

test("only http(s) links are accepted where a link is rendered", () => {
    for (const document_url of [
        "javascript:alert(1)",
        "data:text/html;base64,PHNjcmlwdD4=",
        "file:///etc/passwd",
        "not a url"
    ]) {
        const { nexted } = execute(content.verificationRequest, {
            identity_information: "National ID 12345678 and my name.",
            professional_information: "Ten years of electrical work, insured.",
            qualification_information: "Trade certificate",
            document_url
        });

        assert.equal(
            nexted,
            false,
            `expected "${document_url}" to be rejected`
        );
    }

    const { nexted } = execute(content.verificationRequest, {
        identity_information: "National ID 12345678 and my name.",
        professional_information: "Ten years of electrical work, insured.",
        qualification_information: "Trade certificate",
        document_url: "https://api.example.com/uploads/cert.jpg"
    });

    assert.equal(nexted, true);
});

test("a required document cannot be left blank", () => {
    const { nexted, res } = execute(content.verificationRequest, {
        identity_information: "National ID 12345678 and my name.",
        professional_information: "Ten years of electrical work, insured.",
        qualification_information: "Trade certificate",
        document_url: ""
    });

    assert.equal(nexted, false);
    assert.deepEqual(errorKeys(res), ["document_url"]);
});

// ---------------------------------------------------------------------------
// One-time codes and reset tokens
// ---------------------------------------------------------------------------

test("a verification PIN must be exactly six digits", () => {
    for (const pin of ["12345", "1234567", "12a456", "      "]) {
        const { nexted } = execute(auth.verifyEmail, {
            email: "someone@example.com",
            pin
        });

        assert.equal(nexted, false, `expected PIN "${pin}" to be rejected`);
    }

    const { nexted } = execute(auth.verifyEmail, {
        email: "someone@example.com",
        pin: "123456"
    });

    assert.equal(nexted, true);
});

test("a reset token that is not 64 hex characters is rejected", () => {
    const { nexted, res } = execute(auth.resetPassword, {
        token: "not-a-real-token",
        email: "someone@example.com",
        new_password: "garden42"
    });

    assert.equal(nexted, false);
    assert.deepEqual(errorKeys(res), ["token"]);

    const { nexted: accepted } = execute(auth.resetPassword, {
        token: "a".repeat(64),
        email: "someone@example.com",
        new_password: "garden42"
    });

    assert.equal(accepted, true);
});

// ---------------------------------------------------------------------------
// Sign-in is deliberately weaker than sign-up
// ---------------------------------------------------------------------------

test("login accepts a short password, so existing accounts are not locked out", () => {
    const { nexted } = execute(auth.login, {
        email: "someone@example.com",
        password: "old"
    });

    assert.equal(nexted, true);
});

test("login still rejects a malformed address", () => {
    const { nexted, res } = execute(auth.login, {
        email: "not-an-email",
        password: "whatever"
    });

    assert.equal(nexted, false);
    assert.deepEqual(errorKeys(res), ["email"]);
});

// ---------------------------------------------------------------------------
// Partial updates
// ---------------------------------------------------------------------------

test("clearing an optional profile field with an empty string is allowed", () => {
    const { req, nexted } = execute(content.businessProfile, {
        email: ""
    });

    assert.equal(nexted, true);
    assert.deepEqual(req.body, { email: "" });
});

test("a partial update still validates what it does send", () => {
    const { nexted, res } = execute(content.businessProfile, {
        email: "not-an-email"
    });

    assert.equal(nexted, false);
    assert.deepEqual(errorKeys(res), ["email"]);
});

test("a provider may change one field without having filled in the rest", () => {
    const { nexted } = execute(content.providerProfile, { location: "Maseru" });

    assert.equal(nexted, true);
});

test("a too-short provider overview is rejected only when one is written", () => {
    const { nexted: blank } = execute(content.providerProfile, {
        description: ""
    });

    assert.equal(blank, true);

    const { nexted, res } = execute(content.providerProfile, {
        description: "I fix things."
    });

    assert.equal(nexted, false);
    assert.deepEqual(errorKeys(res), ["description"]);
});

// ---------------------------------------------------------------------------
// Blank tolerance, as an invariant rather than per-field
//
// `rules.js` promises that a rule which is not the field's primary rule treats
// an absent value as "not my problem", leaving `required` to decide. Two rules
// broke that promise and made every partial update fail with a complaint about a
// field the user had never touched, so it is now asserted across the whole
// rule set rather than trusted per endpoint.
// ---------------------------------------------------------------------------

test("every rule except `required` tolerates a blank value", () => {
    // Each entry is a factory invoked with arguments that keep the rule
    // meaningful, so a default-constructed rule is not what gets checked.
    const samples = [
        rules.email(),
        rules.phone(),
        rules.name("First name"),
        rules.minLength(5),
        rules.maxLength(5),
        rules.safeText(),
        rules.digits(6),
        rules.otp(),
        rules.hexToken(),
        rules.number({ min: 1 }),
        rules.boolean(),
        rules.array(),
        rules.httpUrl(),
        rules.oneOf(["A"], "Field"),
        rules.afterOrEqual("other", "Field"),
        rules.notPast("Date"),
        strongPassword()
    ];

    for (const rule of samples) {
        for (const blank of [undefined, null, "", "   "]) {
            assert.equal(
                rule({ value: blank }),
                undefined,
                `a blank value (${JSON.stringify(blank)}) should pass, got "${rule({ value: blank })}"`
            );
        }
    }
});

test("`required` does reject a blank value, and so does `requiredIfPresent`", () => {
    assert.equal(typeof rules.required("Email")({ value: "" }), "string");
    assert.equal(typeof rules.required("Email")({ value: "   " }), "string");
    assert.equal(rules.required("Email")({ value: "a@b.com" }), undefined);

    // requiredIfPresent tolerates a genuinely absent field, but an empty string
    // is a deliberate clear of a field that is supposed to be present.
    assert.equal(rules.requiredIfPresent("Phone")({ value: undefined }), undefined);
    assert.equal(rules.requiredIfPresent("Phone")({ value: null }), undefined);
    assert.equal(typeof rules.requiredIfPresent("Phone")({ value: "" }), "string");
});

test("no purely-optional partial-update schema rejects an omitted field", () => {
    // The shape of the bug: a schema used by a PUT/PATCH whose rules fired on
    // fields that were never sent.
    //
    // `product` and `updateOffer` are deliberately excluded. They are
    // create-or-replace endpoints that do require `name`/`price`, so an empty
    // body failing there is the intended behaviour, not this bug.
    const partialSchemas = {
        updateProfile: auth.updateProfile,
        providerProfile: content.providerProfile,
        businessProfile: content.businessProfile,
        userUpdate: admin.userUpdate
    };

    for (const [name, schema] of Object.entries(partialSchemas)) {
        assert.deepEqual(runSchema({}, schema), {}, `${name} rejected an empty request`);

        for (const field of Object.keys(schema)) {
            assert.deepEqual(
                runSchema({ [field]: undefined }, schema),
                {},
                `${name} rejected an omitted ${field}`
            );
        }
    }
});

test("sending one field of a partial-update schema ignores the others", () => {
    const cases = [
        [auth.updateProfile, "first_name", "Nthabeleng"],
        [auth.updateProfile, "phone", "+266 6222 2222"],
        [content.businessProfile, "location", "Maseru"],
        [content.businessProfile, "operating_hours", "Mon-Fri: 8:00-17:00"],
        [content.providerProfile, "location", "Maseru"],
        [content.providerProfile, "experience_years", 12],
        [admin.userUpdate, "role", "ADMIN"]
    ];

    for (const [schema, field, value] of cases) {
        const errors = runSchema({ [field]: value }, schema);

        assert.deepEqual(
            errors,
            {},
            `sending only ${field} produced ${JSON.stringify(errors)}`
        );
    }
});

// ---------------------------------------------------------------------------
// Admin endpoints
// ---------------------------------------------------------------------------

test("an admin status outside the enum is rejected", () => {
    const { nexted } = execute(admin.verificationStatus, {
        verification_status: "MAYBE"
    });

    assert.equal(nexted, false);

    const { nexted: accepted } = execute(admin.verificationStatus, {
        verification_status: "APPROVED"
    });

    assert.equal(accepted, true);
});

test("an admin role may be set through the user update schema", () => {
    const { nexted } = execute(admin.userUpdate, { role: "ADMIN", is_active: true });

    assert.equal(nexted, true);

    const { nexted: rejected } = execute(admin.userUpdate, { role: "ROOT" });

    assert.equal(rejected, false);
});

// ---------------------------------------------------------------------------
// Malformed requests
// ---------------------------------------------------------------------------

test("a JSON array or string body is a malformed request, not a validation failure", () => {
    for (const body of [[], "a string", 42, null]) {
        const res = recorder();
        let nexted = false;

        validate(auth.register)({ body }, res, () => {
            nexted = true;
        });

        assert.equal(nexted, false);
        assert.equal(res.statusCode, 400);
    }
});

// ---------------------------------------------------------------------------
// Cross-field checks via `refine`
// ---------------------------------------------------------------------------

test("refine runs only after every field rule has passed", () => {
    const options = {
        refine: (values) =>
            Number(values.budget_min) > Number(values.budget_max)
                ? { budget_max: "Maximum budget cannot be below the minimum" }
                : undefined
    };

    const { nexted, res } = execute(
        content.createRequest,
        {
            service_id: 1,
            title: "Fix the leaking tap",
            description: "The kitchen tap drips all night long.",
            location: "Maseru",
            budget_min: 500,
            budget_max: 100
        },
        options
    );

    assert.equal(nexted, false);
    assert.deepEqual(errorKeys(res), ["budget_max"]);
});

test("refine returning a string rejects the request as a whole", () => {
    const { nexted, res } = execute(
        content.createRequest,
        {
            service_id: 1,
            title: "Fix the leaking tap",
            description: "The kitchen tap drips all night long.",
            location: "Maseru"
        },
        { refine: () => "Something about this request is not allowed" }
    );

    assert.equal(nexted, false);
    assert.deepEqual(errorKeys(res), ["form"]);
});

test("refine is not consulted while a field rule still fails", () => {
    let ran = false;

    const { nexted } = execute(
        content.createRequest,
        { service_id: 1, title: "no", description: "short", location: "" },
        {
            refine: () => {
                ran = true;
            }
        }
    );

    assert.equal(nexted, false);
    assert.equal(ran, false);
});

// ---------------------------------------------------------------------------
// The plain runner
// ---------------------------------------------------------------------------

test("runSchema reports the first failure per field only", () => {
    const errors = runSchema(
        { first_name: "", email: "nope" },
        auth.register
    );

    assert.equal(errors.first_name, "First name is required");
    assert.equal(errors.email, "Please enter a valid email address");
});

test("runSchema returns nothing for a valid set of values", () => {
    const errors = runSchema({ ...VALID_REGISTRATION }, auth.register);

    assert.deepEqual(errors, {});
});

test("an object sent where a string is expected is not stringified into a pass", () => {
    const errors = runSchema(
        { ...VALID_REGISTRATION, first_name: { $ne: null } },
        auth.register
    );

    assert.equal(typeof errors.first_name, "string");
});

test("an array is rejected for a scalar field rather than coerced", () => {
    const errors = runSchema(
        { ...VALID_REGISTRATION, phone: ["+266 6222 2222"] },
        auth.register
    );

    assert.equal(typeof errors.phone, "string");
});

test("a list field accepts an array and refuses a non-list", () => {
    const base = {
        service_id: 1,
        title: "Fix the leaking tap",
        description: "The kitchen tap drips all night long.",
        location: "Maseru"
    };

    assert.deepEqual(
        runSchema({ ...base, attachments: [{ url: "a.jpg" }] }, content.createRequest),
        {}
    );

    assert.equal(
        typeof runSchema({ ...base, attachments: "a.jpg" }, content.createRequest)
            .attachments,
        "string"
    );
});

test("too many attachments is a rejected request, not a truncated one", () => {
    const errors = runSchema(
        {
            service_id: 1,
            title: "Fix the leaking tap",
            description: "The kitchen tap drips all night long.",
            location: "Maseru",
            attachments: Array.from({ length: 7 }, (_, i) => ({ url: `${i}.jpg` }))
        },
        content.createRequest
    );

    assert.equal(typeof errors.attachments, "string");
});