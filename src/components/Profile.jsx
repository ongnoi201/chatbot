import { useState, useEffect } from "react";
import {
    getProfile,
    getProfileStats,
    updateProfile,
    deleteProfile,
    changePassword,
} from "../api";
import "./Profile.css";
import ConfirmModal from "./ConfirmModal";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
import "alertifyjs/build/css/themes/default.css";
import LoadingSpinner from "./LoadingSpinner";

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
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    function handlePasswordChange(e) {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    }

    async function handleChangePassword() {
        setLoading(true);
        try {
            await changePassword(passwordData.oldPassword, passwordData.newPassword);
            alertify.success("✅ Đổi mật khẩu thành công!");
            setShowPasswordModal(false);
            setPasswordData({ oldPassword: "", newPassword: "" });
        } catch (err) {
            alertify.error("❌ Cập nhật mật khẩu thất bại");
            console.log("Lỗi: " + err);
        }finally {
            setLoading(false);
        }
    }


    function handleChange(e) {
        const { name, value, files } = e.target;
        if (files) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
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
            alertify.success("✅ Cập nhật thành công!");
        } catch (err) {
            console.error("Update error:", err);
            alertify.error("❌ Không thể cập nhật user");
        }finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        setLoading(true);
        try {
            await deleteProfile();
            alertify.success("✅ Tài khoản đã bị xóa");
            onLogout();
        } catch (err) {
            console.error("Delete error:", err);
            alertify.error("❌ Không thể xóa tài khoản");
        }finally {
            setLoading(false); 
        }
    }

    if (!user) return <p className="loading">Không có dữ liệu user</p>;

    return (
        <div className="profile-container">
            {loading && <LoadingSpinner />}
            {/* Cover */}
            <div className="cover-wrapper">
                {editMode ? (
                    <input type="file" name="cover" accept="image/*" onChange={handleChange} />
                ) : (
                    <img
                        src={
                            formData.cover instanceof File
                                ? URL.createObjectURL(formData.cover)
                                : formData.cover || "https://via.placeholder.com/600x200"
                        }
                        alt="cover"
                        className="cover-image"
                        onClick={() =>
                            setPreviewImage(
                                formData.cover instanceof File
                                    ? URL.createObjectURL(formData.cover)
                                    : formData.cover
                            )
                        }
                    />
                )}

                {/* Avatar */}
                <div className="avatar-wrapper">
                    {editMode ? (
                        <input type="file" name="avatar" accept="image/*" onChange={handleChange} />
                    ) : (
                        <img
                            src={
                                formData.avatar instanceof File
                                    ? URL.createObjectURL(formData.avatar)
                                    : formData.avatar || "https://via.placeholder.com/100"
                            }
                            alt="avatar"
                            className="avatar-image"
                            onClick={() =>
                                setPreviewImage(
                                    formData.avatar instanceof File
                                        ? URL.createObjectURL(formData.avatar)
                                        : formData.avatar
                                )
                            }
                        />
                    )}
                </div>
            </div>

            <div className="profile-info">
                {/* Name */}
                <h2 className="profile-name">
                    {editMode ? (
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input-field"
                        />
                    ) : (
                        formData.name
                    )}
                </h2>

                {/* Email */}
                <p className="profile-email">
                    {editMode ? (
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input-field"
                        />
                    ) : (
                        formData.email
                    )}
                </p>

                {/* Stats */}
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

                {/* Actions */}
                <div className="action-buttons">
                    {editMode ? (
                        <>
                            <button onClick={handleSave} className="btn btn-green">Save</button>
                            <button onClick={() => setShowPasswordModal(true)} className="btn btn-orange">Change password</button>
                            <button onClick={() => setEditMode(false)} className="btn btn-gray">Cancel</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setEditMode(true)} className="btn btn-blue">Edit</button>
                            <button onClick={()=>setConfirmDeleteUser(true)} className="btn btn-red">Delete</button>
                            <button onClick={()=>setConfirmLogout(true)} className="btn btn-dark">Logout</button>
                        </>
                    )}
                </div>
            </div>

            {confirmLogout && (
                <ConfirmModal
                    message={"Bạn có chắc chắn muốn đăng xuất?"}
                    onCancel={() => setConfirmLogout(false)}
                    onConfirm={() => onLogout()}
                />
            )}

            {confirmDeleteUser && (
                <ConfirmModal
                    message={"Bạn có chắc chắn muốn xóa tài khoản?"}
                    onCancel={() => setConfirmDeleteUser(false)}
                    onConfirm={() => handleDelete()}
                />
            )}

            {/* Modal đổi mật khẩu */}
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
                            <button onClick={handleChangePassword} className="btn btn-green">
                                Lưu
                            </button>
                            <button onClick={() => setShowPasswordModal(false)} className="btn btn-gray">
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal xem ảnh lớn */}
            {previewImage && (
                <div
                    className="image-modal-overlay"
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                        src={previewImage}
                        alt="preview"
                        className="image-modal-content"
                    />
                </div>
            )}
        </div>
    );
}
