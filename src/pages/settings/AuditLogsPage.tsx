import { useEffect, useState } from "react";

import api from "../../api/axiosInstance";
import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";
import SelectField from "../../components/common/SelectField";
import Table from "../../components/common/Table";
import type { TableColumn } from "../../types/api";
import type { Company } from "../../types/domain";
import { bangkokDateKey, formatDisplayTime } from "../../utils/bangkokTime";

interface AuditLogRow {
    id: number;
    occurred_at: string;
    actor_name_snapshot: string;
    event_type: string;
    entity_type: string;
    summary: string;
    reason: string;
}

const formatOccurredAt = (value: string) => `${bangkokDateKey(value)} ${formatDisplayTime(value)}`;

const AuditLogsPage = () => {
    const [rows, setRows] = useState<AuditLogRow[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyID, setCompanyID] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        api.get<AuditLogRow[]>("/audit-logs", { params: companyID ? { companies_id: companyID } : undefined })
            .then((response) => { if (active) setRows(response.data); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [companyID]);

    useEffect(() => {
        api.get<Company[]>("/companies/options")
            .then((companyResponse) => {
                const nextCompanies = companyResponse.data || [];
                setCompanies(nextCompanies);
                if (nextCompanies[0]?.id != null) setCompanyID(String(nextCompanies[0].id));
            })
            .catch(() => setCompanies([]));
    }, []);

    const columns: TableColumn<AuditLogRow>[] = [
        { label: "When", key: "occurred_at", render: (row) => formatOccurredAt(row.occurred_at) },
        { label: "Event", key: "summary" },
        { label: "Actor", key: "actor_name_snapshot" },
        { label: "Reason", key: "reason", render: (row) => row.reason || "—" },
    ];

    return <>
        <PageHeader title="Audit Logs" />
        <div className="mb-4 max-w-xs">
            <SelectField
                label="Company"
                value={companyID}
                options={companies}
                onChange={(event) => setCompanyID(event.target.value)}
            />
        </div>
        <Card className="p-0">
            {loading ? <div className="p-10 text-center">Loading audit logs…</div> :
                <Table columns={columns} data={rows} getRowKey={(row) => row.id} emptyMessage="No audit events in your permitted companies." />}
        </Card>
    </>;
};

export default AuditLogsPage;
