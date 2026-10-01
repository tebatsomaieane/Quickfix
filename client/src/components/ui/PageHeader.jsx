function PageHeader({ title, subtitle, actions, eyebrow }) {
    return (
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
                {eyebrow && (
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-indigo-500">
                        {eyebrow}
                    </p>
                )}
                <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-2xl lg:text-[28px]">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        {subtitle}
                    </p>
                )}
            </div>

            {actions && (
                <div className="qf-scroll-x -mx-3.5 flex shrink-0 items-center gap-2 overflow-x-auto px-3.5 pb-1 sm:mx-0 sm:flex-wrap sm:justify-end sm:overflow-visible sm:px-0 sm:pb-0">
                    {actions}
                </div>
            )}
        </div>
    );
}

export default PageHeader;
