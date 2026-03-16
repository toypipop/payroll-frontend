import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import Card from '../../components/common/Card';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        const cleanEmail = email.trim();
        const cleanPassword = password.trim();

        try {
            const response = await api.post('/auth/login', {
                email: cleanEmail,
                password: cleanPassword
            });

            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);

                // Add 'id' to the payload (English Comment)
                const userPayload = {
                    id: response.data.id,
                    fullName: response.data.full_name,
                    roles: response.data.roles
                };
                localStorage.setItem('user', JSON.stringify(userPayload));

                navigate('/dashboard');
            }
        } catch (err) {
            console.error("Login Error:", err);
            if (err.code === "ERR_NETWORK") {
                setError("Can't Connect To Server");
            } else {
                setError(err.response?.data?.error || 'Invalid credentials');
            }
        }
    };
    
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
            <Card style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    borderRadius: '16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    margin: '0 auto 24px auto'
                }}>P</div>

                <h2 style={{ color: '#1e293b', marginBottom: '8px' }}>Payroll Pro</h2>
                <p style={{ color: '#64748b', marginBottom: '32px' }}>Please sign in to your account</p>

                {error && (
                    <div style={{
                        color: '#ef4444',
                        backgroundColor: '#fef2f2',
                        padding: '12px',
                        borderRadius: '10px',
                        marginBottom: '20px',
                        border: '1px solid #fee2e2',
                        fontSize: '14px'
                    }}>{error}</div>
                )}

                <form onSubmit={handleLogin}>
                    <InputField
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <InputField
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Button type="submit">Sign In</Button>
                </form>
            </Card>
        </div>
    );
};

export default LoginPage;
