import React, { useState, useEffect, useRef } from "react";
import { RgbaColorPicker } from "react-colorful";
import "./Setting.css";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
import "alertifyjs/build/css/themes/default.css";

const toRgbaString = (rgba) =>
    `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;

export default function Setting() {
    const defaultSettings = {
        theme: "light",
        menuColor: { r: 19, g: 6, b: 94, a: 1 },
        headerIconColor: { r: 19, g: 6, b: 94, a: 1 },
        aiMessageBg: { r: 224, g: 224, b: 224, a: 0.8 },
        aiMessageText: { r: 34, g: 34, b: 34, a: 1 },
        userMessageBg: { r: 218, g: 247, b: 210, a: 1 },
        userMessageText: { r: 34, g: 34, b: 34, a: 1 },
        inputBoxColor: { r: 255, g: 255, b: 255, a: 0.65 },
        font: "Noto Sans",
    };

    alertify.set("notifier", "position", "bottom-center");
    alertify.set("notifier", "delay", 3);

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem("chatSettings");
        return saved ? JSON.parse(saved) : defaultSettings;
    });

    useEffect(() => {
        localStorage.setItem("chatSettings", JSON.stringify(settings));
        document.documentElement.setAttribute("data-theme", settings.theme);
        document.body.style.fontFamily = `"${settings.font}", sans-serif`;

        document.documentElement.style.setProperty(
            "--menu-color",
            toRgbaString(settings.menuColor)
        );
        document.documentElement.style.setProperty(
            "--header-icon-color",
            toRgbaString(settings.headerIconColor)
        );
        document.documentElement.style.setProperty(
            "--ai-msg-bg",
            toRgbaString(settings.aiMessageBg)
        );
        document.documentElement.style.setProperty(
            "--ai-msg-text",
            toRgbaString(settings.aiMessageText)
        );
        document.documentElement.style.setProperty(
            "--user-msg-bg",
            toRgbaString(settings.userMessageBg)
        );
        document.documentElement.style.setProperty(
            "--user-msg-text",
            toRgbaString(settings.userMessageText)
        );
        document.documentElement.style.setProperty(
            "--input-box-color",
            toRgbaString(settings.inputBoxColor)
        );
    }, [settings]);

    const handleColorChange = (name, value) => {
        setSettings((prev) => ({ ...prev, [name]: value }));
    };

    // Component chọn màu
    const ColorField = ({ label, name }) => {
        const [open, setOpen] = useState(false);
        const popupRef = useRef(null);
        const previewRef = useRef(null);

        useEffect(() => {
            const handleClickOutside = (e) => {
                if (
                    popupRef.current &&
                    !popupRef.current.contains(e.target) &&
                    previewRef.current &&
                    !previewRef.current.contains(e.target)
                ) {
                    setOpen(false);
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, []);

        return (
            <div className="setting-item">
                <label>{label}</label>
                <div
                    ref={previewRef}
                    className="color-preview"
                    style={{ background: toRgbaString(settings[name]) }}
                    onClick={() => setOpen((o) => !o)}
                />
                {open && (
                    <div ref={popupRef} className="color-picker-popup">
                        <RgbaColorPicker
                            color={settings[name]}
                            onChange={(c) => handleColorChange(name, c)}
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="settings-container">
            <h2>Cài đặt</h2>

            {/* Chế độ sáng/tối */}
            <div className="setting-item">
                <label>Chế độ:</label>
                <select
                    name="theme"
                    value={settings.theme}
                    onChange={(e) =>
                        setSettings((prev) => ({ ...prev, theme: e.target.value }))
                    }
                >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                </select>
            </div>

            {/* Màu sắc */}
            <h3>Tùy chỉnh giao diện chat</h3>
            <ColorField label="Màu menu context" name="menuColor" />
            <ColorField label="Màu icon header" name="headerIconColor" />
            <ColorField label="Màu nền tin nhắn AI" name="aiMessageBg" />
            <ColorField label="Màu chữ tin nhắn AI" name="aiMessageText" />
            <ColorField label="Màu nền tin nhắn Người" name="userMessageBg" />
            <ColorField label="Màu chữ tin nhắn Người" name="userMessageText" />
            <ColorField label="Màu khung nhập" name="inputBoxColor" />

            {/* Font chữ */}
            <h3>Font chữ</h3>
            <div className="setting-item">
                <label>Chọn font:</label>
                <select
                    name="font"
                    value={settings.font}
                    onChange={(e) =>
                        setSettings((prev) => ({ ...prev, font: e.target.value }))
                    }
                >
                    <option value="Arial">Arial</option>
                    <option value="Noto Sans">Noto Sans</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                </select>
            </div>

            <button
                className="resetSetting"
                onClick={() => {
                    localStorage.removeItem("chatSettings");
                    setSettings(defaultSettings);
                    alertify.success("✅Đã xóa toàn bộ lịch sử");
                }}
            >
                Đặt lại mặc định
            </button>
        </div>
    );
}
