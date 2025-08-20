const API_URL = import.meta.env.VITE_API_BASE || "http://localhost:5050";

export async function register(data) {
    const res = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Đăng ký thất bại");
    return res.json();
}

export async function login(data) {
    const res = await fetch(`${API_URL}/api/users/login`, {
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
    if (data.avatar) {
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

    const res = await fetch(`${API_URL}/api/personas/${id}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!res.ok) throw new Error("Cập nhật persona thất bại");
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

