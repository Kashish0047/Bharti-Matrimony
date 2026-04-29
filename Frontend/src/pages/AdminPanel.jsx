import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiUsers, FiLayers, FiCreditCard, FiEye, FiLogOut, 
  FiMessageSquare, FiTrash2, FiSearch, FiActivity,
  FiCheckCircle, FiXCircle
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

function AdminPanel() {
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, queries
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/admin/login`, loginData);
      if (res.data.token) {
        setToken(res.data.token);
        localStorage.setItem("adminToken", res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [analyticsRes, usersRes, contactsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/contact`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data.users || []);
      setContacts(contactsRes.data.contacts || []);
    } catch (err) {
      console.error("Fetch Error:", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
      setError("Session expired or failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("adminToken");
    setAnalytics(null);
    setUsers([]);
    setContacts([]);
  };

  const confirmAction = (message, onConfirm) => {
    toast.warn(
      <div className="text-sm font-bold text-slate-800">
        <p className="mb-3">{message}</p>
        <div className="flex gap-3 justify-end">
          <button 
            className="px-4 py-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
            onClick={() => toast.dismiss()}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
            onClick={() => {
              toast.dismiss();
              onConfirm();
            }}
          >
            Delete
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        theme: "light",
      }
    );
  };

  const handleDeleteUser = (userId) => {
    confirmAction("Permanent Action: Are you sure you want to delete this user?", async () => {
      setDeletingId(userId);
      try {
        await axios.delete(`${API_URL}/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(users.filter((u) => u._id !== userId));
        toast.success("User successfully deleted.");
      } catch (err) {
        setError("Failed to delete user");
        toast.error("Failed to delete user.");
      } finally {
        setDeletingId(null);
      }
    });
  };

  const handleDeleteContact = (contactId) => {
    confirmAction("Delete this query?", async () => {
      try {
        await axios.delete(`${API_URL}/contact/${contactId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setContacts(contacts.filter((c) => c._id !== contactId));
        toast.success("Query deleted.");
      } catch (err) {
        setError("Failed to delete query");
        toast.error("Failed to delete query.");
      }
    });
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <ToastContainer />
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px]"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md p-8 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-red-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <FiActivity className="text-white text-4xl" />
            </div>
            <h2 className="text-3xl font-black text-white">Admin Control</h2>
            <p className="text-slate-400 mt-2">Secure access to Bharti Matrimony</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <input
                type="email"
                placeholder="admin@bharti.com"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
                className="w-full mt-1.5 p-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Secure Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
                className="w-full mt-1.5 p-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-red-600 text-white font-black rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Sign In to Dashboard</>
              )}
            </button>
          </form>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium"
            >
              {error}
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <ToastContainer />
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900/50 backdrop-blur-3xl border-r border-slate-800 flex flex-col p-6 fixed h-full z-20">
        <div className="mb-12 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-black italic shadow-lg shadow-amber-500/20">B</div>
          <h1 className="text-xl font-black tracking-tight">Admin<span className="text-amber-500">Panel</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarLink 
            icon={<FiActivity />} 
            label="Overview" 
            active={activeTab === "overview"} 
            onClick={() => setActiveTab("overview")} 
          />
          <SidebarLink 
            icon={<FiUsers />} 
            label="User Accounts" 
            active={activeTab === "users"} 
            onClick={() => setActiveTab("users")} 
          />
          <SidebarLink 
            icon={<FiMessageSquare />} 
            label="Contact Queries" 
            active={activeTab === "queries"} 
            onClick={() => setActiveTab("queries")} 
          />
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full p-4 rounded-2xl flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-all font-bold"
          >
            <FiLogOut /> Logout Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-10 bg-[#020617] min-h-screen">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-widest">{activeTab}</h2>
            <p className="text-slate-500 font-medium">Dashboard Management System</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search database..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-6 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all w-64 text-sm font-medium"
              />
            </div>
            <button 
              onClick={fetchData}
              className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all"
              title="Refresh Data"
            >
              <FiActivity className={loading ? "animate-spin text-amber-500" : "text-slate-400"} />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {analytics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <AnalyticsCard label="Active Users" value={analytics.totalUsers} icon={<FiUsers />} color="blue" />
                  <AnalyticsCard label="Profiles Created" value={analytics.totalProfiles} icon={<FiLayers />} color="amber" />
                  <AnalyticsCard label="Total Payments" value={analytics.totalPayments} icon={<FiCreditCard />} color="emerald" />
                  <AnalyticsCard label="Site Traffic" value={analytics.totalVisits} icon={<FiEye />} color="purple" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-900/50 rounded-3xl animate-pulse"></div>)}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                    <FiActivity className="text-amber-500" /> System Health
                  </h3>
                  <div className="space-y-6">
                    <HealthBar label="API Response" percent={98} color="emerald" />
                    <HealthBar label="Database Uptime" percent={100} color="amber" />
                    <HealthBar label="Storage Capacity" percent={42} color="blue" />
                  </div>
                </div>
                <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                    <FiLayers className="text-red-500" /> Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {users.slice(0, 4).map((user, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                          {user.email?.[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{user.name || "New User"}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900/30 rounded-[2.5rem] border border-slate-800 overflow-hidden backdrop-blur-xl"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50">
                      <th className="p-6 font-black text-slate-500 uppercase tracking-widest text-[10px]">Subscriber</th>
                      <th className="p-6 font-black text-slate-500 uppercase tracking-widest text-[10px]">Email</th>
                      <th className="p-6 font-black text-slate-500 uppercase tracking-widest text-[10px]">Plan Details</th>
                      <th className="p-6 font-black text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
                      <th className="p-6 font-black text-slate-500 uppercase tracking-widest text-[10px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={5} className="p-20 text-center text-slate-500 font-bold italic">No records found matching your search.</td></tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-slate-800/20 transition-colors group">
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center font-bold text-slate-400">
                                {user.name?.[0] || user.email?.[0].toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-200">{user.name || user.profile?.name || "Guest User"}</span>
                            </div>
                          </td>
                          <td className="p-6 text-sm text-slate-400 font-medium">{user.email}</td>
                          <td className="p-6">
                            {user.payment?.planName ? (
                              <div>
                                <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest mb-1">
                                  {user.payment.planName} Tier
                                </span>
                                <p className="text-[11px] text-slate-500">Paid: ₹{user.payment.amount}</p>
                              </div>
                            ) : (
                              <span className="text-slate-600 italic text-sm font-medium">No Active Plan</span>
                            )}
                          </td>
                          <td className="p-6">
                            {user.payment?.planStatus === "Active" ? (
                              <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-tighter bg-emerald-500/10 px-3 py-1 rounded-full w-fit">
                                <FiCheckCircle /> Active
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-tighter bg-slate-500/10 px-3 py-1 rounded-full w-fit">
                                <FiXCircle /> {user.payment?.planStatus || "Free Tier"}
                              </div>
                            )}
                          </td>
                          <td className="p-6">
                            <button 
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={deletingId === user._id}
                              className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                            >
                              {deletingId === user._id ? <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div> : <FiTrash2 />}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "queries" && (
            <motion.div 
              key="queries"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {contacts.length === 0 ? (
                <div className="col-span-full p-20 bg-slate-900/30 rounded-[2.5rem] border border-dashed border-slate-800 text-center">
                  <FiMessageSquare className="text-5xl text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest">No unread queries from users.</p>
                </div>
              ) : (
                contacts.map((c) => (
                  <div key={c._id} className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800 hover:border-slate-700 transition-all flex flex-col shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 text-xl font-bold italic">
                          {c.name?.[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-black text-white">{c.name}</h4>
                          <p className="text-xs text-slate-500">{c.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteContact(c._id)}
                        className="text-slate-600 hover:text-red-500 transition-colors"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    <div className="bg-slate-950/50 p-6 rounded-2xl mb-6 flex-1 italic text-slate-400 text-sm leading-relaxed border border-slate-800/50">
                      "{c.message}"
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-800/50">
                      <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Received {new Date(c.createdAt).toLocaleDateString()}</span>
                      <a href={`mailto:${c.email}`} className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:underline">Reply Now</a>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all font-bold ${
        active 
          ? "bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-lg shadow-amber-500/20 scale-[1.02]" 
          : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="tracking-wide uppercase text-xs font-black">{label}</span>
    </button>
  );
}

function AnalyticsCard({ label, value, icon, color, isCurrency }) {
  const colors = {
    blue: "from-blue-500 to-indigo-600 shadow-blue-500/20",
    amber: "from-amber-400 to-orange-500 shadow-amber-500/20",
    emerald: "from-emerald-400 to-teal-600 shadow-emerald-500/20",
    purple: "from-purple-500 to-fuchsia-600 shadow-purple-500/20",
    red: "from-red-500 to-pink-600 shadow-red-500/20",
  };

  return (
    <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 relative overflow-hidden group hover:scale-[1.02] transition-all">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors[color]} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`}></div>
      <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-2xl flex items-center justify-center text-white text-xl shadow-lg mb-6`}>
        {icon}
      </div>
      <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-black tracking-tight">
        {isCurrency ? `₹${(value || 0).toLocaleString()}` : (value || 0).toLocaleString()}
      </h3>
    </div>
  );
}

function HealthBar({ label, percent, color }) {
  const colors = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
  };
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className={`h-full ${colors[color]}`}
        />
      </div>
    </div>
  );
}

export default AdminPanel;
