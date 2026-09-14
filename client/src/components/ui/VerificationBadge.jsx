import Icon from "./Icon";

function VerificationBadge({ verified, pending, compact = false }) {
    if (verified) {
        return (
            <span
                className={[
                    "inline-flex items-center gap-1 rounded-full bg-emerald-50 font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
                    compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs"
                ].join(" ")}
                title="Verified provider"
            >
                <Icon name="checkBadge" className="h-3.5 w-3.5" />
                Verified
            </span>
        );
    }

    if (pending) {
        return (
            <span
                className={[
                    "inline-flex items-center gap-1 rounded-full bg-amber-50 font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20",
                    compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs"
                ].join(" ")}
                title="Verification pending"
            >
                <Icon name="clock" className="h-3.5 w-3.5" />
                Pending review
            </span>
        );
    }

    return null;
}

export default VerificationBadge;