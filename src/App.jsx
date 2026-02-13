import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import MainLayout from "./components/layouts/MainLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeesListPage from "./pages/EmployeesListPage";
import SettingsPage from "./pages/Setting/SettingsPage";
import SalariesStructurePage from "./pages/SalariesStructurePage";

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
                            <MainLayout pageTitle="Employees List">
                                <EmployeesListPage />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

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
                
                <Route
                    path="/salaries"
                    element={
                        <ProtectedRoute>
                            <MainLayout pageTitle="Salaries Structure">
                                <SalariesStructurePage />
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
