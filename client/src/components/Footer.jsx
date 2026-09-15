import { Link } from "react-router-dom";

function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                                Q
                            </span>
                            <span className="text-lg font-semibold text-slate-900">
                                Quick<span className="text-indigo-600">Fix</span>
                            </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                            A platform that connects customers with verified
                            service providers, while stores and cafes
                            advertise the products they sell.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                            Marketplace
                        </h3>
                        <ul className="mt-3 space-y-2 text-sm text-slate-500">
                            <li>
                                <Link
                                    to="/login"
                                    className="hover:text-indigo-600"
                                >
                                    Browse services
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/login"
                                    className="hover:text-indigo-600"
                                >
                                    Browse providers
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/register"
                                    className="hover:text-indigo-600"
                                >
                                    Advertise store products
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                            Company
                        </h3>
                        <ul className="mt-3 space-y-2 text-sm text-slate-500">
                            <li>
                                <Link to="/" className="hover:text-indigo-600">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="hover:text-indigo-600">
                                    Log in
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/register"
                                    className="hover:text-indigo-600"
                                >
                                    Create an account
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                            Contact
                        </h3>
                        <ul className="mt-3 space-y-2 text-sm text-slate-500">
                            <li>Maseru, Lesotho</li>
                            <li>support@quickfix.co.ls</li>
                            <li>+266 5779 9537</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-400">
                    © {new Date().getFullYear()} QuickFix. All rights reserved.
                </div>
            </div>
        </footer>
    );
}

export default Footer;