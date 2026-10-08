import LegalPage from "../../../components/legal/LegalPage";

const SECTIONS = [
    {
        id: "what",
        heading: "What cookies are",
        blocks: [
            "Cookies are small text files a website asks your browser to keep, so it can recognise you on your next visit. Related technology — local storage — works in a similar way but stays on your device rather than being sent back to a server with every request.",
            "This page lists everything QuickFix stores in your browser, what it is for, and how long it lives. There is nothing hidden here: QuickFix runs no advertising cookies and no third-party analytics."
        ]
    },
    {
        id: "used",
        heading: "What QuickFix stores",
        blocks: [
            {
                table: {
                    head: ["Name", "Type", "Purpose", "Lifetime"],
                    rows: [
                        [
                            "token",
                            "Cookie (httpOnly)",
                            "Keeps you signed in. The server reads it; JavaScript and other sites cannot.",
                            "1 day"
                        ],
                        [
                            "csrfToken",
                            "Cookie",
                            "Security token that must be echoed on every change request, so a forged page cannot act as you.",
                            "7 days"
                        ],
                        [
                            "quickfix_user",
                            "Local storage",
                            "A cached copy of your basic profile so the app can render immediately on refresh. The signed-in session cookie remains the source of truth.",
                            "Until you log out"
                        ],
                        [
                            "qf_cookie_consent",
                            "Local storage",
                            "Remembers the choice you made in the cookie banner, so we do not ask you every visit.",
                            "12 months"
                        ]
                    ]
                }
            }
        ]
    },
    {
        id: "categories",
        heading: "Categories",
        blocks: [
            "Strictly necessary — these make the site work: sign-in, security, and remembering your cookie choice. They cannot be switched off because the platform cannot function without them.",
            "Preferences — remembers choices you have made about how QuickFix behaves. Optional, and turning them off only means we forget those choices.",
            {
                note: "Analytics and advertising: QuickFix does not use them. There is no Google Analytics, no tracking pixel, no advertising network, and no social media embed storing cookies on your device."
            },
            "Because only necessary cookies exist today, the banner offers a simple choice rather than a wall of toggles. If that ever changes, this page and the banner will be updated before anything new is stored."
        ]
    },
    {
        id: "third-parties",
        heading: "Third-party cookies",
        blocks: [
            "QuickFix does not embed third-party widgets that set their own cookies — no comment systems, no video players, no advertising tags. Embedded content that later appears will be listed here first, together with how to opt out."
        ]
    },
    {
        id: "control",
        heading: "How to control cookies",
        blocks: [
            {
                list: [
                    "In the banner: accept the optional choice, or continue with only what is strictly necessary. You can change your mind at any time from the 'Cookie settings' link in the footer.",
                    "In your browser: every major browser lets you block or delete cookies. Blocking strictly necessary cookies will sign you out and prevent you from signing in, because QuickFix cannot recognise your session without them.",
                    "In your account: logging out clears your cached profile data from the device."
                ]
            },
            "Browser help: look for \"cookies\" or \"site data\" in your browser's privacy or settings menu."
        ]
    },
    {
        id: "changes",
        heading: "Changes to this policy",
        blocks: [
            "If we introduce a new cookie or change how long one lives, we will update this page before it is used and refresh the date below. Material changes will also be announced in the app."
        ]
    },
    {
        id: "contact",
        heading: "Contact",
        blocks: [
            "Questions about cookies on QuickFix: support@quickfix.co.ls, or +266 5779 9537. You can also read how we handle your information in the Privacy Policy."
        ]
    }
];

function Cookies() {
    return (
        <LegalPage
            icon="layers"
            eyebrow="Legal"
            title="Cookie Policy"
            summary="Every cookie and local storage item QuickFix sets, in a table — including the ones we do not use. No advertising trackers, no analytics scripts."
            updatedAt="8 October 2026"
            sections={SECTIONS}
            related={[
                { to: "/privacy", label: "Privacy Policy" },
                { to: "/terms", label: "Terms & Conditions" }
            ]}
        />
    );
}

export default Cookies;
