import { useState } from "react";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";

interface DeleteReasonModalProps {
    // The record being deleted, or null when the modal is closed.
    open: boolean;
    onCancel: () => void;
    onConfirm: (reason: string) => void;
}

// Deleting a salary record is the one salary change with no form behind it, and the one hardest to explain
// after the fact. It used to be a window.confirm, which cannot collect a reason, so it is a small form now.
const DeleteReasonModal = ({ open, onCancel, onConfirm }: DeleteReasonModalProps) => {
    // The page remounts this modal per record, so the fields start empty without an effect to clear them.
    const [reason, setReason] = useState("");
    const [touched, setTouched] = useState(false);

    const trimmed = reason.trim();
    const error = touched && !trimmed ? "Say why this record is being deleted" : undefined;

    const confirm = () => {
        setTouched(true);
        if (!trimmed) return;
        onConfirm(trimmed);
    };

    return (
        <Modal
            isOpen={open}
            onClose={onCancel}
            title="Delete salary record"
            footer={
                <>
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button onClick={confirm} className="bg-danger text-card hover:bg-danger">Delete</Button>
                </>
            }
        >
            <div className="mb-3 text-[13px] leading-normal text-muted">
                This removes the record from the timeline permanently and cannot be undone. What it paid, and
                the reason below, stay in the change log.
            </div>
            <InputField
                name="delete_reason"
                label="Reason for deleting"
                placeholder="e.g. entered twice, wrong employee"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onBlur={() => setTouched(true)}
                error={error}
                required
            />
        </Modal>
    );
};

export default DeleteReasonModal;
