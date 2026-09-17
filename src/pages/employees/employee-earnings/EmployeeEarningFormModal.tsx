import { useEffect, useMemo } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import DecimalField from "../../../components/common/DecimalField";
import SelectField from "../../../components/common/SelectField";
import MasterDataWarning from "../../../components/common/MasterDataWarning";
import { apiErrorMessage } from "../../../utils/apiError";
import type { Company, EarningType, Employee, EmployeeEarning } from "../../../types/domain";

const schema = z.object({
    id: z.number().optional(),
    companies_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a company")),
    employees_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select an employee")),
    earning_type_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select an earning type")),
    amount: z.preprocess((val) => Number(val), z.number().min(0.01, "Amount must be greater than 0")),
});

type EmployeeEarningFormValues = z.infer<typeof schema>;

// EmployeeEarningFormModal owns the cascading company to employee to earning-type form and the save call.
interface EmployeeEarningFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editing: EmployeeEarning | null;
    homeCompanyId: string;
    companies: Company[];
    employees: Employee[];
    earningTypes: EarningType[];
}

const EmployeeEarningFormModal = ({ isOpen, onClose, onSaved, editing, homeCompanyId, companies, employees, earningTypes }: EmployeeEarningFormModalProps) => {
    const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { companies_id: homeCompanyId, employees_id: "", earning_type_id: "", amount: "" },
    });

    const selectedCompanyId = useWatch({ control, name: "companies_id" });
    const selectedEmployeeId = useWatch({ control, name: "employees_id" });

    const filteredEmployees = useMemo(
        () => selectedCompanyId ? employees.filter((emp) => String(emp.companies_id) === String(selectedCompanyId)) : [],
        [employees, selectedCompanyId],
    );

    const filteredEarningTypes = useMemo(() => {
        if (!selectedCompanyId) return earningTypes;

        return earningTypes.filter((et) => {
            if (!et.companies_id) return true;
            return String(et.companies_id) === String(selectedCompanyId);
        });
    }, [earningTypes, selectedCompanyId]);

    const showNoEarningTypesWarning = !!selectedCompanyId && filteredEarningTypes.length === 0;
    const showNoEmployeesWarning = !!selectedCompanyId && filteredEmployees.length === 0;

    const employeeField = register("employees_id");

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing
            ? {
                id: editing.id == null ? undefined : Number(editing.id),
                companies_id: editing.companies_id || editing.employees?.companies_id || "",
                employees_id: editing.employees_id,
                earning_type_id: editing.earning_type_id,
                amount: editing.amount,
            }
            : { id: undefined, companies_id: homeCompanyId, employees_id: "", earning_type_id: "", amount: "" });
    }, [isOpen, editing, homeCompanyId, reset]);

    const onSubmit = async (data: EmployeeEarningFormValues) => {
        try {
            if (filteredEmployees.length === 0) {
                alert("This company has no employees. Please add one before saving.");
                return;
            }
            const selectedType = earningTypes.find((et) => String(et.id) === String(data.earning_type_id));
            if (
                selectedCompanyId &&
                selectedType?.companies_id &&
                String(selectedType.companies_id) !== String(selectedCompanyId)
            ) {
                alert("Selected earning type does not belong to this employee's company");
                return;
            }

            if (data.id) {
                await api.put(`/employee-earnings/${data.id}`, data);
            } else {
                await api.post("/employee-earnings", data);
            }
            await onSaved();
            onClose();
        } catch (err) {
            alert(apiErrorMessage(err, "Operation failed"));
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Edit Employee Earning" : "Assign Earning to Employee"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit(onSubmit, (err) => console.log("Validation Errors:", err))}
                        className="w-auto"
                        disabled={showNoEarningTypesWarning || showNoEmployeesWarning}
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
                        setValue("earning_type_id", "", { shouldValidate: true, shouldDirty: true });
                    }}
                    options={companies.map((c) => ({ id: c.id, name: c.name }))}
                    required
                    disabled={!!editing}
                />
                <SelectField
                    label="Employee"
                    {...employeeField}
                    error={errors.employees_id?.message}
                    onChange={(e) => {
                        setValue("employees_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                        setValue("earning_type_id", "", { shouldValidate: true, shouldDirty: true });
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
                    label="Earning Type"
                    {...register("earning_type_id")}
                    error={errors.earning_type_id?.message}
                    options={filteredEarningTypes.map((et) => ({ id: et.id, name: et.name }))}
                    disabled={!selectedEmployeeId}
                    required
                />
                {showNoEarningTypesWarning && (
                    <MasterDataWarning
                        message="This company has no earning types yet."
                        routePath="/earning-types"
                        moduleKey="EarningTypesPage"
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

export default EmployeeEarningFormModal;
