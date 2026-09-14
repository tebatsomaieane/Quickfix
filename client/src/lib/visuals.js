const C = (id, w = 900) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// Purposeful, professional imagery. Each value is a verified Unsplash asset
// chosen to match the topic it illustrates, not a generic placeholder.
export const IMAGES = {
    heroEngineer: C("1581094794329-c8112a89af12", 1200),
    heroTools: C("1504148455328-c376907d081c", 1200),
    heroTeam: C("1522071820081-009f0129c71c", 1200),
    house: C("1580587771525-78b9dba3b914", 1000),
    shop: C("1441986300917-64674bd600d8", 900),
    cafe: C("1554118811-1e0d58224f24", 900),
    tools: C("1520607162513-77705c0f0d4a", 900),
    garage: C("1486262715619-67b85e0b08d3", 900),
    salon: C("1560066984-138dadb4c035", 900),
    techwork: C("1547082299-de196ea013d6", 900)
};

const SERVICE_IMAGES = {
    plumbing: C("1585704032915-c3400ca199e7"),
    electrical: C("1621905251189-08b45d6a269e"),
    wiring: C("1621905251189-08b45d6a269e"),
    cleaning: C("1581578731548-c64695cc6952"),
    painting: C("1589939705384-5185137a7f0f"),
    carpentry: C("1504148455328-c376907d081c"),
    "appliance repair": C("1610557892470-55d9e80c0bce"),
    gardening: C("1416879595882-3373a0480b5b"),
    "car repair": C("1486262715619-67b85e0b08d3"),
    mechanic: C("1486262715619-67b85e0b08d3"),
    "car wash": C("1583121274602-3e2820c69888"),
    towing: C("1503376780353-7e6692767b70"),
    "auto electrical": C("1492144534655-ae79c964c9d7"),
    "computer repair": C("1547082299-de196ea013d6"),
    networking: C("1558494949-ef010cbdcc31"),
    servers: C("1558494949-ef010cbdcc31"),
    "software installation": C("1461749280684-dccba630e2f6"),
    coding: C("1461749280684-dccba630e2f6"),
    "it support": C("1531482615713-2afd69097998"),
    hairdressing: C("1560066984-138dadb4c035"),
    barbering: C("1503951914875-452162b0f3f1"),
    makeup: C("1487412947147-5cebf100ffc2"),
    "nail services": C("1604654894610-df63bc536371"),
    nails: C("1604654894610-df63bc536371")
};

const CATEGORY_IMAGES = {
    "home services": C("1581094794329-c8112a89af12"),
    automotive: C("1486262715619-67b85e0b08d3"),
    technology: C("1547082299-de196ea013d6"),
    "beauty & personal care": C("1560066984-138dadb4c035")
};

const BUSINESS_IMAGES = {
    "home": C("1581094794329-c8112a89af12"),
    "handy": C("1581094794329-c8112a89af12"),
    "repair": C("1581094794329-c8112a89af12"),
    "pros": C("1581094794329-c8112a89af12"),
    "contractor": C("1581094794329-c8112a89af12"),
    "auto": C("1486262715619-67b85e0b08d3"),
    "car": C("1486262715619-67b85e0b08d3"),
    "garage": C("1486262715619-67b85e0b08d3"),
    "motors": C("1486262715619-67b85e0b08d3"),
    "workshop": C("1486262715619-67b85e0b08d3"),
    "cafe": C("1554118811-1e0d58224f24"),
    "coffee": C("1554118811-1e0d58224f24"),
    "restaurant": C("1554118811-1e0d58224f24"),
    "bakery": C("1554118811-1e0d58224f24"),
    "salon": C("1560066984-138dadb4c035"),
    "beauty": C("1560066984-138dadb4c035"),
    "hair": C("1560066984-138dadb4c035"),
    "spa": C("1560066984-138dadb4c035"),
    "cleaning": C("1581578731548-c64695cc6952"),
    "laundry": C("1581578731548-c64695cc6952"),
    "tech": C("1547082299-de196ea013d6"),
    "computer": C("1547082299-de196ea013d6"),
    "it ": C("1531482615713-2afd69097998"),
    "store": C("1441986300917-64674bd600d8"),
    "shop": C("1441986300917-64674bd600d8"),
    "market": C("1441986300917-64674bd600d8")
};

const PRODUCT_IMAGES = [
    "1585704032915-c3400ca199e7",
    "1520607162513-77705c0f0d4a",
    "1547082299-de196ea013d6",
    "1486262715619-67b85e0b08d3",
    "1580587771525-78b9dba3b914",
    "1558494949-ef010cbdcc31"
].map((id) => C(id, 800));

const PORTRAITS_MALE = [
    C("1507003211169-0a1dd7228f2d", 400),
    C("1500648767791-00dcc994a43e", 400),
    C("1472099645785-5658abf4ff4e", 400)
];

const PORTRAITS_FEMALE = [
    C("1494790108377-be9c29b29330", 400),
    C("1438761681033-6461ffad8d80", 400),
    C("1544005313-94ddf0286df2", 400)
];

const FEMALE_NAMES = new Set([
    "lerato",
    "palesa",
    "mapalo",
    "mpho",
    "keletso",
    "refiloe",
    "neo",
    "celina",
    "nenekane",
    "morenoka",
    "tsietsi"
]);

const isFemaleName = (name) => {
    const first = String(name || "").trim().split(/\s+/)[0].toLowerCase();

    if (!first) return false;

    if (FEMALE_NAMES.has(first)) return true;

    return first.endsWith("a");
};

const slugify = (value) =>
    String(value || "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const findImage = (mapping, name) => {
    const slug = slugify(name);

    const key = Object.keys(mapping).find((candidate) =>
        slug.includes(candidate)
    );

    return key ? mapping[key] : null;
};

const hashCode = (value) => {
    let hash = 0;

    for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }

    return Math.abs(hash);
};

export const getServiceImage = (service) => {
    if (service?.image) {
        return service.image;
    }

    return findImage(SERVICE_IMAGES, service?.name) || IMAGES.tools;
};

export const getCategoryImage = (category) => {
    if (category?.image) {
        return category.image;
    }

    return (
        findImage(CATEGORY_IMAGES, category?.name) ||
        findImage(SERVICE_IMAGES, category?.name) ||
        IMAGES.tools
    );
};

export const getProductImage = (product, index = 0) => {
    if (product?.image) {
        return product.image;
    }

    return PRODUCT_IMAGES[index % PRODUCT_IMAGES.length];
};

export const getBusinessImage = (business) =>
    business?.cover_image ||
    business?.logo ||
    findImage(BUSINESS_IMAGES, business?.name || business?.business_name) ||
    IMAGES.shop;

export const getProviderPortrait = (provider, index = 0) => {
    if (provider?.profile_image) {
        return provider.profile_image;
    }

    const name = provider?.first_name || provider?.name || "";
    const pool = isFemaleName(name) ? PORTRAITS_FEMALE : PORTRAITS_MALE;
    const id = Number(provider?.id) || Number(provider?.user_id) || 0;

    return pool[(id + index) % pool.length];
};

const COVERS = [
    "1581244277943-fe4a9c777189",
    "1504148455328-c376907d081c",
    "1621905251189-08b45d6a269e",
    "1585704032915-c3400ca199e7",
    "1560066984-138dadb4c035",
    "1486262715619-67b85e0b08d3"
].map((id) => C(id, 1200));

export const getProviderCover = (provider, index = 0) => {
    if (provider?.cover_image) {
        return provider.cover_image;
    }

    return (
        findImage(SERVICE_IMAGES, provider?.services?.[0]?.name) ||
        COVERS[index % COVERS.length]
    );
};

// Deterministic gradient for image fallback tiles.
export const gradientFor = (name = "", hueShift = 0) => {
    const hash = hashCode(slugify(name) || "placeholder");
    const hue1 = (hash + hueShift) % 360;
    const hue2 = (hue1 + 40 + (hash % 60)) % 360;

    return `linear-gradient(135deg, hsl(${hue1} 72% 56%) 0%, hsl(${hue2} 78% 42%) 100%)`;
};