import { useEffect, useState } from "react";
import {
    fetchVerificationStatus,
    requestVerification
} from "../../services/verificationService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Textarea from "../../components/ui/Textarea";
import Spinner from "../../components/ui/Spinner";
import FileUpload from "../../components/ui/FileUpload";
import { formatDate } from "../../lib/format";

const STATUS_COLORS = {
    PENDING: "amber",
    UNDER_REVIEW: "blue",
    APPROVED: "green",
    REJECTED: "red"
};

const STATUS_INFO = {
    PENDING: "Your verification request is waiting for the admin team to review it.",
    UNDER_REVIEW: "An admin is reviewing your verification request. This can take a little while.",
    APPROVED: "Your profile is verified. Customers can see the verified badge next to your name.",
    REJECTED: "Your verification request was rejected. Update your information below and resubmit."
};

function Verification() {
    const [verification, setVerification] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        identity_information: "",
        professional_information: "",
        qualification_information: "",
        document_url: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [formError, setFormError] = useState("");

    const load = () => {
        setLoading(true);
        setError("");

        fetchVerificationStatus()
            .then((data) => setVerification(data.data))
            .catch(() =>
                setError("Unable to load your verification status.")
            )
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const status = verification?.verification_status;
    const pendingReview = !!verification?.request;

    const canRequest =
        !status ||
        status === "PENDING" ||
        status === "REJECTED";

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        setSubmitting(true);

        try {
            await requestVerification(form);
            setForm({
                identity_information: "",
                professional_information: "",
                qualification_information: "",
                document_url: ""
            });
            setShowForm(false);
            load();
        } catch (err) {
            setFormError(
                err.response?.data?.message ||
                    "Request could not be submitted."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                    Verification
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Get your profile verified so customers can trust you.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Spinner />
                </div>
            ) : error ? (
                <Card className="p-6">
                    <p className="text-sm text-red-600">{error}</p>
                </Card>
            ) : (
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="font-semibold text-slate-900">
                                        Verification status
                                    </h2>
                                    <Badge
                                        color={STATUS_COLORS[status] || "gray"}
                                    >
                                        {status
                                            ? status
                                                  .toLowerCase()
                                                  .replace("_", " ")
                                            : "not requested"}
                                    </Badge>
                                </div>
                                <p className="mt-2 max-w-xl text-sm text-slate-600">
                                    {STATUS_INFO[status] ||
                                        "Submit your details below to start the verification process."}
                                </p>

                                {verification?.request?.admin_notes && (
                                    <div className="mt-4 rounded-lg bg-slate-50 p-4">
                                        <p className="text-sm font-medium text-slate-700">
                                            Admin notes
                                        </p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {verification.request.admin_notes}
                                        </p>
                                    </div>
                                )}

                                {verification?.request &&
                                    status !== "APPROVED" && (
                                        <p className="mt-3 text-xs text-slate-400">
                                            Submitted {formatDate(
                                                verification.request.created_at
                                            )}
                                        </p>
                                    )}
                            </div>

                            {canRequest && !pendingReview && (
                                <Button
                                    variant={showForm ? "secondary" : "primary"}
                                    onClick={() => setShowForm((v) => !v)}
                                >
                                    {showForm ? "Close form" : "Request verification"}
                                </Button>
                            )}
                        </div>
                    </Card>

                    {showForm && canRequest && !pendingReview && (
                        <Card className="p-6">
                            <h2 className="font-semibold text-slate-900">
                                Submit verification details
                            </h2>

                            {formError && (
                                <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {formError}
                                </p>
                            )}

                            <form
                                onSubmit={handleSubmit}
                                className="mt-5 space-y-4"
                            >
                                <div>
                                    <label
                                        htmlFor="identity"
                                        className="mb-1.5 block text-sm font-medium text-slate-700"
                                    >
                                        Identity information
                                    </label>
                                    <Textarea
                                        id="identity"
                                        name="identity_information"
                                        rows="2"
                                        placeholder="e.g. National ID / passport number and name used on it"
                                        value={form.identity_information}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="professional"
                                        className="mb-1.5 block text-sm font-medium text-slate-700"
                                    >
                                        Professional information
                                    </label>
                                    <Textarea
                                        id="professional"
                                        name="professional_information"
                                        rows="2"
                                        placeholder="e.g. Years of experience, licences held, insurance"
                                        value={form.professional_information}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="qualification"
                                        className="mb-1.5 block text-sm font-medium text-slate-700"
                                    >
                                        Qualification information
                                    </label>
                                    <Textarea
                                        id="qualification"
                                        name="qualification_information"
                                        rows="2"
                                        placeholder="e.g. Certificates, diplomas or apprenticeship records"
                                        value={form.qualification_information}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <FileUpload
                                    label="Supporting document"
                                    kind="image"
                                    value={form.document_url}
                                    onChange={(url) =>
                                        setForm({
                                            ...form,
                                            document_url: url
                                        })
                                    }
                                    hint="Upload a photo of your certificate, qualification or ID (required)."
                                />

                                <Button type="submit" loading={submitting}>
                                    Submit request
                                </Button>
                            </form>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

export default Verification;