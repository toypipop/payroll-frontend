import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import HelpIcon from "../../components/common/HelpIcon";
import { useAuth } from "../../hooks/useAuth";
import useEmployees from "./employees/useEmployees";
import EmployeeFormModal from "./employees/EmployeeFormModal";
import type { TableColumn } from "../../types/api";
import type { Employee } from "../../types/domain";

const EmployeesListPage = () => {
    const { homeCompanyId } = useAuth();
    const {
        employees, loading, fetchEmployees, remove,
        masterDepts, masterPos, masterRoles, masterCompanies, masterBanks, masterEmploymentTypes,
    } = useEmployees();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Employee | null>(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (row: Employee) => {
        setEditing(row);
        setIsModalOpen(true);
    };

    const columns: TableColumn<Employee>[] = [
        { label: "Code", key: "employees_code", searchableKeys: ['employees_code'] },
        {
            label: "Full Name",
            sortKey: "first_name",
            searchableKeys: ['first_name', 'last_name'],
            render: (row) => `${row.first_name} ${row.last_name}`,
        },
        {
            label: "Position",
            sortKey: "position.pos_name",
            searchableKeys: ['position.pos_name'],
            render: (row) => row.position?.pos_name || "N/A"
        },
        {
            label: "Department",
            sortKey: "department.dept_name",
            searchableKeys: ['department.dept_name'],
            render: (row) => row.department?.dept_name || "N/A",
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
            label: "Companies",
            sortKey: "companies.name",
            searchableKeys: ['companies.name'],
            render: (row) => row.companies?.name || "-",
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
                title={<span className="flex items-center gap-[8px]">Employees Directory<HelpIcon articleId="employee-list" /></span>}
                actionButton={
                    <Button onClick={openAdd}>
                        + Add Employees
                    </Button>
                }
            />
            <Card className="p-0">
                {loading ? (
                    <div className="p-[40px] text-center">
                        Loading...
                    </div>
                ) : (
                    <Table columns={columns} data={employees} />
                )}
            </Card>

            <EmployeeFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchEmployees}
                editing={editing}
                homeCompanyId={homeCompanyId}
                masterDepts={masterDepts}
                masterPos={masterPos}
                masterRoles={masterRoles}
                masterCompanies={masterCompanies}
                masterBanks={masterBanks}
                masterEmploymentTypes={masterEmploymentTypes}
            />
        </>
    );
};

const smallBtn = "px-3 py-1.5 text-xs";

export default EmployeesListPage;
