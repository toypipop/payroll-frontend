import React, { useEffect, useState, Suspense, lazy, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import api from "./api/axiosInstance";
import { SESSION_EXPIRED_EVENT } from "./api/sessionEvents";
import { AuthProvider } from "./contexts/AuthContext";
import { ModuleProvider } from "./contexts/ModuleContext";
import { NotificationProvider } from "./contexts/NotificationProvider";
import MainLayout from "./components/layouts/MainLayout";
import type { AuthMeResponse, UserProfile } from "./types/api";
import { flattenModulePages } from "./contexts/moduleTree";
import { useModules } from "./hooks/useModules";
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const MyPayslipsPage = lazy(() => import("./pages/payroll/MyPayslipsPage"));

const pages = import.meta.glob<{ default: React.ComponentType }>("./pages/**/*.tsx");

interface ProtectedRouteProps {
    isAuthenticated: boolean;
    children: React.ReactNode;
}

const ProtectedRoute = ({ isAuthenticated, children }: ProtectedRouteProps) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};


const ApplicationRoutes = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
    const { modules, loading } = useModules();
    const routes = useMemo(() => flattenModulePages(modules).filter(
        (module) => module.route_path !== "/dashboard" && module.route_path !== "/my-payslips",
    ), [modules]);

    if (loading) return null;

    return (
        <Suspense fallback={null}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                        <MainLayout pageTitle="Dashboard"><DashboardPage /></MainLayout>
                    </ProtectedRoute>
                } />
                <Route path="/my-payslips" element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                        <MainLayout pageTitle="My Payslips"><MyPayslipsPage /></MainLayout>
                    </ProtectedRoute>
                } />
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
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Suspense>
    );
};

function App() {
    const [authLoading, setAuthLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        let active = true;
        let expired = false;
        const controller = new AbortController();
        const expireSession = () => {
            expired = true;
            setUser(null);
            setIsAuthenticated(false);
            setAuthLoading(false);
        };
        window.addEventListener(SESSION_EXPIRED_EVENT, expireSession);

        const verifySession = async () => {
            try {
                const res = await api.get<AuthMeResponse>("/auth/me", { signal: controller.signal });
                // A late response must not restore a session already rejected by another request.
                if (!active || expired) return;
                const userPayload: UserProfile = {
                    id: res.data.id,
                    fullName: res.data.full_name,
                    roles: res.data.roles,
                    companies_id: res.data.companies_id,
                    accessible_company_ids: res.data.accessible_company_ids || [],
                };
                setUser(userPayload);
                setIsAuthenticated(true);
            } catch {
                if (!active) return;
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                if (active) setAuthLoading(false);
            }
        };

        void verifySession();
        return () => {
            active = false;
            controller.abort();
            window.removeEventListener(SESSION_EXPIRED_EVENT, expireSession);
        };
    }, []);

    if (authLoading) return null;

    return (
        <NotificationProvider>
            <AuthProvider user={user}>
                <ModuleProvider key={String(user?.id ?? "anonymous")} user={user}>
                    <Router>
                        <ApplicationRoutes isAuthenticated={isAuthenticated} />
                    </Router>
                </ModuleProvider>
            </AuthProvider>
        </NotificationProvider>
    );
}

export default App;
