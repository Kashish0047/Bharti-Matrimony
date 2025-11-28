import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

function AdminPanel() {
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(`${API_URL}/admin/login`, loginData);
      setToken(res.data.token);
      localStorage.setItem("adminToken", res.data.token);
    } catch (err) {
      console.log(err);
      setError("Invalid admin credentials");
    }
  };

  const fetchData = () => {
    if (token) {
      axios
        .get(`${API_URL}/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setAnalytics(res.data))
        .catch(() => setError("Failed to fetch analytics"));

      axios
        .get(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUsers(res.data.users))
        .catch(() => setError("Failed to fetch users"));

      axios
        .get(`${API_URL}/contact`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setContacts(res.data.contacts || []))
        .catch(() => setError("Failed to fetch contact queries"));
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
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setDeletingId(userId);
    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((u) => u._id !== userId));
    } catch (err) {
      console.error(err);
      setError("Failed to delete user");
    }
    setDeletingId(null);
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm("Are you sure you want to delete this query?")) return;
    try {
      await axios.delete(`${API_URL}/contact/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContacts(contacts.filter((c) => c._id !== contactId));
    } catch (err) {
      console.error(err);
      setError("Failed to delete query");
    }
  };

  if (!token) {
    return (
      <div
        style={{
          maxWidth: 400,
          margin: "80px auto",
          padding: 24,
          background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
          borderRadius: 16,
          color: "#fff",
          boxShadow: "0 4px 32px #0004",
        }}
      >
        <h2
          style={{
            marginBottom: 24,
            textAlign: "center",
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: 1,
          }}
        >
          Admin Login
        </h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Admin Email"
            value={loginData.email}
            onChange={(e) =>
              setLoginData({ ...loginData, email: e.target.value })
            }
            required
            style={{
              width: "100%",
              marginBottom: 12,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #444",
              background: "#18181b",
              color: "#fff",
              fontSize: 16,
            }}
          />
          <input
            type="password"
            placeholder="Admin Password"
            value={loginData.password}
            onChange={(e) =>
              setLoginData({ ...loginData, password: e.target.value })
            }
            required
            style={{
              width: "100%",
              marginBottom: 12,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #444",
              background: "#18181b",
              color: "#fff",
              fontSize: 16,
            }}
          />
          <button
            type="submit"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              background: "linear-gradient(90deg, #f59e42 0%, #ef4444 100%)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 18,
              marginTop: 8,
              boxShadow: "0 2px 8px #0002",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </form>
        {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1300,
        margin: "40px auto",
        padding: 32,
        background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        borderRadius: 20,
        color: "#fff",
        boxShadow: "0 8px 40px #0005",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: 1,
            background: "linear-gradient(90deg, #f59e42 0%, #ef4444 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Admin Analytics
        </h2>
        <button
          onClick={handleLogout}
          style={{
            background: "linear-gradient(90deg, #ef4444 0%, #f59e42 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 32px",
            fontWeight: 700,
            fontSize: 18,
            cursor: "pointer",
            boxShadow: "0 2px 8px #0002",
          }}
        >
          Logout
        </button>
      </div>
      {analytics ? (
        <div
          style={{
            marginBottom: 32,
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
          }}
        >
          <StatCard
            label="Total Users"
            value={analytics.totalUsers}
            color="#f59e42"
            icon="👤"
          />
          <StatCard
            label="Total Profiles"
            value={analytics.totalProfiles}
            color="#f59e42"
            icon="📝"
          />
          <StatCard
            label="Total Payments"
            value={analytics.totalPayments}
            color="#ef4444"
            icon="💳"
          />
          <StatCard
            label="Total Visits"
            value={analytics.totalVisits}
            color="#ef4444"
            icon="👁️"
          />
        </div>
      ) : (
        <p>Loading analytics...</p>
      )}

      <h3
        style={{
          margin: "32px 0 16px 0",
          fontSize: 28,
          fontWeight: 700,
          color: "#f59e42",
        }}
      >
        All Users & Plans
      </h3>
      <div
        style={{
          overflowX: "auto",
          borderRadius: 12,
          boxShadow: "0 2px 16px #0002",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#232323",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <thead>
            <tr style={{ background: "#292929", color: "#f59e42" }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Plan</th>
              <th style={thStyle}>Amount Paid</th>
              <th style={thStyle}>Start Date</th>
              <th style={thStyle}>Expiry Date</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{ textAlign: "center", padding: 24, color: "#aaa" }}
                >
                  No users found.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user._id} style={{ borderBottom: "1px solid #333" }}>
                <td style={tdStyle}>
                  {user.name || user.profile?.name || "-"}
                </td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.payment?.planName || "-"}</td>
                <td style={tdStyle}>
                  {user.payment?.amount ? `₹${user.payment.amount}` : "-"}
                </td>
                <td style={tdStyle}>
                  {user.payment?.startDate
                    ? new Date(user.payment.startDate).toLocaleDateString()
                    : "-"}
                </td>
                <td style={tdStyle}>
                  {user.payment?.expiryDate
                    ? new Date(user.payment.expiryDate).toLocaleDateString()
                    : "-"}
                </td>
                <td style={tdStyle}>{user.payment?.planStatus || "-"}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleDelete(user._id)}
                    disabled={deletingId === user._id}
                    style={{
                      background:
                        "linear-gradient(90deg, #ef4444 0%, #f59e42 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 18px",
                      fontWeight: 600,
                      fontSize: 15,
                      cursor: "pointer",
                      boxShadow: "0 1px 4px #0002",
                      opacity: deletingId === user._id ? 0.6 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {deletingId === user._id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}

      <h3
        style={{
          margin: "40px 0 16px 0",
          fontSize: 28,
          fontWeight: 700,
          color: "#f59e42",
        }}
      >
        Contact Form Queries
      </h3>
      <div
        style={{
          overflowX: "auto",
          borderRadius: 12,
          boxShadow: "0 2px 16px #0002",
          marginBottom: 32,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#232323",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <thead>
            <tr style={{ background: "#292929", color: "#f59e42" }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Phone</th>
              <th style={thStyle}>Message</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: "center", padding: 24, color: "#aaa" }}
                >
                  No queries found.
                </td>
              </tr>
            )}
            {contacts.map((c) => (
              <tr key={c._id} style={{ borderBottom: "1px solid #333" }}>
                <td style={tdStyle}>{c.name}</td>
                <td style={tdStyle}>{c.email}</td>
                <td style={tdStyle}>{c.phone || "-"}</td>
                <td
                  style={{
                    ...tdStyle,
                    maxWidth: 400,
                    whiteSpace: "pre-line",
                    wordBreak: "break-word",
                  }}
                >
                  {c.message}
                </td>
                <td style={tdStyle}>
                  {new Date(c.createdAt).toLocaleString()}
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleDeleteContact(c._id)}
                    style={{
                      background:
                        "linear-gradient(90deg, #ef4444 0%, #f59e42 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 18px",
                      fontWeight: 600,
                      fontSize: 15,
                      cursor: "pointer",
                      boxShadow: "0 1px 4px #0002",
                      transition: "opacity 0.2s",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div
      style={{
        background: "#232323",
        borderRadius: 14,
        padding: 28,
        minWidth: 200,
        flex: "1 1 200px",
        boxShadow: "0 2px 12px #0002",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 22, color, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6 }}>{value}</div>
    </div>
  );
}

const thStyle = {
  padding: "14px 18px",
  fontWeight: 700,
  fontSize: 17,
  borderBottom: "2px solid #333",
  textAlign: "left",
  background: "#232323",
};

const tdStyle = {
  padding: "12px 18px",
  fontSize: 16,
  color: "#fff",
};

export default AdminPanel;