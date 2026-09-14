import Icon from "./Icon";

function Star({ filled, className = "h-4 w-4" }) {
    return (
        <span className={`${filled ? "text-amber-400" : "text-slate-300"}`}>
            <Icon
                name="star"
                className={className}
            />
        </span>
    );
}

function RatingStars({ rating, className = "" }) {
    if (rating === null || rating === undefined) {
        return (
            <span className={`text-xs text-slate-400 ${className}`}>
                No ratings yet
            </span>
        );
    }

    const rounded = Math.round(rating);

    return (
        <span
            className={`inline-flex items-center gap-0.5 ${className}`}
            aria-label={`Rated ${rating} out of 5`}
        >
            <span className="inline-flex" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((index) => (
                    <Star key={index} filled={index <= rounded} />
                ))}
            </span>
            <span className="ml-1 text-sm font-medium text-slate-700">
                {Number(rating).toFixed(1)}
            </span>
        </span>
    );
}

export default RatingStars;