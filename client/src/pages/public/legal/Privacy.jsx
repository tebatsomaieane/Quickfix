import LegalPage from "../../../components/legal/LegalPage";

const SECTIONS = [
    {
        id: "who-we-are",
        heading: "Who we are and what this covers",
        blocks: [
            "QuickFix is a marketplace operated from Maseru, Lesotho, that connects customers with service providers and lets businesses advertise their products. This Privacy Policy explains what personal information we collect, why we collect it, who can see it, how long we keep it, and the choices you have.",
            "It applies to the QuickFix website and app, your account, and any message, listing, or document you send us through the platform."
        ]
    },
    {
        id: "collect",
        heading: "Information we collect",
        blocks: [
            "We collect only what the marketplace needs to work:",
            {
                list: [
                    "Account details: your first and last name, email address, phone number, password (stored only as a salted hash), and account role.",
                    "Profile details: your photo, location or service area, experience, biography, business details, operating hours, and the services or products you offer.",
                    "What you post: service requests, budgets, listings, promotions, advertisements, reviews, and any files or media you upload.",
                    "Messages: the content of conversations between customers and providers, kept so both sides have a record.",
                    "Verification documents: identity, professional and qualification information, and any document you submit to be verified as a provider. These are seen only by you and by our verification administrators.",
                    "Technical records: IP address, browser and device information, and access times recorded in security logs so we can detect abuse and keep the platform safe.",
                    "Correspondence: emails and complaints you send to support."
                ]
            },
            {
                note: "QuickFix does not collect or store payment card or bank details. Payments for services are arranged directly between customers and providers, outside the platform."
            }
        ]
    },
    {
        id: "use",
        heading: "How we use your information",
        blocks: [
            {
                list: [
                    "To create and operate your account, and to keep you signed in securely.",
                    "To show your profile, listings, and reviews to other users as the marketplace requires.",
                    "To deliver messages, notifications, verification PINs, and password resets by email.",
                    "To verify providers and to review content against our Terms & Conditions.",
                    "To detect spam, fraud, and misuse, and to protect the platform and its users.",
                    "To respond to support requests and improve how QuickFix works.",
                    "To meet legal obligations and to enforce our terms."
                ]
            },
            "We do not sell your personal information, and we do not share it with advertisers. There is no advertising network or third-party analytics script running on QuickFix."
        ]
    },
    {
        id: "legal-basis",
        heading: "Our legal grounds for processing",
        blocks: [
            {
                list: [
                    "Performance of a contract: processing needed to provide the marketplace you signed up for, such as hosting your profile and delivering messages.",
                    "Legitimate interests: keeping the platform secure, preventing fraud, and improving the service, in ways you would reasonably expect.",
                    "Consent: where you have given a clear choice, such as accepting optional cookies, which you can withdraw at any time.",
                    "Legal obligations: where the law requires us to retain or disclose information."
                ]
            }
        ]
    },
    {
        id: "sharing",
        heading: "Who can see your information",
        blocks: [
            {
                list: [
                    "Other users: your name, profile photo, location, services, ratings and reviews are visible on the marketplace. Your email address and phone number are not shown on public provider listings.",
                    "The other side of a conversation: participants in a conversation can read the messages within it.",
                    "QuickFix administrators: staff who need it to run the platform, handle verification, and investigate complaints.",
                    "Service providers: the companies that host and email for us — for example Railway (hosting and database) and Cloudflare (site delivery) — process data on our instructions only, under their own security and confidentiality commitments.",
                    "Authorities: where we are legally required to disclose information, or where it is necessary to protect someone's safety or enforce our terms."
                ]
            }
        ]
    },
    {
        id: "cookies",
        heading: "Cookies and local storage",
        blocks: [
            "QuickFix uses a small number of strictly necessary cookies to keep you signed in and to protect forms from forgery, plus local storage to remember your session and your cookie choices. We run no advertising or analytics trackers.",
            "The full list, with names, purposes and lifetimes, is in our Cookie Policy."
        ]
    },
    {
        id: "retention",
        heading: "How long we keep it",
        blocks: [
            {
                list: [
                    "Account and profile information: for as long as your account is open, and then deleted or anonymised when you ask us to close it.",
                    "Messages, requests, jobs and reviews: kept while your account is open so both parties keep their history; deleted when you close your account, unless another user still needs the record of a completed job.",
                    "Verification documents: kept while your verified status depends on them, and deleted when verification is withdrawn or you ask us to remove them.",
                    "Uploaded photos and videos: kept while they are attached to your profile, listings, or requests. Files that are no longer referenced by anything are deleted automatically within 24 hours.",
                    "Verification and reset codes: stored only as hashes that expire within minutes to an hour.",
                    "Security logs: kept for a limited period sufficient to investigate abuse, then removed."
                ]
            },
            "We may keep information for longer where a complaint, dispute, or legal obligation requires it."
        ]
    },
    {
        id: "security",
        heading: "How we protect it",
        blocks: [
            {
                list: [
                    "Passwords are stored as salted bcrypt hashes — never in plain text.",
                    "Sessions use an httpOnly cookie that JavaScript cannot read, sent only over encrypted connections in production.",
                    "Every state-changing request is protected against cross-site request forgery.",
                    "Login and reset attempts are rate limited, and two-factor login codes are emailed as hashes that expire quickly.",
                    "Access to the database is restricted to the application itself."
                ]
            },
            "No system is perfectly secure. If we ever learn of a breach that affects your personal data, we will notify you and the relevant authorities as the law requires."
        ]
    },
    {
        id: "rights",
        heading: "Your rights",
        blocks: [
            "Subject to the data protection laws of the Kingdom of Lesotho, you can:",
            {
                list: [
                    "Ask for a copy of the personal information we hold about you.",
                    "Correct anything inaccurate or out of date from your settings.",
                    "Ask us to delete your account and personal information.",
                    "Withdraw a consent you previously gave, such as optional cookies.",
                    "Object to, or restrict, certain processing.",
                    "Complain if you believe we have handled your information improperly."
                ]
            },
            "To exercise any of these, email support@quickfix.co.ls from your registered address. We will respond as quickly as we can and, in any case, within the period the law requires. Deleting your account is permanent: your profile, messages, and reviews will be removed and cannot be restored."
        ]
    },
    {
        id: "transfers",
        heading: "Where your information goes",
        blocks: [
            "QuickFix is operated from Lesotho, but our hosting and email infrastructure is provided from other countries. As a result, your information may be processed outside Lesotho — for example where our servers or email provider operate.",
            "We only use providers that commit to protecting personal information, and we would not send your data anywhere it would be at greater risk than it is with us."
        ]
    },
    {
        id: "children",
        heading: "Children",
        blocks: [
            "QuickFix is a service for adults. You must be at least 18 to hold an account. If we learn that we have collected information from someone under 18, we will delete it."
        ]
    },
    {
        id: "changes",
        heading: "Changes to this policy",
        blocks: [
            "We may update this policy as the platform changes. Material changes will be announced in the app or by email before they take effect, and the date at the top of this page will be updated."
        ]
    },
    {
        id: "contact",
        heading: "Contact",
        blocks: [
            "Questions, requests, and complaints about your personal information:",
            {
                list: [
                    "Email: support@quickfix.co.ls",
                    "Phone / WhatsApp: +266 5779 9537",
                    "Post: QuickFix, Maseru, Lesotho"
                ]
            },
            "Please include the email address registered to your account so we can verify who you are before acting on a request."
        ]
    }
];

function Privacy() {
    return (
        <LegalPage
            icon="shield"
            eyebrow="Legal"
            title="Privacy Policy"
            summary="What we collect, why we collect it, who can see it, and the control you keep over it. Written in plain language, because privacy notices should be readable."
            updatedAt="8 October 2026"
            sections={SECTIONS}
            related={[
                { to: "/terms", label: "Terms & Conditions" },
                { to: "/cookies", label: "Cookie Policy" }
            ]}
        />
    );
}

export default Privacy;
