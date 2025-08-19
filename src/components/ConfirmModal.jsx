import './ConfirmModal.css';

export default function ConfirmModal({ message, onConfirm, onCancel }) {
    return (
        <div className="modal-overlay animate__animated animate__zoomIn" onClick={onCancel}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <p>{message}</p>
                <div className="modal-actions">
                    <button onClick={onCancel}>❌ Hủy</button>
                    <button onClick={onConfirm}>✅ Đồng ý</button>
                </div>
            </div>
        </div>
    );
}
