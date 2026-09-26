import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { gradientFor } from "../../lib/visuals";

function SmartImage({
    src,
    alt = "",
    className = "",
    icon = "grid",
    emoji,
    seed = "",
    eager = false,
    fetchPriority,
    decoding,
    style
}) {
    const [failed, setFailed] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        if (imgRef.current?.complete) {
            setLoaded(true);
        }
    }, []);

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
                    <span className="flex h-16 w-16 select-none items-center justify-center rounded-2xl bg-white/15 text-3xl shadow-lg backdrop-blur-sm">
                        {emoji}
                    </span>
                ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
                        <Icon name={icon} className="h-7 w-7 text-white/90" />
                    </span>
                )}
            </span>
        );
    }

    return (
        <img
            ref={imgRef}
            src={src}
            alt={alt}
            loading={eager ? "eager" : "lazy"}
            decoding={decoding || (eager ? "sync" : "async")}
            fetchPriority={fetchPriority}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            style={{
                opacity: loaded ? 1 : 0,
                background: loaded ? undefined : gradientFor(seed),
                transition: "opacity 0.5s ease, transform 0.5s ease",
                ...style
            }}
            className={className}
        />
    );
}

export default SmartImage;