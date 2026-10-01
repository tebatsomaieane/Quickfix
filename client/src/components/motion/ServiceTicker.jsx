import MediaRail from "../ui/MediaRail";

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
        <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
            {label}
        </span>
    );
}

function ServiceTicker() {
    return (
        <section className="relative overflow-hidden border-y border-slate-200/70 bg-gradient-to-r from-indigo-50/70 via-white to-violet-50/70 py-4">
            <MediaRail
                label="Services available on QuickFix"
                speed={34}
                gap={12}
                railClassName="qf-rail-fade"
            >
                {SERVICES.map((label) => (
                    <Chip key={label} label={label} />
                ))}
            </MediaRail>
        </section>
    );
}

export default ServiceTicker;
