import { Link } from "react-router-dom";
import Icon from "./ui/Icon";

function Footer() {
    const year = new Date().getFullYear();

    const columns = [
        {
            heading: "Marketplace",
            links: [
                { label: "Browse services", to: "/login" },
                { label: "Browse providers", to: "/login" },
                { label: "Advertise store products", to: "/register" }
            ]
        },
        {
            heading: "Company",
            links: [
                { label: "Home", to: "/" },
                { label: "How it works", to: "/#how-it-works" },
                { label: "Create an account", to: "/register" }
            ]
        }
    ];

    const renderColumnLinks = (links) =>
        links.map((link) => {
            return (
                <li key={link.label}>
                    <Link
                        to={link.to}
                        className="group inline-flex items-center gap-1.5 transition hover:text-white"
                    >
                        <span className="h-px w-0 bg-indigo-400 transition-all duration-300 group-hover:w-3" />
                        {link.label}
                    </Link>
                </li>
            );
        });

    return (
        <footer className="relative overflow-hidden bg-slate-950 text-slate-300">
            <div className="qf-dots pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
            <div
                className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl"
                aria-hidden="true"
            />

            <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:pr-6">
                        <div className="flex items-center gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-900/40">
                                Q
                            </span>
                            <span className="text-lg font-bold text-white">
                                Quick<span className="text-indigo-400">Fix</span>
                            </span>
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-slate-400">
                            A platform that connects customers with verified
                            service providers, while stores and cafes advertise
                            the products they sell, all across Lesotho.
                        </p>
                        <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 backdrop-blur">
                            <Icon name="location" className="h-4 w-4 text-indigo-400" />
                            Serving all 10 districts of Lesotho
                        </div>
                    </div>

                    {columns.map((column) => {
                        return (
                            <div key={column.heading}>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                                    {column.heading}
                                </h3>
                                <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
                                    {renderColumnLinks(column.links)}
                                </ul>
                            </div>
                        );
                    })}

                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                            Contact
                        </h3>
                        <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
                            <li className="flex items-center gap-2">
                                <Icon name="location" className="h-4 w-4 text-indigo-400" />
                                Maseru, Lesotho
                            </li>
                            <li className="flex items-center gap-2">
                                <Icon name="mail" className="h-4 w-4 text-indigo-400" />
                                support@quickfix.co.ls
                            </li>
                            <li className="flex items-center gap-2">
                                <Icon name="phone" className="h-4 w-4 text-indigo-400" />
                                +266 5779 9537
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
                    <span>&copy; {year} QuickFix. All rights reserved.</span>
                    <span className="inline-flex items-center gap-1.5">
                        Built for
                        <span className="font-semibold text-slate-300">
                            Basotho
                        </span>
                        service providers &amp; customers
                    </span>
                </div>
            </div>
        </footer>
    );
}

export default Footer;