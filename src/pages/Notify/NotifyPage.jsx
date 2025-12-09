// NotifyPage.jsx
import React, { useState, useMemo, useCallback } from 'react';
import NotifyItem from '../../components/NotifyItem/NotifyItem';
import './NotifyPage.css';
import { useEffect } from 'react';
import { countTotalNotifications, getNotifications } from '../../api';

const NotifyPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('SUCCESS');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);

    const filteredNotifications = useMemo(() => {
        return notifications.filter(notify => notify.status === activeTab);
    }, [notifications, activeTab]);

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
            alertify.error(err.message || "Lỗi khi tải thông báo.");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDeleteByStatus = async (status) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa tất cả thông báo có trạng thái '${status}' không?`)) {
            try {
                const result = await deleteNotificationsByStatus(status);
                if (result.deletedCount > 0) {
                    fetchNotifications();
                }

            } catch (err) {
                alertify.error(err.message || "Xóa thông báo thất bại.");
            }
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    if (loading) {
        return <div>Đang tải thông báo...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>;
    }

    return (
        <div className="notify-page-container animate__animated animate__backInUp">
            <h2 className="page-title">Trung tâm Thông báo</h2>
            <div className="notify-controls">
                <div className="tab-buttons">
                    <button
                        className={`tab-btn ${activeTab === 'SUCCESS' ? 'active' : ''}`}
                        onClick={() => setActiveTab('SUCCESS')}
                    >
                        Success ({notifications.filter(n => n.status === 'SUCCESS').length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'FAILURE' ? 'active' : ''}`}
                        onClick={() => setActiveTab('FAILURE')}
                    >
                        Failure ({notifications.filter(n => n.status === 'FAILURE').length})
                    </button>
                </div>

                {filteredNotifications.length > 0 && (
                    <button
                        className="clear-all-btn"
                        onClick={handleClearAll}
                        title={`Xóa tất cả thông báo ${activeTab}`}
                    >
                        <i className="bi bi-trash"></i> Xóa tất cả
                    </button>
                )}
            </div>

            <hr />

            <div className="notification-list">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map(notify => (
                        <NotifyItem
                            key={notify.id}
                            imageSrc={notify.imageSrc}
                            title={notify.title}
                            time={notify.time}
                            body={notify.body}
                            status={notify.status}
                        />
                    ))
                ) : (
                    <p className="empty-message">Không có thông báo {activeTab} nào.</p>
                )}
            </div>
        </div>
    );
};

export default NotifyPage;