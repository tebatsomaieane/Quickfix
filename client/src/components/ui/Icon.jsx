const ICON_PATHS = {
    alert: (
        <>
            <path d="M12 3L2.5 20h19L12 3z" />
            <path d="M12 9.5v5" />
            <path d="M12 17.2v.2" />
        </>
    ),
    x: (
        <>
            <path d="M6 6l12 12M18 6L6 18" />
        </>
    ),
    home: (
        <>
            <path d="M3 10.5L12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
        </>
    ),
    grid: (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </>
    ),
    users: (
        <>
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
            <circle cx="17.5" cy="9" r="2.5" />
            <path d="M16 14.2a6 6 0 0 1 5.5 5.8" />
        </>
    ),
    user: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
        </>
    ),
    wrench: (
        <path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.6L3 17.6V21h3.4l5.7-5.7a4.5 4.5 0 0 0 5.6-6L14.7 12l-2.3-2.3 2.3-3.4z" />
    ),
    bolt: <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />,
    broom: (
        <>
            <path d="M13 8l3-3 3 3-3 3-3-3z" />
            <path d="M16 8L6 18M6 18l3 1 3-3M9 18l3-3" />
        </>
    ),
    car: (
        <>
            <path d="M4 11l1.5-4h13L20 11" />
            <path d="M4 11h16v6H4z" />
            <circle cx="7.5" cy="17.5" r="1.5" />
            <circle cx="16.5" cy="17.5" r="1.5" />
        </>
    ),
    monitor: (
        <>
            <rect x="3" y="4" width="18" height="12" rx="1.5" />
            <path d="M9 21h6M12 16v5" />
        </>
    ),
    scissors: (
        <>
            <circle cx="6" cy="6" r="2.5" />
            <circle cx="6" cy="18" r="2.5" />
            <path d="M8.2 7.2L20 19M8.2 16.8L20 5" />
        </>
    ),
    star: (
        <path d="M12 3l2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17.2 6.5 20l1-6.1L3 9.5l6.3-.9L12 3z" />
    ),
    location: (
        <>
            <path d="M12 21s-7-5.3-7-11a7 7 0 0 1 14 0c0 5.7-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
        </>
    ),
    clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
        </>
    ),
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
        </>
    ),
    check: <path d="M4 12.5l5 5 11-11" />,
    checkCircle: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5l3 3 5-6" />
        </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    chevronRight: <path d="M9 6l6 6-6 6" />,
    arrowRight: <path d="M4 12h16m-6-6l6 6-6 6" />,
    bell: (
        <>
            <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
            <path d="M10 20a2.2 2.2 0 0 0 4 0" />
        </>
    ),
    mail: (
        <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
        </>
    ),
    chat: (
        <>
            <path d="M4 5h16v11H8l-4 4V5z" />
            <path d="M8 9h8M8 12h5" />
        </>
    ),
    file: (
        <>
            <path d="M6 3h8l4 4v14H6V3z" />
            <path d="M14 3v4h4M9 12h6M9 16h6" />
        </>
    ),
    chart: (
        <>
            <path d="M4 4v16h16" />
            <path d="M8 16v-5M12 16V7M16 16v-3" />
        </>
    ),
    settings: (
        <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
        </>
    ),
    logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
    search: (
        <>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.5-4.5" />
        </>
    ),
    inbox: (
        <>
            <path d="M3 13h5l2 3h4l2-3h5" />
            <path d="M4 5h16a1 1 0 0 1 1 1v13H3V6a1 1 0 0 1 1-1z" />
        </>
    ),
    briefcase: (
        <>
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            <path d="M3 12h18" />
        </>
    ),
    starHalf: (
        <path d="M12 3l2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17.2 6.5 20l1-6.1L3 9.5l6.3-.9L12 3z" />
    ),
    shield: (
        <>
            <path d="M12 3l7 3v5c0 5-3.2 8.5-7 10-3.8-1.5-7-5-7-10V6l7-3z" />
            <path d="M9 12l2 2 4-4" />
        </>
    ),
    megaphone: (
        <>
            <path d="M4 11v3a1 1 0 0 0 1 1h1l1 5h3v-6M20 13c0 2.2-3.6 3-8 3a9 0 0 1 0-6c4.4 0 8 0.8 8 3z" />
            <path d="M19 4c1.2 1.3 1.2 8.7 0 10" />
        </>
    ),
    building: (
        <>
            <rect x="4" y="3" width="16" height="18" rx="1" />
            <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M4 21h16" />
        </>
    ),
    eye: (
        <>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
        </>
    ),
    heart: (
        <path d="M12 20.5s-8-4.6-8-10A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.5c0 5.4-8 10-8 10z" />
    ),
    sparkles: (
        <>
            <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
            <path d="M18.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" />
        </>
    ),
    phone: (
        <path d="M5 4h3l1.5 4.5L7.5 10a12 12 0 0 0 6.5 6.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2C10 21 3 14 3 6a2 2 0 0 1 2-2z" />
    ),
    send: (
        <>
            <path d="M21 3L10 14" />
            <path d="M21 3l-7 18-4-7-7-4 18-7z" />
        </>
    ),
    trendUp: (
        <>
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M15 7h6v6" />
        </>
    ),
    wallet: (
        <>
            <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
            <path d="M16 12h5M15 9h6" />
        </>
    ),
    checkBadge: (
        <>
            <path d="M12 2l2.4 1.8 3 .1 1 2.8 2.4 1.8-1 2.8 1 2.8-2.4 1.8-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8-2.4-1.8 1-2.8-1-2.8L5.6 5.7l1-2.8 3-.1L12 2z" />
            <path d="M9 12l2 2 4-4" />
        </>
    ),
    layers: (
        <>
            <path d="M12 3l9 5-9 5-9-5 9-5z" />
            <path d="M3 13l9 5 9-5" />
        </>
    ),
    plug: (
        <>
            <path d="M9 3v5M15 3v5" />
            <path d="M6 8h12v3a6 6 0 0 1-12 0V8z" />
            <path d="M12 17v4" />
        </>
    ),
    filter: <path d="M4 5h16l-6 7v6l-4 2v-8L4 5z" />,
    arrowLeft: <path d="M20 12H4m6-6l-6 6 6 6" />,
    thumbsUp: (
        <>
            <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3z" />
            <path d="M7 11l4-8a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.3l-1.2 6a2 2 0 0 1-2 1.7H7" />
        </>
    ),
    trash: (
        <>
            <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14" />
            <path d="M10 11v6M14 11v6" />
        </>
    ),
    image: (
        <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="8.5" cy="9.5" r="1.5" />
            <path d="M21 15l-5-5-9 9" />
        </>
    ),
};

const STROKE_ICONS = new Set([
    "home", "grid", "users", "user", "wrench", "bolt", "broom", "car",
    "monitor", "scissors", "star", "location", "clock", "calendar",
    "check", "checkCircle", "plus", "menu", "chevronRight", "arrowRight",
    "bell", "mail", "chat", "file", "chart", "settings", "logout",
    "search", "inbox", "briefcase", "shield", "megaphone", "building", "eye",
    "heart", "sparkles", "phone", "send", "trendUp", "wallet", "checkBadge",
    "layers", "plug", "filter", "arrowLeft", "thumbsUp", "trash", "image",
    "alert", "x"
]);

function Icon({ name, className = "h-5 w-5" }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {ICON_PATHS[name]}
        </svg>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Icon, STROKE_ICONS };
export default Icon;