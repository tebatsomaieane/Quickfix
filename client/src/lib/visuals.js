import homeCleaningImage from "../assets/cleaner2.jpg";
import automotiveImage from "../assets/Automotive.jfif";
import technologyImage from "../assets/technology.jfif";
import beautyImage from "../assets/salon.jpg";
import cleaningImage from "../assets/cleaner.jpg";
import electricalImage from "../assets/electrician.jpg";
import plumbingImage from "../assets/Plumbing.jfif";
import gardeningImage from "../assets/Gardening.jfif";
import paintingImage from "../assets/Painting.jfif";
import carpentryImage from "../assets/Capentry.jfif";
import applianceImage from "../assets/ApplianceRepair.jfif";
import carRepairImage from "../assets/CarRepair1.jpg";
import carWashImage from "../assets/CarWash.jfif";
import towingImage from "../assets/Towing.jfif";
import autoElectricImage from "../assets/AutoElectric.jfif";
import computerRepairImage from "../assets/ComputerRepair.jfif";
import networkingImage from "../assets/NetworkingLesotho.jfif";
import softwareImage from "../assets/SoftwareIntallation.jfif";
import itSupportImage from "../assets/ITSupport.jfif";
import hairdressingImage from "../assets/HairDressing.jfif";
import barberingImage from "../assets/Beberring.jpg";
import makeupImage from "../assets/Makeup.jfif";
import nailsImage from "../assets/Nails.jfif";

// QuickFix media helpers.
//
// People are only ever shown a photo they uploaded themselves (see
// getProviderPortrait) — no user is ever shown a stock person's face.
//
// Catalogue records (categories, services) resolve in this order:
//   1. Media uploaded through the app, stored on the API server.
//   2. A bundled first-party Lesotho photo for that specific service.
//   3. null, which renders a branded gradient + icon placeholder (see
//      SmartImage).
//
// The bundled photos in ../assets are first-party imagery shipped with
// the app, not third-party stock photography.

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

const LOCAL_SERVICE_IMAGES = {
    plumbing: plumbingImage,
    cleaning: cleaningImage,
    gardening: gardeningImage,
    electrical: electricalImage,
    painting: paintingImage,
    carpentry: carpentryImage,
    "appliance repair": applianceImage,
    "car repair": carRepairImage,
    "car wash": carWashImage,
    towing: towingImage,
    "auto electrical": autoElectricImage,
    "computer repair": computerRepairImage,
    networking: networkingImage,
    "software installation": softwareImage,
    "it support": itSupportImage,
    hairdressing: hairdressingImage,
    barbering: barberingImage,
    makeup: makeupImage,
    "nail services": nailsImage
};

const LOCAL_CATEGORY_IMAGES = {
    "home services": homeCleaningImage,
    automotive: automotiveImage,
    technology: technologyImage,
    "beauty and personal care": beautyImage
};

export const getServiceImage = (service) =>
    service?.image || LOCAL_SERVICE_IMAGES[slugify(service?.name)] || null;

export const getCategoryImage = (category) =>
    category?.image || LOCAL_CATEGORY_IMAGES[slugify(category?.name)] || null;

export const getProductImage = (product) => product?.image || null;

export const getBusinessImage = (business) =>
    business?.cover_image || business?.logo || null;

// People are only ever shown a photo they uploaded themselves.
export const getProviderPortrait = (provider) =>
    provider?.profile_image || null;

export const getProviderCover = (provider) =>
    provider?.cover_image || null;