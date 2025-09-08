const API_URL = import.meta.env.VITE_API_BASE || "http://localhost:5050";

async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");
    const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        options.body = JSON.stringify(options.body);
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Ném lỗi để component có thể bắt và xử lý
        throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
    }

    return res;
}

// ==================== PROFILE API ====================
export async function getProfile() {
    const res = await apiFetch(`${API_URL}/api/profile/me`);
    if (!res.ok) throw new Error("Không lấy được thông tin user");
    return res.json();
}

export async function getProfileStats() {
    const res = await apiFetch(`${API_URL}/api/profile/stats`);
    if (!res.ok) throw new Error("Không lấy được thống kê user");
    return res.json();
}

export async function updateProfile(data) {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.email) formData.append("email", data.email);
    if (data.avatar instanceof File) formData.append("avatar", data.avatar);
    if (data.cover instanceof File) formData.append("cover", data.cover);

    const res = await apiFetch(`${API_URL}/api/profile/update`, {
        method: "PUT",
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Cập nhật user thất bại");
    }
    return res.json();
}

export async function deleteProfile() {
    const res = await apiFetch(`${API_URL}/api/profile/delete`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Xóa user thất bại");
    return res.json();
}

export async function changePassword(oldPassword, newPassword) {
    const res = await apiFetch(`${API_URL}/api/profile/change-password`, {
        method: "POST",
        body: { oldPassword, newPassword },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || "Đổi mật khẩu thất bại");
    }
    return data;
}

// ==================== AUTH API ====================
export async function register(data) {
    const res = await apiFetch(`${API_URL}/api/users/register`, {
        method: "POST",
        body: data,
    });
    if (!res.ok) throw new Error("Đăng ký thất bại");
    return res.json();
}

export async function login(data) {
    const res = await apiFetch(`${API_URL}/api/users/login`, {
        method: "POST",
        body: data,
    });
    if (!res.ok) throw new Error("Sai email hoặc mật khẩu");
    return res.json();
}

// ==================== PERSONA API ====================
export async function getPersonas() {
    const res = await apiFetch(`${API_URL}/api/personas`);
    if (!res.ok) throw new Error("Lấy persona thất bại");
    return res.json();
}

export async function createPersona(data) {
    const formData = new FormData();
    if (data.avatar) formData.append("avatar", data.avatar);
    formData.append("name", data.name || "");
    formData.append("description", data.description || "");
    formData.append("tone", data.tone || "");
    formData.append("style", data.style || "");
    formData.append("language", data.language || "");
    data.rules?.forEach((r) => formData.append("rules", r));
    data.autoMessageTimes?.forEach((t) => formData.append("autoMessageTimes", t));

    const res = await apiFetch(`${API_URL}/api/personas`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error("Tạo persona thất bại");
    return res.json();
}

export async function updatePersona(id, data) {
    const formData = new FormData();
    if (data.avatar instanceof File) formData.append("avatar", data.avatar);
    if (data.name !== undefined) formData.append("name", data.name);
    if (data.description !== undefined) formData.append("description", data.description);
    if (data.tone !== undefined) formData.append("tone", data.tone);
    if (data.style !== undefined) formData.append("style", data.style);
    if (data.language !== undefined) formData.append("language", data.language);
    data.rules?.forEach((r) => formData.append("rules", r));
    data.autoMessageTimes?.forEach((t) => formData.append("autoMessageTimes", t));

    const res = await apiFetch(`${API_URL}/api/personas/${id}`, {
        method: "PUT",
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Cập nhật persona thất bại");
    }
    return res.json();
}

export async function deletePersona(id) {
    const res = await apiFetch(`${API_URL}/api/personas/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Xóa persona thất bại");
    return res.json();
}

export async function getLastMessages() {
    const res = await apiFetch(`${API_URL}/api/personas/last-messages`);
    if (!res.ok) throw new Error("Không lấy được tin nhắn cuối cùng");
    return res.json();
}

// ==================== CHAT API ====================
export async function sendChat(personaId, payload) {
    const res = await apiFetch(`${API_URL}/api/chat/${personaId}`, {
        method: "POST",
        body: payload,
    });
    if (!res.ok) throw new Error("Chat error");
    return res.json();
}

export async function getChatHistory(personaId, { limit = 200, before } = {}) {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit);
    if (before) params.append("before", before);

    const res = await apiFetch(`${API_URL}/api/chat/${personaId}/history?${params.toString()}`);
    if (!res.ok) throw new Error("Không lấy được lịch sử chat");
    return res.json();
}

export async function deleteChatFrom(personaId, messageId) {
    const res = await apiFetch(`${API_URL}/api/chat/${personaId}/delete`, {
        method: "POST",
        body: { messageId },
    });

    if (!res.ok) throw new Error("Xóa chat thất bại");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

export async function clearChatHistory(personaId) {
    const res = await apiFetch(`${API_URL}/api/chat/${personaId}/history`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Xóa toàn bộ lịch sử chat thất bại");
    return res.json();
}

// Giữ nguyên hàm streamChat vì logic xử lý body của nó khác biệt
export async function streamChat(personaId, payload, onDelta, onDone, onError) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/chat/stream/${personaId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    
    // Xử lý 401 thủ công cho riêng hàm này
    if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        onError?.("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        return;
    }

    if (!res.body) {
        onError?.("No response body");
        return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            let parts = buffer.split("\n\n");
            buffer = parts.pop();
            for (const part of parts) {
                if (part.startsWith("data:")) {
                    try {
                        const data = JSON.parse(part.slice(5).trim());
                        if (data.delta) onDelta?.(data.delta);
                        else if (data.done) onDone?.(data);
                        else if (data.error) onError?.(data.error);
                    } catch (e) {
                        console.error("JSON parse error", e, part);
                    }
                }
            }
        }
    } catch (err) {
        onError?.(err.message);
    }
}

// ==================== PUSH API ====================

export async function subscribeUserToPush(vapidPublicKey) {
    if (!("serviceWorker" in navigator)) {
        alert("Trình duyệt không hỗ trợ Push Notification");
        return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        alert("Bạn cần cho phép thông báo để nhận tin nhắn");
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    const oldSub = await registration.pushManager.getSubscription();
    if (oldSub) {
        await oldSub.unsubscribe();
    }

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    await apiFetch(`${API_URL}/api/subscribe`, {
        method: "POST",
        body: { subscription },
    });
}

function urlBase64ToUint8Array(base64String) {
    if (!base64String) throw new Error("VAPID public key is missing!");
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}