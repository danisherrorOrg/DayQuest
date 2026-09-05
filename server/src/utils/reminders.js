import User from "../models/User.js";
import Day from "../models/Day.js";
import { sendMail } from "./mailer.js";

const CLIENT_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// "Today" for this job is a single UTC calendar day — there's no per-user
// timezone stored on User, so a global UTC cutoff is the only one available
// without adding that field. A user well east or west of UTC may get
// reminded a bit early/late relative to their own midnight.
function todayUTCString(now) {
  return now.toISOString().slice(0, 10);
}

export async function sendDailyReminders(now = new Date()) {
  const date = todayUTCString(now);

  const candidates = await User.find(
    { emailVerified: true, remindersEnabled: { $ne: false } },
    "_id email",
  );
  if (candidates.length === 0) return { sent: 0 };

  const loggedUserIds = new Set(
    (await Day.find({ date }).distinct("user")).map((id) => id.toString()),
  );
  const toRemind = candidates.filter((user) => !loggedUserIds.has(user._id.toString()));

  for (const user of toRemind) {
    sendMail({
      to: user.email,
      subject: "You haven't logged today yet",
      text: `Today's still a black box on Day Story — a couple of minutes is all it takes to log what you've done so far:\n\n${CLIENT_ORIGIN}\n\nDon't want these emails? Turn them off in Settings.`,
    }).catch((err) => console.error("Failed to send reminder email", err));
  }

  return { sent: toRemind.length };
}
