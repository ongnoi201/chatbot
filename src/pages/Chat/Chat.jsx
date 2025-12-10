import "./Chat.css";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
import "alertifyjs/build/css/themes/default.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    getPersonas,
    createPersona,
    getChatHistory,
    streamChat,
    deleteChatFrom,
    updatePersona,
    deletePersona,
    clearChatHistory,
    getLastMessages,
    countTotalNotifications,
    addNotification
} from "../../api";
import ContextMenu from "../../components/ContextMenu/ContextMenu";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import TypingIndicator from "../../components/TypingIndicator/TypingIndicator";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import PersonaFormModal from "../../components/PersonaFormModal/PersonaFormModal"
import { getModelFromLocalStorage } from "../../../utils";

export default function Chat({ user }) {
    const bottomRef = useRef(null);
    const messagesRef = useRef(null);
    const [personas, setPersonas] = useState([]);
    const [selectedPersona, setSelectedPersona] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [model, setModel] = useState(getModelFromLocalStorage);
    const [contextMenu, setContextMenu] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isCompact, setIsCompact] = useState(false);
    const [confirmDeletePersona, setConfirmDeletePersona] = useState(null);
    const [confirmHistory, setConfirmHistory] = useState(null);
    const [formMode, setFormMode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [closing, setClosing] = useState(false);
    const [countNotify, setCountNotify] = useState(0);
    const [unreadPersonas, setUnreadPersonas] = useState(new Set());
    const navigate = useNavigate();

    alertify.set("notifier", "position", "bottom-center");
    alertify.set("notifier", "delay", 3);

    const logNotification = useCallback(async (category, name, message, personaId = null) => {
        try {
            await addNotification({ category, name, message, personaId });
            await numberNotify(); 
        } catch (error) {
            console.error("Lỗi khi ghi thông báo:", error);
        }
    }, []);

    useEffect(() => {
        loadPersonas();
    }, []);

    useEffect(() => {
        const handleStorageChange = () => {
            setModel(getModelFromLocalStorage());
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
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
            alertify.error("Lỗi kiểm tra tin nhắn chưa đọc");
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
            const stored = JSON.parse(localStorage.getItem("personaBackgrounds") || "{}");
            const merged = list.map(p => ({
                ...p,
                background: stored[p._id] ?? false
            }));

            setPersonas(merged);
        } catch (err) {
            console.error("Lỗi khi load personas", err);
            alertify.error("❌Lỗi khi tải nhân vật")
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
        setMessages([]);
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

        // Tạm thời thêm tin nhắn user và assistant placeholder vào UI
        setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
        const history = [...messages, userMsg];
        const initialMessagesLength = messages.length; // Chiều dài mảng trước khi thêm 2 tin nhắn mới

        await streamChat(
            selectedPersona._id,
            {
                messages: history,
                model,
                temperature: 0.7,
                maxOutputTokens: 1024,
            },
            (delta) => {
                // Logic cập nhật stream không đổi
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    const updatedContent = lastMsg.content + delta;
                    return [...prev.slice(0, -1), { ...lastMsg, content: updatedContent }];
                });
            },
            () => {
                // Xử lý khi stream kết thúc thành công (done: true)
            },
            (error) => {
                console.error("Stream error in onSend:", error);

                // === XỬ LÝ LỖI GIỚI HẠN/CHẶN TỪ BACKEND ===
                let errorMessage = `⚠️ Stream error: ${error}`;

                // Kiểm tra nếu lỗi là do giới hạn từ backend (chuỗi đã được backend chuẩn hóa)
                if (error.includes("AI đã đạt đến giới hạn hoặc bị chặn")) {
                    errorMessage = error;
                }

                // Xóa tin nhắn người dùng và tin nhắn assistant rỗng/lỗi khỏi UI
                setMessages((prev) => prev.slice(0, initialMessagesLength));

                // Hiển thị thông báo lỗi
                alertify.error("AI đã đạt đến giới hạn");
            }
        );
    }

    async function onSendRegenerate(history) {
        setMessages(history);

        let assistantMsg = { role: "assistant", content: "" };
        setMessages((prev) => [...prev, assistantMsg]);
        const initialMessagesLength = history.length; // Chiều dài mảng trước khi thêm tin nhắn assistant mới

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
                // Logic cập nhật stream không đổi
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    const updatedContent = lastMsg.content + delta;
                    return [...prev.slice(0, -1), { ...lastMsg, content: updatedContent }];
                });
            },
            () => { },
            (error) => {
                console.error("Stream error in onSendRegenerate:", error);

                // === XỬ LÝ LỖI GIỚI HẠN/CHẶN TỪ BACKEND ===
                let errorMessage = `⚠️ Stream error: ${error}`;

                // Kiểm tra nếu lỗi là do giới hạn từ backend
                if (error.includes("AI đã đạt đến giới hạn hoặc bị chặn")) {
                    errorMessage = error;
                }

                // Xóa tin nhắn assistant rỗng/lỗi khỏi UI (chỉ xóa 1 tin cuối cùng)
                setMessages((prev) => prev.slice(0, initialMessagesLength));

                // Hiển thị thông báo lỗi
                alertify.error("AI đã đạt đến giới hạn");
            }
        );
    }

    // ... các hàm khác không thay đổi
    // (onDeleteHistory, loadMoreMessages, useEffects, render JSX)

    async function onDeleteHistory(personaId) {
        if (!personaId) return;
        setLoading(true);
        try {
            await clearChatHistory(personaId);
            setMessages([]);
            alertify.success("✅Đã xóa toàn bộ lịch sử");
            await logNotification("SUCCESS", "Xóa lịch sử chat", `Đã xóa lịch sử chat với nhân vật ${selectedPersona.name}.`, personaId);
        } catch (err) {
            console.error("Xóa lịch sử lỗi", err);
            alertify.error("❌Lỗi khi xóa lịch sử");
            await logNotification("FAILURE", "Xóa lịch sử chat", `Xóa lịch sử chat với nhân vật ${selectedPersona.name} thất bại.`, personaId);
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

            setTimeout(() => {
                const newHeight = container.scrollHeight;
                container.scrollTop = newHeight - prevHeight;
            }, 0);
        } catch (err) {
            console.error("Không load thêm được tin cũ", err);
            alertify.error("❌Lỗi load tin nhắn cũ");
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

    const handleRedirect = () => {
        window.location.href = '/tool.html';
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
    }, [messages]);

    const numberNotify = async () => {
        const res = await countTotalNotifications();
        if (res) setCountNotify(res);
    }
    useEffect(() => {
        numberNotify();
    }, [])


    return (
        <div
            className="wrap"
            style={{
                "--wrap-bg":
                    selectedPersona?.avatarUrl && selectedPersona?.background
                        ? `url(${selectedPersona.avatarUrl})`
                        : "none",
            }}
        >
            {loading && <LoadingSpinner />}

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
                        <center><h2>Nhân <span onClick={handleRedirect}>vật</span></h2></center>
                        <div className="button-top">
                            <button className="add-persona" onClick={() => {
                                setFormMode("create");
                                setShowSidebar(false);
                            }}>
                                <i className="bi bi-plus"></i> Thêm mới
                            </button>

                            <button className="notify" onClick={() => navigate('/notify')}>
                                <i className="bi bi-bell"></i> Thông báo <span style={{ color: "yellow" }}>({countNotify})</span>
                            </button>
                        </div>

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
                        <button className="profile-btn" onClick={() => navigate('/profile')}>
                            <i className="bi bi-box-arrow-right"></i> {user.name}
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
                                                setConfirmDelete({ personaId: selectedPersona._id, messageId: m._id })
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
                                    id="chatInput"
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
                                    const messageToDelete = messages[contextMenu.index];
                                    if (messageToDelete) {
                                        setConfirmDelete({
                                            personaId: selectedPersona._id,
                                            messageId: messageToDelete._id
                                        });
                                    }
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
                    message="⚠️Bạn có chắc muốn xóa từ đoạn chat này trở về sau?"
                    onCancel={() => setConfirmDelete(null)}
                    onConfirm={async () => {
                        setLoading(true);
                        try {
                            const updated = await deleteChatFrom(
                                confirmDelete.personaId,
                                confirmDelete.messageId
                            );
                            setMessages(updated);
                            alertify.success("✅Đã xóa các tin nhắn");
                            await logNotification("SUCCESS", "Xóa tin nhắn", `Đã xóa tin nhắn từ ID ${confirmDelete.messageId.substring(0, 8)}... trở về sau với nhân vật ${selectedPersona.name}.`, confirmDelete.personaId);
                        } catch (err) {
                            console.error("Xóa chat lỗi", err);
                            alertify.error("❌Lỗi khi xóa tin nhắn");
                            await logNotification("FAILURE", "Xóa tin nhắn", `Xóa tin nhắn từ ID ${confirmDelete.messageId.substring(0, 8)}... thất bại với nhân vật ${selectedPersona.name}.`, confirmDelete.personaId);
                        } finally {
                            setLoading(false);
                            setConfirmDelete(null);
                        }
                    }}
                />
            )}

            {confirmDeletePersona && (
                <ConfirmModal
                    message={`⚠️Bạn có chắc muốn xóa nhân vật "${confirmDeletePersona.name}" và toàn bộ lịch sử chat không?`}
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
                            alertify.success("✅Xóa nhân vật thành công");
                            await logNotification("SUCCESS", "Xóa nhân vật", `Đã xóa nhân vật ${personaToDelete.name} thành công.`, personaToDelete._id);
                        } catch (err) {
                            console.error("Xóa persona lỗi", err);
                            alertify.error("❌Lỗi khi xóa nhân vật");
                            await logNotification("FAILURE", "Xóa nhân vật", `Xóa nhân vật ${personaToDelete.name} thất bại.`, personaToDelete._id);
                        } finally {
                            setLoading(false);
                            setConfirmDeletePersona(null);
                        }
                    }}
                />
            )}

            {confirmHistory && (
                <ConfirmModal
                    message={"⚠️Bạn có chắc chắn muốn xóa toàn bộ lịch sử cuộc trò chuyện không?"}
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
                        let isSuccess = false;
                        let personaName = data.name;
                        let personaId = formMode === "edit" ? selectedPersona._id : null;
                        
                        try {
                            if (formMode === "create") {
                                const created = await createPersona({
                                    ...data,
                                    rules: [],
                                });

                                const personaWithBg = { ...created, background: data.background };
                                personaId = created._id;

                                setPersonas((prev) => [...prev, personaWithBg]);
                                setSelectedPersona(personaWithBg);
                                alertify.success("✅Tạo nhân vật thành công");
                                isSuccess = true;

                            } else if (formMode === "edit") {
                                const updated = await updatePersona(
                                    selectedPersona._id,
                                    data
                                );

                                const personaWithBg = { ...updated, background: data.background };

                                setPersonas((prev) =>
                                    prev.map((p) =>
                                        p._id === updated._id ? personaWithBg : p
                                    )
                                );
                                setSelectedPersona(personaWithBg);
                                alertify.success("✅Cập nhật nhân vật thành công");
                                isSuccess = true;
                            }
                        } catch (err) {
                            alertify.error(
                                formMode === "create"
                                    ? "❌Tạo nhân vật thất bại"
                                    : "❌Cập nhật nhân vật thất bại"
                            );
                            isSuccess = false;
                        } finally {
                            setLoading(false);
                            setFormMode(null);

                            const action = formMode === "create" ? "Tạo nhân vật" : "Cập nhật nhân vật";
                            const category = isSuccess ? "SUCCESS" : "FAILURE";
                            const message = isSuccess 
                                ? `${action} ${personaName} thành công.`
                                : `${action} ${personaName} thất bại.`;
                            
                            await logNotification(category, action, message, personaId);
                        }
                    }}
                />
            )}
        </div>
    );
}