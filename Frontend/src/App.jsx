import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import CreateProfile from "./pages/CreateProfile";
import Dashboard from "./pages/Dashboard";
import ProfileView from "./pages/ProfileView";
import Chat from "./pages/chat";
import MyProfile from "./pages/MyProfile";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  useEffect(() => {
    // Disable right click
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // Disable common keyboard shortcuts
    const handleKeyDown = (e) => {
      // Prevent PrintScreen (doesn't work on all browsers, but deters some)
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText(''); // Clear clipboard as deterrence
        e.preventDefault();
      }

      // Prevent Ctrl+S, Ctrl+P, F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        (e.ctrlKey && (e.key === "s" || e.key === "S")) || // Save
        (e.ctrlKey && (e.key === "p" || e.key === "P")) || // Print
        e.key === "F12" || // Devtools
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) || // DevTools
        (e.ctrlKey && (e.key === "U" || e.key === "u")) || // View Source
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) // Mac Screenshot shortcuts (partially catchable)
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    // Some screen recording extensions / snipping tools trigger blur when activated
    // While aggressive, hiding the body when lost focus deters screenshots
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.body.style.filter = "blur(10px) grayscale(100%)";
      } else {
        document.body.style.filter = "none";
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

       
        <Route
          path="/create-profile"
          element={
            <ProtectedRoute>
              <CreateProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/:profileId"
          element={
            <ProtectedRoute>
              <ProfileView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:friendId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-profile"
          element={
            <ProtectedRoute>
              <MyProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings/>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
              <AdminPanel/>
          }
        />

      </Routes>
    </>
  );
}

export default App;
