import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import axios from "axios";
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

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

function App() {
  useEffect(() => {
    // Track site visit on initial load
    const trackVisit = async () => {
      try {
        // Use sessionStorage to ensure we only count 1 visit per active session
        if (!sessionStorage.getItem("hasVisited")) {
          await axios.get(`${API_URL}/track-visit`);
          sessionStorage.setItem("hasVisited", "true");
        }
      } catch (err) {
        console.error("Failed to track visit", err);
      }
    };
    trackVisit();

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

      // Mac Screenshot behavior: Immediately mask the screen if trying to use Cmd+Shift+3/4/5
      if (e.metaKey && e.shiftKey) {
        // We do this aggressively for any Cmd+Shift because Mac intercepts keys like "4" early.
        document.body.style.opacity = '0'; // Mask the screen
      }

      // Prevent Ctrl+S, Ctrl+P, F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      // Use (e.ctrlKey || e.metaKey) to cover Mac Command key
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) || // Save
        ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) || // Print
        e.key === "F12" || // Devtools
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) || // DevTools
        ((e.ctrlKey || e.metaKey) && (e.key === "U" || e.key === "u")) // View Source
      ) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      // Restore screen when keys are released
      if (!e.metaKey || !e.shiftKey) {
        document.body.style.opacity = '1';
      }
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('');
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

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
      window.removeEventListener("keyup", handleKeyUp);
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
