import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function ProfileView() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [todaySentCount, setTodaySentCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

  useEffect(() => {
    fetchProfileData();
  }, [profileId]);

  const fetchProfileData = async () => {
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

      const [profileRes, subRes, friendsRes, sentReqRes, todayCountRes] =
        await Promise.all([
          axios.get(`${API_URL}/profiles/${profileId}`, config),
          axios.get(`${API_URL}/subscriptions/my-subscription`, config),
          axios.get(`${API_URL}/friend-requests/friends`, config),
          axios.get(`${API_URL}/friend-requests/sent`, config),
          axios.get(`${API_URL}/friend-requests/today-count`, config), 
        ]);


      setProfile(profileRes.data.profile);
      setSubscription(subRes.data.subscription);

      const friends = friendsRes.data.friends || [];
      const profileUserId = profileRes.data.profile.userId._id;

     
      friends.forEach((friend) => {
        console.log(
          `Comparing: friend._id (${friend._id}) === profileUserId (${profileUserId}):`,
          friend._id === profileUserId
        );
      });
      const isAlreadyFriend = friends.some(
        (f) => f._id === profileRes.data.profile.userId._id
      );

      console.log("🤝 Is Friend?", isAlreadyFriend);

      setIsFriend(isAlreadyFriend);

      const sentRequests = sentReqRes.data.requests || [];
      const alreadySent = sentRequests.some(
        (req) =>
          req.receiver._id === profileRes.data.profile.userId._id &&
          req.status === "pending"
      );

      console.log("📤 Request Sent?", alreadySent);
      setRequestSent(alreadySent);
      setTodaySentCount(todayCountRes.data.count || 0); // <-- Track today's count

      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error(error.response?.data?.message || "Failed to load profile");
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${API_URL}/friend-requests/send`,
        { receiverId: profile.userId._id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("Friend request sent!");
        setRequestSent(true);
      }
    } catch (error) {
      console.error("Error sending request:", error);
      toast.error(error.response?.data?.message || "Failed to send request");
    }
  };

  const handleRemoveFriend = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/friend-requests/remove-friend`,
        { friendId: profile.userId._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Friend removed successfully!");
      setIsFriend(false);
      setShowRemoveConfirm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove friend");
      setShowRemoveConfirm(false);
    }
  };

  
  const isBasicLimitReached = () => {
    if (subscription?.planName !== "Basic") return false;
    const count = Number(localStorage.getItem("basicMessageCount") || "0");
    return count >= 5;
  };

  
  const isBasicRequestLimitReached = () => {
    return subscription?.planName === "Basic" && todaySentCount >= 2;
  };

  const handleChatClick = () => {
    const planName = subscription?.planName;

    if (!isFriend) {
      toast.error("You can only chat with friends!");
      return;
    }

 
    if (planName === "Basic") {
      const count = Number(localStorage.getItem("basicMessageCount") || "0");
      if (count >= 5) {
        toast.error(
          "You have reached your 5 message limit for Basic plan. Upgrade to continue chatting!"
        );
        setTimeout(() => navigate("/"), 2000);
        return;
      }
    
    }

    navigate(`/chat/${profile.userId._id}`);
  };

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "Not specified";
    return timeString;
  };

 
  const openImageModal = (imageSrc) => {
    setSelectedImage(imageSrc);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl">Profile not found</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-6">
          
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </button>

          
          <div className="bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-2xl mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-1">
                <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-700 to-slate-800">
                  {profile.profilePic ? (
                    <img
                      src={getImageUrl(profile.profilePic)}
                      alt={profile.name}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() =>
                        openImageModal(getImageUrl(profile.profilePic))
                      }
                      onError={(e) => {
                        console.log(
                          "❌ Profile pic failed to load:",
                          profile.profilePic
                        );
                        console.log(
                          "❌ Attempted URL:",
                          getImageUrl(profile.profilePic)
                        );
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-32 h-32 text-slate-600"
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
                    </div>
                  )}

                  
                  <div className="w-full h-full hidden items-center justify-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white text-5xl font-bold">
                      {profile?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  </div>

                 
                  {isFriend && (
                    <div className="absolute top-4 right-4 bg-emerald-500 px-4 py-2 rounded-full flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-white font-bold">Friends</span>
                    </div>
                  )}
                </div>
              </div>

              
              <div className="lg:col-span-2 p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                      {profile.name}
                    </h1>
                    <p className="text-slate-400 text-lg flex items-center gap-2">
                      <span className="text-2xl">💼</span>
                      {typeof profile.occupation === "object"
                        ? profile.occupation?.title ||
                          "Occupation not specified"
                        : profile.occupation || "Occupation not specified"}
                    </p>
                    <p className="text-slate-400 text-lg flex items-center gap-2 mt-1">
                      <span className="text-2xl">🎓</span>
                      {typeof profile.education === "object"
                        ? profile.education?.degree || "Education not specified"
                        : profile.education || "Education not specified"}
                    </p>
                  </div>

                  
                  <div className="flex flex-col gap-3 min-w-[200px]">
                    {!isFriend && !requestSent && (
                      <button
                        onClick={handleSendRequest}
                        disabled={isBasicRequestLimitReached()}
                        className={`px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 ${
                          isBasicRequestLimitReached()
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        title={
                          isBasicRequestLimitReached()
                            ? "You have reached your daily request limit for Basic plan."
                            : "Add Friend"
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
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add Friend
                      </button>
                    )}

                    {requestSent && !isFriend && (
                      <div className="px-6 py-3 bg-slate-600 text-white font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Request Sent
                      </div>
                    )}

                    {isFriend && (
                      <>
                        <button
                          onClick={handleChatClick}
                          disabled={isBasicLimitReached()}
                          className={`px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                            !isBasicLimitReached()
                              ? "bg-white/10 text-white hover:bg-white/20"
                              : "bg-white/5 text-slate-500 cursor-not-allowed"
                          }`}
                          title={
                            isBasicLimitReached()
                              ? "You have reached your 5 message limit for Basic plan. Upgrade to continue chatting!"
                              : "Start Chat"
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
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          Start Chat
                        </button>
                        <button
                          onClick={() => setShowRemoveConfirm(true)}
                          className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2"
                          title="Remove Friend"
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Remove Friend
                        </button>
                      </>
                    )}
                  </div>
                </div>

                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                    <p className="text-slate-400 text-sm mb-1">Age</p>
                    <p className="text-white text-2xl font-bold">
                      {calculateAge(profile.dob)} yrs
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                    <p className="text-slate-400 text-sm mb-1">Height</p>
                    <p className="text-white text-2xl font-bold">
                      {profile.height ? `${profile.height} cm` : "N/A"}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                    <p className="text-slate-400 text-sm mb-1">Weight</p>
                    <p className="text-white text-2xl font-bold">
                      {profile.weight ? `${profile.weight} kg` : "N/A"}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                    <p className="text-slate-400 text-sm mb-1">Gender</p>
                    <p className="text-white text-2xl font-bold">
                      {profile.gender || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          
          {profile.additionalPhotos && profile.additionalPhotos.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Photo Gallery ({profile.additionalPhotos.length})
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {profile.additionalPhotos.map((photo, index) => {
                  const photoUrl = getImageUrl(photo);

                  return (
                    <div
                      key={index}
                      className="relative group cursor-pointer"
                      onClick={() => openImageModal(photoUrl)}
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-white/10 border border-white/20 hover:border-amber-500/50 transition-all duration-300">
                        <img
                          src={photoUrl}
                          alt={`${profile.name} - photo ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            console.log(
                              "❌ Additional photo failed to load:",
                              photo
                            );
                            console.log("❌ Attempted URL:", photoUrl);
                            e.target.style.display = "none";
                          }}
                        />
                      </div>

                     
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-slate-400 text-sm mt-4 text-center">
                💡 Click on any photo to view in full size
              </p>
            </div>
          )}

          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-amber-500"
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
                Personal Details
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📅</span>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">Date of Birth</p>
                    <p className="text-white font-semibold">
                      {formatDate(profile.dob)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">📍</span>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">Birth Place</p>
                    <p className="text-white font-semibold">
                      {profile.birthPlace || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">🕐</span>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">Time of Birth</p>
                    <p className="text-white font-semibold">
                      {formatTime(profile.timeOfBirth)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚧️</span>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">Gender</p>
                    <p className="text-white font-semibold">
                      {profile.gender || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌈</span>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">Complexion</p>
                    <p className="text-white font-semibold">
                      {profile.complexion || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Physical & Professional
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📏</span>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">Height</p>
                    <p className="text-white font-semibold">
                      {profile.height
                        ? `${profile.height} cm`
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚖️</span>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">Weight</p>
                    <p className="text-white font-semibold">
                      {profile.weight
                        ? `${profile.weight} kg`
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎓</span>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">Education</p>
                    <p className="text-white font-semibold">
                      {typeof profile.education === "object"
                        ? profile.education?.degree || "Not specified"
                        : profile.education || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">💼</span>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">Occupation</p>
                    <p className="text-white font-semibold">
                      {typeof profile.occupation === "object"
                        ? profile.occupation?.title || "Not specified"
                        : profile.occupation || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">💰</span>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">Monthly Income</p>
                    <p className="text-white font-semibold">
                      {profile.monthlyIncome || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

           
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Religious & Cultural
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🕉️</span>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">Religion</p>
                    <p className="text-white font-semibold">
                      {profile.religion || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">👥</span>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">Caste</p>
                    <p className="text-white font-semibold">
                      {profile.caste || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔮</span>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">Manglik Status</p>
                    <p className="text-white font-semibold">
                      {profile.manglik || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Family Details
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👨</span>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">Father's Name</p>
                    <p className="text-white font-semibold">
                      {profile.fatherName || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">👩</span>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">Mother's Name</p>
                    <p className="text-white font-semibold">
                      {profile.motherName || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">👶</span>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">Siblings</p>
                    <p className="text-white font-semibold">
                      {profile.siblings !== undefined
                        ? profile.siblings
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

           
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 lg:col-span-2">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
                Hobbies & Interests
              </h2>

              <div>
                {profile.hobbies && profile.hobbies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(profile.hobbies)
                      ? profile.hobbies
                      : profile.hobbies.split(", ")
                    ).map((hobby, index) => (
                      <span
                        key={index}
                        className="px-3 py-2 bg-amber-500/20 text-amber-200 rounded-full text-sm border border-amber-500/30"
                      >
                        {hobby.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">No hobbies specified</p>
                )}
              </div>
            </div>
          </div>

          
          {profile.preferences && (
            <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Partner Preferences
              </h2>
              <p className="text-slate-300 leading-relaxed">
                {profile.preferences}
              </p>
            </div>
          )}

          
          <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Contact Information
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📧</span>
                <div className="flex-1">
                  <p className="text-slate-400 text-sm">Email</p>
                  <p className="text-white font-semibold break-all">
                    {subscription?.planName === "Basic"
                      ? "Upgrade your plan to view contact information"
                      : isFriend
                      ? profile.userId?.email || "Not specified"
                      : "Add as friend to view"}
                  </p>
                </div>
              </div>
            </div>

            {(subscription?.planName === "Basic" || !isFriend) && (
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-200 text-sm text-center">
                  🔒{" "}
                  {subscription?.planName === "Basic"
                    ? "Contact information is only available for premium users."
                    : "Add as friend to view full contact details"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Full size view"
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                console.log("❌ Modal image failed to load:", selectedImage);
                toast.error("Failed to load image");
                closeImageModal();
              }}
            />
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-xl text-center">
            <h2 className="text-xl font-bold mb-4 text-red-600">
              Remove Friend
            </h2>
            <p className="mb-6">Are you sure you want to remove this friend?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleRemoveFriend}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
              >
                Yes, Remove
              </button>
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="px-6 py-2 bg-gray-300 rounded-lg font-bold hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default ProfileView;
