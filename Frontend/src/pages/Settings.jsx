import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  FaLock,
  FaTrash,
  FaCreditCard,
  FaPalette,
  FaHistory,
  FaUser,
  FaCog,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const API_URL = "http://localhost:5000/api";

  useEffect(() => {
    fetchUserData();
    fetchSubscription();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/users/me`, config);
      setUser(response.data.user);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
    }
  };

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

  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        `${API_URL}/subscriptions/payment-history`,
        config
      );
      setPaymentHistory(response.data.payments);
      setShowHistory(true);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      toast.error("Failed to load payment history");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const currentPassword = e.target.currentPassword.value;
    const newPassword = e.target.newPassword.value; 
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `${API_URL}/users/change-password`,
        { currentPassword, newPassword },
        config
      );
      toast.success("Password changed successfully!");
      e.target.reset();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure? This action cannot be undone.")) {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`${API_URL}/users/delete-account`, config);
        toast.success("Account deleted");
        localStorage.removeItem("token"); 
        navigate("/login"); 
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to delete account"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm("Are you sure you want to cancel your subscription?")) {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.put(`${API_URL}/subscriptions/cancel`, {}, config);
        toast.success("Subscription cancelled");
        fetchSubscription();
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to cancel subscription"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    toast.success(`Switched to ${newTheme} mode`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-500"></div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-white mb-10 text-center">
            Settings
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <div className="bg-slate-800/50 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <FaUser className="text-amber-500" /> Account Settings
              </h2>

              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <FaLock /> Change Password
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword" 
                      placeholder="Current Password"
                      className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                    >
                      {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword" 
                      placeholder="New Password"
                      className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Changing..." : "Change Password"}
                  </button>
                </form>
              </div>

              
              <div>
                <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <FaTrash /> Account Deletion
                </h3>
                <p className="text-slate-300 mb-4 text-sm">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>

            
            <div className="bg-slate-800/50 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <FaCreditCard className="text-amber-500" /> Subscription &
                Billing
              </h2>

              {subscription ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      Current Plan
                    </h3>
                    <p className="text-slate-300">
                      <strong>{subscription.planName}</strong> (Expires:{" "}
                      {new Date(subscription.endDate).toLocaleDateString()})
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => navigate("/")}
                      className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                    >
                      Upgrade Plan
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Cancelling..." : "Cancel Subscription"}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <FaHistory /> Payment History
                    </h3>
                    <button
                      onClick={fetchPaymentHistory}
                      className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition flex items-center justify-center gap-2"
                    >
                      <FaHistory /> View Payment History
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-slate-300 mb-4">No active subscription</p>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                  >
                    Purchase a Plan
                  </button>
                </div>
              )}
            </div>

            
            <div className="bg-slate-800/50 rounded-xl p-6 lg:col-span-2">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <FaCog className="text-amber-500" /> Preferences
              </h2>

              
              <div>
                <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <FaPalette /> Theme
                </h3>
                <label className="flex items-center gap-3 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={theme === "dark"}
                    onChange={toggleTheme}
                    className="w-5 h-5 text-amber-500 bg-slate-700 border-slate-600 rounded focus:ring-amber-500 focus:ring-2"
                  />
                  <span>Enable Dark Mode</span>
                </label>
              </div>
            </div>
          </div>

          
          {showHistory && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Payment History
                </h3>
                {paymentHistory.length > 0 ? (
                  <ul className="space-y-3">
                    {paymentHistory.map((payment, index) => (
                      <li
                        key={index}
                        className="bg-slate-700 p-4 rounded-lg text-slate-300"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <p>
                            <strong>Plan:</strong> {payment.planName}
                          </p>
                          <p>
                            <strong>Amount:</strong> ₹{payment.amountPaid}
                          </p>
                          <p>
                            <strong>Date:</strong>{" "}
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </p>
                          <p>
                            <strong>Status:</strong> {payment.paymentStatus}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-300">No payments found.</p>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="mt-6 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Settings;
