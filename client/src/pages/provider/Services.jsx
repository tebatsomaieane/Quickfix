import { useEffect, useState } from "react";
import { fetchCategories, fetchServices } from "../../services/catalogueService";
import { updateProviderServices } from "../../services/providerService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";

function ProviderServices() {
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [selected, setSelected] = useState({});
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([fetchCategories(), fetchServices()])
            .then(([cats, serv]) => {
                setCategories(cats.data);
                setServices(serv.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const servicesByCategory = (categoryId) =>
        services.filter((s) => s.category_id === categoryId);

    const toggleService = (service) => {
        setSelected((prev) => {
            const next = { ...prev };
            if (next[service.id]) {
                delete next[service.id];
            } else {
                next[service.id] = { service_id: service.id, price: "" };
            }
            return next;
        });
    };

    const handlePrice = (serviceId, price) => {
        setSelected((prev) => ({
            ...prev,
            [serviceId]: { ...prev[serviceId], price }
        }));
    };

    const handleSave = async () => {
        setMessage("");
        setError("");
        setSaving(true);
        try {
            const payload = Object.values(selected).map((entry) => ({
                service_id: entry.service_id,
                price: entry.price ? Number(entry.price) : null
            }));

            const data = await updateProviderServices(payload);
            if (data.success) {
                setMessage("Services saved. Customers can now find you for these services.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save services.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Spinner /></div>;
    }

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Services</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Choose the services you offer and set your prices.
                    </p>
                </div>
                <Button onClick={handleSave} loading={saving}>
                    Save services
                </Button>
            </div>

            {message && (
                <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                    {message}
                </div>
            )}

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="space-y-6">
                {categories.map((category) => {
                    const catServices = servicesByCategory(category.id);
                    if (!catServices.length) return null;

                    const checkedCount = catServices.filter(
                        (s) => selected[s.id]
                    ).length;

                    return (
                        <Card key={category.id} className="p-5">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-slate-900">{category.name}</h3>
                                <span className="text-xs text-slate-400">
                                    {checkedCount} of {catServices.length} selected
                                </span>
                            </div>

                            <div className="mt-4 space-y-3">
                                {catServices.map((service) => {
                                    const isChecked = Boolean(selected[service.id]);
                                    const entry = selected[service.id];

                                    return (
                                        <div key={service.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 p-3">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id={`service-${service.id}`}
                                                    checked={isChecked}
                                                    onChange={() => toggleService(service)}
                                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <div>
                                                    <label htmlFor={`service-${service.id}`} className="font-medium text-slate-800">
                                                        {service.name}
                                                    </label>
                                                    {service.description && (
                                                        <p className="text-xs text-slate-500">{service.description}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-slate-400">LSL</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        disabled={!isChecked}
                                                        placeholder="0.00"
                                                        value={entry?.price ?? ""}
                                                        onChange={(e) => handlePrice(service.id, e.target.value)}
                                                        className="w-32 rounded-lg border border-slate-300 py-2 pl-12 pr-3 text-sm disabled:bg-slate-50 disabled:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    );
                })}

                {categories.length === 0 && (
                    <EmptyState
                        title="No services available"
                        description="There are no services to select yet."
                    />
                )}
            </div>
        </div>
    );
}

export default ProviderServices;