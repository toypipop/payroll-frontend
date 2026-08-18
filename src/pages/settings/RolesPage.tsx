import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import useRoles from "./roles/useRoles";
import RoleFormModal from "./roles/RoleFormModal";

const RolesPage = () => {
    const { homeCompanyId: defaultCompanieId } = useAuth();
    const { roles, companies, loading, fetchRoles, remove } = useRoles();
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
        { label: "Role Name", key: "roles_name" },
        {
            label: "Companies",
            render: (row) => row.companies?.name || "N/A"
        },
        {
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                        variant="ghost"
                        onClick={() => openEdit(row)}
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                    >
                        Edit
                    </Button>
                    <Button variant="danger" onClick={() => remove(row.id)} style={{ fontSize: "12px", padding: "4px 8px", color: "var(--status-danger)" }}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Roles Management"
                actionButton={
                    <Button onClick={openAdd} style={{ width: "auto" }}>
                        + Add Role
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
                ) : (
                    <Table columns={columns} data={roles} />
                )}
            </Card>

            <RoleFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchRoles}
                editing={editing}
                defaultCompanieId={defaultCompanieId}
                companies={companies}
            />
        </>
    );
};

export default RolesPage;
