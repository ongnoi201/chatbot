import { useRef, useState, useEffect } from "react";
export default function ContextMenu({ x, y, onClose, onCopy, onDelete }) {
    const menuRef = useRef(null);
    const [position, setPosition] = useState({ left: x, top: y });

    useEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;

        const { innerWidth, innerHeight } = window;
        const { offsetWidth, offsetHeight } = menu;

        let newX = x;
        let newY = y;

        if (x + offsetWidth > innerWidth) {
            newX = innerWidth - offsetWidth - 10;
        }
        if (y + offsetHeight > innerHeight) {
            newY = innerHeight - offsetHeight - 10;
        }

        setPosition({ left: newX, top: newY });
    }, [x, y]);

    return (
        <div
            ref={menuRef}
            className="context-menu"
            style={{ top: position.top, left: position.left }}
            onClick={onClose}
        >
            <button onClick={onCopy}>📋 Sao chép</button>
            <button onClick={onDelete}>🗑️ Xóa từ đây</button>
        </div>
    );
}
