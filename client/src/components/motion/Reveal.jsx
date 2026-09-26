import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
    return (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

function Reveal({
    children,
    as: Tag = "div",
    delay = 0,
    duration = 0.7,
    y = 24,
    x = 0,
    scale = 1,
    className = "",
    ...props
}) {
    const ref = useRef(null);
    const [phase, setPhase] = useState(() =>
        prefersReducedMotion() ? "done" : "pre"
    );

    useEffect(() => {
        const el = ref.current;

        if (!el) {
            return undefined;
        }

        if (
            phase === "done" ||
            typeof IntersectionObserver === "undefined"
        ) {
            setPhase("done");
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setPhase("in");
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
        );

        observer.observe(el);

        return () => observer.disconnect();
    }, [phase]);

    useEffect(() => {
        if (phase !== "in") {
            return undefined;
        }

        const timer = setTimeout(
            () => setPhase("done"),
            delay + Math.round(duration * 1000) + 120
        );

        return () => clearTimeout(timer);
    }, [phase, delay, duration]);

    const revealClass =
        phase === "pre"
            ? "qf-reveal-pre"
            : phase === "in"
              ? "qf-reveal-in"
              : "";

    const revealStyle =
        phase === "done"
            ? undefined
            : {
                  "--qf-rx": `${x}px`,
                  "--qf-ry": `${y}px`,
                  "--qf-rs": scale,
                  "--qf-rd": `${duration}s`,
                  "--qf-rdelay": `${delay}ms`
              };

    return (
        <Tag
            ref={ref}
            className={`${className} ${revealClass}`.trim()}
            style={revealStyle}
            {...props}
        >
            {children}
        </Tag>
    );
}

export default Reveal;