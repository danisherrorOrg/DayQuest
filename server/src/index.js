import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import daysRoutes from "./routes/days.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const { MONGO_URI, JWT_SECRET, PORT = 4000, CORS_ORIGIN } = process.env;

if (!MONGO_URI) throw new Error("MONGO_URI is not set — copy server/.env.example to server/.env");
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set — copy server/.env.example to server/.env");

const app = express();
app.use(cors({ origin: CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/days", daysRoutes);

app.use(errorHandler);

connectDB(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Day Story API listening on :${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
