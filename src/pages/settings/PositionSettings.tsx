import { useState } from "react";

import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import { useAuth } from "../../hooks/useAuth";
import usePositions from "./positions/usePositions";
import PositionFormModal from "./positions/PositionFormModal";
import type { TableColumn } from "../../types/api";
import type { Position } from "../../types/domain";

const PositionSettings = () => {
    const { homeCompanyId } = useAuth();
    const { positions, companies, table, fetchData, remove } = usePositions();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Position | null>(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (row: Position) => {
        setEditing(row);
        setIsModalOpen(true);
    };

    const columns: TableColumn<Position>[] = [
        {
            label: "Position Name",
            key: "pos_name"
        },
        {
            label: "Companies",
            render: (row) => row.companies?.name || "N/A"
        },
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
                title="Position Management"
                actionButton={
                    <Button onClick={openAdd}>
                        + Add Position
                    </Button>
                }
            />
            <Card className="p-0">
                <Table columns={columns} data={positions} server={table} />
            </Card>

            <PositionFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchData}
                editing={editing}
                homeCompanyId={homeCompanyId}
                companies={companies}
            />
        </>
    );
};

const smallBtn = "px-3 py-1.5 text-xs";

export default PositionSettings;
