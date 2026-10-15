import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";
import Icon from "./Icon";
import useScrollLock from "../../hooks/useScrollLock";

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A small, accessible confirmation dialog that replaces `window.confirm` for
 * actions that cannot be undone (deleting, cancelling, deactivating).
 *
 * Rendered through a portal so it escapes any `overflow`/`transform` ancestor,
 * and kept centred on every breakpoint. Escape and a backdrop tap cancel, Tab is
 * trapped inside the panel, and focus returns to the element that opened it.
 */
function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    danger = false,
    onConfirm,
    onCancel
}) {
    const panelRef = useRef(null);
    const restoreRef = useRef(null);
    const titleId = useId();
    const descriptionId = useId();

    useScrollLock(open);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        restoreRef.current = document.activeElement;

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onCancel();
                return;
            }

            if (event.key !== "Tab") {
                return;
            }

            // Keep Tab inside the dialog: it covers the page, so tabbing out
            // would move focus to content the user cannot see.
            const nodes = panelRef.current?.querySelectorAll(FOCUSABLE);

            if (!nodes || nodes.length === 0) {
                return;
            }

            const first = nodes[0];
            const last = nodes[nodes.length - 1];
            const active = document.activeElement;

            if (
                event.shiftKey &&
                (active === first || !panelRef.current?.contains(active))
            ) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", onKeyDown);

        // Focus the cancel button first: the safe choice should be the one the
        // keyboard lands on for a destructive action.
        const raf = requestAnimationFrame(() => {
            panelRef.current
                ?.querySelector("[data-autofocus]")
                ?.focus({ preventScroll: true });
        });

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            cancelAnimationFrame(raf);
            restoreRef.current?.focus?.({ preventScroll: true });
        };
    }, [open, onCancel]);

    if (!open || typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <div className="qf-fade-in fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
            <div
                className="qf-overlay-block absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
                onClick={onCancel}
                aria-hidden="true"
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)] sm:p-6"
            >
                <div className="flex items-start gap-3.5">
                    <span
                        className={[
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                            danger
                                ? "bg-rose-100 text-rose-600"
                                : "bg-indigo-100 text-indigo-600"
                        ].join(" ")}
                        aria-hidden="true"
                    >
                        <Icon name="alert" className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h2
                            id={titleId}
                            className="text-base font-bold tracking-tight text-slate-900"
                        >
                            {title}
                        </h2>
                        {description && (
                            <p
                                id={descriptionId}
                                className="mt-1 text-sm leading-relaxed text-slate-500"
                            >
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        data-autofocus=""
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={danger ? "danger" : "primary"}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default ConfirmDialog;
