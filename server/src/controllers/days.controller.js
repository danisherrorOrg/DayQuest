import Day from "../models/Day.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function saveDay(req, res, next) {
  try {
    const { date } = req.params;
    if (!DATE_RE.test(date)) return res.status(400).json({ error: "date must be YYYY-MM-DD" });

    const { mode, timeline, activities, moments, summary } = req.body;
    if (!["timed", "legacy", "sequence"].includes(mode)) {
      return res.status(400).json({ error: "mode must be timed, legacy, or sequence" });
    }

    const day = await Day.findOneAndUpdate(
      { user: req.userId, date },
      { mode, timeline: timeline ?? null, activities: activities ?? null, moments: moments ?? null, summary, savedAt: new Date() },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(day);
  } catch (err) {
    next(err);
  }
}

export async function listDays(req, res, next) {
  try {
    const days = await Day.find({ user: req.userId }).sort({ date: -1 });
    res.json(days);
  } catch (err) {
    next(err);
  }
}

export async function getDay(req, res, next) {
  try {
    const { date } = req.params;
    const day = await Day.findOne({ user: req.userId, date });
    if (!day) return res.status(404).json({ error: "No saved day for that date" });
    res.json(day);
  } catch (err) {
    next(err);
  }
}
