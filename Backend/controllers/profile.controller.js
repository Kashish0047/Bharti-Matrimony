import Profile from "../models/profile.model.js";
import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import authMiddleware from "../middleware/auth.middleware.js";

const createProfile = async (req, res, next) => {
  try {
    console.log("📦 Request body:", req.body);
    console.log("📁 Request files:", req.files); 
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const existingProfile = await Profile.findOne({ userId });

    if (existingProfile) {
      return res.status(400).json({
        message: "Profile already exists",
      });
    }

    const subscription = await Payment.findOne({
      userId,
    });

    if (!subscription) {
      return res.status(400).json({
        message: "Please purchase a subscription to create profile",
      });
    }

    if (subscription.planStatus !== "Active") {
      return res.status(400).json({
        message:
          "Your subscription is not active. Please renew to create profile",
      });
    }

    const {
      name,
      dob,
      birthPlace,
      gender,
      timeOfBirth,
      height,
      weight,
      complexion,
      religion,
      education,
      occupation,
      monthlyIncome,
      caste,
      manglik,
      fatherName,
      motherName,
      siblings,
      hobbies,
      preferences,
    } = req.body;

    if (
      !name ||
      !dob ||
      !birthPlace ||
      !gender ||
      !timeOfBirth ||
      !height ||
      !weight ||
      !complexion ||
      !religion ||
      !education ||
      !occupation ||
      !monthlyIncome ||
      !caste ||
      !manglik ||
      !fatherName ||
      !motherName ||
      siblings === undefined ||
      !hobbies ||
      !preferences
    ) {
      return res.status(400).json({
        message: "Please fill all the fields",
      });
    }

  
    let profilePicUrl = null;
    if (req.files && req.files.profilePic && req.files.profilePic[0]) {
      profilePicUrl = `/uploads/profiles/${req.files.profilePic[0].filename}`;
    }

    
    let additionalPhotosUrls = [];
    if (req.files && req.files.additionalPhotos) {
      additionalPhotosUrls = req.files.additionalPhotos.map(
        (file) => `/uploads/profiles/${file.filename}`
      );

      
      if (additionalPhotosUrls.length > 3) {
        additionalPhotosUrls = additionalPhotosUrls.slice(0, 3);
      }
    }

    console.log("📸 Profile Pic URL:", profilePicUrl);
    console.log("🖼️ Additional Photos URLs:", additionalPhotosUrls);

    const newProfile = new Profile({
      userId,
      profilePic: profilePicUrl,
      additionalPhotos: additionalPhotosUrls, 
      name,
      dob,
      birthPlace,
      gender,
      timeOfBirth,
      height,
      weight,
      complexion,
      religion,
      education,
      occupation,
      monthlyIncome,
      caste,
      manglik,
      fatherName,
      motherName,
      siblings,
      hobbies,
      preferences,
    });

    await newProfile.save();

    res.status(201).json({
      message: "Profile created successfully",
      profile: newProfile,
    });
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    res.status(200).json({
      message: "Profile fetched successfully",
      profile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const updateData = req.body;

    console.log("🔄 Profile Update Request:", updateData);
    console.log("👤 User ID:", userId);
    console.log("📁 Files:", req.files); 

    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    
    const {
      name,
      age,
      dob,
      birthPlace,
      gender,
      timeOfBirth,
      height,
      weight,
      complexion,
      education,
      occupation,
      monthlyIncome,
      religion,
      caste,
      manglik,
      fatherName,
      motherName,
      siblings,
      hobbies,
      preferences,
      profilePic,
    } = updateData;


    if (name !== undefined) profile.name = name;
    if (age !== undefined) profile.age = age;
    if (dob !== undefined) profile.dob = dob;
    if (birthPlace !== undefined) profile.birthPlace = birthPlace;
    if (gender !== undefined) profile.gender = gender;
    if (timeOfBirth !== undefined) profile.timeOfBirth = timeOfBirth;
    if (height !== undefined) profile.height = height;
    if (weight !== undefined) profile.weight = weight;
    if (complexion !== undefined) profile.complexion = complexion;
    if (religion !== undefined) profile.religion = religion;
    if (caste !== undefined) profile.caste = caste;
    if (manglik !== undefined) profile.manglik = manglik;
    if (monthlyIncome !== undefined) profile.monthlyIncome = monthlyIncome;
    if (fatherName !== undefined) profile.fatherName = fatherName;
    if (motherName !== undefined) profile.motherName = motherName;
    if (siblings !== undefined) profile.siblings = siblings;
    if (preferences !== undefined) profile.preferences = preferences;
    if (profilePic !== undefined) profile.profilePic = profilePic;

    
    if (education !== undefined) {
      console.log("📚 Processing education:", education, typeof education);

      if (typeof education === "string") {
        profile.education = education;
      } else if (typeof education === "object" && education !== null) {
        profile.education =
          education.degree || education.title || JSON.stringify(education);
      }
    }

      
    if (occupation !== undefined) {
      console.log("💼 Processing occupation:", occupation, typeof occupation);

      if (typeof occupation === "string") {
        profile.occupation = occupation;
      } else if (typeof occupation === "object" && occupation !== null) {
        profile.occupation =
          occupation.title || occupation.name || JSON.stringify(occupation);
      }
    }

      
    if (hobbies !== undefined) {
      console.log("🎯 Processing hobbies:", hobbies, typeof hobbies);

      if (Array.isArray(hobbies)) {
        profile.hobbies = hobbies.filter((h) => h && h.trim());
      } else if (typeof hobbies === "string") {
        profile.hobbies = hobbies
          .split(",")
          .map((h) => h.trim())
          .filter((h) => h);
      }
    }

      
    if (req.files && req.files.profilePic && req.files.profilePic[0]) {
      profile.profilePic = `/uploads/profiles/${req.files.profilePic[0].filename}`;
    }

    
    if (req.files && req.files.additionalPhotos) {
      const newAdditionalPhotos = req.files.additionalPhotos.map(
        (file) => `/uploads/profiles/${file.filename}`
      );

        
      const existingPhotos = profile.additionalPhotos || [];
      const allPhotos = [...existingPhotos, ...newAdditionalPhotos];

      if (allPhotos.length > 3) {
        profile.additionalPhotos = allPhotos.slice(0, 3);
      } else {
        profile.additionalPhotos = allPhotos;
      }

      console.log("🖼️ Updated additional photos:", profile.additionalPhotos);
    }

    console.log("💾 Saving profile with data:", {
      education: profile.education,
      occupation: profile.occupation,
      hobbies: profile.hobbies,
      monthlyIncome: profile.monthlyIncome,
      manglik: profile.manglik,
      additionalPhotos: profile.additionalPhotos,
    });

    await profile.save();

    console.log("✅ Profile updated successfully");

    
    const updatedProfile = await Profile.findOne({ userId }).populate(
      "userId",
      "name email"
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const profile = await Profile.findByIdAndDelete({ userId });

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    res.status(200).json({
      message: "Profile deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const getAllProfiles = async (req, res) => {
  try {
    const userId = req.userId;

    const subscription = await Payment.findOne({ userId });

    if (!subscription || subscription.planStatus !== "Active") {
      return res.status(400).json({
        message: "Active subscription required to view profiles",
      });
    }

    
    let {
      gender,
      religion,
      caste,
      minAge,
      maxAge,
      minHeight,
      maxHeight,
      education,
      occupation,
      monthlyIncome,
      manglik,
      page = 1,
      limit = 10,
    } = req.query;

      
    if (
      subscription.planName &&
      subscription.planName.toLowerCase() === "basic"
    ) {
      limit = 10;
    } else if (
      subscription.planName &&
      subscription.planName.toLowerCase() === "gold"
    ) {
      limit = 40;
    }

      
    const filter = {};

    if (gender) filter.gender = gender;
    if (religion) filter.religion = religion;
    if (caste) filter.caste = caste;
    if (manglik) filter.manglik = manglik;
    if (monthlyIncome) filter.monthlyIncome = new RegExp(monthlyIncome, "i");
    if (education) filter.education = new RegExp(education, "i");
    if (occupation) filter.occupation = new RegExp(occupation, "i");
    if (minHeight || maxHeight) {
      filter.height = {};
      if (minHeight) filter.height.$gte = Number(minHeight);
      if (maxHeight) filter.height.$lte = Number(maxHeight);
    }

    if (minAge || maxAge) {
      const today = new Date();
      if (maxAge) {
        const minDob = new Date(
          today.getFullYear() - maxAge,
          today.getMonth(),
          today.getDate()
        );
        filter.dob = { $gte: minDob };
      }
      if (minAge) {
        const maxDob = new Date(
          today.getFullYear() - minAge,
          today.getMonth(),
          today.getDate()
        );
        filter.dob = { ...filter.dob, $lte: maxDob };
      }
    }

    filter.userId = { $ne: userId };

    const skip = (page - 1) * limit;

    const profiles = await Profile.find(filter)
      .populate("userId", "name email")
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Profile.countDocuments(filter);

    res.status(200).json({
      message: "Profiles fetched successfully",
      success: true,
      profiles,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all profiles error:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const getProfileById = async (req, res) => {
  try {
    const userId = req.userId;
    const { profileId } = req.params;

    console.log("🔍 Fetching profile by ID:", profileId);

    const subscription = await Payment.findOne({ userId: userId });
    if (!subscription || subscription.planStatus !== "Active") {
      return res.status(400).json({
        message: "Active subscription required to view profiles",
      });
    }

    const profile = await Profile.findById(profileId).populate(
      "userId",
      "name email"
    );

    if (!profile) {
      console.log("❌ Profile not found with ID:", profileId);
      return res.status(404).json({
        message: "Profile not found",
        success: false,
      });
    }

    console.log("✅ Profile found:", profile.name);

    res.status(200).json({
      message: "Profile fetched successfully",
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Get profile by ID error:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const uploadProfilePic = async (req, res) => {
  try {
    const userId = req.userId;

    console.log("📤 Profile pic upload request");
    console.log("👤 User ID:", userId);
    console.log("📁 File:", req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const profilePicUrl = `/uploads/profiles/${req.file.filename}`;

    console.log("🖼️ Profile pic URL:", profilePicUrl);

      
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { profilePic: profilePicUrl },
      { new: true }
    ).populate("userId", "name email");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    console.log("✅ Profile pic updated successfully");

    res.json({
      success: true,
      message: "Profile picture uploaded successfully",
      profilePicUrl: profilePicUrl,
      profile: profile,
    });
  } catch (error) {
    console.error("❌ Profile pic upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload profile picture",
      error: error.message,
    });
  }
};


const uploadAdditionalPhotos = async (req, res) => {
  try {
    const userId = req.userId;

    console.log("📤 Additional photos upload request");
    console.log("👤 User ID:", userId);
    console.log("📁 req.files:", req.files);
    console.log("📁 req.files type:", Array.isArray(req.files));

   
    let uploadedFiles = [];
    
    if (req.files) {
      
      if (Array.isArray(req.files)) {
        uploadedFiles = req.files;
        console.log("✅ Files received as array");
      }
      
      else if (req.files.additionalPhotos) {
        uploadedFiles = req.files.additionalPhotos;
        console.log("✅ Files received as object with additionalPhotos key");
      }
    }

    if (!uploadedFiles || uploadedFiles.length === 0) {
      console.log("❌ No files found in request");
      return res.status(400).json({
        success: false,
        message: "No additional photos uploaded",
      });
    }

    console.log("✅ Files count:", uploadedFiles.length);

    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

   
    const newPhotos = uploadedFiles.map(
      (file) => `/uploads/profiles/${file.filename}`
    );

    console.log("🖼️ New photo URLs:", newPhotos);

    
    const existingPhotos = profile.additionalPhotos || [];
    const allPhotos = [...existingPhotos, ...newPhotos];

   
    if (allPhotos.length > 3) {
      profile.additionalPhotos = allPhotos.slice(0, 3);
    } else {
      profile.additionalPhotos = allPhotos;
    }

    await profile.save();

    console.log("✅ Additional photos updated successfully");
    console.log("📸 Final photos:", profile.additionalPhotos);

    const updatedProfile = await Profile.findOne({ userId }).populate(
      "userId",
      "name email"
    );

    res.json({
      success: true,
      message: "Additional photos uploaded successfully",
      additionalPhotos: profile.additionalPhotos, // ✅ Return correct field
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("❌ Additional photos upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload additional photos",
      error: error.message,
    });
  }
};

  
  const deleteAdditionalPhoto = async (req, res) => {
  try {
    const userId = req.userId;
    const { photoIndex } = req.params;

    console.log("🗑️ Delete additional photo request");
    console.log("👤 User ID:", userId);
    console.log("📸 Photo Index:", photoIndex);

    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const index = parseInt(photoIndex);
    if (index < 0 || index >= profile.additionalPhotos.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid photo index",
      });
    }

      
    profile.additionalPhotos.splice(index, 1);
    await profile.save();

    console.log("✅ Additional photo deleted successfully");

    res.json({
      success: true,
      message: "Additional photo deleted successfully",
      additionalPhotos: profile.additionalPhotos,
    });
  } catch (error) {
    console.error("❌ Delete additional photo error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete additional photo",
      error: error.message,
    });
  }
};

export {
  createProfile,
  getMyProfile,
  updateProfile,
  deleteProfile,
  getAllProfiles,
  getProfileById,
  uploadProfilePic,
  uploadAdditionalPhotos, 
  deleteAdditionalPhoto, 
};
