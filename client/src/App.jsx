import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import ForgotPassword from "./pages/public/ForgotPassword";
import ResetPassword from "./pages/public/ResetPassword";
import VerifyEmail from "./pages/public/VerifyEmail";
import NotFound from "./pages/public/NotFound";

const CustomerDashboard = lazy(() => import("./pages/customer/Dashboard"));
const MyRequests = lazy(() => import("./pages/customer/MyRequests"));
const CreateRequest = lazy(() => import("./pages/customer/CreateRequest"));
const RequestDetail = lazy(() => import("./pages/customer/RequestDetail"));
const Services = lazy(() => import("./pages/customer/Services"));
const Products = lazy(() => import("./pages/customer/Products"));
const Providers = lazy(() => import("./pages/customer/Providers"));
const ProviderProfile = lazy(() => import("./pages/customer/ProviderProfile"));
const Jobs = lazy(() => import("./pages/customer/Jobs"));
const JobDetail = lazy(() => import("./pages/job/JobDetail"));
const ReviewJob = lazy(() => import("./pages/customer/Review"));
const Messages = lazy(() => import("./pages/messages/Messages"));
const Notifications = lazy(() => import("./pages/notifications/Notifications"));
const Complaints = lazy(() => import("./pages/complaints/Complaints"));

const ProviderDashboard = lazy(() => import("./pages/provider/Dashboard"));
const ProviderProfileEdit = lazy(() => import("./pages/provider/Profile"));
const ProviderServices = lazy(() => import("./pages/provider/Services"));
const ProviderJobs = lazy(() => import("./pages/provider/Jobs"));
const AvailableRequests = lazy(() => import("./pages/provider/AvailableRequests"));
const ProviderRequestDetail = lazy(() => import("./pages/provider/ProviderRequestDetail"));
const MyOffers = lazy(() => import("./pages/provider/MyOffers"));
const Verification = lazy(() => import("./pages/provider/Verification"));
const BusinessDashboard = lazy(() => import("./pages/business/Dashboard"));
const BusinessProfile = lazy(() => import("./pages/business/Profile"));
const BusinessProducts = lazy(() => import("./pages/business/Products"));
const BusinessAdvertisements = lazy(() => import("./pages/business/Advertisements"));
const BusinessPromotions = lazy(() => import("./pages/business/Promotions"));
const BusinessAnalytics = lazy(() => import("./pages/business/Analytics"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminComplaints = lazy(() => import("./pages/admin/Complaints"));
const AdminVerification = lazy(() => import("./pages/admin/Verification"));
const AdminBusinesses = lazy(() => import("./pages/admin/Businesses"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminProviders = lazy(() => import("./pages/admin/Providers"));
const Settings = lazy(() => import("./pages/settings/Settings"));

import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

import Button from "./components/ui/Button";
import Icon from "./components/ui/Icon";
import ErrorBoundary from "./components/ui/ErrorBoundary";

import {
    CUSTOMER_NAV,
    PROVIDER_NAV,
    BUSINESS_NAV,
    ADMIN_NAV
} from "./constants/navigation";

function PageLoader() {
    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5">
            <span className="animate-bounce-in relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/30">
                <Icon name="bolt" className="h-7 w-7" />
            </span>
            <div className="h-1.5 w-44 overflow-hidden rounded-full bg-slate-200">
                <div className="qf-loading-bar h-full w-1/2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Loading QuickFix
            </p>
        </div>
    );
}

function FeaturePlaceholder() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icon name="wrench" className="h-10 w-10 text-slate-300" />
            <h1 className="mt-4 text-xl font-semibold text-slate-900">
                This section is being built
            </h1>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
                This feature will be added in the next phase of the
                QuickFix development roadmap.
            </p>
            <Link to="/" className="mt-5">
                <Button variant="outline">Back to marketplace</Button>
            </Link>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        {/* Public routes */}
                        <Route element={<MainLayout />}>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route
                                path="/verify-email"
                                element={<VerifyEmail />}
                            />
                            <Route
                                path="/forgot-password"
                                element={<ForgotPassword />}
                            />
                            <Route
                                path="/reset-password"
                                element={<ResetPassword />}
                            />
                            <Route path="*" element={<NotFound />} />
                        </Route>

                    {/* Customer */}
                    <Route
                        element={
                            <ProtectedRoute allowedRoles={["CUSTOMER"]} />
                        }
                    >
                        <Route
                            element={
                                <DashboardLayout navItems={CUSTOMER_NAV} />
                            }
                        >
                            <Route
                                path="/customer/dashboard"
                                element={<CustomerDashboard />}
                            />
                            <Route
                                path="/customer/requests"
                                element={<MyRequests />}
                            />
                            <Route
                                path="/customer/requests/new"
                                element={<CreateRequest />}
                            />
                            <Route
                                path="/customer/requests/:id"
                                element={<RequestDetail />}
                            />
                            <Route
                                path="/customer/services"
                                element={<Services />}
                            />
                            <Route
                                path="/customer/services/:categoryId"
                                element={<Services />}
                            />
                            <Route
                                path="/customer/products"
                                element={<Products />}
                            />
                            <Route
                                path="/customer/providers"
                                element={<Providers />}
                            />
                            <Route
                                path="/customer/providers/:id"
                                element={<ProviderProfile />}
                            />
                            <Route
                                path="/customer/jobs"
                                element={<Jobs />}
                            />
                            <Route
                                path="/customer/jobs/:id"
                                element={<JobDetail />}
                            />
                            <Route
                                path="/customer/review/:jobId"
                                element={<ReviewJob />}
                            />
                            <Route
                                path="/customer/messages"
                                element={<Messages />}
                            />
                            <Route
                                path="/customer/messages/:conversationId"
                                element={<Messages />}
                            />
                            <Route
                                path="/customer/notifications"
                                element={<Notifications />}
                            />
                            <Route
                                path="/customer/complaints"
                                element={<Complaints />}
                            />
                            <Route
                                path="/customer/settings"
                                element={<Settings />}
                            />
                            <Route
                                path="/customer/*"
                                element={<FeaturePlaceholder />}
                            />
                        </Route>
                    </Route>

                    {/* Provider */}
                    <Route
                        element={
                            <ProtectedRoute allowedRoles={["PROVIDER"]} />
                        }
                    >
                        <Route
                            element={
                                <DashboardLayout navItems={PROVIDER_NAV} />
                            }
                        >
                            <Route
                                path="/provider/dashboard"
                                element={<ProviderDashboard />}
                            />
                            <Route
                                path="/provider/profile"
                                element={<ProviderProfileEdit />}
                            />
                            <Route
                                path="/provider/services"
                                element={<ProviderServices />}
                            />
                            <Route
                                path="/provider/requests"
                                element={<AvailableRequests />}
                            />
                            <Route
                                path="/provider/requests/:id"
                                element={<ProviderRequestDetail />}
                            />
                            <Route
                                path="/provider/offers"
                                element={<MyOffers />}
                            />
                            <Route
                                path="/provider/verification"
                                element={<Verification />}
                            />
                            <Route
                                path="/provider/jobs"
                                element={<ProviderJobs />}
                            />
                            <Route
                                path="/provider/jobs/:id"
                                element={<JobDetail />}
                            />
                            <Route
                                path="/provider/messages"
                                element={<Messages />}
                            />
                            <Route
                                path="/provider/messages/:conversationId"
                                element={<Messages />}
                            />
                            <Route
                                path="/provider/notifications"
                                element={<Notifications />}
                            />
                            <Route
                                path="/provider/complaints"
                                element={<Complaints />}
                            />
                            <Route
                                path="/provider/settings"
                                element={<Settings />}
                            />
                            <Route
                                path="/provider/*"
                                element={<FeaturePlaceholder />}
                            />
                        </Route>
                    </Route>

                    {/* Business owner */}
                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={["BUSINESS_OWNER"]}
                            />
                        }
                    >
                        <Route
                            element={
                                <DashboardLayout navItems={BUSINESS_NAV} />
                            }
                        >
                            <Route
                                path="/business/dashboard"
                                element={<BusinessDashboard />}
                            />
                            <Route
                                path="/business/profile"
                                element={<BusinessProfile />}
                            />
                            <Route
                                path="/business/products"
                                element={<BusinessProducts />}
                            />
                            <Route
                                path="/business/advertisements"
                                element={<BusinessAdvertisements />}
                            />
                            <Route
                                path="/business/promotions"
                                element={<BusinessPromotions />}
                            />
                            <Route
                                path="/business/analytics"
                                element={<BusinessAnalytics />}
                            />
                            <Route
                                path="/business/notifications"
                                element={<Notifications />}
                            />
                            <Route
                                path="/business/settings"
                                element={<Settings />}
                            />
                            <Route
                                path="/business/*"
                                element={<Navigate to="/business/dashboard" replace />}
                            />
                        </Route>
                    </Route>

                    {/* Admin */}
                    <Route
                        element={
                            <ProtectedRoute allowedRoles={["ADMIN"]} />
                        }
                    >
                        <Route
                            element={
                                <DashboardLayout navItems={ADMIN_NAV} />
                            }
                        >
                            <Route
                                path="/admin/dashboard"
                                element={<AdminDashboard />}
                            />
                            <Route
                                path="/admin/users"
                                element={<AdminUsers />}
                            />
                            <Route
                                path="/admin/providers"
                                element={<AdminProviders />}
                            />
                            <Route
                                path="/admin/complaints"
                                element={<AdminComplaints />}
                            />
                            <Route
                                path="/admin/verification"
                                element={<AdminVerification />}
                            />
                            <Route
                                path="/admin/businesses"
                                element={<AdminBusinesses />}
                            />
                            <Route
                                path="/admin/providers/:id"
                                element={<ProviderProfile />}
                            />
                            <Route
                                path="/admin/settings"
                                element={<Settings />}
                            />
                            <Route
                                path="/admin/*"
                                element={<FeaturePlaceholder />}
                            />
                        </Route>
                    </Route>
                </Routes>
            </Suspense>
            </ErrorBoundary>
        </BrowserRouter>
    );
}

export default App;