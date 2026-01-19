import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to Payroll Dashboard</h1>
      <p>Login Successful! Your JWT Token is saved in local storage.</p>
      <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Logout
      </button>
    </div>
  );
};

export default DashboardPage;