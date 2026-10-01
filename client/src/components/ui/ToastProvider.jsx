/* eslint-disable react-refresh/only-export-components -- context + hook, not a page component */
import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState
} from "react";
import Icon from "./Icon";

const ToastContext = createContext(null);

let nextId = 0;

const TOAST_STYLES = {
    success: {
        ring: "border-emerald-200",
        icon: "bg-emerald-100 text-emerald-600",
        name: "checkBadge"
    },
    error: {
        ring: "border-rose-200",
        icon: "bg-rose-100 text-rose-600",
        name: "alert"
    },
    info: {
        ring: "border-indigo-200",
        icon: "bg-indigo-100 text-indigo-600",
        name: "bell"
    }
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef(new Map());

    const dismiss = useCallback((id) => {
        clearTimeout(timers.current.get(id));
        timers.current.delete(id);
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (message, type = "info", options = {}) => {
            const id = ++nextId;
            const toast = {
                id,
                message,
                type,
                // `detail` carries a supporting second line, e.g. the server's
                // reason alongside a friendlier headline.
                detail: options.detail,
                action: options.action
            };

            setToasts((current) => [...current.slice(-4), toast]);

            // A failure the user can act on, and a message offering a choice,
            // stay up far longer than a routine confirmation. The default 4s is
            // easy to miss if the toast is not on screen yet.
            const duration =
                options.duration ??
                (type === "error" || options.action ? 7000 : 4000);

            timers.current.set(id, setTimeout(() => dismiss(id), duration));

            return id;
        },
        [dismiss]
    );

    return (
        <ToastContext.Provider value={{ showToast, dismiss }}>
            {children}

            {/* Toasts sit above everything, but on phones the stack still
                occupies the same band as the bottom tab bar. Lifting the
                container clears the rail instead of covering the navigation the
                user is being asked to continue with. The tab bar disappears at
                `md`, so that is where the lift is dropped. */}
            <div
                className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 pb-[calc(var(--qf-tabbar-space,0px)+env(safe-area-inset-bottom,0px))] md:items-end md:pb-6 md:pr-6"
                aria-live="polite"
                aria-atomic="false"
            >
                {toasts.map((toast) => {
                    const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

                    return (
                        <div
                            key={toast.id}
                            className={[
                                "qf-fade-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white/90 p-3.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl",
                                style.ring
                            ].join(" ")}
                        >
                            <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
                            >
                                <Icon name={style.name} className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1 self-center">
                                <p className="text-sm font-medium text-slate-700">
                                    {toast.message}
                                </p>
                                {toast.detail && (
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {toast.detail}
                                    </p>
                                )}
                            </div>
                            {toast.action && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        dismiss(toast.id);
                                        toast.action.onClick();
                                    }}
                                    className="shrink-0 self-center rounded-lg px-2.5 py-1.5 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {toast.action.label}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => dismiss(toast.id)}
                                className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                aria-label="Dismiss notification"
                            >
                                <Icon name="x" className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }

    return context;
}