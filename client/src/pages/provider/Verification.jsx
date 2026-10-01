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
import useActionFeedback from "../../hooks/useActionFeedback";
import { rules } from "../../lib/validation";
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

const INITIAL_VALUES = {
    identity_information: "",
    professional_information: "",
    qualification_information: "",
    document_url: ""
};

/**
 * Mirrors `content.verificationRequest` on the server.
 *
 * The minimum lengths are the point of the rule: an admin can only approve or
 * reject this on the evidence, so a one-line "I am who I am" wastes a review
 * cycle. Saying it here saves the round trip.
 *
 * `document_url` needs no format check because the only thing that can set it is
 * the app's own uploader, which always stores an absolute http(s) URL.
 */
const SCHEMA = {
    identity_information: [
        rules.required("Identity information"),
        rules.minLength(
            20,
            "Include the ID or passport number and the name on it (at least 20 characters)"
        ),
        rules.maxLength(5000, "Identity information is too long")
    ],
    professional_information: [
        rules.required("Professional information"),
        rules.minLength(
            20,
            "Describe your experience, licences or insurance (at least 20 characters)"
        ),
        rules.maxLength(5000, "Professional information is too long")
    ],
    qualification_information: [
        rules.required("Qualification information"),
        rules.minLength(
            10,
            "List your certificates or training (at least 10 characters)"
        ),
        rules.maxLength(5000, "Qualification information is too long")
    ],
    document_url: [
        rules.required("Supporting document"),
        rules.maxLength(500, "Document reference is too long")
    ]
};

function Verification() {
    const [verification, setVerification] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState("");

    const {
        values: form,
        fieldErrors,
        formError,
        announcement,
        pending: submitting,
        setValue,
        handleChange,
        handleBlur,
        validateAll,
        reset,
        run
    } = useActionFeedback({ schema: SCHEMA, initialValues: INITIAL_VALUES });

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

    const toggleForm = () => {
        setShowForm((visible) => {
            if (!visible) {
                // Reopening always starts clean, so an abandoned draft is never
                // resubmitted half-edited.
                reset(INITIAL_VALUES);
            }

            return !visible;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateAll(form)) {
            return;
        }

        const { ok } = await run(
            () =>
                requestVerification({
                    identity_information:
                        form.identity_information.trim(),
                    professional_information:
                        form.professional_information.trim(),
                    qualification_information:
                        form.qualification_information.trim(),
                    document_url: form.document_url
                }),
            {
                success:
                    "Verification requested. We'll review it and update you soon.",
                retry: true
            }
        );

        if (ok) {
            reset(INITIAL_VALUES);
            setShowForm(false);
            load();
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
                                    onClick={toggleForm}
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
                                <div
                                    role="alert"
                                    className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                                >
                                    {formError}
                                </div>
                            )}

                            <form
                                onSubmit={handleSubmit}
                                noValidate
                                className="mt-5 space-y-4"
                            >
                                <Textarea
                                    label="Identity information"
                                    id="identity_information"
                                    name="identity_information"
                                    rows="2"
                                    placeholder="e.g. National ID / passport number and name used on it"
                                    value={form.identity_information}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    maxLength={5000}
                                    error={fieldErrors.identity_information}
                                    required
                                />

                                <Textarea
                                    label="Professional information"
                                    id="professional_information"
                                    name="professional_information"
                                    rows="2"
                                    placeholder="e.g. Years of experience, licences held, insurance"
                                    value={form.professional_information}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    maxLength={5000}
                                    error={fieldErrors.professional_information}
                                    required
                                />

                                <Textarea
                                    label="Qualification information"
                                    id="qualification_information"
                                    name="qualification_information"
                                    rows="2"
                                    placeholder="e.g. Certificates, diplomas or apprenticeship records"
                                    value={form.qualification_information}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    maxLength={5000}
                                    error={fieldErrors.qualification_information}
                                    required
                                />

                                <FileUpload
                                    label="Supporting document"
                                    name="document_url"
                                    kind="image"
                                    value={form.document_url}
                                    onChange={(url) =>
                                        setValue("document_url", url)
                                    }
                                    hint="Upload a photo of your certificate, qualification or ID (required)."
                                    error={fieldErrors.document_url}
                                    required
                                />

                                <Button type="submit" loading={submitting}>
                                    Submit request
                                </Button>

                                <p aria-live="polite" className="sr-only">
                                    {announcement}
                                </p>
                            </form>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

export default Verification;