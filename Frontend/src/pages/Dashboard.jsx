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

  const API_URL = "http://localhost:5000/api";

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
    if (profile?.profilePic) {
      const url = profile.profilePic.startsWith("/uploads/")
        ? `http://localhost:5000${profile.profilePic}`
        : `http://localhost:5000/${profile.profilePic}`;
      return url;
    }

    if (profile?.additionalPhotos && profile.additionalPhotos.length > 0) {
      const url = profile.additionalPhotos[0].startsWith("/uploads/")
        ? `http://localhost:5000${profile.additionalPhotos[0]}`
        : `http://localhost:5000/${profile.additionalPhotos[0]}`;
      return url;
    }

    return null;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    if (imagePath.startsWith("/uploads/")) {
      const url = `http://localhost:5000${imagePath}`;
      return url;
    }

    if (!imagePath.startsWith("/")) {
      const url = `http://localhost:5000/uploads/${imagePath}`;
      return url;
    }

    const url = `http://localhost:5000${imagePath}`;
    return url;
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
              <div className="flex items-center w-full md:w-1/3 bg-slate-800 rounded-xl px-4 py-3 shadow">
                <FaSearch className="text-amber-400 mr-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, birth place, education, occupation, income..."
                  className="bg-transparent outline-none text-white w-full text-lg placeholder-slate-400"
                />
              </div>
              <div className="flex flex-wrap gap-3 items-center w-full md:w-2/3">
                <input
                  type="text"
                  value={filters.birthYear}
                  onChange={(e) =>
                    setFilters({ ...filters, birthYear: e.target.value })
                  }
                  placeholder="Birth Year"
                  className="bg-slate-800 px-4 py-3 rounded-xl text-white w-28 shadow"
                />
                <input
                  type="text"
                  value={filters.birthPlace}
                  onChange={(e) =>
                    setFilters({ ...filters, birthPlace: e.target.value })
                  }
                  placeholder="Birth Place"
                  className="bg-slate-800 px-4 py-3 rounded-xl text-white w-32 shadow"
                />
                <input
                  type="text"
                  value={filters.education}
                  onChange={(e) =>
                    setFilters({ ...filters, education: e.target.value })
                  }
                  placeholder="Education"
                  className="bg-slate-800 px-4 py-3 rounded-xl text-white w-32 shadow"
                />
                <input
                  type="text"
                  value={filters.occupation}
                  onChange={(e) =>
                    setFilters({ ...filters, occupation: e.target.value })
                  }
                  placeholder="Occupation"
                  className="bg-slate-800 px-4 py-3 rounded-xl text-white w-32 shadow"
                />
                <input
                  type="text"
                  value={filters.income}
                  onChange={(e) =>
                    setFilters({ ...filters, income: e.target.value })
                  }
                  placeholder="Income"
                  className="bg-slate-800 px-4 py-3 rounded-xl text-white w-24 shadow"
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
                  className="px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition shadow"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-slate-900/95 via-amber-900/20 to-orange-900/20 backdrop-blur-xl rounded-3xl p-8 border border-amber-500/30 shadow-2xl sticky top-24">
                <div className="text-center mb-8">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center overflow-hidden mb-4 shadow-lg border-4 border-amber-300/40">
                    {(() => {
                      const profileImage = getMyProfileImage(myProfile);
                      return profileImage ? (
                        <img
                          src={profileImage}
                          alt={myProfile?.name}
                          className="w-full h-full object-cover"
                          style={{ borderRadius: "50%" }}
                        />
                      ) : (
                        <FaUserFriends className="w-16 h-16 text-white opacity-80" />
                      );
                    })()}
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-orange-200 to-amber-300 bg-clip-text text-transparent mb-2">
                    {myProfile?.name}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 ${getPlanBadgeColor(
                      subscription?.planName
                    )} text-white text-sm font-bold rounded-full mb-4 shadow`}
                  >
                    {subscription?.planName === "Gold" && (
                      <FaCrown className="text-yellow-300" />
                    )}
                    {subscription?.planName === "Premium" && (
                      <FaGem className="text-pink-300" />
                    )}
                    {subscription?.planName || "No Plan"}
                  </span>
                  <div className="space-y-2 text-left text-sm text-slate-300 mt-4">
                    <p className="flex items-center gap-2">
                      📍 {myProfile?.birthPlace || "Location N/A"}
                    </p>
                    <p className="flex items-center gap-2">
                      🎓 {myProfile?.education || "Education N/A"}
                    </p>
                    <p className="flex items-center gap-2">
                      💼 {myProfile?.occupation || "Occupation N/A"}
                    </p>
                    <p className="flex items-center gap-2">
                      🕉️ {myProfile?.religion || "Religion N/A"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/my-profile")}
                  className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition mb-2"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition mb-2"
                >
                  Upgrade Plan
                </button>
                <button
                  onClick={() => fetchDashboardData()}
                  className="w-full px-4 py-3 bg-blue-600/20 text-blue-300 font-semibold rounded-xl hover:bg-blue-600/30 transition mb-2"
                  title="Refresh Profile Data"
                >
                  🔄 Refresh
                </button>
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
                        className="bg-gradient-to-br from-slate-900/90 via-amber-900/10 to-orange-900/10 rounded-3xl overflow-hidden border border-amber-500/20 hover:border-amber-500/50 shadow-2xl transition group"
                      >
                        <div className="relative h-64 bg-gradient-to-br from-slate-700 to-slate-800">
                          {profile.profilePic ? (
                            <img
                              src={getImageUrl(profile.profilePic)}
                              alt={profile.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-3xl font-bold">
                                  {profile.name?.charAt(0).toUpperCase() || "?"}
                                </span>
                              </div>
                            </div>
                          )}
                          {areFriends ? (
                            <div className="absolute top-4 right-4 bg-emerald-500 px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                              <FaUserFriends className="w-4 h-4 text-white" />
                              <span className="text-white text-xs font-bold">
                                Friends
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                handleSendRequest(profile.userId._id)
                              }
                              disabled={requestSent}
                              className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition shadow-lg ${
                                requestSent
                                  ? "bg-slate-600 text-white cursor-not-allowed"
                                  : "bg-amber-500 text-white hover:bg-amber-600 hover:scale-110"
                              }`}
                              title={
                                requestSent ? "Request Sent" : "Add Friend"
                              }
                            >
                              {requestSent ? "✓" : "+"}
                            </button>
                          )}
                          <div className="absolute top-4 left-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full shadow ${getPlanBadgeColor(
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
                        </div>
                        <div className="p-8">
                          <h3 className="text-xl font-bold bg-gradient-to-r from-amber-200 via-orange-200 to-amber-300 bg-clip-text text-transparent mb-3">
                            {profile.name}
                          </h3>
                          <div className="space-y-2 text-sm text-slate-300 mb-4">
                            <p className="flex items-center gap-2">
                              📍 {profile.birthPlace || "Location N/A"}
                            </p>
                            <p className="flex items-center gap-2">
                              🎓 {profile.education || "Education N/A"}
                            </p>
                            <p className="flex items-center gap-2">
                              💼 {profile.occupation || "Occupation N/A"}
                            </p>
                            <p className="flex items-center gap-2">
                              🕉️ {profile.religion || "Religion N/A"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                navigate(`/profile/${profile._id}`)
                              }
                              className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() =>
                                handleChatClick(profile.userId._id, friendPlan)
                              }
                              disabled={isBasicLimitReached()}
                              className={`px-4 py-3 rounded-xl font-semibold transition relative ${
                                areFriends && !isBasicLimitReached()
                                  ? "bg-white/10 text-white hover:bg-white/20"
                                  : "bg-white/5 text-slate-500 cursor-not-allowed"
                              }`}
                              title={
                                !areFriends
                                  ? "Add friend to chat"
                                  : isBasicLimitReached()
                                  ? "You have reached your 5 message limit for Basic plan. Upgrade to continue chatting!"
                                  : "Start Chat"
                              }
                            >
                              💬 Chat
                            </button>
                          </div>
                          {requestSent && !areFriends && (
                            <div className="mt-3 flex flex-row items-center justify-center gap-3">
                              <div className="px-3 py-2 bg-slate-500/20 border border-slate-500/50 rounded-lg text-center">
                                <p className="text-slate-400 text-sm font-semibold">
                                  ⏳ Request Pending
                                </p>
                              </div>
                              <button
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem("token");
                                    await axios.delete(
                                      `${API_URL}/friend-requests/cancel/${requestSentObj._id}`,
                                      {
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      }
                                    );
                                    toast.success("Friend request cancelled!");
                                    fetchDashboardData();
                                  } catch (error) {
                                    console.error(
                                      "Error cancelling request:",
                                      error
                                    );
                                    toast.error("Failed to cancel request");
                                  }
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
                              >
                                Cancel Request
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
