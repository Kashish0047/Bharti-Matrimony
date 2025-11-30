import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { FaLock } from "react-icons/fa"; 

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;
const baseURL = API_URL.replace("/api", "");

function MyProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const additionalPhotosInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null); 
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState("");
  const [additionalPhotosPreview, setAdditionalPhotosPreview] = useState([]);
  const [photosToDelete, setPhotosToDelete] = useState([]);

  useEffect(() => {
    fetchMyProfile();
  }, []);

  const fetchMyProfile = async () => {
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

      
      
      const [profileRes, subRes] = await Promise.all([
        axios.get(`${API_URL}/profiles/my-profile`, config),
        axios.get(`${API_URL}/subscriptions/my-subscription`, config),
      ]);

      console.log("✅ My profile response:", profileRes.data);
      console.log("✅ My subscription response:", subRes.data);

      if (profileRes.data.profile) {
        setProfile(profileRes.data.profile);
        setFormData(profileRes.data.profile);

        const profilePic = profileRes.data.profile.profilePic;
        if (profilePic) {
          const imageUrl = profilePic.startsWith("/uploads/")
            ? `${baseURL}${profilePic}`
            : profilePic;
          setProfilePicPreview(imageUrl);
          console.log("🖼️ Profile pic URL:", imageUrl);
        }

        
        const additionalPhotos = profileRes.data.profile.additionalPhotos || [];
        const additionalPhotoUrls = additionalPhotos.map((photo) =>
          photo.startsWith("/uploads/")
            ? `${baseURL}${photo}`
            : photo
        );
        setAdditionalPhotosPreview(additionalPhotoUrls);
        console.log("📸 Additional photos:", additionalPhotoUrls);
      }

      setSubscription(subRes.data.subscription); 
      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching profile or subscription:", error);
      toast.error("Failed to load profile");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(` Field changed: ${name} = ${value}`);

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      
      setFormData((prev) => ({
        ...prev,
        profilePicFile: file,
      }));

      console.log("📁 File selected:", file.name);
    }
  };

  
  const handleAdditionalPhotosChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    
    const currentPhotos = additionalPhotosPreview.length;
    const newPhotos = files.length;

    if (currentPhotos + newPhotos > 3) {
      toast.error("You can upload maximum 3 additional photos");
      return;
    }

    
    for (let file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 5MB`);
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error(`File ${file.name} is not an image`);
        return;
      }
    }

    
    const newPreviews = [];
    let filesProcessed = 0;

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews[index] = e.target.result;
        filesProcessed++;

        if (filesProcessed === files.length) {
          setAdditionalPhotosPreview((prev) => [...prev, ...newPreviews]);

          
          setFormData((prev) => ({
            ...prev,
            additionalPhotosFiles: [
              ...(prev.additionalPhotosFiles || []),
              ...files,
            ],
          }));
        }
      };
      reader.readAsDataURL(file);
    });

    console.log("📸 Additional photos selected:", files.length);
  };

  
 const removeAdditionalPhoto = (index) => {
  const photoUrl = additionalPhotosPreview[index];
  
 
  if (!photoUrl.startsWith('data:image')) {
    
    const existingPhotos = profile?.additionalPhotos || [];
    
    
    const matchingIndex = existingPhotos.findIndex(photo => {
      const fullUrl = photo.startsWith("/uploads/") 
        ? `${baseURL}${photo}` 
        : photo;
      return fullUrl === photoUrl;
    });
    
    if (matchingIndex !== -1) {
      setPhotosToDelete(prev => [...prev, existingPhotos[matchingIndex]]);
    }
  }

  
  setAdditionalPhotosPreview((prev) => prev.filter((_, i) => i !== index));

  
  setFormData((prev) => {
    const newFiles = prev.additionalPhotosFiles || [];
    
    const existingCount = (profile?.additionalPhotos || []).length;
    const fileIndex = index - existingCount;
    
    if (fileIndex >= 0 && fileIndex < newFiles.length) {
      return {
        ...prev,
        additionalPhotosFiles: newFiles.filter((_, i) => i !== fileIndex)
      };
    }
    return prev;
  });
};

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const triggerAdditionalPhotosUpload = () => {
    additionalPhotosInputRef.current?.click();
  };

  const uploadProfilePic = async (file) => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("profilePic", file);

      console.log("📤 Uploading file:", file.name);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      console.log(
        "📡 Making upload request to:",
        `${API_URL}/profiles/upload-pic`
      );
      const response = await axios.post(
        `${API_URL}/profiles/upload-pic`,
        formData,
        config
      );

      console.log(" Upload response:", response.data);

      if (response.data.success) {
        return response.data.profilePicUrl;
      }

      throw new Error(response.data.message || "Upload failed");
    } catch (error) {
      console.error(" Profile pic upload error:", error);
      if (error.response) {
        console.error(" Response data:", error.response.data);
        console.error(" Response status:", error.response.status);
      }
      throw error;
    }
  };

  
  const uploadAdditionalPhotos = async (files) => {
    try {
      if (!files || files.length === 0) return [];

      const token = localStorage.getItem("token");
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("additionalPhotos", file);
      });

      console.log("📤 Uploading additional photos:", files.length);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      const response = await axios.post(
        `${API_URL}/profiles/upload-additional`,
        formData,
        config
      );

      console.log(" Additional photos upload response:", response.data);

      if (response.data.success) {
        return response.data.additionalPhotos || [];
      }

      throw new Error(response.data.message || "Upload failed");
    } catch (error) {
      console.error(" Additional photos upload error:", error);
      throw error;
    }
  };

 const handleSave = async () => {
  try {
    setSaving(true);
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    console.log("💾 Saving profile...", formData);

    let profilePicUrl = profile?.profilePic;
    let additionalPhotoUrls = profile?.additionalPhotos || [];

   
    if (formData.profilePicFile) {
      try {
        console.log("📤 Uploading profile picture...");
        profilePicUrl = await uploadProfilePic(formData.profilePicFile);
        console.log("✅ Profile picture uploaded:", profilePicUrl);
        toast.success("Profile picture uploaded successfully!");
      } catch (error) {
        console.error("❌ Failed to upload profile picture:", error);
        toast.error("Failed to upload profile picture");
        setSaving(false);
        return;
      }
    }

    
    additionalPhotoUrls = additionalPhotoUrls.filter(
      photo => !photosToDelete.includes(photo)
    );

    
    if (
      formData.additionalPhotosFiles &&
      formData.additionalPhotosFiles.length > 0
    ) {
      try {
        console.log("📤 Uploading additional photos...");
        const newPhotoUrls = await uploadAdditionalPhotos(
          formData.additionalPhotosFiles
        );
        additionalPhotoUrls = [...additionalPhotoUrls, ...newPhotoUrls];
        toast.success("Additional photos uploaded successfully!");
      } catch (error) {
        console.error("❌ Failed to upload additional photos:", error);
        toast.error("Failed to upload additional photos");
        setSaving(false);
        return;
      }
    }

    
    const updateData = {
      name: formData.name,
      dob: formData.dob,
      birthPlace: formData.birthPlace,
      gender: formData.gender,
      timeOfBirth: formData.timeOfBirth,
      height: formData.height,
      weight: formData.weight,
      complexion: formData.complexion,
      religion: formData.religion,
      caste: formData.caste,
      manglik: formData.manglik,
      education:
        typeof formData.education === "object"
          ? formData.education?.degree || ""
          : formData.education || "",
      occupation:
        typeof formData.occupation === "object"
          ? formData.occupation?.title || ""
          : formData.occupation || "",
      monthlyIncome: formData.monthlyIncome,
      fatherName: formData.fatherName,
      motherName: formData.motherName,
      siblings: formData.siblings,
      preferences: formData.preferences,
      hobbies:
        typeof formData.hobbies === "string"
          ? formData.hobbies.split(", ").filter((h) => h.trim())
          : Array.isArray(formData.hobbies)
          ? formData.hobbies
          : [],
      profilePic: profilePicUrl,
      additionalPhotos: additionalPhotoUrls, 
    };

    console.log("📡 Sending profile update:", updateData);

    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    const response = await axios.put(
      `${API_URL}/profiles/update`,
      updateData,
      config
    );

    console.log(" Profile update response:", response.data);

    if (response.data.success) {
      setProfile(response.data.profile);
      setFormData(response.data.profile);

      
      const newProfilePic = response.data.profile.profilePic;
      if (newProfilePic) {
        const imageUrl = newProfilePic.startsWith("/uploads/")
          ? `${baseURL}${newProfilePic}`
          : newProfilePic;
        setProfilePicPreview(imageUrl);
      }

      
      const newAdditionalPhotos = response.data.profile.additionalPhotos || [];
      const newAdditionalPhotoUrls = newAdditionalPhotos.map((photo) =>
        photo.startsWith("/uploads/") ? `${baseURL}${photo}` : photo
      );
      setAdditionalPhotosPreview(newAdditionalPhotoUrls);

      
      setPhotosToDelete([]);
      setFormData(prev => ({
        ...prev,
        additionalPhotosFiles: []
      }));

      setEditing(false);
      toast.success("Profile updated successfully!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } else {
      throw new Error(response.data.message || "Update failed");
    }
  } catch (error) {
    console.error("❌ Error updating profile:", error);

    if (error.response?.status === 401) {
      toast.error("Session expired. Please login again.");
      navigate("/login");
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Failed to update profile. Please try again.");
    }
  } finally {
    setSaving(false);
  }
};



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-400 mx-auto mb-4"></div>
          <p className="text-slate-200 text-lg">Loading your profile...</p>
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent mb-4">
              Profile Locked
            </h1>
            <p className="text-slate-300 text-lg mb-8">
              To unlock your profile and start editing, please purchase a
              subscription plan.
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

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,196,0,0.04)_1px,transparent_0)] bg-[length:20px_20px]"></div>

        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -right-48 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-8">
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-2">
              My Profile
            </h1>
            <p className="text-slate-300 text-lg">
              Manage your matrimony profile information
            </p>
          </div>

          
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
            
            <div className="relative bg-gradient-to-r from-slate-900/80 to-slate-800/80 px-8 py-12 text-center border-b border-slate-700">
              
              <div className="relative inline-block mb-6">
                <div
                  className={`relative w-32 h-32 rounded-full overflow-hidden border-4 border-amber-400 shadow-2xl ${
                    editing
                      ? "cursor-pointer hover:opacity-80 transition-opacity"
                      : ""
                  }`}
                  onClick={editing ? triggerFileUpload : undefined}
                >
                  {profilePicPreview ? (
                    <img
                      src={
                        profilePicPreview.startsWith("/uploads/")
                          ? `${baseURL}${profilePicPreview}`
                          : profilePicPreview
                      }
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-4xl font-bold">
                      {profile?.name?.charAt(0).toUpperCase() ||
                        profile?.userId?.name?.charAt(0).toUpperCase() ||
                        "?"}
                    </div>
                  )}

                  
                  {editing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full">
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
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {editing && (
                  <button
                    onClick={triggerFileUpload}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-amber-500 hover:bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 hover:scale-110"
                    title="Change Profile Picture"
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
                        d="M3 9a2 2 0 002-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                )}

                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-400/20 blur-xl -z-10"></div>
              </div>

              
              <h2 className="text-3xl font-bold text-white mb-2">
                {profile?.name || profile?.userId?.name || "No Name"}
              </h2>
              <p className="text-amber-400 text-lg mb-4">
                {profile?.userId?.email || "No Email"}
              </p>

              
              <div className="flex justify-center gap-4">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-lg"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-amber-500 text-white rounded-xl font-medium hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFormData(profile);
                        setPhotosToDelete([]);
                       
                        const profilePic = profile?.profilePic;
                        if (profilePic) {
                          const imageUrl = profilePic.startsWith("/uploads/")
                            ? `${baseURL}${profilePic}`
                            : profilePic;
                          setProfilePicPreview(imageUrl);
                        } else {
                          setProfilePicPreview("");
                        }
                        
                        const additionalPhotos =
                          profile?.additionalPhotos || [];
                        const additionalPhotoUrls = additionalPhotos.map(
                          (photo) =>
                            photo.startsWith("/uploads/")
                              ? `${baseURL}${photo}`
                              : `${baseURL}/${photo}`
                        );
                        setAdditionalPhotosPreview(additionalPhotoUrls);
                      }}
                      disabled={saving}
                      className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-800 text-white rounded-xl font-medium hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-lg disabled:opacity-50"
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
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

           
            <div className="p-8">
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <svg
                    className="w-6 h-6 text-amber-400"
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
                  Photo Gallery{" "}
                  {additionalPhotosPreview.length > 0 &&
                    `(${additionalPhotosPreview.length}/3)`}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                  {additionalPhotosPreview.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-xl overflow-hidden bg-white/10 border border-white/20">
                        <img
                          src={photo}
                          alt={`Additional photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {editing && (
                        <button
                          onClick={() => removeAdditionalPhoto(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove photo"
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}

                  
                  {editing && additionalPhotosPreview.length < 3 && (
                    <button
                      onClick={triggerAdditionalPhotosUpload}
                      className="aspect-square rounded-xl bg-white/10 border-2 border-dashed border-white/30 hover:border-amber-500/50 hover:bg-white/20 transition-all duration-300 flex flex-col items-center justify-center text-white/70 hover:text-amber-300"
                    >
                      <svg
                        className="w-8 h-8 mb-2"
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
                      <span className="text-xs font-medium">Add Photo</span>
                    </button>
                  )}
                </div>

                
                <input
                  ref={additionalPhotosInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAdditionalPhotosChange}
                  className="hidden"
                />

                {editing && (
                  <p className="text-slate-400 text-sm mt-2">
                    💡 You can upload up to 3 additional photos. Each photo
                    should be less than 5MB.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <svg
                      className="w-6 h-6 text-blue-400"
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
                    Personal Information
                  </h3>

                 
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">
                      Full Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ""}
                        onChange={handleInputChange}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      />
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.name || "Not provided"}
                      </p>
                    )}
                  </div>

                  
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">
                      Date of Birth
                    </label>
                    {editing ? (
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob || ""}
                        onChange={handleInputChange}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      />
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.dob
                          ? new Date(profile.dob).toLocaleDateString()
                          : "Not provided"}
                      </p>
                    )}
                  </div>

                  
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">
                      Birth Place
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="birthPlace"
                        value={formData.birthPlace || ""}
                        onChange={handleInputChange}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      />
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.birthPlace || "Not provided"}
                      </p>
                    )}
                  </div>

                 
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">Gender</label>
                    {editing ? (
                      <select
                        name="gender"
                        value={formData.gender || ""}
                        onChange={handleInputChange}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.gender || "Not provided"}
                      </p>
                    )}
                  </div>

                  
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">
                      Time of Birth
                    </label>
                    {editing ? (
                      <input
                        type="time"
                        name="timeOfBirth"
                        value={formData.timeOfBirth || ""}
                        onChange={handleInputChange}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      />
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.timeOfBirth || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <svg
                      className="w-6 h-6 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Physical & Professional
                  </h3>

                  
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">
                      Height (cm)
                    </label>
                    {editing ? (
                      <input
                        type="number"
                        name="height"
                        value={formData.height || ""}
                        onChange={handleInputChange}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      />
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.height
                          ? `${profile.height} cm`
                          : "Not provided"}
                      </p>
                    )}
                  </div>

                  
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">
                      Weight (kg)
                    </label>
                    {editing ? (
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight || ""}
                        onChange={handleInputChange}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      />
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.weight
                          ? `${profile.weight} kg`
                          : "Not provided"}
                      </p>
                    )}
                  </div>

                  
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">
                      Complexion
                    </label>
                    {editing ? (
                      <select
                        name="complexion"
                        value={formData.complexion || ""}
                        onChange={handleInputChange}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      >
                        <option value="">Select Complexion</option>
                        <option value="Fair">Fair</option>
                        <option value="Wheatish">Wheatish</option>
                        <option value="Brown">Brown</option>
                        <option value="Dark">Dark</option>
                      </select>
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.complexion || "Not provided"}
                      </p>
                    )}
                  </div>

                  
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">
                      Education
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="education"
                        value={
                          typeof formData.education === "object"
                            ? formData.education?.degree || ""
                            : formData.education || ""
                        }
                        onChange={handleInputChange}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      />
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.education?.degree ||
                          profile?.education ||
                          "Not provided"}
                      </p>
                    )}
                  </div>

                  
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">
                      Occupation
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="occupation"
                        value={
                          typeof formData.occupation === "object"
                            ? formData.occupation?.title || ""
                            : formData.occupation || ""
                        }
                        onChange={handleInputChange}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      />
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.occupation?.title ||
                          profile?.occupation ||
                          "Not provided"}
                      </p>
                    )}
                  </div>

                  
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">
                      Monthly Income
                    </label>
                    {editing ? (
                      <select
                        name="monthlyIncome"
                        value={formData.monthlyIncome || ""}
                        onChange={handleInputChange}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      >
                        <option value="">Select Monthly Income</option>
                        <option value="Below 25,000">Below ₹25,000</option>
                        <option value="25,000 - 50,000">
                          ₹25,000 - ₹50,000
                        </option>
                        <option value="50,000 - 1,00,000">
                          ₹50,000 - ₹1,00,000
                        </option>
                        <option value="1,00,000 - 2,00,000">
                          ₹1,00,000 - ₹2,00,000
                        </option>
                        <option value="2,00,000 - 5,00,000">
                          ₹2,00,000 - ₹5,00,000
                        </option>
                        <option value="Above 5,00,000">Above ₹5,00,000</option>
                      </select>
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.monthlyIncome || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <svg
                      className="w-6 h-6 text-green-400"
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
                    Religious & Family
                  </h3>

                  
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">
                      Religion
                    </label>
                    {editing ? (
                      <select
                        name="religion"
                        value={formData.religion || ""}
                        onChange={handleInputChange}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      >
                        <option value="">Select Religion</option>
                        <option value="Hindu">Hindu</option>
                        <option value="Muslim">Muslim</option>
                        <option value="Christian">Christian</option>
                        <option value="Sikh">Sikh</option>
                        <option value="Buddhist">Buddhist</option>
                        <option value="Jain">Jain</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.religion || "Not provided"}
                      </p>
                    )}
                  </div>

                  
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">Caste</label>
                    {editing ? (
                      <input
                        type="text"
                        name="caste"
                        value={formData.caste || ""}
                        onChange={handleInputChange}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      />
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.caste || "Not provided"}
                      </p>
                    )}
                  </div>

                  
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">
                      Manglik Status
                    </label>
                    {editing ? (
                      <select
                        name="manglik"
                        value={formData.manglik || ""}
                        onChange={handleInputChange}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      >
                        <option value="">Select Manglik Status</option>
                        <option value="Manglik">Manglik</option>
                        <option value="Non-Manglik">Non-Manglik</option>
                        <option value="Anshik Manglik">Anshik Manglik</option>
                      </select>
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.manglik || "Not provided"}
                      </p>
                    )}
                  </div>

                  
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">
                      Father's Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="fatherName"
                        value={formData.fatherName || ""}
                        onChange={handleInputChange}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      />
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.fatherName || "Not provided"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">
                      Mother's Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="motherName"
                        value={formData.motherName || ""}
                        onChange={handleInputChange}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      />
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.motherName || "Not provided"}
                      </p>
                    )}
                  </div>

                  
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">
                      Number of Siblings
                    </label>
                    {editing ? (
                      <input
                        type="number"
                        name="siblings"
                        value={formData.siblings || ""}
                        onChange={handleInputChange}
                        disabled={saving}
                        min="0"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50"
                      />
                    ) : (
                      <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        {profile?.siblings || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

             
              <div className="mt-8 space-y-6">
               
                <div className="space-y-2">
                  <label className="text-slate-300 font-medium">
                    Hobbies & Interests
                  </label>
                  {editing ? (
                    <textarea
                      name="hobbies"
                      value={
                        Array.isArray(formData.hobbies)
                          ? formData.hobbies.join(", ")
                          : formData.hobbies || ""
                      }
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hobbies: e.target.value,
                        }))
                      }
                      disabled={saving}
                      rows={3}
                      placeholder="Reading, Music, Travel, Cooking, Sports (comma separated)"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/70 transition-all duration-300 disabled:opacity-50 resize-none"
                    />
                  ) : (
                    <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                      {profile?.hobbies && profile.hobbies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(profile.hobbies)
                            ? profile.hobbies
                            : profile.hobbies.split(", ")
                          ).map((hobby, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm border border-blue-500/30"
                            >
                              {hobby.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white text-lg">No hobbies listed</p>
                      )}
                    </div>
                  )}
                </div>

                
                <div className="space-y-2">
                  <label className="text-slate-300 font-medium">
                    Partner Preferences
                  </label>
                  {editing ? (
                    <textarea
                      name="preferences"
                      value={formData.preferences || ""}
                      onChange={handleInputChange}
                      disabled={saving}
                      rows={4}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/70 transition-all duration-300 resize-none disabled:opacity-50"
                      placeholder="Describe your partner preferences..."
                    />
                  ) : (
                    <p className="text-white text-lg bg-white/5 rounded-xl px-4 py-3 border border-white/10 min-h-[100px]">
                      {profile?.preferences || "No preferences mentioned"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default MyProfile;
