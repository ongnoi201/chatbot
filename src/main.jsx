import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

function toRgbaString(rgba) {
    if (typeof rgba === "string") return rgba;
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
}

function applyChatTheme() {
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

    const saved = localStorage.getItem("chatSettings");
    const settings = saved ? JSON.parse(saved) : defaultSettings;

    document.documentElement.setAttribute("data-theme", settings.theme);
    document.body.style.fontFamily = settings.font;

    document.documentElement.style.setProperty("--menu-color", toRgbaString(settings.menuColor));
    document.documentElement.style.setProperty("--header-icon-color", toRgbaString(settings.headerIconColor));
    document.documentElement.style.setProperty("--ai-msg-bg", toRgbaString(settings.aiMessageBg));
    document.documentElement.style.setProperty("--ai-msg-text", toRgbaString(settings.aiMessageText));
    document.documentElement.style.setProperty("--user-msg-bg", toRgbaString(settings.userMessageBg));
    document.documentElement.style.setProperty("--user-msg-text", toRgbaString(settings.userMessageText));
    document.documentElement.style.setProperty("--input-box-color", toRgbaString(settings.inputBoxColor));
}


applyChatTheme();

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
    </StrictMode>
);
