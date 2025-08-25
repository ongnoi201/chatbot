const API_URL = import.meta.env.VITE_API_BASE || "http://localhost:5050";

async function apiFetch(url, options = {}, onAuth) {
    const token = localStorage.getItem("token");
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        onAuth(null);
        throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
    }

    return res;
}


export async function register(data) {
    const res = await apiFetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Đăng ký thất bại");
    return res.json();
}

export async function login(data) {
    const res = await apiFetch(`${API_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Sai email hoặc mật khẩu");
    return res.json();
}

export async function getPersonas() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/personas`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Lấy persona thất bại");
    return res.json();
}

export async function createPersona(data) {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    if (data.avatar) {
        formData.append("avatar", data.avatar);
    }
    formData.append("name", data.name || "");
    formData.append("description", data.description || "");
    formData.append("tone", data.tone || "");
    formData.append("style", data.style || "");
    formData.append("language", data.language || "");

    if (data.rules) {
        if (Array.isArray(data.rules)) {
            data.rules.forEach((r) => formData.append("rules", r));
        } else {
            formData.append("rules", data.rules);
        }
    }

    if (data.autoMessageTimes) {
        if (Array.isArray(data.autoMessageTimes)) {
            data.autoMessageTimes.forEach((t) => formData.append("autoMessageTimes", t));
        } else {
            formData.append("autoMessageTimes", data.autoMessageTimes);
        }
    }

    const res = await fetch(`${API_URL}/api/personas`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!res.ok) throw new Error("Tạo persona thất bại");
    return res.json();
}


export async function sendChat(personaId, payload) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/chat/${personaId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Chat error");
    return res.json();
}

export async function getChatHistory(personaId, { limit = 200, before } = {}) {
    const token = localStorage.getItem("token");

    const params = new URLSearchParams();
    if (limit) params.append("limit", limit);
    if (before) params.append("before", before);

    const res = await fetch(`${API_URL}/api/chat/${personaId}/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Không lấy được lịch sử chat");
    return res.json();
}


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
                        if (data.delta) {
                            onDelta?.(data.delta);
                        } else if (data.done) {
                            onDone?.(data);
                        } else if (data.error) {
                            onError?.(data.error);
                        }
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

export async function deleteChatFrom(personaId, index) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/chat/${personaId}/delete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ index }),
    });

    if (!res.ok) throw new Error("Xóa chat thất bại");

    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

export async function updatePersona(id, data) {
    const token = localStorage.getItem("token");
    const formData = new FormData();

    if (data.avatar instanceof File) {
        formData.append("avatar", data.avatar);
    }
    if (data.name !== undefined) formData.append("name", data.name);
    if (data.description !== undefined) formData.append("description", data.description);
    if (data.tone !== undefined) formData.append("tone", data.tone);
    if (data.style !== undefined) formData.append("style", data.style);
    if (data.language !== undefined) formData.append("language", data.language);

    if (data.rules) {
        if (Array.isArray(data.rules)) {
            data.rules.forEach((r) => formData.append("rules", r));
        } else {
            formData.append("rules", data.rules);
        }
    }

    if (data.autoMessageTimes) {
        if (Array.isArray(data.autoMessageTimes)) {
            data.autoMessageTimes.forEach((t) => formData.append("autoMessageTimes", t));
        } else {
            formData.append("autoMessageTimes", data.autoMessageTimes);
        }
    }

    const res = await fetch(`${API_URL}/api/personas/${id}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Cập nhật persona thất bại");
    }

    return res.json();
}


export async function deletePersona(id) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/personas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Xóa persona thất bại");
    return res.json();
}

export async function clearChatHistory(personaId) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/chat/${personaId}/history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Xóa toàn bộ lịch sử chat thất bại");
    return res.json();
}

export async function getLastMessages() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/personas/last-messages`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Không lấy được tin nhắn cuối cùng");
    return res.json();
}

export async function subscribeUserToPush(vapidPublicKey) {
    const token = localStorage.getItem("token");
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

    // 🚨 XÓA SUBSCRIPTION CŨ NẾU CÓ
    const oldSub = await registration.pushManager.getSubscription();
    if (oldSub) {
        await oldSub.unsubscribe();
    }

    // Đăng ký subscription mới với VAPID public key mới
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    await fetch(`${API_URL}/api/subscribe`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription }),
    });
}


function urlBase64ToUint8Array(base64String) {
    if (!base64String) throw new Error("VAPID public key is missing!");
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}




