-- =========================================================
-- QUICKFIX DATABASE
-- Express + React + MySQL
--
-- Re-runnable: drops the database first, then recreates it.
-- =========================================================

DROP DATABASE IF EXISTS quickfix;

CREATE DATABASE IF NOT EXISTS quickfix;

USE quickfix;


-- =========================================================
-- 1. USERS
-- =========================================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,

    password VARCHAR(255) NOT NULL,

    role ENUM(
        'CUSTOMER',
        'PROVIDER',
        'BUSINESS_OWNER',
        'ADMIN'
    ) NOT NULL DEFAULT 'CUSTOMER',

    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================================
-- 2. CUSTOMER PROFILES
-- =========================================================

CREATE TABLE customer_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL UNIQUE,

    profile_image VARCHAR(500),
    location VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_customer_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 3. PROVIDER PROFILES
-- =========================================================

CREATE TABLE provider_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL UNIQUE,

    description TEXT,
    profile_image VARCHAR(500),

    experience_years INT DEFAULT 0,

    location VARCHAR(255),
    service_area VARCHAR(255),

    verification_status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_provider_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 4. CATEGORIES
-- =========================================================

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    image VARCHAR(500),

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 5. SERVICES
-- =========================================================

CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,

    category_id INT NOT NULL,

    name VARCHAR(150) NOT NULL,
    description TEXT,
    image VARCHAR(500),

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_service_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,

    UNIQUE (category_id, name)
);


-- =========================================================
-- 6. PROVIDER SERVICES
-- =========================================================

CREATE TABLE provider_services (
    id INT AUTO_INCREMENT PRIMARY KEY,

    provider_id INT NOT NULL,
    service_id INT NOT NULL,

    price DECIMAL(10,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_provider_service_provider
        FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_provider_service_service
        FOREIGN KEY (service_id)
        REFERENCES services(id)
        ON DELETE CASCADE,

    UNIQUE (provider_id, service_id)
);


-- =========================================================
-- 7. PROVIDER AVAILABILITY
-- =========================================================

CREATE TABLE provider_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,

    provider_id INT NOT NULL,

    day_of_week ENUM(
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY'
    ) NOT NULL,

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_availability_provider
        FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 8. SERVICE REQUESTS
-- =========================================================

CREATE TABLE service_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,

    customer_id INT NOT NULL,
    service_id INT NOT NULL,
    preferred_provider_id INT,

    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,

    location VARCHAR(255) NOT NULL,

    preferred_date DATE,
    preferred_time TIME,

    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),

    status ENUM(
        'PENDING',
        'OPEN',
        'OFFERS_RECEIVED',
        'PROVIDER_SELECTED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_request_customer
        FOREIGN KEY (customer_id)
        REFERENCES customer_profiles(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_request_service
        FOREIGN KEY (service_id)
        REFERENCES services(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_request_preferred_provider
        FOREIGN KEY (preferred_provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE SET NULL
);


-- =========================================================
-- 9. REQUEST ATTACHMENTS
-- =========================================================

CREATE TABLE request_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    request_id INT NOT NULL,

    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attachment_request
        FOREIGN KEY (request_id)
        REFERENCES service_requests(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 10. OFFERS
-- =========================================================

CREATE TABLE offers (
    id INT AUTO_INCREMENT PRIMARY KEY,

    request_id INT NOT NULL,
    provider_id INT NOT NULL,

    price DECIMAL(10,2) NOT NULL,

    message TEXT,

    estimated_hours DECIMAL(6,2),

    valid_until DATETIME,

    status ENUM(
        'PENDING',
        'ACCEPTED',
        'REJECTED',
        'WITHDRAWN',
        'EXPIRED'
    ) NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_offer_request
        FOREIGN KEY (request_id)
        REFERENCES service_requests(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_offer_provider
        FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE RESTRICT
);


-- =========================================================
-- 11. JOBS
-- =========================================================

CREATE TABLE jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,

    request_id INT NOT NULL UNIQUE,
    offer_id INT NOT NULL UNIQUE,

    customer_id INT NOT NULL,
    provider_id INT NOT NULL,

    status ENUM(
        'ASSIGNED',
        'ACCEPTED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'DISPUTED'
    ) NOT NULL DEFAULT 'ASSIGNED',

    started_at DATETIME,
    completed_at DATETIME,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_job_request
        FOREIGN KEY (request_id)
        REFERENCES service_requests(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_job_offer
        FOREIGN KEY (offer_id)
        REFERENCES offers(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_job_customer
        FOREIGN KEY (customer_id)
        REFERENCES customer_profiles(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_job_provider
        FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE RESTRICT
);


-- =========================================================
-- 12. CONVERSATIONS
-- =========================================================

CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,

    customer_id INT NOT NULL,
    provider_id INT NOT NULL,

    request_id INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_conversation_customer
        FOREIGN KEY (customer_id)
        REFERENCES customer_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_conversation_provider
        FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_conversation_request
        FOREIGN KEY (request_id)
        REFERENCES service_requests(id)
        ON DELETE SET NULL
);


-- =========================================================
-- 13. MESSAGES
-- =========================================================

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,

    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,

    message TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_message_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_message_sender
        FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 14. NOTIFICATIONS
-- =========================================================

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,

    type VARCHAR(100),
    link VARCHAR(255),

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 15. REVIEWS
-- =========================================================

CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,

    job_id INT NOT NULL UNIQUE,

    customer_id INT NOT NULL,
    provider_id INT NOT NULL,

    rating TINYINT NOT NULL,
    comment TEXT,

    provider_response TEXT,
    provider_response_at DATETIME,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_review_rating
        CHECK (rating BETWEEN 1 AND 5),

    CONSTRAINT fk_review_job
        FOREIGN KEY (job_id)
        REFERENCES jobs(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_review_customer
        FOREIGN KEY (customer_id)
        REFERENCES customer_profiles(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_review_provider
        FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE RESTRICT
);


-- =========================================================
-- 16. PASSWORD RESET TOKENS
-- =========================================================

CREATE TABLE password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    token_hash VARCHAR(64) NOT NULL UNIQUE,

    expires_at DATETIME NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reset_token_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 17. COMPLAINTS
-- =========================================================

CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    job_id INT,

    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,

    status ENUM(
        'OPEN',
        'UNDER_REVIEW',
        'RESOLVED',
        'REJECTED'
    ) NOT NULL DEFAULT 'OPEN',

    admin_response TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_complaint_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_complaint_job
        FOREIGN KEY (job_id)
        REFERENCES jobs(id)
        ON DELETE SET NULL
);


-- =========================================================
-- 17. VERIFICATION REQUESTS
-- =========================================================

CREATE TABLE verification_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,

    provider_id INT NOT NULL,

    identity_information TEXT,
    professional_information TEXT,
    qualification_information TEXT,

    document_url VARCHAR(500),

    status ENUM(
        'PENDING',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED'
    ) NOT NULL DEFAULT 'PENDING',

    admin_notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_verification_provider
        FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 18. BUSINESSES
-- =========================================================

CREATE TABLE businesses (
    id INT AUTO_INCREMENT PRIMARY KEY,

    owner_id INT NOT NULL UNIQUE,

    name VARCHAR(200) NOT NULL,
    description TEXT,

    logo VARCHAR(500),
    cover_image VARCHAR(500),

    phone VARCHAR(30),
    email VARCHAR(255),

    location VARCHAR(255),
    operating_hours VARCHAR(255),

    verification_status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_business_owner
        FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);


-- =========================================================
-- 19. BUSINESS PROVIDERS
-- =========================================================

CREATE TABLE business_providers (
    id INT AUTO_INCREMENT PRIMARY KEY,

    business_id INT NOT NULL,
    provider_id INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_business_provider_business
        FOREIGN KEY (business_id)
        REFERENCES businesses(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_business_provider_provider
        FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE CASCADE,

    UNIQUE (business_id, provider_id)
);


-- =========================================================
-- 20. ADVERTISEMENTS
-- =========================================================

CREATE TABLE advertisements (
    id INT AUTO_INCREMENT PRIMARY KEY,

    business_id INT NOT NULL,

    title VARCHAR(200) NOT NULL,
    description TEXT,

    image VARCHAR(500),

    service_id INT,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    status ENUM(
        'PENDING',
        'ACTIVE',
        'PAUSED',
        'EXPIRED',
        'REJECTED'
    ) NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ad_business
        FOREIGN KEY (business_id)
        REFERENCES businesses(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ad_service
        FOREIGN KEY (service_id)
        REFERENCES services(id)
        ON DELETE SET NULL
);


-- =========================================================
-- 21. PROMOTIONS
-- =========================================================

CREATE TABLE promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    business_id INT NOT NULL,

    service_id INT,

    title VARCHAR(200) NOT NULL,
    description TEXT,

    discount DECIMAL(5,2) NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    status ENUM(
        'PENDING',
        'ACTIVE',
        'PAUSED',
        'EXPIRED',
        'REJECTED'
    ) NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_promotion_business
        FOREIGN KEY (business_id)
        REFERENCES businesses(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_promotion_service
        FOREIGN KEY (service_id)
        REFERENCES services(id)
        ON DELETE SET NULL
);


-- =========================================================
-- 22. PRODUCTS (ADVERTISING)
--
-- Products are advertised on the marketplace so registered
-- businesses can market what they sell. The marketplace does
-- not process orders; customers contact the business.
-- =========================================================

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,

    business_id INT NOT NULL,
    category_id INT,

    name VARCHAR(200) NOT NULL,
    description TEXT,

    price DECIMAL(10,2) NOT NULL,

    image VARCHAR(500),

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_business
        FOREIGN KEY (business_id)
        REFERENCES businesses(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL,

    UNIQUE (business_id, name)
);


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX idx_users_role
    ON users(role);

CREATE INDEX idx_users_active
    ON users(is_active);

CREATE INDEX idx_services_category
    ON services(category_id);

CREATE INDEX idx_provider_services_provider
    ON provider_services(provider_id);

CREATE INDEX idx_provider_services_service
    ON provider_services(service_id);

CREATE INDEX idx_requests_customer
    ON service_requests(customer_id);

CREATE INDEX idx_requests_service
    ON service_requests(service_id);

CREATE INDEX idx_requests_status
    ON service_requests(status);

CREATE INDEX idx_offers_request
    ON offers(request_id);

CREATE INDEX idx_offers_provider
    ON offers(provider_id);

CREATE INDEX idx_offers_status
    ON offers(status);

CREATE INDEX idx_jobs_customer
    ON jobs(customer_id);

CREATE INDEX idx_jobs_provider
    ON jobs(provider_id);

CREATE INDEX idx_jobs_status
    ON jobs(status);

CREATE INDEX idx_messages_conversation
    ON messages(conversation_id);

CREATE INDEX idx_notifications_user
    ON notifications(user_id);

CREATE INDEX idx_notifications_read
    ON notifications(is_read);

CREATE INDEX idx_complaints_status
    ON complaints(status);

CREATE INDEX idx_advertisements_business
    ON advertisements(business_id);

CREATE INDEX idx_advertisements_status
    ON advertisements(status);

CREATE INDEX idx_product_business
    ON products(business_id);

CREATE INDEX idx_product_category
    ON products(category_id);

CREATE INDEX idx_product_status
    ON products(status);

CREATE INDEX idx_promotions_business
    ON promotions(business_id);

CREATE INDEX idx_promotions_status
    ON promotions(status);

CREATE INDEX idx_conversations_customer
    ON conversations(customer_id);

CREATE INDEX idx_conversations_provider
    ON conversations(provider_id);

CREATE INDEX idx_conversations_request
    ON conversations(request_id);

CREATE INDEX idx_messages_sender
    ON messages(sender_id);

CREATE INDEX idx_reviews_provider
    ON reviews(provider_id);

CREATE INDEX idx_reviews_customer
    ON reviews(customer_id);

CREATE INDEX idx_verification_requests_provider
    ON verification_requests(provider_id);

CREATE INDEX idx_businesses_owner
    ON businesses(owner_id);

CREATE INDEX idx_businesses_verification
    ON businesses(verification_status);

CREATE INDEX idx_complaints_user
    ON complaints(user_id);

CREATE INDEX idx_provider_availability_provider
    ON provider_availability(provider_id);

CREATE INDEX idx_requests_status_created
    ON service_requests(status, created_at);