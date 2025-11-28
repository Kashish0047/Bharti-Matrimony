import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },

    planName:{
        type: String,
        required: [true, "Plan name is required"],
        enum: ["Basic", "Premium", "Gold"],
    },
    planPrice:{
        type: Number,
        required: true,
    },
    planDuration:{
        type:Number,
        required: true,
    },
    planStatus:{
        type: String,
        required: true,
        enum: ["Active", "Expired", "Cancelled"],
        default: "Active",
    },
    startDate:{
        type: Date,
        required: true,
        default: Date.now,
    },
    endDate:{
        type: Date,
        required: true,
    },
    paymentId:{
        type: String,
        required: true,
        unique: true,
    },
    orderId:{
        type: String,
        required: true,
    },
    amountPaid:{
        type: Number,
        required: true,
    },
    paymentStatus:{
        type: String,
        required: true,
        enum: ["Success", "Failed", "Pending"],
        default: "Pending",
    },
    paymentMethod:{
        type: String,
        required: true,
        enum: ["Credit Card", "Debit Card", "Net Banking", "UPI", "Wallet", "Razorpay"],
    },
    paymentDate:{
        type: Date,
        default: Date.now,
    },

    features:{
        canViewContacts:{
            type: Boolean,
            default: false,
        },
        canSendMessages:{
            type: Boolean,
            default: false,
        },
        profileVisibility:{
            type: String,
            enum: ["Basic", "Featured", "Premium"],
            default: "Basic",
        },
        maxContactsPerDay:{
            type: Number,
            default: 5,
        }
    },

},{timestamps:true});

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });


subscriptionSchema.methods.isActive = function () {
  return this.status === "Active" && new Date() < this.endDate;
};

subscriptionSchema.pre("save", function (next) {
  if (new Date() > this.endDate && this.status === "Active") {
    this.status = "Expired";
  }
  next();
});

subscriptionSchema.pre("save", function (next) {
  if (this.planName === "Premium") {
    this.features.canViewContacts = true;
    this.features.canSendMessages = true;
    this.features.profileVisibility = "Premium";
    this.features.maxContactsPerDay = 50;
  } else if (this.planName === "Gold") {
    this.features.canViewContacts = true;
    this.features.canSendMessages = true;
    this.features.profileVisibility = "Featured";
    this.features.maxContactsPerDay = 20;
  } else if (this.planName === "Basic") {
    this.features.canViewContacts = false;
    this.features.canSendMessages = false;
    this.features.profileVisibility = "Basic";
    this.features.maxContactsPerDay = 5;
  }
  next();
});

export default mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);