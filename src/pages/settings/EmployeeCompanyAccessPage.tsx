import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import useEmployeeCompanyAccess from "./employee-company-access/useEmployeeCompanyAccess";
import AccessFormModal from "./employee-company-access/AccessFormModal";
import type { TableColumn } from "../../types/api";
import type { EmployeeCompanyAccess } from "../../types/domain";

const EmployeeCompanyAccessPage = () => {
    const { accessRows, employees, companies, roles, loading, fetchAccessRows, remove } = useEmployeeCompanyAccess();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<EmployeeCompanyAccess | null>(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (row: EmployeeCompanyAccess) => {
        setEditing(row);
        setIsModalOpen(true);
    };

    const columns: TableColumn<EmployeeCompanyAccess>[] = [
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
                <div className="flex gap-[8px]">
                    <Button variant="ghost" onClick={() => openEdit(row)} className={smallBtn}>
                        Edit
                    </Button>
                    <Button variant="danger" onClick={() => remove(row.id)} className={smallBtn}>
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
                    <Button onClick={openAdd}>
                        + Add Access
                    </Button>
                }
            />

            <Card className="p-0">
                {loading ? (
                    <div className="p-[40px] text-center">Loading...</div>
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

const smallBtn = "px-3 py-1.5 text-xs";

export default EmployeeCompanyAccessPage;
