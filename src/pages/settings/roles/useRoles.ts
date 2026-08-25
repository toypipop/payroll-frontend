import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { Company, Role } from "../../../types/domain";
import type { ApiId } from "../../../types/api";

// useRoles owns the page's server data: the lists it renders, the loading flag, and the calls that change them.
export const useRoles = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRoles = async () => {
        const res = await api.get("/roles");
        setRoles(res.data);
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [rolesRes, companiesRes] = await Promise.all([
                api.get("/roles"),
                api.get("/companies/options")
            ]);
            setRoles(rolesRes.data);
            setCompanies(companiesRes.data);
        } catch {
            console.error("Initial load failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInitialData(); }, []);

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Are you sure you want to delete this role?")) return;
        try {
            await api.delete(`/roles/${id}`);
            await fetchRoles();
        } catch {
            alert("Delete failed");
        }
    };

    return { roles, companies, loading, fetchRoles, remove };
};

export default useRoles;
