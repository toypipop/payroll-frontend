import { useMemo } from "react";
import type { ReactNode } from "react";
import type { UserProfile } from "../types/api";
import { AuthContext } from "./authContextValue";
import type { AuthContextValue } from "./authContextValue";

// AuthProvider publishes the signed-in user App resolved from /auth/me, so no page parses localStorage at module load and then serves a stale value for the rest of the session.
export const AuthProvider = ({ user, children }: { user: UserProfile | null; children: ReactNode }) => {
    const value = useMemo<AuthContextValue>(
        () => ({ user, homeCompanyId: String(user?.companies_id ?? "") }),
        [user],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
