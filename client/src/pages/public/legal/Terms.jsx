import LegalPage from "../../../components/legal/LegalPage";

const SECTIONS = [
    {
        id: "agreement",
        heading: "Agreement to these terms",
        blocks: [
            "These Terms and Conditions govern your use of QuickFix, the marketplace that connects customers with service providers and lets stores and businesses advertise what they sell in Lesotho. By creating an account, browsing QuickFix, or using any feature of the platform, you agree to these terms.",
            "If you do not agree, do not use QuickFix. Where you use QuickFix on behalf of a business or employer, you confirm that you have the authority to bind that organisation to these terms."
        ]
    },
    {
        id: "eligibility",
        heading: "Who can use QuickFix",
        blocks: [
            "You must be at least 18 years old and able to enter into a legally binding contract under the laws of the Kingdom of Lesotho to use QuickFix.",
            {
                list: [
                    "You must provide accurate, current information during registration, including a valid email address and phone number.",
                    "You may not use QuickFix if you were previously suspended or removed from the platform, unless we have reinstated you in writing.",
                    "You may not use QuickFix for any unlawful purpose or to offer services that require a licence you do not hold."
                ]
            }
        ]
    },
    {
        id: "account",
        heading: "Your account",
        blocks: [
            "You are responsible for your account and for everything that happens under it. Keep your password confidential, use a unique password, and tell us immediately at support@quickfix.co.ls if you believe your account has been accessed by someone else.",
            {
                list: [
                    "Registration details must be yours or, for a business account, genuinely represent that business.",
                    "One person may not operate multiple accounts to manipulate reviews, requests, or verification.",
                    "Where two-factor login is offered, you can switch it on from Settings; a code sent to your email will then be required at every sign-in.",
                    "Tell us promptly if your email address, phone number, or circumstances change so we can keep reaching you."
                ]
            }
        ]
    },
    {
        id: "our-role",
        heading: "QuickFix's role",
        blocks: [
            "QuickFix is a marketplace and communication tool. We introduce customers to providers, give businesses a place to advertise, and host the messaging, reviews and notifications that make those dealings easier.",
            {
                note: "QuickFix is not a party to any agreement you make with another user. We do not employ providers, do not perform the work, and do not handle payment between you. Any contract for services is strictly between the customer and the provider."
            },
            "Because we are not part of the transaction, you must resolve disputes about quality, price, timing, or damage directly with the other party first. We will help where we can through our complaints process, but we are not obliged to mediate or to compensate you for a deal that went wrong."
        ]
    },
    {
        id: "customers",
        heading: "If you are a customer",
        blocks: [
            {
                list: [
                    "Describe what you need accurately, including location, timing and budget, so providers can quote honestly.",
                    "Treat providers with respect, give them safe access to your property, and be reachable for the job you requested.",
                    "Agree the price, scope and payment method with the provider directly. QuickFix does not process payments and does not hold your money.",
                    "Never pay in advance for work you have not agreed, and report any provider you believe is fraudulent."
                ]
            }
        ]
    },
    {
        id: "providers",
        heading: "If you are a provider",
        blocks: [
            {
                list: [
                    "Hold the skills, licences and insurance your services legally require, and keep the information in your profile true.",
                    "Respond to requests and offers honestly: quotes should be genuine, deliverable, and clearly scoped.",
                    "Carry out work with reasonable care, skill and safety, and honour the terms you agreed with the customer.",
                    "Complete verification truthfully. Submitting someone else's identity documents, or altered documents, ends in removal from the platform.",
                    "You are solely responsible for your taxes, statutory obligations, and any injury or damage your work causes."
                ]
            }
        ]
    },
    {
        id: "businesses",
        heading: "If you own a business",
        blocks: [
            "Business accounts may list products, run promotions and place advertisements. You must hold the rights to everything you publish, including logos, photographs and product descriptions, and pricing must not mislead.",
            "We may remove listings or advertisements that are inaccurate, out of stock, unlawful, or that misrepresent the business behind them."
        ]
    },
    {
        id: "verification",
        heading: "Verification and trust badges",
        blocks: [
            "QuickFix may review identity and professional documents submitted by providers. Verification confirms that documents were presented and appear consistent — it is not a guarantee of quality, insurance, or future conduct.",
            {
                note: "A verification badge is not an endorsement by QuickFix. Always agree scope and price in writing before work begins, and use your own judgement."
            }
        ]
    },
    {
        id: "conduct",
        heading: "Prohibited conduct",
        blocks: [
            "QuickFix exists for honest local trade. The following are grounds for immediate suspension:",
            {
                list: [
                    "Fraud, impersonation, or misrepresenting your identity, qualifications, or business.",
                    "Harassment, hate speech, abusive language, or discriminatory behaviour in messages, reviews or listings.",
                    "Posting someone else's personal information without their consent.",
                    "Fake reviews, paid-for ratings, or any manipulation of feedback.",
                    "Spam, unsolicited advertising, or scraping data from the platform.",
                    "Attempting to bypass verification, fees, security controls, or rate limits.",
                    "Uploading unlawful, obscene, or infringing content, or content that contains malware."
                ]
            }
        ]
    },
    {
        id: "your-content",
        heading: "Content you submit",
        blocks: [
            "You keep ownership of everything you post on QuickFix — your profile text, photographs, videos, messages, listings, and reviews.",
            "In return, you give QuickFix a worldwide, non-exclusive, royalty-free licence to host, store, reproduce, adapt and display that content for the purpose of operating and promoting the platform. This licence ends when you delete the content or your account, except where a copy is already shared with another user or required to be kept by law.",
            "You confirm that you have the rights to what you post, and that it does not infringe anyone else's copyright, privacy, or other rights."
        ]
    },
    {
        id: "reviews",
        heading: "Reviews",
        blocks: [
            "Reviews must reflect a genuine experience of work arranged through QuickFix. Reviewers may not post reviews for their own business, for competitors, or in exchange for payment or discounts.",
            "We may hide or remove reviews that contain abuse, personal information, spam, or that we reasonably believe are fake — and we may restore reviews that were flagged in error."
        ]
    },
    {
        id: "fees",
        heading: "Fees",
        blocks: [
            "Creating an account, posting requests, quoting, messaging and leaving reviews are free. QuickFix is paid for by businesses that advertise and promote their listings.",
            "If we introduce paid features, we will show the price before you commit and give existing subscribers reasonable notice of any change. Fees already paid are non-refundable except where the law says otherwise."
        ]
    },
    {
        id: "intellectual-property",
        heading: "QuickFix's intellectual property",
        blocks: [
            "The platform itself — its software, design, logos, brand name, and the structure of the marketplace — belongs to QuickFix and is protected by intellectual property law. You may not copy, modify, or redistribute it without written permission.",
            "You may link to QuickFix and share public pages freely."
        ]
    },
    {
        id: "disclaimers",
        heading: "Disclaimers",
        blocks: [
            "QuickFix is provided on an \"as is\" and \"as available\" basis. We work to keep it fast, secure and available, but we do not promise that it will be uninterrupted, error-free, or that every listing or provider is accurate.",
            "We are not responsible for the conduct of any user, whether online or offline, for the quality of work performed, or for losses that are not reasonably foreseeable."
        ]
    },
    {
        id: "liability",
        heading: "Limitation of liability",
        blocks: [
            "To the fullest extent permitted by the laws of Lesotho, QuickFix's total liability to you for any claim arising out of your use of the platform is limited to the amount you paid QuickFix in the 12 months before the claim arose, or M500, whichever is greater.",
            "Nothing in these terms limits liability that cannot be limited by law, including liability for fraud, or for death or personal injury caused by negligence."
        ]
    },
    {
        id: "termination",
        heading: "Suspension and termination",
        blocks: [
            "You may close your account at any time from your settings, or by emailing support.",
            "We may suspend or permanently close your account if you break these terms, create risk for other users, or if required by law. Where it is reasonable and lawful to do so, we will tell you why first.",
            "Sections about content licences you have granted, disclaimers, liability, and governing law survive the end of your account."
        ]
    },
    {
        id: "disputes",
        heading: "Complaints and disputes",
        blocks: [
            "Problems between a customer and a provider should be raised with the other party first. If that fails, use the complaints page in your account or email support@quickfix.co.ls with the details.",
            "Complaints about other users may result in action against them. Complaints about QuickFix are escalated to a human and answered as soon as we can."
        ]
    },
    {
        id: "changes",
        heading: "Changes to these terms",
        blocks: [
            "We may update these terms as QuickFix grows. For material changes we will give notice in the app or by email at least 14 days before they take effect. Continuing to use QuickFix after that date means you accept the changes; if you do not accept them, close your account before they take effect."
        ]
    },
    {
        id: "law",
        heading: "Governing law",
        blocks: [
            "These terms are governed by the laws of the Kingdom of Lesotho, and its courts have exclusive jurisdiction over any dispute arising from them or from your use of QuickFix.",
            "If any part of these terms is found unenforceable, the rest remains in effect."
        ]
    },
    {
        id: "contact",
        heading: "Contact us",
        blocks: [
            "QuickFix is operated from Maseru, Lesotho. For any question about these terms:",
            {
                list: [
                    "Email: support@quickfix.co.ls",
                    "Phone / WhatsApp: +266 5779 9537",
                    "Post: QuickFix, Maseru, Lesotho"
                ]
            }
        ]
    }
];

function Terms() {
    return (
        <LegalPage
            icon="file"
            eyebrow="Legal"
            title="Terms & Conditions"
            summary="The agreement between you and QuickFix when you use the marketplace — what you can expect from us, and what we expect from you."
            updatedAt="8 October 2026"
            sections={SECTIONS}
            related={[
                { to: "/privacy", label: "Privacy Policy" },
                { to: "/cookies", label: "Cookie Policy" },
                { to: "/register", label: "Create an account" }
            ]}
        />
    );
}

export default Terms;
