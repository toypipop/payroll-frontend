import { useState } from "react";

import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import { useAuth } from "../../hooks/useAuth";
import useEmploymentTypes from "./employment-types/useEmploymentTypes";
import EmploymentTypeFormModal from "./employment-types/EmploymentTypeFormModal";

const EmploymentTypePage = () => {
    const { homeCompanyId: defaultCompanieId } = useAuth();
    const { items, companies, loading, fetchData, remove } = useEmploymentTypes();
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

    const smallBtn = { padding: "4px 12px", fontSize: "12px", width: "auto" };

    const columns = [
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
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => openEdit(row)} style={smallBtn}>Edit</Button>
                    <Button variant="danger" onClick={() => remove(row.id)} style={smallBtn}>Delete</Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Employment Types"
                actionButton={
                    <Button onClick={openAdd} style={{ width: "auto" }}>
                        + Add Employment Type
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div> : <Table columns={columns} data={items} />}
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
