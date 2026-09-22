import { Component } from "react";
import Button from "./Button";

function ErrorFallback({ onRetry }) {
    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
            <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                    Unexpected error
                </p>
                <h1 className="mt-2 text-xl font-bold text-slate-900">
                    Something went wrong
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    An unexpected error interrupted this page. Reloading your
                    work is safe — we haven't lost anything.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                    <Button onClick={onRetry}>Try again</Button>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            window.location.href = "/";
                        }}
                    >
                        Home
                    </Button>
                </div>
            </div>
        </div>
    );
}

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);

        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        // Keep render errors visible in the console for debugging.
        console.error("Uncaught UI error:", error, info);
    }

    handleRetry = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return <ErrorFallback onRetry={this.handleRetry} />;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;