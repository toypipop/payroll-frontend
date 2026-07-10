import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../api/axiosInstance";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import InputField from "../../components/common/InputField";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";

const bankSchema = z.object({
    bank_code: z.string().min(1, "Bank code is required").max(10, "Max 10 characters"),
    bank_name: z.string().min(1, "Bank name is required"),
    swift_code: z.string().optional(),
});

const MasterBankPage = () => {
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(bankSchema),
        defaultValues: { bank_code: "", bank_name: "", swift_code: "" },
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get("/master/banks");
            setBanks(res.data || []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const onSubmit = async (data) => {
        try {
            if (editingId) {
                await api.put(`/master/banks/${editingId}`, data);
            } else {
                await api.post("/master/banks", data);
            }
            fetchData();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        reset({ bank_code: item.bank_code, bank_name: item.bank_name, swift_code: item.swift_code || "" });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset({ bank_code: "", bank_name: "", swift_code: "" });
    };

    const handleDelete = async (id) => {
        if (!id) return;
        if (window.confirm("Delete this bank?")) {
            try {
                await api.delete(`/master/banks/${id}`);
                fetchData();
            } catch (err) {
                const errData = err.response?.data;
                alert(errData?.reason ? `${errData.error}: ${errData.reason}` : errData?.error || "Delete Failed");
            }
        }
    };

    const smallBtn = { padding: "4px 12px", fontSize: "12px", width: "auto" };

    const columns = [
        { label: "Code", key: "bank_code" },
        { label: "Bank Name", key: "bank_name" },
        { label: "SWIFT Code", key: "swift_code" },
        {
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => handleEdit(row)} style={smallBtn}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(row.id)} style={smallBtn}>Delete</Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Bank Master"
                actionButton={
                    <Button onClick={() => { setEditingId(null); reset({ bank_code: "", bank_name: "", swift_code: "" }); setIsModalOpen(true); }} style={{ width: "auto" }}>
                        + Add Bank
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div> : <Table columns={columns} data={banks} />}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Bank" : "Add New Bank"}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>Cancel</Button>
                        <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>{editingId ? "Update" : "Save"}</Button>
                    </>
                }
            >
                <InputField label="Bank Code (e.g. BBL, KBANK)" {...register("bank_code")} error={errors.bank_code?.message} required />
                <InputField label="Bank Name" {...register("bank_name")} error={errors.bank_name?.message} required />
                <InputField label="SWIFT Code" {...register("swift_code")} error={errors.swift_code?.message} />
            </Modal>
        </>
    );
};

export default MasterBankPage;
