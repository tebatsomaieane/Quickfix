function Card({
    children,
    className = "",
    hover = false,
    pressable = false,
    ...props
}) {
    return (
        <div
            className={[
                "rounded-2xl border border-slate-200 bg-white",
                "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_2px_8px_rgba(15,23,42,0.05)]",
                // `qf-lift` gives the desktop hover flourish and a touch press
                // response without latching hover state on phones.
                hover || pressable ? "qf-lift" : "",
                className
            ].join(" ")}
            {...props}
        >
            {children}
        </div>
    );
}

export default Card;
