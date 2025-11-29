import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

function Messages() {
  const [chats, setChats] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const results = await Promise.allSettled([
          axios.get(`${API_URL}/users/me`, config),
          axios.get(`${API_URL}/chat/all-chats`, config),
          axios.get(`${API_URL}/subscriptions/my-subscription`, config),
        ]);

        const userRes =
          results[0].status === "fulfilled" ? results[0].value : null;
        const chatsRes =
          results[1].status === "fulfilled" ? results[1].value : null;
        const subscriptionRes =
          results[2].status === "fulfilled" ? results[2].value : null;

        if (userRes) setCurrentUser(userRes.data.user);
        if (chatsRes) setChats(chatsRes.data.chats || []);
        if (subscriptionRes) setSubscription(subscriptionRes.data.subscription);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load messages");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="max-w-3xl mx-auto py-8 text-center text-amber-400 bg-slate-900 min-h-screen">
        Loading...
      </div>
    );

  // Unique users with chats (no self)
  const uniqueUsers = {};
  chats.forEach((chat) => {
    if (!chat.lastMessage || !chat.lastMessage.otherUser) return;
    const otherUser = chat.lastMessage.otherUser;
    const otherUserId = getUserId(otherUser);
    if (otherUserId !== String(currentUser._id) && !uniqueUsers[otherUserId]) {
      uniqueUsers[otherUserId] = {
        ...otherUser,
        lastMessage: chat.lastMessage,
        _id: otherUserId,
      };
    }
  });




  const handleUserClick = (otherUser) => {
    // Always use the userId (not profileId) for chat route
    const userId = otherUser.userId || otherUser._id;
    navigate(`/chat/${userId}`, {
      state: { user: otherUser },
    });
  };

  const handleDeleteChat = async (otherUserId) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_URL}/chat/delete-chat/${otherUserId}`, config);
      toast.success("Chat deleted!");
      if (selectedUser && getUserId(selectedUser) === otherUserId) {
        setSelectedUser(null);
        setMessages([]);
      }
      const updatedChats = chats.filter(
        (chat) => getUserId(chat.lastMessage?.otherUser) !== otherUserId
      );
      setChats(updatedChats);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    }
  };


  return (
    <div className="max-w-3xl mx-auto py-8 min-h-screen bg-slate-900">
      <h2 className="text-2xl font-bold mb-6 text-amber-400">Your Chats</h2>
      <ul>
        {Object.values(uniqueUsers).length === 0 ? (
          <div className="text-center text-slate-500 py-8">No chats found.</div>
        ) : (
          Object.values(uniqueUsers).map((otherUser) => (
            <li
              key={getUserId(otherUser)}
              className={`flex items-center gap-6 px-8 py-6 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-all text-lg ${
                selectedUser?._id === getUserId(otherUser) ? "bg-slate-800" : ""
              }`}
              onClick={() => handleUserClick(otherUser)}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                {otherUser.profilePic ? (
                  <img
                    src={`http://localhost:5000${otherUser.profilePic}`}
                    alt={otherUser.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  otherUser.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-amber-200 truncate">
                  {otherUser.name}
                </div>
                <div className="text-sm text-slate-400 truncate">
                  {otherUser.email}
                </div>
                <div className="text-base mt-1 text-slate-300 truncate">
                  {otherUser.lastMessage?.content}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-xs text-slate-500 whitespace-nowrap">
                  {otherUser.lastMessage?.createdAt
                    ? new Date(otherUser.lastMessage.createdAt).toLocaleString(
                        "en-IN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "short",
                        }
                      )
                    : ""}
                </div>
                {/* Delete Chat Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(getUserId(otherUser));
                  }}
                  className="text-xs text-red-400 hover:text-red-600 transition"
                  title="Delete chat"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      {/* Delete Chat Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl max-w-xs w-full">
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="w-12 h-12 mx-auto text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-amber-200 mb-2">
                Delete Chat
              </h3>
              <p className="text-slate-400 mb-6">
                Are you sure you want to delete this chat? All messages will be
                removed.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-5 py-2 bg-slate-700 text-amber-100 rounded-lg hover:bg-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteChat(showDeleteConfirm)}
                  className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg hover:from-red-600 hover:to-red-800 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
        toastStyle={{
          background: "#1e293b",
          border: "1px solid #f59e0b33",
          color: "#fff",
        }}
      />
    </div>
  );
}

function getUserId(user) {
  return user._id || user.userId || user.profileId;
}

export default Messages;
