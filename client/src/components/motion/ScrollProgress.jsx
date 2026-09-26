import { useEffect, useState } from "react";

function useScrollProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let ticking = false;

        const update = () => {
            const doc = document.documentElement;
            const max = doc.scrollHeight - window.innerHeight;

            setProgress(max > 4 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        };

        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);

        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    return progress;
}

function ScrollProgress({ className = "" }) {
    const progress = useScrollProgress();

    return (
        <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden ${className}`}
            aria-hidden="true"
        >
            <div
                className="h-full w-full origin-left bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-transform duration-200 ease-out"
                style={{ transform: `scaleX(${progress})`, opacity: progress > 0 ? 1 : 0 }}
            />
        </div>
    );
}

export default ScrollProgress;