import { createContext, useContext, useState, useEffect } from "react";
import socket from "../socket"; // 🔥 Socket.IO

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const getUserFromStorage = () => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState(getUserFromStorage());

  // 🔔 Join socket room when user logs in
  useEffect(() => {
    if (user?._id && user?.role) {
      socket.emit("join", {
        userId: user._id,
        role: user.role,
      });

      console.log("Joined socket room:", user._id, user.role);
    }
  }, [user]);

  const login = (userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);

    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);

    // Optional: disconnect socket on logout
    socket.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
