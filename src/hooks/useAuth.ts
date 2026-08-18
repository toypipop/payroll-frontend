import { useContext } from "react";
import { AuthContext } from "../contexts/authContextValue";
import type { AuthContextValue } from "../contexts/authContextValue";

// useAuth reads the signed-in user. Every protected page renders only after App resolved /auth/me, so user is set by then.
export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }
    return context;
};

export default useAuth;
