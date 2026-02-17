import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CitizenDashboard from "./pages/CitizenDashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

// 🔁 Smart Home Redirect
function HomeRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  if (user.role === "ADMIN") return <Navigate to="/admin" />;
  if (user.role === "ENGINEER") return <Navigate to="/dashboard" />;
  if (user.role === "CITIZEN") return <Navigate to="/citizen" />;

  return <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Smart Home */}
        <Route path="/" element={<HomeRedirect />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Engineer */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="ENGINEER">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Citizen */}
        <Route
          path="/citizen"
          element={
            <ProtectedRoute role="CITIZEN">
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
