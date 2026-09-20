import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import useRoles from "./roles/useRoles";
import RoleFormModal from "./roles/RoleFormModal";
import type { TableColumn } from "../../types/api";
import type { Role } from "../../types/domain";

const RolesPage = () => {
    const { homeCompanyId: defaultCompanieId } = useAuth();
    const { roles, companies, table, fetchRoles, remove } = useRoles();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Role | null>(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (row: Role) => {
        setEditing(row);
        setIsModalOpen(true);
    };

    const columns: TableColumn<Role>[] = [
        { label: "Role Name", key: "roles_name" },
        {
            label: "Companies",
            render: (row) => row.companies?.name || "N/A"
        },
        {
            label: "Actions",
            render: (row) => (
                <div className="flex gap-[8px]">
                    <Button
                        variant="ghost"
                        onClick={() => openEdit(row)}
                        className="text-xs px-2 py-1"
                    >
                        Edit
                    </Button>
                    <Button variant="danger" onClick={() => remove(row.id)} className="text-xs px-2 py-1 text-danger">
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
                    <Button onClick={openAdd}>
                        + Add Role
                    </Button>
                }
            />
            <Card className="p-0">
                <Table columns={columns} data={roles} server={table} />
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
