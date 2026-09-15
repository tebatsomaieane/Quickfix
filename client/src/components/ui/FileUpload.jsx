import { useRef, useState } from "react";
import Icon from "./Icon";
import Button from "./Button";
import { uploadMedia } from "../../services/uploadService";

// Reusable photo/video uploader. Uploads go straight to the QuickFix API
// (which stores media on its own disk) and the resulting public URL is
// reported back through `onChange`.
//
// Props:
//   value    - current stored URL (string) or ""
//   onChange - called with the new URL string, or "" when removed
//   kind     - "image" | "video"
//   label    - optional field label
//   hint     - optional helper text below the control
function FileUpload({
    value,
    onChange,
    kind = "image",
    label,
    hint,
    className = ""
}) {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");

    const accept = kind === "video" ? "video/*" : "image/*";

    const handleFile = async (file) => {
        if (!file) return;

        setError("");
        setProgress(0);
        setUploading(true);

        try {
            const record = await uploadMedia(file, setProgress);
            onChange(record.url);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Upload failed. Please try again."
            );
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={className}>
            {label && (
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    {label}
                </span>
            )}

            {uploading ? (
                <div className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    <div className="flex-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                                className="h-full rounded-full bg-indigo-600 transition-all duration-150"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                        {progress}%
                    </span>
                </div>
            ) : value ? (
                <div className="relative">
                    {kind === "video" ? (
                        <video
                            src={value}
                            controls
                            className="h-44 w-full rounded-lg border border-slate-200 bg-black object-contain"
                        />
                    ) : (
                        <img
                            src={value}
                            alt={label || "Uploaded image"}
                            className="h-44 w-full rounded-lg border border-slate-200 object-cover"
                        />
                    )}
                    <div className="absolute right-2 top-2 flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => inputRef.current?.click()}
                            className="bg-white"
                        >
                            <Icon name="image" className="h-4 w-4" />
                            Replace
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                                setError("");
                                onChange("");
                            }}
                        >
                            <Icon name="trash" className="h-4 w-4" />
                            Remove
                        </Button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
                >
                    <Icon
                        name={kind === "video" ? "monitor" : "image"}
                        className="h-8 w-8"
                    />
                    <span className="text-sm font-medium">
                        {kind === "video"
                            ? "Choose a video"
                            : "Choose a photo"}
                    </span>
                    <span className="text-xs text-slate-400">
                        Uploads are stored securely by QuickFix (max 50 MB)
                    </span>
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    e.target.value = "";
                }}
            />

            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            {!error && hint && (
                <p className="mt-1 text-sm text-slate-500">{hint}</p>
            )}
        </div>
    );
}

export default FileUpload;