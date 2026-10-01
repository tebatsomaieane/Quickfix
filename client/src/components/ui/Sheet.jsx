import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import useScrollLock from "../../hooks/useScrollLock";

const DISMISS_THRESHOLD = 88;

/**
 * Native-feeling bottom sheet for phones: spring up from the bottom edge, drag
 * the grab handle down to dismiss, tap the backdrop or press Escape to close.
 *
 * Rendered through a portal so it escapes any `overflow`/`transform` on the
 * dashboard layout.
 */
function Sheet({
    open,
    onClose,
    title,
    description,
    children,
    maxHeight = "82dvh"
}) {
    const panelRef = useRef(null);
    const dragState = useRef({ startY: 0, offset: 0, active: false });

    useScrollLock(open);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", onKeyDown);

        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    const onPointerDown = useCallback((event) => {
        if (event.pointerType === "mouse") {
            return;
        }

        dragState.current = {
            startY: event.clientY,
            offset: 0,
            active: true
        };

        panelRef.current?.style.setProperty(
            "transition",
            "none"
        );
    }, []);

    const onPointerMove = useCallback((event) => {
        if (!dragState.current.active) {
            return;
        }

        const delta = Math.max(
            0,
            event.clientY - dragState.current.startY
        );

        dragState.current.offset = delta;

        if (panelRef.current) {
            panelRef.current.style.transform = `translate3d(0, ${delta}px, 0)`;
        }
    }, []);

    const onPointerUp = useCallback(() => {
        if (!dragState.current.active) {
            return;
        }

        const { offset } = dragState.current;

        dragState.current.active = false;

        if (panelRef.current) {
            panelRef.current.style.transition =
                "transform 0.26s cubic-bezier(0.22, 1, 0.36, 1)";
        }

        if (offset > DISMISS_THRESHOLD) {
            onClose();
            return;
        }

        if (panelRef.current) {
            panelRef.current.style.transform = "translate3d(0, 0, 0)";
        }
    }, [onClose]);

    if (!open || typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-[70] md:hidden" role="presentation">
            <div
                className="qf-sheet-backdrop qf-overlay-block"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                style={{ maxHeight }}
                className="qf-sheet-panel absolute inset-x-0 bottom-0 flex flex-col rounded-t-3xl border-t border-slate-200 bg-white shadow-[0_-12px_40px_rgba(15,23,42,0.22)]"
            >
                <div
                    className="qf-sheet-grab shrink-0 touch-none px-4 pb-1 pt-3"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                >
                    <div
                        className="mx-auto h-1.5 w-10 rounded-full bg-slate-300"
                        aria-hidden="true"
                    />
                </div>

                {title && (
                    <div className="shrink-0 px-5 pb-3 pt-1">
                        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                            {title}
                        </h2>
                        {description && (
                            <p className="mt-0.5 text-sm text-slate-500">
                                {description}
                            </p>
                        )}
                    </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default Sheet;
