import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import SmartImage from "../../components/ui/SmartImage";
import notFoundImage from "../../assets/cleaner2.jpg";

function NotFound() {
    return (
        <div className="relative isolate overflow-hidden bg-slate-950">
            <SmartImage
                src={notFoundImage}
                alt="QuickFix provider at work"
                seed="page not found"
                icon="sparkles"
                eager
                className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-indigo-950/70" />

            <div className="relative mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                    Error 404
                </p>
                <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                    This page can't be found
                </h1>
                <p className="mt-4 max-w-md text-slate-300">
                    The link may be broken, or the page may have moved. Let's
                    get you back to something useful.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link to="/">
                        <Button size="lg">Back to home</Button>
                    </Link>
                    <Link to="/login">
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-white/30 bg-white/10 text-white hover:border-white/50 hover:bg-white/15"
                        >
                            Log in
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default NotFound;