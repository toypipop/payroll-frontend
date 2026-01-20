import React, { useState, useEffect } from "react";
import api from "../../api/axiosInstance";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import InputField from "../../components/common/InputField";
import SelectField from "../../components/common/SelectField";

const EmployeeListPage = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    /* --- Form data state (English Comment) --- */
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        dept_id: "",
        pos_id: "",
        employee_code: "",
    });

    const [editingId, setEditingId] = useState(null);
    const [masterDepts, setMasterDepts] = useState([]);
    const [masterPos, setMasterPos] = useState([]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await api.get("/employees");
            setEmployees(response.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [deptRes, posRes] = await Promise.all([
                    api.get("/departments"),
                    api.get("/positions"),
                ]);
                // Map data to match SelectField requirements
                setMasterDepts(
                    deptRes.data.map((d) => ({ id: d.id, name: d.dept_name })),
                );
                setMasterPos(
                    posRes.data.map((p) => ({ id: p.id, name: p.pos_name })),
                );
                // eslint-disable-next-line no-unused-vars
            } catch (err) {
                console.error("Master Data Load Error");
            }
        };
        fetchMasterData();
        fetchEmployees();
    }, []);

    const handleSubmit = async () => {
        try {
            const payload = {
                ...formData,
                dept_id: parseInt(formData.dept_id),
                pos_id: parseInt(formData.pos_id),
            };

            if (editingId) {
                await api.put(`/employees/${editingId}`, payload);
            } else {
                await api.post("/employees", payload);
            }
            fetchEmployees();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEdit = (emp) => {
        setEditingId(emp.id);
        setFormData({
            first_name: emp.first_name,
            last_name: emp.last_name,
            email: emp.email,
            dept_id: emp.dept_id,
            pos_id: emp.pos_id,
            employee_code: emp.employee_code,
        });
        setIsModalOpen(true);
    };

    /* --- DELETE: Remove employee (English Comment) --- */
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this employee?")) {
            try {
                await api.delete(`/employees/${id}`);
                fetchEmployees(); // Refresh the list
            } catch (err) {
                console.error("Delete Error:", err);
                alert(err.response?.data?.error || "Delete Failed");
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
            first_name: "",
            last_name: "",
            email: "",
            dept_id: "",
            pos_id: "",
            employee_code: "",
        });
    };

    const columns = [
        { label: "Code", key: "employee_code" },
        {
            label: "Full Name",
            render: (row) => `${row.first_name} ${row.last_name}`,
        },
        {
            label: "Position",
            render: (row) => row.position?.pos_name || "N/A",
        },
        {
            label: "Department",
            render: (row) => row.department?.dept_name || "N/A",
        },
        {
            label: "Status",
            render: (row) => <Badge status={row.status}>{row.status}</Badge>,
        },
        {
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                        variant="ghost"
                        onClick={() => handleEdit(row.ID)}
                        style={smallBtn}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleDelete(row.ID)}
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
            <PageHeader
                title="Employee Directory"
                actionButton={
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        style={{ width: "auto" }}
                    >
                        + Add Employee
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>
                        Loading...
                    </div>
                ) : (
                    <Table columns={columns} data={employees} />
                )}
            </Card>
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Employee" : "Add New Employee"}
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
                {/* Stacked Layout for better readability */}
                <InputField
                    label="Employee Code"
                    value={formData.employee_code}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            employee_code: e.target.value,
                        })
                    }
                />

                <InputField
                    label="First Name"
                    value={formData.first_name}
                    onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                    }
                />

                <InputField
                    label="Last Name"
                    value={formData.last_name}
                    onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                    }
                />

                <InputField
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                    }
                />

                <SelectField
                    label="Department"
                    value={formData.dept_id}
                    options={masterDepts}
                    onChange={(e) =>
                        setFormData({ ...formData, dept_id: e.target.value })
                    }
                />

                <SelectField
                    label="Position"
                    value={formData.pos_id}
                    options={masterPos}
                    onChange={(e) =>
                        setFormData({ ...formData, pos_id: e.target.value })
                    }
                />
            </Modal>
        </>
    );
};

const smallBtn = { padding: "6px 12px", fontSize: "12px" };

export default EmployeeListPage;
