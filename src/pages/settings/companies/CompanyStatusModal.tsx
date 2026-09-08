import { useState } from "react";
import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import type { Company } from "../../../types/domain";
import { apiErrorMessage } from "../../../utils/apiError";

interface Props {
    company: Company;
    onClose: () => void;
    onSaved: () => Promise<void>;
}

export default function CompanyStatusModal({ company, onClose, onSaved }: Props) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const statusKnown = typeof company.is_active === "boolean";
    const activate = company.is_active === false;
    const action = !statusKnown ? "Status unavailable" : activate ? "Reactivate" : "Deactivate";
    const close = () => { if (!pending) onClose(); };
    const save = async () => {
        if (pending || company.id == null || !statusKnown) return;
        setPending(true);
        setError("");
        try {
            await api.patch<Company>(`/companies/${company.id}/status`, { is_active: activate });
            await onSaved();
            onClose();
        } catch (err) {
            setError(apiErrorMessage(err, `Unable to ${action.toLowerCase()} company.`));
        } finally {
            setPending(false);
        }
    };
    return (
        <Modal isOpen onClose={close} title={`${action} company`} footer={
            <>
                <Button variant="ghost" onClick={close} disabled={pending}>Cancel</Button>
                <Button variant={activate ? "primary" : "danger"} onClick={save} disabled={pending || company.id == null || !statusKnown}>
                    {pending ? "Saving..." : action}
                </Button>
            </>
        }>
            <p className="text-main">{statusKnown ? `${action} ${company.name}?` : "Company status is unavailable."}</p>
            {statusKnown && <p className="mt-3 text-sm text-muted">
                {activate
                    ? "The company will be available again in company selectors and its records can be accessed and managed."
                    : "The company will be hidden from company selectors. Its records cannot be viewed, created, edited, or deleted in other modules. Existing data is retained. You can reactivate it here."}
            </p>}
            {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
        </Modal>
    );
}
