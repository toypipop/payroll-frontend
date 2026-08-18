import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import useEmployeeCompanyAccess from "./employee-company-access/useEmployeeCompanyAccess";
import AccessFormModal from "./employee-company-access/AccessFormModal";

const EmployeeCompanyAccessPage = () => {
    const { accessRows, employees, companies, roles, loading, fetchAccessRows, remove } = useEmployeeCompanyAccess();
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
        {
            label: "Employee",
            sortKey: "employee_name",
            searchValue: (row) => `${row.employee?.employees_code || ""} ${row.employee?.first_name || ""} ${row.employee?.last_name || ""}`.trim(),
            render: (row) => {
                const employee = row.employee;
                if (!employee) return "-";
                return `${employee.employees_code || "EMP"} - ${employee.first_name || ""} ${employee.last_name || ""}`.trim();
            },
        },
        {
            label: "Company",
            sortKey: "company.name",
            searchableKeys: ["company.name"],
            render: (row) => row.company?.name || "-",
        },
        {
            label: "Role",
            sortKey: "role.roles_name",
            searchableKeys: ["role.roles_name"],
            render: (row) => row.role?.roles_name || "-",
        },
        {
            label: "Status",
            sortKey: "is_active",
            searchValue: (row) => row.is_active ? "Active" : "Inactive",
            render: (row) => (
                <Badge status={row.is_active}>
                    {row.is_active ? "Active" : "Inactive"}
                </Badge>
            ),
        },
        {
            label: "Actions",
            sortable: false,
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => openEdit(row)} style={smallBtn}>
                        Edit
                    </Button>
                    <Button variant="danger" onClick={() => remove(row.id)} style={smallBtn}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Employee Company Access"
                actionButton={
                    <Button onClick={openAdd} style={{ width: "auto" }}>
                        + Add Access
                    </Button>
                }
            />

            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
                ) : (
                    <Table columns={columns} data={accessRows} />
                )}
            </Card>

            <AccessFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchAccessRows}
                editing={editing}
                employees={employees}
                companies={companies}
                roles={roles}
            />
        </>
    );
};

const smallBtn = { padding: "6px 12px", fontSize: "12px" };

export default EmployeeCompanyAccessPage;
