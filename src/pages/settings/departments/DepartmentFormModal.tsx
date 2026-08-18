import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import SelectField from "../../../components/common/SelectField";

const departmentSchema = z.object({
    dept_name: z.string().min(2, "Department name is required"),
    companies_id: z.string().min(1, "Please select a company"),
    category_id: z.string().min(1, "Please select a category"),
});

// DepartmentFormModal owns the form: its schema, its draft category name, and the save call. The page only says which row is being edited.
const DepartmentFormModal = ({ isOpen, onClose, onSaved, editing, homeCompanyId, companies, categories, onCategoryCreated }) => {
    const [newCategoryName, setNewCategoryName] = useState("");
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(departmentSchema),
        defaultValues: { dept_name: "", companies_id: homeCompanyId, category_id: "" },
    });

    const watchedCategoryId = watch("category_id");

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        setNewCategoryName("");
        reset(editing
            ? {
                dept_name: editing.dept_name,
                companies_id: String(editing.companies_id),
                category_id: String(editing.category_id || ""),
            }
            : { dept_name: "", companies_id: homeCompanyId, category_id: "" });
    }, [isOpen, editing, homeCompanyId, reset]);

    const onSubmit = async (data) => {
        try {
            let categoryId = data.category_id;
            if (categoryId === "__new__") {
                if (!newCategoryName.trim()) {
                    alert("Please enter a name for the new category");
                    return;
                }
                const catRes = await api.post("/department-categories", { name: newCategoryName.trim() });
                categoryId = String(catRes.data.id);
                onCategoryCreated(catRes.data);
            }

            const payload = { ...data, category_id: Number(categoryId) };
            if (editing) {
                await api.put(`/departments/${editing.id}`, payload);
            } else {
                await api.post("/departments", payload);
            }
            onSaved();
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Edit Department" : "Add New Department"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} style={{ width: "auto" }}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>
                        {editing ? "Update" : "Save"}
                    </Button>
                </>
            }
        >
            <SelectField
                label="Companies"
                {...register("companies_id")}
                error={errors.companies_id?.message}
                options={companies.map((c) => ({ id: c.id, name: c.name }))}
                disabled={!!editing}
                required
            />

            <InputField
                label="Department Name"
                {...register("dept_name")}
                error={errors.dept_name?.message}
                required
            />

            <SelectField
                label="Category"
                {...register("category_id")}
                error={errors.category_id?.message}
                options={[
                    ...categories.map((cat) => ({ id: cat.id, name: cat.name })),
                    { id: "__new__", name: "+ Add New Category" },
                ]}
                required
            />

            {watchedCategoryId === "__new__" && (
                <InputField
                    label="New Category Name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                />
            )}
        </Modal>
    );
};

export default DepartmentFormModal;
