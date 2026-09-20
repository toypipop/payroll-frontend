import { useEffect, useMemo, useState } from "react";
import Modal from "../../../components/common/Modal";
import Button from "../../../components/common/Button";
import InputField from "../../../components/common/InputField";
import DecimalField from "../../../components/common/DecimalField";
import DateField from "../../../components/common/DateField";
import SelectField from "../../../components/common/SelectField";
import { bangkokDateKey } from "../../../utils/bangkokTime";
import { getEmployeeId, getSalaryBaseAmount, getLatestSalaryStructure } from "./salaryShape";
import { money, newSalaryFor, raiseSummary } from "./bulkRaise";
import type { BulkRaiseMode } from "./bulkRaise";
import { useBulkRaise } from "./useBulkRaise";
import { salaryRows } from "./salaryRows";
import type { SalaryRow } from "./salaryRows";
import type { SalaryPayload } from "./salaryShape";
import api from "../../../api/axiosInstance";
import { apiErrorMessage } from "../../../utils/apiError";
import type { OptionRow } from "../../../types/domain";

interface BulkRaiseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplied: () => void;
    companies: OptionRow[];
}

const MODES: { id: BulkRaiseMode; name: string }[] = [
    { id: "percent", name: "Percentage of current salary" },
    { id: "amount", name: "Same amount for everyone" },
    { id: "manual", name: "A figure per person" },
];

// BulkRaiseModal runs an annual adjustment: pick a company, tick the people, say how much, look at what it
// would do, then commit. The batch is all or nothing, so the preview is not a nicety — it is the only place
// the operator finds out who would stop it.
const BulkRaiseModal = ({ isOpen, onClose, onApplied, companies }: BulkRaiseModalProps) => {
    const [rows, setRows] = useState<SalaryRow[]>([]);
    const [targetError, setTargetError] = useState("");
    const [loadingTargets, setLoadingTargets] = useState(true);
    useEffect(() => {
        const controller = new AbortController();
        void api.get<SalaryPayload[]>("/salaries/options", { signal: controller.signal })
            .then(({ data }) => { if (!controller.signal.aborted) setRows(salaryRows(data)); })
            .catch((error: unknown) => { if (!controller.signal.aborted) setTargetError(apiErrorMessage(error, "Unable to load employees. Close and reopen to retry.")); })
            .finally(() => { if (!controller.signal.aborted) setLoadingTargets(false); });
        return () => controller.abort();
    }, []);
    const [companyID, setCompanyID] = useState("");
    const [picked, setPicked] = useState<Record<number, boolean>>({});
    const [typed, setTyped] = useState<Record<number, string>>({});
    const [mode, setMode] = useState<BulkRaiseMode>("percent");
    const [value, setValue] = useState("5");
    const [effectiveDate, setEffectiveDate] = useState(bangkokDateKey(new Date()));
    const [reason, setReason] = useState("");
    const [touched, setTouched] = useState(false);

    const { preview, busy, error, runPreview, apply, clear } = useBulkRaise();

    const candidates = useMemo(
        () => rows.filter((row) => row.is_active === true && (!companyID || String(row.companies_id) === companyID)),
        [rows, companyID],
    );
    const selected = candidates.filter((row) => picked[Number(getEmployeeId(row))]);

    const currentOf = (row: SalaryRow) =>
        Number(getSalaryBaseAmount(row.__salary || getLatestSalaryStructure(row), row) || 0);

    const request = () => ({
        mode,
        value: Number(value) || 0,
        effective_date: effectiveDate,
        reason,
        targets: selected.map((row) => {
            const id = Number(getEmployeeId(row));
            return { employees_id: id, new_salary: Number(typed[id]) || 0 };
        }),
    });

    const reasonMissing = touched && !reason.trim();
    const canSubmit = selected.length > 0 && reason.trim().length > 0 && !busy && !loadingTargets && !targetError;

    const onPreview = () => {
        setTouched(true);
        if (!canSubmit) return;
        runPreview(request());
    };

    const onApply = async () => {
        setTouched(true);
        if (!canSubmit) return;
        if (await apply(request())) {
            onApplied();
            onClose();
        }
    };

    const summary = preview ? raiseSummary(preview.rows) : null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Raise several salaries"
            className="max-w-[860px]"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button variant="ghost" onClick={onPreview} disabled={busy}>Preview</Button>
                    <Button onClick={onApply} disabled={!preview || preview.blocked_count > 0 || busy}>
                        Apply to {selected.length} {selected.length === 1 ? "person" : "people"}
                    </Button>
                </>
            }
        >
            <div className="grid grid-cols-2 gap-x-4">
                <SelectField
                    label="Companies"
                    options={companies}
                    value={companyID}
                    onChange={(e) => {
                        setCompanyID(e.target.value);
                        setPicked({});
                        clear();
                    }}
                />
                <SelectField
                    label="How the raise is worked out"
                    options={MODES}
                    value={mode}
                    onChange={(e) => {
                        setMode(e.target.value as BulkRaiseMode);
                        clear();
                    }}
                    searchable={false}
                />
                {mode !== "manual" && (
                    <DecimalField
                        label={mode === "percent" ? "Percent" : "Amount added"}
                        decimals={2}
                        value={value}
                        onChange={(e) => {
                            setValue(e?.target?.value ?? "");
                            clear();
                        }}
                        required
                    />
                )}
                <DateField
                    label="Effective Date"
                    value={effectiveDate}
                    onChange={(next: string) => {
                        setEffectiveDate(next);
                        clear();
                    }}
                    required
                />
            </div>

            <InputField
                name="bulk_reason"
                label="Reason for this change"
                placeholder="e.g. annual adjustment 2027"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onBlur={() => setTouched(true)}
                error={reasonMissing ? "Say why these salaries are changing" : undefined}
                required
            />

            {loadingTargets && <p role="status">Loading employees?</p>}
            {targetError && <p role="alert" className="text-danger">{targetError}</p>}
            {!preview ? (
                <div className="mt-1 max-h-[300px] overflow-y-auto rounded-lg border border-line-muted">
                    <table className="w-full border-collapse text-[13px]">
                        <thead className="sticky top-0 bg-surface">
                            <tr className="text-[11px] font-semibold text-subtle">
                                <th className="w-[8%] p-[6px_8px] text-left">
                                    <input
                                        type="checkbox"
                                        aria-label="Select everyone"
                                        checked={candidates.length > 0 && selected.length === candidates.length}
                                        onChange={(e) => {
                                            const next: Record<number, boolean> = {};
                                            if (e.target.checked) {
                                                candidates.forEach((row) => { next[Number(getEmployeeId(row))] = true; });
                                            }
                                            setPicked(next);
                                            clear();
                                        }}
                                    />
                                </th>
                                <th className="w-[20%] p-[6px_8px] text-left">Code</th>
                                <th className="w-[34%] p-[6px_8px] text-left">Name</th>
                                <th className="w-[19%] p-[6px_8px] text-right">Current</th>
                                <th className="w-[19%] p-[6px_8px] text-right">New</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidates.map((row) => {
                                const id = Number(getEmployeeId(row));
                                const current = currentOf(row);
                                const isPicked = Boolean(picked[id]);
                                return (
                                    <tr key={id} className="border-t border-t-hover">
                                        <td className="p-[6px_8px]">
                                            <input
                                                type="checkbox"
                                                aria-label={`Select ${row.first_name} ${row.last_name}`}
                                                checked={isPicked}
                                                onChange={(e) => {
                                                    setPicked((prev) => ({ ...prev, [id]: e.target.checked }));
                                                    clear();
                                                }}
                                            />
                                        </td>
                                        <td className="p-[6px_8px]">{row.employees_code}</td>
                                        <td className="p-[6px_8px]">{row.first_name} {row.last_name}</td>
                                        <td className="p-[6px_8px] text-right font-mono">{money(current)}</td>
                                        <td className="p-[6px_8px] text-right font-mono">
                                            {mode === "manual" ? (
                                                <DecimalField
                                                    decimals={2}
                                                    placeholder="0.00"
                                                    containerClassName="mb-0"
                                                    value={typed[id] ?? ""}
                                                    onChange={(e) => {
                                                        setTyped((prev) => ({ ...prev, [id]: e?.target?.value ?? "" }));
                                                        clear();
                                                    }}
                                                    disabled={!isPicked}
                                                />
                                            ) : isPicked ? (
                                                money(newSalaryFor(mode, Number(value) || 0, current, 0))
                                            ) : (
                                                <span className="text-subtle">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="mt-1">
                    {preview.blocked_count > 0 ? (
                        <div className="mb-3 rounded-lg border border-warning-line bg-warning-soft px-3 py-2.5 text-[13px] leading-normal text-warning-text">
                            {preview.blocked_count} of {preview.rows.length} cannot be raised on this date, so
                            none of them will be. Fix the rows below, or pick another date.
                        </div>
                    ) : (
                        <div className="mb-3 rounded-lg border border-line-muted bg-surface px-3 py-2.5 text-[13px] leading-normal text-main">
                            {summary?.count} {summary?.count === 1 ? "salary" : "salaries"} will change,
                            adding <span className="font-mono font-semibold">{money(summary?.total ?? 0)}</span> per period.
                        </div>
                    )}

                    <div className="max-h-[280px] overflow-y-auto rounded-lg border border-line-muted">
                        <table className="w-full border-collapse text-[13px]">
                            <thead className="sticky top-0 bg-surface">
                                <tr className="text-[11px] font-semibold text-subtle">
                                    <th className="w-[18%] p-[6px_8px] text-left">Code</th>
                                    <th className="w-[26%] p-[6px_8px] text-left">Name</th>
                                    <th className="w-[16%] p-[6px_8px] text-right">Current</th>
                                    <th className="w-[16%] p-[6px_8px] text-right">New</th>
                                    <th className="w-[24%] p-[6px_8px] text-left">&nbsp;</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.rows.map((row) => (
                                    <tr
                                        key={row.employees_id}
                                        className={`border-t border-t-hover ${row.blocked ? "bg-warning-soft" : ""}`}
                                    >
                                        <td className="p-[6px_8px]">{row.employees_code}</td>
                                        <td className="p-[6px_8px]">{row.employee_name}</td>
                                        <td className="p-[6px_8px] text-right font-mono">{money(row.current_salary)}</td>
                                        <td className="p-[6px_8px] text-right font-mono">
                                            {row.blocked ? <span className="text-subtle">—</span> : money(row.new_salary)}
                                        </td>
                                        <td className="p-[6px_8px] text-[11px] leading-snug text-warning-text">
                                            {row.blocker}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {error && <div className="mt-3 text-[13px] text-danger-text">{error}</div>}
        </Modal>
    );
};

export default BulkRaiseModal;
