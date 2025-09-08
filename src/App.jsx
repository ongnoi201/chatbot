import { useState, useEffect } from "react";
import Auth from "./components/Auth";
import Chat from "./components/Chat";
import { jwtDecode } from "jwt-decode";

export default function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        if (token && storedUser) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 > Date.now()) {
                    setUser(JSON.parse(storedUser));
                } else {
                    handleLogout();
                }
            } catch (err) {
                console.error("Token không hợp lệ:", err);
                handleLogout();
            }
        }
    }, []);

    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    }

    if (!user) return <Auth onAuth={setUser} />;
    return <Chat user={user} onLogout={handleLogout} />;
}
