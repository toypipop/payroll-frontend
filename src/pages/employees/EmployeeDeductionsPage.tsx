import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import useEmployeeDeductions from "./employee-deductions/useEmployeeDeductions";
import EmployeeDeductionFormModal from "./employee-deductions/EmployeeDeductionFormModal";
import type { TableColumn } from "../../types/api";
import type { EmployeeDeduction } from "../../types/domain";

const EmployeeDeductionsPage = () => {
    const { homeCompanyId } = useAuth();
    const { items, companies, employees, deductionTypes, table, fetchItems, remove } = useEmployeeDeductions();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<EmployeeDeduction | null>(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (row: EmployeeDeduction) => {
        setEditing(row);
        setIsModalOpen(true);
    };

    const columns: TableColumn<EmployeeDeduction>[] = [
        {
            label: "Employee",
            sortKey: "employee_name",
            searchableKeys: ['employees.first_name', 'employees.last_name'],
            sortValue: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.trim().toLowerCase(),
            render: (row) =>
                row.employees
                    ? `${row.employees.first_name} ${row.employees.last_name}`
                    : `ID: ${row.employees_id}`,
        },
        {
            label: "Deduction Type",
            sortKey: "deduction_type_name",
            searchableKeys: ['deduction_type.name'],
            sortValue: (row) => (row.deduction_type?.name || "").toLowerCase(),
            render: (row) => row.deduction_type?.name ?? `ID: ${row.deduction_type_id}`,
        },
        {
            label: "Monthly Amount (฿)",
            sortKey: "amount",
            searchableKeys: ['amount'],
            sortValue: (row) => Number(row.amount) || 0,
            render: (row) => row.amount?.toLocaleString("th-TH", { minimumFractionDigits: 2 }),
        },
        {
            label: "Companies",
            sortKey: "employees.companies.name",
            searchableKeys: ['employees.companies.name'],
            render: (row) => row.employees?.companies?.name || "-",
        },
        {
            label: "Actions",
            sortable: false,
            render: (row) => (
                <div className="flex gap-[8px]">
                    <Button variant="ghost" onClick={() => openEdit(row)} className="text-xs px-2 py-1">
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
                title="Employee Deductions"
                actionButton={
                    <Button onClick={openAdd}>
                        + Assign Deduction
                    </Button>
                }
            />
            <Card className="p-0">
                <Table columns={columns} data={items} server={table} />
            </Card>

            <EmployeeDeductionFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchItems}
                editing={editing}
                homeCompanyId={homeCompanyId}
                companies={companies}
                employees={employees}
                deductionTypes={deductionTypes}
            />
        </>
    );
};

export default EmployeeDeductionsPage;
