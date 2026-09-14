function Card({ children, className = "", ...props }) {
    return (
        <div
            className={[
                "rounded-xl border border-slate-200 bg-white shadow-sm",
                className
            ].join(" ")}
            {...props}
        >
            {children}
        </div>
    );
}

export default Card;