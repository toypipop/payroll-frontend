import { Fragment, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import api from "../../api/axiosInstance";
import type { Company } from "../../types/domain";
import Button from "../common/Button";

// Re-mounting clears page-owned records, selectors and open forms together.
// Focus only refreshes the page when the available company membership changed.
function CompanyAccessContent({ children }: { children?: ReactNode }) {
    const [message, setMessage] = useState("");
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        let disposed = false;
        let signature: string | undefined;
        let request = 0;
        const checkCompanies = async () => {
            const currentRequest = ++request;
            try {
                const response = await api.get<Company[]>("/companies/options");
                if (disposed || currentRequest !== request) return;
                const next = JSON.stringify(response.data.map((company) => String(company.id)).sort());
                if (signature !== undefined && signature !== next) {
                    setMessage("");
                    setRevision((value) => value + 1);
                }
                signature = next;
            } catch {
                // Existing page requests surface their own network errors.
            }
        };
        const onInactive = (event: Event) => {
            const detail: unknown = (event as CustomEvent<unknown>).detail;
            setMessage(typeof detail === "string" ? detail : "This company is inactive. Its records are unavailable.");
        };
        window.addEventListener("company-inactive", onInactive);
        window.addEventListener("focus", checkCompanies);
        void checkCompanies();
        return () => {
            disposed = true;
            window.removeEventListener("company-inactive", onInactive);
            window.removeEventListener("focus", checkCompanies);
        };
    }, []);

    if (message) return (
        <div role="alert" className="space-y-4 p-4">
            <p className="text-danger">{message}</p>
            <p className="text-sm text-muted">Reload to select an active company. Inactive companies can be reactivated in Companies settings.</p>
            <Button onClick={() => { setMessage(""); setRevision((value) => value + 1); }}>Reload available data</Button>
        </div>
    );
    return <Fragment key={revision}>{children}</Fragment>;
}

export default function CompanyAccessBoundary({ children }: { children?: ReactNode }) {
    const location = useLocation();
    return <CompanyAccessContent key={location.pathname}>{children}</CompanyAccessContent>;
}
