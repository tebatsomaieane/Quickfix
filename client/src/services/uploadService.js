import api from "./api";

// Media is always uploaded through the QuickFix API, which stores files
// on its own disk (the frontend host has no persistent storage).
//
// Returns the API's uploaded file record: { url, filename, size,
// mimeType, kind }.
export async function uploadMedia(file, onProgress) {
    const form = new FormData();
    form.append("file", file);

    const response = await api.post("/uploads", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
            if (onProgress && event.total) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        }
    });

    return response.data.data;
}