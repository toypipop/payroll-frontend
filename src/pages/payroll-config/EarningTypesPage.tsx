import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import { useAuth } from "../../hooks/useAuth";
import useEarningTypes from "./earning-types/useEarningTypes";
import EarningTypeFormModal from "./earning-types/EarningTypeFormModal";
import type { TableColumn } from "../../types/api";
import type { EarningType } from "../../types/domain";

const EarningTypesPage = () => {
    const { homeCompanyId: defaultCompanieId } = useAuth();
    const { earnings, companies, loading, fetchEarnings, remove } = useEarningTypes();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<EarningType | null>(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (row: EarningType) => {
        setEditing(row);
        setIsModalOpen(true);
    };

    const columns: TableColumn<EarningType>[] = [
        { label: "Name", key: "name" },
        {
            label: "Taxable",
            sortKey: "is_taxable",
            sortValue: (row) => row.is_taxable ? 1 : 0,
            searchValue: (row) => row.is_taxable ? "yes" : "no",
            render: (row) => <Badge status={row.is_taxable}>{row.is_taxable ? "Yes" : "No"}</Badge>
        },
        {
            label: "SSO",
            sortKey: "is_sso",
            sortValue: (row) => row.is_sso ? 1 : 0,
            searchValue: (row) => row.is_sso ? "yes" : "no",
            render: (row) => <Badge status={row.is_sso}>{row.is_sso ? "Yes" : "No"}</Badge>
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
                title="Earning Types"
                actionButton={
                    <Button onClick={openAdd}>+ Add Earning Type</Button>
                }
            />
            <Card className="p-0">
                {loading ? <div className="p-[40px] text-center">Loading...</div> : <Table columns={columns} data={earnings} />}
            </Card>

            <EarningTypeFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchEarnings}
                editing={editing}
                defaultCompanieId={defaultCompanieId}
                companies={companies}
            />
        </>
    );
};

export default EarningTypesPage;
