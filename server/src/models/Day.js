import mongoose from "mongoose";

const timelineSegmentSchema = new mongoose.Schema(
  {
    start: Number,
    end: Number,
    key: String,
    label: String,
    emoji: String,
    color: String,
  },
  { _id: false },
);

const momentSchema = new mongoose.Schema(
  {
    text: String,
    time: { type: Number, default: null },
  },
  { _id: false },
);

const daySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    mode: { type: String, enum: ["timed", "legacy", "sequence"], required: true },
    timeline: { type: [timelineSegmentSchema], default: null },
    activities: { type: [String], default: null },
    moments: { type: [momentSchema], default: null },
    summary: String,
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

daySchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("Day", daySchema);
