import { useState } from "react";

import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import { useAuth } from "../../hooks/useAuth";
import useWorkLocations from "./work-locations/useWorkLocations";
import WorkLocationFormModal from "./work-locations/WorkLocationFormModal";

const WorkLocationPage = () => {
    const { homeCompanyId } = useAuth();
    const { items, companyOptions, loading, fetchData, remove } = useWorkLocations();
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
        { label: "Location Name", key: "name" },
        { label: "Company", render: (row) => row.companies?.name || "—" },
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
                title="Work Locations"
                actionButton={
                    <Button onClick={openAdd}>
                        + Add Location
                    </Button>
                }
            />
            <Card className="p-0">
                {loading ? <div className="p-[40px] text-center">Loading...</div> : <Table columns={columns} data={items} />}
            </Card>

            <WorkLocationFormModal
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

export default WorkLocationPage;
