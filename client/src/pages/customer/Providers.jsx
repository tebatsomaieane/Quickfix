import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchProviders } from "../../services/catalogueService";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import RatingStars from "../../components/ui/RatingStars";
import ProviderAvatar from "../../components/ui/ProviderAvatar";
import VerificationBadge from "../../components/ui/VerificationBadge";
import Icon from "../../components/ui/Icon";
import { getProviderPortrait } from "../../lib/visuals";

function Providers() {
    const [searchParams] = useSearchParams();

    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [verifiedOnly, setVerifiedOnly] = useState(false);

    const serviceId = searchParams.get("service_id") || undefined;

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");

            try {
                const data = await fetchProviders({
                    search: search || undefined,
                    serviceId,
                    verified: verifiedOnly || undefined
                });

                if (!cancelled) {
                    setProviders(data.data);
                }
            } catch {
                if (!cancelled) {
                    setError(
                        "Unable to load providers. Please try again later."
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
    }, [search, serviceId, verifiedOnly]);

    return (
        <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        Find a provider
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Browse the trusted service providers working with
                        QuickFix customers.
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
                            placeholder="Search by name, trade or service..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Search providers"
                            className="pl-9"
                        />
                    </div>
                </div>
            </div>

            {/* Verified toggle */}
            <div className="mt-5 flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={[
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                        verifiedOnly
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    ].join(" ")}
                >
                    <Icon name="checkBadge" className="h-4 w-4" />
                    Verified providers only
                </button>
                {verifiedOnly && (
                    <span className="text-sm text-slate-500">
                        Showing providers checked by our team
                    </span>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Spinner />
                </div>
            ) : error ? (
                <EmptyState title="Something went wrong" description={error} />
            ) : providers.length === 0 ? (
                <EmptyState
                    title="No providers found"
                    description="Try adjusting your search or filters."
                />
            ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {providers.map((provider, index) => (
                        <Link
                            key={provider.id}
                            to={`/customer/providers/${provider.id}`}
                        >
                            <Card className="flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg">
                                <div className="flex items-start gap-3">
                                    <ProviderAvatar
                                        name={`${provider.first_name} ${provider.last_name}`}
                                        image={getProviderPortrait(provider, index)}
                                        seed={`${provider.first_name} ${provider.last_name}`}
                                        size="md"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-bold text-slate-900">
                                                {provider.first_name}{" "}
                                                {provider.last_name}
                                            </h3>
                                            <VerificationBadge
                                                verified={
                                                    provider.verification_status ===
                                                    "APPROVED"
                                                }
                                            />
                                        </div>

                                        <RatingStars
                                            rating={provider.rating}
                                            className="mt-0.5"
                                        />
                                    </div>
                                </div>

                                <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                                    {provider.description ||
                                        "Professional service provider."}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {provider.services
                                        .slice(0, 3)
                                        .map((service) => (
                                            <Badge key={service.id} color="indigo">
                                                {service.name}
                                            </Badge>
                                        ))}
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-500">
                                    <span className="inline-flex items-center gap-1">
                                        <Icon name="location" className="h-4 w-4 text-slate-400" />
                                        {provider.location || "Location TBD"}
                                    </span>
                                    <span className="font-medium">
                                        <strong className="font-bold text-slate-900">
                                            {provider.completed_jobs}
                                        </strong>{" "}
                                        jobs done
                                    </span>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Providers;