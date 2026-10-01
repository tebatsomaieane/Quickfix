import {
    Children,
    isValidElement,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from "react";

function prefersReducedMotion() {
    return (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

/**
 * Modern side-scrolling media rail.
 *
 * Behaviour:
 *  - Real scroll container, so native iOS momentum, trackpad, keyboard and
 *    screen-reader support all keep working (no pointer-capture hacks).
 *  - When the content is wider than the frame the track is rendered twice and
 *    drifted left with a rAF loop. The second copy is `inert`, so the duplicate
 *    is never announced nor focusable.
 *  - Drift pauses for every reason a user can be looking at something: hover on
 *    a fine pointer, press/scrub, focus inside, scrolled off-screen, hidden
 *    tab, and `prefers-reduced-motion`. It resumes after an idle beat.
 *  - Because the two copies are identical the loop point is invisible: whenever
 *    we resume we fold `scrollLeft` back into `[0, copyWidth)` where the pixels
 *    are byte-for-byte the same.
 *  - A progress rail shows position in the loop, and edge fades + arrow controls
 *    advertise that there is more to see.
 */
function MediaRail({
    children,
    label,
    speed = 26,
    gap = 16,
    auto = true,
    showProgress = true,
    showArrows = true,
    resumeDelay = 1400,
    className = "",
    railClassName = ""
}) {
    const items = Children.toArray(children).filter(Boolean);

    const viewportRef = useRef(null);
    const copyRef = useRef(null);
    const cloneRef = useRef(null);
    const progressRef = useRef(null);

    const copyWidthRef = useRef(0);
    const frameWidthRef = useRef(0);
    const loopRef = useRef(false);
    const offsetRef = useRef(0);
    const idleTimerRef = useRef(null);
    const lastFrameRef = useRef(0);
    // Timestamp of the most recent scroll we authored, used to tell our own
    // drift apart from a scroll the user or the browser is driving.
    const lastSelfWriteRef = useRef(0);

    // Pause reasons live in a ref: flipping one must not re-render the rail.
    const holdsRef = useRef(new Set());

    const [scrollable, setScrollable] = useState(false);
    // Read up front so a reduced-motion user never sees a frame of drift
    // before the change listener syncs.
    const [reduced, setReduced] = useState(prefersReducedMotion);

    const hold = useCallback((reason, on) => {
        if (on) {
            holdsRef.current.add(reason);
            return;
        }

        holdsRef.current.delete(reason);
    }, []);

    const isHeld = useCallback(
        () => holdsRef.current.size > 0,
        []
    );

    const scheduleResume = useCallback(() => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }

        idleTimerRef.current = setTimeout(() => {
            holdsRef.current.delete("interact");
        }, resumeDelay);
    }, [resumeDelay]);

    const releaseIdle = useCallback(() => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
    }, []);

    /* ---------- painting ---------- */

    const paint = useCallback(() => {
        const viewport = viewportRef.current;
        const bar = progressRef.current;

        if (!viewport) {
            return;
        }

        const width = copyWidthRef.current;

        if (bar && width > 0) {
            const folded = viewport.scrollLeft % width;
            const ratio = Math.min(1, Math.max(0, folded / width));
            bar.style.transform = `scaleX(${ratio})`;
        }
    }, []);

    /* ---------- measurements ---------- */

    // Only an animated rail wants the duplicated track; see `measure`.
    const looping = auto && !reduced;

    const measure = useCallback(() => {
        const viewport = viewportRef.current;
        const copy = copyRef.current;

        if (!viewport || !copy) {
            return;
        }

        frameWidthRef.current = viewport.clientWidth;
        copyWidthRef.current = copy.getBoundingClientRect().width;

        // The duplicate exists to make the drift endless. A rail that is driven
        // by hand instead (auto={false}, or reduced motion) reads better as a
        // finite list that stops at its end, so the clone is dropped and the
        // track simply clamps.
        const overflows =
            copyWidthRef.current > frameWidthRef.current + 1;
        const wantLoop = overflows && looping;

        if (loopRef.current !== wantLoop) {
            loopRef.current = wantLoop;

            if (cloneRef.current) {
                cloneRef.current.style.display = wantLoop ? "" : "none";
            }

            // Re-anchor after the clone is toggled so we never rest mid-jump.
            requestAnimationFrame(() => {
                viewport.scrollLeft = 0;
                offsetRef.current = 0;
                paint();
            });
        }

        setScrollable(overflows);
    }, [paint, looping]);

    useLayoutEffect(() => {
        measure();

        if (typeof ResizeObserver === "undefined") {
            return undefined;
        }

        const observer = new ResizeObserver(measure);
        observer.observe(viewportRef.current);
        observer.observe(copyRef.current);

        return () => observer.disconnect();
    }, [measure]);

    // The duplicated copy is decorative motion only. `inert` takes its links
    // out of the tab order and the accessibility tree without the `aria-hidden`
    // + focusable-child conflict that plain `aria-hidden` would create.
    useLayoutEffect(() => {
        if (cloneRef.current) {
            cloneRef.current.setAttribute("inert", "");
        }
    }, []);

    useLayoutEffect(() => {
        if (typeof document === "undefined") {
            return undefined;
        }

        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        const sync = () => setReduced(query.matches);

        sync();
        query.addEventListener("change", sync);

        return () => query.removeEventListener("change", sync);
    }, []);

    /* ---------- auto drift ---------- */

    useEffect(() => {
        if (!looping) {
            return undefined;
        }

        let frame = 0;

        const step = (now) => {
            const viewport = viewportRef.current;
            const elapsed = Math.min(64, now - lastFrameRef.current);
            lastFrameRef.current = now;

            if (
                viewport &&
                loopRef.current &&
                !isHeld() &&
                !document.hidden
            ) {
                const width = copyWidthRef.current;
                let next = offsetRef.current + (speed * elapsed) / 1000;

                if (next >= width) {
                    next -= width;
                }

                offsetRef.current = next;
                lastSelfWriteRef.current = now;
                viewport.scrollLeft = next;
                paint();
            }

            frame = requestAnimationFrame(step);
        };

        lastFrameRef.current = performance.now();
        frame = requestAnimationFrame(step);

        return () => cancelAnimationFrame(frame);
    }, [looping, speed, isHeld, paint]);

    /* ---------- user interaction ---------- */

    // Keeps the loop bookkeeping honest when the browser scrolls the rail
    // itself (momentum, trackpad, scrollbar, keyboard, our own arrows).
    const onScroll = useCallback(() => {
        const viewport = viewportRef.current;
        const width = copyWidthRef.current;

        if (!viewport) {
            return;
        }

        if (loopRef.current && width > 0) {
            // Fold the duplicated region away so we never run off the end.
            if (viewport.scrollLeft >= width) {
                viewport.scrollLeft -= width;
            } else if (viewport.scrollLeft < 0) {
                viewport.scrollLeft += width;
            }
        }

        offsetRef.current = viewport.scrollLeft;
        paint();

        // A scroll we did not author means the user is driving: momentum on iOS
        // outlives `pointerup` by a second or more, so we hold the drift until
        // the movement actually stops instead of guessing a fixed delay.
        if (performance.now() - lastSelfWriteRef.current > 120) {
            scheduleResume();
        }
    }, [paint, scheduleResume]);

    const onInteractStart = useCallback(() => {
        hold("interact", true);
        releaseIdle();
    }, [hold, releaseIdle]);

    const onInteractEnd = useCallback(() => {
        scheduleResume();
    }, [scheduleResume]);

    // Fine pointers get hover-to-inspect; touch users are already interacting.
    const onPointerEnter = useCallback(
        (event) => {
            if (event.pointerType === "mouse") {
                hold("hover", true);
            }
        },
        [hold]
    );

    const onPointerLeave = useCallback(
        (event) => {
            if (event.pointerType === "mouse") {
                hold("hover", false);
                scheduleResume();
            }
        },
        [hold, scheduleResume]
    );

    useEffect(() => {
        const viewport = viewportRef.current;

        if (!viewport || typeof IntersectionObserver === "undefined") {
            return undefined;
        }

        const observer = new IntersectionObserver(
            ([entry]) => hold("offscreen", !entry.isIntersecting),
            { threshold: 0.01 }
        );

        observer.observe(viewport);

        return () => observer.disconnect();
    }, [hold]);

    useEffect(() => {
        const onVisibility = () =>
            hold("hidden", document.hidden);

        document.addEventListener("visibilitychange", onVisibility);

        return () =>
            document.removeEventListener("visibilitychange", onVisibility);
    }, [hold]);

    useEffect(
        () => () => {
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }
        },
        []
    );

    /* ---------- arrows ---------- */

    const nudge = useCallback(
        (direction) => {
            const viewport = viewportRef.current;

            if (!viewport) {
                return;
            }

            onInteractStart();
            viewport.scrollBy({
                left: direction * frameWidthRef.current * 0.82,
                behavior: "smooth"
            });
            // Under reduced motion the jump is instant and may emit no scroll
            // event, so arm the resume timer here as well.
            scheduleResume();
        },
        [onInteractStart, scheduleResume]
    );

    const arrow = (direction, label) => (
        <button
            type="button"
            onClick={() => nudge(direction)}
            aria-label={label}
            className={[
                "qf-tap-sm absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2",
                "items-center justify-center rounded-full border border-slate-200",
                "bg-white/90 text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur",
                "transition hover:border-indigo-300 hover:text-indigo-600 md:flex",
                direction < 0 ? "left-2 lg:-left-5" : "right-2 lg:-right-5"
            ].join(" ")}
        >
            <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path
                    d={
                        direction < 0 ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"
                    }
                />
            </svg>
        </button>
    );

    const copyStyle = useMemo(
        () => ({
            gap: `${gap}px`,
            // Trailing gap keeps the spacing uniform across the loop seam.
            paddingRight: `${gap}px`
        }),
        [gap]
    );

    if (items.length === 0) {
        return null;
    }

    return (
        <div
            className={`relative ${className}`.trim()}
            role="group"
            aria-label={label}
        >
            <div
                ref={viewportRef}
                onScroll={onScroll}
                onPointerDown={onInteractStart}
                onPointerUp={onInteractEnd}
                onPointerCancel={onInteractEnd}
                onPointerEnter={onPointerEnter}
                onPointerLeave={onPointerLeave}
                onFocusCapture={() => hold("focus", true)}
                onBlurCapture={() => {
                    hold("focus", false);
                    scheduleResume();
                }}
                className={[
                    "qf-rail",
                    railClassName
                ]
                    .filter(Boolean)
                    .join(" ")}
                tabIndex={scrollable ? 0 : -1}
            >
                <div className="flex w-max">
                    <div
                        ref={copyRef}
                        className="flex shrink-0"
                        style={copyStyle}
                    >
                        {items}
                    </div>

                    <div
                        ref={cloneRef}
                        aria-hidden="true"
                        className="flex shrink-0"
                        style={copyStyle}
                    >
                        {items.map((item, index) =>
                            isValidElement(item)
                                ? ({
                                      ...item,
                                      key: `clone-${index}`
                                  })
                                : item
                        )}
                    </div>
                </div>
            </div>

            {showArrows && scrollable && arrow(-1, "Scroll left")}
            {showArrows && scrollable && arrow(1, "Scroll right")}

            {showProgress && scrollable && (
                <div
                    aria-hidden="true"
                    className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-slate-200/80"
                >
                    <span
                        ref={progressRef}
                        className="block h-full w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                    />
                </div>
            )}
        </div>
    );
}

export default MediaRail;
