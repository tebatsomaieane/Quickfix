import SmartImage from "./SmartImage";

function ProviderAvatar({ name, image, size = "md", seed = "" }) {
    const initials = (name || "?")
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const sizeClasses = {
        sm: "h-10 w-10 text-sm",
        md: "h-14 w-14 text-lg",
        lg: "h-24 w-24 text-3xl",
        xl: "h-32 w-32 text-4xl"
    };

    if (image) {
        return (
            <SmartImage
                src={image}
                alt={name}
                seed={seed || name}
                className={`rounded-full object-cover ring-2 ring-white shadow ${sizeClasses[size]}`}
            />
        );
    }

    return (
        <span
            className={`flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-semibold text-white shadow ring-2 ring-white ${sizeClasses[size]}`}
        >
            {initials}
        </span>
    );
}

export default ProviderAvatar;