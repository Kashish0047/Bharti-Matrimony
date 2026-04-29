import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  FaSearch,
  FaUserFriends,
  FaUserPlus,
  FaCrown,
  FaGem,
  FaLock,
} from "react-icons/fa";

const planPriority = (plan) => {
  if (!plan) return 3;
  switch (plan.toLowerCase()) {
    case "premium":
      return 1;
    case "gold":
      return 2;
    default:
      return 3;
  }
};

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showFriendRequestsModal, setShowFriendRequestsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    birthYear: "",
    birthPlace: "",
    education: "",
    occupation: "",
    income: "",
  });

  const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData();
      }
    };

    const handleFocus = () => {
      fetchDashboardData();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login first");
        navigate("/login");
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const results = await Promise.allSettled([
        axios.get(`${API_URL}/profiles/my-profile`, config),
        axios.get(`${API_URL}/subscriptions/my-subscription`, config),
        axios.get(`${API_URL}/profiles/all`, config),
        axios.get(`${API_URL}/friend-requests/received`, config),
        axios.get(`${API_URL}/friend-requests/sent`, config),
        axios.get(`${API_URL}/friend-requests/friends`, config),
      ]);

      const profileRes =
        results[0].status === "fulfilled" ? results[0].value : null;
      const subRes =
        results[1].status === "fulfilled" ? results[1].value : null;
      const profilesRes =
        results[2].status === "fulfilled" ? results[2].value : null;
      const receivedReqRes =
        results[3].status === "fulfilled" ? results[3].value : null;
      const sentReqRes =
        results[4].status === "fulfilled" ? results[4].value : null;
      const friendsRes =
        results[5].status === "fulfilled" ? results[5].value : null;

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`API call ${index} failed:`, result.reason);
        }
      });

      setMyProfile(profileRes?.data?.profile || null);
      setSubscription(
        subRes?.data
          ? {
              ...subRes.data.subscription,
              isActive: subRes.data.isActive,
            }
          : null
      );

      const myUserId =
        profileRes?.data?.profile?.userId?._id ||
        profileRes?.data?.profile?.userId;

      let profilesWithPlans = [];
      if (profilesRes && myUserId) {
        profilesWithPlans = await Promise.all(
          profilesRes.data.profiles?.map(async (profile) => {
            try {
              const planRes = await axios.get(
                `${API_URL}/subscriptions/user/${
                  profile.userId._id || profile.userId
                }`,
                config
              );
              return {
                ...profile,
                subscription: planRes.data.subscription,
              };
            } catch (error) {
              console.error(`API call failed:`, error);
              return {
                ...profile,
                subscription: { planName: "Basic" },
              };
            }
          }) || []
        );

        const otherProfiles = profilesWithPlans.filter((p) => {
          const profileUserId = p.userId?._id || p.userId;
          return profileUserId !== myUserId;
        });

        setProfiles(otherProfiles);
      }

      setFriendRequests(receivedReqRes?.data?.requests || []);
      setSentRequests(sentReqRes?.data?.requests || []);
      setFriends(friendsRes?.data?.friends || []);

      if (receivedReqRes?.data?.requests) {
        const newNotifications = receivedReqRes.data.requests.map((req) => ({
          id: req._id,
          message: `${req.sender.name} sent you a friend request`,
          time: getTimeAgo(req.createdAt),
          type: "friend_request",
          avatar: req.senderProfile?.profilePic,
          sender: req.sender,
        }));

        setNotifications(newNotifications);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error(error.response?.data?.message || "Failed to load dashboard");
      setLoading(false);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleSendRequest = async (receiverId) => {
    try {
      const token = localStorage.getItem("token");

      if (subscription?.planName === "Basic") {
        const today = new Date().toISOString().slice(0, 10);
        const stored = JSON.parse(
          localStorage.getItem("basicDailyRequest") || "{}"
        );
        const lastDate = stored.date;
        let count = stored.count || 0;

        if (lastDate !== today) {
          count = 0;
        }

        if (count >= 2) {
          toast.error(
            "Basic plan users can send only 2 friend requests per day."
          );
          return;
        }
      }

      const alreadySent = sentRequests.some(
        (req) => req.receiver._id === receiverId && req.status === "pending"
      );

      if (alreadySent) {
        toast.info("Request already sent!");
        return;
      }

      const response = await axios.post(
        `${API_URL}/friend-requests/send`,
        { receiverId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        if (subscription?.planName === "Basic") {
          const today = new Date().toISOString().slice(0, 10);
          const stored = JSON.parse(
            localStorage.getItem("basicDailyRequest") || "{}"
          );
          let count = stored.date === today ? stored.count || 0 : 0;
          count++;
          localStorage.setItem(
            "basicDailyRequest",
            JSON.stringify({ date: today, count })
          );
        }
        toast.success("Friend request sent!");
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error sending request:", error);
      toast.error(error.response?.data?.message || "Failed to send request");
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${API_URL}/friend-requests/accept/${requestId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("Friend request accepted!");
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error(error.response?.data?.message || "Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${API_URL}/friend-requests/reject/${requestId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.info("Friend request rejected");
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error(error.response?.data?.message || "Failed to reject request");
    }
  };

  const handleChatClick = (profileId) => {
    const myPlan = subscription?.planName;

    const friendExists = friends.some((friend) => {
      if (friend.userId) {
        const friendUserId = friend.userId._id || friend.userId;
        return friendUserId === profileId;
      }
      return friend._id === profileId;
    });

    if (!friendExists) {
      toast.error("You can only chat with friends!");
      return;
    }

    if (myPlan === "Basic") {
      const count = Number(localStorage.getItem("basicMessageCount") || "0");
      if (count >= 5) {
        toast.error(
          "You have reached your 5 message limit for Basic plan. Upgrade to continue chatting!"
        );
        setTimeout(() => navigate("/"), 2000);
        return;
      }
    }

    navigate(`/chat/${profileId}`);
  };

  const getPlanBadgeColor = (planName) => {
    switch (planName) {
      case "Basic":
        return "bg-slate-500";
      case "Gold":
        return "bg-gradient-to-r from-amber-500 to-orange-500";
      case "Premium":
        return "bg-gradient-to-r from-purple-600 to-pink-600";
      default:
        return "bg-slate-400";
    }
  };

  const isFriend = (profileUserId) => {
    const result = friends.some((friend) => {
      if (friend.userId) {
        const friendUserId = friend.userId._id || friend.userId;
        return friendUserId === profileUserId;
      }
      return friend._id === profileUserId;
    });

    return result;
  };

  const getMyProfileImage = (profile) => {

     if (!profile) return null;

  
  if (profile.profilePic) {
    return getImageUrl(profile.profilePic);
  }

  if (profile.additionalPhotos && profile.additionalPhotos.length > 0) {
    return getImageUrl(profile.additionalPhotos[0]);
  }

  return null;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;


    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    const baseURL = API_URL.replace("/api", "");

    if (imagePath.startsWith("/uploads/")) {
      return `${baseURL}${imagePath}`;
    }


    return `${baseURL}/uploads/${imagePath}`;
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData();
      }
    };

    const handleFocus = () => {
      fetchDashboardData();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const isBasicLimitReached = () => {
    if (subscription?.planName !== "Basic") return false;
    const count = Number(localStorage.getItem("basicMessageCount") || "0");
    return count >= 5;
  };

  let genderFilteredProfiles = profiles;
  if (myProfile?.gender) {
    if (myProfile.gender.toLowerCase() === "male") {
      genderFilteredProfiles = profiles.filter(
        (profile) => profile.gender && profile.gender.toLowerCase() === "female"
      );
    } else if (myProfile.gender.toLowerCase() === "female") {
      genderFilteredProfiles = profiles.filter(
        (profile) => profile.gender && profile.gender.toLowerCase() === "male"
      );
    }
  }

  const sortedProfiles = [...genderFilteredProfiles].sort((a, b) => {
    const aPlan = a.subscription?.planName || "Basic";
    const bPlan = b.subscription?.planName || "Basic";
    return planPriority(aPlan) - planPriority(bPlan);
  });

  const filteredProfiles = sortedProfiles.filter((profile) => {
    const birthYearStr = profile.dob
      ? new Date(profile.dob).getFullYear().toString()
      : "";
    const incomeStr = profile.monthlyIncome
      ? profile.monthlyIncome.toString()
      : "";

    const searchTermLower = searchTerm.trim().toLowerCase();
    const searchMatch =
      searchTermLower === "" ||
      [
        profile.name,
        profile.birthPlace,
        profile.education,
        profile.occupation,
        incomeStr,
        birthYearStr,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(searchTermLower));

    const birthYearMatch =
      !filters.birthYear || birthYearStr.includes(filters.birthYear.trim());
    const incomeMatch =
      !filters.income || incomeStr.includes(filters.income.trim());
    const birthPlaceMatch =
      !filters.birthPlace ||
      (profile.birthPlace &&
        profile.birthPlace
          .toLowerCase()
          .includes(filters.birthPlace.toLowerCase()));
    const educationMatch =
      !filters.education ||
      (profile.education &&
        profile.education
          .toLowerCase()
          .includes(filters.education.toLowerCase()));
    const occupationMatch =
      !filters.occupation ||
      (profile.occupation &&
        profile.occupation
          .toLowerCase()
          .includes(filters.occupation.toLowerCase()));

    return (
      searchMatch &&
      birthYearMatch &&
      birthPlaceMatch &&
      educationMatch &&
      occupationMatch &&
      incomeMatch
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} />
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <FaLock className="w-20 h-20 text-amber-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 via-orange-200 to-amber-300 bg-clip-text text-transparent mb-4">
              Dashboard Locked
            </h1>
            <p className="text-slate-400 text-lg mb-8">
              To unlock the dashboard and start browsing profiles, please
              purchase a subscription plan or ensure your plan is active.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition"
            >
              Purchase a Plan
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar />

      <div className="fixed top-6 right-8 z-50">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative bg-amber-500 text-white p-3 rounded-full shadow-lg hover:bg-amber-600 transition"
          title="Show Notifications"
        >
          🔔
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-xs rounded-full px-2">
              {notifications.length}
            </span>
          )}
        </button>
      </div>

      {showNotifications && (
        <div className="fixed top-20 right-8 w-80 bg-white rounded-xl shadow-2xl z-50 p-4">
          <h3 className="font-bold mb-2">Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-slate-500">No notifications</p>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n.id} className="mb-2 border-b pb-2">
                  <div className="flex items-center gap-2">
                    {n.avatar ? (
                      <img
                        src={getImageUrl(n.avatar)}
                        alt="avatar"
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <FaUserPlus className="w-6 h-6 text-amber-500" />
                    )}
                    <span>{n.message}</span>
                  </div>
                  <span className="text-xs text-slate-400">{n.time}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => setShowNotifications(false)}
            className="mt-2 px-4 py-2 bg-slate-200 rounded hover:bg-slate-300"
          >
            Close
          </button>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-0">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div
              className="flex flex-col md:flex-row gap-4 items-center justify-between
            bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900
            rounded-2xl p-6 border border-slate-700 shadow-xl"
            >
              <div className="flex items-center w-full md:w-1/2 lg:w-1/3 bg-slate-800 rounded-xl px-4 py-3 shadow">
                <FaSearch className="text-amber-400 mr-3 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent outline-none text-white w-full text-base sm:text-lg placeholder-slate-400"
                />
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 items-center w-full md:w-1/2 lg:w-2/3">
                <input
                  type="text"
                  value={filters.birthYear}
                  onChange={(e) =>
                    setFilters({ ...filters, birthYear: e.target.value })
                  }
                  placeholder="Year"
                  className="bg-slate-800 px-4 py-2 sm:py-3 rounded-xl text-white w-20 sm:w-28 shadow text-sm"
                />
                <input
                  type="text"
                  value={filters.birthPlace}
                  onChange={(e) =>
                    setFilters({ ...filters, birthPlace: e.target.value })
                  }
                  placeholder="Place"
                  className="bg-slate-800 px-4 py-2 sm:py-3 rounded-xl text-white w-24 sm:w-32 shadow text-sm"
                />
                <input
                  type="text"
                  value={filters.education}
                  onChange={(e) =>
                    setFilters({ ...filters, education: e.target.value })
                  }
                  placeholder="Edu"
                  className="bg-slate-800 px-4 py-2 sm:py-3 rounded-xl text-white w-24 sm:w-32 shadow text-sm"
                />
                <button
                  onClick={() =>
                    setFilters({
                      birthYear: "",
                      birthPlace: "",
                      education: "",
                      occupation: "",
                      income: "",
                    })
                  }
                  className="px-4 py-2 sm:py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-red-600 transition shadow"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="md:col-span-1">
              <div className="bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-slate-700 shadow-2xl md:sticky md:top-24 relative overflow-hidden group">
                {/* Decorative background blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
                
                <div className="text-center mb-8 relative z-10">
                  <div className="w-36 h-36 mx-auto rounded-[2rem] bg-gradient-to-tr from-amber-500 to-orange-500 p-1 mb-6 shadow-xl shadow-amber-500/20 rotate-3 group-hover:rotate-0 transition-all duration-300">
                    <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-slate-800 flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-all duration-300">
                      {(() => {
                        const profileImage = getMyProfileImage(myProfile);
                        return profileImage ? (
                          <img
                            src={profileImage}
                            alt={myProfile?.name || "Profile"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log("Image failed to load:", profileImage);
                              e.target.style.display = "none"
                            }}
                          />
                        ) : (
                          <FaUserFriends className="w-16 h-16 text-slate-600" />
                        );
                      })()}
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                    {myProfile?.name}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 ${getPlanBadgeColor(
                      subscription?.planName
                    )} text-white text-xs font-black uppercase tracking-widest rounded-full mb-6 shadow-lg`}
                  >
                    {subscription?.planName === "Gold" && (
                      <FaCrown className="text-yellow-300 text-sm" />
                    )}
                    {subscription?.planName === "Premium" && (
                      <FaGem className="text-pink-300 text-sm" />
                    )}
                    {subscription?.planName || "No Plan"}
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Location</p>
                      <p className="text-sm text-slate-200 font-semibold truncate" title={myProfile?.birthPlace || "N/A"}>
                        {myProfile?.birthPlace || "N/A"}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Education</p>
                      <p className="text-sm text-slate-200 font-semibold truncate" title={myProfile?.education || "N/A"}>
                        {myProfile?.education || "N/A"}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Profession</p>
                      <p className="text-sm text-slate-200 font-semibold truncate" title={myProfile?.occupation || "N/A"}>
                        {myProfile?.occupation || "N/A"}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Religion</p>
                      <p className="text-sm text-slate-200 font-semibold truncate" title={myProfile?.religion || "N/A"}>
                        {myProfile?.religion || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 relative z-10">
                  <button
                    onClick={() => navigate("/my-profile")}
                    className="w-full px-4 py-3.5 bg-white text-slate-900 font-black rounded-2xl shadow-lg hover:bg-slate-100 active:scale-95 transition-all"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full px-4 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 active:scale-95 transition-all"
                  >
                    Upgrade Plan
                  </button>
                  <button
                    onClick={() => fetchDashboardData()}
                    className="w-full px-4 py-3.5 bg-slate-800 text-slate-300 font-bold rounded-2xl border border-slate-700 hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    title="Refresh Profile Data"
                  >
                    🔄 Refresh Data
                  </button>
                </div>
                {friendRequests.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-amber-500/20">
                    <h3 className="text-white font-bold mb-4">
                      Friend Requests ({friendRequests.length})
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {friendRequests.map((req) => (
                        <div
                          key={req._id}
                          className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-3 border border-amber-500/20 shadow"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center overflow-hidden">
                              {req.senderProfile?.profilePic ? (
                                <img
                                  src={getImageUrl(
                                    req.senderProfile.profilePic
                                  )}
                                  alt={req.sender.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FaUserPlus className="text-white w-6 h-6" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="text-white text-sm font-medium block">
                                {req.sender.name}
                              </span>
                              <span className="text-slate-400 text-xs">
                                {getTimeAgo(req.createdAt)}
                              </span>
                            </div>
                          </div>
                          {req.message && (
                            <p className="text-slate-300 text-sm mb-3 p-2 bg-slate-800/50 rounded">
                              "{req.message}"
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                handleAcceptRequest(req._id);
                                setShowFriendRequestsModal(false);
                              }}
                              className="flex-1 px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => {
                                handleRejectRequest(req._id);
                                setShowFriendRequestsModal(false);
                              }}
                              className="flex-1 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {friends.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-amber-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Friends</span>
                      <span className="text-white font-bold">
                        {friends.length}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setShowFriendsModal(true)}
                  className="w-full px-4 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg transition mb-2"
                >
                  Show Friends
                </button>

                {showFriendsModal && (
                  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-96">
                      <h3 className="font-bold mb-4">My Friends</h3>
                      <ul>
                        {friends.map((f) => (
                          <li key={f._id || f.userId?._id}>
                            {f.name || f.userId?.name}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => setShowFriendsModal(false)}
                        className="mt-4 px-4 py-2 bg-slate-200 rounded hover:bg-slate-300"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-amber-200 via-orange-200 to-amber-300 bg-clip-text text-transparent mb-2">
                  Discover Matches
                </h2>
                <p className="text-slate-400 text-lg">
                  Browse profiles and connect with your perfect match
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredProfiles.length > 0 ? (
                  filteredProfiles.map((profile) => {
                    const requestSentObj = sentRequests.find(
                      (req) =>
                        req.receiver._id === profile.userId._id &&
                        req.status === "pending"
                    );
                    const requestSent = !!requestSentObj;
                    const areFriends = isFriend(profile.userId._id);
                    const friendPlan =
                      profile.subscription?.planName || "Basic";
                    return (
                      <div
                        key={profile._id}
                        className="bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-slate-700/50 hover:border-amber-500/50 shadow-2xl transition-all duration-300 group hover:-translate-y-1 flex flex-col"
                      >
                        <div className="relative h-60 bg-slate-800 overflow-hidden">
                          {profile.profilePic ? (
                            <img
                              src={getImageUrl(profile.profilePic)}
                              alt={profile.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                              <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white text-4xl font-black">
                                  {profile.name?.charAt(0).toUpperCase() || "?"}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Gradient Overlay for better text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>

                          {areFriends ? (
                            <div className="absolute top-5 right-5 bg-emerald-500/90 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg border border-emerald-400/30">
                              <FaUserFriends className="w-4 h-4 text-white" />
                              <span className="text-white text-xs font-black uppercase tracking-widest">
                                Friend
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                handleSendRequest(profile.userId._id)
                              }
                              disabled={requestSent}
                              className={`absolute top-5 right-5 w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl transition-all shadow-xl backdrop-blur-md border ${
                                requestSent
                                  ? "bg-slate-800/80 text-slate-400 border-slate-600 cursor-not-allowed"
                                  : "bg-amber-500/90 text-white border-amber-400/50 hover:bg-amber-500 hover:scale-110 active:scale-95"
                              }`}
                              title={
                                requestSent ? "Request Sent" : "Add Friend"
                              }
                            >
                              {requestSent ? "✓" : "+"}
                            </button>
                          )}
                          <div className="absolute top-5 left-5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg border border-white/10 backdrop-blur-md ${getPlanBadgeColor(
                                friendPlan
                              )}`}
                            >
                              {friendPlan === "Gold" && (
                                <FaCrown className="text-yellow-300" />
                              )}
                              {friendPlan === "Premium" && (
                                <FaGem className="text-pink-300" />
                              )}
                              {friendPlan}
                            </span>
                          </div>
                          
                          {/* Name over image */}
                          <div className="absolute bottom-5 left-5 right-5">
                            <h3 className="text-2xl font-black text-white drop-shadow-md truncate">
                              {profile.name}
                            </h3>
                          </div>
                        </div>
                        
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Location</span>
                              <span className="text-sm font-semibold text-slate-200 truncate">{profile.birthPlace || "N/A"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Education</span>
                              <span className="text-sm font-semibold text-slate-200 truncate">{profile.education || "N/A"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Profession</span>
                              <span className="text-sm font-semibold text-slate-200 truncate">{profile.occupation || "N/A"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Religion</span>
                              <span className="text-sm font-semibold text-slate-200 truncate">{profile.religion || "N/A"}</span>
                            </div>
                          </div>

                          <div className="flex gap-3 mt-auto">
                            <button
                              onClick={() =>
                                navigate(`/profile/${profile._id}`)
                              }
                              className="flex-1 px-4 py-3.5 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 border border-slate-700 active:scale-95 transition-all text-sm"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() =>
                                handleChatClick(profile.userId._id, friendPlan)
                              }
                              disabled={isBasicLimitReached()}
                              className={`flex-1 px-4 py-3.5 rounded-2xl font-bold transition-all text-sm active:scale-95 ${
                                areFriends && !isBasicLimitReached()
                                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
                                  : "bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed"
                              }`}
                              title={
                                !areFriends
                                  ? "Add friend to chat"
                                  : isBasicLimitReached()
                                  ? "Message limit reached (Basic Plan)"
                                  : "Start Chat"
                              }
                            >
                              💬 Message
                            </button>
                          </div>
                          
                          {requestSent && !areFriends && (
                            <div className="mt-4 flex flex-row items-center justify-between gap-3 bg-slate-800/30 p-3 rounded-2xl border border-slate-800">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                  Pending
                                </span>
                              </div>
                              <button
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem("token");
                                    await axios.delete(
                                      `${API_URL}/friend-requests/cancel/${requestSentObj._id}`,
                                      { headers: { Authorization: `Bearer ${token}` } }
                                    );
                                    toast.success("Request cancelled!");
                                    fetchDashboardData();
                                  } catch (error) {
                                    toast.error("Failed to cancel request");
                                  }
                                }}
                                className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-12">
                    <svg
                      className="w-16 h-16 text-slate-600 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 715.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="text-slate-400 text-lg">
                      No profiles match your search or filters
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {showFriendRequestsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h3 className="font-bold mb-4">Friend Requests</h3>
            <ul>
              {friendRequests.map((req) => (
                <li key={req._id} className="mb-2 border-b pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center overflow-hidden">
                      {req.senderProfile?.profilePic ? (
                        <img
                          src={getImageUrl(req.senderProfile.profilePic)}
                          alt={req.sender.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUserPlus className="text-white w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-black text-sm font-medium block">
                        {req.sender.name}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {getTimeAgo(req.createdAt)}
                      </span>
                    </div>
                  </div>
                  {req.message && (
                    <p className="text-slate-300 text-sm mb-3 p-2 bg-slate-800/50 rounded">
                      "{req.message}"
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(req._id)}
                      className="flex-1 px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req._id)}
                      className="flex-1 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowFriendRequestsModal(false)}
              className="mt-4 px-4 py-2 bg-slate-200 rounded hover:bg-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Dashboard;
