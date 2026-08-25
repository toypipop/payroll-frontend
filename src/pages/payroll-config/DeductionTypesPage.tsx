import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import { useAuth } from "../../hooks/useAuth";
import useDeductionTypes from "./deduction-types/useDeductionTypes";
import DeductionTypeFormModal from "./deduction-types/DeductionTypeFormModal";
import type { TableColumn } from "../../types/api";
import type { DeductionType } from "../../types/domain";

const DeductionTypesPage = () => {
    const { homeCompanyId: defaultCompanieId } = useAuth();
    const { deductions, companies, loading, fetchDeductions, remove } = useDeductionTypes();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<DeductionType | null>(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (row: DeductionType) => {
        setEditing(row);
        setIsModalOpen(true);
    };

    const columns: TableColumn<DeductionType>[] = [
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
                <div className="flex gap-[8px]">
                    <Button variant="ghost" onClick={() => openEdit(row)} className="text-xs px-2 py-1">Edit</Button>
                    <Button variant="danger" onClick={() => remove(row.id)} className="text-xs px-2 py-1 text-danger">Delete</Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Deduction Types"
                actionButton={
                    <Button onClick={openAdd}>+ Add Deduction Type</Button>
                }
            />
            <Card className="p-0">
                {loading ? <div className="p-[40px] text-center">Loading...</div> : <Table columns={columns} data={deductions} />}
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
