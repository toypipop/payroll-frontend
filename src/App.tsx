import React, { useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import api from "./api/axiosInstance";
import MainLayout from "./components/layouts/MainLayout";
import type { AppModule, AuthMeResponse, UserProfile } from "./types/api";
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const MyPayslipsPage = lazy(() => import("./pages/payroll/MyPayslipsPage"));
const HelpPage = lazy(() => import("./pages/help/HelpPage"));

const pages = import.meta.glob<{ default: React.ComponentType }>("./pages/**/*.tsx");

interface ProtectedRouteProps {
    isAuthenticated: boolean;
    children: React.ReactNode;
}

const ProtectedRoute = ({ isAuthenticated, children }: ProtectedRouteProps) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};


function App() {
    const [routes, setRoutes] = useState<AppModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const verifySession = async () => {
            try {
                const res = await api.get<AuthMeResponse>("/auth/me");
                const userPayload: UserProfile = {
                    id: res.data.id,
                    fullName: res.data.full_name,
                    roles: res.data.roles,
                    companies_id: res.data.companies_id,
                    accessible_company_ids: res.data.accessible_company_ids || [],
                };
                localStorage.setItem("user", JSON.stringify(userPayload));
                setIsAuthenticated(true);
            } catch {
                localStorage.removeItem("user");
                setIsAuthenticated(false);
            } finally {
                setAuthLoading(false);
            }
        };

        const fetchRoutes = async () => {
            try {
                const res = await api.get<AppModule[]>("/modules");
                const flatList: AppModule[] = [];
                const extract = (items: AppModule[]) => {
                    if (!Array.isArray(items)) return;
                    items.forEach((item) => {
                        if (item.route_path && !item.is_category) {
                            flatList.push(item);
                        }
                        if (item.children && item.children.length > 0) extract(item.children);
                    });
                };
                extract(res.data);
                setRoutes(flatList);
            } catch (err) {
                console.error("Fetch routes error:", err);
            } finally {
                setLoading(false);
            }
        };
        verifySession();
        fetchRoutes();
    }, []);

    if (loading || authLoading) return null;

    return (
        <Router>
            <Suspense fallback={null}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <MainLayout pageTitle="Dashboard">
                                    <DashboardPage />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/my-payslips"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <MainLayout pageTitle="My Payslips">
                                    <MyPayslipsPage />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/help"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <MainLayout pageTitle="Help Center">
                                    <HelpPage />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />

                    {routes.map((m) => {
                        const importFunc = Object.entries(pages).find(
                            ([path]) => path.endsWith(`/${m.module_key}.tsx`)
                        )?.[1];

                        if (!importFunc) {
                            console.warn(`Route skipped: missing page file for module_key "${m.module_key}" in src/pages`);
                            return null;
                        }

                        const Page = lazy(importFunc);

                        return (
                            <Route
                                key={m.id}
                                path={m.route_path ?? undefined}
                                element={
                                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                                        <MainLayout pageTitle={m.module_name}>
                                            <Page />
                                        </MainLayout>
                                    </ProtectedRoute>
                                }
                            />
                        );
                    })}

                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
