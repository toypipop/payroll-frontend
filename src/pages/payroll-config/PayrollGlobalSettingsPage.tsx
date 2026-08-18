import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import usePayrollConfigs from "./global-settings/usePayrollConfigs";
import PayrollConfigModal from "./global-settings/PayrollConfigModal";

const PayrollGlobalSettingsPage = () => {
    const { configs, loading, fetchConfigs } = usePayrollConfigs();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompanie, setSelectedCompanie] = useState(null);

    const openEdit = (companie) => {
        setSelectedCompanie(companie);
        setIsModalOpen(true);
    };

    const columns = [
        { label: "Companies", key: "name" },
        {
            label: "SSO Rate",
            render: (row) => row.payroll_config ? `${row.payroll_config.sso_rate}%` : <span style={{ color: 'var(--text-subtle)' }}>Not Set</span>
        },
        {
            label: "Tax Method",
            render: (row) => {
                const labels = { Progressive: "Thai Progressive Rate", None: "No Tax" };
                const val = row.payroll_config?.tax_calculation;
                return val ? (labels[val] || val) : <span style={{ color: 'var(--text-subtle)' }}>Not Set</span>;
            }
        },
        {
            label: "Actions",
            render: (row) => (
                <Button variant="ghost" onClick={() => openEdit(row)} style={{ fontSize: "12px" }}>
                    {row.payroll_config ? "Update Setup" : "Initial Setup"}
                </Button>
            ),
        },
    ];

    return (
        <>
            <PageHeader title="Global Payroll Settings" />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
                ) : (
                    <Table columns={columns} data={configs} />
                )}
            </Card>

            <PayrollConfigModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchConfigs}
                company={selectedCompanie}
            />
        </>
    );
};

export default PayrollGlobalSettingsPage;
