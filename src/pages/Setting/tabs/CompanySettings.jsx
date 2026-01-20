import React, { useState, useEffect } from "react";
import api from "../../../api/axiosInstance";
import Table from "../../../components/common/Table";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";

const CompanySettings = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    /* --- Form data state (English Comment) --- */
    const [formData, setFormData] = useState({
        name: "",
        tax_id: "",
        address: "",
        phone: "",
    });

    const [editingId, setEditingId] = useState(null);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const response = await api.get("/companies");
            setCompanies(response.data);
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
                await api.put(`/companies/${editingId}`, formData);
            } else {
                await api.post("/companies", formData);
            }
            fetchCompanies();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    /* --- Update handleEdit (English Comment) --- */
    const handleEdit = (item) => {
        setEditingId(item.ID); // Changed from item.id to item.ID
        setFormData({
            name: item.name,
            tax_id: item.tax_id,
            address: item.address,
            phone: item.phone,
        });
        setIsModalOpen(true);
    };

    /* --- Update handleDelete (English Comment) --- */
    const handleDelete = async (id) => {
        // If id is passed as row.ID, this will now have a value
        if (!id) return;

        if (window.confirm("Are you sure you want to delete this company?")) {
            try {
                await api.delete(`/companies/${id}`);
                fetchCompanies();
            } catch (err) {
                alert(err.response?.data?.error || "Delete Failed");
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ name: "", tax_id: "", address: "", phone: "" });
    };
    /* --- Update Table Columns (English Comment) --- */
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
                        onClick={() => handleDelete(row.ID)} // Changed from row.id to row.ID
                        style={smallBtn}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                }}
            >
                <h3
                    style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1e293b",
                        margin: 0,
                    }}
                >
                    Company Management
                </h3>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    style={{ width: "auto" }}
                >
                    + Add Company
                </Button>
            </div>

            {loading ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                    Loading...
                </div>
            ) : (
                <Table columns={columns} data={companies} />
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Company" : "Add New Company"}
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
                            {editingId ? "Update" : "Save"}
                        </Button>
                    </>
                }
            >
                <InputField
                    label="Company Name"
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
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                    }
                />
            </Modal>
        </>
    );
};

const smallBtn = { padding: "6px 12px", fontSize: "12px" };

export default CompanySettings;
