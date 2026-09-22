import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Spinner from "../../components/ui/Spinner";
import SmartImage from "../../components/ui/SmartImage";
import { fetchCategories, fetchMarketOverview } from "../../services/catalogueService";
import { getCategoryImage } from "../../lib/visuals";

// Real Lesotho imagery. Local files are first-party photos from the app;
// the hero uses a public-domain shot of Maletsunyane Falls near Semonkong.
import heroEngineerImage from "../../assets/electrician.jpg";
import offerServiceImage from "../../assets/servicerequestperson.jpg";
import offerProviderImage from "../../assets/cleaner.jpg";
import offerStoreImage from "../../assets/restaurant.jpg";
import categoryHomeImage from "../../assets/cleaner2.jpg";
import categoryAutomotiveImage from "../../assets/CarRepair.jpg";
import categoryTechnologyImage from "../../assets/programmer.jpg";
import categoryBeautyImage from "../../assets/salon.jpg";
import businessImage from "../../assets/business.jpg";

const HERO_IMAGE_URL =
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Maletsunyanefalls.JPG/1920px-Maletsunyanefalls.JPG";

const HERO_IMAGE_SRC_SET =
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Maletsunyanefalls.JPG/960px-Maletsunyanefalls.JPG 960w, https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Maletsunyanefalls.JPG/1920px-Maletsunyanefalls.JPG 1920w";

const DISTRICTS = [
    "Maseru",
    "Berea",
    "Leribe",
    "Mafeteng",
    "Butha-Buthe",
    "Mohale's Hoek"
];

// A category without a real photo renders branded gradient + icon.
const CATEGORY_VISUAL = {
    "Home Services": { src: categoryHomeImage, icon: "broom", obj: "object-[center_35%]" },
    "Automotive": { src: categoryAutomotiveImage, icon: "car", obj: "object-[center_35%]" },
    "Technology": { src: categoryTechnologyImage, icon: "monitor", obj: "object-center" },
    "Beauty & Personal Care": { src: categoryBeautyImage, icon: "scissors", obj: "object-[center_35%]" }
};

const OFFERINGS = [
    {
        icon: "wrench",
        image: offerServiceImage,
        seed: "Request a service",
        obj: "object-[center_30%]",
        title: "Request a service",
        description:
            "Post what you need done — plumbing, electrical, cleaning or tech — and verified providers send you offers within hours."
    },
    {
        icon: "users",
        image: offerProviderImage,
        seed: "Hire a provider",
        obj: "object-[center_30%]",
        title: "Hire a provider",
        description:
            "Browse vetted professionals, compare reviews and prices, and hire the right person for the job."
    },
    {
        icon: "inbox",
        image: offerStoreImage,
        seed: "Products from stores & cafés",
        obj: "object-center",
        title: "Products from stores & cafés",
        description:
            "Stores and cafés advertise what they sell. Browse the adverts, then contact the shop directly to buy."
    }
];

const CUSTOMER_STEPS = [
    {
        icon: "user",
        title: "Create an account",
        description:
            "Sign up in under a minute, tell us where you are, and open your personal dashboard."
    },
    {
        icon: "sparkles",
        title: "Post a request",
        description:
            "Describe the job, set your budget and timeline — the right providers come to you."
    },
    {
        icon: "star",
        title: "Compare, hire, review",
        description:
            "Pick the best offer, get the job done, then leave an honest review that helps everyone."
    }
];

const STORE_FEATURES = [
    {
        icon: "inbox",
        title: "List your products",
        description:
            "Stores and cafés (and growing businesses like them) advertise the products they sell."
    },
    {
        icon: "location",
        title: "Get discovered",
        description:
            "Your listings appear under the right categories for customers in your area."
    },
    {
        icon: "chat",
        title: "Customers contact you",
        description:
            "Interested customers reach out to your store directly to enquire and buy."
    }
];

function Home() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [overview, setOverview] = useState(null);

    useEffect(() => {
        let cancelled = false;

        fetchCategories({ withServices: true })
            .then((data) => {
                if (!cancelled) {
                    setCategories(Array.isArray(data?.data) ? data.data : []);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setCategories([]);
                }
            });

        fetchMarketOverview()
            .then((data) => {
                if (!cancelled) {
                    setOverview(
                        data?.data && typeof data.data === "object"
                            ? data.data
                            : null
                    );
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setOverview(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const stats = overview
        ? [
              {
                  value: String(overview.verifiedProviders),
                  label: "Verified providers"
              },
              {
                  value: String(overview.completedJobs),
                  label: "Jobs completed"
              },
              ...(overview.avgRating !== null && overview.avgRating !== undefined
                  ? [
                        {
                            value: Number(overview.avgRating).toFixed(1),
                            label: "Average rating"
                        }
                    ]
                  : []),
              {
                  value: String(overview.categories),
                  label: "Service categories"
              }
          ]
        : [];

    const rating =
        overview?.avgRating !== null && overview?.avgRating !== undefined
            ? Number(overview.avgRating)
            : null;

    return (
        <div className="overflow-hidden">
            {/* ============================== HERO ============================== */}
            <section className="relative isolate overflow-hidden bg-slate-950">
                {/* Background: Maletsunyane Falls, Semonkong, Lesotho */}
                <img
                    src={HERO_IMAGE_URL}
                    srcSet={HERO_IMAGE_SRC_SET}
                    sizes="100vw"
                    alt="Maletsunyane Falls near Semonkong, Lesotho"
                    loading="eager"
                    fetchpriority="high"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-indigo-950/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.35)_100%)]" />

                <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-8 lg:py-24">
                    {/* Copy */}
                    <div>
                        <span className="qf-rise inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-100 shadow-sm backdrop-blur">
                            <Icon name="sparkles" className="h-3.5 w-3.5" />
                            Lesotho's local service marketplace
                        </span>

                        <h1 className="qf-rise mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.4rem]" style={{ animationDelay: "0.06s" }}>
                            Find a trusted provider for any job,{" "}
                            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                                close to home.
                            </span>
                        </h1>

                        <p className="qf-rise mt-6 max-w-xl text-lg leading-relaxed text-slate-200" style={{ animationDelay: "0.12s" }}>
                            QuickFix connects you with verified Basotho service
                            providers for home repairs, electrical work,
                            plumbing, auto care, technology and beauty. Request a
                            service, compare offers and hire with confidence —
                            all across Maseru, Berea, Leribe and beyond.
                        </p>

                        <div className="qf-rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "0.18s" }}>
                            <Button
                                size="lg"
                                onClick={() => navigate("/register")}
                                className="w-full shadow-lg shadow-indigo-500/30 sm:w-auto"
                            >
                                Get started — it's free
                                <Icon name="arrowRight" className="h-4 w-4" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full border-white/30 bg-white/10 text-white hover:border-white/50 hover:bg-white/15 sm:w-auto"
                                onClick={() => navigate("/login")}
                            >
                                Log in to the marketplace
                            </Button>
                        </div>

                        {/* Districts */}
                        <div className="qf-rise mt-8 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5" style={{ animationDelay: "0.24s" }}>
                            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
                                Serving
                            </span>
                            {DISTRICTS.map((district) => (
                                <span
                                    key={district}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-100 backdrop-blur"
                                >
                                    <Icon
                                        name="location"
                                        className="h-3 w-3 text-indigo-300"
                                    />
                                    {district}
                                </span>
                            ))}
                        </div>

                        {/* Stats */}
                        {stats.length > 0 && (
                            <dl className="qf-rise mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4" style={{ animationDelay: "0.3s" }}>
                                {stats.map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur"
                                    >
                                        <dt className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                                            {stat.value}
                                        </dt>
                                        <dd className="mt-0.5 text-xs font-medium uppercase tracking-wide text-indigo-100/80">
                                            {stat.label}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </div>

                    {/* Visual */}
                    <div className="relative">
                        <div className="qf-rise relative mx-auto max-w-md lg:max-w-none" style={{ animationDelay: "0.2s" }}>
                            <div className="overflow-hidden rounded-3xl shadow-2xl shadow-black/40 ring-1 ring-white/20">
                                <SmartImage
                                    src={heroEngineerImage}
                                    alt="Verified electrician working on a job in Lesotho"
                                    seed="engineer at work"
                                    icon="bolt"
                                    eager
                                    fetchPriority="high"
                                    className="h-80 w-full object-cover object-[center_25%] sm:h-[26rem] lg:h-[30rem]"
                                />
                            </div>

                            {/* Floating card: verified */}
                            <div className="absolute -left-3 top-8 hidden gap-3 rounded-2xl border border-white/15 bg-slate-900/85 p-4 shadow-xl backdrop-blur sm:flex">
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                                    <Icon
                                        name="checkBadge"
                                        className="h-6 w-6"
                                    />
                                </span>
                                <div>
                                    <p className="text-sm font-bold text-white">
                                        Fully verified
                                    </p>
                                    <p className="text-xs text-slate-300">
                                        Background & trade checked
                                    </p>
                                </div>
                            </div>

                            {/* Floating card: rating */}
                            {rating !== null && (
                                <div className="absolute -bottom-5 right-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-900/85 p-4 shadow-xl backdrop-blur">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                                        <Icon name="star" className="h-6 w-6" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-white">
                                            {rating.toFixed(1)} / 5
                                        </p>
                                        <p className="text-xs text-slate-300">
                                            From {overview.completedJobs} completed
                                            jobs
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================== OFFERINGS ============================== */}
            <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 md:-mt-14 relative z-10">
                <div className="grid gap-6 lg:grid-cols-3">
                    {OFFERINGS.map((offering) => (
                        <div
                            key={offering.title}
                            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl"
                        >
                            <div className="relative h-52 overflow-hidden">
                                <SmartImage
                                    src={offering.image}
                                    alt={offering.title}
                                    seed={offering.seed}
                                    icon={offering.icon}
                                    className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${offering.obj ?? "object-center"}`}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                                <span className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 text-indigo-600 shadow-lg">
                                    <Icon name={offering.icon} className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="p-6">
                                <h2 className="text-lg font-bold text-slate-900">
                                    {offering.title}
                                </h2>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    {offering.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ============================== CATEGORIES ============================== */}
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                            Marketplace
                        </p>
                        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                            Services you can request
                        </h2>
                        <p className="mt-2 max-w-xl text-sm text-slate-500">
                            Providers advertise under the categories below. The
                            full catalogue is available after you log in.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => navigate("/login")}
                    >
                        Browse the marketplace
                        <Icon name="arrowRight" className="h-4 w-4" />
                    </Button>
                </div>

                {categories.length === 0 ? (
                    <div className="mt-10 flex justify-center">
                        <Spinner />
                    </div>
                ) : (
                    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {categories.map((category) => {
                            const visual = CATEGORY_VISUAL[category.name] || {};
                            const image = visual.src || getCategoryImage(category);
                            return (
                                <div
                                    key={category.id}
                                    className="group relative h-44 overflow-hidden rounded-2xl shadow-sm transition hover:shadow-xl"
                                >
                                    <SmartImage
                                        src={image}
                                        alt={category.name}
                                        seed={category.name}
                                        icon={visual.icon || "grid"}
                                        className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${visual.obj ?? "object-center"}`}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
                                    <div className="absolute inset-x-0 bottom-0 p-4">
                                        <h3 className="text-lg font-bold text-white">
                                            {category.name}
                                        </h3>
                                        <p className="mt-0.5 text-xs text-slate-200 line-clamp-1">
                                            {category.description}
                                        </p>
                                    </div>
                                    {category.services?.length > 0 && (
                                        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-indigo-700 shadow">
                                            {category.services.length} services
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ============================== HOW IT WORKS ============================== */}
            <section id="how-it-works" className="bg-slate-50 py-16 sm:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                            For customers
                        </p>
                        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                            How it works
                        </h2>
                    </div>

                    <div className="relative mt-10 grid gap-6 lg:grid-cols-3">
                        <div
                            className="absolute left-0 right-0 top-1/2 hidden h-0.5 -translate-y-1/2 bg-gradient-to-r from-transparent via-indigo-200 to-transparent lg:block"
                            aria-hidden="true"
                        />
                        {CUSTOMER_STEPS.map((step, index) => (
                            <div
                                key={step.title}
                                className="relative rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
                            >
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200">
                                    <Icon name={step.icon} className="h-6 w-6" />
                                </div>
                                <span className="absolute -top-3 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shadow">
                                    {index + 1}
                                </span>
                                <h3 className="mt-4 text-lg font-bold text-slate-900">
                                    {step.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================== FOR BUSINESSES ============================== */}
            <section id="for-businesses" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 sm:py-20">
                <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 lg:grid lg:grid-cols-2">
                    <div className="relative max-h-96 lg:max-h-none">
                        <SmartImage
                            src={businessImage}
                            alt="A local store advertising the products they sell on QuickFix"
                            seed="storefront"
                            icon="building"
                            className="h-56 w-full object-cover object-center lg:h-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/40" />
                    </div>
                    <div className="p-8 sm:p-12">
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                            For stores & cafés
                        </p>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                            Are you a store, cafe or growing business?
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-slate-300">
                            QuickFix lets businesses advertise the products they
                            sell. Customers browse your listings and contact
                            your store directly.
                        </p>

                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                            {STORE_FEATURES.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                                >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                                        <Icon name={feature.icon} className="h-5 w-5" />
                                    </span>
                                    <h3 className="mt-3 text-sm font-bold text-white">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button
                                size="lg"
                                variant="secondary"
                                onClick={() => navigate("/register")}
                            >
                                Register your business
                            </Button>
                            <Button
                                size="lg"
                                variant="ghost"
                                className="text-white hover:bg-white/10"
                                onClick={() => navigate("/login")}
                            >
                                Log in as a business
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================== TRUST ============================== */}
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                    Built on trust
                </h2>
                <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
                    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <Icon name="shield" className="h-6 w-6" />
                        </span>
                        <h3 className="mt-3 font-bold text-slate-900">
                            Verified providers
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Providers are verified before they can offer services.
                        </p>
                    </div>
                    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                            <Icon name="star" className="h-6 w-6" />
                        </span>
                        <h3 className="mt-3 font-bold text-slate-900">
                            Honest reviews
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Workmanship is rated after every completed job.
                        </p>
                    </div>
                    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                            <Icon name="file" className="h-6 w-6" />
                        </span>
                        <h3 className="mt-3 font-bold text-slate-900">
                            Transparent offers
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Compare quotes, timelines and history before you hire.
                        </p>
                    </div>
                </div>
            </section>

            {/* ============================== CTA ============================== */}
            <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-14 text-center shadow-2xl shadow-indigo-300/40 sm:px-12">
                    <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                    <div className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                    <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                        Ready to get your job done?
                    </h2>
                    <p className="relative mx-auto mt-3 max-w-xl text-indigo-100">
                        Create your free account to request a service, browse
                        providers and see the full catalogue today.
                    </p>
                    <div className="relative mt-7 flex justify-center">
                        <Button
                            size="lg"
                            variant="secondary"
                            onClick={() => navigate("/register")}
                            className="shadow-xl"
                        >
                            Create a free account
                            <Icon name="arrowRight" className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;