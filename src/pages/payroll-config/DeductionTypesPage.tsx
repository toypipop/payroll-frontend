import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import { useAuth } from "../../hooks/useAuth";
import useDeductionTypes from "./deduction-types/useDeductionTypes";
import DeductionTypeFormModal from "./deduction-types/DeductionTypeFormModal";

const DeductionTypesPage = () => {
    const { homeCompanyId: defaultCompanieId } = useAuth();
    const { deductions, companies, loading, fetchDeductions, remove } = useDeductionTypes();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setIsModalOpen(true);
    };

    const columns = [
        { label: "Deduction Name", key: "name" },
        {
            label: "Tax Deductible",
            sortKey: "is_tax_deductible",
            sortValue: (row) => row.is_tax_deductible ? 1 : 0,
            searchValue: (row) => row.is_tax_deductible ? "yes" : "no",
            render: (row) => <Badge status={row.is_tax_deductible}>{row.is_tax_deductible ? "Yes" : "No"}</Badge>
        },
        {
            label: "SSO Deductible",
            sortKey: "is_sso_deductible",
            sortValue: (row) => row.is_sso_deductible ? 1 : 0,
            searchValue: (row) => row.is_sso_deductible ? "yes" : "no",
            render: (row) => <Badge status={row.is_sso_deductible}>{row.is_sso_deductible ? "Yes" : "No"}</Badge>
        },
        {
            label: "Companies",
            sortKey: "companies.name",
            sortValue: (row) => (row.companies?.name || "").toLowerCase(),
            searchValue: (row) => row.companies?.name || "",
            render: (row) => row.companies?.name || "-",
        },
        {
            label: "Actions",
            sortable: false,
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => openEdit(row)} style={{ fontSize: "12px", padding: "4px 8px" }}>Edit</Button>
                    <Button variant="danger" onClick={() => remove(row.id)} style={{ fontSize: "12px", padding: "4px 8px", color: "var(--status-danger)" }}>Delete</Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Deduction Types"
                actionButton={
                    <Button onClick={openAdd} style={{ width: "auto" }}>+ Add Deduction Type</Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div> : <Table columns={columns} data={deductions} />}
            </Card>

            <DeductionTypeFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchDeductions}
                editing={editing}
                defaultCompanieId={defaultCompanieId}
                companies={companies}
            />
        </>
    );
};

export default DeductionTypesPage;
