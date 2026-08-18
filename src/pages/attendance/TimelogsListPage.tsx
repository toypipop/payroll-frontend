import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import useTimelogs from "./timelogs/useTimelogs";
import TimeLogFormModal from "./timelogs/TimeLogFormModal";
import BulkCreateModal from "./timelogs/BulkCreateModal";

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
            searchValue: (row) => row.check_in ? new Date(row.check_in).toISOString().split("T")[0] : "",
            render: (row) => row.check_in ? new Date(row.check_in).toISOString().split("T")[0] : "-",
        },
        {
            label: "Time In",
            sortKey: "check_in_time",
            sortValue: (row) => {
                if (!row.check_in) return -1;
                const date = new Date(row.check_in);
                return date.getHours() * 60 + date.getMinutes();
            },
            searchValue: (row) => row.check_in ? new Date(row.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
            render: (row) => row.check_in ? new Date(row.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
        },
        {
            label: "Time Out",
            sortKey: "check_out_time",
            sortValue: (row) => {
                if (!row.check_out) return -1;
                const date = new Date(row.check_out);
                return date.getHours() * 60 + date.getMinutes();
            },
            searchValue: (row) => row.check_out ? new Date(row.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
            render: (row) => row.check_out ? new Date(row.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
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
