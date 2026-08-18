import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import useAttendanceConfigs from "./attendance-config/useAttendanceConfigs";
import AttendanceConfigModal from "./attendance-config/AttendanceConfigModal";
import { formatDisplayTime } from "./attendance-config/bangkokTime";

// flag renders one of the config's on/off switches, or "Not Set" when the company has no config yet.
const flag = (enabled) => {
    if (enabled === undefined) return <span style={{ color: "#94a3b8" }}>Not Set</span>;
    return enabled
        ? <span style={{ color: "#16a34a", fontWeight: 600 }}>ON</span>
        : <span style={{ color: "#ef4444", fontWeight: 600 }}>OFF</span>;
};

const AttendanceSettingsPage = () => {
    const { configs, loading, fetchConfigs } = useAttendanceConfigs();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompanie, setSelectedCompanie] = useState(null);

    const openEdit = (companie) => {
        setSelectedCompanie(companie);
        setIsModalOpen(true);
    };

    const columns = [
        { label: "Companies", key: "name" },
        {
            label: "Work Start",
            render: (row) => row.attendance_config
                ? formatDisplayTime(row.attendance_config.work_start_time)
                : <span style={{ color: "#94a3b8" }}>-</span>,
        },
        {
            label: "Work End",
            render: (row) => row.attendance_config
                ? formatDisplayTime(row.attendance_config.work_end_time)
                : <span style={{ color: "#94a3b8" }}>-</span>,
        },
        { label: "Late Amount", render: (row) => flag(row.attendance_config?.is_late_deduction_enabled) },
        { label: "Absent Amount", render: (row) => flag(row.attendance_config?.is_absent_deduction_enabled) },
        { label: "Overtime", render: (row) => flag(row.attendance_config?.is_overtime_earnings_enabled) },
        { label: "Extra", render: (row) => flag(row.attendance_config?.is_extra_earnings_enabled) },
        {
            label: "Actions",
            render: (row) => (
                <Button variant="ghost" onClick={() => openEdit(row)} style={{ fontSize: "12px" }}>
                    {row.attendance_config ? "Update" : "Setup"}
                </Button>
            ),
        },
    ];

    return (
        <>
            <PageHeader title="Attendance Settings" />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
                ) : (
                    <Table columns={columns} data={configs} />
                )}
            </Card>

            <AttendanceConfigModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchConfigs}
                company={selectedCompanie}
            />
        </>
    );
};

export default AttendanceSettingsPage;
