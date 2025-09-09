import { useState, useEffect } from "react";
import {
    getProfile,
    getProfileStats,
    updateProfile,
    deleteProfile,
    changePassword,
} from "../../api";
import "./Profile.css";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
import "alertifyjs/build/css/themes/default.css";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import CropperModal from "../../components/CropperModal/CropperModal";
import { useNavigate } from "react-router-dom";

export default function Profile({ onLogout }) {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [previewImage, setPreviewImage] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "" });
    const [confirmLogout, setConfirmLogout] = useState(false);
    const [confirmDeleteUser, setConfirmDeleteUser] = useState(false);
    const [cropState, setCropState] = useState(null);
    const [tempImageUrls, setTempImageUrls] = useState({});
    const navigate = useNavigate();

    alertify.set("notifier", "position", "bottom-center");
    alertify.set("notifier", "delay", 3);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const u = await getProfile();
                setUser(u);
                setFormData({
                    name: u.name,
                    email: u.email,
                    avatar: u.avatar || "",
                    cover: u.cover || "",
                });
                const s = await getProfileStats();
                setStats(s);
            } catch (err) {
                console.error("Lỗi load profile:", err);
                alertify.error("❌Không thể tải dữ liệu người dùng.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();

        return () => {
            Object.values(tempImageUrls).forEach(URL.revokeObjectURL);
        };
    }, []); // ✅ Xóa dependency `tempImageUrls` để tránh re-fetch không cần thiết

    function handleChange(e) {
        const { name, value, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setCropState({
                    image: reader.result,
                    field: name,
                    fileName: file.name,
                    aspect: name === 'avatar' ? 1 / 1 : 16 / 9,
                });
            };
            reader.readAsDataURL(file);
            e.target.value = null;
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    }

    const handleCropSave = (croppedData) => {
        const { file, url } = croppedData;
        setFormData(prev => ({
            ...prev,
            [cropState.field]: file,
        }));
        if (tempImageUrls[cropState.field]) {
            URL.revokeObjectURL(tempImageUrls[cropState.field]);
        }
        setTempImageUrls(prevUrls => ({
            ...prevUrls,
            [cropState.field]: url,
        }));
        setCropState(null);
    };

    function handlePasswordChange(e) {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    }

    async function handleChangePassword() {
        setLoading(true);
        try {
            await changePassword(passwordData.oldPassword, passwordData.newPassword);
            alertify.success("✅Đổi mật khẩu thành công!");
            setShowPasswordModal(false);
            setPasswordData({ oldPassword: "", newPassword: "" });
        } catch (err) {
            alertify.error(`❌ ${err.message || "❌Cập nhật mật khẩu thất bại"}`);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setLoading(true);
        try {
            const updated = await updateProfile(formData);
            localStorage.setItem("user", JSON.stringify(updated));
            setUser(updated);
            setFormData({
                name: updated.name,
                email: updated.email,
                avatar: updated.avatar,
                cover: updated.cover,
            });
            setEditMode(false);
            alertify.success("✅Cập nhật thành công!");
        } catch (err) {
            console.error("Update error:", err);
            alertify.error("❌Lỗi khi cập nhật user");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        setLoading(true);
        try {
            await deleteProfile();
            alertify.success("✅Tài khoản đã bị xóa");
            onLogout();
        } catch (err) {
            console.error("Delete error:", err);
            alertify.error("❌Lỗi xóa tài khoản");
        } finally {
            setLoading(false);
        }
    }

    const getImageUrl = (field, defaultUrl) => {
        if (formData[field] instanceof File && tempImageUrls[field]) {
            return tempImageUrls[field];
        }
        return formData[field] || defaultUrl;
    };

    if (!user && !loading) return <p className="loading">Không có dữ liệu user</p>;

    return (
        <div className="profile-container">
            {loading && <LoadingSpinner />}
            {cropState && (
                <CropperModal
                    image={cropState.image}
                    originalFileName={cropState.fileName}
                    aspect={cropState.aspect}
                    onClose={() => setCropState(null)}
                    onSave={handleCropSave}
                />
            )}

            {/* Cover */}
            <div className="cover-wrapper">
                {editMode ? (
                    <div className="cover-edit-area">
                        <label className="file-input-label">
                            <i className="bi bi-camera"></i> Chọn ảnh bìa
                            <input type="file" name="cover" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
                        </label>
                        {/* ✅ HIỂN THỊ PREVIEW BÊN DƯỚI INPUT */}
                        {(tempImageUrls.cover || user.cover) && (
                             <div className="edit-preview-wrapper">
                                <img src={tempImageUrls.cover || user.cover} alt="Cover Preview" className="edit-preview-img cover" />
                             </div>
                        )}
                    </div>
                ) : (
                    <img
                        src={getImageUrl("cover", "https://placehold.co/600x400/EEE/31343C")}
                        alt="cover"
                        className="cover-image"
                        onClick={() =>
                            setPreviewImage(getImageUrl("cover", "https://placehold.co/600x400/EEE/31343C"))
                        }
                    />
                )}

                {/* Avatar */}
                <div className="avatar-wrapper">
                    {editMode ? (
                        <div className="avatar-edit-area">
                            {/* ✅ HIỂN THỊ PREVIEW BÊN DƯỚI INPUT */}
                            {(tempImageUrls.avatar || user.avatar) && (
                                <div className="edit-preview-wrapper avatar">
                                    <img src={tempImageUrls.avatar || user.avatar} alt="Avatar Preview" className="edit-preview-img avatar" />
                                </div>
                            )}
                             <label className="file-input-label-avatar">
                                <i className="bi bi-camera"></i> Chọn ảnh đại diện
                                <input type="file" name="avatar" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
                            </label>
                        </div>
                    ) : (
                        <img
                            src={getImageUrl("avatar", "https://placehold.co/100x100/EEE/31343C")}
                            alt="avatar"
                            className="avatar-image"
                            onClick={() =>
                                setPreviewImage(getImageUrl("avatar", "https://placehold.co/100x100/EEE/31343C"))
                            }
                        />
                    )}
                </div>
            </div>

            <div className="profile-info">
                {/* ... Các phần còn lại của component không thay đổi ... */}
                <h2 className="profile-name">
                    {editMode ? (
                        <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            className="input-field"
                        />
                    ) : (
                        formData.name
                    )}
                </h2>
                <p className="profile-email">
                    {editMode ? (
                        <input
                            type="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleChange}
                            className="input-field"
                        />
                    ) : (
                        formData.email
                    )}
                </p>
                <button className="goto-setting-page" onClick={()=>navigate('/setting')}>Cài Đặt</button>
                {stats ? (
                    <>
                        <div className="stats-grid">
                            <div className="stat-box">
                                <p className="stat-number">{stats.personaCount}</p>
                                <p className="stat-label">Personas</p>
                            </div>
                            <div className="stat-box">
                                <p className="stat-number">{stats.messageCount}</p>
                                <p className="stat-label">Messages</p>
                            </div>
                        </div>
                        <div className="persona-messages">
                            <h3 className="section-title">Số lượng tin nhắn của từng nhân vật</h3>
                            <ul>
                                {stats.personaMessages.map(p => (
                                    <li key={p.personaId} className="persona-item">
                                        <span>{p.name}</span>
                                        <span>{p.count}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                ) : (
                    <p className="error-text">Không lấy được dữ liệu thống kê</p>
                )}
                <div className="action-buttons">
                    {editMode ? (
                        <>
                            <button onClick={handleSave} className="btn btn-green">Lưu</button>
                            <button onClick={() => setShowPasswordModal(true)} className="btn btn-orange">Password</button>
                            <button onClick={() => setEditMode(false)} className="btn btn-gray">Hủy</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setEditMode(true)} className="btn btn-blue">Edit</button>
                            <button onClick={() => setConfirmDeleteUser(true)} className="btn btn-red">Delete</button>
                            <button onClick={() => setConfirmLogout(true)} className="btn btn-dark">Logout</button>
                        </>
                    )}
                </div>
            </div>

            {confirmLogout && (
                <ConfirmModal
                    message={"⚠️Bạn có chắc chắn muốn đăng xuất?"}
                    onCancel={() => setConfirmLogout(false)}
                    onConfirm={onLogout}
                />
            )}
            {confirmDeleteUser && (
                <ConfirmModal
                    message={"⚠️Bạn có chắc chắn muốn xóa tài khoản và toàn bộ dữ liệu?"}
                    onCancel={() => setConfirmDeleteUser(false)}
                    onConfirm={handleDelete}
                />
            )}
            {showPasswordModal && (
                <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Đổi mật khẩu</h3>
                        <input
                            type="password"
                            name="oldPassword"
                            value={passwordData.oldPassword}
                            onChange={handlePasswordChange}
                            placeholder="Mật khẩu cũ"
                            className="input-field input-pass-old"
                        />
                        <input
                            type="password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            placeholder="Mật khẩu mới"
                            className="input-field"
                        />
                        <div className="modal-actions">
                            <button onClick={handleChangePassword} className="btn btn-green">Lưu</button>
                            <button onClick={() => setShowPasswordModal(false)} className="btn btn-gray">Hủy</button>
                        </div>
                    </div>
                </div>
            )}
            {previewImage && (
                <div className="image-modal-overlay" onClick={() => setPreviewImage(null)}>
                    <img src={previewImage} alt="preview" className="image-modal-content" />
                </div>
            )}
        </div>
    );
}