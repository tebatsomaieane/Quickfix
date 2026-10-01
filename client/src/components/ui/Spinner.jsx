function Spinner({ className = "", label = "Loading" }) {
    return (
        <span
            role="status"
            aria-label={label}
            className={[
                "relative inline-flex h-9 w-9 items-center justify-center",
                className
            ].join(" ")}
        >
            <span
                className="absolute inset-0 animate-pulse-ring rounded-full bg-indigo-500/10"
                aria-hidden="true"
            />
            <svg
                className="relative h-9 w-9 animate-spin"
                viewBox="0 0 36 36"
                fill="none"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient
                        id="qf-spinner-grad"
                        x1="0"
                        y1="0"
                        x2="36"
                        y2="36"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#6366f1" />
                        <stop offset="0.6" stopColor="#8b5cf6" />
                        <stop offset="1" stopColor="#d946ef" />
                    </linearGradient>
                </defs>
                <circle
                    cx="18"
                    cy="18"
                    r="15"
                    stroke="#e2e8f0"
                    strokeWidth="3.5"
                />
                <path
                    d="M33 18a15 15 0 0 0-15-15"
                    stroke="url(#qf-spinner-grad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                />
            </svg>
            <span className="sr-only">{label}</span>
        </span>
    );
}

export default Spinner;
