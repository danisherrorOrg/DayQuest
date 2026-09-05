import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },
    passwordHash: { type: String, required: true },
    refreshTokenHash: { type: String, select: false },
    refreshTokenExpiresAt: { type: Date, select: false },
    emailVerified: { type: Boolean, default: false },
    remindersEnabled: { type: Boolean, default: true },
    verificationTokenHash: { type: String, select: false },
    verificationTokenExpiresAt: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
