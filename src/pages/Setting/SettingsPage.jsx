import React, { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import CompanySettings from "./tabs/CompanySettings";
import DepartmentSettings from "./tabs/DepartmentSettings";
import PositionSettings from "./tabs/PositionSettings";

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState("company");

    const tabs = [
        { id: "company", label: "Company" },
        { id: "department", label: "Department" },
        { id: "position", label: "Position" },
    ];

    return (
        <>
            <PageHeader title="System Settings" />
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
                {activeTab === "company" && <CompanySettings />}
                {activeTab === "department" && <DepartmentSettings />}
                {activeTab === "position" && <PositionSettings />}
            </Card>
        </>
    );
};

export default SettingsPage;
