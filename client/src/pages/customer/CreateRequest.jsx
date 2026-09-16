import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchServices } from "../../services/catalogueService";
import { createRequest } from "../../services/requestService";
import { uploadMedia } from "../../services/uploadService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import Spinner from "../../components/ui/Spinner";
import Icon from "../../components/ui/Icon";

const MAX_ATTACHMENTS = 6;

function CreateRequest() {
    const navigate = useNavigate();

    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);

    const [formData, setFormData] = useState({
        service_id: "",
        title: "",
        description: "",
        location: "",
        preferred_date: "",
        preferred_time: "",
        budget_min: "",
        budget_max: ""
    });

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [attachments, setAttachments] = useState([]);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const mediaInputRef = useRef(null);

    const addFiles = async (files) => {
        const selected = Array.from(files || []).slice(
            0,
            MAX_ATTACHMENTS - attachments.length
        );

        if (selected.length === 0) {
            setError("You can attach up to 6 photos or videos.");
            return;
        }

        setError("");
        setUploadingMedia(true);

        try {
            const uploaded = [];

            for (const file of selected) {
                const kind = String(file.type || "").startsWith("video/")
                    ? "video"
                    : "image";
                const record = await uploadMedia(file);
                uploaded.push({ ...record, kind: record.kind || kind });
            }

            setAttachments((previous) => [...previous, ...uploaded]);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "One or more files failed to upload."
            );
        } finally {
            setUploadingMedia(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = await fetchServices();

                if (!cancelled) {
                    setServices(data.data);
                }
            } catch {
                if (!cancelled) {
                    setError("Unable to load services. Please refresh.");
                }
            } finally {
                if (!cancelled) {
                    setLoadingServices(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!formData.service_id) {
            setError("Please choose a service.");
            return;
        }

        const budgetMin = formData.budget_min
            ? Number(formData.budget_min)
            : null;
        const budgetMax = formData.budget_max
            ? Number(formData.budget_max)
            : null;

        if (
            budgetMin !== null &&
            budgetMax !== null &&
            budgetMin > budgetMax
        ) {
            setError(
                "Minimum budget cannot be greater than maximum budget."
            );
            return;
        }

        if (formData.preferred_date && formData.preferred_date < new Date().toISOString().slice(0, 10)) {
            setError("Preferred date cannot be in the past.");
            return;
        }

        setSubmitting(true);

        try {
            const data = await createRequest({
                service_id: formData.service_id,
                title: formData.title,
                description: formData.description,
                location: formData.location,
                preferred_date: formData.preferred_date || null,
                preferred_time: formData.preferred_time || null,
                budget_min: budgetMin,
                budget_max: budgetMax,
                attachments: attachments.map((attachment) => ({
                    url: attachment.url,
                    filename: attachment.filename,
                    mimeType: attachment.mimeType
                }))
            });

            if (data.success) {
                navigate(`/customer/requests/${data.data.id}`);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to create request. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingServices) {
        return (
            <div className="flex justify-center py-16">
                <Spinner />
            </div>
        );
    }

    const serviceOptions = services.map((service) => ({
        value: service.id,
        label: `${service.name} (${service.category_name})`
    }));

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                    New service request
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Describe what you need and providers will send you offers.
                </p>
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <Card className="max-w-2xl p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <Select
                        label="Service"
                        id="service_id"
                        name="service_id"
                        value={formData.service_id}
                        onChange={handleChange}
                        options={serviceOptions}
                        placeholder="Select a service"
                        required
                    />

                    <Input
                        label="Title"
                        id="title"
                        name="title"
                        placeholder="e.g. Leaking kitchen pipe"
                        value={formData.title}
                        onChange={handleChange}
                        hint="Short summary of the job (max 200 characters)."
                        maxLength="200"
                        required
                    />

                    <Textarea
                        label="Description"
                        id="description"
                        name="description"
                        rows={4}
                        placeholder="Describe the problem in detail so providers can give you accurate offers."
                        value={formData.description}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Location"
                        id="location"
                        name="location"
                        placeholder="e.g. Maseru"
                        value={formData.location}
                        onChange={handleChange}
                        required
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Preferred date"
                            id="preferred_date"
                            type="date"
                            name="preferred_date"
                            value={formData.preferred_date}
                            onChange={handleChange}
                        />
                        <Input
                            label="Preferred time"
                            id="preferred_time"
                            type="time"
                            name="preferred_time"
                            value={formData.preferred_time}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Budget minimum (M)"
                            id="budget_min"
                            type="number"
                            name="budget_min"
                            min="0"
                            step="0.01"
                            placeholder="e.g. 500"
                            value={formData.budget_min}
                            onChange={handleChange}
                        />
                        <Input
                            label="Budget maximum (M)"
                            id="budget_max"
                            type="number"
                            name="budget_max"
                            min="0"
                            step="0.01"
                            placeholder="e.g. 1000"
                            value={formData.budget_max}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <span className="mb-1.5 block text-sm font-medium text-slate-700">
                            Photos & videos
                        </span>
                        <p className="mb-3 text-sm text-slate-500">
                            Show the problem clearly — photos or short videos help
                            providers send accurate offers (up to 6 files, photos 10 MB / videos 50 MB each).
                        </p>

                        {attachments.length > 0 && (
                            <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {attachments.map((attachment, index) => (
                                    <div
                                        key={`${attachment.filename || attachment.url}-${index}`}
                                        className="group relative overflow-hidden rounded-lg border border-slate-200"
                                    >
                                        {attachment.kind === "video" ? (
                                            <video
                                                src={attachment.url}
                                                className="h-28 w-full bg-black object-contain"
                                                controls
                                            />
                                        ) : (
                                            <img
                                                src={attachment.url}
                                                alt="Attachment preview"
                                                className="h-28 w-full object-cover"
                                            />
                                        )}
                                        <button
                                            type="button"
                                            aria-label="Remove attachment"
                                            onClick={() =>
                                                setAttachments((previous) =>
                                                    previous.filter((_, i) => i !== index)
                                                )
                                            }
                                            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-red-600"
                                        >
                                            <Icon name="trash" className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {attachments.length < MAX_ATTACHMENTS && (
                            <button
                                type="button"
                                disabled={uploadingMedia}
                                onClick={() => mediaInputRef.current?.click()}
                                className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {uploadingMedia ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Icon name="plus" className="h-4 w-4" />
                                        Add photo or video
                                    </>
                                )}
                            </button>
                        )}

                        <input
                            ref={mediaInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                addFiles(e.target.files);
                                e.target.value = "";
                            }}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/customer/requests")}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" loading={submitting}>
                            {submitting ? "Posting..." : "Post request"}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

export default CreateRequest;