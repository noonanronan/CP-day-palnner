import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/login.css";

const LoginPage = () => {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem("isAuthenticated", "true");
                navigate("/workers");
            } else {
                setError("Incorrect password. Try again.");
            }
        } catch {
            setError("Could not connect to server.");
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} autoComplete="off">
                <div className="login-brand">Day Planner</div>
                <h2>Welcome back</h2>
                <p className="login-subtitle">Enter your password to access the planner</p>
                <label className="login-label">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="new-password"
                />
                {error && <p className="error">{error}</p>}
                <button type="submit">Sign In</button>
            </form>
        </div>
    );
};

export default LoginPage;
