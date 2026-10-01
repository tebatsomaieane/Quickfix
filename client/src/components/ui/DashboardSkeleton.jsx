import Skeleton, {
    SkeletonList,
    SkeletonStats
} from "./Skeleton";

/**
 * Shape-matched placeholder for dashboard screens. A skeleton holds the page's
 * layout while data arrives, so the content does not jump when it lands — which
 * on a phone is the difference between "loading" and "broken".
 */
function DashboardSkeleton() {
    return (
        <div className="space-y-6" aria-busy="true" aria-live="polite">
            <Skeleton
                className="h-44 w-full sm:h-52"
                rounded="rounded-3xl"
            />

            <SkeletonStats count={4} />

            <div>
                <Skeleton
                    rounded="rounded-full"
                    className="h-4 w-44"
                />
                <Skeleton
                    rounded="rounded-full"
                    className="mt-2 h-3 w-64 max-w-full"
                />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton
                        key={index}
                        className="h-28 w-full"
                        rounded="rounded-2xl"
                    />
                ))}
            </div>

            <SkeletonList count={3} />
        </div>
    );
}

export default DashboardSkeleton;
