import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import useDepartments from "./departments/useDepartments";
import DepartmentFormModal from "./departments/DepartmentFormModal";

const DepartmentSettings = () => {
    const { homeCompanyId } = useAuth();
    const { departments, companies, categories, setCategories, loading, fetchData, remove } = useDepartments();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setIsModalOpen(true);
    };

    const columns = [
        { label: "Department Name", key: "dept_name" },
        {
            label: "Companies",
            render: (row) => row.companies?.name || "N/A"
        },
        {
            label: "Category",
            render: (row) => row.category?.name || "N/A"
        },
        {
            label: "Actions",
            render: (row) => (
                <div className="flex gap-[8px]">
                    <Button variant="ghost" onClick={() => openEdit(row)} className={smallBtn}>
                        Edit
                    </Button>
                    <Button variant="danger" onClick={() => remove(row.id)} className={smallBtn}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Department Management"
                actionButton={
                    <Button onClick={openAdd}>
                        + Add Department
                    </Button>
                }
            />
            <Card className="p-0">
                {loading ? (
                    <div className="p-[40px] text-center">
                        Loading...
                    </div>
                ) : (
                    <Table columns={columns} data={departments} />
                )}
            </Card>

            <DepartmentFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchData}
                editing={editing}
                homeCompanyId={homeCompanyId}
                companies={companies}
                categories={categories}
                onCategoryCreated={(cat) => setCategories((prev) => [...prev, cat])}
            />
        </>
    );
};

const smallBtn = "px-3 py-1.5 text-xs";

export default DepartmentSettings;
