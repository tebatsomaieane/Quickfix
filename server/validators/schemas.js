const { rules, strongPassword, PASSWORD_MIN_LENGTH } = require("./rules");

// Column-width ceilings, read off `database/schema.sql`. Every bound here exists
// because the column has one: MySQL truncates an over-long VARCHAR in
// non-strict mode, which stores corrupted data and reports success.
const LIMITS = {
    name: 100,          // users.first_name / last_name
    email: 255,         // users.email
    phone: 30,          // users.phone
    password: 255,      // users.password (bcrypt digest)
    title: 200,         // service_requests.title, complaints.subject
    location: 255,      // service_requests.location, provider_profiles.location
    serviceArea: 255,   // provider_profiles.service_area
    description: 5000,  // * TEXT fields carrying user prose
    shortDescription: 1000,
    comment: 2000,      // reviews.comment
    documentUrl: 500,   // *.document_url / profile_image
    // DECIMAL(10,2) tops out just under 100 million; the extra headroom here
    // means an absurd figure is rejected with a message rather than being
    // rounded by the column type.
    money: 10000000,
    // DECIMAL(6,2)
    hours: 1000,
    experienceYears: 80
};

const ROLES = ["CUSTOMER", "PROVIDER", "BUSINESS_OWNER"];

const SERVICE_REQUEST_STATUSES = [
    "PENDING",
    "OPEN",
    "OFFERS_RECEIVED",
    "PROVIDER_SELECTED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED"
];

const OFFER_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"];

// `products.status`, matching schema.sql.
const CATALOGUE_STATUSES = ["ACTIVE", "INACTIVE"];

// `advertisements.status` and `promotions.status` -- a different ENUM from the
// products one. Conflating the two silently rejected every advertisement,
// because none of these five values appear in the products column.
const CAMPAIGN_STATUSES = ["PENDING", "ACTIVE", "PAUSED", "EXPIRED", "REJECTED"];

// A `YYYY-MM-DD` day, which is what the client's date inputs send and what the
// DATE columns want. Hours/minutes would be rejected here rather than truncated
// by the column.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// `HH:MM`, optionally with seconds, which is what a time input sends and what
// a TIME column stores.
const CLOCK_TIME = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const isoDate = (label) =>
    rules.fn((values) => {
        if (values.value === undefined || values.value === null || values.value === "") {
            return undefined;
        }

        const value = String(values.value).trim();

        if (!ISO_DATE.test(value)) {
            return `${label} must be a valid date`;
        }

        // Reject days that parse but do not exist ("2026-02-30") instead of
        // letting MySQL store NULL for an impossible date.
        const [year, month, day] = value.split("-").map(Number);
        const parsed = new Date(Date.UTC(year, month - 1, day));

        if (
            parsed.getUTCFullYear() !== year ||
            parsed.getUTCMonth() !== month - 1 ||
            parsed.getUTCDate() !== day
        ) {
            return `${label} must be a real date`;
        }

        return undefined;
    });

const clockTime = (label) =>
    rules.fn((values) => {
        if (values.value === undefined || values.value === null || values.value === "") {
            return undefined;
        }

        return CLOCK_TIME.test(String(values.value).trim())
            ? undefined
            : `${label} must be a valid time`;
    });

// Positive integer foreign key. The row is still confirmed to exist by the
// controller -- this only rejects values that cannot possibly be an id, so the
// common typo costs a 422 instead of a failed lookup.
const foreignKey = (label) => [
    rules.required(label),
    rules.number({ label, integer: true, min: 1 })
];

const optionalForeignKey = (label) => [
    rules.number({ label, integer: true, min: 1 })
];

const auth = {
    register: {
        first_name: [
            rules.required("First name"),
            rules.name("First name"),
            rules.maxLength(LIMITS.name, "First name")
        ],
        last_name: [
            rules.required("Last name"),
            rules.name("Last name"),
            rules.maxLength(LIMITS.name, "Last name")
        ],
        email: [
            rules.required("Email"),
            rules.email(),
            rules.maxLength(LIMITS.email, "Email")
        ],
        phone: [
            rules.required("Phone number"),
            rules.phone(),
            rules.maxLength(LIMITS.phone, "Phone number")
        ],
        password: [
            rules.required("Password"),
            strongPassword("Password"),
            rules.maxLength(LIMITS.password, "Password")
        ],
        role: [rules.required("Account type"), rules.oneOf(ROLES, "Account type")]
    },

    // Deliberately weaker than `register`: sign-in must accept whatever was
    // stored, including passwords set under an older policy. Rejecting a
    // "weak" password here would lock out existing accounts and tell an
    // attacker which part of their guess was wrong.
    login: {
        email: [rules.required("Email"), rules.email(), rules.maxLength(LIMITS.email, "Email")],
        password: [
            rules.required("Password"),
            rules.maxLength(LIMITS.password, "Password")
        ]
    },

    verifyEmail: {
        email: [rules.required("Email"), rules.email()],
        pin: [rules.required("Verification code"), rules.otp("Verification code")]
    },

    verifyTwoFactor: {
        email: [rules.required("Email"), rules.email()],
        pin: [rules.required("Verification code"), rules.otp("Verification code")]
    },

    resend: {
        email: [rules.required("Email"), rules.email()]
    },

    // A partial update: every field is optional, but anything present has to be
    // valid. The controller rejects the request outright when nothing was sent.
    updateProfile: {
        first_name: [
            rules.requiredIfPresent("First name"),
            rules.name("First name"),
            rules.maxLength(LIMITS.name, "First name")
        ],
        last_name: [
            rules.requiredIfPresent("Last name"),
            rules.name("Last name"),
            rules.maxLength(LIMITS.name, "Last name")
        ],
        phone: [
            rules.requiredIfPresent("Phone number"),
            rules.phone(),
            rules.maxLength(LIMITS.phone, "Phone number")
        ],
        location: [rules.maxLength(LIMITS.location, "Location")],
        profile_image: [rules.maxLength(LIMITS.documentUrl, "Photo")]
    },

    changePassword: {
        current_password: [rules.required("Current password")],
        new_password: [
            rules.required("New password"),
            strongPassword("New password"),
            rules.maxLength(LIMITS.password, "New password")
        ]
    },

    toggleTwoFactor: {
        enabled: [rules.required("Two-factor authentication"), rules.boolean()]
    },

    forgotPassword: {
        email: [rules.required("Email"), rules.email()]
    },

    resetPassword: {
        token: [rules.required("Reset token"), rules.hexToken()],
        email: [rules.required("Email"), rules.email()],
        new_password: [
            rules.required("New password"),
            strongPassword("New password"),
            rules.maxLength(LIMITS.password, "New password")
        ]
    }
};

const content = {
    createRequest: {
        service_id: foreignKey("Service"),
        title: [
            rules.required("Title"),
            rules.minLength(5, "Title"),
            rules.maxLength(LIMITS.title, "Title")
        ],
        description: [
            rules.required("Description"),
            rules.minLength(10, "Description"),
            rules.maxLength(LIMITS.description, "Description")
        ],
        location: [
            rules.required("Location"),
            rules.minLength(2, "Location"),
            rules.maxLength(LIMITS.location, "Location")
        ],
        preferred_date: [isoDate("Preferred date"), rules.notPast("Preferred date")],
        preferred_time: [clockTime("Preferred time")],
        budget_min: [rules.number({ label: "Minimum budget", min: 0, max: LIMITS.money })],
        budget_max: [rules.number({ label: "Maximum budget", min: 0, max: LIMITS.money })],
        // Photos and videos ride along as a list of uploaded-media references,
        // not as numbers.
        attachments: [rules.array({ label: "Attachments", max: 6 })]
    },

    updateRequestStatus: {
        status: [
            rules.required("Status"),
            rules.oneOf(SERVICE_REQUEST_STATUSES, "Status")
        ]
    },

    createOffer: {
        request_id: foreignKey("Request"),
        price: [
            rules.required("Your price"),
            rules.number({ label: "Your price", min: 0.01, max: LIMITS.money })
        ],
        estimated_hours: [rules.number({ label: "Estimated hours", min: 0.5, max: LIMITS.hours })],
        valid_until: [isoDate("Valid until"), rules.notPast("Valid until")],
        message: [rules.maxLength(LIMITS.shortDescription, "Message")]
    },

    updateOffer: {
        price: [
            rules.required("Your price"),
            rules.number({ label: "Your price", min: 0.01, max: LIMITS.money })
        ],
        estimated_hours: [rules.number({ label: "Estimated hours", min: 0.5, max: LIMITS.hours })],
        valid_until: [isoDate("Valid until")],
        message: [rules.maxLength(LIMITS.shortDescription, "Message")]
    },

    offerStatus: {
        status: [rules.required("Status"), rules.oneOf(OFFER_STATUSES, "Status")]
    },

    review: {
        job_id: foreignKey("Job"),
        rating: [
            rules.required("Rating"),
            rules.number({ label: "Rating", integer: true, min: 1, max: 5 })
        ],
        comment: [rules.maxLength(LIMITS.comment, "Review")]
    },

    reviewResponse: {
        comment: [rules.required("Response"), rules.maxLength(LIMITS.comment, "Response")]
    },

    complaint: {
        subject: [
            rules.required("Subject"),
            rules.minLength(4, "Subject"),
            rules.maxLength(LIMITS.title, "Subject")
        ],
        description: [
            rules.required("Description"),
            rules.minLength(10, "Description"),
            rules.maxLength(LIMITS.description, "Description")
        ],
        job_id: optionalForeignKey("Job")
    },

    sendMessage: {
        message: [
            rules.required("Message"),
            rules.minLength(1, "Message"),
            rules.maxLength(5000, "Message")
        ]
    },

    startConversation: {
        request_id: foreignKey("Request")
    },

    // Every field optional: this is a profile edit, and the controller applies
    // only what was sent, including clearing a field by sending null. So the
    // rules here bound what a value may contain rather than demanding one --
    // requiring these server-side would block a provider who opens the page only
    // to change their phone number and has never written a description. The
    // "you must fill this in" requirement belongs on the form.
    providerProfile: {
        description: [
            rules.minLength(20, "Description"),
            rules.maxLength(LIMITS.description, "Description")
        ],
        experience_years: [
            rules.number({ label: "Years of experience", integer: true, min: 0, max: LIMITS.experienceYears })
        ],
        location: [rules.maxLength(LIMITS.location, "Location")],
        service_area: [rules.maxLength(LIMITS.serviceArea, "Service area")],
        profile_image: [rules.maxLength(LIMITS.documentUrl, "Photo")]
    },

    providerServices: {
        services: [rules.required("Services")]
    },

    providerAvailability: {
        availability: [rules.required("Availability")]
    },

    verificationRequest: {
        identity_information: [
            rules.required("Identity information"),
            rules.minLength(20, "Identity information"),
            rules.maxLength(LIMITS.description, "Identity information")
        ],
        professional_information: [
            rules.required("Professional information"),
            rules.minLength(20, "Professional information"),
            rules.maxLength(LIMITS.description, "Professional information")
        ],
        qualification_information: [
            rules.required("Qualification information"),
            rules.minLength(10, "Qualification information"),
            rules.maxLength(LIMITS.description, "Qualification information")
        ],
        document_url: [
            rules.required("Document"),
            rules.httpUrl("Document"),
            rules.maxLength(LIMITS.documentUrl, "Document")
        ]
    },

    product: {
        name: [
            rules.required("Product name"),
            rules.minLength(2, "Product name"),
            rules.maxLength(LIMITS.title, "Product name")
        ],
        description: [rules.maxLength(LIMITS.description, "Description")],
        price: [
            rules.required("Price"),
            rules.number({ label: "Price", min: 0, max: LIMITS.money })
        ],
        category_id: optionalForeignKey("Category"),
        image: [rules.maxLength(LIMITS.documentUrl, "Image")],
        status: [rules.oneOf(CATALOGUE_STATUSES, "Status")]
    },

    // `advertisements` / `promotions`.
    //
    // Description and service are both nullable in the schema (the service FK is
    // ON DELETE SET NULL, so a deleted service must not block the row), so they
    // are optional here. Only title, the date range and the discount are NOT
    // NULL columns.
    advertisement: {
        title: [
            rules.required("Title"),
            rules.minLength(3, "Title"),
            rules.maxLength(LIMITS.title, "Title")
        ],
        description: [rules.maxLength(LIMITS.description, "Description")],
        service_id: optionalForeignKey("Service"),
        start_date: [rules.required("Start date"), isoDate("Start date")],
        end_date: [
            rules.required("End date"),
            isoDate("End date"),
            rules.afterOrEqual("start_date", "End date")
        ],
        image: [rules.maxLength(LIMITS.documentUrl, "Image")],
        status: [rules.oneOf(CAMPAIGN_STATUSES, "Status")]
    },

    promotion: {
        title: [
            rules.required("Title"),
            rules.minLength(3, "Title"),
            rules.maxLength(LIMITS.title, "Title")
        ],
        description: [rules.maxLength(LIMITS.description, "Description")],
        // DECIMAL(5,2), and semantically a percentage off, so never negative
        // and never above 100 -- a "150% discount" is not a discount.
        discount: [
            rules.required("Discount"),
            rules.number({ label: "Discount", min: 0, max: 100 })
        ],
        service_id: optionalForeignKey("Service"),
        start_date: [rules.required("Start date"), isoDate("Start date")],
        end_date: [
            rules.required("End date"),
            isoDate("End date"),
            rules.afterOrEqual("start_date", "End date")
        ],
        status: [rules.oneOf(CAMPAIGN_STATUSES, "Status")]
    },

    // A partial edit, like `providerProfile`: the controller applies only the
    // fields that were sent, and `null` clears one. No field is required, so
    // `email: ""` is a valid way to remove a business contact address.
    businessProfile: {
        name: [
            rules.minLength(2, "Business name"),
            rules.maxLength(LIMITS.title, "Business name")
        ],
        description: [rules.maxLength(LIMITS.description, "Description")],
        email: [rules.email()],
        phone: [rules.phone()],
        location: [rules.maxLength(LIMITS.location, "Location")],
        logo: [rules.maxLength(LIMITS.documentUrl, "Logo")],
        cover_image: [rules.maxLength(LIMITS.documentUrl, "Cover photo")],
        operating_hours: [rules.maxLength(LIMITS.shortDescription, "Operating hours")]
    }
};

const admin = {
    verificationStatus: {
        verification_status: [
            rules.required("Status"),
            rules.oneOf(["PENDING", "APPROVED", "REJECTED"], "Status")
        ],
        admin_notes: [rules.maxLength(LIMITS.description, "Notes")]
    },

    userUpdate: {
        role: [rules.oneOf([...ROLES, "ADMIN"], "Role")],
        is_active: [rules.boolean()]
    },

    complaintStatus: {
        status: [
            rules.required("Status"),
            rules.oneOf(["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"], "Status")
        ],
        admin_response: [rules.maxLength(LIMITS.description, "Response")]
    }
};

module.exports = {
    auth,
    content,
    admin,
    LIMITS,
    ROLES,
    CATALOGUE_STATUSES,
    CAMPAIGN_STATUSES,
    PASSWORD_MIN_LENGTH,
    ISO_DATE,
    CLOCK_TIME
};
