import { useEffect, useMemo, useRef, useState } from "react";

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

function parseValue(value) {
    if (typeof value === "number") {
        return {
            prefix: "",
            suffix: "",
            target: value,
            decimals: Number.isInteger(value) ? 0 : 1,
            raw: String(value)
        };
    }

    const raw = String(value ?? "");
    const match = raw.match(/^([^\d+-]*)([+-]?[\d,]+(?:\.\d+)?)(.*)$/);

    if (!match) {
        return null;
    }

    const [, prefix, numPart, suffix] = match;
    const clean = numPart.replace(/,/g, "");
    const target = parseFloat(clean);

    if (Number.isNaN(target)) {
        return null;
    }

    return {
        prefix,
        suffix,
        target,
        decimals: clean.includes(".") ? clean.split(".")[1].length : 0,
        raw
    };
}

function formatValue(parsed, current) {
    return (
        parsed.prefix +
        current.toLocaleString("en-US", {
            minimumFractionDigits: parsed.decimals,
            maximumFractionDigits: parsed.decimals
        }) +
        parsed.suffix
    );
}

function AnimatedValue({
    value,
    duration = 1200,
    startOnView = true,
    className = ""
}) {
    const parsed = useMemo(() => parseValue(value), [value]);
    const [display, setDisplay] = useState(() =>
        parsed ? formatValue(parsed, 0) : String(value ?? "")
    );
    const ref = useRef(null);
    const frameRef = useRef(null);
    const startedRef = useRef(false);
    const fromRef = useRef(0);

    useEffect(() => {
        if (!parsed) {
            setDisplay(String(value ?? ""));
            return undefined;
        }

        let observer;
        let cancelled = false;

        const reduced =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const from = startedRef.current ? fromRef.current : 0;
        const to = parsed.target;

        const runAnimation = () => {
            const start = performance.now();

            const tick = (now) => {
                if (cancelled) {
                    return;
                }

                const elapsed = Math.min(now - start, duration);
                const t = elapsed / duration;

                fromRef.current = from + (to - from) * easeOutExpo(t);
                setDisplay(formatValue(parsed, fromRef.current));

                if (t < 1) {
                    frameRef.current = requestAnimationFrame(tick);
                } else {
                    startedRef.current = true;
                    fromRef.current = to;
                }
            };

            frameRef.current = requestAnimationFrame(tick);
        };

        const begin = () => {
            if (startedRef.current && fromRef.current === to) {
                setDisplay(formatValue(parsed, to));
                return;
            }

            if (reduced) {
                startedRef.current = true;
                fromRef.current = to;
                setDisplay(formatValue(parsed, to));
                return;
            }

            runAnimation();
        };

        if (startOnView && typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            begin();
                            observer.disconnect();
                        }
                    });
                },
                { threshold: 0.4 }
            );

            if (ref.current) {
                observer.observe(ref.current);
            }
        } else {
            begin();
        }

        return () => {
            cancelled = true;

            if (observer) {
                observer.disconnect();
            }

            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [parsed, duration, startOnView, value]);

    return (
        <span ref={ref} className={className}>
            {display}
        </span>
    );
}

export default AnimatedValue;