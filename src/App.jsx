import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeeListPage from './pages/Employee/EmployeeListPage';
import MainLayout from './components/layouts/MainLayout';

// Higher-order component to protect private routes
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  // Redirect to login if token is missing
  if (!token) return <Navigate to="/login" />;
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Private Routes (Wrapped with ProtectedRoute and MainLayout) */}
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

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;