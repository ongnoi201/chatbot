import "../app.css";
import alertify from "alertifyjs";
import ContextMenu from "./ContextMenu";
import ConfirmModal from "./ConfirmModal";
import "alertifyjs/build/css/alertify.css";
import "alertifyjs/build/css/themes/default.css";
import PersonaFormModal from "./PersonaFormModal";
import { useEffect, useRef, useState, useCallback } from "react";
import {
    getPersonas,
    createPersona,
    getChatHistory,
    streamChat,
    deleteChatFrom,
    updatePersona,
    deletePersona,
    clearChatHistory,
    getLastMessages
} from "../api";
import TypingIndicator from "./TypingIndicator";

export default function Chat({ user, onLogout }) {
    const bottomRef = useRef(null);
    const messagesRef = useRef(null);
    const [personas, setPersonas] = useState([]);
    const [selectedPersona, setSelectedPersona] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [model, setModel] = useState("gemini-2.5-flash");
    const [contextMenu, setContextMenu] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const [isCompact, setIsCompact] = useState(false);
    const [confirmDeletePersona, setConfirmDeletePersona] = useState(null);
    const [confirmHistory, setConfirmHistory] = useState(null);
    const [formMode, setFormMode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [closing, setClosing] = useState(false);
    const [unreadPersonas, setUnreadPersonas] = useState(new Set());

    alertify.set("notifier", "position", "top-right");
    alertify.set("notifier", "delay", 3);

    useEffect(() => {
        loadPersonas();
    }, []);

    const checkUnreadMessages = useCallback(async () => {
        try {
            const latestMessages = await getLastMessages();
            const lastViewed = JSON.parse(localStorage.getItem('lastViewedPersonas')) || {};
            const newUnread = new Set();
            for (const personaId in latestMessages) {
                const latestMsg = latestMessages[personaId];
                const lastViewedTime = lastViewed[personaId];
                if (latestMsg.role === 'assistant' && 
                    (!lastViewedTime || new Date(latestMsg.createdAt) > new Date(lastViewedTime))) {
                    if (selectedPersona?._id !== personaId) {
                        newUnread.add(personaId);
                    }
                }
            }
            setUnreadPersonas(newUnread);
        } catch (error) {
            console.error("Lỗi kiểm tra tin nhắn chưa đọc:", error);
        }
    }, [selectedPersona]);

    useEffect(() => {
        async function initialLoad() {
            await loadPersonas();
            await checkUnreadMessages();
        }
        initialLoad();
        window.addEventListener('visibilitychange', checkUnreadMessages);
        return () => {
            window.removeEventListener('visibilitychange', checkUnreadMessages);
        };
    }, [checkUnreadMessages]);

    async function loadPersonas() {
        setLoading(true);
        try {
            const list = await getPersonas();
            setPersonas(list);
        } catch (err) {
            console.error("Lỗi khi load personas", err);
        } finally {
            setLoading(false);
        }
    }

     async function selectPersona(p) {
        const lastViewed = JSON.parse(localStorage.getItem('lastViewedPersonas')) || {};
        lastViewed[p._id] = new Date().toISOString();
        localStorage.setItem('lastViewedPersonas', JSON.stringify(lastViewed));
        if (unreadPersonas.has(p._id)) {
            const newUnread = new Set(unreadPersonas);
            newUnread.delete(p._id);
            setUnreadPersonas(newUnread);
        }
        setSelectedPersona(p);
        setLoading(true);
        try {
            const history = await getChatHistory(p._id);
            setMessages(history);
        } catch {
            setMessages([
                { role: "assistant", content: `Xin chào! Mình là ${p.name}. Bạn cần gì?` },
            ]);
        } finally {
            setLoading(false);
        }
    }

    async function onSend() {
        if (!input.trim() || !selectedPersona) return;

        const userMsg = { role: "user", content: input.trim() };
        setInput("");
        setMessages((prev) => [...prev, userMsg]);

        let assistantMsg = { role: "assistant", content: "" };
        setMessages((prev) => [...prev, assistantMsg]);

        const history = [...messages, userMsg];

        await streamChat(
            selectedPersona._id,
            {
                messages: history,
                model,
                temperature: 0.7,
                maxOutputTokens: 1024,
            },
            (delta) => {
                assistantMsg = { ...assistantMsg, content: assistantMsg.content + delta };
                setMessages((prev) => [...prev.slice(0, -1), assistantMsg]);
            },
            () => { },
            (error) => {
                assistantMsg = { role: "assistant", content: `⚠️ Stream error: ${error}` };
                setMessages((prev) => [...prev.slice(0, -1), assistantMsg]);
            }
        );
    }

    async function onSendRegenerate(history) {
        setMessages(history);

        let assistantMsg = { role: "assistant", content: "" };
        setMessages((prev) => [...prev, assistantMsg]);

        await streamChat(
            selectedPersona._id,
            {
                messages: history,
                model,
                temperature: 0.7,
                maxOutputTokens: 1024,
                regenerate: true,
            },
            (delta) => {
                assistantMsg = { ...assistantMsg, content: assistantMsg.content + delta };
                setMessages((prev) => [...prev.slice(0, -1), assistantMsg]);
            },
            () => { },
            (error) => {
                assistantMsg = { role: "assistant", content: `⚠️ Stream error: ${error}` };
                setMessages((prev) => [...prev.slice(0, -1), assistantMsg]);
            }
        );
    }

    async function onDeleteHistory(personaId) {
        if (!personaId) return;
        setLoading(true);
        try {
            await clearChatHistory(personaId);
            setMessages([]);
            alertify.success("Đã xóa toàn bộ lịch sử");
        } catch (err) {
            console.error("Xóa lịch sử lỗi", err);
            alertify.error("Xóa thất bại");
        } finally {
            setLoading(false);
            setConfirmHistory(null);
        }
    }

    async function loadMoreMessages() {
        if (!selectedPersona || messages.length === 0) return;
        const container = messagesRef.current;
        if (!container) return;

        const prevHeight = container.scrollHeight;
        setLoading(true);

        try {
            const oldest = messages[0];
            const more = await getChatHistory(selectedPersona._id, {
                limit: 200,
                before: oldest.createdAt,
            });

            setMessages((prev) => [...more, ...prev]);

            // đợi React render xong
            setTimeout(() => {
                const newHeight = container.scrollHeight;
                container.scrollTop = newHeight - prevHeight;
            }, 0);
        } catch (err) {
            console.error("Không load thêm được tin cũ", err);
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        const container = messagesRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (container.scrollTop === 0 && !loading) {
                loadMoreMessages();
            }
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [messages, selectedPersona, loading]);

    useEffect(() => {
        const disableContextMenu = (e) => e.preventDefault();
        document.addEventListener("contextmenu", disableContextMenu);
        return () => document.removeEventListener("contextmenu", disableContextMenu);
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
    }, [messages]);

    return (
        <div
            className="wrap"
            style={{
                "--wrap-bg": selectedPersona?.avatarUrl
                    ? `url(${selectedPersona.avatarUrl})`
                    : "none",
            }}
        >
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}

            <button
                className="toggle-sidebar"
                onClick={() => {
                    if (showSidebar) {
                        setClosing(true);
                    } else {
                        setShowSidebar(true);
                    }
                }}
            >
                {!showSidebar ? "☰" : <i className="bi bi-x-lg"></i>}
            </button>

            {/*=================== SIDEBAR =============================*/}
            {showSidebar && (
                <aside
                    className={`sidebar animate__animated ${closing ? "animate__slideOutLeft" : "animate__slideInLeft"}`}
                    onAnimationEnd={() => {
                        if (closing) {
                            setShowSidebar(false);
                            setClosing(false);
                        }
                    }}
                >
                    <div className="sidebar-top">
                        <center><h2>Nhân vật</h2></center>
                        <button className="add-persona" onClick={() => setFormMode("create")}>Tạo Nhân Vật Mới</button>
                        <div className="persona-list">
                            {personas.map((p) => (
                                <div
                                    key={p._id}
                                    className={`persona-item ${selectedPersona?._id === p._id ? "active" : ""}`}
                                    onClick={() => {
                                        selectPersona(p);
                                        setShowSidebar(false);
                                    }}
                                >
                                    <img src={p.avatarUrl} alt="Ảnh nhân vật" />
                                    <p>{p.name}</p>
                                    {unreadPersonas.has(p._id) && <div className="unread-dot"></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="sidebar-bottom">
                        <button className="logout-btn" onClick={() => setConfirmLogout(true)}>
                            <i className="bi bi-box-arrow-right"></i> Đăng xuất
                        </button>
                    </div>
                </aside>
            )}

            {/*======================================= MAIN CHAT =============================*/}
            <main className={`chat ${isCompact ? "compact" : ""}`}>
                {selectedPersona && (
                    <div className="head-chat">
                        <div className="head-chat-left">
                            <img src={selectedPersona?.avatarUrl || "https://gcs.tripi.vn/public-tripi/tripi-feed/img/477733sdR/anh-mo-ta.png"} alt="head chat pic" />
                            <span>{selectedPersona?.name || "Ông nội"}</span>
                        </div>

                        <div className="head-chat-right">
                            <button className="toggle-compact" onClick={() => setIsCompact(!isCompact)}>
                                {isCompact ? <i className="bi bi-arrow-up-circle-fill"></i> : <i className="bi bi-arrow-down-circle-fill"></i>}
                            </button>
                            <button className="more-setting" onClick={() => setFormMode("edit")}><i className="bi bi-gear-fill"></i></button>
                            <button className="delete-persona" onClick={() => setConfirmDeletePersona(selectedPersona)}>
                                <i className="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </div>
                )}

                {selectedPersona ? (
                    <>
                        <div className="messages" ref={messagesRef}>
                            {messages.map((m, i) => (
                                <div key={i} className="msg-block">
                                    <div className={`msg ${m.role}`}>
                                        <div className="bubble">
                                            {m.role === "assistant" && m.content === "" ? (
                                                <TypingIndicator />
                                            ) : (
                                                m.content
                                            )}
                                        </div>
                                    </div>
                                    <div className="msg-actions">
                                        <button
                                            title="Copy"
                                            onClick={() => navigator.clipboard.writeText(m.content)}
                                        >
                                            <i className="bi bi-clipboard"></i>
                                        </button>
                                        <button
                                            title="Delete"
                                            onClick={() =>
                                                setConfirmDelete({ personaId: selectedPersona._id, index: i })
                                            }
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>

                                        {m.role === "assistant" && i === messages.length - 1 && (
                                            <button
                                                title="Regenerate"
                                                onClick={() => {
                                                    const lastUserIndex = [...messages]
                                                        .reverse()
                                                        .findIndex((msg) => msg.role === "user");

                                                    if (lastUserIndex !== -1) {
                                                        const actualIndex = messages.length - 1 - lastUserIndex;
                                                        const history = messages.slice(0, actualIndex + 1);
                                                        onSendRegenerate(history);
                                                    }
                                                }}
                                            >
                                                <i className="bi bi-arrow-repeat"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>

                        <div className="composer">
                            <div className="composer-input">
                                <textarea
                                    rows={1}
                                    placeholder="Nhập tin nhắn..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            onSend();
                                        }
                                    }}
                                />
                                <button onClick={onSend}><i className="bi bi-send"></i></button>
                            </div>
                        </div>
                        {contextMenu && (
                            <ContextMenu
                                x={contextMenu.x}
                                y={contextMenu.y}
                                onClose={() => setContextMenu(null)}
                                onCopy={() => {
                                    navigator.clipboard.writeText(messages[contextMenu.index].content);
                                    setContextMenu(null);
                                }}
                                onDelete={() => {
                                    setConfirmDelete({ personaId: selectedPersona._id, index: contextMenu.index });
                                    setContextMenu(null);
                                }}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <button className="empty2" onClick={() => setFormMode("create")}><i className="bi bi-plus-circle-dotted"></i></button>
                        <div className="empty">Chọn hoặc tạo một nhân vật để bắt đầu chat</div>
                    </>
                )}
            </main>

            {confirmDelete && (
                <ConfirmModal
                    message="Bạn có chắc muốn xóa từ đoạn chat này trở về sau?"
                    onCancel={() => setConfirmDelete(null)}
                    onConfirm={async () => {
                        setLoading(true);
                        try {
                            const updated = await deleteChatFrom(
                                confirmDelete.personaId,
                                confirmDelete.index
                            );
                            setMessages(updated);
                            alertify.success("Xóa thành công");
                        } catch (err) {
                            console.error("Xóa chat lỗi", err);
                            alertify.error("Xóa thất bại");
                        } finally {
                            setLoading(false);
                            setConfirmDelete(null);
                        }
                    }}
                />
            )}

            {confirmDeletePersona && (
                <ConfirmModal
                    message={`Bạn có chắc muốn xóa nhân vật "${confirmDeletePersona.name}" và toàn bộ lịch sử chat không?`}
                    onCancel={() => setConfirmDeletePersona(null)}
                    onConfirm={async () => {
                        setLoading(true);
                        try {
                            await deletePersona(confirmDeletePersona._id);
                            setPersonas((prev) =>
                                prev.filter((p) => p._id !== confirmDeletePersona._id)
                            );
                            setSelectedPersona(null);
                            setMessages([]);
                            alertify.success("Xóa thành công");
                        } catch (err) {
                            console.error("Xóa persona lỗi", err);
                            alertify.error("Xóa thất bại");
                        } finally {
                            setLoading(false);
                            setConfirmDeletePersona(null);
                        }
                    }}
                />
            )}

            {confirmLogout && (
                <ConfirmModal
                    message={"Bạn có chắc chắn muốn đăng xuất?"}
                    onCancel={() => setConfirmLogout(false)}
                    onConfirm={() => onLogout()}
                />
            )}

            {confirmHistory && (
                <ConfirmModal
                    message={"Bạn có chắc chắn muốn xóa toàn bộ lịch sử cuộc trò chuyện không?"}
                    onCancel={() => setConfirmHistory(false)}
                    onConfirm={() => onDeleteHistory(selectedPersona._id)}
                />
            )}

            {formMode && (
                <PersonaFormModal
                    mode={formMode}
                    initialData={formMode === "edit" ? selectedPersona : null}
                    onClose={() => setFormMode(null)}
                    onClearHistory={() => { setConfirmHistory(true); setFormMode(null); }}
                    onSubmit={async (data) => {
                        setLoading(true);
                        try {
                            if (formMode === "create") {
                                const created = await createPersona({
                                    ...data,
                                    rules: [],
                                });
                                setPersonas((prev) => [...prev, created]);
                                setSelectedPersona(created);
                            } else if (formMode === "edit") {
                                const updated = await updatePersona(
                                    selectedPersona._id,
                                    data
                                );
                                setPersonas((prev) =>
                                    prev.map((p) =>
                                        p._id === updated._id ? updated : p
                                    )
                                );
                                setSelectedPersona(updated);
                            }
                        } catch (err) {
                            alertify.error(
                                formMode === "create"
                                    ? "Tạo nhân vật thất bại"
                                    : "Cập nhật nhân vật thất bại"
                            );
                        } finally {
                            setLoading(false);
                            setFormMode(null);
                        }
                    }}
                />
            )}
        </div>
    );
}
