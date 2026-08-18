import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import SelectField from "../../components/common/SelectField";
import { useAuth } from "../../hooks/useAuth";
import useCycleEarnings from "./cycle-earnings/useCycleEarnings";
import CycleEarningFormModal from "./cycle-earnings/CycleEarningFormModal";

const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const CycleEarningsPage = () => {
    const { homeCompanyId } = useAuth();
    const [selectedCompanyId, setSelectedCompanyId] = useState(homeCompanyId);
    const [selectedCycleId, setSelectedCycleId] = useState("");
    const { items, companies, cycles, employees, earningTypes, loading, refreshItems, remove } = useCycleEarnings(selectedCycleId);
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

    const pageCycles = selectedCompanyId ? cycles.filter((c) => String(c.companies_id) === String(selectedCompanyId)) : [];
    const selectedCycleLabel = cycles.find((c) => String(c.id) === String(selectedCycleId));
    const selectedCycleClosed = !!selectedCycleLabel?.is_closed;

    const columns = [
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
            label: "Earning Type",
            sortKey: "earning_type_name",
            sortValue: (row) => row.earning_type?.name?.toLowerCase() || "",
            searchableKeys: ["earning_type.name"],
            render: (row) => row.earning_type?.name ?? `ID: ${row.earning_type_id}`,
        },
        {
            label: "Amount (฿)",
            sortKey: "amount",
            sortValue: (row) => row.amount || 0,
            render: (row) => row.amount?.toLocaleString("th-TH", { minimumFractionDigits: 2 }),
        },
        {
            label: "Companies",
            sortKey: "companies_name",
            sortValue: (row) => row.employees?.companies?.name?.toLowerCase() || "",
            searchableKeys: ["employees.companies.name"],
            render: (row) => row.employees?.companies?.name || "-",
        },
        {
            label: "Actions",
            sortable: false,
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => openEdit(row)} disabled={selectedCycleClosed} style={{ fontSize: "12px", padding: "4px 8px" }}>
                        Edit
                    </Button>
                    <Button variant="danger" onClick={() => remove(row.id)} disabled={selectedCycleClosed} style={{ fontSize: "12px", padding: "4px 8px", color: "var(--status-danger)" }}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Cycle Variable Earnings"
                actionButton={
                    <Button onClick={openAdd} disabled={!selectedCycleId || selectedCycleClosed} style={{ width: "auto" }}>
                        + Add Variable Earning
                    </Button>
                }
            />

            {/* Cycle selector */}
            <Card style={{ marginBottom: "16px", padding: "16px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <SelectField
                        label="Company"
                        options={companies.map((c) => ({ id: c.id, name: c.name }))}
                        value={selectedCompanyId}
                        onChange={(e) => {
                            setSelectedCompanyId(e.target.value);
                            setSelectedCycleId("");
                        }}
                        containerStyle={{ minWidth: "240px", marginBottom: 0 }}
                    />
                    <SelectField
                        label="Payroll Cycle"
                        options={pageCycles.map((c) => ({ id: c.id, name: `${c.cycle_name ?? `Cycle #${c.id}`}${c.companies?.name ? ` (${c.companies.name})` : ""} ${c.is_closed ? "· Closed" : "· Open"}` }))}
                        value={selectedCycleId}
                        onChange={(e) => setSelectedCycleId(e.target.value)}
                        disabled={!selectedCompanyId}
                        containerStyle={{ minWidth: "280px", marginBottom: 0 }}
                    />
                </div>
                {selectedCycleLabel && (
                    <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--text-muted)" }}>
                        Period: {formatDate(selectedCycleLabel.start_date)} - {formatDate(selectedCycleLabel.end_date)}
                    </div>
                )}
                {selectedCycleClosed && (
                    <div style={{ marginTop: "8px", fontSize: "13px", color: "var(--status-danger)" }}>
                        This cycle is closed. Variable earnings can no longer be added, edited, or deleted.
                    </div>
                )}
                <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "var(--text-subtle)" }}>
                    One-time earnings per cycle (Bonus, OT, Commission, etc.). Recurring monthly earnings are managed under Employee Earnings.
                </p>
            </Card>

            <Card style={{ padding: "0px" }}>
                {!selectedCycleId ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--text-subtle)" }}>
                        Select a payroll cycle to view or add variable earnings.
                    </div>
                ) : loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
                ) : (
                    <Table columns={columns} data={items} defaultSort={{ key: "amount", order: "desc" }} />
                )}
            </Card>

            <CycleEarningFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={refreshItems}
                editing={editing}
                defaultCompanyId={selectedCompanyId}
                defaultCycleId={selectedCycleId}
                companies={companies}
                cycles={cycles}
                employees={employees}
                earningTypes={earningTypes}
            />
        </>
    );
};

export default CycleEarningsPage;
