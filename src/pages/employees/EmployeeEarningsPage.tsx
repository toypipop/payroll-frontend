import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import useEmployeeEarnings from "./employee-earnings/useEmployeeEarnings";
import EmployeeEarningFormModal from "./employee-earnings/EmployeeEarningFormModal";
import type { TableColumn } from "../../types/api";
import type { EmployeeEarning } from "../../types/domain";

const EmployeeEarningsPage = () => {
    const { homeCompanyId } = useAuth();
    const { items, companies, employees, earningTypes, table, fetchItems, remove } = useEmployeeEarnings();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<EmployeeEarning | null>(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (row: EmployeeEarning) => {
        setEditing(row);
        setIsModalOpen(true);
    };

    const columns: TableColumn<EmployeeEarning>[] = [
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
            label: "Earning Type",
            sortKey: "earning_type_name",
            searchableKeys: ['earning_type.name'],
            sortValue: (row) => (row.earning_type?.name || "").toLowerCase(),
            render: (row) => row.earning_type?.name ?? `ID: ${row.earning_type_id}`,
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
                title="Employee Earnings"
                actionButton={
                    <Button onClick={openAdd}>
                        + Assign Earning
                    </Button>
                }
            />
            <Card className="p-0">
                <Table columns={columns} data={items} server={table} />
            </Card>

            <EmployeeEarningFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchItems}
                editing={editing}
                homeCompanyId={homeCompanyId}
                companies={companies}
                employees={employees}
                earningTypes={earningTypes}
            />
        </>
    );
};

export default EmployeeEarningsPage;
