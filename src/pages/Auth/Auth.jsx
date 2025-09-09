import { useState } from "react";
import { login, register, subscribeUserToPush } from "../../api";
import './Auth.css';
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
import "alertifyjs/build/css/themes/default.css";
import { useNavigate } from "react-router-dom";

export default function Auth({ onAuth }) {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const navigate = useNavigate();

    alertify.set('notifier', 'position', 'bottom-center');
    alertify.set('notifier', 'delay', 3);

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            let data;
            if (isRegister) {
                data = await register({ email, password, name });
                setIsRegister(false);
            } else {
                data = await login({ email, password });
                alertify.success("✅Đăng nhập thành công!")
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                const clientVapidKey = import.meta.env.VITE_APP_VAPID_PUBLIC_KEY;
                subscribeUserToPush(clientVapidKey);
                onAuth(data.user);
                navigate('/chat');
            }
        } catch (err) {
            alertify.error(err.message);
        }
    }

    return (
        <div className="auth-container animate__animated animate__backInUp">
            <h2>{isRegister ? "Đăng ký" : "Đăng nhập"}</h2>
            <form onSubmit={handleSubmit}>
                {isRegister && (
                    <input
                        placeholder="Tên"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                )}
                <input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    placeholder="Mật khẩu"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">{isRegister ? "Đăng ký" : "Đăng nhập"}</button>
            </form>
            <p>
                {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
                <span onClick={() => setIsRegister(!isRegister)}>
                    {isRegister ? "Đăng nhập" : "Đăng ký"}
                </span>
            </p>
        </div>
    );
}
