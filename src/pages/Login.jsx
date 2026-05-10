import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

function SunIcon() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/>
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [theme, setTheme]       = useState("dark");
  const navigate = useNavigate();
  const { login } = useAuth();

  // Restore theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("uw-theme");
    if (saved === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("uw-theme", next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email, password });
      const { user, token } = res.data;
      login(user, token);
      toast.success("Welcome back");
      if (user.role === "ADMIN")         navigate("/admin");
      else if (user.role === "ENGINEER") navigate("/dashboard");
      else                               navigate("/citizen");
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      fontFamily: "'Geist', sans-serif",
      color: "var(--text)",
      transition: "background 0.22s",
    }}>
      {/* ── Left — decorative panel ── */}
      <div className="login-left-panel" style={{
        flex: 1,
        background: "var(--bg-subtle)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 48,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Grid */}
        <div
  style={{
    position: "absolute",
    inset: 0,
    backgroundImage: "url('/Backdrop.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    opacity: 0.4,
  }}
/>  
        {/* Glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 30% 50%, rgba(59,130,246,0.06) 0%, transparent 65%)",
        }} />

        {/* Logo top-left */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, background: "var(--accent)", borderRadius: 11,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L4 9V21H9V15H15V21H20V9L12 3Z" fill="white" fillOpacity="0.95"/>
              <circle cx="12" cy="11" r="2.5" fill="rgba(0,0,0,0.25)"/>
            </svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>
            UrbanWatch
          </span>
        </div>

        {/* Hero copy */}
        <div style={{ position: "relative", maxWidth: 400 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: 20,
            background: "var(--accent-lo)", border: "1px solid rgba(59,130,246,0.25)",
            fontSize: 11, fontWeight: 600, color: "var(--accent)",
            letterSpacing: "0.05em", textTransform: "uppercase",
            marginBottom: 20,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulse 2s infinite" }} />
            System Online
          </div>
          <h2 style={{
            fontSize: 36, fontWeight: 800, color: "var(--text)",
            margin: "0 0 16px", lineHeight: 1.15, letterSpacing: "-0.04em",
          }}>
            Civic infrastructure,<br />intelligently monitored.
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.75, margin: 0 }}>
            Real-time issue tracking, AI-powered priority assignment, and transparent resolution — built for modern cities.
          </p>
        </div>

        {/* Stats */}
        <div style={{ position: "relative", display: "flex", gap: 36 }}>
          {[
            { label: "Issues tracked",   value: "12,400+" },
            { label: "Avg. resolution",  value: "4.2 days" },
            { label: "Active engineers", value: "340" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right — form ── */}
      <div style={{
        width: 460,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "64px 52px",
        position: "relative",
        animation: "fadeUp 0.3s ease",
      }}>
        {/* Theme toggle top-right */}
        <button
          onClick={toggleTheme}
          className="uw-theme-toggle"
          style={{ position: "absolute", top: 28, right: 28 }}
          title={theme === "dark" ? "Switch to light" : "Switch to dark"}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 10px", color: "var(--text)" }}>
            Sign in
          </h1>
          <div style={{ fontSize: 14, color: "var(--text-2)" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
              Create one
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label className="uw-label">Email address</label>
            <input
              type="email" placeholder="you@example.com" className="uw-input"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required autoFocus
            />
          </div>

          <div>
            <label className="uw-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"} placeholder="••••••••" className="uw-input"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "var(--text-3)",
                display: "flex", alignItems: "center", padding: 0,
              }}>
                {showPass
                  ? <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                  : <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="uw-btn-primary" style={{
            width: "100%", height: 42, justifyContent: "center", fontSize: 14, marginTop: 4,
            fontWeight: 600,
          }}>
            {loading
              ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> Signing in…</>
              : "Sign in to UrbanWatch"
            }
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>Secure access</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Trust badges */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          {["TLS 1.3", "SOC-2 Ready", "Real-time sync"].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-3)" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5.5" stroke="var(--border-hi)"/>
                <path d="M3.5 6l2 2 3-3" stroke="var(--green)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) { .login-left-panel { display: none !important; } }
      `}</style>
    </div>
  );
}
