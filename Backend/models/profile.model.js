import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

 
    profilePic: {
      type: String,
      default: null,
    },

    
    additionalPhotos: [
      {
        type: String,
        default: [],
      },
    ],

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    dob: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    birthPlace: {
      type: String,
      required: [true, "Birth place is required"],
      trim: true,
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["Male", "Female", "Other"],
    },
    timeOfBirth: {
      type: String,
      required: [true, "Time of birth is required"],
    },

   
    height: {
      type: Number,
      required: [true, "Height is required"],
      min: [100, "Height must be at least 100 cm"],
      max: [250, "Height cannot exceed 250 cm"],
    },
    weight: {
      type: Number,
      required: [true, "Weight is required"],
      min: [30, "Weight must be at least 30 kg"],
      max: [200, "Weight cannot exceed 200 kg"],
    },
    complexion: {
      type: String,
      required: [true, "Complexion is required"],
      enum: ["Fair", "Wheatish", "Brown", "Dark"],
    },

    education: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Education is required"],
      trim: true,
    },
    occupation: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Occupation is required"],
      trim: true,
    },
    monthlyIncome: {
      type: String,
      required: [true, "Monthly income is required"],
      trim: true,
    },

    
    religion: {
      type: String,
      required: [true, "Religion is required"],
      enum: [
        "Hindu",
        "Muslim",
        "Christian",
        "Sikh",
        "Buddhist",
        "Jain",
        "Other",
      ],
    },
    caste: {
      type: String,
      required: [true, "Caste is required"],
      trim: true,
    },
    manglik: {
      type: String,
      required: [true, "Manglik status is required"],
      enum: ["Manglik", "Non-Manglik", "Anshik Manglik"],
    },

    
    fatherName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true,
    },
    motherName: {
      type: String,
      required: [true, "Mother's name is required"],
      trim: true,
    },
    siblings: {
      type: Number,
      required: [true, "Number of siblings is required"],
      min: [0, "Siblings cannot be negative"],
      default: 0,
    },

  
    hobbies: {
      type: mongoose.Schema.Types.Mixed, 
      required: [true, "Hobbies are required"],
    },

    
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      trim: true,
      maxlength: [1000, "Preferences cannot exceed 1000 characters"],
    },

    
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);


profileSchema.index({ gender: 1, isActive: 1 });
profileSchema.index({ religion: 1, caste: 1 });


profileSchema.virtual("age").get(function () {
  const today = new Date();
  const birthDate = new Date(this.dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
});

profileSchema.set("toJSON", { virtuals: true });
profileSchema.set("toObject", { virtuals: true });

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
