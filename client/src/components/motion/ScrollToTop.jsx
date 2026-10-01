import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Resets the document scroll position on route change.
 *
 * Without this, navigating between dashboard screens keeps the previous scroll
 * offset, so a phone lands the user halfway down — or at the very bottom — of a
 * page they have never seen.
 *
 * POP navigations (browser Back / Forward) are deliberately excluded. Those are
 * expected to restore the offset the user left behind, and force-scrolling to
 * the top on every Back press meant losing your place in any list long enough
 * to have scrolled. Skipping the reset leaves the browser's own scroll
 * restoration in charge, which is exactly the behaviour a user expects.
 *
 * Hash links (`/#how-it-works`) are also left alone so the browser's own anchor
 * handling still wins. `scroll-behavior: instant` is not universally supported,
 * so the smooth-scroll rule is lifted for the duration of the jump instead.
 */
export default function ScrollToTop() {
    const { pathname, hash, key } = useLocation();
    const navigationType = useNavigationType();

    useLayoutEffect(() => {
        if (hash || navigationType === "POP") {
            return;
        }

        const root = document.documentElement;
        const previous = root.style.scrollBehavior;

        root.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);

        if (previous) {
            root.style.scrollBehavior = previous;
        } else {
            root.style.removeProperty("scroll-behavior");
        }
    }, [pathname, hash, key, navigationType]);

    return null;
}
