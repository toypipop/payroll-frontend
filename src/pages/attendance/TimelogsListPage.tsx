import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import useTimelogs from "./timelogs/useTimelogs";
import TimeLogFormModal from "./timelogs/TimeLogFormModal";
import BulkCreateModal from "./timelogs/BulkCreateModal";
import { bangkokDateKey, bangkokMinutes, formatDisplayTime } from "../../utils/bangkokTime";

const TimelogsListPage = () => {
    const { homeCompanyId } = useAuth();
    const {
        timeLogs, loading, fetchTimeLogs, remove,
        masterCompanies, masterEmployees, masterWorkLocations, employeeData,
        attendanceConfigs, dayOffWeekdaysByCompany, canManageAttendanceSettings,
    } = useTimelogs();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (log) => {
        setEditing(log);
        setIsModalOpen(true);
    };

    const columns = [
        {
            label: "Employee",
            sortKey: "employee_name",
            sortValue: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.trim().toLowerCase(),
            searchValue: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.trim(),
            render: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.trim() || "-",
        },
        {
            label: "Date",
            sortKey: "check_in_date",
            sortValue: (row) => (row.check_in ? new Date(row.check_in).getTime() : 0),
            searchValue: (row) => bangkokDateKey(row.check_in),
            render: (row) => bangkokDateKey(row.check_in) || "-",
        },
        {
            label: "Time In",
            sortKey: "check_in_time",
            sortValue: (row) => bangkokMinutes(row.check_in),
            searchValue: (row) => formatDisplayTime(row.check_in),
            render: (row) => formatDisplayTime(row.check_in),
        },
        {
            label: "Time Out",
            sortKey: "check_out_time",
            sortValue: (row) => bangkokMinutes(row.check_out),
            searchValue: (row) => formatDisplayTime(row.check_out),
            render: (row) => formatDisplayTime(row.check_out),
        },
        {
            label: "Companies",
            sortKey: "employees.companies.name",
            render: (row) => row.employees?.companies?.name || "-",
        },
        {
            label: "Actions",
            sortable: false,
            render: (row) => (
                <div className="flex gap-[8px]">
                    <Button
                        variant="ghost"
                        onClick={() => openEdit(row)}
                        className={smallBtn}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => remove(row.id)}
                        className={smallBtn}
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
                title="Attendance Time Logs"
                actionButton={
                    <div className="flex gap-[8px]">
                        <Button
                            variant="ghost"
                            onClick={() => setIsBulkModalOpen(true)}
                            className="w-auto"
                        >
                            Bulk Add
                        </Button>
                        <Button
                            onClick={openAdd}
                        >
                            + Add Manual Log
                        </Button>
                    </div>
                }
            />
            <Card className="p-0">
                {loading ? (
                    <div className="p-[40px] text-center">
                        Loading...
                    </div>
                ) : (
                    <Table columns={columns} data={timeLogs} />
                )}
            </Card>

            <TimeLogFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchTimeLogs}
                editing={editing}
                homeCompanyId={homeCompanyId}
                masterCompanies={masterCompanies}
                masterEmployees={masterEmployees}
                masterWorkLocations={masterWorkLocations}
                employeeData={employeeData}
                attendanceConfigs={attendanceConfigs}
                dayOffWeekdaysByCompany={dayOffWeekdaysByCompany}
                canManageAttendanceSettings={canManageAttendanceSettings}
            />

            <BulkCreateModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onCreated={fetchTimeLogs}
                homeCompanyId={homeCompanyId}
                masterCompanies={masterCompanies}
                masterEmployees={masterEmployees}
                masterWorkLocations={masterWorkLocations}
                attendanceConfigs={attendanceConfigs}
                dayOffWeekdaysByCompany={dayOffWeekdaysByCompany}
                canManageAttendanceSettings={canManageAttendanceSettings}
            />
        </>
    );
};

const smallBtn = "px-3 py-1.5 text-xs";

export default TimelogsListPage;
