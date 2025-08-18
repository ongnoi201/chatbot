import { useState, useEffect } from "react";
import Auth from "./components/Auth";
import Chat from "./components/Chat";

export default function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
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
