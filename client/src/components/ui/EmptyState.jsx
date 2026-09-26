import Icon from "./Icon";

const TONES = {
    slate: { icon: "bg-white text-slate-500 ring-slate-200", blob: "from-slate-200/60" },
    indigo: { icon: "bg-white text-indigo-600 ring-indigo-100", blob: "from-indigo-300/30" },
    emerald: { icon: "bg-white text-emerald-600 ring-emerald-100", blob: "from-emerald-300/30" },
    rose: { icon: "bg-white text-rose-600 ring-rose-100", blob: "from-rose-300/30" }
};

function EmptyState({ title, description, action, icon = "inbox", tone = "slate" }) {
    const palette = TONES[tone] || TONES.slate;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div
                className={`pointer-events-none absolute -top-16 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-gradient-to-b ${palette.blob} to-transparent blur-2xl`}
                aria-hidden="true"
            />
            <div
                className={`relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ring-4 ${palette.icon}`}
            >
                <Icon name={icon} className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="relative text-lg font-bold text-slate-900">
                {title}
            </h3>
            {description && (
                <p className="relative mx-auto mt-1 max-w-sm text-sm leading-relaxed text-slate-500">
                    {description}
                </p>
            )}
            {action && <div className="relative mt-5">{action}</div>}
        </div>
    );
}

export default EmptyState;