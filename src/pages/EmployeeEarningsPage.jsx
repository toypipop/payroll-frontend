import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../api/axiosInstance";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import InputField from "../components/common/InputField";
import SelectField from "../components/common/SelectField";

const schema = z.object({
    id: z.number().optional(),
    employees_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select an employee")),
    earning_type_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select an earning type")),
    amount: z.preprocess((val) => Number(val), z.number().min(0.01, "Amount must be greater than 0")),
});

const EmployeeEarningsPage = () => {
    const [items, setItems] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [earningTypes, setEarningTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { employees_id: "", earning_type_id: "", amount: "" },
    });

    const editingId = watch("id");

    const fetchData = async () => {
        try {
            setLoading(true);
            const [itemsRes, empRes, etRes] = await Promise.all([
                api.get("/employee-earnings"),
                api.get("/employees"),
                api.get("/earning-types"),
            ]);
            setItems(itemsRes.data);
            setEmployees(empRes.data);
            setEarningTypes(etRes.data);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const onSubmit = async (data) => {
        try {
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
        reset({
            id: item.id,
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
        // eslint-disable-next-line no-unused-vars
        } catch (err) {
            alert("Delete failed");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset({ id: undefined, employees_id: "", earning_type_id: "", amount: "" });
    };

    const columns = [
        {
            label: "Employee",
            render: (row) =>
                row.employees
                    ? `${row.employees.first_name} ${row.employees.last_name}`
                    : `ID: ${row.employees_id}`,
        },
        {
            label: "Earning Type",
            render: (row) => row.earning_type?.name ?? `ID: ${row.earning_type_id}`,
        },
        {
            label: "Monthly Amount (฿)",
            render: (row) => row.amount?.toLocaleString("th-TH", { minimumFractionDigits: 2 }),
        },
        {
            label: "Companies",
            render: (row) => row.employees?.companies?.name || "-",
        },
        {
            label: "Actions",
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
                        >
                            {editingId ? "Update" : "Save"}
                        </Button>
                    </>
                }
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <SelectField
                        label="Employee"
                        {...register("employees_id")}
                        error={errors.employees_id?.message}
                        options={employees.map((e) => ({
                            id: e.id,
                            name: `${e.employees_code} — ${e.first_name} ${e.last_name}`,
                        }))}
                    />
                    <SelectField
                        label="Earning Type"
                        {...register("earning_type_id")}
                        error={errors.earning_type_id?.message}
                        options={earningTypes.map((et) => ({ id: et.id, name: et.name }))}
                    />
                    <InputField
                        label="Monthly Amount (฿)"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("amount")}
                        error={errors.amount?.message}
                    />
                </div>
            </Modal>
        </>
    );
};

export default EmployeeEarningsPage;
