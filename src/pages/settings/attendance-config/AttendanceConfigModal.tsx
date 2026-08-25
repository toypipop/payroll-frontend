import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import ToggleField from "../../../components/common/ToggleField";
import TimeField from "../../../components/common/TimeField";
import { formatTime } from "../../../utils/bangkokTime";
import { apiErrorMessage } from "../../../utils/apiError";
import type { Company } from "../../../types/domain";

const attendanceConfigSchema = z.object({
    companies_id: z.number(),
    late_rate_per_minute: z.preprocess((val) => parseFloat(String(val)), z.number().min(0, "Invalid rate")),
    absent_rate_per_day: z.preprocess((val) => parseFloat(String(val)), z.number().min(0, "Invalid rate")),
    is_late_deduction_enabled: z.boolean(),
    is_absent_deduction_enabled: z.boolean(),
    work_start_time: z.string().optional(),
    work_end_time: z.string().optional(),
    overtime_rate_per_minute: z.preprocess((val) => val ? parseFloat(String(val)) : null, z.number().nullable()),
    extra_rate_per_day: z.preprocess((val) => val ? parseFloat(String(val)) : null, z.number().nullable()),
    is_overtime_earnings_enabled: z.boolean().default(false),
    is_extra_earnings_enabled: z.boolean().default(false),
});

type AttendanceConfigFormValues = z.infer<typeof attendanceConfigSchema>;

const DEFAULTS = {
    companies_id: 0,
    late_rate_per_minute: 5.0,
    absent_rate_per_day: 300.0,
    is_late_deduction_enabled: true,
    is_absent_deduction_enabled: true,
    work_start_time: "09:00",
    work_end_time: "18:00",
    overtime_rate_per_minute: null,
    extra_rate_per_day: null,
    is_overtime_earnings_enabled: false,
    is_extra_earnings_enabled: false,
};

// AttendanceConfigModal owns the config form and the save call; the page only says which company is being configured.
interface AttendanceConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    company: Company | null;
}

const AttendanceConfigModal = ({ isOpen, onClose, onSaved, company }: AttendanceConfigModalProps) => {
    const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
        resolver: zodResolver(attendanceConfigSchema),
        defaultValues: DEFAULTS,
    });

    // Re-seed the form whenever the page opens the modal, falling back to the defaults for a company with no config yet.
    useEffect(() => {
        if (!isOpen || !company) return;
        const config = company.attendance_config;
        reset({
            companies_id: Number(company.id),
            late_rate_per_minute: config?.late_rate_per_minute ?? 5.0,
            absent_rate_per_day: config?.absent_rate_per_day ?? 300.0,
            is_late_deduction_enabled: config?.is_late_deduction_enabled ?? true,
            is_absent_deduction_enabled: config?.is_absent_deduction_enabled ?? true,
            work_start_time: formatTime(config?.work_start_time),
            work_end_time: formatTime(config?.work_end_time),
            overtime_rate_per_minute: config?.overtime_rate_per_minute ?? "",
            extra_rate_per_day: config?.extra_rate_per_day ?? "",
            is_overtime_earnings_enabled: config?.is_overtime_earnings_enabled ?? false,
            is_extra_earnings_enabled: config?.is_extra_earnings_enabled ?? false,
        });
    }, [isOpen, company, reset]);

    const onSubmit = async (data: AttendanceConfigFormValues) => {
        try {
            await api.post("/attendance/config", data);
            onSaved();
            onClose();
        } catch (err) {
            alert(apiErrorMessage(err, "Save Failed"));
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Attendance Config: ${company?.name}`}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit(onSubmit)}>Save</Button>
                </>
            }
        >
            <div className="flex flex-col gap-[12px]">
                <input type="hidden" {...register("companies_id", { valueAsNumber: true })} />

                <Controller
                    name="work_start_time"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <TimeField
                            label="Work Start Time"
                            value={value}
                            onChange={onChange}
                            error={errors.work_start_time?.message}
                        />
                    )}
                />

                <Controller
                    name="work_end_time"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <TimeField
                            label="Work End Time"
                            value={value}
                            onChange={onChange}
                            error={errors.work_end_time?.message}
                        />
                    )}
                />

                <div className="border-t border-t-line-muted pt-[16px] mt-[8px]">
                    <h4 className="m-[0_0_16px] text-[15px] font-semibold text-secondary">Deduction Settings</h4>

                    <Controller
                        name="is_late_deduction_enabled"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <ToggleField
                                label="Late Deduction Enable"
                                checked={!!value}
                                onChange={onChange}
                            />
                        )}
                    />
                    <InputField
                        label="Late Rate per Minute (฿)"
                        type="number"
                        step="0.01"
                        {...register("late_rate_per_minute")}
                        error={errors.late_rate_per_minute?.message}
                        required
                    />

                    <Controller
                        name="is_absent_deduction_enabled"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <ToggleField
                                label="Absent Deduction Enable"
                                checked={!!value}
                                onChange={onChange}
                            />
                        )}
                    />
                    <InputField
                        label="Absent Rate per Day (฿)"
                        type="number"
                        step="0.01"
                        {...register("absent_rate_per_day")}
                        error={errors.absent_rate_per_day?.message}
                        required
                    />
                </div>

                <div className="border-t border-t-line-muted pt-[16px] mt-[8px]">
                    <h4 className="m-[0_0_16px] text-[15px] font-semibold text-secondary">Overtime & Extra Earnings</h4>

                    <Controller
                        name="is_overtime_earnings_enabled"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <ToggleField
                                label="Overtime Earnings Enable"
                                checked={!!value}
                                onChange={onChange}
                            />
                        )}
                    />
                    <InputField
                        label="Overtime Rate per Minute (฿)"
                        type="number"
                        step="0.01"
                        {...register("overtime_rate_per_minute")}
                        error={errors.overtime_rate_per_minute?.message}
                    />

                    <Controller
                        name="is_extra_earnings_enabled"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <ToggleField
                                label="Extra Earnings Enable"
                                checked={!!value}
                                onChange={onChange}
                            />
                        )}
                    />
                    <InputField
                        label="Extra Rate per Day (฿)"
                        type="number"
                        step="0.01"
                        {...register("extra_rate_per_day")}
                        error={errors.extra_rate_per_day?.message}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default AttendanceConfigModal;
