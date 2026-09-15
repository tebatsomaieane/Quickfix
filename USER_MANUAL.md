# QuickFix User Manual

This manual covers every feature of the QuickFix platform, organized by role.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Customer Guide](#2-customer-guide)
3. [Provider Guide](#3-provider-guide)
4. [Business Owner Guide](#4-business-owner-guide)
5. [Admin Guide](#5-admin-guide)
6. [Common Tasks](#6-common-tasks)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Getting Started

### Registration

1. Visit the QuickFix home page and click **Sign up**.
2. Enter your first name, last name, phone number, email and a password (min. 6 characters).
3. Choose your role:
   - **Customer** — you want to hire a service provider.
   - **Provider** — you offer professional services.
   - **Business Owner** — you run a business and want to advertise on the marketplace.
4. Click **Create account**. You are redirected to your dashboard.

### Logging In

1. Go to **Log in** and enter your email and password.
2. You will be redirected to the dashboard for your role:
   - Customer → `/customer/dashboard`
   - Provider → `/provider/dashboard`
   - Business Owner → `/business/dashboard`
   - Admin → `/admin/dashboard`

### Password Reset

1. On the login screen, click **Forgot your password?**
2. Enter the email address registered to your account.
3. Follow the instructions sent to your email.
4. Open the reset link and enter a new password.

### Account Deactivation

If you receive a message saying *"Your account has been deactivated"*,
contact the platform administrator.

---

## 2. Customer Guide

### Dashboard

Your dashboard shows:
- Total active requests
- Jobs in progress
- Pending offers awaiting your decision
- Recent activity

### Browsing Services

**Services** (`/customer/services`):
- Browse all available services grouped by category.
- Use the search bar and category filter to narrow results.
- Click a service card to see details.

**Categories** (`/customer/services`):
- Categories are displayed at the top; click one to filter to that category's services.

### Browse Providers

**Providers** (`/customer/providers`):
- View the full provider directory.
- Search by name or service.
- Filter by category or verification status.
- Click a provider card to view their profile, services, availability, and reviews.

### Post a Service Request

1. Go to **My Requests** → **+ New Request**.
2. Fill in:
   - **Title** — short description (e.g., "Fix kitchen leak")
   - **Description** — detailed explanation of the problem
   - **Service** — select from available services
   - **Budget** — your budget (in Maloti, M)
   - **Preferred date** — when you'd like the work done
   - **Attachments** — any photos or documents (optional)
3. Click **Submit**. Providers will be notified and can send you offers.

> **Uploading photos & videos:** you can attach up to 6 photos or short
> videos when posting a request. Uploads are stored securely by QuickFix and
> shown to providers so they can quote accurately.

### View & Cancel a Request

- Open **My Requests** to see all your requests with offer counts.
- Click a request to view its full details, received offers, and related jobs.
- To cancel an open request, click **Cancel request**. All pending offers are
  automatically withdrawn and the affected providers are notified.

### Accept an Offer

1. On your request detail page, review all received offers.
2. Each offer shows the provider's price, message, estimated hours, and validity.
3. Click **Accept** on the offer you prefer.
   - A **job is automatically created**.
   - All other pending offers on this request are rejected.
   - The accepted provider is notified.

### Manage Jobs

**My Jobs** (`/customer/jobs`):
- View jobs where you are the customer, with status badges (ASSIGNED, IN_PROGRESS, COMPLETED).
- Click a job for the full detail page.

**Job Detail**:
- See the assigned provider, associated request, and timeline.
- Once the provider marks the job complete, you can leave a review.

### Messaging Providers

- From a job or request detail page, click **Send Message** to open a conversation thread.
- Conversations are scoped to the request — both you and the provider see the thread.
- Type your message and press Enter. Messages are delivered instantly.

### Reviews

- After a job is completed, go to **Reviews** → **Available to review**.
- Submit a rating (1–5 stars) and an optional comment.
- Providers will be notified and may respond to your review.

### Complaints

- If something went wrong with a job, go to **Complaints** → **File Complaint**.
- Describe the issue and submit. An admin will review it.

---

## 3. Provider Guide

### Dashboard

Your dashboard shows:
- Number of pending offers
- Active / completed jobs
- Average rating
- Verification status

### Managing Your Profile

**My Profile** (`/provider/profile`):
- Update your description, profile photo, experience years, location, and service area.
- Choose a clear photo of your face — customers trust verified-looking profiles.
- Click **Save** after editing.

### Managing Your Services

**My Services** (`/provider/services`):
- The list of services you offer and your price for each.
- Check/uncheck services and set your price.
- Click **Save** — your full service list is replaced atomically.

### Managing Availability

**My Availability** (`/provider/profile` tab):
- For each day of the week, set your start time, end time, and toggle availability on/off.
- Click **Save** to update the schedule.

### Browsing Open Requests

**Available Requests** (`/provider/requests`):
- Browse service requests from customers that are still open.
- Filter by category, budget range, or search keywords.
- Click a request to view its details and submit an offer.

### Submitting an Offer

1. Open a request detail page.
2. Fill in:
   - **Price** — your quoted price (required, positive number)
   - **Message** — explain your approach or ask clarifying questions
   - **Estimated hours** — how long you expect the job to take
   - **Valid until** — expiry date for your offer (optional)
3. Click **Submit offer**.

### My Offers

**My Offers** (`/provider/offers`):
- See all your offers with status (PENDING, ACCEPTED, REJECTED, WITHDRAWN).
- Click an offer to view details.
- **Edit** a pending offer to update price or message.
- **Withdraw** a pending offer if you change your mind.

### Managing Jobs

**My Jobs** (`/provider/jobs`):
- View jobs where you are the assigned provider.

**Job Detail**:
- **Start** an ASSIGNED job to begin work.
- **Complete** an IN_PROGRESS job when you finish the work.

### Responding to Reviews

- When a customer leaves a review on your profile, you can submit a response.
- Open the review detail and click **Respond**.
- You may respond to each review only once.

### Verification

**Verification** (`/provider/verification`):
- Submit your identity and professional documents for verification.
- Once approved, the verified badge appears on your profile.
- You can check the current status and latest submission details.

---

## 4. Business Owner Guide

### Dashboard

Your dashboard shows:
- Products count (active / inactive)
- Advertisements status breakdown
- Promotions status breakdown
- Number of linked providers

### Business Profile

**My Profile** (`/business/profile`):
- Update your business name, description, logo, cover photo, contact details, and operating hours.
- Changes take effect immediately.

### Managing Products

**My Products** (`/business/products`):
- **Create** a new product by clicking **+ New product** and filling in name,
  description, price, category (optional), and an uploaded product photo.
- **Edit** an existing product inline.
- **Delete** a product (irreversible).
- Products appear on the marketplace once your business is verified.

### Creating Advertisements

**My Advertisements** (`/business/advertisements`):
1. Click **+ New advertisement**.
2. Enter title, description, image URL (optional), start date, and end date.
3. Click **Create** — the advertisement is created in **PENDING** status.
4. An admin must approve (set to ACTIVE) before it appears publicly.

### Creating Promotions

**My Promotions** (`/business/promotions`):
1. Click **+ New promotion**.
2. Enter title, description, discount percentage (0–100), start date, and end date.
3. Click **Create** — the promotion starts as **PENDING**.
4. An admin must approve it before customers see it on the marketplace.

### Analytics

**Analytics** (`/business/analytics`):
- Product counts by status (active, inactive).
- Advertisement counts by status (active, pending, paused/expired/rejected).
- Promotion counts by status.
- Number of providers linked to your business.

### Business Verification

- Go to **Profile** → **Request Verification**.
- Submit verification documents. The status changes to **PENDING**.
- An admin will review and approve or reject your request.

---

## 5. Admin Guide

### Dashboard

**Admin Dashboard** (`/admin/dashboard`):
- Total users, providers, customers, business owners.
- Total jobs, completed jobs.
- Average platform rating.
- Active advertisements.

### User Management

**Users** (`/admin/users`):
- Search users by name or email.
- Filter by role.
- Toggle a user's **active** status (deactivation bans the user from logging in).
- Change a user's role (you cannot modify your own account).

### Complaint Management

**Complaints** (`/admin/complaints`):
- View all complaints sorted by urgency (PENDING first).
- Update complaint status (OPEN → IN_PROGRESS → RESOLVED / DISMISSED).
- Add an admin response; the filing user is notified.

### Provider Verification

**Verification** (`/admin/verification`):
- View all provider verification requests.
- Approve or reject each request.
- The provider is notified of the decision; the profile's verification status is updated automatically.

### Business Verification

**Businesses** (`/admin/businesses`):
- View all business owners.
- Approve or reject a business verification request.
- The business owner is notified.

### Advertisement & Promotion Review

**Approving Content** — use the API directly:

```
PATCH /api/admin/advertisements/:id   { "status": "ACTIVE" | "REJECTED" | "PAUSED" }
PATCH /api/admin/promotions/:id       { "status": "ACTIVE" | "REJECTED" | "PAUSED" }
```

- Business advertisements and promotions default to **PENDING** on creation.
- Only **ACTIVE** items appear on the public marketplace pages.
- When you approve, pause, or reject an item, the business owner receives a notification.

> **Note:** The admin dashboard currently does not include a web UI for
> advertisement/promotion review. Use the API endpoints above, or extend
> the admin dashboard to add the review interface.

---

## 6. Common Tasks

### Change Your Password

1. Click your avatar in the top-right and select **Settings** (or navigate to `/settings`).
2. Click **Change Password**.
3. Enter your current password and a new password (min. 6 characters).
4. Click **Change**. You may need to log in again.

### Update Profile Image / Details

- **Customers**: go to **Settings** and update your name, phone, profile image, or location.
- **Providers**: go to **My Profile** on the provider dashboard.
- **Business Owners**: go to **My Profile** on the business dashboard.

### View Notifications

- Click the bell icon in the top-right of the dashboard.
- Unread notifications are highlighted.
- Click **Mark all as read** to clear the badge, or delete individual notifications.

---

## 7. Troubleshooting

### "Access denied. No token provided"

- You were logged out (session expired). Log in again.
- Clear browser cookies if the issue persists.

### "Your account has been deactivated"

- Your account was deactivated by an admin. Contact the platform administrator.

### Form validation errors

- Ensure all required fields are filled.
- Names must be ≤ 100 characters.
- Email must be in valid format.
- Password must be ≥ 6 characters.

### Offers not appearing

- The service request may have moved out of OPEN/OFFERS_RECEIVED status.
- Check the request's current status in **My Requests**.

### Why is my advertisement still PENDING?

- Advertisements and promotions require admin approval.
- They will remain PENDING until an admin reviews and sets the status to ACTIVE.

### Photos not loading

- Photos are uploaded by users through the app and served from the API server.
- If images appear blank, check that the API server is reachable at its
  configured URL (`VITE_API_URL` on the frontend, `PUBLIC_API_URL` on the
  server).
- Until a user uploads their own photo, the app shows a gradient or their
  initials — this is normal and by design.

---

## Contact

- Phone / WhatsApp: **+266 5779 9537**
- Email: support@quickfix.co.ls
- Location: Maseru, Lesotho

---

*QuickFix v1.0 — Last updated September 2026*