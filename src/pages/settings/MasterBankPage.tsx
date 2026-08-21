import { useState } from "react";

import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import useBanks from "./banks/useBanks";
import BankFormModal from "./banks/BankFormModal";

const MasterBankPage = () => {
    const { banks, loading, fetchData, remove } = useBanks();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setIsModalOpen(true);
    };

    const smallBtn = "px-3 py-1 text-xs w-auto";

    const columns = [
        { label: "Code", key: "bank_code" },
        { label: "Bank Name", key: "bank_name" },
        { label: "SWIFT Code", key: "swift_code" },
        {
            label: "Actions",
            render: (row) => (
                <div className="flex gap-[8px]">
                    <Button variant="ghost" onClick={() => openEdit(row)} className={smallBtn}>Edit</Button>
                    <Button variant="danger" onClick={() => remove(row.id)} className={smallBtn}>Delete</Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Bank Master"
                actionButton={
                    <Button onClick={openAdd}>
                        + Add Bank
                    </Button>
                }
            />
            <Card className="p-0">
                {loading ? <div className="p-[40px] text-center">Loading...</div> : <Table columns={columns} data={banks} />}
            </Card>

            <BankFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchData}
                editing={editing}
            />
        </>
    );
};

export default MasterBankPage;
