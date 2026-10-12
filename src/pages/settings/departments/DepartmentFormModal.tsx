import FormError from "../../../components/common/FormError";
import { textField } from "../../../utils/fieldValidation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import SelectField from "../../../components/common/SelectField";
import { apiErrorMessage } from "../../../utils/apiError";
import type { Company, Department, DepartmentCategory } from "../../../types/domain";

const departmentSchema = z.object({
    dept_name: textField("Department name", 2, 255),
    companies_id: z.string().min(1, "Please select a company"),
    category_id: z.string().min(1, "Please select a category"),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

// DepartmentFormModal owns the form: its schema, its draft category name, and the save call. The page only says which row is being edited.
interface DepartmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editing: Department | null;
    homeCompanyId: string;
    companies: Company[];
    categories: DepartmentCategory[];
    onCategoryCreated: (category: DepartmentCategory) => void;
}

const DepartmentFormModal = ({ isOpen, onClose, onSaved, editing, homeCompanyId, companies, categories, onCategoryCreated }: DepartmentFormModalProps) => {
    const [newCategoryName, setNewCategoryName] = useState("");
    const [categoryError, setCategoryError] = useState("");
    const {
        setError,
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(departmentSchema),
        defaultValues: { dept_name: "", companies_id: homeCompanyId, category_id: "" },
    });

    const watchedCategoryId = useWatch({ control, name: "category_id" });

    const handleClose = () => {
        setNewCategoryName("");
        setCategoryError("");
        onClose();
    };

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing
            ? {
                dept_name: editing.dept_name,
                companies_id: String(editing.companies_id),
                category_id: String(editing.category_id || ""),
            }
            : { dept_name: "", companies_id: homeCompanyId, category_id: "" });
    }, [isOpen, editing, homeCompanyId, reset]);

    const onSubmit = async (data: DepartmentFormValues) => {
        try {
            let categoryId = data.category_id;
            if (categoryId === "__new__") {
                const category = textField("Category name", 1, 100).safeParse(newCategoryName);
                if (!category.success) { setCategoryError(category.error.issues[0].message); return; }
                setCategoryError("");
                const catRes = await api.post("/department-categories", { name: category.data });
                categoryId = String(catRes.data.id);
                onCategoryCreated(catRes.data);
            }

            const payload = {
                ...data,
                companies_id: Number(data.companies_id),
                category_id: Number(categoryId),
            };
            if (editing) {
                await api.put(`/departments/${editing.id}`, payload);
            } else {
                await api.post("/departments", payload);
            }
            onSaved();
            handleClose();
        } catch (err) {
            setError("root", { message: apiErrorMessage(err, "Save Failed") });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={editing ? "Edit Department" : "Add New Department"}
            footer={
                <>
                    <Button variant="ghost" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                        {editing ? "Update" : "Save"}
                    </Button>
                </>
            }
        >
            <FormError message={errors.root?.message} />
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
                    error={categoryError}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                />
            )}
        </Modal>
    );
};

export default DepartmentFormModal;
