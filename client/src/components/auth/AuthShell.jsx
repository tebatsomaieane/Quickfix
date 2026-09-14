import SmartImage from "../ui/SmartImage";
import Icon from "../ui/Icon";

function AuthShell({ children, image, imageSeed, imageIcon, highlights = [] }) {
    return (
        <div className="bg-slate-50">
            <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-12 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8">
                {/* Form side */}
                <div className="mx-auto w-full max-w-md">{children}</div>

                {/* Visual side */}
                <div className="relative hidden lg:block">
                    <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-indigo-200/50 ring-1 ring-slate-900/10">
                        <SmartImage
                            src={image}
                            alt="QuickFix at work"
                            seed={imageSeed}
                            icon={imageIcon}
                            className="h-[36rem] w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/90 via-indigo-900/20 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-8">
                            <h2 className="text-2xl font-extrabold tracking-tight text-white">
                                Get your job done, the easy way.
                            </h2>
                            <ul className="mt-4 space-y-2.5">
                                {highlights.map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-center gap-2.5 text-sm text-indigo-100"
                                    >
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                                            <Icon name="check" className="h-3.5 w-3.5" />
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthShell;