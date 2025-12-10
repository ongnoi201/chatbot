import React from 'react';
import './NotifyItem.css';
import { formatRelativeTime } from '../../../utils';

const NotifyItem = ({ title, time, body, status }) => {
    const displayTime = formatRelativeTime(time);
    const statusClass = status === 'SUCCESS' ? 'SUCCESS' : 'FAILURE';
    const imageSrc = status ==='SUCCESS' ? 'https://cdn-icons-png.flaticon.com/128/14090/14090371.png' : 'https://cdn-icons-png.flaticon.com/128/1828/1828843.png';

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
                
                <div className="notify-time">{displayTime}</div>
                <div className="notify-body">{body}</div>
            </div>
        </div>
    );
};

export default NotifyItem;