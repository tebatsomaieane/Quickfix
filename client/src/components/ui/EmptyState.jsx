import Icon from "./Icon";

function EmptyState({
    title,
    description,
    action
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                <Icon name="inbox" className="h-6 w-6" />
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