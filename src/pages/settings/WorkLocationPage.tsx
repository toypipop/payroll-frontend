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

    const smallBtn = { padding: "4px 12px", fontSize: "12px", width: "auto" };

    const columns = [
        { label: "Location Name", key: "name" },
        { label: "Company", render: (row) => row.companies?.name || "—" },
        {
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => openEdit(row)} style={smallBtn}>Edit</Button>
                    <Button variant="danger" onClick={() => remove(row.id)} style={smallBtn}>Delete</Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Work Locations"
                actionButton={
                    <Button onClick={openAdd} style={{ width: "auto" }}>
                        + Add Location
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div> : <Table columns={columns} data={items} />}
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
