import { useState } from "react";

import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import { useAuth } from "../../hooks/useAuth";
import useLeaveTypes from "./leave-types/useLeaveTypes";
import LeaveTypeFormModal from "./leave-types/LeaveTypeFormModal";

const MasterLeaveTypePage = () => {
    const { homeCompanyId } = useAuth();
    const { items, companyOptions, loading, fetchData, remove } = useLeaveTypes();
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
        { label: "Leave Type", key: "name" },
        { label: "Company", render: (row) => row.companies?.name || "—" },
        { label: "Paid", render: (row) => row.is_paid ? "Yes" : "No" },
        { label: "Max Days/Year", render: (row) => row.max_days_per_year > 0 ? row.max_days_per_year : "Unlimited" },
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
                title="Leave Types"
                actionButton={
                    <Button onClick={openAdd} style={{ width: "auto" }}>
                        + Add Leave Type
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div> : <Table columns={columns} data={items} />}
            </Card>

            <LeaveTypeFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchData}
                editing={editing}
                homeCompanyId={homeCompanyId}
                companyOptions={companyOptions}
            />
        </>
    );
};

export default MasterLeaveTypePage;
