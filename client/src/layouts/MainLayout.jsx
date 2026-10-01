import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollToTop from "../components/motion/ScrollToTop";

function MainLayout() {
    const location = useLocation();

    return (
        <div className="flex min-h-dvh flex-col bg-white text-slate-900">
            <ScrollToTop />
            <Navbar />

            <main className="flex-1">
                <div key={location.pathname} className="qf-fade-in">
                    <Outlet />
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default MainLayout;
