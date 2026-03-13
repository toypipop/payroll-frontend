import React, { useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import api from "../src/api/axiosInstance";
import MainLayout from "./components/layouts/MainLayout";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";

const pages = import.meta.glob("./pages/**/*.jsx");

const ProtectedRoute = ({ children }) => {
    return localStorage.getItem("token") ? children : <Navigate to="/login" replace />;
};


function App() {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                const res = await api.get("/modules");
                const flatList = [];
                const extract = (items) => {
                    if (!Array.isArray(items)) return;
                    items.forEach(item => {
                        if (item.route_path && !item.is_category) {
                            flatList.push(item);
                        }
                        if (item.children?.length > 0) extract(item.children);
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
        fetchRoutes();
    }, []);

    if (loading) return null;

    return (
        <Router>
            <Suspense fallback={null}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <MainLayout pageTitle="Dashboard">
                                    <DashboardPage />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />

                    {routes.map((m) => {
                        const importFunc = Object.entries(pages).find(
                            ([path]) => path.endsWith(`/${m.module_key}.jsx`)
                        )?.[1];

                        if (!importFunc) {
                            console.warn(`⚠️ Route skipped: File ${pagePath} not found in src/pages/`);
                            return null;
                        }

                        const Page = lazy(importFunc);

                        return (
                            <Route
                                key={m.id}
                                path={m.route_path}
                                element={
                                    <ProtectedRoute>
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