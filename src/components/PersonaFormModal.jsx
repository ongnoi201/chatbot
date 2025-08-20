import { useState, useEffect } from "react";
import "../app.css";
import CropperModal from "./CropperModal";

export default function PersonaFormModal({
    initialData,
    onClose,
    onSubmit,
    mode = "create"
}) {
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState(null);
    const [tempFile, setTempFile] = useState(null);
    const [closing, setClosing] = useState(false);

    const [form, setForm] = useState({
        avatarUrl: "",
        name: "",
        description: "",
        tone: "",
        style: "",
        language: "Tiếng Việt",
        avatar: null,
    });

    useEffect(() => {
        if (initialData) {
            setForm((prev) => ({
                ...prev,
                ...initialData,
            }));
        }
    }, [initialData]);

    function handleChange(e) {
        const { name, value, files } = e.target;
        if (name === "avatar" && files[0]) {
            const file = files[0];
            const url = URL.createObjectURL(file);
            setTempImage(url);
            setTempFile(file);
            setShowCropper(true);
        } else {
            setForm({ ...form, [name]: value });
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        onSubmit(form);
    }

    function handleClose() {
        setClosing(true);
        setTimeout(() => {
            onClose();
            setClosing(false);
        }, 400); // khớp với animation-duration
    }

    return (
        <div
            className={`modal-overlay animate__animated ${closing ? "animate__fadeOut" : "animate__fadeIn"}`}
            onClick={handleClose}
        >
            <div
                className={`modal animate__animated ${closing ? "animate__zoomOut" : "animate__zoomIn"}`}
                onClick={(e) => e.stopPropagation()}
            >
                <h3>{mode === "create" ? "Thêm Nhân Vật" : "Cài đặt Nhân Vật"}</h3>
                <form onSubmit={handleSubmit} className="modal-form">
                    <input
                        type="file"
                        name="avatar"
                        accept="image/*"
                        onChange={handleChange}
                    />
                    {form.avatarUrl && (
                        <img src={form.avatarUrl} alt="preview" className="avatar-preview" />
                    )}

                    <input
                        name="name"
                        placeholder="Tên"
                        value={form.name}
                        onChange={handleChange}
                    />

                    <textarea
                        name="description"
                        placeholder="Mô tả"
                        value={form.description}
                        onChange={handleChange}
                    />

                    <input
                        name="tone"
                        placeholder="Tone (vd: vui vẻ, nghiêm túc)"
                        value={form.tone}
                        onChange={handleChange}
                    />

                    <input
                        name="style"
                        placeholder="Style (vd: ngắn gọn, chi tiết)"
                        value={form.style}
                        onChange={handleChange}
                    />

                    <select
                        name="language"
                        value={form.language}
                        onChange={handleChange}
                    >
                        <option>Tiếng Việt</option>
                        <option>English</option>
                    </select>

                    <div className="modal-actions">
                        <button type="button" onClick={handleClose}>
                            Hủy
                        </button>
                        <button type="submit">
                            {mode === "create" ? "Tạo" : "Lưu"}
                        </button>
                    </div>
                </form>
            </div>

            {showCropper && (
                <CropperModal
                    image={tempImage}
                    originalFileName={tempFile?.name}
                    onClose={() => setShowCropper(false)}
                    onSave={(cropped) => {
                        setForm({
                            ...form,
                            avatar: cropped.file,
                            avatarUrl: cropped.url,
                        });
                        setShowCropper(false);
                    }}
                />
            )}
        </div>
    );
}
