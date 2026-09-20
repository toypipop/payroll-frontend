import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import SelectField from "../../components/common/SelectField";
import { useAuth } from "../../hooks/useAuth";
import useCycleDeductions from "./cycle-deductions/useCycleDeductions";
import CycleDeductionFormModal from "./cycle-deductions/CycleDeductionFormModal";
import type { TableColumn } from "../../types/api";
import type { CycleDeduction } from "../../types/domain";

const formatDate = (value: number | string | null | undefined) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok",
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const CycleDeductionsPage = () => {
    const { homeCompanyId } = useAuth();
    const [selectedCompanyId, setSelectedCompanyId] = useState(homeCompanyId);
    const [selectedCycleId, setSelectedCycleId] = useState("");
    const { items, companies, cycles, deductionTypes, table, refreshItems, remove } = useCycleDeductions(selectedCycleId);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<CycleDeduction | null>(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (row: CycleDeduction) => {
        setEditing(row);
        setIsModalOpen(true);
    };

    const pageCycles = selectedCompanyId ? cycles.filter((c) => String(c.companies_id) === String(selectedCompanyId)) : [];
    const selectedCycleLabel = cycles.find((c) => String(c.id) === String(selectedCycleId));
    const selectedCycleClosed = !!selectedCycleLabel?.is_closed;

    const columns: TableColumn<CycleDeduction>[] = [
        {
            label: "Employee",
            sortKey: "employee_name",
            sortValue: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.toLowerCase(),
            searchableKeys: ["employees.first_name", "employees.last_name", "employees.employees_code"],
            render: (row) =>
                row.employees
                    ? `${row.employees.first_name} ${row.employees.last_name}`
                    : `ID: ${row.employees_id}`,
        },
        {
            label: "Deduction Type",
            sortKey: "deduction_type_name",
            sortValue: (row) => row.deduction_type?.name?.toLowerCase() || "",
            searchableKeys: ["deduction_type.name"],
            render: (row) => row.deduction_type?.name ?? `ID: ${row.deduction_type_id}`,
        },
        {
            label: "Amount (฿)",
            sortKey: "amount",
            sortValue: (row) => row.amount || 0,
            render: (row) => row.amount?.toLocaleString("th-TH", { minimumFractionDigits: 2 }),
        },
        {
            label: "Companies",
            sortKey: "employees.companies.name",
            sortValue: (row) => row.employees?.companies?.name?.toLowerCase() || "",
            searchableKeys: ["employees.companies.name"],
            render: (row) => row.employees?.companies?.name || "-",
        },
        {
            label: "Actions",
            sortable: false,
            render: (row) => (
                <div className="flex gap-[8px]">
                    <Button variant="ghost" onClick={() => openEdit(row)} disabled={selectedCycleClosed} className="text-xs px-2 py-1">
                        Edit
                    </Button>
                    <Button variant="danger" onClick={() => remove(row.id)} disabled={selectedCycleClosed} className="text-xs px-2 py-1 text-danger">
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Cycle Variable Deductions"
                actionButton={
                    <Button onClick={openAdd} disabled={!selectedCycleId || selectedCycleClosed}>
                        + Add Variable Deduction
                    </Button>
                }
            />

            {/* Cycle selector */}
            <Card className="mb-4 px-6 py-4">
                <div className="flex items-center gap-[16px]">
                    <SelectField
                        label="Company"
                        options={companies.map((c) => ({ id: c.id, name: c.name }))}
                        value={selectedCompanyId}
                        onChange={(e) => {
                            setSelectedCompanyId(e.target.value);
                            setSelectedCycleId("");
                        }}
                        containerClassName="mb-0 min-w-[240px]"
                    />
                    <SelectField
                        label="Payroll Cycle"
                        options={pageCycles.map((c) => ({ id: c.id, name: `${c.cycle_name ?? `Cycle #${c.id}`}${c.companies?.name ? ` (${c.companies.name})` : ""} ${c.is_closed ? "· Closed" : "· Open"}` }))}
                        value={selectedCycleId}
                        onChange={(e) => setSelectedCycleId(e.target.value)}
                        disabled={!selectedCompanyId}
                        containerClassName="mb-0 min-w-[280px]"
                    />
                </div>
                {selectedCycleLabel && (
                    <div className="mt-[12px] text-[13px] text-muted">
                        Period: {formatDate(selectedCycleLabel.start_date)} - {formatDate(selectedCycleLabel.end_date)}
                    </div>
                )}
                {selectedCycleClosed && (
                    <div className="mt-[8px] text-[13px] text-danger">
                        This cycle is closed. Variable deductions can no longer be added, edited, or deleted.
                    </div>
                )}
                <p className="m-[8px_0_0_0] text-[12px] text-subtle">
                    Variable deductions are one-time per cycle and will be subtracted from net pay during payroll calculation.
                </p>
            </Card>

            <Card className="p-0">
                {!selectedCycleId ? (
                    <div className="p-[40px] text-center text-subtle">
                        Select a payroll cycle to view or add variable deductions.
                    </div>
                ) : (
                    <Table columns={columns} data={items} server={table} />
                )}
            </Card>

            <CycleDeductionFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={refreshItems}
                editing={editing}
                defaultCompanyId={selectedCompanyId}
                defaultCycleId={selectedCycleId}
                companies={companies}
                cycles={cycles}
                deductionTypes={deductionTypes}
            />
        </>
    );
};

export default CycleDeductionsPage;
