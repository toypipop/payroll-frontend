import { useState } from "react";

import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import { useAuth } from "../../hooks/useAuth";
import useEmploymentTypes from "./employment-types/useEmploymentTypes";
import EmploymentTypeFormModal from "./employment-types/EmploymentTypeFormModal";
import type { TableColumn } from "../../types/api";
import type { EmploymentType } from "../../types/domain";

const EmploymentTypePage = () => {
    const { homeCompanyId: defaultCompanieId } = useAuth();
    const { items, companies, loading, fetchData, remove } = useEmploymentTypes();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<EmploymentType | null>(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (row: EmploymentType) => {
        setEditing(row);
        setIsModalOpen(true);
    };

    const smallBtn = "px-3 py-1 text-xs w-auto";

    const columns: TableColumn<EmploymentType>[] = [
        { label: "Name", key: "name" },
        { label: "Description", key: "description" },
        {
            label: "Companies",
            sortKey: "companies.name",
            sortValue: (row) => (row.companies?.name || "").toLowerCase(),
            searchValue: (row) => row.companies?.name || "",
            render: (row) => row.companies?.name || "-",
        },
        {
            label: "Actions",
            render: (row) => (
                <div className="flex gap-[8px]">
                    <Button variant="ghost" onClick={() => openEdit(row)} className={smallBtn}>Edit</Button>
                    <Button variant="danger" onClick={() => remove(row.id)} className={smallBtn}>Delete</Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Employment Types"
                actionButton={
                    <Button onClick={openAdd}>
                        + Add Employment Type
                    </Button>
                }
            />
            <Card className="p-0">
                {loading ? <div className="p-[40px] text-center">Loading...</div> : <Table columns={columns} data={items} />}
            </Card>

            <EmploymentTypeFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchData}
                editing={editing}
                defaultCompanieId={defaultCompanieId}
                companies={companies}
            />
        </>
    );
};

export default EmploymentTypePage;
