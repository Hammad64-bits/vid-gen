import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Pricing } from "./components/Pricing";
import { Footer } from "./components/Footer";

import "./App.css";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";

import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

function App() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const params = new URLSearchParams(window.location.search);
  const hasTokenHash = params.get("token_hash");

  const [verifying, setVerifying] = useState(!!hasTokenHash);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");
    const type = params.get("type");

    if (token_hash) {
      supabase.auth
        .verifyOtp({
          token_hash,
          type: (type as any) || "email",
        })
        .then(({ error }) => {
          if (error) {
            setAuthError(error.message);
          } else {
            setAuthSuccess(true);
            window.history.replaceState({}, document.title, "/");
          }

          setVerifying(false);
        });
    } else {
      setVerifying(false);
    }

    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Check your email for the login link!");
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (verifying) {
    return (
      <div>
        <h1>Authentication</h1>
        <p>Confirming your magic link...</p>
        <p>Loading...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div>
        <h1>Authentication</h1>
        <p>✗ Authentication failed</p>
        <p>{authError}</p>

        <button
          onClick={() => {
            setAuthError(null);
            window.history.replaceState({}, document.title, "/");
          }}
        >
          Return to login
        </button>
      </div>
    );
  }

  if (authSuccess && !user) {
    return (
      <div>
        <h1>Authentication</h1>
        <p>✓ Authentication successful!</p>
        <p>Loading your account...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div>
        <h1>Welcome!</h1>
        <p>You are logged in as: {user.email}</p>

        <button onClick={handleLogout}>Sign Out</button>
      </div>
    );
  }

  return (
    <>
      {/* Login Form */}
      <form onSubmit={handleLogin} style={{ padding: "2rem" }}>
        <h2>Login with Magic Link</h2>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Magic Link"}
        </button>
      </form>

      {/* Landing Page */}
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Footer />
      </main>
    </>
  );
}

export default App;
