import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";
import "./dashboard.css";

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
        });
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    return (
        <div className="dashboard-page">
            {/* Ambient blobs */}
            <div className="db-blob db-blob--primary" />
            <div className="db-blob db-blob--secondary" />

            {/* Top Nav */}
            <header className="db-nav glass-panel">
                <div className="db-nav-brand">
                    <span className="db-nav-icon">🎬</span>
                    <span className="db-nav-title accent-font">VidGen</span>
                </div>
                <div className="db-nav-right">
                    {user && (
                        <span className="db-user-email" title={user.email}>
                            {user.email}
                        </span>
                    )}
                    <button
                        id="dashboard-logout"
                        className="btn btn-outline db-logout-btn"
                        onClick={logout}
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Hero welcome */}
            <main className="db-main container">
                <section className="db-welcome">
                    <h1 className="db-welcome-title">
                        Welcome back
                        {user?.email && (
                            <span className="text-gradient"> 👋</span>
                        )}
                    </h1>
                    <p className="db-welcome-sub">
                        Create, manage, and export stunning AI-generated videos.
                    </p>
                </section>

                {/* Quick actions */}
                <section className="db-actions">
                    <button id="db-new-video" className="db-action-card glass-panel db-action-card--primary">
                        <span className="db-action-icon">✨</span>
                        <span className="db-action-label">New Video</span>
                        <span className="db-action-desc">Generate from a prompt</span>
                    </button>

                    <button id="db-my-videos" className="db-action-card glass-panel">
                        <span className="db-action-icon">🎞️</span>
                        <span className="db-action-label">My Videos</span>
                        <span className="db-action-desc">Browse your library</span>
                    </button>

                    <button id="db-templates" className="db-action-card glass-panel">
                        <span className="db-action-icon">🗂️</span>
                        <span className="db-action-label">Templates</span>
                        <span className="db-action-desc">Start from a template</span>
                    </button>

                    <button id="db-settings" className="db-action-card glass-panel">
                        <span className="db-action-icon">⚙️</span>
                        <span className="db-action-label">Settings</span>
                        <span className="db-action-desc">Manage your account</span>
                    </button>
                </section>

                {/* Stats strip */}
                <section className="db-stats">
                    <div className="db-stat glass-panel">
                        <span className="db-stat-value text-gradient">0</span>
                        <span className="db-stat-label">Videos Created</span>
                    </div>
                    <div className="db-stat glass-panel">
                        <span className="db-stat-value text-gradient">0</span>
                        <span className="db-stat-label">Minutes Generated</span>
                    </div>
                    <div className="db-stat glass-panel">
                        <span className="db-stat-value text-gradient">—</span>
                        <span className="db-stat-label">Plan</span>
                    </div>
                </section>
            </main>
        </div>
    );
}