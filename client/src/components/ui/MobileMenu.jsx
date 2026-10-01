import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";

const FOCUSABLE =
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Mobile navigation overlay for the public site.
 *
 * This is rendered through a portal on purpose. The sticky header carries
 * `backdrop-blur`, and a `backdrop-filter` (like `transform` or `filter`) makes
 * its element the containing block for any `position: fixed` descendant. Kept
 * inside the header, a fixed panel is therefore positioned against the *header*
 * rather than the viewport, which collapses it to no height and hides every
 * link. Portalling to `document.body` puts it back in the viewport's hands.
 */
function MobileMenu({ open, onClose, top = 0, links = [], children }) {
    const panelRef = useRef(null);
    const restoreRef = useRef(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        restoreRef.current = document.activeElement;

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }

            // Keep Tab inside the sheet: it covers the page, so tabbing out
            // would move focus to content the user cannot see.
            if (event.key !== "Tab") {
                return;
            }

            const nodes = panelRef.current?.querySelectorAll(FOCUSABLE);

            if (!nodes || nodes.length === 0) {
                return;
            }

            const first = nodes[0];
            const last = nodes[nodes.length - 1];
            const active = document.activeElement;

            if (event.shiftKey && (active === first || !panelRef.current?.contains(active))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", onKeyDown);

        // Defer so the panel exists before we move focus into it.
        const raf = requestAnimationFrame(() => {
            panelRef.current
                ?.querySelector(FOCUSABLE)
                ?.focus({ preventScroll: true });
        });

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            cancelAnimationFrame(raf);
            restoreRef.current?.focus?.({ preventScroll: true });
        };
    }, [open, onClose]);

    const onBackdrop = useCallback(() => onClose(), [onClose]);

    if (!open || typeof document === "undefined") {
        return null;
    }

    return createPortal(
        // `pointer-events-none` on the wrapper lets taps fall through to the
        // header underneath (the close button), while the panel and backdrop
        // opt back in. The wrapper covers the full viewport but is transparent,
        // so without this it would silently swallow the header's taps.
        <div
            className="pointer-events-none fixed inset-0 z-[60] md:hidden"
            role="presentation"
        >
            {/* Starts below the bar so the close button stays lit and tappable,
                which is the pattern phones expect from a nav overlay. */}
            <div
                className="qf-fade-in-fast qf-overlay-block pointer-events-auto absolute inset-x-0 bottom-0 bg-slate-900/45 backdrop-blur-[3px]"
                style={{ top }}
                onClick={onBackdrop}
                aria-hidden="true"
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Site navigation"
                style={{ top, "--qf-menu-top": `${top}px` }}
                className="qf-menu-drop pointer-events-auto absolute inset-x-0 flex flex-col overflow-hidden border-b border-slate-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.28)]"
            >
                <div className="qf-scroll-y min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-3">
                    <nav className="flex flex-col gap-1">
                        {links.map((item, index) => (
                            <button
                                key={item.label}
                                type="button"
                                onClick={item.onSelect}
                                style={{ "--qf-i": index }}
                                className="qf-menu-row qf-tap-smooth group flex w-full items-center gap-3.5 rounded-2xl px-3 py-3.5 text-left"
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
                                    <Icon
                                        name={item.icon}
                                        className="h-5 w-5"
                                    />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[15px] font-bold text-slate-900">
                                        {item.label}
                                    </span>
                                    {item.description && (
                                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                                            {item.description}
                                        </span>
                                    )}
                                </span>
                                <Icon
                                    name="chevronRight"
                                    className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-400"
                                />
                            </button>
                        ))}
                    </nav>

                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default MobileMenu;
