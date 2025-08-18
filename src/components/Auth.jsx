import { useState } from "react";
import { login, register } from "../api";
import './Auth.css';

export default function Auth({ onAuth }) {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            let data;
            if (isRegister) {
                data = await register({ email, password, name });
            } else {
                data = await login({ email, password });
            }
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            onAuth(data.user);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="auth-container">
            <h2>{isRegister ? "Đăng ký" : "Đăng nhập"}</h2>
            {error && <div className="error">{error}</div>}
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
