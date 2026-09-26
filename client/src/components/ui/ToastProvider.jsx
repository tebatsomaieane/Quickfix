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
            const toast = { id, message, type };

            setToasts((current) => [...current.slice(-4), toast]);

            timers.current.set(
                id,
                setTimeout(() => dismiss(id), options.duration || 4000)
            );

            return id;
        },
        [dismiss]
    );

    return (
        <ToastContext.Provider value={{ showToast, dismiss }}>
            {children}

            <div
                className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 sm:items-end sm:pr-6 sm:pb-6"
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
                            <p className="min-w-0 flex-1 self-center text-sm font-medium text-slate-700">
                                {toast.message}
                            </p>
                            <button
                                type="button"
                                onClick={() => dismiss(toast.id)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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