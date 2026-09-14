const TONES = {
    brand: {
        tile: "bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 ring-1 ring-indigo-900/10 shadow-md shadow-indigo-200/60",
        accent: "text-indigo-600"
    },
    admin: {
        tile: "bg-gradient-to-br from-slate-800 to-slate-950 ring-1 ring-white/10 shadow-md shadow-black/20",
        accent: "text-slate-500"
    },
    pro: {
        tile: "bg-gradient-to-br from-emerald-400 to-teal-600 ring-1 ring-white/25 shadow-lg shadow-emerald-900/40",
        accent: "text-emerald-400"
    }
};

const SIZES = {
    sm: { tile: "h-9 w-9", word: "text-lg" },
    md: { tile: "h-9 w-9", word: "text-xl" },
    lg: { tile: "h-12 w-12", word: "text-2xl" }
};

function Logo({
    brand = "Quick",
    accent = "Fix",
    tone = "brand",
    onDark = false,
    tagline = "",
    badge = "",
    size = "md",
    className = ""
}) {
    const t = TONES[tone] || TONES.brand;
    const s = SIZES[size] || SIZES.md;
    const base = onDark ? "text-white" : "text-slate-900";

    return (
        <span className={`inline-flex items-center gap-2.5 ${className}`}>
            <span
                className={`flex ${s.tile} shrink-0 items-center justify-center overflow-hidden rounded-xl ${t.tile}`}
            >
                <svg
                    viewBox="0 0 24 24"
                    className="h-[62%] w-[62%]"
                    fill="none"
                    aria-hidden="true"
                >
                    <polygon
                        points="13.6 2.6 3.8 14.2 12 14.2 10.9 21.4 20.2 9.8 12 9.8 13.6 2.6"
                        fill="currentColor"
                    />
                    <path
                        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                    />
                </svg>
            </span>
            <span className="flex flex-col leading-tight">
                <span className={`${s.word} font-extrabold tracking-tight ${base}`}>
                    {brand}
                    <span className={t.accent}>{accent}</span>
                </span>
                {tagline && (
                    <span
                        className={`text-[11px] font-medium uppercase tracking-wider ${
                            onDark ? "text-slate-500" : "text-slate-400"
                        }`}
                    >
                        {tagline}
                    </span>
                )}
            </span>
            {badge && (
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {badge}
                </span>
            )}
        </span>
    );
}

export default Logo;