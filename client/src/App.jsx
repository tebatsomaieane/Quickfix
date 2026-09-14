import { Link } from "react-router-dom";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import ForgotPassword from "./pages/public/ForgotPassword";
import ResetPassword from "./pages/public/ResetPassword";

import CustomerDashboard from "./pages/customer/Dashboard";
import MyRequests from "./pages/customer/MyRequests";
import CreateRequest from "./pages/customer/CreateRequest";
import RequestDetail from "./pages/customer/RequestDetail";
import Services from "./pages/customer/Services";
import Products from "./pages/customer/Products";
import Providers from "./pages/customer/Providers";
import ProviderProfile from "./pages/customer/ProviderProfile";
import Jobs from "./pages/customer/Jobs";
import JobDetail from "./pages/job/JobDetail";
import ReviewJob from "./pages/customer/Review";
import Messages from "./pages/messages/Messages";
import Notifications from "./pages/notifications/Notifications";
import Complaints from "./pages/complaints/Complaints";

import ProviderDashboard from "./pages/provider/Dashboard";
import ProviderProfileEdit from "./pages/provider/Profile";
import ProviderServices from "./pages/provider/Services";
import ProviderJobs from "./pages/provider/Jobs";
import AvailableRequests from "./pages/provider/AvailableRequests";
import ProviderRequestDetail from "./pages/provider/ProviderRequestDetail";
import MyOffers from "./pages/provider/MyOffers";
import Verification from "./pages/provider/Verification";
import BusinessDashboard from "./pages/business/Dashboard";
import BusinessProfile from "./pages/business/Profile";
import BusinessProducts from "./pages/business/Products";
import BusinessAdvertisements from "./pages/business/Advertisements";
import BusinessPromotions from "./pages/business/Promotions";
import BusinessAnalytics from "./pages/business/Analytics";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminComplaints from "./pages/admin/Complaints";
import AdminVerification from "./pages/admin/Verification";
import AdminBusinesses from "./pages/admin/Businesses";
import AdminUsers from "./pages/admin/Users";
import AdminProviders from "./pages/admin/Providers";
import Settings from "./pages/settings/Settings";

import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

import Button from "./components/ui/Button";
import Icon from "./components/ui/Icon";

import {
    CUSTOMER_NAV,
    PROVIDER_NAV,
    BUSINESS_NAV,
    ADMIN_NAV
} from "./constants/navigation";

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
                <Routes>
                    {/* Public routes */}
                    <Route element={<MainLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/forgot-password"
                            element={<ForgotPassword />}
                        />
                        <Route
                            path="/reset-password"
                            element={<ResetPassword />}
                        />
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

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
    );
}

export default App;