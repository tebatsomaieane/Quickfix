import Icon from "./Icon";

const TONES = {
    slate: {
        icon: "bg-slate-200/70 text-slate-500"
    },
    indigo: {
        icon: "bg-indigo-100 text-indigo-600"
    },
    emerald: {
        icon: "bg-emerald-100 text-emerald-600"
    },
    rose: {
        icon: "bg-rose-100 text-rose-600"
    }
};

function EmptyState({
    title,
    description,
    action,
    icon = "inbox",
    tone = "slate"
}) {
    const palette = TONES[tone] || TONES.slate;

    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
            <div
                className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${palette.icon}`}
            >
                <Icon name={icon} className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
                {title}
            </h3>
            {description && (
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export default EmptyState;