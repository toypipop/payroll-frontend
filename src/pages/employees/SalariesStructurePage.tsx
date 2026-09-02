import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import useSalaries from "./salaries/useSalaries";
import SalaryFormModal from "./salaries/SalaryFormModal";
import SalaryHistoryModal from "./salaries/SalaryHistoryModal";
import SalaryRecordEditModal from "./salaries/SalaryRecordEditModal";
import DeleteReasonModal from "./salaries/DeleteReasonModal";
import {
    getEmployeeId,
    getSalaryBaseAmount,
    getSalaryDeletedAt,
    getSalaryEffectiveDate,
    getSalaryRecordId,
    isSoftDeleted,
} from "./salaries/salaryShape";
import type { ApiId, TableColumn } from "../../types/api";
import type { SalaryRow } from "./salaries/useSalaries";
import type { SalaryHistoryRow } from "../../types/domain";

// formatDate renders a stored effective date as YYYY/MM/DD, or the fallback when the row carries Go's zero date.
const formatDate = (date: string, fallback: string) => {
    if (!date || date.startsWith("0001")) return fallback;
    try {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
    } catch {
        return fallback;
    }
};

const SalariesStructurePage = () => {
    const {
        salariesData, loading, fetchSalaries,
        historyRows, historyLoading, fetchHistory, clearHistory, deleteHistoryRecord,
    } = useSalaries();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState<SalaryRow | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyEmp, setHistoryEmp] = useState<SalaryRow | null>(null);
    // The record whose date is being moved, or null when that modal is closed.
    const [editingRecord, setEditingRecord] = useState<SalaryHistoryRow | null>(null);
    // Which record the delete prompt is asking about; the prompt collects the reason the trail records.
    const [deletingRecordId, setDeletingRecordId] = useState<ApiId | null>(null);

    const openEdit = (emp: SalaryRow) => {
        if (!getEmployeeId(emp)) {
            alert("Unable to find employee id for this row.");
            return;
        }
        setSelectedEmp(emp);
        setIsModalOpen(true);
    };

    const openHistory = (emp: SalaryRow) => {
        const empId = getEmployeeId(emp);
        if (!empId) {
            alert("Unable to find employee id for this row.");
            return;
        }
        setHistoryEmp(emp);
        setIsHistoryOpen(true);
        fetchHistory(empId);
    };

    const closeHistory = () => {
        setIsHistoryOpen(false);
        setHistoryEmp(null);
        clearHistory();
    };

    const columns: TableColumn<SalaryRow>[] = [
        { label: "Code", key: "employees_code", searchableKeys: ['employees_code'] },
        {
            label: "Full Name",
            sortKey: "first_name",
            searchableKeys: ['first_name', 'last_name'],
            render: (row) => `${row.first_name} ${row.last_name}`,
        },
        {
            label: "Base Salaries",
            sortKey: "base_salaries_sort",
            searchValue: (row) => getSalaryBaseAmount(row.__salary || null, row).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, ''),
            sortValue: (row) => getSalaryBaseAmount(row.__salary || null, row),
            render: (row) => getSalaryBaseAmount(row.__salary || null, row).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        },
        {
            label: "Effective Date",
            sortKey: "effective_date_sort",
            searchValue: (row) => formatDate(getSalaryEffectiveDate(row.__salary || null, row), ""),
            sortValue: (row) => {
                const date = getSalaryEffectiveDate(row.__salary || null, row);
                if (!date || date.startsWith("0001")) return 0;
                const ts = new Date(date).getTime();
                return Number.isNaN(ts) ? 0 : ts;
            },
            render: (row) => formatDate(getSalaryEffectiveDate(row.__salary || null, row), "-"),
        },
        {
            label: "Salary Status",
            sortKey: "salary_status_sort",
            searchValue: (row) => {
                const ss = row.__salary || null;
                if (!ss || getSalaryRecordId(ss, row) === 0) return "Disabled";
                return isSoftDeleted(getSalaryDeletedAt(ss, row)) ? "Disabled" : "Enabled";
            },
            sortValue: (row) => {
                const ss = row.__salary || null;
                if (!ss || getSalaryRecordId(ss, row) === 0) return 0;
                return isSoftDeleted(getSalaryDeletedAt(ss, row)) ? 0 : 1;
            },
            render: (row) => {
                const ss = row.__salary || null;
                if (!ss || getSalaryRecordId(ss, row) === 0) return <Badge status={false}>Disabled</Badge>;
                const isDeleted = isSoftDeleted(getSalaryDeletedAt(ss, row));
                return (
                    <Badge status={!isDeleted}>
                        {!isDeleted ? "Enabled" : "Disabled"}
                    </Badge>
                );
            },
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
                <div className="flex gap-[6px]">
                    <Button variant="ghost" onClick={() => openEdit(row)} className="px-3 py-1.5 text-xs">
                        Update Salaries
                    </Button>
                    <Button variant="ghost" onClick={() => openHistory(row)} className="px-3 py-1.5 text-xs">
                        History
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader title="Salaries Management" />
            <Card className="p-0">
                {loading ? (
                    <div className="p-[40px] text-center">Loading...</div>
                ) : (
                    <Table
                        columns={columns}
                        data={salariesData}
                        defaultSort={{ key: "id", order: "asc" }}
                    />
                )}
            </Card>

            <SalaryFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchSalaries}
                employee={selectedEmp}
            />

            <SalaryHistoryModal
                isOpen={isHistoryOpen}
                onClose={closeHistory}
                employee={historyEmp}
                rows={historyRows}
                loading={historyLoading}
                onDelete={(recordId) => setDeletingRecordId(recordId ?? null)}
                onEdit={setEditingRecord}
            />

            <SalaryRecordEditModal
                record={editingRecord}
                onClose={() => setEditingRecord(null)}
                onSaved={() => {
                    // The move changes both the history and which record is in force, so reload both.
                    fetchHistory(getEmployeeId(historyEmp) ?? undefined);
                    fetchSalaries();
                }}
            />

            <DeleteReasonModal
                // Remounting per record is what clears the reason between deletes.
                key={deletingRecordId ?? "closed"}
                open={deletingRecordId !== null}
                onCancel={() => setDeletingRecordId(null)}
                onConfirm={(reason) => {
                    const recordId = deletingRecordId ?? undefined;
                    setDeletingRecordId(null);
                    deleteHistoryRecord(recordId, reason, getEmployeeId(historyEmp) ?? undefined);
                }}
            />
        </>
    );
};

export default SalariesStructurePage;
