import React, { useState, useMemo, useCallback, useEffect } from 'react';
import NotifyItem from '../../components/NotifyItem/NotifyItem';
import './NotifyPage.css';
import alertify from "alertifyjs";
import { countTotalNotifications, getNotifications, deleteNotificationsByStatus } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';


const NotifyPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('SUCCESS');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const CATEGORIES = useMemo(() => ['SUCCESS', 'FAILURE'], []);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    alertify.set("notifier", "position", "bottom-center");
    alertify.set("notifier", "delay", 3);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getNotifications();
            setNotifications(data.data || []);
            const count = await countTotalNotifications();
            setTotalCount(count);

        } catch (err) {
            setError(err.message || "Lỗi khi tải thông báo.");
            if (window.alertify) {
                window.alertify.error(err.message || "Lỗi khi tải thông báo.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const handleOpenConfirmModal = () => {
        setShowConfirmModal(true);
    };

    const handleCancelClearAll = () => {
        setShowConfirmModal(false);
    };

    const handleConfirmClearAll = useCallback(async () => {
        setShowConfirmModal(false);
        setLoading(true);
        const categoryToDelete = activeTab;

        try {
            const result = await deleteNotificationsByStatus(categoryToDelete);

            if (result && result.deletedCount > 0) {
                await fetchNotifications();
                alertify.success(`Đã xóa ${result.deletedCount} thông báo ${categoryToDelete}.`);
            } else {
                alertify.warning(`Không có thông báo ${categoryToDelete} nào được xóa.`);
            }
        } catch (err) {
            alertify.error(err.message || "Xóa thông báo thất bại.");
        } finally {
            setLoading(false);
        }
    }, [activeTab, fetchNotifications]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const filteredNotifications = useMemo(() => {
        return notifications.filter(notify => notify.category === activeTab);
    }, [notifications, activeTab]);

    const getCountByCategory = (category) => {
        return notifications.filter(n => n.category === category).length;
    };


    return (
        <div className="notify-page-container animate__animated animate__backInUp">
            {loading && <LoadingSpinner />}
            {showConfirmModal && (
                <ConfirmModal
                    message={`Bạn có chắc chắn muốn xóa tất cả thông báo thuộc danh mục '${activeTab}' không?`}
                    onConfirm={handleConfirmClearAll}
                    onCancel={handleCancelClearAll}
                />
            )}
            <h2 className="page-title">Trung tâm Thông báo ({totalCount})</h2>
            <div className="notify-controls">
                <div className="tab-buttons">
                    {CATEGORIES.map(category => (
                        <button
                            key={category}
                            className={`tab-btn ${activeTab === category ? 'active' : ''}`}
                            onClick={() => setActiveTab(category)}
                        >
                            {category} ({getCountByCategory(category)})
                        </button>
                    ))}

                </div>

                {filteredNotifications.length > 0 && (
                    <button
                        className="clear-all-btn"
                        onClick={handleOpenConfirmModal}
                        title={`Xóa tất cả thông báo ${activeTab}`}
                    >
                        <i className="bi bi-trash"></i> Xóa tất cả ({getCountByCategory(activeTab)})
                    </button>
                )}
            </div>

            <hr />

            <div className="notification-list">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map(notify => (
                        <NotifyItem
                            key={notify.id || notify._id}
                            imageSrc={notify.imageSrc}
                            title={notify.name}
                            time={notify.time}
                            body={notify.message}
                            status={notify.category}
                        />
                    ))
                ) : (
                    <p className="empty-message">Không có thông báo <span style={{ color: activeTab === "SUCCESS" ? "green" : "red" }}> {activeTab}</span> nào.</p>
                )}
            </div>
        </div>
    );
};

export default NotifyPage;