import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../api/axiosInstance";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import InputField from "../../components/common/InputField";
import DecimalField from "../../components/common/DecimalField";
import SelectField from "../../components/common/SelectField";
import MasterDataWarning from "../../components/common/MasterDataWarning";

const schema = z.object({
    id: z.number().optional(),
    companies_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a company")),
    employees_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select an employee")),
    earning_type_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select an earning type")),
    amount: z.preprocess((val) => Number(val), z.number().min(0.01, "Amount must be greater than 0")),
});

const EmployeeEarningsPage = () => {
    const [items, setItems] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [earningTypes, setEarningTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { companies_id: "", employees_id: "", earning_type_id: "", amount: "" },
    });

    const editingId = watch("id");
    const selectedCompanyId = watch("companies_id");
    const selectedEmployeeId = watch("employees_id");
    const filteredEmployees = useMemo(
        () => selectedCompanyId ? employees.filter((emp) => String(emp.companies_id) === String(selectedCompanyId)) : [],
        [employees, selectedCompanyId],
    );

    const filteredEarningTypes = useMemo(() => {
        if (!selectedCompanyId) return earningTypes;

        return earningTypes.filter((et) => {
            if (!et.companies_id) return true;
            return String(et.companies_id) === String(selectedCompanyId);
        });
    }, [earningTypes, selectedCompanyId]);

    const showNoEarningTypesWarning = !!selectedCompanyId && filteredEarningTypes.length === 0;
    const showNoEmployeesWarning = !!selectedCompanyId && filteredEmployees.length === 0;

    const employeeField = register("employees_id");

    const fetchData = async () => {
        try {
            setLoading(true);
            const [itemsRes, empRes, etRes, companyRes] = await Promise.all([
                api.get("/employee-earnings"),
                api.get("/employees"),
                api.get("/earning-types/options").catch(() => ({ data: [] })),
                api.get("/companies/options"),
            ]);
            setItems(itemsRes.data);
            setEmployees(empRes.data);
            setEarningTypes(etRes.data);
            setCompanies(companyRes.data);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const onSubmit = async (data) => {
        try {
            if (filteredEmployees.length === 0) {
                alert("This company has no employees. Please add one before saving.");
                return;
            }
            const selectedType = earningTypes.find((et) => String(et.id) === String(data.earning_type_id));
            if (
                selectedCompanyId &&
                selectedType?.companies_id &&
                String(selectedType.companies_id) !== String(selectedCompanyId)
            ) {
                alert("Selected earning type does not belong to this employee's company");
                return;
            }

            if (data.id) {
                await api.put(`/employee-earnings/${data.id}`, data);
            } else {
                await api.post("/employee-earnings", data);
            }
            const res = await api.get("/employee-earnings");
            setItems(res.data);
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Operation failed");
        }
    };

    const handleEdit = (item) => {
        const companyId = item.companies_id || item.employees?.companies_id || "";
        reset({
            id: item.id,
            companies_id: companyId,
            employees_id: item.employees_id,
            earning_type_id: item.earning_type_id,
            amount: item.amount,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this assignment?")) return;
        try {
            await api.delete(`/employee-earnings/${id}`);
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch (err) {
            alert("Delete failed");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset({ id: undefined, companies_id: "", employees_id: "", earning_type_id: "", amount: "" });
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
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => handleEdit(row)} style={{ fontSize: "12px", padding: "4px 8px" }}>
                        Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(row.id)} style={{ fontSize: "12px", padding: "4px 8px", color: "#ef4444" }}>
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
                    <Button onClick={() => setIsModalOpen(true)} style={{ width: "auto" }}>
                        + Assign Earning
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

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Employee Earning" : "Assign Earning to Employee"}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>Cancel</Button>
                        <Button
                            onClick={handleSubmit(onSubmit, (err) => console.log("Validation Errors:", err))}
                            style={{ width: "auto" }}
                            disabled={showNoEarningTypesWarning || showNoEmployeesWarning}
                        >
                            {editingId ? "Update" : "Save"}
                        </Button>
                    </>
                }
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <SelectField
                        label="Company"
                        {...register("companies_id")}
                        error={errors.companies_id?.message}
                        onChange={(e) => {
                            setValue("companies_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                            setValue("employees_id", "", { shouldValidate: true, shouldDirty: true });
                            setValue("earning_type_id", "", { shouldValidate: true, shouldDirty: true });
                        }}
                        options={companies.map((c) => ({ id: c.id, name: c.name }))}
                        required
                    />
                    <SelectField
                        label="Employee"
                        {...employeeField}
                        error={errors.employees_id?.message}
                        onChange={(e) => {
                            setValue("employees_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                            setValue("earning_type_id", "", { shouldValidate: true, shouldDirty: true });
                        }}
                        options={filteredEmployees.map((e) => ({
                            id: e.id,
                            name: `${e.employees_code} — ${e.first_name} ${e.last_name}`,
                        }))}
                        disabled={!selectedCompanyId}
                        required
                    />
                    {showNoEmployeesWarning && (
                        <MasterDataWarning
                            message="This company has no employees yet."
                            routePath="/employees"
                            moduleKey="EmployeesListPage"
                        />
                    )}
                    <SelectField
                        label="Earning Type"
                        {...register("earning_type_id")}
                        error={errors.earning_type_id?.message}
                        options={filteredEarningTypes.map((et) => ({ id: et.id, name: et.name }))}
                        disabled={!selectedEmployeeId}
                        required
                    />
                    {showNoEarningTypesWarning && (
                        <MasterDataWarning
                            message="This company has no earning types yet."
                            routePath="/earning-types"
                            moduleKey="EarningTypesPage"
                        />
                    )}
                    <Controller
                        name="amount"
                        control={control}
                        render={({ field }) => (
                            <DecimalField
                                label="Monthly Amount (฿)"
                                decimals={2}
                                placeholder="0.00"
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.amount?.message}
                                required
                            />
                        )}
                    />
                </div>
            </Modal>
        </>
    );
};

export default EmployeeEarningsPage;
