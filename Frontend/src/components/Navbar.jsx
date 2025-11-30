import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

  const loadUserData = () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  useEffect(() => {
    loadUserData();
    fetchSubscription();
  }, []);

  useEffect(() => {
    loadUserData();
  }, [location.pathname]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user" || e.key === "token") {
        loadUserData();
      }
    };

    const handleUserUpdate = () => {
      loadUserData();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userDataUpdated", handleUserUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userDataUpdated", handleUserUpdate);
    };
  }, []);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        `${API_URL}/subscriptions/my-subscription`,
        config
      );
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
    setUser(null);
    setDropdownOpen(false);
    setMobileMenuOpen(false);

    navigate("/");
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest(".user-dropdown")) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    const handleFocus = () => loadUserData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  return (
    <nav className="w-full bg-slate-900/95 backdrop-blur-md shadow-xl border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="logo text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"
            >
              Bharti Matrimony
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200"
            >
              Home
            </Link>
            <Link
              to="/#packages"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200"
            >
              Packages
            </Link>
            <Link
              to="/#stories"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200"
            >
              Success Stories
            </Link>
            <Link
              to="/#contact"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200"
            >
              Contact
            </Link>

            {!isLoggedIn ? (
              <Link
                to="/signup"
                className="ml-3 px-6 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/50 hover:scale-105 transition-all duration-300"
              >
                Login / Signup
              </Link>
            ) : (
              <div className="relative ml-3 user-dropdown">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 transition-all duration-300 border border-slate-700"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {user?.name}
                  </span>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-slate-200">
                      <p className="text-sm font-semibold text-slate-900">
                        {user?.name}
                      </p>
                      <p className="text-xs text-slate-600 truncate">
                        {user?.email}
                      </p>
                    </div>

                    <div className="py-2">
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-all"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>

                      <Link
                        to="/my-profile"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-all"
                        onClick={() => setDropdownOpen(false)}
                      >
                        My Profile
                      </Link>

                      {subscription && (
                        <>
                          <Link
                            to="/create-profile"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-all"
                            onClick={() => setDropdownOpen(false)}
                          >
                            Create Profile
                          </Link>

                          <Link
                            to="/messages"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-all"
                            onClick={() => setDropdownOpen(false)}
                          >
                            Messages
                          </Link>
                        </>
                      )}

                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-all"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Settings
                      </Link>
                    </div>

                    <div className="border-t border-slate-200">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-red-50 transition-all"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {!isLoggedIn && (
              <Link
                to="/signup"
                className="px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg transition-all duration-300"
              >
                Login
              </Link>
            )}
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 8h16M4 16h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 py-4 space-y-2">
            <Link
              to="/"
              className="block px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/#packages"
              className="block px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Packages
            </Link>
            <Link
              to="/#stories"
              className="block px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Success Stories
            </Link>
            <Link
              to="/#contact"
              className="block px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>

            {isLoggedIn && (
              <>
                <div className="border-t border-slate-800 pt-4 mt-4">
                  <div className="px-4 py-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {user?.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/my-profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Profile
                </Link>

                {subscription && (
                  <>
                    <Link
                      to="/create-profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Create Profile
                    </Link>
                    <Link
                      to="/messages"
                      className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Messages
                    </Link>
                  </>
                )}

                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-red-400 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-all"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
