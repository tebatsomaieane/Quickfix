/* eslint-disable react-refresh/only-export-components -- context + hook, not a page component */
import { createContext, useCallback, useContext, useRef, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

const ConfirmContext = createContext(null);

function normalize(options) {
    return typeof options === "string" ? { title: options } : options || {};
}

/**
 * Fallback used only when a component tree is rendered without a
 * `ConfirmProvider` (for example an isolated test). Keeps the native prompt
 * rather than crashing, so a missing provider degrades instead of breaking.
 */
function nativeConfirm(options) {
    const { title, description } = normalize(options);

    if (typeof window === "undefined" || typeof window.confirm !== "function") {
        return Promise.resolve(false);
    }

    return Promise.resolve(window.confirm(title || description || "Are you sure?"));
}

export function useConfirm() {
    return useContext(ConfirmContext) || nativeConfirm;
}

/**
 * Renders a single, app-wide confirmation dialog and exposes `confirm(options)`
 * which resolves to `true` when the user accepts and `false` otherwise.
 *
 * Call it with `await confirm({ title, description, confirmLabel, danger })`.
 */
export function ConfirmProvider({ children }) {
    const [state, setState] = useState({ open: false, options: {} });
    const resolverRef = useRef(null);

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            resolverRef.current = resolve;
            setState({ open: true, options: normalize(options) });
        });
    }, []);

    const settle = useCallback((result) => {
        resolverRef.current?.(result);
        resolverRef.current = null;
        setState((previous) => ({ ...previous, open: false }));
    }, []);

    const handleConfirm = useCallback(() => settle(true), [settle]);
    const handleCancel = useCallback(() => settle(false), [settle]);

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <ConfirmDialog
                open={state.open}
                title={state.options.title}
                description={state.options.description}
                confirmLabel={state.options.confirmLabel}
                cancelLabel={state.options.cancelLabel}
                danger={state.options.danger}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </ConfirmContext.Provider>
    );
}
