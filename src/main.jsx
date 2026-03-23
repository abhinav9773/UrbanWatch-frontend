import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "react-hot-toast";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#0a1a12",
            color: "#e0ffe8",
            border: "1px solid rgba(0,255,136,0.2)",
            borderRadius: "0px",
            fontFamily: "'DM Mono', monospace",
            fontSize: "12px",
            letterSpacing: "0.05em",
            padding: "12px 16px",
            boxShadow: "0 0 24px rgba(0,255,136,0.1)",
          },
          success: {
            style: {
              borderLeft: "3px solid #00ff88",
            },
            iconTheme: {
              primary: "#00ff88",
              secondary: "#0a1a12",
            },
          },
          error: {
            style: {
              borderLeft: "3px solid #ff4466",
            },
            iconTheme: {
              primary: "#ff4466",
              secondary: "#0a1a12",
            },
          },
          loading: {
            style: {
              borderLeft: "3px solid #0099ff",
            },
            iconTheme: {
              primary: "#0099ff",
              secondary: "#0a1a12",
            },
          },
        }}
      />
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
