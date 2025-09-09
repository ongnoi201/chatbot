import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import Auth from "./pages/Auth/Auth";
import Chat from "./pages/Chat/Chat";
import Profile from "./pages/Profile/Profile";
import './app.css';
import Setting from "./pages/Setting/Setting";

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
            } catch {
                handleLogout();
            }
        }
    }, []);

    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    }

    return (
        <BrowserRouter>
            <Routes>
                {!user ? (
                    <Route path="*" element={<Auth onAuth={setUser} />} />
                ) : (
                    <>
                        <Route path="/chat" element={<Chat user={user} />} />
                        <Route path="/profile" element={<Profile onLogout={handleLogout} />} />
                        <Route path="/setting" element={<Setting />} />
                        <Route path="*" element={<Navigate to="/chat" />} />
                    </>
                )}
            </Routes>
        </BrowserRouter>
    );
}
