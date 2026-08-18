import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import useEmployeeDeductions from "./employee-deductions/useEmployeeDeductions";
import EmployeeDeductionFormModal from "./employee-deductions/EmployeeDeductionFormModal";

const EmployeeDeductionsPage = () => {
    const { homeCompanyId } = useAuth();
    const { items, companies, employees, deductionTypes, loading, fetchItems, remove } = useEmployeeDeductions();
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
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => openEdit(row)} style={{ fontSize: "12px", padding: "4px 8px" }}>
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
                title="Employee Deductions"
                actionButton={
                    <Button onClick={openAdd} style={{ width: "auto" }}>
                        + Assign Deduction
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
                ) : (
                    <Table columns={columns} data={items} />
                )}
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
