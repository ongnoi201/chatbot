import { useState, useEffect } from "react";
import "../app.css";
import CropperModal from "./CropperModal";

export default function PersonaFormModal({
    initialData,
    onClose,
    onSubmit,
    onClearHistory, // callback mới
    mode = "create"
}) {
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState(null);
    const [tempFile, setTempFile] = useState(null);
    const [closing, setClosing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

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
        setIsEditing(false);
    }

    function handleClose() {
        setClosing(true);
        setTimeout(() => {
            onClose();
            setClosing(false);
        }, 400);
    }

    return (
        <div className={`modal-overlay animate__animated ${closing ? "animate__fadeOut" : "animate__fadeIn"}`}>
            <div className={`modal animate__animated ${closing ? "animate__zoomOut" : "animate__zoomIn"}`}>
                <h3>{mode === "create" ? "Thêm Nhân Vật" : "Cài đặt Nhân Vật"}</h3>

                <form onSubmit={handleSubmit} className="modal-form">
                    {/* Avatar */}
                    {(mode === "create" || isEditing) ? (
                        <>
                            <input
                                type="file"
                                name="avatar"
                                accept="image/*"
                                onChange={handleChange}
                            />
                            {form.avatarUrl && (
                                <img src={form.avatarUrl} alt="preview" className="avatar-preview" />
                            )}
                        </>
                    ) : (
                        form.avatarUrl && (
                            <img src={form.avatarUrl} alt="avatar" className="avatar-preview" />
                        )
                    )}

                    {/* Name */}
                    {(mode === "create" || isEditing) ? (
                        <input
                            name="name"
                            placeholder="Tên"
                            value={form.name}
                            onChange={handleChange}
                        />
                    ) : (
                        <p><b>Tên:</b> {form.name}</p>
                    )}

                    {/* Description */}
                    {(mode === "create" || isEditing) ? (
                        <textarea
                            name="description"
                            placeholder="Mô tả"
                            value={form.description}
                            onChange={handleChange}
                        />
                    ) : (
                        <p><b>Mô tả:</b> {form.description}</p>
                    )}

                    {/* Tone */}
                    {(mode === "create" || isEditing) ? (
                        <input
                            name="tone"
                            placeholder="Tone (vd: vui vẻ, nghiêm túc)"
                            value={form.tone}
                            onChange={handleChange}
                        />
                    ) : (
                        <p><b>Tone:</b> {form.tone}</p>
                    )}

                    {/* Style */}
                    {(mode === "create" || isEditing) ? (
                        <input
                            name="style"
                            placeholder="Style (vd: ngắn gọn, chi tiết)"
                            value={form.style}
                            onChange={handleChange}
                        />
                    ) : (
                        <p><b>Style:</b> {form.style}</p>
                    )}

                    {/* Language */}
                    {(mode === "create" || isEditing) ? (
                        <select
                            name="language"
                            value={form.language}
                            onChange={handleChange}
                        >
                            <option>Tiếng Việt</option>
                            <option>English</option>
                        </select>
                    ) : (
                        <p><b>Ngôn ngữ:</b> {form.language}</p>
                    )}

                    {/* Submit only */}
                    {(mode === "create" || isEditing) && (
                        <button type="submit">
                            {mode === "create" ? "Tạo" : "Lưu"}
                        </button>
                    )}
                </form>

                {/* Actions ngoài form */}
                <div className="modal-actions">
                    <button type="button" onClick={handleClose}>
                        <i className="bi bi-x-square"></i> Đóng
                    </button>

                    {!isEditing && mode !== "create" && (
                        <button type="button" onClick={() => setIsEditing(true)}>
                            <i className="bi bi-pencil-square"></i> Sửa
                        </button>
                    )}

                    {mode !== "create" && (
                        <button
                            type="button"
                            className="delete-history-btn"
                            onClick={()=>onClearHistory(initialData._id)}
                        >
                            <i className="bi bi-clock-history"></i> Xóa lịch sử
                        </button>
                    )}
                </div>
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
