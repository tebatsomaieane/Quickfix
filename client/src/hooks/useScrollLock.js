import { useEffect } from "react";

const LOCK_CLASS = "qf-scroll-locked";

let lockCount = 0;
let savedScrollY = 0;
let savedPaddingRight = "";

function scrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
}

/**
 * Freezes the document behind an overlay (drawer, sheet, mobile menu) without
 * the layout shift that `overflow: hidden` alone causes on iOS.
 *
 * While locked the body is pinned with `position: fixed` at the current scroll
 * offset, and the previous offset is restored on release.
 */
export default function useScrollLock(active) {
    useEffect(() => {
        if (!active) {
            return undefined;
        }

        const body = document.body;

        if (lockCount === 0) {
            savedScrollY = window.scrollY || window.pageYOffset || 0;
            savedPaddingRight = body.style.paddingRight;

            const gap = scrollbarWidth();

            if (gap > 0) {
                body.style.paddingRight = `${gap}px`;
            }

            body.classList.add(LOCK_CLASS);
            body.style.top = `-${savedScrollY}px`;
        }

        lockCount += 1;

        return () => {
            lockCount = Math.max(0, lockCount - 1);

            if (lockCount === 0) {
                body.classList.remove(LOCK_CLASS);
                body.style.top = "";
                body.style.paddingRight = savedPaddingRight;
                window.scrollTo(0, savedScrollY);
            }
        };
    }, [active]);
}
