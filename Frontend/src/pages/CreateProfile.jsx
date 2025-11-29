import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CreateProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem("profileFormStep");
    return saved ? parseInt(saved) : 1;
  });
  const [imagePreview, setImagePreview] = useState(() => {
    return localStorage.getItem("profileImagePreview") || null;
  });

  const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

  const [additionalPhotos, setAdditionalPhotos] = useState([]);
  const [additionalPhotosPreviews, setAdditionalPhotosPreviews] = useState(
    () => {
      try {
        const saved = localStorage.getItem("additionalPhotosPreviews");
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
  );
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem("profileFormData");
      const defaultFormData = {
        profilePic: null,
        additionalPhotos: [],
        name: "",
        dob: "",
        birthPlace: "",
        gender: "",
        timeOfBirth: "",
        height: "",
        weight: "",
        complexion: "",
        education: "",
        occupation: "",
        monthlyIncome: "",
        religion: "",
        caste: "",
        manglik: "",
        hobbies: "",
        preferences: "",
        fatherName: "",
        motherName: "",
        siblings: "",
      };
      if (saved) {
        const parsedData = JSON.parse(saved);
        return {
          ...defaultFormData,
          ...parsedData,
          additionalPhotos: [],
        };
      }
      return defaultFormData;
    } catch {
      return {
        profilePic: null,
        additionalPhotos: [],
        name: "",
        dob: "",
        birthPlace: "",
        gender: "",
        timeOfBirth: "",
        height: "",
        weight: "",
        complexion: "",
        education: "",
        occupation: "",
        monthlyIncome: "",
        religion: "",
        caste: "",
        manglik: "",
        hobbies: "",
        preferences: "",
        fatherName: "",
        motherName: "",
        siblings: "",
      };
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const dataToSave = { ...formData };
    delete dataToSave.profilePic;
    delete dataToSave.additionalPhotos;
    localStorage.setItem("profileFormData", JSON.stringify(dataToSave));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem("profileFormStep", currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    if (imagePreview) {
      localStorage.setItem("profileImagePreview", imagePreview);
    }
  }, [imagePreview]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "additionalPhotosPreviews",
        JSON.stringify(additionalPhotosPreviews)
      );
    } catch {
      console.log("Error saving additionalPhotosPreviews to local storage");
    }
  }, [additionalPhotosPreviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Profile picture must be less than 5MB");
        return;
      }
      setFormData({
        ...formData,
        profilePic: file,
      });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalPhotosChange = (e) => {
    const files = Array.from(e.target.files);
    if (additionalPhotos.length + files.length > 3) {
      toast.error("You can upload maximum 3 additional photos");
      return;
    }
    if (files.length === 0) return;
    setUploadingPhotos(true);
    e.target.value = "";
    const validFiles = [];
    let processedFiles = 0;
    const newPreviews = [];
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image file`);
        processedFiles++;
        if (processedFiles === files.length && validFiles.length === 0) {
          setUploadingPhotos(false);
        }
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB`);
        processedFiles++;
        if (processedFiles === files.length && validFiles.length === 0) {
          setUploadingPhotos(false);
        }
        return;
      }
      validFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        processedFiles++;
        if (processedFiles === validFiles.length) {
          setAdditionalPhotos((prev) => [...prev, ...validFiles]);
          setAdditionalPhotosPreviews((prev) => [...prev, ...newPreviews]);
          setFormData((prev) => ({
            ...prev,
            additionalPhotos: [...prev.additionalPhotos, ...validFiles],
          }));
          setUploadingPhotos(false);
          toast.success(`${validFiles.length} photo(s) added successfully`);
        }
      };
      reader.onerror = () => {
        toast.error(`Failed to read ${file.name}`);
        processedFiles++;
        if (processedFiles === files.length) {
          setUploadingPhotos(false);
        }
      };
      reader.readAsDataURL(file);
    });
    if (validFiles.length === 0) {
      setUploadingPhotos(false);
    }
  };

  const removeAdditionalPhoto = (index) => {
    const newPhotos = additionalPhotos.filter((_, i) => i !== index);
    const newPreviews = additionalPhotosPreviews.filter((_, i) => i !== index);
    setAdditionalPhotos(newPhotos);
    setAdditionalPhotosPreviews(newPreviews);
    setFormData((prev) => ({
      ...prev,
      additionalPhotos: newPhotos,
    }));
    toast.success("Photo removed successfully");
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Name is required";
      if (!formData.dob) newErrors.dob = "Date of birth is required";
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.birthPlace.trim())
        newErrors.birthPlace = "Birth place is required";
      if (!formData.timeOfBirth)
        newErrors.timeOfBirth = "Time of birth is required";
    }
    if (step === 2) {
      if (!formData.height) newErrors.height = "Height is required";
      if (!formData.weight) newErrors.weight = "Weight is required";
      if (!formData.complexion) newErrors.complexion = "Complexion is required";
    }
    if (step === 3) {
      if (!formData.education.trim())
        newErrors.education = "Education is required";
      if (!formData.occupation.trim())
        newErrors.occupation = "Occupation is required";
      if (!formData.monthlyIncome.trim())
        newErrors.monthlyIncome = "Monthly income is required";
      if (!formData.religion) newErrors.religion = "Religion is required";
      if (!formData.caste.trim()) newErrors.caste = "Caste is required";
      if (!formData.manglik) newErrors.manglik = "Manglik status is required";
      if (!formData.hobbies.trim()) newErrors.hobbies = "Hobbies are required";
    }
    if (step === 4) {
      if (!formData.fatherName.trim())
        newErrors.fatherName = "Father's name is required";
      if (!formData.motherName.trim())
        newErrors.motherName = "Mother's name is required";
      if (!formData.siblings)
        newErrors.siblings = "Number of siblings is required";
    }
    return newErrors;
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      toast.error("Please fill all required fields");
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("dob", formData.dob);
      formDataToSend.append("birthPlace", formData.birthPlace);
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("timeOfBirth", formData.timeOfBirth);
      formDataToSend.append("height", formData.height);
      formDataToSend.append("weight", formData.weight);
      formDataToSend.append("complexion", formData.complexion);
      formDataToSend.append("religion", formData.religion);
      formDataToSend.append("education", formData.education);
      formDataToSend.append("occupation", formData.occupation);
      formDataToSend.append("monthlyIncome", formData.monthlyIncome);
      formDataToSend.append("caste", formData.caste);
      formDataToSend.append("manglik", formData.manglik);
      formDataToSend.append("hobbies", formData.hobbies);
      formDataToSend.append("fatherName", formData.fatherName);
      formDataToSend.append("motherName", formData.motherName);
      formDataToSend.append("siblings", formData.siblings);
      formDataToSend.append("preferences", formData.preferences || "");
      if (formData.profilePic && formData.profilePic instanceof File) {
        formDataToSend.append("profilePic", formData.profilePic);
      }
      additionalPhotos.forEach((photo) => {
        if (photo instanceof File) {
          formDataToSend.append("additionalPhotos", photo);
        }
      });
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to create a profile");
        return;
      }
      await axios.post(`${API_URL}/profiles/create`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 60000,
      });
      localStorage.removeItem("profileFormData");
      localStorage.removeItem("profileFormStep");
      localStorage.removeItem("profileImagePreview");
      localStorage.removeItem("additionalPhotosPreviews");
      toast.success("Profile created successfully! 🎉");
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      if (error.code === "ECONNABORTED") {
        toast.error("Upload timeout. Please try again with smaller images.");
      } else if (error.response?.status === 413) {
        toast.error("Files too large. Please reduce image sizes.");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to create profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderAdditionalPhotosSection = () => (
    <div className="bg-slate-50 rounded-2xl p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-slate-800">Additional Photos</h4>
        <span className="text-sm text-slate-600">
          {additionalPhotos.length}/3 photos
          {uploadingPhotos && (
            <span className="ml-2 text-amber-600">Processing...</span>
          )}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {additionalPhotosPreviews.map((preview, index) => (
          <div key={`preview-${index}`} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden bg-slate-200">
              <img
                src={preview}
                alt={`Additional ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => removeAdditionalPhoto(index)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
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
          </div>
        ))}
        {additionalPhotos.length < 3 && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-colors">
            {uploadingPhotos ? (
              <svg
                className="w-8 h-8 text-amber-500 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <>
                <svg
                  className="w-8 h-8 text-slate-400 mb-2"
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
                <span className="text-xs text-slate-500 text-center">
                  Add Photo
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleAdditionalPhotosChange}
              className="hidden"
              disabled={uploadingPhotos}
            />
          </label>
        )}
        {Array.from({ length: Math.max(0, 2 - additionalPhotos.length) }).map(
          (_, index) => (
            <div
              key={`empty-${index}`}
              className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center"
            >
              <span className="text-slate-400 text-xs">Empty</span>
            </div>
          )
        )}
      </div>
      <p className="text-xs text-slate-500">
        Add up to 3 additional photos to showcase yourself better. Maximum file
        size: 5MB each. Supported formats: JPG, PNG, WEBP.
      </p>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-slate-800 mb-6">
        Basic Information
      </h3>
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center overflow-hidden">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                className="w-16 h-16 text-white"
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
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-amber-500 p-2 rounded-full cursor-pointer hover:bg-amber-600 transition">
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
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-sm text-slate-600 mt-2">
          Upload your profile picture
        </p>
      </div>
      {renderAdditionalPhotosSection()}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.name
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.dob
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          />
          {errors.dob && (
            <p className="mt-1 text-xs text-red-600">{errors.dob}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.gender
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && (
            <p className="mt-1 text-xs text-red-600">{errors.gender}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Birth Place <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="birthPlace"
            value={formData.birthPlace}
            onChange={handleChange}
            placeholder="City, State"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.birthPlace
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          />
          {errors.birthPlace && (
            <p className="mt-1 text-xs text-red-600">{errors.birthPlace}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Time of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            name="timeOfBirth"
            value={formData.timeOfBirth}
            onChange={handleChange}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.timeOfBirth
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          />
          {errors.timeOfBirth && (
            <p className="mt-1 text-xs text-red-600">{errors.timeOfBirth}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-slate-800 mb-6">
        Physical Attributes
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Height (in cm) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="height"
            value={formData.height}
            onChange={handleChange}
            placeholder="e.g., 170"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.height
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          />
          {errors.height && (
            <p className="mt-1 text-xs text-red-600">{errors.height}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Weight (in kg) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            placeholder="e.g., 65"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.weight
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          />
          {errors.weight && (
            <p className="mt-1 text-xs text-red-600">{errors.weight}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Complexion <span className="text-red-500">*</span>
          </label>
          <select
            name="complexion"
            value={formData.complexion}
            onChange={handleChange}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.complexion
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          >
            <option value="">Select Complexion</option>
            <option value="Fair">Fair</option>
            <option value="Wheatish">Wheatish</option>
            <option value="Brown">Brown</option>
            <option value="Dark">Dark</option>
          </select>
          {errors.complexion && (
            <p className="mt-1 text-xs text-red-600">{errors.complexion}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-slate-800 mb-6">
        Professional & Religious Details
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Education <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="education"
            value={formData.education}
            onChange={handleChange}
            placeholder="e.g., B.Tech, MBA"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.education
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          />
          {errors.education && (
            <p className="mt-1 text-xs text-red-600">{errors.education}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Occupation <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            placeholder="e.g., Software Engineer"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.occupation
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          />
          {errors.occupation && (
            <p className="mt-1 text-xs text-red-600">{errors.occupation}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Monthly Income <span className="text-red-500">*</span>
          </label>
          <select
            name="monthlyIncome"
            value={formData.monthlyIncome}
            onChange={handleChange}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.monthlyIncome
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          >
            <option value="">Select Monthly Income</option>
            <option value="Below 25,000">Below ₹25,000</option>
            <option value="25,000 - 50,000">₹25,000 - ₹50,000</option>
            <option value="50,000 - 1,00,000">₹50,000 - ₹1,00,000</option>
            <option value="1,00,000 - 2,00,000">₹1,00,000 - ₹2,00,000</option>
            <option value="2,00,000 - 5,00,000">₹2,00,000 - ₹5,00,000</option>
            <option value="Above 5,00,000">Above ₹5,00,000</option>
          </select>
          {errors.monthlyIncome && (
            <p className="mt-1 text-xs text-red-600">{errors.monthlyIncome}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Religion <span className="text-red-500">*</span>
          </label>
          <select
            name="religion"
            value={formData.religion}
            onChange={handleChange}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.religion
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
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
          {errors.religion && (
            <p className="mt-1 text-xs text-red-600">{errors.religion}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Caste <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="caste"
            value={formData.caste}
            onChange={handleChange}
            placeholder="Enter your caste"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.caste
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          />
          {errors.caste && (
            <p className="mt-1 text-xs text-red-600">{errors.caste}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Manglik Status <span className="text-red-500">*</span>
          </label>
          <select
            name="manglik"
            value={formData.manglik}
            onChange={handleChange}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.manglik
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          >
            <option value="">Select Manglik Status</option>
            <option value="Manglik">Manglik</option>
            <option value="Non-Manglik">Non-Manglik</option>
            <option value="Anshik Manglik">Anshik Manglik</option>
          </select>
          {errors.manglik && (
            <p className="mt-1 text-xs text-red-600">{errors.manglik}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Hobbies & Interests <span className="text-red-500">*</span>
          </label>
          <textarea
            name="hobbies"
            value={formData.hobbies}
            onChange={handleChange}
            placeholder="e.g., Reading, Music, Travel, Cooking, Sports (comma separated)"
            rows="3"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.hobbies
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          />
          {errors.hobbies && (
            <p className="mt-1 text-xs text-red-600">{errors.hobbies}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-slate-800 mb-6">Family Details</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Father's Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="fatherName"
            value={formData.fatherName}
            onChange={handleChange}
            placeholder="Enter father's name"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.fatherName
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          />
          {errors.fatherName && (
            <p className="mt-1 text-xs text-red-600">{errors.fatherName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Mother's Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="motherName"
            value={formData.motherName}
            onChange={handleChange}
            placeholder="Enter mother's name"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.motherName
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          />
          {errors.motherName && (
            <p className="mt-1 text-xs text-red-600">{errors.motherName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Number of Siblings <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="siblings"
            value={formData.siblings}
            onChange={handleChange}
            placeholder="e.g., 2"
            min="0"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition ${
              errors.siblings
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-200 focus:ring-amber-500"
            }`}
          />
          {errors.siblings && (
            <p className="mt-1 text-xs text-red-600">{errors.siblings}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Partner Preferences
          </label>
          <textarea
            name="preferences"
            value={formData.preferences}
            onChange={handleChange}
            placeholder="Describe your partner preferences..."
            rows="4"
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-3">
              Create Your Profile
            </h1>
            <p className="text-slate-400">
              Complete your profile to find your perfect match
            </p>
          </div>
          <div className="mb-8">
            <div className="flex items-center mb-2">
              {[1, 2, 3, 4].map((step) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                        currentStep >= step
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {step}
                    </div>
                  </div>
                  {step < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded transition-all ${
                        currentStep > step
                          ? "bg-gradient-to-r from-amber-500 to-orange-500"
                          : "bg-slate-700"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span className="w-10 text-center">Basic Info</span>
              <span className="flex-1 text-center">Physical</span>
              <span className="flex-1 text-center">Professional</span>
              <span className="w-10 text-center">Family</span>
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <form
              onSubmit={
                currentStep === 4 ? handleSubmit : (e) => e.preventDefault()
              }
            >
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
              <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="px-8 py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition-all"
                  >
                    Previous
                  </button>
                )}
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="ml-auto px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className={`ml-auto px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl transition-all ${
                      loading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-lg hover:scale-105"
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Creating Profile...
                      </span>
                    ) : (
                      "Create Profile"
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateProfile;
