function Skeleton({ className = "", rounded = "rounded-xl" }) {
    return (
        <div
            aria-hidden="true"
            className={`qf-skeleton ${rounded} ${className}`}
        />
    );
}

export function SkeletonText({ lines = 3, className = "" }) {
    return (
        <div className={`space-y-2 ${className}`} aria-hidden="true">
            {Array.from({ length: lines }, (_, index) => (
                <Skeleton
                    key={index}
                    rounded="rounded-full"
                    className={`h-3 ${
                        index === lines - 1 ? "w-2/3" : "w-full"
                    }`}
                />
            ))}
        </div>
    );
}

export function SkeletonStats({ count = 4, className = "" }) {
    return (
        <div
            className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 ${className}`}
            aria-hidden="true"
        >
            {Array.from({ length: count }, (_, index) => (
                <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-5"
                >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <Skeleton className="h-9 w-9 sm:h-12 sm:w-12" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <Skeleton rounded="rounded-full" className="h-2.5 w-3/4" />
                            <Skeleton rounded="rounded-full" className="h-4 w-1/2" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonList({ count = 3, className = "" }) {
    return (
        <div className={`space-y-3 ${className}`} aria-hidden="true">
            {Array.from({ length: count }, (_, index) => (
                <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 shrink-0" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton rounded="rounded-full" className="h-3 w-2/3" />
                            <Skeleton rounded="rounded-full" className="h-2.5 w-1/3" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonBlock({ className = "", height = "h-56" }) {
    return <Skeleton className={`w-full ${height} ${className}`} />;
}

export default Skeleton;
