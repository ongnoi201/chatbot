import { useState, useEffect } from "react";
import "./PersonaFormModal.css";
import CropperModal from "../CropperModal/CropperModal";

export default function PersonaFormModal({
    initialData,
    onClose,
    onSubmit,
    onClearHistory,
    mode = "create"
}) {
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState(null);
    const [tempFile, setTempFile] = useState(null);
    const [closing, setClosing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [form, setForm] = useState(() => {
        if (initialData?._id) {
            const stored = JSON.parse(localStorage.getItem("personaBackgrounds") || "{}");
            return {
                ...initialData,
                autoMessageTimes: initialData.autoMessageTimes || [],
                background: stored[initialData._id] ?? initialData.background ?? false,
            };
        }
        return {
            avatarUrl: "",
            name: "",
            description: "",
            tone: "",
            style: "",
            language: "Tiếng Việt",
            avatar: null,
            autoMessageTimes: [],
            background: false,
        };
    });

    // Load dữ liệu ban đầu
    useEffect(() => {
        if (initialData) {
            const stored = JSON.parse(localStorage.getItem("personaBackgrounds") || "{}");
            const bg = stored[initialData._id] !== undefined
                ? stored[initialData._id]
                : (initialData.background ?? false);

            setForm((prev) => ({
                ...prev,
                ...initialData,
                autoMessageTimes: initialData.autoMessageTimes || [],
                background: bg,
            }));
        }
    }, [initialData]);

    useEffect(() => {
        if (initialData?._id) {
            const stored = JSON.parse(localStorage.getItem("personaBackgrounds") || "{}");
            stored[initialData._id] = form.background;
            localStorage.setItem("personaBackgrounds", JSON.stringify(stored));
        }
    }, [form.background, initialData]);

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

    // toggle background
    function handleBackgroundToggle() {
        setForm({ ...form, background: !form.background });
    }

    // thêm giờ
    function addTime() {
        setForm({ ...form, autoMessageTimes: [...form.autoMessageTimes, ""] });
    }

    function handleTimeChange(index, value) {
        const updated = [...form.autoMessageTimes];
        updated[index] = value;
        setForm({ ...form, autoMessageTimes: updated });
    }

    function removeTime(index) {
        const updated = form.autoMessageTimes.filter((_, i) => i !== index);
        setForm({ ...form, autoMessageTimes: updated });
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
                                <>
                                    <img src={form.avatarUrl} alt="preview" className="avatar-preview" />
                                    {/* ✅ checkbox background */}
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={form.background}
                                            onChange={handleBackgroundToggle}
                                        />  Đặt ảnh làm nền
                                    </label>
                                </>
                            )}
                        </>
                    ) : (
                        form.avatarUrl && (
                            <>
                                <img src={form.avatarUrl} alt="avatar" className="avatar-preview" />
                                {form.background && <p>Đã đặt ảnh nền</p>}
                            </>
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

                    {/* Auto Message Times */}
                    <div className="time-section">
                        <label><b>Thời gian tự động gửi:</b></label>
                        {(mode === "create" || isEditing) ? (
                            <div>
                                {form.autoMessageTimes.map((time, index) => (
                                    <div key={index} className="time-item">
                                        <input
                                            type="time"
                                            lang="vi"
                                            value={time}
                                            onChange={(e) => handleTimeChange(index, e.target.value)}
                                        />
                                        <button type="button" className="remove-btn" onClick={() => removeTime(index)}>✖</button>
                                    </div>
                                ))}
                                <button type="button" className="add-time-btn" onClick={addTime}>Thêm giờ</button>
                            </div>
                        ) : (
                            <p>{form.autoMessageTimes.length > 0 ? form.autoMessageTimes.join(", ") : "Chưa đặt"}</p>
                        )}
                    </div>

                    {/* Submit only */}
                    {(mode === "create" || isEditing) && (
                        <button type="submit">
                            {mode === "create" ? "Tạo" : "Lưu"}
                        </button>
                    )}
                </form>

                {/* Actions ngoài form */}
                <div className="modal-actions actions-btn">
                    <button style={{ border: '1px solid #050e99ff', backgroundColor: 'transparent', color: '#050e99ff' }} type="button" onClick={handleClose}>
                        <i className="bi bi-x-square"></i> Đóng
                    </button>

                    {!isEditing && mode !== "create" && (
                        <button style={{ border: '1px solid #c07f07ff', backgroundColor: 'transparent', color: '#c07f07ff' }} type="button" onClick={() => setIsEditing(true)}>
                            <i className="bi bi-pencil-square"></i> Sửa
                        </button>
                    )}

                    {mode !== "create" && (
                        <button
                            style={{ border: '1px solid #940303ff', backgroundColor: 'transparent', color: '#940303ff' }}
                            type="button"
                            className="delete-history-btn"
                            onClick={() => onClearHistory(initialData._id)}
                        >
                            <i className="bi bi-clock-history"></i> Xóa
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
