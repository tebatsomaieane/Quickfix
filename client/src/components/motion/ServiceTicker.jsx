const SERVICES = [
    "Plumbing",
    "Electrical repairs",
    "Car wash & detailing",
    "Hair dressing",
    "Makeup artistry",
    "Computer repair",
    "Appliance repair",
    "Painting",
    "Towing",
    "Networking & IT",
    "Software installation",
    "Nails & beauty",
    "Barbering",
    "Cleaning",
    "Carpentry",
    "Mechanics",
    "Gardening",
    "Auto-electric"
];

function Chip({ label }) {
    return (
        <span className="mr-3 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
            {label}
        </span>
    );
}

function ServiceTicker() {
    const doubled = [...SERVICES, ...SERVICES];

    return (
        <section className="relative overflow-hidden border-y border-slate-200/70 bg-gradient-to-r from-indigo-50/70 via-white to-violet-50/70 py-4">
            <div className="qf-marquee qf-marquee-mask">
                <div className="qf-marquee-track">
                    {doubled.map((label, index) => (
                        <Chip key={`${label}-${index}`} label={label} />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default ServiceTicker;