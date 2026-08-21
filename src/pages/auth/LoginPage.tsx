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
                // A full page load is what re-runs App's /auth/me, which is the single source of the signed-in user.
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
        <div className="flex min-h-screen items-center justify-center bg-auth"
        >
            <Card className="w-full max-w-[400px] border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.08)] text-center shadow-[0_32px_64px_rgba(0,0,0,0.4)] backdrop-blur-[24px]">
                <div className="mx-auto mb-6 inline-flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white"
                >
                    P
                </div>

                <h2 className="mb-[8px] text-2xl font-bold text-inverse">Payroll Pro</h2>
                <p className="text-[color:rgba(255,255,255,0.55)] mb-[32px]">
                    Please sign in to your account
                </p>

                {error && (
                    <div
                        className="text-danger-line bg-[color:rgba(239,_68,_68,_0.15)] p-[12px] rounded-[10px] mb-[20px] border border-[color:rgba(239,_68,_68,_0.3)] text-[14px]"
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
                        className="border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] text-inverse"
                    />
                    <InputField
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        className="border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] text-inverse"
                    />
                    <Button type="submit">Sign In</Button>
                </form>
            </Card>
        </div>
    );
};

export default LoginPage;
