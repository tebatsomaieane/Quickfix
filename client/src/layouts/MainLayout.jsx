import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function MainLayout() {
    const location = useLocation();

    return (
        <div className="flex min-h-screen flex-col bg-white text-slate-900">
            <Navbar />

            <main className="flex-1">
                <div key={location.pathname} className="qf-fade-in h-full">
                    <Outlet />
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default MainLayout;