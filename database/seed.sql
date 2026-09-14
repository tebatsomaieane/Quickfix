-- =========================================================
-- QUICKFIX SEED DATA
-- MySQL 8 + Express
--
-- Passwords for all seed users: Password@123
-- Stored as bcrypt hash ($2b$10$tItsUJ9O73yvYAG9CeoNKOThSR46ISB.TYaeJvZCuV6uDmzdJLkN6)
--
-- Safe to re-run: clears tables first and re-inserts.
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
-- USERS
-- =========================================================

INSERT INTO users (id, first_name, last_name, email, phone, password, role, email_verified, is_active) VALUES
(1, 'Admin', 'System', 'admin@quickfix.com', '+266 1111 1111', '$2b$10$tItsUJ9O73yvYAG9CeoNKOThSR46ISB.TYaeJvZCuV6uDmzdJLkN6', 'ADMIN', TRUE, TRUE),

(2, 'John', 'Mokoena', 'john.mokoena@example.com', '+266 6222 2222', '$2b$10$tItsUJ9O73yvYAG9CeoNKOThSR46ISB.TYaeJvZCuV6uDmzdJLkN6', 'PROVIDER', TRUE, TRUE),
(3, 'Thabo', 'Molefe', 'thabo.molefe@example.com', '+266 6233 3333', '$2b$10$tItsUJ9O73yvYAG9CeoNKOThSR46ISB.TYaeJvZCuV6uDmzdJLkN6', 'PROVIDER', TRUE, TRUE),
(4, 'Lerato', 'Nkosi', 'lerato.nkosi@example.com', '+266 6244 4444', '$2b$10$tItsUJ9O73yvYAG9CeoNKOThSR46ISB.TYaeJvZCuV6uDmzdJLkN6', 'PROVIDER', TRUE, TRUE),
(5, 'Mapalo', 'Matli', 'mapalo.matli@example.com', '+266 6255 5555', '$2b$10$tItsUJ9O73yvYAG9CeoNKOThSR46ISB.TYaeJvZCuV6uDmzdJLkN6', 'PROVIDER', TRUE, TRUE),
(6, 'Kabelo', 'Rama', 'kabelo.rama@example.com', '+266 6266 6666', '$2b$10$tItsUJ9O73yvYAG9CeoNKOThSR46ISB.TYaeJvZCuV6uDmzdJLkN6', 'PROVIDER', TRUE, TRUE),

(7, 'Palesa', 'Motaung', 'palesa.motaung@example.com', '+266 6277 7777', '$2b$10$tItsUJ9O73yvYAG9CeoNKOThSR46ISB.TYaeJvZCuV6uDmzdJLkN6', 'CUSTOMER', TRUE, TRUE),
(8, 'Teboho', 'Khama', 'teboho.khama@example.com', '+266 6288 8888', '$2b$10$tItsUJ9O73yvYAG9CeoNKOThSR46ISB.TYaeJvZCuV6uDmzdJLkN6', 'CUSTOMER', TRUE, TRUE),
(9, 'Refiloe', 'Letlala', 'refiloe.letlala@example.com', '+266 6299 9999', '$2b$10$tItsUJ9O73yvYAG9CeoNKOThSR46ISB.TYaeJvZCuV6uDmzdJLkN6', 'CUSTOMER', TRUE, TRUE),
(10, 'Neo', 'Selepe', 'neo.selepe@example.com', '+266 6300 0000', '$2b$10$tItsUJ9O73yvYAG9CeoNKOThSR46ISB.TYaeJvZCuV6uDmzdJLkN6', 'CUSTOMER', TRUE, TRUE),

(11, 'Mpho', 'Tau', 'mpho.tau@example.com', '+266 6311 1111', '$2b$10$tItsUJ9O73yvYAG9CeoNKOThSR46ISB.TYaeJvZCuV6uDmzdJLkN6', 'BUSINESS_OWNER', TRUE, TRUE),
(12, 'Keletso', 'Mofokeng', 'keletso.mofokeng@example.com', '+266 6322 2222', '$2b$10$tItsUJ9O73yvYAG9CeoNKOThSR46ISB.TYaeJvZCuV6uDmzdJLkN6', 'BUSINESS_OWNER', TRUE, TRUE);


-- =========================================================
-- CUSTOMER PROFILES
-- =========================================================

INSERT INTO customer_profiles (id, user_id, profile_image, location) VALUES
(1, 7, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', 'Maseru'),
(2, 8, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', 'Leribe'),
(3, 9, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80', 'Mafeteng'),
(4, 10, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', 'Maseru');


-- =========================================================
-- PROVIDER PROFILES
-- =========================================================

INSERT INTO provider_profiles
(id, user_id, description, profile_image, experience_years, location, service_area, verification_status) VALUES
(1, 2,
 'Licensed plumber with 10 years of experience. I handle leaks, installations, and general plumbing repairs.',
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', 10, 'Maseru', 'Maseru & Districts', 'APPROVED'),
(2, 3,
 'Certified electrician. Residential and commercial wiring, fault finding, and appliance installation.',
 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', 7, 'Maseru', 'Maseru', 'APPROVED'),
(3, 4,
 'Professional cleaner offering home and office deep cleaning, move-in/move-out services.',
 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', 4, 'Maseru', 'Maseru & Leribe', 'APPROVED'),
(4, 5,
 'Automotive technician specialising in mechanical repairs, diagnostics, and routine servicing.',
 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80', 8, 'Leribe', 'Leribe & Butha-Buthe', 'PENDING'),
(5, 6,
 'IT support specialist. Computer repair, software installation, networking and data recovery.',
 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80', 5, 'Maseru', 'Maseru', 'APPROVED');


-- =========================================================
-- VERIFICATION REQUESTS
-- =========================================================

INSERT INTO verification_requests
(provider_id, identity_information, professional_information, qualification_information, document_url, status, admin_notes) VALUES
(4,
 'National ID / Passport verified. Leribe resident, Matli M.',
 'GB Auto Repairs — automotive technician specialising in mechanical repairs, diagnostics and routine servicing.',
 'Diploma in Automotive Engineering, Lesotho Technical Institute. Manufacturer-trainings in engine diagnostics.',
 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=400&q=80',
 'PENDING',
 NULL);


-- =========================================================
-- CATEGORIES
-- =========================================================

INSERT INTO categories (id, name, description, image, status) VALUES
(1, 'Home Services', 'Plumbing, electrical, cleaning, painting and more for your home.', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(2, 'Automotive', 'Car repair, washing, towing and auto electrical services.', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(3, 'Technology', 'Computer repair, networking, software and IT support.', 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(4, 'Beauty & Personal Care', 'Hairdressing, barbering, makeup and nail services.', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=700&q=80', 'ACTIVE');


-- =========================================================
-- SERVICES
-- =========================================================

INSERT INTO services (id, category_id, name, description, image, status) VALUES
-- Home Services
(1, 1, 'Plumbing', 'Fix leaks, unblock drains and general plumbing repairs.', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(2, 1, 'Electrical', 'Wiring, fault finding and electrical installations.', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(3, 1, 'Cleaning', 'Home and office cleaning services.', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(4, 1, 'Painting', 'Interior and exterior painting.', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(5, 1, 'Carpentry', 'Furniture assembly, repairs and custom woodwork.', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(6, 1, 'Appliance Repair', 'Repair of household appliances.', 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(7, 1, 'Gardening', 'Lawn care, hedging and garden maintenance.', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
-- Automotive
(8, 2, 'Car Repair', 'Mechanical repairs and diagnostics.', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(9, 2, 'Car Wash', 'Exterior and interior car cleaning.', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(10, 2, 'Towing', 'Roadside assistance and towing services.', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(11, 2, 'Auto Electrical', 'Vehicle electrical systems and battery services.', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
-- Technology
(12, 3, 'Computer Repair', 'Laptop and desktop repairs and upgrades.', 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(13, 3, 'Networking', 'Home and office network setup.', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(14, 3, 'Software Installation', 'Software setup, updates and configuration.', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(15, 3, 'IT Support', 'Remote and on-site IT support.', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
-- Beauty & Personal Care
(16, 4, 'Hairdressing', 'Styling, cutting and treatments.', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(17, 4, 'Barbering', 'Men''s haircuts and grooming.', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(18, 4, 'Makeup', 'Event and everyday makeup application.', 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(19, 4, 'Nail Services', 'Manicure and pedicure services.', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=700&q=80', 'ACTIVE');


-- =========================================================
-- PROVIDER SERVICES
-- =========================================================

INSERT INTO provider_services (id, provider_id, service_id, price) VALUES
(1, 1, 1, 400.00),    -- John: Plumbing
(2, 1, 6, 500.00),    -- John: Appliance Repair
(3, 2, 2, 600.00),    -- Thabo: Electrical
(4, 2, 11, 750.00),   -- Thabo: Auto Electrical
(5, 3, 3, 350.00),    -- Lerato: Cleaning
(6, 4, 8, 1200.00),   -- Mapalo: Car Repair
(7, 4, 9, 200.00),    -- Mapalo: Car Wash
(8, 4, 10, 300.00),   -- Mapalo: Towing
(9, 5, 12, 450.00),   -- Kabelo: Computer Repair
(10, 5, 13, 800.00),  -- Kabelo: Networking
(11, 5, 14, 350.00),  -- Kabelo: Software Installation
(12, 5, 15, 500.00);  -- Kabelo: IT Support


-- =========================================================
-- PROVIDER AVAILABILITY
-- =========================================================

INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, is_available) VALUES
(1, 'MONDAY', '08:00:00', '17:00:00', TRUE),
(1, 'TUESDAY', '08:00:00', '17:00:00', TRUE),
(1, 'WEDNESDAY', '08:00:00', '17:00:00', TRUE),
(1, 'THURSDAY', '08:00:00', '17:00:00', TRUE),
(1, 'FRIDAY', '08:00:00', '16:00:00', TRUE),
(1, 'SATURDAY', '09:00:00', '13:00:00', TRUE),
(2, 'MONDAY', '09:00:00', '18:00:00', TRUE),
(2, 'TUESDAY', '09:00:00', '18:00:00', TRUE),
(2, 'WEDNESDAY', '09:00:00', '18:00:00', TRUE),
(2, 'THURSDAY', '09:00:00', '18:00:00', TRUE),
(2, 'FRIDAY', '09:00:00', '18:00:00', TRUE),
(3, 'MONDAY', '08:00:00', '16:00:00', TRUE),
(3, 'WEDNESDAY', '08:00:00', '16:00:00', TRUE),
(3, 'FRIDAY', '08:00:00', '16:00:00', TRUE),
(3, 'SATURDAY', '09:00:00', '15:00:00', TRUE),
(4, 'MONDAY', '08:00:00', '17:00:00', TRUE),
(4, 'TUESDAY', '08:00:00', '17:00:00', TRUE),
(4, 'THURSDAY', '08:00:00', '17:00:00', TRUE),
(4, 'FRIDAY', '08:00:00', '17:00:00', TRUE),
(4, 'SATURDAY', '08:00:00', '14:00:00', TRUE),
(5, 'MONDAY', '09:00:00', '17:00:00', TRUE),
(5, 'TUESDAY', '09:00:00', '17:00:00', TRUE),
(5, 'WEDNESDAY', '09:00:00', '17:00:00', TRUE),
(5, 'THURSDAY', '09:00:00', '17:00:00', TRUE),
(5, 'FRIDAY', '09:00:00', '16:00:00', TRUE);


-- =========================================================
-- BUSINESSES
-- =========================================================

INSERT INTO businesses
(id, owner_id, name, description, logo, cover_image, phone, email, location, operating_hours, verification_status) VALUES
(1, 11,
 'Maseru Home Pros',
 'Trusted home maintenance and repair company serving Maseru and surrounding areas.',
 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=400&q=80',
 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
 '+266 6311 1111', 'info@maseruhomepros.co.ls',
 'Maseru', 'Mon–Sat: 8:00–17:00', 'APPROVED'),
(2, 12,
 'Leribe Auto Centre',
 'Full-service automotive repair, diagnostics and roadside assistance in Leribe.',
 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=600&q=80',
 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80',
 '+266 6322 2222', 'service@leribeautocentre.co.ls',
 'Leribe', 'Mon–Fri: 8:00–18:00, Sat: 8:00–14:00', 'APPROVED');


-- =========================================================
-- BUSINESS PROVIDERS
-- =========================================================

INSERT INTO business_providers (business_id, provider_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 4);


-- =========================================================
-- PRODUCTS (advertised by businesses - no orders processed)
-- =========================================================

INSERT INTO products
(id, business_id, category_id, name, description, price, image, status) VALUES
(1, 1, 1, 'Emergency Plumbing Tool Pack',
  'Curated set of basic plumbing tools and spare connectors for urgent household pipe repairs.',
  450.00, 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(2, 1, 1, 'Home Safety Inspection Report',
  'Written report identifying electrical and structural risks in your home, completed within two days.',
  350.00, 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(3, 1, 2, 'Waterless Car Care Kit',
  'Economical exterior cleaning kit for water-constrained areas, safe on all paint finishes.',
  280.00, 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(4, 2, 2, 'Vehicle Diagnostic Report',
  'Full computer diagnostic and written report on your vehicle''s mechanical and electrical health.',
  400.00, 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(5, 2, 2, 'Battery Health & Charging Check',
  'Battery load test, alternator output check and written battery health summary.',
  150.00, 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=700&q=80', 'ACTIVE'),
(6, 2, 2, 'Tyre Safety Pack',
  'Tread and pressure inspection with inflation service and spare tyre condition assessment.',
  120.00, 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=700&q=80', 'ACTIVE');


-- =========================================================
-- SERVICE REQUESTS
-- =========================================================

INSERT INTO service_requests
(id, customer_id, service_id, title, description, location,
 preferred_date, preferred_time, budget_min, budget_max, status) VALUES
(1, 1, 1, 'Leaking kitchen pipe',
 'The pipe underneath the kitchen sink is leaking water steadily. Needs repair or replacement of the damaged connector.',
 'Maseru', '2026-09-12', '10:00:00', 400.00, 800.00, 'OFFERS_RECEIVED'),
(2, 2, 2, 'Faulty wall socket',
 'One wall socket in the living room is not working. Fuse is fine, likely wiring issue.',
 'Leribe', '2026-09-13', '09:00:00', 300.00, 600.00, 'OPEN'),
(3, 3, 3, 'Office deep clean',
 'Deep cleaning of a small two-room office including carpets and windows.',
 'Mafeteng', '2026-09-10', '08:00:00', 500.00, 1000.00, 'COMPLETED'),
(4, 1, 3, 'Weekly home cleaning',
 'Sweep, mop and tidy a three-bedroom home every week. Cleaning supplies included.',
 'Maseru', '2026-09-15', '09:00:00', 180.00, 300.00, 'IN_PROGRESS'),
(5, 2, 12, 'Laptop won''t start',
 'My laptop shows a blank screen when switched on. Please try to recover the data.',
 'Leribe', '2026-09-08', '10:00:00', 300.00, 600.00, 'COMPLETED'),
(6, 4, 8, 'Car brake service',
 'Brakes feel soft and squeal when stopping. Need an inspection and service.',
 'Maseru', '2026-09-14', '15:00:00', 600.00, 1200.00, 'OFFERS_RECEIVED'),
(7, 4, 1, 'Burst pipe under driveway',
 'A pipe burst near the driveway gate and water is pooling. Needs urgent repair.',
 'Maseru', '2026-09-06', '08:00:00', 400.00, 900.00, 'COMPLETED');


-- =========================================================
-- OFFERS
-- =========================================================

INSERT INTO offers
(id, request_id, provider_id, price, message, estimated_hours, valid_until, status) VALUES
(1, 1, 1, 750.00,
 'I can repair the pipe and replace the damaged connector. I carry all the necessary parts.',
 2.00, '2026-09-14 17:00:00', 'PENDING'),
(2, 3, 3, 650.00,
 'Thorough deep clean including carpets, windows and all surfaces. Equipment provided.',
 5.00, '2026-09-09 17:00:00', 'ACCEPTED'),
(3, 4, 3, 250.00,
 'Happy to keep your place clean every week. Supplies included in the price.',
 2.00, '2026-09-16 17:00:00', 'ACCEPTED'),
(4, 5, 5, 550.00,
 'Can attempt data recovery and a full repair. Price covers labour and quoted parts.',
 4.00, '2026-09-09 17:00:00', 'ACCEPTED'),
(5, 6, 4, 950.00,
 'Full brake service including pads if needed. Diagnostics first, no hidden costs.',
 3.00, '2026-09-15 17:00:00', 'PENDING'),
(6, 7, 1, 800.00,
 'Can repair the burst pipe the same day. I carry pipe fittings and couplings.',
 3.00, '2026-09-07 17:00:00', 'ACCEPTED');


-- =========================================================
-- JOBS
-- =========================================================

INSERT INTO jobs
(id, request_id, offer_id, customer_id, provider_id,
 status, started_at, completed_at) VALUES
(1, 3, 2, 3, 3, 'COMPLETED',
 '2026-09-10 08:30:00', '2026-09-10 14:00:00'),
(2, 4, 3, 1, 3, 'IN_PROGRESS',
 '2026-09-15 09:00:00', NULL),
(3, 5, 4, 2, 5, 'COMPLETED',
 '2026-09-08 10:00:00', '2026-09-08 13:30:00'),
(4, 7, 6, 4, 1, 'COMPLETED',
 '2026-09-06 08:30:00', '2026-09-06 11:00:00');


-- =========================================================
-- REVIEWS
-- =========================================================

INSERT INTO reviews
(id, job_id, customer_id, provider_id, rating, comment,
 provider_response, provider_response_at) VALUES
(1, 1, 3, 3, 5,
 'Excellent service. Arrived on time and the office looks spotless.',
 'Thank you Refiloe, it was a pleasure. See you next month!',
 '2026-09-11 09:00:00'),
(2, 3, 2, 5, 5,
 'Laptop fixed and all my files recovered. Professional and honest about pricing.',
 'Glad I could get your data back. Thanks for the review!',
 '2026-09-08 16:00:00'),
(3, 4, 4, 1, 4,
 'Leak fixed properly and the area was cleaned up. Ran a bit late but did a good job.',
 'Apologies for the slight delay. Appreciate the feedback.',
 '2026-09-06 12:30:00');


-- =========================================================
-- CONVERSATIONS & MESSAGES
-- =========================================================

INSERT INTO conversations (id, customer_id, provider_id, request_id) VALUES
(1, 1, 1, 1);

INSERT INTO messages (conversation_id, sender_id, message, is_read, created_at) VALUES
(1, 7, 'Hello John, when could you come and look at the leak?', TRUE, '2026-09-08 15:32:00'),
(1, 2, 'Hi Palesa, I can come Saturday morning. Does 9am work?', TRUE, '2026-09-08 16:05:00'),
(1, 7, 'Perfect, Saturday 9am works for me.', FALSE, '2026-09-08 17:10:00');


-- =========================================================
-- NOTIFICATIONS
-- =========================================================

INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(1, 'New offer received', 'John Mokoena sent you an offer for your request "Leaking kitchen pipe".', 'OFFER_RECEIVED', FALSE),
(2, 'New service request', 'A new plumbing request was posted in your area.', 'NEW_REQUEST', TRUE),
(7, 'Welcome to QuickFix', 'Thanks for joining QuickFix. Post your first service request to get started.', 'WELCOME', TRUE),
(8, 'Job completed', 'Your cleaning job is complete. Please leave a review.', 'JOB_COMPLETED', FALSE);