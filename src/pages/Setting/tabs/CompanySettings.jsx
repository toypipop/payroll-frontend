import React, { useState, useEffect } from "react";
import api from "../../../api/axiosInstance";
import Table from "../../../components/common/Table";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";

const CompanySettings = () => {
    const [companies, setCompanies] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        tax_id: "",
        address: "",
        phone: "",
    });

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const res = await api.get("/v1/companies");
            setCompanies(res.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleSubmit = async () => {
        try {
            if (editingId) {
                await api.put(`/v1/companies/${editingId}`, formData);
            } else {
                await api.post("/v1/companies", formData);
            }
            fetchCompanies();
            closeModal();
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            alert("Save failed");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this company?")) {
            await api.delete(`/v1/companies/${id}`);
            fetchCompanies();
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({
            name: item.name,
            tax_id: item.tax_id,
            address: item.address,
            phone: item.phone,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ name: "", tax_id: "", address: "", phone: "" });
    };

    const columns = [
        { label: "Company Name", key: "name" },
        { label: "Tax ID", key: "tax_id" },
        { label: "Phone", key: "phone" },
        {
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                        variant="ghost"
                        onClick={() => handleEdit(row)}
                        style={smallBtn}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleDelete(row.id)}
                        style={smallBtn}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                }}
            >
                <h3 style={{ fontSize: "16px", color: "#1e293b" }}>
                    Company List
                </h3>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    style={{ width: "auto" }}
                >
                    + Add Company
                </Button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <Table columns={columns} data={companies} />
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Company" : "Add Company"}
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={closeModal}
                            style={{ width: "auto" }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            style={{ width: "auto" }}
                        >
                            Save
                        </Button>
                    </>
                }
            >
                <InputField
                    label="Name"
                    value={formData.name}
                    onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                    }
                />
                <InputField
                    label="Tax ID"
                    value={formData.tax_id}
                    onChange={(e) =>
                        setFormData({ ...formData, tax_id: e.target.value })
                    }
                />
                <InputField
                    label="Address"
                    value={formData.address}
                    onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                    }
                />
                <InputField
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                    }
                />
            </Modal>
        </div>
    );
};

const smallBtn = { padding: "4px 8px", fontSize: "12px" };

export default CompanySettings;
