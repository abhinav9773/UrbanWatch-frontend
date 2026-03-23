import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [mounted, setMounted] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email, password });
      const { user, token } = res.data;
      login(user, token);
      toast.success("Login successful ✅");
      if (user.role === "ADMIN") navigate("/admin");
      else if (user.role === "ENGINEER") navigate("/dashboard");
      else navigate("/citizen");
    } catch {
      toast.error("Invalid credentials ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050a0f",
        display: "flex",
        overflow: "hidden",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {/* Animated city grid background */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');

        @keyframes gridPulse {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.08; }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 136, 0.15); }
          50% { box-shadow: 0 0 40px rgba(0, 255, 136, 0.35); }
        }
        @keyframes dotFloat {
          0%, 100% { transform: translateY(0px); opacity: 0.4; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
        .uw-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(0,255,136,0.2);
          color: #e0ffe8;
          padding: 12px 0;
          font-family: 'DM Mono', monospace;
          font-size: 14px;
          outline: none;
          transition: border-color 0.3s;
          letter-spacing: 0.05em;
        }
        .uw-input:focus {
          border-bottom-color: #00ff88;
        }
        .uw-input::placeholder {
          color: rgba(0,255,136,0.25);
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .uw-btn {
          position: relative;
          width: 100%;
          background: #00ff88;
          color: #050a0f;
          border: none;
          padding: 14px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s;
          clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
        }
        .uw-btn:hover:not(:disabled) {
          background: #00ffaa;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,255,136,0.4);
        }
        .uw-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .grid-line-h {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,255,136,0.15), transparent);
          animation: gridPulse 4s ease-in-out infinite;
        }
        .grid-line-v {
          position: absolute;
          top: 0; bottom: 0;
          width: 1px;
          background: linear-gradient(180deg, transparent, rgba(0,255,136,0.15), transparent);
          animation: gridPulse 4s ease-in-out infinite;
        }
        .scanline {
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(0,255,136,0.08), transparent);
          animation: scanline 8s linear infinite;
          pointer-events: none;
        }
        .corner-bracket::before, .corner-bracket::after {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          border-color: rgba(0,255,136,0.5);
          border-style: solid;
        }
        .corner-tl::before { top: -1px; left: -1px; border-width: 1px 0 0 1px; }
        .corner-tr::after { top: -1px; right: -1px; border-width: 1px 1px 0 0; }
        .corner-bl::before { bottom: -1px; left: -1px; border-width: 0 0 1px 1px; }
        .corner-br::after { bottom: -1px; right: -1px; border-width: 0 1px 1px 0; }
      `}</style>

      {/* Left panel — branding */}
      <div
        style={{
          flex: 1,
          display: "none",
          position: "relative",
          overflow: "hidden",
          borderRight: "1px solid rgba(0,255,136,0.06)",
        }}
        className="left-panel"
      >
        {/* Grid lines */}
        {[15, 30, 45, 60, 75].map((pct) => (
          <div
            key={pct}
            className="grid-line-h"
            style={{ top: `${pct}%`, animationDelay: `${pct * 0.1}s` }}
          />
        ))}
        {[20, 40, 60, 80].map((pct) => (
          <div
            key={pct}
            className="grid-line-v"
            style={{ left: `${pct}%`, animationDelay: `${pct * 0.05}s` }}
          />
        ))}
      </div>

      {/* Right panel — form */}
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 48px",
          position: "relative",
          animation: mounted ? "slideUp 0.6s ease forwards" : "none",
        }}
      >
        <div className="scanline" />

        {/* Logo area */}
        <div style={{ marginBottom: "56px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "1px solid #00ff88",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  background: "#00ff88",
                  animation: "glowPulse 2s ease infinite",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "20px",
                fontWeight: 800,
                color: "#e0ffe8",
                letterSpacing: "0.05em",
              }}
            >
              URBAN<span style={{ color: "#00ff88" }}>WATCH</span>
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingLeft: "44px",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "1px",
                background: "rgba(0,255,136,0.4)",
              }}
            />
            <span
              style={{
                color: "rgba(0,255,136,0.4)",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Civil Infrastructure Monitor
            </span>
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <div
            style={{
              color: "rgba(0,255,136,0.5)",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            // System Access
          </div>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "42px",
              fontWeight: 800,
              color: "#e0ffe8",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Sign
            <br />
            <span style={{ color: "#00ff88" }}>In.</span>
          </h1>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "32px" }}
        >
          {/* Email field */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                color: "rgba(0,255,136,0.4)",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Email Address
            </div>
            <input
              type="email"
              placeholder="user@example.com"
              className="uw-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              required
            />
            {focused === "email" && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: "12px",
                  width: "6px",
                  height: "12px",
                  background: "#00ff88",
                  animation: "blink 1s step-end infinite",
                }}
              />
            )}
          </div>

          {/* Password field */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                color: "rgba(0,255,136,0.4)",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Password
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="uw-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              required
            />
            {focused === "password" && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: "12px",
                  width: "6px",
                  height: "12px",
                  background: "#00ff88",
                  animation: "blink 1s step-end infinite",
                }}
              />
            )}
          </div>

          {/* Submit */}
          <div style={{ marginTop: "8px" }}>
            <button type="submit" disabled={loading} className="uw-btn">
              {loading ? "Authenticating..." : "Access System"}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: "40px",
            borderTop: "1px solid rgba(0,255,136,0.08)",
            paddingTop: "24px",
          }}
        >
          <span style={{ color: "rgba(0,255,136,0.35)", fontSize: "12px" }}>
            New user?{" "}
            <Link
              to="/register"
              style={{
                color: "#00ff88",
                textDecoration: "none",
                borderBottom: "1px solid rgba(0,255,136,0.3)",
              }}
            >
              Request access
            </Link>
          </span>
        </div>

        {/* Corner decorations */}
        <div
          style={{
            position: "absolute",
            top: "24px",
            left: "24px",
            width: "24px",
            height: "24px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "12px",
              height: "1px",
              background: "rgba(0,255,136,0.3)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1px",
              height: "12px",
              background: "rgba(0,255,136,0.3)",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            right: "24px",
            width: "24px",
            height: "24px",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: "12px",
              height: "1px",
              background: "rgba(0,255,136,0.3)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: "1px",
              height: "12px",
              background: "rgba(0,255,136,0.3)",
            }}
          />
        </div>

        {/* Status dot */}
        <div
          style={{
            position: "absolute",
            top: "32px",
            right: "32px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#00ff88",
              animation: "glowPulse 2s ease infinite",
            }}
          />
          <span
            style={{
              color: "rgba(0,255,136,0.4)",
              fontSize: "10px",
              letterSpacing: "0.15em",
            }}
          >
            SYS ONLINE
          </span>
        </div>
      </div>
    </div>
  );
}
