import React, { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";


import TimelogListPage from "./tabs/TimelogListPage";

const AttendancePage = () => {
    const [activeTab, setActiveTab] = useState("timeloglistpage");

    const tabs = [
        { id: "timeloglistpage", label: "Time Logs List" },
    ];

    return (
        <>
            <PageHeader title="System Attendance" />
            <div
                style={{
                    display: "flex",
                    gap: "20px",
                    marginBottom: "20px",
                    borderBottom: "1px solid #eee",
                }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: "10px 15px",
                            cursor: "pointer",
                            border: "none",
                            background: "none",
                            color: activeTab === tab.id ? "#3b82f6" : "#666",
                            borderBottom:
                                activeTab === tab.id
                                    ? "2px solid #3b82f6"
                                    : "2px solid transparent",
                            fontWeight: activeTab === tab.id ? "600" : "400",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <Card>
                {activeTab === "timeloglistpage" && <TimelogListPage />}
            </Card>
        </>
    );
};

export default AttendancePage;
