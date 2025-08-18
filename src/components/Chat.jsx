import "../app.css";
import alertify from "alertifyjs";
import ContextMenu from "./ContextMenu";
import ConfirmModal from "./ConfirmModal";
import "alertifyjs/build/css/alertify.css";
import "alertifyjs/build/css/themes/default.css";
import PersonaFormModal from "./PersonaFormModal";
import { useEffect, useRef, useState } from "react";
import { getPersonas, createPersona, getChatHistory, streamChat, deleteChatFrom, updatePersona, deletePersona } from "../api";

export default function Chat({ user, onLogout }) {
    const bottomRef = useRef(null);
    const longPressTimer = useRef(null);
    const [personas, setPersonas] = useState([]);
    const [selectedPersona, setSelectedPersona] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [model, setModel] = useState("gemini-2.5-flash");
    const [contextMenu, setContextMenu] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isCompact, setIsCompact] = useState(false);
    const [confirmDeletePersona, setConfirmDeletePersona] = useState(null);
    const [formMode, setFormMode] = useState(null);

    alertify.set('notifier', 'position', 'top-right');
    alertify.set('notifier', 'delay', 3);

    useEffect(() => {
        loadPersonas();
    }, []);

    async function loadPersonas() {
        try {
            const list = await getPersonas();
            setPersonas(list);
            if (list.length > 0) {
                selectPersona(list[0]);
            }
        } catch (err) {
            console.error("Lỗi khi load personas", err);
        }
    }

    async function selectPersona(p) {
        setSelectedPersona(p);
        try {
            const history = await getChatHistory(p._id);
            setMessages(history);
        } catch {
            setMessages([
                { role: "assistant", content: `Xin chào! Mình là ${p.name}. Bạn cần gì?` },
            ]);
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
            (finalData) => {
            },
            (error) => {
                assistantMsg = { role: "assistant", content: `⚠️ Stream error: ${error}` };
                setMessages((prev) => [...prev.slice(0, -1), assistantMsg]);
            }
        );
    }

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
    }, [messages]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (!contextMenu) return;
            const menuElem = document.querySelector(".context-menu");
            if (menuElem && !menuElem.contains(e.target)) {
                setContextMenu(null);
            }
        }

        document.addEventListener("click", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [contextMenu]);


    return (
        <div className="wrap" style={{
            "--wrap-bg": selectedPersona?.avatarUrl
                ? `url(${selectedPersona.avatarUrl})`
                : "none"
        }}
        >
            <button className="toggle-sidebar" onClick={() => setShowSidebar(!showSidebar)}>☰</button>


            {/*=================== SIDEBAR =============================*/}
            <aside className={`sidebar ${showSidebar ? "open" : ""}`}>
                <div className="sidebar-top">
                    <center><h2>Nhân vật</h2></center>
                    <button className="add-persona" onClick={() => setFormMode("create")}>+ Tạo Nhân Vật Mới</button>
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
                            </div>
                        ))}
                    </div>
                </div>
                <div className="sidebar-bottom">
                    <button className="logout-btn" onClick={onLogout}>
                        <i className="bi bi-box-arrow-right"></i> Đăng xuất
                    </button>
                </div>
            </aside>

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
                        <div className="messages">
                            {messages.map((m, i) => (
                                <div key={i} className={`msg ${m.role}`}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setContextMenu({ x: e.clientX, y: e.clientY, index: i });
                                    }}
                                    onTouchStart={(e) => {
                                        longPressTimer.current = setTimeout(() => {
                                            const touch = e.touches[0];
                                            setContextMenu({ x: touch.clientX, y: touch.clientY, index: i });
                                        }, 600);
                                    }}
                                    onTouchEnd={() => {
                                        clearTimeout(longPressTimer.current);
                                    }}
                                >
                                    <div className="bubble">{m.content}</div>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>

                        <div className="composer">
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
                    <div className="empty">Chọn hoặc tạo một nhân vật để bắt đầu chat</div>
                )}
            </main>

            {confirmDelete && (
                <ConfirmModal
                    message="Bạn có chắc muốn xóa từ đoạn chat này trở về sau?"
                    onCancel={() => setConfirmDelete(null)}
                    onConfirm={async () => {
                        try {
                            const updated = await deleteChatFrom(
                                confirmDelete.personaId,
                                confirmDelete.index
                            );
                            setMessages(updated);
                            alertify.success('Xóa thành cônng');
                        } catch (err) {
                            console.error("Xóa chat lỗi", err);
                            alertify.error('Xóa thất bại');
                        }
                        setConfirmDelete(null);
                    }}
                />
            )}

            {confirmDeletePersona && (
                <ConfirmModal
                    message={`Bạn có chắc muốn xóa nhân vật "${confirmDeletePersona.name}" và toàn bộ lịch sử chat không?`}
                    onCancel={() => setConfirmDeletePersona(null)}
                    onConfirm={async () => {
                        try {
                            await deletePersona(confirmDeletePersona._id);
                            setPersonas((prev) =>
                                prev.filter((p) => p._id !== confirmDeletePersona._id)
                            );
                            setSelectedPersona(null);
                            setMessages([]);
                            alertify.success('Xóa thành cônng');
                        } catch (err) {
                            console.error("Xóa persona lỗi", err);
                            alertify.error('Xóa thất bại');
                        }
                        setConfirmDeletePersona(null);
                    }}
                />
            )}


            {formMode && (
                <PersonaFormModal
                    mode={formMode}
                    initialData={formMode === "edit" ? selectedPersona : null}
                    onClose={() => setFormMode(null)}
                    onSubmit={async (data) => {
                        if (formMode === "create") {
                            try {
                                const created = await createPersona({ ...data, rules: [] });
                                setPersonas((prev) => [...prev, created]);
                                setSelectedPersona(created);
                            } catch (err) {
                                alertify.error('Tạo nhân vật thất bại');
                            }
                        } else if (formMode === "edit") {
                            try {
                                const updated = await updatePersona(selectedPersona._id, data);
                                setPersonas((prev) =>
                                    prev.map((p) => (p._id === updated._id ? updated : p))
                                );
                                setSelectedPersona(updated);
                            } catch (err) {
                                alertify.error('Cập nhật nhân vật thất bại');
                            }
                        }
                        setFormMode(null);
                    }}
                />
            )}

        </div>
    );
}
