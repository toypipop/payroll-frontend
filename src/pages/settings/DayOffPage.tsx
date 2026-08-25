import { useState } from "react";

import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import { useAuth } from "../../hooks/useAuth";
import useDayOffs, { weekdayName } from "./day-offs/useDayOffs";
import DayOffFormModal from "./day-offs/DayOffFormModal";
import type { TableColumn } from "../../types/api";
import type { DayOff } from "../../types/domain";

const DayOffPage = () => {
    const { homeCompanyId } = useAuth();
    const { items, companyOptions, loading, fetchData, remove } = useDayOffs();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<DayOff | null>(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (row: DayOff) => {
        setEditing(row);
        setIsModalOpen(true);
    };

    const smallBtn = "px-3 py-1 text-xs w-auto";

    const columns: TableColumn<DayOff>[] = [
        {
            label: "Weekday",
            sortKey: "weekday",
            sortValue: (row) => Number(row.weekday) || 0,
            render: (row) => weekdayName(row.weekday),
        },
        { label: "Day Off Name", key: "name" },
        { label: "Company", render: (row) => row.companies?.name || "-" },
        { label: "Paid", render: (row) => row.is_paid ? "Yes" : "No" },
        {
            label: "Actions",
            sortable: false,
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
                title="Day Off"
                actionButton={
                    <Button onClick={openAdd}>
                        + Add Day Off
                    </Button>
                }
            />
            <Card className="p-0">
                {loading ? <div className="p-[40px] text-center">Loading...</div> : <Table columns={columns} data={items} />}
            </Card>

            <DayOffFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchData}
                editing={editing}
                homeCompanyId={homeCompanyId}
                companyOptions={companyOptions}
            />
        </>
    );
};

export default DayOffPage;
