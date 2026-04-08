import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../api/axiosInstance";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import DecimalField from "../../components/common/DecimalField";
import DateField from "../../components/common/DateField";
import CheckboxField from "../../components/common/CheckboxField";
import Badge from "../../components/common/Badge";

/* --- 1. Validation Schema (English Comment) --- */
const salariesSchema = z.object({
    employees_id: z.preprocess(
        (val) => Number(val),
        z.number().min(1, "Please select an employee")
    ),
    base_salaries: z.preprocess(
        (val) => Number(val),
        z.number().min(0, "Salaries must be a positive number")
    ),
    effective_date: z.string().min(1, "Effective date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    is_active: z.boolean().default(true),
});

const DEFAULT_FORM_VALUES = {
    employees_id: "",
    base_salaries: "",
    effective_date: new Date().toISOString().split("T")[0],
    is_active: true,
};

const getEmployeeId = (emp) =>
    emp?.ID ?? emp?.id ?? emp?.employees_id ?? emp?.employee_id ?? emp?.employees?.id ?? null;

const getSalaryStructure = (emp) =>
    emp?.salaries_structure ?? emp?.salary_structure ?? emp?.salaries ?? null;

const getSalaryRecordId = (salary, row) =>
    Number(
        salary?.id ??
            salary?.ID ??
            salary?.salary_id ??
            salary?.SalaryID ??
            salary?.salaries_id ??
            salary?.salaries_structure_id ??
            row?.salary_id ??
            row?.SalaryID ??
            row?.salaries_id ??
            row?.salaries_structure_id ??
            0,
    );

const getSalaryBaseAmount = (salary, row) =>
    Number(
        salary?.base_salaries ??
            salary?.base_salary ??
            salary?.BaseSalaries ??
            salary?.BaseSalary ??
            row?.base_salaries ??
            row?.base_salary ??
            row?.BaseSalaries ??
            row?.BaseSalary ??
            0,
    );

const getSalaryEffectiveDate = (salary, row) =>
    salary?.effective_date ??
    salary?.effectiveDate ??
    salary?.EffectiveDate ??
    row?.effective_date ??
    row?.effectiveDate ??
    row?.EffectiveDate ??
    "";

const getSalaryDeletedAt = (salary, row) =>
    salary?.deleted_at ??
    salary?.deletedAt ??
    salary?.DeletedAt ??
    row?.deleted_at ??
    row?.deletedAt ??
    row?.DeletedAt;

const getSalaryStructures = (emp) => {
    const direct = getSalaryStructure(emp);
    if (Array.isArray(direct)) return direct;
    if (direct && typeof direct === "object") return [direct];

    const fromArray =
        emp?.salaries_structures ??
        emp?.salary_structures ??
        emp?.salaries_history ??
        emp?.salaryHistory ??
        emp?.SalaryStructures;
    if (Array.isArray(fromArray)) return fromArray;

    if (
        emp?.base_salaries !== undefined ||
        emp?.base_salary !== undefined ||
        emp?.effective_date !== undefined ||
        emp?.deleted_at !== undefined ||
        emp?.salary_id !== undefined ||
        emp?.salaries_id !== undefined ||
        emp?.salaries_structure_id !== undefined
    ) {
        return [{
            id: emp?.salary_id ?? emp?.salaries_id ?? emp?.salaries_structure_id ?? 0,
            base_salaries: emp?.base_salaries,
            base_salary: emp?.base_salary,
            effective_date: emp?.effective_date,
            deleted_at: emp?.deleted_at,
            created_at: emp?.created_at,
            updated_at: emp?.updated_at,
            deletedAt: emp?.deletedAt,
            effectiveDate: emp?.effectiveDate,
            BaseSalaries: emp?.BaseSalaries,
            BaseSalary: emp?.BaseSalary,
        }];
    }

    return [];
};

const getLatestSalaryStructure = (emp) => {
    const structures = getSalaryStructures(emp);
    if (!structures.length) return null;
    return [...structures].sort((a, b) => getSalaryRecordId(b, emp) - getSalaryRecordId(a, emp))[0];
};

const isSoftDeleted = (deletedAt) => {
    if (deletedAt && typeof deletedAt === "object") {
        if (Object.prototype.hasOwnProperty.call(deletedAt, "Valid") && deletedAt.Valid === false) {
            return false;
        }

        const nested =
            deletedAt.Time ??
            deletedAt.time ??
            deletedAt.Bool ??
            deletedAt.bool ??
            deletedAt.Int64 ??
            deletedAt.int64 ??
            deletedAt.value;

        if (nested !== undefined) return isSoftDeleted(nested);
    }

    if (
        deletedAt === null ||
        deletedAt === undefined ||
        deletedAt === false ||
        deletedAt === 0 ||
        deletedAt === "0" ||
        deletedAt === "" ||
        deletedAt === "false" ||
        deletedAt === "null"
    ) {
        return false;
    }

    if (typeof deletedAt === "number") return deletedAt !== 0;

    if (typeof deletedAt === "string") {
        const normalized = deletedAt.trim().toLowerCase();
        if (["0", "false", "null", "", "0001-01-01t00:00:00z", "0001-01-01 00:00:00 +0000 utc"].includes(normalized)) return false;
        if (normalized.startsWith("0001-01-01")) return false;
        return true;
    }

    return Boolean(deletedAt);
};

const SalariesStructurePage = () => {
    const [salariesData, setSalariesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [selectedSalaryId, setSelectedSalaryId] = useState(null);

    const {
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(salariesSchema),
        defaultValues: DEFAULT_FORM_VALUES,
    });

    const fetchSalaries = async () => {
        try {
            setLoading(true);
            const response = await api.get("/salaries");
            const rows = Array.isArray(response.data) ? response.data : [];
            const normalized = rows
                .map((row) => {
                    const latest = getLatestSalaryStructure(row);
                    const updatedAt = latest?.updated_at || latest?.created_at || null;
                    const latestId = getSalaryRecordId(latest, row);
                    const recentSort = updatedAt ? new Date(updatedAt).getTime() : latestId;
                    return {
                        ...row,
                        __salary: latest,
                        __salary_id: latestId,
                        __recent_sort: Number.isNaN(recentSort) ? latestId : recentSort,
                    };
                })
                .sort((a, b) => b.__recent_sort - a.__recent_sort || b.__salary_id - a.__salary_id);
            setSalariesData(normalized);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSalaries();
    }, []);

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                employees_id: Number(data.employees_id),
                base_salaries: Number(data.base_salaries),
                base_salary: Number(data.base_salaries),
                effective_date: data.effective_date,
                is_active: Boolean(data.is_active),
                deleted_at: !data.is_active,
            };

            if (!data.is_active && selectedSalaryId) {
                payload.id = selectedSalaryId;
            }

            // Backend uses POST /salaries for both create and update.
            await api.post("/salaries", payload);
            fetchSalaries();
            closeModal();
        } catch (err) {
            console.error("Save salary failed:", err.response?.data || err);
            alert(
                err.response?.data?.error ||
                    err.response?.data?.message ||
                    "Save Failed"
            );
        }
    };

    const handleEditSalaries = (emp) => {
        const empId = getEmployeeId(emp);
        if (!empId) {
            alert("Unable to find employee id for this row.");
            return;
        }

        setSelectedEmp(emp);
        const ss = emp.__salary || getLatestSalaryStructure(emp) || null;
        setSelectedSalaryId(ss?.id || null);

        const existingDate = getSalaryEffectiveDate(ss, emp);
        let finalDate = new Date().toISOString().split("T")[0];

        if (existingDate && !existingDate.startsWith("0001")) {
            try {
                const d = new Date(existingDate);
                finalDate = d.toISOString().split("T")[0];
                // eslint-disable-next-line no-unused-vars
            } catch (e) {
                finalDate = new Date().toISOString().split("T")[0];
            }
        }
        reset({
            employees_id: String(empId),
            base_salaries: getSalaryBaseAmount(ss, emp) || "",
            effective_date: finalDate,
            is_active: typeof ss?.is_active === "boolean"
                ? ss.is_active
                : !isSoftDeleted(getSalaryDeletedAt(ss, emp)),
        });

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEmp(null);
        setSelectedSalaryId(null);
        reset(DEFAULT_FORM_VALUES);
    };

    const columns = [
        { label: "Code", key: "employees_code" },
        {
            label: "Full Name",
            sortKey: "first_name",
            render: (row) => `${row.first_name} ${row.last_name}`,
        },
        {
            label: "Base Salaries",
            sortKey: "base_salaries_sort",
            sortValue: (row) => getSalaryBaseAmount(row.__salary || null, row),
            render: (row) => {
                const ss = row.__salary || null;
                const amount = getSalaryBaseAmount(ss, row);
                return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            },
        },
        {
            label: "Effective Date",
            sortKey: "effective_date_sort",
            sortValue: (row) => {
                const date = getSalaryEffectiveDate(row.__salary || null, row);
                if (!date || date.startsWith("0001")) return 0;
                const ts = new Date(date).getTime();
                return Number.isNaN(ts) ? 0 : ts;
            },
            render: (row) => {
                const ss = row.__salary || null;
                const date = getSalaryEffectiveDate(ss, row);
                if (!date || date.startsWith("0001")) return "-";
                try {
                    return new Date(date).toLocaleDateString();
                    // eslint-disable-next-line no-unused-vars
                } catch (e) {
                    return "-";
                }
            },
        },
        {
            label: "Salary Status",
            sortKey: "salary_status_sort",
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
            render: (row) => row.companies?.name || "-",
        },
        {
            label: "Actions",
            sortable: false,
            render: (row) => (
                <Button
                    variant="ghost"
                    onClick={() => handleEditSalaries(row)}
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                >
                    Update Salaries
                </Button>
            ),
        },
    ];

    return (
        <>
            <PageHeader title="Salaries Management" />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
                ) : (
                    <Table columns={columns} data={salariesData} />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={`Adjust Salaries: ${selectedEmp?.first_name} ${selectedEmp?.last_name}`}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>
                            Save Changes
                        </Button>
                    </>
                }
            >
                <Controller
                    name="base_salaries"
                    control={control}
                    render={({ field }) => (
                        <DecimalField
                            name={field.name}
                            label="Base Salaries (Monthly)"
                            decimals={2}
                            placeholder="0.00"
                            value={field.value ?? ""}
                            onBlur={field.onBlur}
                            onChange={(e) => field.onChange(e?.target?.value ?? e)}
                            error={errors.base_salaries?.message}
                        />
                    )}
                />

                <Controller
                    name="effective_date"
                    control={control}
                    render={({ field }) => (
                        <DateField
                            name={field.name}
                            label="Effective Date"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={errors.effective_date?.message}
                        />
                    )}
                />

                <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                    * Adjustments will be applied to payroll calculations from this date onwards.
                </p>
                <Controller
                    name="is_active"
                    control={control}
                    render={({ field }) => (
                        <CheckboxField
                            label="Active Salary Structure"
                            id="is_active"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            error={errors.is_active?.message}
                        />
                    )}
                />
            </Modal>
        </>
    );
};

export default SalariesStructurePage;
