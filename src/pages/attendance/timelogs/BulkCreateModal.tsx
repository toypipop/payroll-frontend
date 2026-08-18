import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import DateField from "../../../components/common/DateField";
import TimeField from "../../../components/common/TimeField";
import SelectField from "../../../components/common/SelectField";
import MasterDataWarning from "../../../components/common/MasterDataWarning";
import { WEEKDAY_OPTIONS, formatHHMM, parseTimeFromConfig } from "./scheduleHelpers";
import { warningBox, warningLink } from "./warningStyles";

// BulkCreateModal owns every piece of bulk-add state, which is why the page itself only tracks whether the modal is open.
const BulkCreateModal = ({
    isOpen,
    onClose,
    onCreated,
    homeCompanyId,
    masterCompanies,
    masterEmployees,
    masterWorkLocations,
    attendanceConfigs,
    dayOffWeekdaysByCompany,
    canManageAttendanceSettings,
}) => {
        const [bulkCompanyId, setBulkCompanyId] = useState(homeCompanyId);
        const [bulkEmployeeId, setBulkEmployeeId] = useState("");
        const [bulkWorkLocationId, setBulkWorkLocationId] = useState("");
        const [bulkStartDate, setBulkStartDate] = useState("");
        const [bulkEndDate, setBulkEndDate] = useState("");
        const [bulkWeekdays, setBulkWeekdays] = useState([1, 2, 3, 4, 5]);
        const [bulkCheckInTime, setBulkCheckInTime] = useState("09:00");
        const [bulkCheckOutTime, setBulkCheckOutTime] = useState("18:00");
        const [bulkSubmitting, setBulkSubmitting] = useState(false);
        const [bulkResult, setBulkResult] = useState(null);
        const [bulkError, setBulkError] = useState("");

        const bulkFilteredEmployees = bulkCompanyId
            ? masterEmployees.filter((emp) => String(emp.companies_id) === String(bulkCompanyId))
            : [];
        const bulkFilteredWorkLocations = bulkCompanyId
            ? masterWorkLocations.filter((loc) => !loc.companies_id || String(loc.companies_id) === String(bulkCompanyId))
            : [];
        const bulkCompanyConfig = bulkCompanyId ? attendanceConfigs[bulkCompanyId] : null;
        const bulkShowNoConfigWarning = !!bulkCompanyId && !(bulkCompanyConfig && bulkCompanyConfig.is_configured);
        const bulkShowNoDayOffsWarning = !!bulkCompanyId && (dayOffWeekdaysByCompany[bulkCompanyId] || []).length === 0;
        const bulkShowNoEmployeesWarning = !!bulkCompanyId && bulkFilteredEmployees.length === 0;

        const toggleBulkWeekday = (value) => {
            setBulkWeekdays((prev) =>
                prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value].sort()
            );
        };

        // Default weekdays/times to a company's actual day-offs/attendance config
        const applyBulkDefaultsForCompany = (companyId) => {
            const dayOffWeekdays = dayOffWeekdaysByCompany[companyId] || [];
            setBulkWeekdays([0, 1, 2, 3, 4, 5, 6].filter((d) => !dayOffWeekdays.includes(d)));

            const cfg = attendanceConfigs[companyId];
            if (cfg && cfg.is_configured) {
                setBulkCheckInTime(formatHHMM(parseTimeFromConfig(cfg.work_start_time, 9, 0)));
                setBulkCheckOutTime(formatHHMM(parseTimeFromConfig(cfg.work_end_time, 18, 0)));
            }
        };

        const handleBulkCompanyChange = (e) => {
            const companyId = e.target.value;
            setBulkCompanyId(companyId);
            setBulkEmployeeId("");
            setBulkWorkLocationId("");
            applyBulkDefaultsForCompany(companyId);
        };

        // Master data (attendance config / day-offs) loads asynchronously after mount, so re-apply defaults once for the pre-selected home company.
        const bulkDefaultsAppliedRef = useRef(false);
        useEffect(() => {
            if (bulkDefaultsAppliedRef.current) return;
            if (!homeCompanyId) return;
            if (Object.keys(attendanceConfigs).length === 0 && Object.keys(dayOffWeekdaysByCompany).length === 0) return;
            bulkDefaultsAppliedRef.current = true;
            applyBulkDefaultsForCompany(homeCompanyId);
        }, [attendanceConfigs, dayOffWeekdaysByCompany]); // eslint-disable-line react-hooks/exhaustive-deps

        const closeBulkModal = () => {
            onClose();
            setBulkCompanyId(homeCompanyId);
            setBulkEmployeeId("");
            setBulkWorkLocationId("");
            setBulkStartDate("");
            setBulkEndDate("");
            setBulkWeekdays([1, 2, 3, 4, 5]);
            setBulkCheckInTime("09:00");
            setBulkCheckOutTime("18:00");
            setBulkResult(null);
            setBulkError("");
        };

        const handleBulkSubmit = async () => {
            setBulkError("");
            setBulkResult(null);

            if (!bulkCompanyId) return setBulkError("Please select a company");
            if (bulkShowNoEmployeesWarning) return setBulkError("This company has no employees. Please add one before saving.");
            if (!bulkEmployeeId) return setBulkError("Please select an employee");
            if (!bulkWorkLocationId) return setBulkError("Please select a work location");
            if (!bulkStartDate || !bulkEndDate) return setBulkError("Please select a date range");
            if (bulkEndDate < bulkStartDate) return setBulkError("End date cannot be before start date");
            if (bulkWeekdays.length === 0) return setBulkError("Select at least one weekday");
            if (!bulkCheckInTime || !bulkCheckOutTime) return setBulkError("Please set check-in and check-out time");
            if (!(bulkCompanyConfig && bulkCompanyConfig.is_configured)) {
                return setBulkError("This company has no Attendance Config. Please set it up before saving.");
            }
            if (bulkShowNoDayOffsWarning) {
                return setBulkError("This company has no day-offs configured. Please set it up before saving.");
            }

            setBulkSubmitting(true);
            try {
                const res = await api.post("/timelogs/bulk", {
                    employees_id: parseInt(bulkEmployeeId),
                    companies_id: parseInt(bulkCompanyId),
                    work_location_id: parseInt(bulkWorkLocationId),
                    start_date: bulkStartDate,
                    end_date: bulkEndDate,
                    weekdays: bulkWeekdays,
                    check_in_time: bulkCheckInTime,
                    check_out_time: bulkCheckOutTime,
                });
                setBulkResult(res.data);
                onCreated();
            } catch (err) {
                setBulkError(err.response?.data?.error || "Bulk add failed");
            } finally {
                setBulkSubmitting(false);
            }
        };

    return (
                <Modal
                    isOpen={isOpen}
                    onClose={closeBulkModal}
                    title="Bulk Add Time Log"
                    footer={
                        <>
                            <Button variant="ghost" onClick={closeBulkModal}>
                                {bulkResult ? "Close" : "Cancel"}
                            </Button>
                            {!bulkResult && (
                                <Button
                                    onClick={handleBulkSubmit}
                                    disabled={bulkSubmitting || bulkShowNoConfigWarning || bulkShowNoDayOffsWarning || bulkShowNoEmployeesWarning}
                                >
                                    {bulkSubmitting ? "Creating..." : "Create Logs"}
                                </Button>
                            )}
                        </>
                    }
                >
                    {bulkResult ? (
                        <div>
                            <div style={{ ...warningBox, background: "var(--status-success-soft)", border: "1px solid var(--status-success-line)", color: "var(--status-success-text)" }}>
                                Created <strong>{bulkResult.created_count}</strong> time log(s).
                                {bulkResult.skipped_count > 0 && (
                                    <span> Skipped {bulkResult.skipped_count} date(s) that already had a log.</span>
                                )}
                            </div>
                            {bulkResult.skipped_dates?.length > 0 && (
                                <ul className="m-[8px_0_0_16px] p-[0px] text-[12px] text-muted">
                                    {bulkResult.skipped_dates.map((d) => <li key={d}>{d}</li>)}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <>
                            <SelectField
                                label="Company"
                                options={masterCompanies}
                                value={bulkCompanyId}
                                onChange={handleBulkCompanyChange}
                                required
                            />

                            {bulkShowNoConfigWarning && (
                                <div style={warningBox}>
                                    This company has no Attendance Config yet, so time logs cannot be saved.
                                    {canManageAttendanceSettings && (
                                        <>
                                            {" "}
                                            <Link to="/attendance-settings" target="_blank" rel="noopener noreferrer" style={warningLink}>
                                                Set it up
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}

                            <SelectField
                                label="Employee"
                                options={bulkFilteredEmployees}
                                value={bulkEmployeeId}
                                onChange={(e) => setBulkEmployeeId(e.target.value)}
                                disabled={!bulkCompanyId}
                                required
                            />
                            {bulkShowNoEmployeesWarning && (
                                <MasterDataWarning
                                    message="This company has no employees yet."
                                    routePath="/employees"
                                    moduleKey="EmployeesListPage"
                                />
                            )}

                            <SelectField
                                label="Work Location"
                                options={bulkFilteredWorkLocations}
                                value={bulkWorkLocationId}
                                onChange={(e) => setBulkWorkLocationId(e.target.value)}
                                disabled={!bulkCompanyId}
                                required
                            />
                            {!!bulkCompanyId && bulkFilteredWorkLocations.length === 0 && (
                                <MasterDataWarning
                                    message="This company has no work locations yet."
                                    routePath="/work-locations"
                                    moduleKey="WorkLocationPage"
                                />
                            )}
                            <div className="flex gap-[12px]">
                                <div className="flex-1">
                                    <DateField
                                        label="From"
                                        value={bulkStartDate}
                                        onChange={setBulkStartDate}
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <DateField
                                        label="To"
                                        value={bulkEndDate}
                                        onChange={setBulkEndDate}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-[20px]">
                                <label className="block text-[13px] font-medium text-muted mb-[6px]">
                                    Apply to weekdays<span className="text-danger"> *</span>
                                </label>
                                <div className="flex gap-[6px] flex-wrap">
                                    {WEEKDAY_OPTIONS.map((wd) => {
                                        const active = bulkWeekdays.includes(wd.value);
                                        return (
                                            <button
                                                key={wd.value}
                                                type="button"
                                                onClick={() => toggleBulkWeekday(wd.value)}
                                                style={{
                                                    padding: "6px 12px",
                                                    borderRadius: "8px",
                                                    border: `1px solid ${active ? "var(--control-accent)" : "var(--border-muted)"}`,
                                                    background: active ? "var(--control-accent)" : "var(--surface-subtle)",
                                                    color: active ? "#fff" : "var(--text-secondary)",
                                                    fontSize: "13px",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                {wd.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-[12px]">
                                <div className="flex-1">
                                    <TimeField
                                        label="Check-in time"
                                        value={bulkCheckInTime}
                                        onChange={setBulkCheckInTime}
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <TimeField
                                        label="Check-out time"
                                        value={bulkCheckOutTime}
                                        onChange={setBulkCheckOutTime}
                                        required
                                    />
                                </div>
                            </div>

                            {bulkShowNoDayOffsWarning && (
                                <MasterDataWarning
                                    message="This company has no day-offs configured yet."
                                    routePath="/day-offs"
                                    moduleKey="DayOffPage"
                                />
                            )}

                            {bulkError && (
                                <div style={{ ...warningBox, background: "var(--status-danger-soft)", border: "1px solid var(--status-danger-line)", color: "var(--status-danger-text)" }}>
                                    {bulkError}
                                </div>
                            )}
                        </>
                    )}
                </Modal>
    );
};

export default BulkCreateModal;
