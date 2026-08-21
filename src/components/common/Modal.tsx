import { useEffect } from "react";
import type { ReactNode } from "react";
import ReactDOM from "react-dom";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
}

const Modal = ({ isOpen, onClose, title, children, footer }: ModalProps) => {
    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-[4px]">
            <div
                className="flex max-h-[90vh] w-[90%] max-w-[500px] animate-[modalSlideUp_0.3s_ease-out] flex-col rounded-2xl bg-card shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)]"
            >
                <div className="flex items-center justify-between border-b border-hover px-6 py-5">
                    <h3 className="text-lg font-bold text-main">{title}</h3>
                    <button className="cursor-pointer border-none bg-none text-xl text-subtle" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className="overflow-y-auto p-6">{children}</div>
                {footer && (
                    <div className="flex justify-end gap-3 border-t border-hover px-6 py-4">{footer}</div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
