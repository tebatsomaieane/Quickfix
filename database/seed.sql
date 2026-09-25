-- =========================================================
-- QUICKFIX SEED DATA
-- MySQL 8 + Express
--
-- Production seed:
--   * Only the platform administrator account is seeded.
--   * The service catalogue (categories + services) is seeded so
--     the marketplace works from day one.
--   * NO fake/demo users, and no Unsplash/stock imagery. All photos,
--     videos and portrait images are uploaded by real Basotho users
--     through the app (see /api/uploads). Brand tiles fall back to
--     a branded gradient placeholder until media is uploaded.
--
-- Admin default password:  Admin@Lesotho2026
--   CHANGE THIS after your first login.
--
-- The seeded admin is pre-verified and has two-factor authentication
-- disabled (two_factor_enabled = FALSE) so a fresh install can be
-- administered even before SMTP is configured. Every account created
-- through the app has 2FA enabled by default.
-- =========================================================

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE products;
TRUNCATE TABLE business_providers;
TRUNCATE TABLE promotions;
TRUNCATE TABLE advertisements;
TRUNCATE TABLE businesses;
TRUNCATE TABLE verification_requests;
TRUNCATE TABLE complaints;
TRUNCATE TABLE reviews;
TRUNCATE TABLE provider_availability;
TRUNCATE TABLE provider_services;
TRUNCATE TABLE services;
TRUNCATE TABLE categories;
TRUNCATE TABLE offers;
TRUNCATE TABLE jobs;
TRUNCATE TABLE messages;
TRUNCATE TABLE conversations;
TRUNCATE TABLE notifications;
TRUNCATE TABLE request_attachments;
TRUNCATE TABLE service_requests;
TRUNCATE TABLE provider_profiles;
TRUNCATE TABLE customer_profiles;
TRUNCATE TABLE password_reset_tokens;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;


-- =========================================================
-- ADMIN ACCOUNT (single production administrator)
-- =========================================================

INSERT INTO users (id, first_name, last_name, email, phone, password, role, email_verified, is_active, two_factor_enabled) VALUES
(1, 'QuickFix', 'Admin', 'admin@quickfix.co.ls', '+266 5779 9537', '$2b$10$ODYolz8nkLIhbKXSBVCFt.lClQ6bPDfFsGDGjT9pdpC3eseDVuMsS', 'ADMIN', TRUE, TRUE, FALSE);


-- =========================================================
-- CATEGORIES
-- =========================================================

INSERT INTO categories (id, name, description, image, status) VALUES
(1, 'Home Services', 'Plumbing, electrical, cleaning, painting and more for your home.', NULL, 'ACTIVE'),
(2, 'Automotive', 'Car repair, washing, towing and auto electrical services.', NULL, 'ACTIVE'),
(3, 'Technology', 'Computer repair, networking, software and IT support.', NULL, 'ACTIVE'),
(4, 'Beauty & Personal Care', 'Hairdressing, barbering, makeup and nail services.', NULL, 'ACTIVE');


-- =========================================================
-- SERVICES
-- =========================================================

INSERT INTO services (id, category_id, name, description, image, status) VALUES
-- Home Services
(1, 1, 'Plumbing', 'Fix leaks, unblock drains and general plumbing repairs.', NULL, 'ACTIVE'),
(2, 1, 'Electrical', 'Wiring, fault finding and electrical installations.', NULL, 'ACTIVE'),
(3, 1, 'Cleaning', 'Home and office cleaning services.', NULL, 'ACTIVE'),
(4, 1, 'Painting', 'Interior and exterior painting.', NULL, 'ACTIVE'),
(5, 1, 'Carpentry', 'Furniture assembly, repairs and custom woodwork.', NULL, 'ACTIVE'),
(6, 1, 'Appliance Repair', 'Repair of household appliances.', NULL, 'ACTIVE'),
(7, 1, 'Gardening', 'Lawn care, hedging and garden maintenance.', NULL, 'ACTIVE'),
-- Automotive
(8, 2, 'Car Repair', 'Mechanical repairs and diagnostics.', NULL, 'ACTIVE'),
(9, 2, 'Car Wash', 'Exterior and interior car cleaning.', NULL, 'ACTIVE'),
(10, 2, 'Towing', 'Roadside assistance and towing services.', NULL, 'ACTIVE'),
(11, 2, 'Auto Electrical', 'Vehicle electrical systems and battery services.', NULL, 'ACTIVE'),
-- Technology
(12, 3, 'Computer Repair', 'Laptop and desktop repairs and upgrades.', NULL, 'ACTIVE'),
(13, 3, 'Networking', 'Home and office network setup.', NULL, 'ACTIVE'),
(14, 3, 'Software Installation', 'Software setup, updates and configuration.', NULL, 'ACTIVE'),
(15, 3, 'IT Support', 'Remote and on-site IT support.', NULL, 'ACTIVE'),
-- Beauty & Personal Care
(16, 4, 'Hairdressing', 'Styling, cutting and treatments.', NULL, 'ACTIVE'),
(17, 4, 'Barbering', 'Men''s haircuts and grooming.', NULL, 'ACTIVE'),
(18, 4, 'Makeup', 'Event and everyday makeup application.', NULL, 'ACTIVE'),
(19, 4, 'Nail Services', 'Manicure and pedicure services.', NULL, 'ACTIVE');