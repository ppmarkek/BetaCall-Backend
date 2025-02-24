import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      sparse: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },
    firstName: String,
    lastName: String,
    password: String,
    terms: Boolean,
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    appwriteId: { type: String, default: null },
    verified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpires: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(this.password, salt);
    this.password = hashed;
    return next();
  } catch (err) {
    return next(err);
  }
});

export default mongoose.model("User", userSchema);
