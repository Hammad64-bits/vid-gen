import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        navigate("/dashboard");
    };

    return (
        <div className="auth-page">
            {/* Ambient glow blobs */}
            <div className="auth-blob auth-blob--primary" />
            <div className="auth-blob auth-blob--secondary" />

            <div className="auth-card glass-panel">
                {/* Logo / Brand */}
                <div className="auth-brand">
                    <span className="auth-logo-icon">🎬</span>
                    <span className="auth-logo-text accent-font">VidGen</span>
                </div>

                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle">Sign in to your account to continue</p>

                {error && (
                    <div className="auth-error" role="alert">
                        <span>⚠</span> {error}
                    </div>
                )}

                <div className="auth-form" id="login-form">
                    <div className="auth-field">
                        <label htmlFor="login-email" className="auth-label">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            className="auth-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="login-password" className="auth-label">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            className="auth-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        />
                    </div>

                    <button
                        id="login-submit"
                        className="btn btn-primary auth-submit"
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <><span className="btn-spinner" /> Signing in...</>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </div>

                <p className="auth-switch">
                    Don't have an account?{" "}
                    <Link to="/signup" className="auth-link">Create one</Link>
                </p>

                <p className="auth-back">
                    <Link to="/" className="auth-link auth-link--muted">← Back to home</Link>
                </p>
            </div>
        </div>
    );
}