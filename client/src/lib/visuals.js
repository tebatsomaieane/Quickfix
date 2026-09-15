// QuickFix media helpers.
//
// The platform is 100% real-user content: every photo, video and
// portrait is uploaded by a Basotho user through the app. Nothing on
// the site points to generic stock photography, and no user is ever
// shown a stock person's picture.
//
// When a record has no uploaded media yet, these helpers return null
// and the UI renders a branded gradient + icon placeholder (see
// SmartImage) or initials for people (see ProviderAvatar).

const slugify = (value) =>
    String(value || "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const hashCode = (value) => {
    let hash = 0;

    for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }

    return Math.abs(hash);
};

// Deterministic gradient for image fallback tiles.
export const gradientFor = (name = "", hueShift = 0) => {
    const hash = hashCode(slugify(name) || "placeholder");
    const hue1 = (hash + hueShift) % 360;
    const hue2 = (hue1 + 40 + (hash % 60)) % 360;

    return `linear-gradient(135deg, hsl(${hue1} 72% 56%) 0%, hsl(${hue2} 78% 42%) 100%)`;
};

export const getServiceImage = (service) => service?.image || null;

export const getCategoryImage = (category) => category?.image || null;

export const getProductImage = (product) => product?.image || null;

export const getBusinessImage = (business) =>
    business?.cover_image || business?.logo || null;

// People are only ever shown a photo they uploaded themselves.
export const getProviderPortrait = (provider) =>
    provider?.profile_image || null;

export const getProviderCover = (provider) =>
    provider?.cover_image || null;