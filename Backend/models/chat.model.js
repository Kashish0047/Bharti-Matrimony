import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: function () {
        
        return (
          this.messageType === "text" ||
          (this.messageType === "media" &&
            (!this.mediaFiles || this.mediaFiles.length === 0))
        );
      },
      trim: true,
      default: "",
    },

    messageType: {
      type: String,
      enum: ["text", "media"],
      default: "text",
    },
    mediaFiles: [
      {
        url: {
          type: String,
          required: true,
        },
        originalName: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
  }
);


messageSchema.index({ chatId: 1, createdAt: -1 });


messageSchema.pre("validate", function (next) {
  if (this.messageType === "media") {
    if (!this.mediaFiles || this.mediaFiles.length === 0) {
      if (!this.content || this.content.trim() === "") {
        return next(
          new Error("Media message must have either content or media files")
        );
      }
    }
  } else if (this.messageType === "text") {
    if (!this.content || this.content.trim() === "") {
      return next(new Error("Text message must have content"));
    }
  }
  next();
});

export default mongoose.model("Message", messageSchema);
