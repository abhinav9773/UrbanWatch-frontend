import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "react-hot-toast";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "./context/AuthContext";

// Restore theme before first paint (avoids flash)
const savedTheme = localStorage.getItem("uw-theme");
if (savedTheme === "light") {
  document.documentElement.setAttribute("data-theme", "light");
}

function ThemedToaster() {
  // Read CSS vars at render time — updates when theme toggles
  const isDark = document.documentElement.getAttribute("data-theme") !== "light";

  const base = {
    background:  isDark ? "#18181b" : "#ffffff",
    color:       isDark ? "#fafafa" : "#09090b",
    border:      `1px solid ${isDark ? "#27272a" : "#e4e4e7"}`,
    borderRadius: "8px",
    fontFamily:  "'Geist', sans-serif",
    fontSize:    "13px",
    padding:     "12px 16px",
    boxShadow:   isDark
      ? "0 4px 20px rgba(0,0,0,0.5)"
      : "0 4px 20px rgba(0,0,0,0.08)",
  };

  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3500,
        style: base,
        success: {
          style: { ...base, borderLeft: "3px solid #22c55e" },
          iconTheme: { primary: "#22c55e", secondary: isDark ? "#18181b" : "#fff" },
        },
        error: {
          style: { ...base, borderLeft: "3px solid #ef4444" },
          iconTheme: { primary: "#ef4444", secondary: isDark ? "#18181b" : "#fff" },
        },
        loading: {
          style: { ...base, borderLeft: "3px solid #3b82f6" },
          iconTheme: { primary: "#3b82f6", secondary: isDark ? "#18181b" : "#fff" },
        },
      }}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemedToaster />
      <App />
    </AuthProvider>
  </React.StrictMode>,
);

