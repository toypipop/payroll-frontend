import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import useCompanies from "./companies/useCompanies";
import CompanyFormModal from "./companies/CompanyFormModal";
import type { TableColumn } from "../../types/api";
import type { Company } from "../../types/domain";

const CompaniesPage = () => {
    const { companies, loading, fetchCompanies, remove } = useCompanies();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Company | null>(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (row: Company) => {
        setEditing(row);
        setIsModalOpen(true);
    };

    const columns: TableColumn<Company>[] = [
        { label: "Companies Name", key: "name" },
        { label: "Tax ID", key: "tax_id" },
        { label: "Phone", key: "phone" },
        {
            label: "Actions",
            render: (row) => (
                <div className="flex gap-[8px]">
                    <Button variant="ghost" onClick={() => openEdit(row)} className={smallBtn}>
                        Edit
                    </Button>
                    <Button variant="danger" onClick={() => remove(row.id)} className={smallBtn}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Companies Directory"
                actionButton={
                    <Button onClick={openAdd}>
                        + Add Companies
                    </Button>
                }
            />
            <Card className="p-0">
                {loading ? (
                    <div className="p-[40px] text-center">
                        Loading...
                    </div>
                ) : (
                    <Table columns={columns} data={companies} />
                )}
            </Card>

            <CompanyFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchCompanies}
                editing={editing}
            />
        </>
    );
};

const smallBtn = "px-3 py-1.5 text-xs";

export default CompaniesPage;
