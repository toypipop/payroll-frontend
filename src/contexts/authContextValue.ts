import { createContext } from "react";
import type { UserProfile } from "../types/api";

export interface AuthContextValue {
    user: UserProfile | null;
    // homeCompanyId is the string form every company SelectField defaults to, empty when the session has no home company.
    homeCompanyId: string;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
