function Card({ children, className = "", hover = false, ...props }) {
    return (
        <div
            className={[
                "rounded-2xl border border-slate-200 bg-white",
                "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_2px_8px_rgba(15,23,42,0.05)]",
                hover
                    ? "transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_12px_32px_rgba(15,23,42,0.1),0_4px_16px_rgba(99,102,241,0.12)]"
                    : "",
                className
            ].join(" ")}
            {...props}
        >
            {children}
        </div>
    );
}

export default Card;