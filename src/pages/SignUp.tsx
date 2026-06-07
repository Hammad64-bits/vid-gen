import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";

export default function SignUp() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSignup = async () => {
        setError(null);

        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.signUp({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);

        // Redirect after a moment
        setTimeout(() => navigate("/login"), 2000);
    };

    return (
        <div className="auth-page">
            <div className="auth-blob auth-blob--primary" />
            <div className="auth-blob auth-blob--secondary" />

            <div className="auth-card glass-panel">
                <div className="auth-brand">
                    <span className="auth-logo-icon">🎬</span>
                    <span className="auth-logo-text accent-font">VidGen</span>
                </div>

                <h1 className="auth-title">Create account</h1>
                <p className="auth-subtitle">Start generating stunning videos in minutes</p>

                {error && (
                    <div className="auth-error" role="alert">
                        <span>⚠</span> {error}
                    </div>
                )}

                {success && (
                    <div className="auth-success" role="status">
                        <span>✓</span> Account created! Redirecting to login…
                    </div>
                )}

                <div className="auth-form" id="signup-form">
                    <div className="auth-field">
                        <label htmlFor="signup-email" className="auth-label">Email</label>
                        <input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            className="auth-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="signup-password" className="auth-label">Password</label>
                        <input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            className="auth-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="signup-confirm" className="auth-label">Confirm Password</label>
                        <input
                            id="signup-confirm"
                            type="password"
                            placeholder="••••••••"
                            className="auth-input"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                        />
                    </div>

                    <button
                        id="signup-submit"
                        className="btn btn-primary auth-submit"
                        onClick={handleSignup}
                        disabled={loading || success}
                    >
                        {loading ? (
                            <><span className="btn-spinner" /> Creating account…</>
                        ) : (
                            "Create Account"
                        )}
                    </button>
                </div>

                <p className="auth-switch">
                    Already have an account?{" "}
                    <Link to="/login" className="auth-link">Sign in</Link>
                </p>

                <p className="auth-back">
                    <Link to="/" className="auth-link auth-link--muted">← Back to home</Link>
                </p>
            </div>
        </div>
    );
}