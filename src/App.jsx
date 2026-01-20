import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeeListPage from "./pages/Employee/EmployeeListPage";
import MainLayout from "./components/layouts/MainLayout";
import SettingsPage from "./pages/Settings/SettingsPage";

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" />;
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />

                {/* Private Routes */}
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

                <Route
                    path="/employees"
                    element={
                        <ProtectedRoute>
                            <MainLayout pageTitle="Employee List">
                                <EmployeeListPage />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                {/* 2. Add Settings Route */}
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <MainLayout pageTitle="System Settings">
                                <SettingsPage />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
}

export default App;
