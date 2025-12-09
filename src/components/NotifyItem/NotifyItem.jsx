import React from 'react';
import './NotifyItem.css';

const NotifyItem = ({ imageSrc, title, time, body, status }) => {
    // Xác định class CSS cho trạng thái
    const statusClass = status === 'success' ? 'SUCCESS' : 'FAILURE';

    return (
        <div className={`notify-item ${statusClass} animate__animated animate__slideInLeft`}>
            <div className="notify-image">
                <img src={imageSrc} alt="Avatar" />
            </div>

            <div className="notify-content">
                <div className="notify-header">
                    <div className="notify-title">{title}</div>
                    <div className={`notify-status ${statusClass}`}>
                        {status.toUpperCase()}
                    </div>
                </div>
                
                <div className="notify-time">{time}</div>
                <div className="notify-body">{body}</div>
            </div>
        </div>
    );
};

export default NotifyItem;