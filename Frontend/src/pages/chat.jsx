import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import io from "socket.io-client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CallModal from "./CallModal";

const SOCKET_URL = import.meta.env.VITE_REACT_APP_SOCKET_URL;
const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const EMOJI_CATEGORIES = {
  smileys: [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓",
  ],
  hearts: [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟",
  ],
  gestures: [
    "👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👏", "🙌", "👐", "🤲", "🤝", "🙏",
  ],
  celebration: [
    "🎉", "🎊", "🎈", "🎁", "🎀", "🎂", "🍰", "🧁", "🥳", "🎈", "🎯", "🎪", "🎨", "🎭", "🎪", "🎺", "🎸", "🎵", "🎶", "🎤",
  ],
  food: [
    "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅",
  ],
  travel: [
    "✈️", "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🏍️", "🛵", "🚲", "🛴", "🛹", "🛼", "🚁", "🛸", "🚀", "🛫", "🛬", "⛵", "🚤", "🛥️", "🛳️",
  ],
};

function Chat() {
  const { friendId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [friend, setFriend] = useState(location.state?.user || null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [subscription, setSubscription] = useState(null);

  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState(null);
  const [isCaller, setIsCaller] = useState(false);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [callDeclined, setCallDeclined] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
    });
    newSocket.on("connect", () => {
      console.log("🔌 Socket connected:", newSocket.id);
    });
    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err);
    });
    newSocket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
    });
    setSocket(newSocket);
    fetchUserData();
    fetchMessages();
    return () => {
      console.log("🔌 Cleaning up socket connection");
      newSocket.disconnect();
    };
  }, [friendId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!socket || !currentUser || !friendId) return;
    const userId = currentUser._id || currentUser;
    if (!userId) return;
    socket.off("online-users");
    socket.off("receive-message");
    socket.off("user-typing");
    socket.off("user-stop-typing");
    socket.off("message-edited");
    socket.off("message-deleted");
    socket.emit("user-online", userId);
    const chatId = [userId, friendId].sort().join("-");
    socket.emit("join-chat", chatId);
    socket.on("online-users", (users) => setOnlineUsers(users));
    socket.on("receive-message", (message) => {
      setMessages((prevMessages) => {
        const exists = prevMessages.find((msg) => msg._id === message._id);
        if (exists) return prevMessages;
        return [...prevMessages, message];
      });
    });
    socket.on("message-edited", (editedMessage) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === editedMessage._id ? editedMessage : msg
        )
      );
    });
    socket.on("message-deleted", ({ messageId }) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );
    });
    socket.on("user-typing", (data) => {
      if (data.userId !== userId) setIsTyping(true);
    });
    socket.on("user-stop-typing", () => setIsTyping(false));
    return () => {
      socket.off("online-users");
      socket.off("receive-message");
      socket.off("message-edited");
      socket.off("message-deleted");
      socket.off("user-typing");
      socket.off("user-stop-typing");
    };
  }, [socket, currentUser, friendId]);

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", ({ from, offer, type }) => {
      setCallType(type);
      setIsCaller(false);
      setIncomingOffer({ from, offer, incomingType: type });
      setShowCallModal(true);
      setCallDeclined(false);
    });

    socket.on("call-ended", () => {
      setShowCallModal(false);
      setCallType(null);
      setIncomingOffer(null);
      setIsCaller(false);
      setCallDeclined(true);
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-ended");
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on("call-declined", () => {
      setShowCallModal(false);
      setCallType(null);
      setIncomingOffer(null);
      setIsCaller(false);
      setCallDeclined(true);
    });

    return () => {
      socket.off("call-declined");
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    socket.on("call-accepted", () => {});
    return () => {
      socket.off("call-accepted");
    };
  }, [socket]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [userRes, friendRes, subRes] = await Promise.all([
        axios.get(`${API_URL}/profiles/my-profile`, config),
        friend
          ? Promise.resolve({ data: { user: friend } })
          : axios.get(`${API_URL}/chat/user/${friendId}`, config),
        axios.get(`${API_URL}/subscriptions/my-subscription`, config),
      ]);
      let currentUserData = null;
      if (userRes.data.profile) {
        currentUserData = {
          _id: userRes.data.profile.userId || userRes.data.profile._id,
          name: userRes.data.profile.name,
          email:
            userRes.data.profile.email ||
            userRes.data.profile.contactInfo?.email,
        };
        if (
          userRes.data.profile.userId &&
          typeof userRes.data.profile.userId === "object"
        ) {
          currentUserData = {
            _id: userRes.data.profile.userId._id,
            name: userRes.data.profile.name,
            email:
              userRes.data.profile.email || userRes.data.profile.userId.email,
          };
        }
        localStorage.setItem("user", JSON.stringify(currentUserData));
      }
      let friendUserData = null;
      if (friendRes.data.user) {
        friendUserData = {
          ...friendRes.data.user,
          profileId: friendRes.data.profile?._id || null,
          name: friendRes.data.profile?.name || friendRes.data.user.name,
        };
      }
      setSubscription(subRes.data.subscription || null);
      setCurrentUser(currentUserData);
      setFriend(friendUserData);
      setLoading(false);
    } catch (error) {
      console.error("Fetch user data error:", error);
      setLoading(false);
      toast.error("Failed to load user data");
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        `${API_URL}/chat/chat/${friendId}`,
        config
      );
      setMessages(response.data.messages || []);
      setLoading(false);
    } catch (error) {
      console.error("Fetch messages error:", error);
      toast.error("Failed to load messages");
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const validFiles = files.filter((file) => {
      const isValidType =
        file.type.startsWith("image/") ||
        file.type.startsWith("video/") ||
        file.type.startsWith("audio/") ||
        file.type === "application/pdf";
      const isValidSize = file.size <= 10 * 1024 * 1024;
      if (!isValidType) {
        toast.error(`${file.name} is not a valid file type`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name} is too large. Max size is 10MB`);
        return false;
      }
      return true;
    });
    setSelectedFiles(validFiles);
    const previews = validFiles.map((file) => {
      if (file.type.startsWith("image/")) {
        return { file, url: URL.createObjectURL(file), type: "image" };
      } else if (file.type.startsWith("video/")) {
        return { file, url: URL.createObjectURL(file), type: "video" };
      } else {
        return { file, url: null, type: "document" };
      }
    });
    setPreviewFiles(previews);
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previewFiles.filter((_, i) => i !== index);
    if (previewFiles[index]?.url) {
      URL.revokeObjectURL(previewFiles[index].url);
    }
    setSelectedFiles(newFiles);
    setPreviewFiles(newPreviews);
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  function containsMobileNumber(str) {
    return /\b\d{10}\b/.test(str || "");
  }

  function containsLink(str) {
    return /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|in|net|org|co|info|me|app|shop|xyz|live|site|online|store|edu|gov|io|ai|dev|link|club|biz|us|uk|ca|au|pk|lk|np|bd|my|sg|za|ae|qa|sa|ir|ru|jp|kr|cn|fr|de|es|it|br|mx|tr|pl|nl|se|no|fi|dk|be|ch|at|cz|gr|hu|il|ie|pt|ro|sk|si|ua|bg|lt|lv|ee|hr|rs|ba|mk|al|ge|am|az|by|kz|kg|md|tj|tm|uz|vn|th|id|ph|sg|my|hk|tw|nz|ar|cl|co|pe|uy|ve|ec|bo|py|do|gt|hn|ni|pa|sv|cr|jm|tt|bs|bb|ag|dm|gd|kn|lc|vc|sr|gy|bz|ht|cu|pr|aw|cw|sx|bq|mf|gp|mq|re|yt|pm|bl|mf|wf|pf|nc|tf|gl|fo|gi|je|gg|im|ax|fk|gs|sh|pn|tk|to|tv|vu|ws|as|ck|nu|pf|sb|tl|tk|tv|wf|ws|eu|asia|africa|mobi|name|pro|tel|int|arpa|aero|cat|jobs|museum|travel|xxx|idv|mil|gov|edu|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|um|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|za|zm|zw))/.test(
      str || ""
    );
  }

  useEffect(() => {
    if (
      subscription?.planName?.toLowerCase() === "basic" &&
      (containsMobileNumber(newMessage) || containsLink(newMessage))
    ) {
      toast.dismiss("number-link-warning");
      toast.warn(
        "Sharing phone numbers or links is not allowed on Basic plan. Please upgrade your plan to share contact details or links.",
        { toastId: "number-link-warning" }
      );
    } else {
      toast.dismiss("number-link-warning");
    }
  }, [newMessage, subscription]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (
      subscription?.planName?.toLowerCase() === "basic" &&
      (containsMobileNumber(newMessage) || containsLink(newMessage))
    ) {
      toast.error(
        "You cannot send phone numbers or links on Basic plan. Please upgrade your plan to share contact details or links."
      );
      return;
    }
    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append("receiverId", friendId);
        formData.append("content", newMessage.trim() || "");
        selectedFiles.forEach((file) => {
          formData.append("media", file);
        });
        const config = {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        };
        await axios.post(`${API_URL}/chat/send-media`, formData, config);
        previewFiles.forEach((preview) => {
          if (preview.url) URL.revokeObjectURL(preview.url);
        });
        setSelectedFiles([]);
        setPreviewFiles([]);
      } else {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.post(
          `${API_URL}/chat/send`,
          { receiverId: friendId, content: newMessage.trim() },
          config
        );
      }
      setNewMessage("");
      handleStopTyping();
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Failed to send message");
    } finally {
      setUploading(false);
      fetchMessages();
    }
  };

  const handleTyping = () => {
    if (!socket || !currentUser) return;
    const userId = currentUser._id || currentUser;
    if (!userId) return;
    const chatId = [userId, friendId].sort().join("-");
    socket.emit("user-typing", { chatId, userId });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (!socket || !currentUser) return;
    const userId = currentUser._id || currentUser;
    if (!userId) return;
    const chatId = [userId, friendId].sort().join("-");
    socket.emit("user-stop-typing", { chatId, userId });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeStr = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
    if (diff < 86400000) {
      return timeStr;
    } else if (diff < 172800000) {
      return `Yesterday ${timeStr}`;
    } else {
      return `${date.toLocaleDateString()} ${timeStr}`;
    }
  };

  const renderMessageContent = (msg) => {
    if (
      msg.messageType === "media" &&
      msg.mediaFiles &&
      msg.mediaFiles.length > 0
    ) {
      return (
        <div className="space-y-2">
          {msg.content && msg.content.trim() && (
            <p className="text-base leading-relaxed break-words font-medium mb-3">
              {msg.content}
            </p>
          )}
          <div className="grid gap-2">
            {msg.mediaFiles.map((media, index) => (
              <div key={index} className="relative">
                {media.fileType?.startsWith("image/") ? (
                  <img
                    src={`${SOCKET_URL}${media.url}`}
                    alt="Shared image"
                    className="max-w-full h-auto rounded-2xl max-h-80 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() =>
                      window.open(`${SOCKET_URL}${media.url}`, "_blank")
                    }
                  />
                ) : media.fileType?.startsWith("video/") ? (
                  <video
                    src={`${SOCKET_URL}${media.url}`}
                    controls
                    className="max-w-full h-auto rounded-2xl max-h-80"
                  />
                ) : media.fileType?.startsWith("audio/") ? (
                  <audio
                    src={`${SOCKET_URL}${media.url}`}
                    controls
                    className="w-full max-w-sm"
                  />
                ) : (
                  <div
                    className="flex items-center gap-3 p-3 bg-black/20 rounded-xl cursor-pointer hover:bg-black/30 transition-colors"
                    onClick={() =>
                      window.open(`${SOCKET_URL}${media.url}`, "_blank")
                    }
                  >
                    <svg
                      className="w-8 h-8 text-amber-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium">{media.originalName}</p>
                      <p className="text-xs opacity-70">
                        {(media.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <p className="text-base leading-relaxed break-words font-medium">
        {msg.content}
      </p>
    );
  };

  const isOnline = friend && onlineUsers.includes(friend._id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900/20 to-orange-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading chat...</p>
        </div>
      </div>
    );
  }

  const handleEditMessage = async (messageId) => {
    if (!editingContent.trim()) {
      toast.error("Message cannot be empty");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `${API_URL}/chat/${messageId}`,
        { content: editingContent.trim() },
        config
      );
      toast.success("Message updated successfully!");
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, content: editingContent.trim(), isEdited: true }
            : msg
        )
      );
      setEditingMessageId(null);
      setEditingContent("");
    } catch (error) {
      console.error("Failed to edit message", error);
      toast.error("Failed to edit message");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_URL}/chat/${messageId}`, config);
      toast.success("Message deleted successfully!");
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete message", error);
      toast.error("Failed to delete message");
    }
  };

  const sentCount = messages.filter(
    (msg) => msg.sender._id === (currentUser?._id || currentUser)
  ).length;
  const isBasicLimitReached =
    subscription?.planName?.toLowerCase() === "basic" && sentCount >= 5;

  const startCall = (type) => {
    setCallType(type);
    setIsCaller(true);
    setShowCallModal(true);
    socket.emit("call-user", {
      to: friend._id,
      offer: null,
      type,
      from: currentUser._id,
    });
  };

  const endCall = () => {
    setShowCallModal(false);
    setCallType(null);
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
        toastStyle={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          border: "1px solid rgba(245, 158, 11, 0.2)",
          color: "#fff",
        }}
      />
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(245,158,11,0.1)_1px,transparent_0)] bg-[length:30px_30px]"></div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-amber-400/10 to-yellow-500/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
          <div className="absolute bottom-20 right-1/3 w-56 h-56 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-6">
          <div className="bg-gradient-to-br from-slate-800/95 via-slate-900/90 to-amber-900/20 backdrop-blur-2xl rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl h-[calc(100vh-160px)] relative flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none rounded-3xl"></div>
            <div className="absolute inset-0 rounded-3xl border-2 border-gradient-to-r from-amber-500/30 via-orange-500/20 to-amber-500/30 pointer-events-none"></div>
            <div className="relative bg-gradient-to-r from-slate-800/95 via-amber-900/30 to-slate-800/95 backdrop-blur-xl px-8 py-5 border-b border-amber-500/20 shadow-lg flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="group flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-200 hover:text-white transition-all duration-300 hover:scale-110 shadow-lg"
                  >
                    <svg
                      className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <div className="relative">
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xl shadow-2xl border-3 border-amber-300/50">
                      {friend?.name?.charAt(0).toUpperCase() || "?"}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/40 to-orange-500/40 blur-lg -z-10 animate-pulse"></div>
                    </div>
                    {isOnline && (
                      <div className="absolute -bottom-1 -right-1 z-10">
                        <div className="relative">
                          <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-3 border-white shadow-lg"></div>
                          <div className="absolute inset-0 w-5 h-5 bg-emerald-400 rounded-full animate-ping opacity-60"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-orange-200 to-amber-300 bg-clip-text text-transparent mb-1 truncate">
                      {friend?.name || "Loading..."}
                    </h1>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isOnline
                            ? "bg-gradient-to-r from-emerald-400 to-green-500 shadow-emerald-400/50 shadow-lg"
                            : "bg-slate-500"
                        }`}
                      ></div>
                      <span
                        className={`text-sm font-medium ${
                          isOnline ? "text-emerald-300" : "text-slate-400"
                        }`}
                      >
                        {isOnline ? "Active now" : "Last seen recently"}
                      </span>
                      {isTyping && (
                        <span className="text-sm text-amber-300 font-medium animate-pulse">
                          • typing...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    disabled={subscription?.planName?.toLowerCase() === "basic"}
                    onClick={() => startCall("audio")}
                    className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30
    ${
      subscription?.planName?.toLowerCase() === "basic"
        ? "opacity-50 cursor-not-allowed"
        : "hover:from-emerald-500/30 hover:to-green-500/30 text-emerald-300 hover:text-emerald-200 transition-all duration-300 hover:scale-110 shadow-lg"
    }`}
                    title={
                      subscription?.planName?.toLowerCase() === "basic"
                        ? "Upgrade plan to enable audio call"
                        : "Audio Call"
                    }
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </button>
                  <button
                    disabled={subscription?.planName?.toLowerCase() === "basic"}
                    onClick={() => startCall("video")}
                    className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30
    ${
      subscription?.planName?.toLowerCase() === "basic"
        ? "opacity-50 cursor-not-allowed"
        : "hover:from-blue-500/30 hover:to-indigo-500/30 text-blue-300 hover:text-blue-200 transition-all duration-300 hover:scale-110 shadow-lg"
    }`}
                    title={
                      subscription?.planName?.toLowerCase() === "basic"
                        ? "Upgrade plan to enable video call"
                        : "Video Call"
                    }
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const profileId =
                        friend?.profileId || friend?._id || friendId;
                      navigate(`/profile/${profileId}`);
                    }}
                    className="px-5 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-200 hover:text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-lg text-sm"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Profile</span>
                  </button>
                </div>
              </div>
            </div>
            <div
              className="relative flex-1 overflow-y-auto px-6 py-6 space-y-4 
                scrollbar-hide
                [&::-webkit-scrollbar]:hidden 
                [-ms-overflow-style:none] 
                [scrollbar-width:none]"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="relative mb-8">
                    <div className="w-32 h-32 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-amber-500/30 shadow-2xl">
                      <svg
                        className="w-16 h-16 text-amber-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-3xl blur-2xl animate-pulse"></div>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-orange-200 to-amber-300 bg-clip-text text-transparent mb-3">
                    Start Your Journey Together
                  </h3>
                  <p className="text-slate-400 text-lg max-w-lg leading-relaxed">
                    Send the first message to{" "}
                    <span className="text-amber-300 font-semibold">
                      {friend?.name || "your friend"}
                    </span>{" "}
                    and begin your beautiful conversation.
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => {
                    const isSender =
                      msg.sender._id === (currentUser?._id || currentUser);
                    const isFirstInGroup =
                      index === 0 ||
                      messages[index - 1].sender._id !== msg.sender._id;
                    const isLastInGroup =
                      index === messages.length - 1 ||
                      messages[index + 1].sender._id !== msg.sender._id;

                    return (
                      <div
                        key={msg._id}
                        className={`flex ${
                          isSender ? "justify-end" : "justify-start"
                        } ${isFirstInGroup ? "mt-6" : "mt-2"}`}
                      >
                        <div
                          className={`group max-w-[80%] relative ${
                            isSender ? "order-2" : "order-1"
                          }`}
                        >
                          <div
                            className={`relative ${
                              isSender
                                ? "bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white ml-6 shadow-amber-500/25"
                                : "bg-gradient-to-br from-slate-700/90 to-slate-600/90 backdrop-blur-xl text-white mr-6 border border-amber-500/20 shadow-slate-900/50"
                            } rounded-3xl px-6 py-4 shadow-2xl hover:shadow-3xl transition-all duration-300 group-hover:scale-[1.02]`}
                          >
                            {isSender && (
                              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
                                <button
                                  onClick={() => {
                                    if (msg.messageType === "text") {
                                      setEditingMessageId(msg._id);
                                      setEditingContent(msg.content);
                                    } else {
                                      toast.info(
                                        "Media messages cannot be edited"
                                      );
                                    }
                                  }}
                                  disabled={isBasicLimitReached}
                                  className={`w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 ${
                                    isBasicLimitReached
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                  title={
                                    isBasicLimitReached
                                      ? "You can't edit messages after reaching the limit."
                                      : "Edit message"
                                  }
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(msg._id)}
                                  disabled={isBasicLimitReached}
                                  className={`w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 ${
                                    isBasicLimitReached
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                  title={
                                    isBasicLimitReached
                                      ? "You can't delete messages after reaching the limit."
                                      : "Delete message"
                                  }
                                >
                                  <svg
                                    className="w-4 h-4"
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
                            )}
                            {editingMessageId === msg._id ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editingContent}
                                  onChange={(e) =>
                                    setEditingContent(e.target.value)
                                  }
                                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:border-white/50 transition-colors"
                                  placeholder="Edit your message..."
                                  autoFocus
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      handleEditMessage(msg._id);
                                    }
                                    if (e.key === "Escape") {
                                      setEditingMessageId(null);
                                      setEditingContent("");
                                    }
                                  }}
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => {
                                      setEditingMessageId(null);
                                      setEditingContent("");
                                    }}
                                    className="px-3 py-1 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleEditMessage(msg._id)}
                                    className="px-3 py-1 bg-white/30 text-white rounded-lg text-sm hover:bg-white/40 transition-colors"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {renderMessageContent(msg)}
                                {msg.isEdited && (
                                  <div className="mt-2">
                                    <span
                                      className={`text-xs ${
                                        isSender
                                          ? "text-amber-100"
                                          : "text-slate-400"
                                      } opacity-70 italic`}
                                    >
                                      (edited)
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                            {editingMessageId !== msg._id && (
                              <div
                                className={`flex items-center justify-between mt-3 ${
                                  isSender ? "text-amber-100" : "text-slate-400"
                                }`}
                              >
                                <span className="text-xs font-semibold opacity-80">
                                  {formatTime(msg.createdAt)}
                                </span>
                                {isSender && (
                                  <div className="ml-3 flex items-center">
                                    <svg
                                      className="w-5 h-5 text-amber-100"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            )}
                            {isLastInGroup && editingMessageId !== msg._id && (
                              <div
                                className={`absolute top-4 ${
                                  isSender
                                    ? "-right-2 border-l-[12px] border-l-amber-500 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent"
                                    : "-left-2 border-r-[12px] border-r-slate-700 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent"
                                } w-0 h-0`}
                              ></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gradient-to-br from-slate-700/90 to-slate-600/90 backdrop-blur-xl rounded-3xl px-6 py-4 border border-amber-500/20 shadow-2xl">
                        <div className="flex items-center gap-3">
                          <span className="text-base text-amber-200 font-medium">
                            {friend?.name} is typing
                          </span>
                          <div className="flex gap-1">
                            <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-bounce"></div>
                            <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            {previewFiles.length > 0 && (
              <div className="px-6 py-4 border-t border-amber-500/20 bg-gradient-to-r from-slate-800/50 via-amber-900/10 to-slate-800/50">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {previewFiles.map((preview, index) => (
                    <div key={index} className="relative flex-shrink-0">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-700/50 border border-amber-500/30">
                        {preview.type === "image" ? (
                          <img
                            src={preview.url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : preview.type === "video" ? (
                          <video
                            src={preview.url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-amber-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="relative bg-gradient-to-r from-slate-800/95 via-amber-900/20 to-slate-800/95 backdrop-blur-xl px-6 py-5 border-t border-amber-500/20 flex-shrink-0">
              <form
                onSubmit={handleSendMessage}
                className="flex items-end gap-4"
              >
                {isBasicLimitReached && (
                  <div className="w-full text-center text-red-500 font-semibold mb-2">
                    You have reached your 5 message limit for Basic plan.
                    Upgrade to continue chatting!
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept="image/*,video/*,audio/*,.pdf"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser?.planName === "basic") {
                      toast.error(
                        "Basic plan users cannot send media messages."
                      );
                      return;
                    }
                    fileInputRef.current?.click();
                  }}
                  disabled={
                    currentUser?.planName === "basic" || isBasicLimitReached
                  }
                  className={`flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 ${
                    currentUser?.planName === "basic" || isBasicLimitReached
                      ? "text-slate-500 cursor-not-allowed"
                      : "text-amber-300 hover:text-white transition-all duration-300 hover:scale-110 shadow-lg"
                  }`}
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
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={handleTyping}
                    disabled={isBasicLimitReached}
                    placeholder={
                      isBasicLimitReached
                        ? "Message limit reached for Basic plan"
                        : "Type your message..."
                    }
                    className="w-full px-6 py-4 bg-gradient-to-r from-slate-700/90 to-slate-600/90 backdrop-blur-xl border border-amber-500/30 rounded-2xl text-white placeholder-amber-300/60 focus:outline-none focus:border-amber-500/60 focus:from-slate-600/90 focus:to-slate-500/90 transition-all duration-300 text-base pr-14 shadow-lg"
                  />
                  <div
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    ref={emojiPickerRef}
                  >
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-amber-400 hover:text-amber-300 transition-colors w-8 h-8 rounded-xl hover:bg-amber-500/20 flex items-center justify-center"
                      disabled={isBasicLimitReached}
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
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                    {showEmojiPicker && !isBasicLimitReached && (
                      <div className="absolute bottom-full right-0 mb-2 w-80 h-96 bg-gradient-to-br from-slate-800/95 to-slate-700/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-4 h-full flex flex-col">
                          <h3 className="text-amber-300 font-semibold mb-3">
                            Choose Emoji
                          </h3>
                          <div className="flex-1 overflow-y-auto space-y-4">
                            {Object.entries(EMOJI_CATEGORIES).map(
                              ([category, emojis]) => (
                                <div key={category}>
                                  <h4 className="text-slate-300 text-sm font-medium mb-2 capitalize">
                                    {category}
                                  </h4>
                                  <div className="grid grid-cols-8 gap-2">
                                    {emojis.map((emoji, index) => (
                                      <button
                                        key={index}
                                        onClick={() => handleEmojiSelect(emoji)}
                                        className="w-8 h-8 flex items-center justify-center text-xl hover:bg-amber-500/20 rounded-lg transition-colors"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={
                    isBasicLimitReached ||
                    (!newMessage.trim() && selectedFiles.length === 0) ||
                    uploading
                  }
                  className={`relative flex items-center justify-center w-14 h-14 rounded-2xl font-bold transition-all duration-300 hover:scale-110 shadow-2xl ${
                    isBasicLimitReached
                      ? "bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600/50"
                      : (newMessage.trim() || selectedFiles.length > 0) &&
                        !uploading
                      ? "bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white hover:shadow-amber-500/50 active:scale-95 border border-amber-400/50"
                      : "bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600/50"
                  }`}
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                  ) : (
                    <svg
                      className="w-7 h-7"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  )}
                  {(newMessage.trim() || selectedFiles.length > 0) &&
                    !uploading && (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity -z-10 animate-pulse"></div>
                    )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md mx-4 border border-amber-500/30 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-400"
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
              <h3 className="text-xl font-bold text-white mb-2">
                Delete Message
              </h3>
              <p className="text-slate-300 mb-6">
                Are you sure you want to delete this message? This action cannot
                be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteMessage(showDeleteConfirm)}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-200 hover:scale-105"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCallModal && (
        <CallModal
          friend={friend}
          socket={socket}
          type={callType}
          onClose={endCall}
          isCaller={isCaller}
          incomingOffer={incomingOffer}
          callDeclined={callDeclined}
        />
      )}
    </>
  );
}

export default Chat;