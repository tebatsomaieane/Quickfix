import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchProvider } from "../../services/catalogueService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import RatingStars from "../../components/ui/RatingStars";
import ProviderAvatar from "../../components/ui/ProviderAvatar";
import VerificationBadge from "../../components/ui/VerificationBadge";
import Icon from "../../components/ui/Icon";
import SmartImage from "../../components/ui/SmartImage";
import { getProviderPortrait, getProviderCover } from "../../lib/visuals";

const DAY_LABELS = {
    MONDAY: "Mon",
    TUESDAY: "Tue",
    WEDNESDAY: "Wed",
    THURSDAY: "Thu",
    FRIDAY: "Fri",
    SATURDAY: "Sat",
    SUNDAY: "Sun"
};

function ProviderProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const isAdmin = user?.role === "ADMIN";
    const providersListPath = isAdmin
        ? "/admin/providers"
        : "/customer/providers";

    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");

            try {
                const data = await fetchProvider(id);

                if (!cancelled) {
                    setProvider(data.data);
                }
            } catch {
                if (!cancelled) {
                    setError(
                        "Unable to load this provider's profile."
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
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Spinner />
            </div>
        );
    }

    if (error || !provider) {
        return (
            <EmptyState
                title="Provider not found"
                description={error}
                action={
                    <Button variant="outline">
                        <Link to={providersListPath}>
                            Back to providers
                        </Link>
                    </Button>
                }
            />
        );
    }

    const providerIndex = Number(id) || 0;

    return (
        <div>
            {/* Cover banner */}
            <div className="relative h-44 overflow-hidden rounded-3xl shadow-sm sm:h-56">
                <SmartImage
                    src={getProviderCover(provider, providerIndex)}
                    alt={`${provider.first_name} at work`}
                    seed={`${provider.first_name} ${provider.last_name}`}
                    icon="wrench"
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white">
                    <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold shadow">
                        {provider.verification_status === "APPROVED"
                            ? "Verified provider"
                            : "Provider"}
                    </span>
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">
                        {provider.completed_jobs || 0} jobs completed
                    </span>
                </div>
            </div>

            {/* Header card */}
            <Card className="p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="-mt-16 sm:-mt-20">
                        <ProviderAvatar
                            name={`${provider.first_name} ${provider.last_name}`}
                            image={getProviderPortrait(provider, providerIndex)}
                            seed={`${provider.first_name} ${provider.last_name}`}
                            size="xl"
                            className="border-4 border-white shadow-xl"
                        />
                    </div>

                    <div className="flex-1 pt-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                                {provider.first_name} {provider.last_name}
                            </h1>
                            <VerificationBadge
                                verified={
                                    provider.verification_status === "APPROVED"
                                }
                            />
                        </div>

                        <RatingStars
                            rating={provider.rating}
                            className="mt-1"
                        />

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                                <Icon
                                    name="location"
                                    className="h-4 w-4 text-slate-400"
                                />
                                {provider.location || "Location TBD"}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Icon
                                    name="clock"
                                    className="h-4 w-4 text-slate-400"
                                />
                                {provider.experience_years || 0} years experience
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Icon
                                    name="checkCircle"
                                    className="h-4 w-4 text-slate-400"
                                />
                                {provider.completed_jobs || 0} jobs completed
                            </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {provider.services.slice(0, 4).map((service) => (
                                <span
                                    key={service.id}
                                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
                                >
                                    {service.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {user?.role === "CUSTOMER" && (
                        <div className="sm:text-right">
                            <Button
                                onClick={() =>
                                    navigate("/customer/requests/new")
                                }
                            >
                                Request this provider
                            </Button>
                        </div>
                    )}
                </div>

                {provider.description && (
                    <p className="mt-5 border-t border-slate-100 pt-5 text-slate-700">
                        {provider.description}
                    </p>
                )}
            </Card>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                {/* Services & pricing */}
                <Card className="p-6 lg:col-span-2">
                    <h2 className="font-semibold text-slate-900">
                        Services & pricing
                    </h2>

                    <ul className="mt-4 divide-y divide-slate-100">
                        {provider.services.map((service) => (
                            <li
                                key={service.id}
                                className="flex items-center justify-between py-3"
                            >
                                <div>
                                    <p className="font-medium text-slate-900">
                                        {service.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {service.category_name}
                                    </p>
                                </div>
                                <span className="font-semibold text-slate-900">
                                    M{Number(service.price).toFixed(2)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Card>

                {/* Availability */}
                <Card className="h-fit p-6">
                    <h2 className="font-semibold text-slate-900">
                        Availability
                    </h2>

                    <ul className="mt-4 space-y-2">
                        {provider.availability.length === 0 ? (
                            <li className="text-sm text-slate-500">
                                Availability not shared yet.
                            </li>
                        ) : (
                            provider.availability.map((slot) => (
                                <li
                                    key={slot.day_of_week}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span className="font-medium text-slate-700">
                                        {DAY_LABELS[slot.day_of_week]}
                                    </span>
                                    <span className="text-slate-600">
                                        {slot.start_time}-{slot.end_time}
                                    </span>
                                </li>
                            ))
                        )}
                    </ul>
                </Card>
            </div>

            {/* Reviews */}
            <div className="mt-6">
                <h2 className="font-semibold text-slate-900">
                    Reviews ({provider.reviews.length})
                </h2>

                {provider.reviews.length === 0 ? (
                    <Card className="mt-4 p-6 text-sm text-slate-500">
                        No reviews yet. Jobs will show up here once completed.
                    </Card>
                ) : (
                    <div className="mt-4 space-y-4">
                        {provider.reviews.map((review) => (
                            <Card key={review.id} className="p-5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <ProviderAvatar
                                            name={`${review.first_name} ${review.last_name}`}
                                            size="sm"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900">
                                                    {review.first_name}{" "}
                                                    {review.last_name}
                                                </span>
                                                <RatingStars
                                                    rating={review.rating}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-400">
                                                {new Date(
                                                    review.created_at
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {review.comment && (
                                    <p className="mt-3 text-sm text-slate-600">
                                        {review.comment}
                                    </p>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProviderProfile;