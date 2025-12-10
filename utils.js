export const formatRelativeTime = (isoTime) => {
    const pastDate = new Date(isoTime);
    const now = new Date();
    const diffInSeconds = Math.floor((now - pastDate) / 1000);

    const minutes = 60;
    const hours = minutes * 60;
    const days = hours * 24;
    const weeks = days * 7;
    const months = days * 30;

    if (diffInSeconds < minutes) {
        return "Vài giây trước";
    }

    const diffInMinutes = Math.floor(diffInSeconds / minutes);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} phút trước`;
    }

    const diffInHours = Math.floor(diffInSeconds / hours);
    if (diffInHours < 24) {
        return `${diffInHours} giờ trước`;
    }

    const diffInDays = Math.floor(diffInSeconds / days);
    if (diffInDays < 7) {
        return `${diffInDays} ngày trước`;
    }

    const diffInWeeks = Math.floor(diffInSeconds / weeks);
    if (diffInWeeks < 4) {
        return `${diffInWeeks} tuần trước`;
    }

    const diffInMonths = Math.floor(diffInSeconds / months);
    return `${diffInMonths} tháng trước`;
};

const DEFAULT_MODEL = "gemini-2.5-flash-lite";
export const getModelFromLocalStorage = () => {
    try {
        const savedSettings = localStorage.getItem("chatSettings");
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            return settings.model || DEFAULT_MODEL;
        }
    } catch (e) {
        alertify.error("Lỗi khi đọc model từ localStorage");
    }
    return DEFAULT_MODEL;
};