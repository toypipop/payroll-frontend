import React from "react";
import Table from "../../../components/common/Table";
import Button from "../../../components/common/Button";

const DepartmentSettings = () => {
    // Mock data for departments
    const data = [
        { id: 1, dept_name: "Information Technology", code: "IT" },
        { id: 2, dept_name: "Human Resources", code: "HR" },
        { id: 3, dept_name: "Finance", code: "FIN" },
    ];

    const handleEdit = (item) => console.log("Edit", item);
    const handleDelete = (id) => console.log("Delete ID", id);

    // Correct way: row must be inside the parentheses
    const columns = [
        { label: "Code", key: "code" },
        { label: "Department Name", key: "dept_name" },
        {
            label: "Actions",
            render: (
                row, // Ensure 'row' is defined here
            ) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => handleEdit(row)}>
                        Edit
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleDelete(row.id)}
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
                    Department List
                </h3>
                <Button style={{ width: "auto", padding: "8px 16px" }}>
                    + Add Dept
                </Button>
            </div>
            <Table columns={columns} data={data} />
        </div>
    );
};

export default DepartmentSettings;
