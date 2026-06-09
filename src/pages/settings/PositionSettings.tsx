import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../api/axiosInstance";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import InputField from "../../components/common/InputField";
import SelectField from "../../components/common/SelectField";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";

const positionSchema = z.object({
    pos_name: z.string().min(1, "Position name is required"),
    companies_id: z.coerce.number().min(1, "Please select a companies"),
});

const PositionSettings = () => {
    const [positions, setPositions] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(positionSchema),
        defaultValues: { pos_name: "", companies_id: "" },
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [posRes, compRes] = await Promise.all([
                api.get("/positions"),
                api.get("/companies/options"),
            ]);
            setPositions(posRes.data || []);
            setCompanies(compRes.data || []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onSubmit = async (data) => {
        try {
            if (editingId) {
                await api.put(`/positions/${editingId}`, data);
            } else {
                await api.post("/positions", data);
            }
            fetchData();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        reset({
            pos_name: item.pos_name,
            companies_id: item.companies_id,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset({ pos_name: "", companies_id: "" });
    };

    const handleDelete = async (id) => {
        if (!id) return;
        if (window.confirm("Are you sure you want to delete this position?")) {
            try {
                await api.delete(`/positions/${id}`);
                fetchData();
            } catch (err) {
                const errData = err.response?.data;
                alert(errData?.reason ? `${errData.error}: ${errData.reason}` : errData?.error || "Delete Failed");
            }
        }
    };

    // Updated table columns without ID
    const columns = [
        {
            label: "Position Name",
            key: "pos_name"
        },
        {
            label: "Companies",
            render: (row) => row.companies?.name || "N/A"
        },
        {
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => handleEdit(row)} style={smallBtn}>
                        Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(row.id || row.ID)} style={smallBtn}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Position Management"
                actionButton={
                    <Button
                        onClick={() => {
                            setEditingId(null);
                            reset({ pos_name: "", companies_id: "" });
                            setIsModalOpen(true);
                        }}
                        style={{ width: "auto" }}
                    >
                        + Add Position
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>
                        Loading...
                    </div>
                ) : (
                    <Table columns={columns} data={positions} />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Position" : "Add New Position"}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>
                            {editingId ? "Update" : "Save"}
                        </Button>
                    </>
                }
            >
                <SelectField
                    label="Companies"
                    {...register("companies_id")}
                    error={errors.companies_id?.message}
                    options={companies.map((c) => ({
                        id: c.id,
                        name: c.name
                    }))}
                />
                <InputField
                    label="Position Name"
                    {...register("pos_name")}
                    error={errors.pos_name?.message}
                />
            </Modal>
        </>
    );
};

const smallBtn = { padding: "6px 12px", fontSize: "12px" };

export default PositionSettings;
