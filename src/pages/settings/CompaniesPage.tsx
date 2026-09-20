import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import SelectField from "../../components/common/SelectField";
import CompanyStatusModal from "./companies/CompanyStatusModal";
import useCompanies from "./companies/useCompanies";
import CompanyFormModal from "./companies/CompanyFormModal";
import type { TableColumn } from "../../types/api";
import type { Company } from "../../types/domain";

const CompaniesPage = () => {
    const [statusFilter, setStatusFilter] = useState("active");
    const { companies, table, fetchCompanies } = useCompanies(statusFilter);
    const [statusCompany, setStatusCompany] = useState<Company | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Company | null>(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (row: Company) => {
        setEditing(row);
        setIsModalOpen(true);
    };

    const columns: TableColumn<Company>[] = [
        { label: "Companies Name", key: "name" },
        { label: "Tax ID", key: "tax_id" },
        { label: "Phone", key: "phone" },
        { label: "Status", render: (row) => <Badge status={row.is_active === true}>{row.is_active === true ? "Active" : row.is_active === false ? "Inactive" : "Unavailable"}</Badge> },
        {
            label: "Actions",
            render: (row) => (
                <div className="flex gap-[8px]">
                    <Button variant="ghost" disabled={row.is_active !== true} onClick={() => openEdit(row)} className={smallBtn}>
                        Edit
                    </Button>
                    <Button variant={row.is_active === false ? "secondary" : "danger"} disabled={typeof row.is_active !== "boolean"} onClick={() => setStatusCompany(row)} className={smallBtn}>
                        {row.is_active === false ? "Reactivate" : row.is_active === true ? "Deactivate" : "Status unavailable"}
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Companies Directory"
                actionButton={
                    <Button onClick={openAdd}>
                        + Add Companies
                    </Button>
                }
            />
            <SelectField label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}
                options={[{ id: "all", name: "All statuses" }, { id: "active", name: "Active" }, { id: "inactive", name: "Inactive" }]} />
            <Card className="p-0">
                <Table columns={columns} data={companies} server={table} />
            </Card>

            <CompanyFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchCompanies}
                editing={editing}
            />
            {statusCompany && <CompanyStatusModal company={statusCompany} onClose={() => setStatusCompany(null)} onSaved={fetchCompanies} />}
        </>
    );
};

const smallBtn = "px-3 py-1.5 text-xs";

export default CompaniesPage;
