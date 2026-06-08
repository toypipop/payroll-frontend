import axios from "axios";
import { useState } from "react";
import type { FormEvent } from "react";

import api from "../../api/axiosInstance";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import InputField from "../../components/common/InputField";

interface LoginResponse {
    id: number;
    full_name: string;
    roles: string[];
    companies_id: number | null;
    accessible_company_ids?: number[];
}

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        const cleanEmail = email.trim();
        const cleanPassword = password.trim();

        try {
            const response = await api.post<LoginResponse>("/auth/login", {
                email: cleanEmail,
                password: cleanPassword,
            });

            if (response.data?.id) {
                const userPayload = {
                    id: response.data.id,
                    fullName: response.data.full_name,
                    roles: response.data.roles,
                    companies_id: response.data.companies_id,
                    accessible_company_ids: response.data.accessible_company_ids || [],
                };
                localStorage.setItem("user", JSON.stringify(userPayload));

                window.location.href = "/dashboard";
            }
        } catch (loginError) {
            console.error("Login Error:", loginError);

            if (axios.isAxiosError<{ error?: string }>(loginError)) {
                setError(
                    loginError.code === "ERR_NETWORK"
                        ? "Can't Connect To Server"
                        : loginError.response?.data?.error || "Invalid credentials",
                );
                return;
            }

            setError("Invalid credentials");
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `
                    radial-gradient(circle at 15% 25%, rgba(15, 118, 110, 0.55) 0%, transparent 50%),
                    radial-gradient(circle at 85% 75%, rgba(245, 158, 11, 0.35) 0%, transparent 50%),
                    radial-gradient(circle at 75% 10%, rgba(15, 118, 110, 0.25) 0%, transparent 40%),
                    radial-gradient(circle at 25% 85%, rgba(245, 158, 11, 0.2) 0%, transparent 40%),
                    linear-gradient(135deg, #0b1a19 0%, #0f2421 100%)
                `,
            }}
        >
            <Card
                style={{
                    maxWidth: "400px",
                    width: "100%",
                    textAlign: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    boxShadow: "0 32px 64px rgba(0, 0, 0, 0.4)",
                }}
            >
                <div
                    style={{
                        width: "60px",
                        height: "60px",
                        backgroundColor: "var(--primary-color)",
                        color: "white",
                        borderRadius: "16px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        fontWeight: "bold",
                        margin: "0 auto 24px auto",
                    }}
                >
                    P
                </div>

                <h2 style={{ color: "#f8fafc", marginBottom: "8px" }}>Payroll Pro</h2>
                <p style={{ color: "rgba(255,255,255,0.55)", marginBottom: "32px" }}>
                    Please sign in to your account
                </p>

                {error && (
                    <div
                        style={{
                            color: "#fca5a5",
                            backgroundColor: "rgba(239, 68, 68, 0.15)",
                            padding: "12px",
                            borderRadius: "10px",
                            marginBottom: "20px",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            fontSize: "14px",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <InputField
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        style={{
                            backgroundColor: "rgba(255,255,255,0.08)",
                            color: "#f8fafc",
                            border: "1px solid rgba(255,255,255,0.18)",
                        }}
                    />
                    <InputField
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        style={{
                            backgroundColor: "rgba(255,255,255,0.08)",
                            color: "#f8fafc",
                            border: "1px solid rgba(255,255,255,0.18)",
                        }}
                    />
                    <Button type="submit">Sign In</Button>
                </form>
            </Card>
        </div>
    );
};

export default LoginPage;
