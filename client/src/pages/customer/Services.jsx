import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { fetchCategories, fetchServices } from "../../services/catalogueService";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import SmartImage from "../../components/ui/SmartImage";
import { getCategoryImage, getServiceImage } from "../../lib/visuals";

function Services() {
    const navigate = useNavigate();
    const { categoryId } = useParams();
    const [searchParams] = useSearchParams();

    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const activeCategoryId = categoryId
        ? Number(categoryId)
        : searchParams.get("category_id")
            ? Number(searchParams.get("category_id"))
            : null;

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");

            try {
                const [categoriesData, servicesData] = await Promise.all([
                    fetchCategories(),
                    fetchServices({
                        categoryId: activeCategoryId,
                        search: search || undefined
                    })
                ]);

                if (!cancelled) {
                    setCategories(categoriesData.data);
                    setServices(servicesData.data);
                }
            } catch {
                if (!cancelled) {
                    setError(
                        "Unable to load services. Please try again later."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [activeCategoryId, search]);

    const activeCategory = categories.find(
        (category) => category.id === activeCategoryId
    );

    return (
        <div>
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        {activeCategory ? activeCategory.name : "Services"}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Pick a service, then find the provider that fits your
                        job.
                    </p>
                </div>
                <div className="w-full max-w-xs">
                    <div className="relative">
                        <Icon
                            name="search"
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        />
                        <Input
                            type="search"
                            placeholder="Search services..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Search services"
                            className="pl-9"
                        />
                    </div>
                </div>
            </div>

            {/* Category image tabs */}
            <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
                <button
                    type="button"
                    onClick={() => navigate("/customer/services")}
                    className={[
                        "group shrink-0 overflow-hidden rounded-2xl border-2 transition",
                        !activeCategoryId
                            ? "border-indigo-600 ring-2 ring-indigo-600/20"
                            : "border-transparent hover:border-indigo-300"
                    ].join(" ")}
                >
                    <span className="flex h-20 w-28 items-center justify-center bg-slate-100 text-sm font-bold text-slate-700">
                        All services
                    </span>
                </button>

                {categories.map((category) => (
                    <button
                        key={category.id}
                        type="button"
                        onClick={() =>
                            navigate(`/customer/services/${category.id}`)
                        }
                        className={[
                            "group relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl border-2 transition",
                            activeCategoryId === category.id
                                ? "border-indigo-600 ring-2 ring-indigo-600/20"
                                : "border-transparent hover:border-indigo-300"
                        ].join(" ")}
                    >
                        <SmartImage
                            src={getCategoryImage(category)}
                            alt={category.name}
                            seed={category.name}
                            icon="grid"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                        <p className="absolute inset-x-0 bottom-0 p-2 text-left text-[11px] font-bold leading-tight text-white">
                            {category.name}
                        </p>
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Spinner />
                </div>
            ) : error ? (
                <EmptyState title="Something went wrong" description={error} />
            ) : services.length === 0 ? (
                <EmptyState
                    title="No services found"
                    description="Try a different search or category."
                />
            ) : (
                <>
                    <p className="mb-4 mt-6 text-sm text-slate-500">
                        <strong className="text-slate-900">{services.length}</strong>{" "}
                        {services.length === 1 ? "service" : "services"} available
                        {activeCategory ? ` in ${activeCategory.name}` : ""}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {services.map((service) => (
                            <button
                                key={service.id}
                                type="button"
                                onClick={() =>
                                    navigate(
                                        `/customer/providers?service_id=${service.id}`
                                    )
                                }
                                className="group text-left"
                            >
                                <Card className="flex h-full flex-col overflow-hidden p-0 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg">
                                    <div className="relative h-32 overflow-hidden">
                                        <SmartImage
                                            src={getServiceImage(service)}
                                            alt={service.name}
                                            seed={service.name}
                                            icon="wrench"
                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                                        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow">
                                            {service.category_name}
                                        </span>
                                    </div>
                                    <div className="flex flex-1 flex-col p-5">
                                        <h3 className="font-bold text-slate-900">
                                            {service.name}
                                        </h3>
                                        {service.description && (
                                            <p className="mt-1 flex-1 text-sm text-slate-600 line-clamp-2">
                                                {service.description}
                                            </p>
                                        )}
                                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition group-hover:gap-2.5">
                                            Find providers
                                            <Icon name="arrowRight" className="h-4 w-4" />
                                        </span>
                                    </div>
                                </Card>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default Services;