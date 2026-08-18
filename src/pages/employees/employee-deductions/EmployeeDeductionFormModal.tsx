import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import DecimalField from "../../../components/common/DecimalField";
import SelectField from "../../../components/common/SelectField";
import MasterDataWarning from "../../../components/common/MasterDataWarning";

const schema = z.object({
    id: z.number().optional(),
    companies_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a company")),
    employees_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select an employee")),
    deduction_type_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a deduction type")),
    amount: z.preprocess((val) => Number(val), z.number().min(0.01, "Amount must be greater than 0")),
});

// EmployeeDeductionFormModal owns the cascading company to employee to deduction-type form and the save call.
const EmployeeDeductionFormModal = ({ isOpen, onClose, onSaved, editing, homeCompanyId, companies, employees, deductionTypes }) => {
    const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { companies_id: homeCompanyId, employees_id: "", deduction_type_id: "", amount: "" },
    });

    const selectedCompanyId = watch("companies_id");
    const selectedEmployeeId = watch("employees_id");

    const filteredEmployees = useMemo(
        () => selectedCompanyId ? employees.filter((emp) => String(emp.companies_id) === String(selectedCompanyId)) : [],
        [employees, selectedCompanyId],
    );

    const filteredDeductionTypes = useMemo(() => {
        if (!selectedCompanyId) return deductionTypes;

        return deductionTypes.filter((dt) => {
            if (!dt.companies_id) return true;
            return String(dt.companies_id) === String(selectedCompanyId);
        });
    }, [deductionTypes, selectedCompanyId]);

    const showNoDeductionTypesWarning = !!selectedCompanyId && filteredDeductionTypes.length === 0;
    const showNoEmployeesWarning = !!selectedCompanyId && filteredEmployees.length === 0;

    const employeeField = register("employees_id");

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing
            ? {
                id: editing.id,
                companies_id: editing.companies_id || editing.employees?.companies_id || "",
                employees_id: editing.employees_id,
                deduction_type_id: editing.deduction_type_id,
                amount: editing.amount,
            }
            : { id: undefined, companies_id: homeCompanyId, employees_id: "", deduction_type_id: "", amount: "" });
    }, [isOpen, editing, homeCompanyId, reset]);

    const onSubmit = async (data) => {
        try {
            if (filteredEmployees.length === 0) {
                alert("This company has no employees. Please add one before saving.");
                return;
            }
            const selectedType = deductionTypes.find((dt) => String(dt.id) === String(data.deduction_type_id));
            if (
                selectedCompanyId &&
                selectedType?.companies_id &&
                String(selectedType.companies_id) !== String(selectedCompanyId)
            ) {
                alert("Selected deduction type does not belong to this employee's company");
                return;
            }

            if (data.id) {
                await api.put(`/employee-deductions/${data.id}`, data);
            } else {
                await api.post("/employee-deductions", data);
            }
            await onSaved();
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || "Operation failed");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Edit Employee Deduction" : "Assign Deduction to Employee"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit(onSubmit, (err) => console.log("Validation Errors:", err))}
                        className="w-auto"
                        disabled={showNoDeductionTypesWarning || showNoEmployeesWarning}
                    >
                        {editing ? "Update" : "Save"}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-[16px]">
                <SelectField
                    label="Company"
                    {...register("companies_id")}
                    error={errors.companies_id?.message}
                    onChange={(e) => {
                        setValue("companies_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                        setValue("employees_id", "", { shouldValidate: true, shouldDirty: true });
                        setValue("deduction_type_id", "", { shouldValidate: true, shouldDirty: true });
                    }}
                    options={companies.map((c) => ({ id: c.id, name: c.name }))}
                    required
                />
                <SelectField
                    label="Employee"
                    {...employeeField}
                    error={errors.employees_id?.message}
                    onChange={(e) => {
                        setValue("employees_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                        setValue("deduction_type_id", "", { shouldValidate: true, shouldDirty: true });
                    }}
                    options={filteredEmployees.map((e) => ({
                        id: e.id,
                        name: `${e.employees_code} — ${e.first_name} ${e.last_name}`,
                    }))}
                    disabled={!selectedCompanyId}
                    required
                />
                {showNoEmployeesWarning && (
                    <MasterDataWarning
                        message="This company has no employees yet."
                        routePath="/employees"
                        moduleKey="EmployeesListPage"
                    />
                )}
                <SelectField
                    label="Deduction Type"
                    {...register("deduction_type_id")}
                    error={errors.deduction_type_id?.message}
                    options={filteredDeductionTypes.map((dt) => ({ id: dt.id, name: dt.name }))}
                    disabled={!selectedEmployeeId}
                    required
                />
                {showNoDeductionTypesWarning && (
                    <MasterDataWarning
                        message="This company has no deduction types yet."
                        routePath="/deduction-types"
                        moduleKey="DeductionTypesPage"
                    />
                )}
                <Controller
                    name="amount"
                    control={control}
                    render={({ field }) => (
                        <DecimalField
                            label="Monthly Amount (฿)"
                            decimals={2}
                            placeholder="0.00"
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.amount?.message}
                            required
                        />
                    )}
                />
            </div>
        </Modal>
    );
};

export default EmployeeDeductionFormModal;
