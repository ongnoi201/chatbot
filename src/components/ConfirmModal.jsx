import { useState } from "react";
import './ConfirmModal.css';

export default function ConfirmModal({ message, onConfirm, onCancel }) {
    const [closing, setClosing] = useState(false);

    const handleClose = () => {
        setClosing(true);
        setTimeout(() => {
            onCancel();
            setClosing(false);
        }, 500);
    };

    return (
        <div
            className={`modal-overlay animate__animated ${closing ? "animate__fadeOut" : "animate__fadeIn"}`}
            onClick={handleClose}
        >
            <div
                className={`modal animate__animated ${closing ? "animate__zoomOut" : "animate__zoomIn"}`}
                onClick={(e) => e.stopPropagation()}
            >
                <p>{message}</p>
                <div className="modal-actions">
                    <button onClick={handleClose}>❌ Hủy</button>
                    <button onClick={onConfirm}>✅ Đồng ý</button>
                </div>
            </div>
        </div>
    );
}
