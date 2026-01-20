import React, { useState } from "react";
import MainLayout from "../../components/layouts/MainLayout";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import DepartmentSettings from "./tabs/DepartmentSettings";
import PositionSettings from "./tabs/PositionSettings";
import CompanySettings from "./tabs/CompanySettings";

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState("company");

    const tabs = [
        { id: "company", label: "Company Info" },
        { id: "department", label: "Departments" },
        { id: "position", label: "Positions" },
    ];

    return (
        <>
            <PageHeader title="System Settings" />

            {/* --- Tab Navigation --- */}
            <div
                style={{
                    display: "flex",
                    gap: "24px",
                    marginBottom: "20px",
                    borderBottom: "1px solid #e2e8f0",
                }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: "12px 4px",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: activeTab === tab.id ? "#3b82f6" : "#64748b",
                            border: "none",
                            background: "none",
                            borderBottom:
                                activeTab === tab.id
                                    ? "2px solid #3b82f6"
                                    : "2px solid transparent",
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* --- Tab Content --- */}
            <Card>
                {activeTab === "company" && <CompanySettings />}
                {activeTab === "department" && <DepartmentSettings />}
                {activeTab === "position" && <PositionSettings />}
            </Card>
        </>
    );
};

export default SettingsPage;
