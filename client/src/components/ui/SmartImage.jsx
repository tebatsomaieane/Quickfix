import { useState } from "react";
import Icon from "./Icon";
import { gradientFor } from "../../lib/visuals";

function SmartImage({
    src,
    alt = "",
    className = "",
    icon = "grid",
    emoji,
    seed = "",
    eager = false
}) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <span
                className={[
                    "flex items-center justify-center overflow-hidden",
                    className
                ].join(" ")}
                style={{ background: gradientFor(seed) }}
                aria-label={alt}
                role="img"
            >
                {emoji ? (
                    <span className="select-none text-4xl drop-shadow">
                        {emoji}
                    </span>
                ) : (
                    <Icon
                        name={icon}
                        className="h-10 w-10 text-white/80"
                    />
                )}
            </span>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            loading={eager ? "eager" : "lazy"}
            onError={() => setFailed(true)}
            className={className}
        />
    );
}

export default SmartImage;