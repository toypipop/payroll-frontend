import { useEffect, useState } from "react";

import { usePagedResource } from "../../hooks/usePagedResource";
import type { PageResponse } from "../../types/api";
import api from "../../api/axiosInstance";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";
import SelectField from "../../components/common/SelectField";
import Table from "../../components/common/Table";
import type { TableColumn } from "../../types/api";
import type { Company } from "../../types/domain";
import { bangkokDateKey, formatDisplayTime } from "../../utils/bangkokTime";
import AuditLogDetailsModal, { type AuditLogRow } from "./AuditLogDetailsModal";

const SHARED_DATA_OPTION = { id: "shared", name: "Shared Data" };

const formatOccurredAt = (value: string) => `${bangkokDateKey(value)} ${formatDisplayTime(value)}`;

const AuditLogsPage = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyID, setCompanyID] = useState("");
    const [selectedEntry, setSelectedEntry] = useState<AuditLogRow | null>(null);

    const endpoint = companyID === SHARED_DATA_OPTION.id
        ? "/audit-logs?scope=shared"
        : "/audit-logs" + (companyID ? `?companies_id=${encodeURIComponent(companyID)}` : "");
    const { data, table } = usePagedResource<PageResponse<AuditLogRow>>(endpoint, "occurred_at", "desc");
    const rows = data?.items ?? [];

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
        {
            label: "Actions",
            searchable: false,
            render: (row) => <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setSelectedEntry(row)}>Details</Button>,
        },
        { label: "Reason", key: "reason", render: (row) => row.reason || "—" },
    ];

    return <>
        <PageHeader title="Audit Logs" />
        <div className="mb-4 max-w-xs">
            <SelectField
                label="Company"
                value={companyID}
                options={[SHARED_DATA_OPTION, ...companies]}
                onChange={(event) => setCompanyID(event.target.value)}
            />
        </div>
        <Card className="p-0">
            <Table columns={columns} data={rows} server={table} getRowKey={(row) => row.id} emptyMessage="No audit events in your permitted companies." />
        </Card>
        {selectedEntry && <AuditLogDetailsModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
    </>;
};

export default AuditLogsPage;
